-- Corrige gastos fixos de competências futuras incluídos no fechamento.
-- NULL mantém a compatibilidade com despesas antigas, como no cliente.
-- Não altera snapshots existentes: reabra e feche novamente o mês afetado
-- após aplicar esta migração e conferir os lançamentos.
BEGIN;

ALTER TABLE public.fixed_expenses
    ADD COLUMN IF NOT EXISTS start_date DATE;

CREATE OR REPLACE FUNCTION public.fn_close_month(
    p_space_id UUID,
    p_billing_cycle VARCHAR(7)
)
RETURNS public.monthly_closures
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_closed_by UUID;
    v_month INT;
    v_cycle_date DATE;
    
    v_calc_income NUMERIC(12, 2) := 0.00;
    v_calc_fixed NUMERIC(12, 2) := 0.00;
    v_calc_variable NUMERIC(12, 2) := 0.00;
    v_calc_installments NUMERIC(12, 2) := 0.00;
    v_total_expenses NUMERIC(12, 2) := 0.00;
    v_final_balance NUMERIC(12, 2) := 0.00;
    
    v_result public.monthly_closures;
BEGIN
    -- 1. Validar autenticação do usuário
    v_closed_by := auth.uid();
    IF v_closed_by IS NULL THEN
        RAISE EXCEPTION 'Acesso negado: Usuário não autenticado.';
    END IF;

    -- 2. Validar formato estrito da competência (YYYY-MM)
    IF p_billing_cycle IS NULL OR p_billing_cycle !~ '^[0-9]{4}-(0[1-9]|1[0-2])$' THEN
        RAISE EXCEPTION 'Competência inválida. Formato esperado: YYYY-MM (ex: 2026-09).';
    END IF;

    -- Extrair mês numérico para despesas anuais e converter para data no dia 1
    v_month := split_part(p_billing_cycle, '-', 2)::integer;
    v_cycle_date := to_date(p_billing_cycle || '-01', 'YYYY-MM-DD');

    -- 3. Bloquear fechamento de competências futuras (Permite apenas mês atual ou anteriores)
    IF v_cycle_date > date_trunc('month', CURRENT_DATE) THEN
        RAISE EXCEPTION 'Não é permitido realizar o fechamento de competências futuras (%).', p_billing_cycle;
    END IF;

    -- 4. Validar autorização do usuário no espaço financeiro
    IF NOT EXISTS (
        SELECT 1 FROM public.space_members
        WHERE space_id = p_space_id
          AND user_id = v_closed_by
          AND role IN ('owner', 'admin', 'member')
    ) AND NOT EXISTS (
        SELECT 1 FROM public.spaces
        WHERE id = p_space_id
          AND owner_id = v_closed_by
    ) THEN
        RAISE EXCEPTION 'Acesso negado: Você não possui autorização para fechar a competência neste espaço.';
    END IF;

    -- 5. Validar prévia de fechamento duplicado (Constraint UNIQUE garante concorrência)
    IF EXISTS (
        SELECT 1 FROM public.monthly_closures
        WHERE space_id = p_space_id AND billing_cycle = p_billing_cycle
    ) THEN
        RAISE EXCEPTION 'Esta competência (%) já se encontra fechada para este espaço.', p_billing_cycle;
    END IF;

    -- 6. CÁLCULOS AUTORITATIVOS DIRETAMENTE DAS TABELAS OFICIAIS (SEM TRATAMENTO SILENCIOSO DE ERRO)

    -- A) ENTRADAS (public.entries): Soma de todas as receitas lançadas para o mês
    SELECT COALESCE(SUM(amount), 0.00)
    INTO v_calc_income
    FROM public.entries
    WHERE space_id = p_space_id
      AND to_char(date, 'YYYY-MM') = p_billing_cycle;

    -- B) GASTOS FIXOS: respeita a vigência inicial, como a prévia do mês.
    -- Nota: O fechamento utiliza a configuração de gastos fixos existente no momento em que a competência é fechada.
    -- O snapshot gravado em monthly_closures preserva esse resultado e não muda posteriormente.
    SELECT COALESCE(SUM(amount), 0.00)
    INTO v_calc_fixed
    FROM public.fixed_expenses
    WHERE space_id = p_space_id
      AND COALESCE(start_date, DATE '1970-01-01') <= v_cycle_date
      AND (recurrence = 'monthly' OR (recurrence = 'yearly' AND due_month = v_month));

    -- C) GASTOS VARIÁVEIS (public.variable_expenses): Soma de todos os gastos variáveis lançados na competência
    SELECT COALESCE(SUM(amount), 0.00)
    INTO v_calc_variable
    FROM public.variable_expenses
    WHERE space_id = p_space_id
      AND to_char(date, 'YYYY-MM') = p_billing_cycle;

    -- D) PARCELAMENTOS (public.installments): Soma das parcelas cujas datas de vencimento pertencem à competência
    SELECT COALESCE(SUM(amount), 0.00)
    INTO v_calc_installments
    FROM public.installments
    WHERE space_id = p_space_id
      AND to_char(due_date, 'YYYY-MM') = p_billing_cycle;

    -- Totais Consolidados Transacionais
    v_total_expenses := ROUND(v_calc_fixed + v_calc_variable + v_calc_installments, 2);
    v_final_balance := ROUND(v_calc_income - v_total_expenses, 2);

    -- 7. Inserção atômica do snapshot de fechamento no banco
    INSERT INTO public.monthly_closures (
        space_id,
        billing_cycle,
        total_income,
        total_fixed_expenses,
        total_variable_expenses,
        total_installments,
        total_expenses,
        final_balance,
        closed_at,
        closed_by
    )
    VALUES (
        p_space_id,
        p_billing_cycle,
        v_calc_income,
        v_calc_fixed,
        v_calc_variable,
        v_calc_installments,
        v_total_expenses,
        v_final_balance,
        now(),
        v_closed_by
    )
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$;

-- Permissões na RPC
REVOKE ALL ON FUNCTION public.fn_close_month(UUID, VARCHAR) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_close_month(UUID, VARCHAR) FROM anon;
GRANT EXECUTE ON FUNCTION public.fn_close_month(UUID, VARCHAR) TO authenticated;

COMMIT;
