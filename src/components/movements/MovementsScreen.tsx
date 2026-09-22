import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { entriesService } from '../../lib/services/entries';
import { checklistService, NormalizedChecklistExpense } from '../../lib/services/checklist';
import { formatCurrency, getMonthNameBR, getMonthYearLabel } from '../../lib/formatters';
import { EntryModal } from '../entries/EntryModal';
import { VariableExpenseModal } from '../variable-expenses/VariableExpenseModal';
import { FixedExpenseModal } from '../fixed-expenses/FixedExpenseModal';
import { InstallmentPurchaseModal } from '../installments/InstallmentPurchaseModal';
import { variableExpensesService } from '../../lib/services/variableExpenses';
import { fixedExpensesService } from '../../lib/services/fixedExpenses';
import { installmentsService } from '../../lib/services/installments';
import {
  Entry,
  CreateEntryInput,
  UpdateEntryInput,
  CreateVariableExpenseInput,
  UpdateVariableExpenseInput,
  CreateFixedExpenseInput,
  UpdateFixedExpenseInput,
  CreateInstallmentPurchaseInput,
  UpdateInstallmentPurchaseInput,
} from '../../types';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import {
  ArrowLeftRight,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  FileText,
  CreditCard,
  Calendar,
  Sparkles,
  DollarSign,
  AlertCircle,
  Tag,
  CalendarDays,
} from 'lucide-react';

export interface MovementsScreenProps {
  selectedYear: number;
  selectedMonth: number;
  onMonthChange: (year: number, month: number) => void;
}

export type MovementType = 'entry' | 'fixed' | 'variable' | 'installment';

export interface ConsolidatedMovement {
  id: string;
  sourceType: MovementType;
  sourceId: string;
  title: string;
  category: string;
  date: string;
  amount: number;
  isIncome: boolean;
  status: 'pending' | 'received' | 'paid';
  installmentInfo?: {
    number: number;
    total: number;
  };
  originalRecord?: any;
}

