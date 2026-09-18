import { supabase } from '../supabase';
import {
  Investment,
  InvestmentTransaction,
  InvestmentWithCalculations,
  InvestmentsSummary,
  InvestmentCategory,
  CreateInvestmentInput,
  UpdateInvestmentInput,
  CreateInvestmentTransactionInput,
  UpdateInvestmentTransactionInput,
} from '../../types';
import { isTableMissingError } from './profile';

export const emptyInvestmentsSummary: InvestmentsSummary = {
  netContributedTotal: 0,
  currentValueTotal: 0,
  nominalResultTotal: 0,
  activeCount: 0,
  closedCount: 0,
  archivedCount: 0,
};

export const INVESTMENT_CATEGORIES: { value: InvestmentCategory; label: string }[] = [
  { value: 'fixed_income', label: 'Renda fixa' },
  { value: 'fund', label: 'Fundo' },
  { value: 'stock', label: 'Ação' },
  { value: 'reit', label: 'FII' },
  { value: 'etf', label: 'ETF' },
  { value: 'crypto', label: 'Cripto' },
  { value: 'pension', label: 'Previdência' },
  { value: 'savings', label: 'Poupança' },
  { value: 'other', label: 'Outro' },
];

export const INVESTMENT_CATEGORY_MAP: Record<InvestmentCategory, string> = {
  fixed_income: 'Renda fixa',
  fund: 'Fundo',
  stock: 'Ação',
  reit: 'FII',
  etf: 'ETF',
  crypto: 'Cripto',
  pension: 'Previdência',
  savings: 'Poupança',
  other: 'Outro',
};

// Conversões e cálculos decimal-safe em centavos inteiros
export const toCents = (val: number): number => Math.round((val || 0) * 100);
export const fromCents = (cents: number): number => cents / 100;

