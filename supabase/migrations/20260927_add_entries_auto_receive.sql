-- ==============================================================================
-- POUPAGAIO FINANCE — MIGRATION: BAIXA AUTOMÁTICA DE ENTRADAS NA DATA PROGRAMADA
-- Adiciona o campo auto_receive em public.entries e cria RPCs idempotentes
-- e seguras para processamento server-side e agendamento via pg_cron.
-- ==============================================================================

-- 1. Adição segura da coluna auto_receive na tabela oficial de entradas
ALTER TABLE public.entries
ADD COLUMN IF NOT EXISTS auto_receive BOOLEAN NOT NULL DEFAULT false;

-- 2. Índice de performance parcial para consultas de baixa automática
CREATE INDEX IF NOT EXISTS idx_entries_auto_receive
ON public.entries(auto_receive, status, date)
WHERE auto_receive = true;

-- 3. Função Server-Side Autoritativa para Processamento Global (via pg_cron ou webhook)
-- Atualiza entradas vencidas ou com data de hoje respeitando fuso horário do Brasil (America/Sao_Paulo)
CREATE OR REPLACE FUNCTION public.fn_process_auto_receive_entries()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_updated_count integer := 0;
    v_today date;
BEGIN
    -- Determina a data atual no fuso horário de Brasília (UTC-3)
    v_today := (now() AT TIME ZONE 'America/Sao_Paulo')::date;

    -- Atualiza de forma idempotente todas as entradas pendentes com data <= hoje
    WITH updated AS (
        UPDATE public.entries
        SET status = 'received',
            updated_at = timezone('utc'::text, now())
        WHERE auto_receive = true
          AND status = 'pending'
          AND date <= v_today
        RETURNING id
    )
    SELECT count(*) INTO v_updated_count FROM updated;

    RETURN v_updated_count;
END;
$$;

COMMENT ON FUNCTION public.fn_process_auto_receive_entries() IS
'Efetua baixa automática em todas as entradas pendentes com auto_receive = true cuja data programada tenha chegado. Fuso: America/Sao_Paulo. Idempotente.';

-- Permissões de execução para a função global
REVOKE EXECUTE ON FUNCTION public.fn_process_auto_receive_entries() FROM public;
REVOKE EXECUTE ON FUNCTION public.fn_process_auto_receive_entries() FROM anon;
GRANT EXECUTE ON FUNCTION public.fn_process_auto_receive_entries() TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_process_auto_receive_entries() TO authenticated;

-- 4. Função Segura com Isolamento de Espaço (p_space_id) para Clientes Autenticados
-- Valida se o usuário autenticado é membro do espaço antes de processar
CREATE OR REPLACE FUNCTION public.fn_process_space_auto_receive_entries(p_space_id UUID)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_updated_count integer := 0;
    v_today date;
BEGIN
    v_user_id := auth.uid();

    -- Validação estrita de autorização no espaço
    IF v_user_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.space_members
            WHERE space_id = p_space_id
              AND user_id = v_user_id
        ) AND NOT EXISTS (
            SELECT 1 FROM public.spaces
            WHERE id = p_space_id
              AND owner_id = v_user_id
        ) THEN
            RAISE EXCEPTION 'Acesso negado: Você não é membro deste espaço financeiro.';
        END IF;
    END IF;

    -- Data atual em Brasília
    v_today := (now() AT TIME ZONE 'America/Sao_Paulo')::date;

    -- Atualização idempotente restrita ao espaço
    WITH updated AS (
        UPDATE public.entries
        SET status = 'received',
            updated_at = timezone('utc'::text, now())
        WHERE space_id = p_space_id
          AND auto_receive = true
          AND status = 'pending'
          AND date <= v_today
        RETURNING id
    )
    SELECT count(*) INTO v_updated_count FROM updated;

    RETURN v_updated_count;
END;
$$;

COMMENT ON FUNCTION public.fn_process_space_auto_receive_entries(UUID) IS
'Efetua baixa automática em entradas pendentes do espaço informado, validando permissão do usuário. Fuso: America/Sao_Paulo. Idempotente.';

GRANT EXECUTE ON FUNCTION public.fn_process_space_auto_receive_entries(UUID) TO authenticated, service_role;

-- 5. Agendamento Automático Diário via pg_cron (Opcional se extensão estiver ativa)
-- Executa diariamente às 00:01 (Horário de Brasília, correspondente a 03:01 UTC)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
    ) THEN
        -- Remove agendamento antigo se existir
        PERFORM cron.unschedule('daily-auto-receive-entries');
        -- Agenda execução diária
        PERFORM cron.schedule(
            'daily-auto-receive-entries',
            '1 3 * * *',
            'SELECT public.fn_process_auto_receive_entries();'
        );
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'pg_cron não disponível ou sem permissões de superusuário. Use o agendador nativo do Supabase Cron ou cron via HTTP.';
END;
$$;