export function MovementsScreen({
  selectedYear,
  selectedMonth,
  onMonthChange,
}: MovementsScreenProps) {
  const { user, currentSpace } = useAuth();

  // Primary Data States
  const [movements, setMovements] = useState<ConsolidatedMovement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search States
  const [typeFilter, setTypeFilter] = useState<
    'all' | 'entries' | 'expenses' | 'fixed' | 'variable' | 'installment'
  >('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Creation Modal States
  const [createModalType, setCreateModalType] = useState<
    'entries' | 'variable_expenses' | 'fixed_expenses' | 'installments' | null
  >(null);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState<boolean>(false);

  // Month navigation
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      onMonthChange(selectedYear - 1, 12);
    } else {
      onMonthChange(selectedYear, selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      onMonthChange(selectedYear + 1, 1);
    } else {
      onMonthChange(selectedYear, selectedMonth + 1);
    }
  };

  // Load consolidated movements
  const loadMovementsData = useCallback(async () => {
    if (!currentSpace?.id) return;
    setIsLoading(true);
    setError(null);

    try {
      const [entriesRes, checklistRes] = await Promise.all([
        entriesService.getEntriesByMonth(currentSpace.id, selectedYear, selectedMonth),
        checklistService.getMonthlyChecklist(currentSpace.id, selectedYear, selectedMonth),
      ]);

      const consolidatedList: ConsolidatedMovement[] = [];

      // 1. Process Entries
      if (entriesRes.entries) {
        entriesRes.entries.forEach((e: Entry) => {
          consolidatedList.push({
            id: `entry_${e.id}`,
            sourceType: 'entry',
            sourceId: e.id,
            title: e.description,
            category: e.category || 'Entrada',
            date: e.date,
            amount: Number(e.amount) || 0,
            isIncome: true,
            status: e.status === 'received' ? 'received' : 'pending',
            originalRecord: e,
          });
        });
      }

      // 2. Process Expenses (Fixed, Variable, Installment)
      if (checklistRes.items) {
        checklistRes.items.forEach((item: NormalizedChecklistExpense) => {
          consolidatedList.push({
            id: item.id,
            sourceType: item.sourceType === 'installment' ? 'installment' : item.sourceType === 'fixed' ? 'fixed' : 'variable',
            sourceId: item.sourceId,
            title: item.title,
            category: item.category || (item.sourceType === 'fixed' ? 'Gasto Fixo' : item.sourceType === 'variable' ? 'Gasto Variável' : 'Parcelamento'),
            date: item.dueDate,
            amount: item.amount,
            isIncome: false,
            status: item.status === 'paid' ? 'paid' : 'pending',
            installmentInfo: item.installmentNumber && item.totalInstallments ? {
              number: item.installmentNumber,
              total: item.totalInstallments,
            } : undefined,
            originalRecord: item,
          });
        });
      }

      // Sort by date descending (most recent first)
      consolidatedList.sort((a, b) => b.date.localeCompare(a.date));

      setMovements(consolidatedList);
    } catch (err: any) {
      console.error('Erro ao carregar movimentações:', err);
      setError('Não foi possível carregar as movimentações do mês selecionado.');
    } finally {
      setIsLoading(false);
    }
  }, [currentSpace?.id, selectedYear, selectedMonth]);

  useEffect(() => {
    loadMovementsData();
  }, [loadMovementsData]);

  // Financial summary calculations
  const summary = useMemo(() => {
    let totalEntradas = 0;
    let totalDespesas = 0;

    movements.forEach((m) => {
      if (m.isIncome) {
        totalEntradas += m.amount;
      } else {
        totalDespesas += m.amount;
      }
    });

    const saldo = totalEntradas - totalDespesas;

    return {
      totalEntradas,
      totalDespesas,
      saldo,
    };
  }, [movements]);

  // Filtered movements list
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      // Type Filter
      if (typeFilter === 'entries' && !m.isIncome) return false;
      if (typeFilter === 'expenses' && m.isIncome) return false;
      if (typeFilter === 'fixed' && m.sourceType !== 'fixed') return false;
      if (typeFilter === 'variable' && m.sourceType !== 'variable') return false;
      if (typeFilter === 'installment' && m.sourceType !== 'installment') return false;

      // Status Filter
      if (statusFilter === 'pending' && (m.status === 'received' || m.status === 'paid')) return false;
      if (statusFilter === 'completed' && m.status === 'pending') return false;

      // Text Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = m.title.toLowerCase().includes(query);
        const matchCategory = m.category.toLowerCase().includes(query);
        if (!matchTitle && !matchCategory) return false;
      }

      return true;
    });
  }, [movements, typeFilter, statusFilter, searchQuery]);

  // Save handlers for creation modals
  const handleSaveEntry = async (data: CreateEntryInput | UpdateEntryInput): Promise<boolean> => {
    if (!user) return false;
    const res = await entriesService.createEntry(user.id, data as CreateEntryInput);
    if (res.error) throw new Error(res.error);
    setCreateModalType(null);
    loadMovementsData();
    return true;
  };

  const handleSaveVariableExpense = async (data: CreateVariableExpenseInput | UpdateVariableExpenseInput): Promise<boolean> => {
    if (!user) return false;
    const res = await variableExpensesService.createVariableExpense(user.id, data as CreateVariableExpenseInput);
    if (res.error) throw new Error(res.error);
    setCreateModalType(null);
    loadMovementsData();
    return true;
  };

  const handleSaveFixedExpense = async (data: CreateFixedExpenseInput | UpdateFixedExpenseInput): Promise<boolean> => {
    if (!user) return false;
    const res = await fixedExpensesService.createFixedExpense(user.id, data as CreateFixedExpenseInput);
    if (res.error) throw new Error(res.error);
    setCreateModalType(null);
    loadMovementsData();
    return true;
  };

  const handleSaveInstallment = async (input: CreateInstallmentPurchaseInput | UpdateInstallmentPurchaseInput): Promise<{ success: boolean; error?: string }> => {
    if (!user || !currentSpace?.id) return { success: false, error: 'Espaço indisponível' };
    const res = await installmentsService.createPurchase({
      ...input,
      space_id: currentSpace.id,
    } as CreateInstallmentPurchaseInput);
    if (!res.error) {
      setCreateModalType(null);
      loadMovementsData();
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  // Toggle expense status directly from movements list
  const handleToggleStatus = async (item: ConsolidatedMovement) => {
    if (!currentSpace?.id) return;
    if (item.sourceType === 'entry') {
      const currentStatus = item.status === 'received' ? 'received' : 'pending';
      await entriesService.toggleStatus(item.sourceId, currentStatus);
      loadMovementsData();
    } else if (item.originalRecord) {
      await checklistService.toggleItemPaymentStatus(item.originalRecord, currentSpace.id, selectedYear, selectedMonth);
      loadMovementsData();
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-[1280px] mx-auto px-4 sm:px-6">
      {/* HEADER & MONTH NAVIGATION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#D2DDD6] dark:border-[#28322C]">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#02402E] dark:bg-[#16A66A] text-white dark:text-[#101614]">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-display text-[#02402E] dark:text-[#78D9A6]">
                Movimentações Financeiras
              </h1>
              <p className="text-xs text-[#5E6963] dark:text-[#95A39B]">
                Central de controle e histórico de entradas e saídas.
              </p>
            </div>
          </div>
        </div>

        {/* Competência Selector */}
        <div className="flex items-center justify-between sm:justify-end gap-2 bg-white/90 dark:bg-[#1C211E]/90 p-1.5 rounded-2xl border border-[#D2DDD6] dark:border-[#28322C] shadow-2xs">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-[#5E6963] dark:text-[#95A39B] transition-colors cursor-pointer"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="px-3 text-center min-w-[140px]">
            <span className="text-xs font-bold uppercase tracking-wider text-[#02402E] dark:text-[#78D9A6] font-display">
              {getMonthYearLabel(selectedYear, selectedMonth)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-[#5E6963] dark:text-[#95A39B] transition-colors cursor-pointer"
            aria-label="Próximo mês"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* RESUMO SUPERIOR COMPACTO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Entradas */}
        <Card className="border-[#D2DDD6] dark:border-[#28322C] bg-white/90 dark:bg-[#1C211E]/90 backdrop-blur-md shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#5E6963] dark:text-[#95A39B] uppercase tracking-wider">
                Entradas
              </p>
              <h3 className="text-lg sm:text-xl font-extrabold text-[#16A66A] mt-0.5">
                {formatCurrency(summary.totalEntradas)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-[#16A66A]">
              <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
            </div>
          </CardContent>
        </Card>

        {/* Despesas */}
        <Card className="border-[#D2DDD6] dark:border-[#28322C] bg-white/90 dark:bg-[#1C211E]/90 backdrop-blur-md shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#5E6963] dark:text-[#95A39B] uppercase tracking-wider">
                Despesas
              </p>
              <h3 className="text-lg sm:text-xl font-extrabold text-[#E11D48] dark:text-rose-400 mt-0.5">
                {formatCurrency(summary.totalDespesas)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center text-[#E11D48] dark:text-rose-400">
              <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />
            </div>
          </CardContent>
        </Card>

        {/* Saldo Consolidado */}
        <Card className="border-[#D2DDD6] dark:border-[#28322C] bg-white/90 dark:bg-[#1C211E]/90 backdrop-blur-md shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#5E6963] dark:text-[#95A39B] uppercase tracking-wider">
                Saldo da Competência
              </p>
              <h3
                className={`text-lg sm:text-xl font-extrabold mt-0.5 ${
                  summary.saldo >= 0
                    ? 'text-[#02402E] dark:text-[#78D9A6]'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatCurrency(summary.saldo)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#F2B807]/20 flex items-center justify-center text-[#02402E] dark:text-[#78D9A6]">
              <DollarSign className="w-5 h-5 stroke-[2.5]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FILTROS, BUSCA E BOTAO NOVO LANÇAMENTO */}
      <div className="bg-white/90 dark:bg-[#1C211E]/90 backdrop-blur-md border border-[#D2DDD6] dark:border-[#28322C] rounded-2xl p-4 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Busca por Descrição */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5E6963] dark:text-[#95A39B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por descrição ou categoria..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#F4F7F5] dark:bg-[#161B18] border border-[#D2DDD6] dark:border-[#28322C] text-xs font-medium focus:outline-none focus:border-[#16A66A]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#5E6963] dark:text-[#95A39B]"
              >
                ×
              </button>
            )}
          </div>

          {/* Botão + Nova Movimentação */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#02402E] dark:bg-[#16A66A] text-white dark:text-[#101614] text-xs font-bold hover:bg-[#16A66A] dark:hover:bg-[#34D399] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Movimentação</span>
            </button>

            {isPlusMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-[#D2DDD6] dark:border-[#28322C] bg-white dark:bg-[#1C211E] p-2 shadow-xl z-30 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                <button
                  type="button"
                  onClick={() => {
                    setIsPlusMenuOpen(false);
                    setCreateModalType('entries');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-[#16A66A] cursor-pointer"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Nova Entrada</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsPlusMenuOpen(false);
                    setCreateModalType('variable_expenses');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-left hover:bg-[#F4F7F5] dark:hover:bg-white/5 text-[#202724] dark:text-[#F4F4F5] cursor-pointer"
                >
                  <CreditCard className="w-4 h-4 text-[#16A66A]" />
                  <span>Novo Gasto Variável</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsPlusMenuOpen(false);
                    setCreateModalType('fixed_expenses');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-left hover:bg-[#F4F7F5] dark:hover:bg-white/5 text-[#202724] dark:text-[#F4F4F5] cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-[#16A66A]" />
                  <span>Novo Gasto Fixo</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsPlusMenuOpen(false);
                    setCreateModalType('installments');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-left hover:bg-[#F4F7F5] dark:hover:bg-white/5 text-[#202724] dark:text-[#F4F4F5] cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-[#16A66A]" />
                  <span>Novo Parcelamento</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E2ECE6] dark:border-[#28322C]">
          {/* Type filters */}
          <div className="flex flex-wrap items-center gap-1 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-[#02402E] text-white dark:bg-[#78D9A6] dark:text-[#101614]'
                  : 'bg-[#F4F7F5] dark:bg-[#161B18] text-[#5E6963] dark:text-[#95A39B] hover:text-[#02402E]'
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('entries')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                typeFilter === 'entries'
                  ? 'bg-[#16A66A] text-white'
                  : 'bg-[#F4F7F5] dark:bg-[#161B18] text-[#5E6963] dark:text-[#95A39B] hover:text-[#16A66A]'
              }`}
            >
              Entradas
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('expenses')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                typeFilter === 'expenses'
                  ? 'bg-rose-600 text-white'
                  : 'bg-[#F4F7F5] dark:bg-[#161B18] text-[#5E6963] dark:text-[#95A39B] hover:text-rose-600'
              }`}
            >
              Despesas
            </button>
            <span className="h-4 w-px bg-[#D2DDD6] dark:bg-[#28322C] mx-1 hidden sm:inline" />
            <button
              type="button"
              onClick={() => setTypeFilter('fixed')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                typeFilter === 'fixed'
                  ? 'bg-[#02402E]/20 text-[#02402E] dark:text-[#78D9A6]'
                  : 'text-[#5E6963] dark:text-[#95A39B] hover:text-[#02402E]'
              }`}
            >
              Fixos
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('variable')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                typeFilter === 'variable'
                  ? 'bg-[#02402E]/20 text-[#02402E] dark:text-[#78D9A6]'
                  : 'text-[#5E6963] dark:text-[#95A39B] hover:text-[#02402E]'
              }`}
            >
              Variáveis
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('installment')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                typeFilter === 'installment'
                  ? 'bg-[#02402E]/20 text-[#02402E] dark:text-[#78D9A6]'
                  : 'text-[#5E6963] dark:text-[#95A39B] hover:text-[#02402E]'
              }`}
            >
              Parcelados
            </button>
          </div>

          {/* Status filters */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-[#02402E] text-white dark:bg-[#78D9A6] dark:text-[#101614]'
                  : 'text-[#5E6963] dark:text-[#95A39B]'
              }`}
            >
              Todos Status
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-amber-600 text-white'
                  : 'text-[#5E6963] dark:text-[#95A39B]'
              }`}
            >
              Pendentes
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                statusFilter === 'completed'
                  ? 'bg-[#16A66A] text-white'
                  : 'text-[#5E6963] dark:text-[#95A39B]'
              }`}
            >
              Pagas / Recebidas
            </button>
          </div>
        </div>
      </div>

      {/* LISTA UNIFICADA DE MOVIMENTAÇÕES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#02402E] dark:text-[#78D9A6] flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#16A66A]" />
            Movimentações do Mês ({filteredMovements.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <Skeleton key={n} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-center space-y-2">
            <AlertCircle className="w-6 h-6 text-rose-600 mx-auto" />
            <p className="text-xs font-bold text-rose-700 dark:text-rose-400">{error}</p>
          </div>
        ) : filteredMovements.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white/90 dark:bg-[#1C211E]/90 border border-[#D2DDD6] dark:border-[#28322C] text-center space-y-3">
            <ArrowLeftRight className="w-8 h-8 text-[#5E6963] dark:text-[#95A39B] mx-auto opacity-50" />
            <p className="text-xs font-bold text-[#02402E] dark:text-[#78D9A6]">
              Nenhuma movimentação encontrada com os filtros selecionados.
            </p>
            <p className="text-[11px] text-[#5E6963] dark:text-[#95A39B]">
              Tente redefinir a busca ou adicione um novo lançamento nesta competência.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMovements.map((item) => {
              const isCompleted = item.status === 'received' || item.status === 'paid';
              const formattedDate = item.date.split('-').reverse().join('/');

              return (
                <div
                  key={item.id}
                  className="bg-white/90 dark:bg-[#1C211E]/90 backdrop-blur-md border border-[#D2DDD6] dark:border-[#28322C] hover:border-[#16A66A] dark:hover:border-[#78D9A6] rounded-2xl p-3.5 sm:p-4 shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  {/* Left: Icon, Title & Badges */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        item.isIncome
                          ? 'bg-emerald-100 text-[#16A66A] dark:bg-emerald-950/50'
                          : item.sourceType === 'fixed'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'
                          : item.sourceType === 'installment'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                      }`}
                    >
                      {item.isIncome ? (
                        <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="text-xs sm:text-sm font-bold text-[#02402E] dark:text-[#78D9A6] truncate font-display">
                          {item.title}
                        </h3>

                        {item.installmentInfo && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold shrink-0">
                            {item.installmentInfo.number}/{item.installmentInfo.total}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#5E6963] dark:text-[#95A39B]">
                        <span className="font-semibold text-[#202724] dark:text-[#F4F4F5]">
                          {item.category}
                        </span>
                        <span>•</span>
                        <span>Data: {formattedDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount, Status & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E2ECE6] dark:border-[#28322C] shrink-0">
                    <div className="text-left sm:text-right">
                      <p
                        className={`text-sm sm:text-base font-extrabold font-display ${
                          item.isIncome
                            ? 'text-[#16A66A]'
                            : 'text-[#202724] dark:text-[#F4F4F5]'
                        }`}
                      >
                        {item.isIncome ? `+ ${formatCurrency(item.amount)}` : `- ${formatCurrency(item.amount)}`}
                      </p>

                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{item.isIncome ? 'Recebido' : 'Pago'}</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            <span>Pendente</span>
                          </>
                        )}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(item)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                        isCompleted
                          ? 'bg-[#F4F7F5] dark:bg-[#161B18] text-[#5E6963] dark:text-[#95A39B] hover:bg-black/5 dark:hover:bg-white/5'
                          : 'bg-[#02402E] text-white dark:bg-[#16A66A] dark:text-[#101614] hover:bg-[#16A66A]'
                      }`}
                    >
                      <span>{isCompleted ? 'Desmarcar' : 'Dar Baixa'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAIS DE CADASTRO REUTILIZADOS */}
      {currentSpace?.id && (
        <>
          <EntryModal
            isOpen={createModalType === 'entries'}
            onClose={() => setCreateModalType(null)}
            onSave={handleSaveEntry}
            spaceId={currentSpace.id}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
          />

          <VariableExpenseModal
            isOpen={createModalType === 'variable_expenses'}
            onClose={() => setCreateModalType(null)}
            onSave={handleSaveVariableExpense}
            spaceId={currentSpace.id}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
          />

          <FixedExpenseModal
            isOpen={createModalType === 'fixed_expenses'}
            onClose={() => setCreateModalType(null)}
            onSave={handleSaveFixedExpense}
            spaceId={currentSpace.id}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
          />

          <InstallmentPurchaseModal
            isOpen={createModalType === 'installments'}
            onClose={() => setCreateModalType(null)}
            onSave={handleSaveInstallment}
            spaceId={currentSpace.id}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
          />
        </>
      )}
    </div>
  );
}