export const investmentsService = {
  /**
   * Obtém os investimentos com cálculos derivados do histórico de movimentações.
   * Evita consultas N+1 buscando investimentos e movimentações em exatamente 2 queries consolidadas para o espaço.
   */
  async getInvestmentsWithCalculations(
    spaceId: string,
    options?: {
      filterStatus?: 'all' | 'active' | 'closed' | 'archived';
    }
  ): Promise<{
    investments: InvestmentWithCalculations[];
    summary: InvestmentsSummary;
    isTableMissing: boolean;
    error?: string;
  }> {
    if (!supabase) {
      return {
        investments: [],
        summary: emptyInvestmentsSummary,
        isTableMissing: false,
        error: 'Conexão Supabase não inicializada.',
      };
    }

    if (!spaceId) {
      return {
        investments: [],
        summary: emptyInvestmentsSummary,
        isTableMissing: false,
      };
    }

    try {
      // Query 1: Busca todos os investimentos do espaço
      const { data: investmentsData, error: invError } = await supabase
        .from('investments')
        .select('*')
        .eq('space_id', spaceId)
        .order('created_at', { ascending: false });

      if (invError) {
        if (isTableMissingError(invError)) {
          return {
            investments: [],
            summary: emptyInvestmentsSummary,
            isTableMissing: true,
          };
        }
        console.warn('Aviso ao buscar investimentos:', invError.message || invError);
        return {
          investments: [],
          summary: emptyInvestmentsSummary,
          isTableMissing: false,
          error: 'Erro ao carregar investimentos.',
        };
      }

      // Query 2: Busca todas as movimentações de investimento do espaço de forma agregada (Zero N+1)
      const { data: txData, error: txError } = await supabase
        .from('investment_transactions')
        .select('*')
        .eq('space_id', spaceId)
        .order('transaction_date', { ascending: false });

      if (txError && !isTableMissingError(txError)) {
        console.warn('Aviso ao buscar movimentações de investimentos:', txError.message || txError);
      }

      const allTx = (txData || []) as InvestmentTransaction[];
      const rawInvestments = (investmentsData || []) as Investment[];

      // Agrupamento das movimentações por investment_id em memória
      const txByInvestment = new Map<string, InvestmentTransaction[]>();
      for (const tx of allTx) {
        const list = txByInvestment.get(tx.investment_id) || [];
        list.push(tx);
        txByInvestment.set(tx.investment_id, list);
      }

      // Cálculo decimal-safe por posição
      let netContributedTotalCents = 0;
      let currentValueTotalCents = 0;
      let activeCount = 0;
      let closedCount = 0;
      let archivedCount = 0;

      const calculatedInvestments: InvestmentWithCalculations[] = rawInvestments.map((inv) => {
        const txs = txByInvestment.get(inv.id) || [];

        let contribCents = 0;
        let withdrawCents = 0;

        for (const t of txs) {
          const amtCents = toCents(Number(t.amount) || 0);
          if (t.type === 'contribution') {
            contribCents += amtCents;
          } else if (t.type === 'withdrawal') {
            withdrawCents += amtCents;
          }
        }

        const netContributedCents = contribCents - withdrawCents;
        const currentValCents = toCents(Number(inv.current_value) || 0);
        const nominalResultCents = currentValCents - netContributedCents;

        let nominalReturnPercentage: number | null = null;
        if (netContributedCents > 0) {
          nominalReturnPercentage = (nominalResultCents / netContributedCents) * 100;
        }

        if (inv.status === 'active') {
          activeCount++;
          netContributedTotalCents += netContributedCents;
          currentValueTotalCents += currentValCents;
        } else if (inv.status === 'closed') {
          closedCount++;
        } else if (inv.status === 'archived') {
          archivedCount++;
        }

        return {
          ...inv,
          current_value: fromCents(currentValCents),
          transactions: txs,
          totalContributions: fromCents(contribCents),
          totalWithdrawals: fromCents(withdrawCents),
          netContributed: fromCents(netContributedCents),
          nominalResult: fromCents(nominalResultCents),
          nominalReturnPercentage,
        };
      });

      const nominalResultTotalCents = currentValueTotalCents - netContributedTotalCents;

      const summary: InvestmentsSummary = {
        netContributedTotal: fromCents(netContributedTotalCents),
        currentValueTotal: fromCents(currentValueTotalCents),
        nominalResultTotal: fromCents(nominalResultTotalCents),
        activeCount,
        closedCount,
        archivedCount,
      };

      // Filtragem por status de visualização na interface se solicitado
      let filtered = calculatedInvestments;
      const statusFilter = options?.filterStatus || 'all';
      if (statusFilter !== 'all') {
        filtered = calculatedInvestments.filter((i) => i.status === statusFilter);
      }

      return {
        investments: filtered,
        summary,
        isTableMissing: false,
      };
    } catch (err) {
      console.error('Erro em getInvestmentsWithCalculations:', err);
      return {
        investments: [],
        summary: emptyInvestmentsSummary,
        isTableMissing: false,
        error: 'Erro ao processar carteira de investimentos.',
      };
    }
  },

  /**
   * Resumo para exibição simplificada no Dashboard.
   */
  async getSummary(spaceId: string): Promise<InvestmentsSummary> {
    const res = await this.getInvestmentsWithCalculations(spaceId);
    return res.summary;
  },

  /**
   * Cadastra um novo investimento (Não gera aporte automático).
   */
  async createInvestment(
    input: CreateInvestmentInput
  ): Promise<{ success: boolean; data?: Investment; error?: string }> {
    if (!supabase) return { success: false, error: 'Conexão não inicializada.' };

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) {
        return { success: false, error: 'Usuário não autenticado.' };
      }

      const { data, error } = await supabase
        .from('investments')
        .insert({
          space_id: input.space_id,
          created_by: userId,
          name: input.name.trim(),
          category: input.category,
          institution: input.institution?.trim() || null,
          ticker: input.ticker?.trim()?.toUpperCase() || null,
          current_value: input.current_value !== undefined ? Number(input.current_value) : 0,
          notes: input.notes?.trim() || null,
          status: input.status || 'active',
        })
        .select('*')
        .single();

      if (error) {
        console.error('Erro ao criar investimento:', error);
        return { success: false, error: error.message || 'Erro ao salvar investimento.' };
      }

      return { success: true, data: data as Investment };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro ao criar investimento.' };
    }
  },

  /**
   * Atualiza os dados de um investimento.
   */
  async updateInvestment(
    id: string,
    spaceId: string,
    input: UpdateInvestmentInput
  ): Promise<{ success: boolean; data?: Investment; error?: string }> {
    if (!supabase) return { success: false, error: 'Conexão não inicializada.' };

    try {
      const payload: Record<string, any> = {};
      if (input.name !== undefined) payload.name = input.name.trim();
      if (input.category !== undefined) payload.category = input.category;
      if (input.institution !== undefined) payload.institution = input.institution ? input.institution.trim() : null;
      if (input.ticker !== undefined) payload.ticker = input.ticker ? input.ticker.trim().toUpperCase() : null;
      if (input.current_value !== undefined) payload.current_value = Number(input.current_value);
      if (input.notes !== undefined) payload.notes = input.notes ? input.notes.trim() : null;
      if (input.status !== undefined) payload.status = input.status;

      const { data, error } = await supabase
        .from('investments')
        .update(payload)
        .eq('id', id)
        .eq('space_id', spaceId)
        .select('*')
        .single();

      if (error) {
        console.error('Erro ao atualizar investimento:', error);
        return { success: false, error: error.message || 'Erro ao atualizar investimento.' };
      }

      return { success: true, data: data as Investment };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro ao atualizar investimento.' };
    }
  },

  /**
   * Atualiza o valor atual (current_value) do investimento.
   * Não altera nem cria movimentações.
   */
  async updateCurrentValue(
    id: string,
    spaceId: string,
    currentValue: number
  ): Promise<{ success: boolean; data?: Investment; error?: string }> {
    if (currentValue < 0) {
      return { success: false, error: 'O valor atual não pode ser negativo.' };
    }
    return this.updateInvestment(id, spaceId, { current_value: currentValue });
  },

  /**
   * Exclui um investimento do espaço.
   * As movimentações vinculadas serão removidas por ON DELETE CASCADE.
   */
  async deleteInvestment(
    id: string,
    spaceId: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!supabase) return { success: false, error: 'Conexão não inicializada.' };

    try {
      const { error } = await supabase
        .from('investments')
        .delete()
        .eq('id', id)
        .eq('space_id', spaceId);

      if (error) {
        console.error('Erro ao excluir investimento:', error);
        return { success: false, error: error.message || 'Erro ao excluir investimento.' };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro ao excluir investimento.' };
    }
  },

  /**
   * Registra um aporte ou resgate (type: 'contribution' | 'withdrawal').
   * Não altera current_value automaticamente.
   */
  async createTransaction(
    input: CreateInvestmentTransactionInput
  ): Promise<{ success: boolean; data?: InvestmentTransaction; error?: string }> {
    if (!supabase) return { success: false, error: 'Conexão não inicializada.' };

    if (input.amount <= 0) {
      return { success: false, error: 'O valor da movimentação deve ser maior que zero.' };
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) {
        return { success: false, error: 'Usuário não autenticado.' };
      }

      const { data, error } = await supabase
        .from('investment_transactions')
        .insert({
          investment_id: input.investment_id,
          space_id: input.space_id,
          created_by: userId,
          type: input.type,
          amount: Number(input.amount),
          transaction_date: input.transaction_date,
          notes: input.notes?.trim() || null,
        })
        .select('*')
        .single();

      if (error) {
        console.error('Erro ao registrar movimentação:', error);
        return { success: false, error: error.message || 'Erro ao registrar movimentação.' };
      }

      return { success: true, data: data as InvestmentTransaction };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro ao registrar movimentação.' };
    }
  },

  /**
   * Atualiza uma movimentação de investimento existente.
   */
  async updateTransaction(
    id: string,
    spaceId: string,
    input: UpdateInvestmentTransactionInput
  ): Promise<{ success: boolean; data?: InvestmentTransaction; error?: string }> {
    if (!supabase) return { success: false, error: 'Conexão não inicializada.' };

    if (input.amount !== undefined && input.amount <= 0) {
      return { success: false, error: 'O valor da movimentação deve ser maior que zero.' };
    }

    try {
      const payload: Record<string, any> = {};
      if (input.type !== undefined) payload.type = input.type;
      if (input.amount !== undefined) payload.amount = Number(input.amount);
      if (input.transaction_date !== undefined) payload.transaction_date = input.transaction_date;
      if (input.notes !== undefined) payload.notes = input.notes ? input.notes.trim() : null;

      const { data, error } = await supabase
        .from('investment_transactions')
        .update(payload)
        .eq('id', id)
        .eq('space_id', spaceId)
        .select('*')
        .single();

      if (error) {
        console.error('Erro ao atualizar movimentação:', error);
        return { success: false, error: error.message || 'Erro ao atualizar movimentação.' };
      }

      return { success: true, data: data as InvestmentTransaction };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro ao atualizar movimentação.' };
    }
  },

  /**
   * Exclui uma movimentação.
   */
  async deleteTransaction(
    id: string,
    spaceId: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!supabase) return { success: false, error: 'Conexão não inicializada.' };

    try {
      const { error } = await supabase
        .from('investment_transactions')
        .delete()
        .eq('id', id)
        .eq('space_id', spaceId);

      if (error) {
        console.error('Erro ao excluir movimentação:', error);
        return { success: false, error: error.message || 'Erro ao excluir movimentação.' };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro ao excluir movimentação.' };
    }
  },
};
