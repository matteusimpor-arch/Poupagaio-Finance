import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { entriesService } from '../../lib/services/entries';
import { checklistService, MonthlyChecklistResult, NormalizedChecklistExpense } from '../../lib/services/checklist';
import { formatCurrency, MONTH_NAMES } from '../../lib/formatters';
import { POUPAGAIO_MASCOT_URL } from '../../assets/mascot';
import { ExpensesDonutChart } from './ExpensesDonutChart';
import { MonthlyEvolutionChart, MonthlyHistoryPoint } from './MonthlyEvolutionChart';
import { ActiveTab, Entry } from '../../types';
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  ChevronRight,
  ChevronLeft,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  CreditCard,
  CalendarCheck,
  BarChart3,
  Sparkles,
  PieChart,
  Receipt,
  RotateCcw,
} from 'lucide-react';

interface DashboardHomeProps {
  onSelectTab?: (tab: ActiveTab) => void;
  onNavigateTab?: (tab: ActiveTab) => void;
}

export function DashboardHome({ onSelectTab, onNavigateTab }: DashboardHomeProps) {
  const handleNavigate = (tab: ActiveTab) => {
    if (onSelectTab) onSelectTab(tab);
    if (onNavigateTab) onNavigateTab(tab);
  };
  const { currentSpace, user, profile } = useAuth();

  const now = new Date();
  const [currentYear, setCurrentYear] = useState<number>(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(now.getMonth() + 1);

  // Financial States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [totalReceitas, setTotalReceitas] = useState<number>(0);

  const [totalFixed, setTotalFixed] = useState<number>(0);
  const [totalVariable, setTotalVariable] = useState<number>(0);
  const [totalInstallments, setTotalInstallments] = useState<number>(0);

  const [checklistData, setChecklistData] = useState<MonthlyChecklistResult | null>(null);
  const [historyData, setHistoryData] = useState<MonthlyHistoryPoint[]>([]);

  // Navigation handlers for Competency Month
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleResetToCurrentMonth = () => {
    const d = new Date();
    setCurrentYear(d.getFullYear());
    setCurrentMonth(d.getMonth() + 1);
  };

  // Load Main Data
  const loadDashboardData = useCallback(async () => {
    if (!currentSpace?.id) return;
    setIsLoading(true);

    try {
      // 1. Fetch current month's entries and checklist in parallel
      const [entriesRes, checklistRes] = await Promise.all([
        entriesService.getEntriesByMonth(currentSpace.id, currentYear, currentMonth),
        checklistService.getMonthlyChecklist(currentSpace.id, currentYear, currentMonth),
      ]);

      setEntries(entriesRes.entries || []);
      setTotalReceitas(entriesRes.summary.totalPlanned || 0);

      const items = checklistRes.items || [];
      const fixedSum = items.filter((i) => i.sourceType === 'fixed').reduce((acc, curr) => acc + (curr.amount || 0), 0);
      const varSum = items.filter((i) => i.sourceType === 'variable').reduce((acc, curr) => acc + (curr.amount || 0), 0);
      const instSum = items.filter((i) => i.sourceType === 'installment').reduce((acc, curr) => acc + (curr.amount || 0), 0);

      setTotalFixed(fixedSum);
      setTotalVariable(varSum);
      setTotalInstallments(instSum);
      setChecklistData(checklistRes);

      // 2. Fetch 6-month historical data for the combo chart
      const monthsList: { year: number; month: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        let targetM = currentMonth - i;
        let targetY = currentYear;
        while (targetM <= 0) {
          targetM += 12;
          targetY -= 1;
        }
        monthsList.push({ year: targetY, month: targetM });
      }

      const historyResults: MonthlyHistoryPoint[] = await Promise.all(
        monthsList.map(async ({ year, month }) => {
          try {
            if (year === currentYear && month === currentMonth) {
              const eSum = entriesRes.summary.totalPlanned || 0;
              const expSum = checklistRes.stats.totalAmount || fixedSum + varSum + instSum || 0;
              return {
                monthKey: `${year}-${String(month).padStart(2, '0')}`,
                shortLabel: MONTH_NAMES[month - 1].slice(0, 3),
                fullLabel: `${MONTH_NAMES[month - 1]} ${year}`,
                entries: eSum,
                expenses: expSum,
                balance: eSum - expSum,
                isCurrent: true,
              };
            }

            const [mEntries, mChecklist] = await Promise.all([
              entriesService.getEntriesByMonth(currentSpace.id, year, month),
              checklistService.getMonthlyChecklist(currentSpace.id, year, month),
            ]);

            const eSum = mEntries.summary.totalPlanned || 0;
            const expSum = mChecklist.stats.totalAmount || 0;
            return {
              monthKey: `${year}-${String(month).padStart(2, '0')}`,
              shortLabel: MONTH_NAMES[month - 1].slice(0, 3),
              fullLabel: `${MONTH_NAMES[month - 1]} ${year}`,
              entries: eSum,
              expenses: expSum,
              balance: eSum - expSum,
              isCurrent: year === currentYear && month === currentMonth,
            };
          } catch {
            return {
              monthKey: `${year}-${String(month).padStart(2, '0')}`,
              shortLabel: MONTH_NAMES[month - 1].slice(0, 3),
              fullLabel: `${MONTH_NAMES[month - 1]} ${year}`,
              entries: 0,
              expenses: 0,
              balance: 0,
              isCurrent: year === currentYear && month === currentMonth,
            };
          }
        })
      );

      setHistoryData(historyResults);
    } catch (err) {
      console.error('Erro ao carregar dados do Dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentSpace?.id, currentYear, currentMonth]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Calculations
  const totalDespesas = useMemo(() => {
    return checklistData?.stats?.totalAmount ?? (totalFixed + totalVariable + totalInstallments);
  }, [checklistData, totalFixed, totalVariable, totalInstallments]);

  const saldoConsolidado = useMemo(() => {
    return totalReceitas - totalDespesas;
  }, [totalReceitas, totalDespesas]);

  const expensesPctOfIncome = useMemo(() => {
    if (totalReceitas <= 0) return 0;
    return Math.min(999, Math.round((totalDespesas / totalReceitas) * 100));
  }, [totalReceitas, totalDespesas]);

  const fixedPct = totalDespesas > 0 ? Math.round((totalFixed / totalDespesas) * 100) : 0;
  const variablePct = totalDespesas > 0 ? Math.round((totalVariable / totalDespesas) * 100) : 0;
  const installmentsPct = totalDespesas > 0 ? Math.round((totalInstallments / totalDespesas) * 100) : 0;

  // Checklist Stats
  const paidCount = checklistData?.stats?.paidCount || 0;
  const pendingCount = checklistData?.stats?.pendingCount || 0;
  const overdueCount = checklistData?.stats?.overdueCount || 0;
  const totalItemsCount = checklistData?.stats?.totalItems || 1;

  const paidPct = Math.round((paidCount / totalItemsCount) * 100);
  const pendingPct = Math.round((pendingCount / totalItemsCount) * 100);
  const overduePct = Math.round((overdueCount / totalItemsCount) * 100);

  // Upcoming items (next due dates in current month)
  const upcomingItems = useMemo(() => {
    if (!checklistData?.items) return [];
    return checklistData.items
      .filter((item) => item.status === 'pending')
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 3);
  }, [checklistData]);

  // Calendar matrix calculation for current month
  const calendarGrid = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days: ({ day: number; isCurrentMonth: boolean; hasFixed?: boolean; hasVariable?: boolean; hasInstallment?: boolean; hasEntry?: boolean; isToday?: boolean } | null)[] = [];

    // Empty lead slots
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    const todayDate = new Date();
    const isThisYearMonth = todayDate.getFullYear() === currentYear && todayDate.getMonth() + 1 === currentMonth;

    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      
      const dayItems = checklistData?.items?.filter((item) => item.dueDate === dayStr) || [];
      const hasFixed = dayItems.some((i) => i.sourceType === 'fixed');
      const hasVariable = dayItems.some((i) => i.sourceType === 'variable');
      const hasInstallment = dayItems.some((i) => i.sourceType === 'installment');
      const hasEntry = entries.some((e) => e.date === dayStr);

      const isToday = isThisYearMonth && todayDate.getDate() === d;

      days.push({
        day: d,
        isCurrentMonth: true,
        hasFixed,
        hasVariable,
        hasInstallment,
        hasEntry,
        isToday,
      });
    }

    return days;
  }, [currentYear, currentMonth, checklistData, entries]);

  const firstName = profile?.full_name?.split(' ')[0] || user?.full_name?.split(' ')[0] || 'Mateus';
  const monthName = MONTH_NAMES[currentMonth - 1];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 pb-12 select-none animate-in fade-in duration-200">
      
      {/* ==================================================
          TOP GREEN BANNER (Olá Mateus + Navegador + Mascote)
          ================================================== */}
      <div className="w-full rounded-2xl bg-[#02402E] text-white p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm border border-[#03543D] relative overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-[#F2B807]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Left: Greeting and subtitle */}
        <div className="flex flex-col text-center sm:text-left z-10">
          <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white flex items-center justify-center sm:justify-start gap-2">
            <span>Olá, {firstName}!</span>
            <span className="inline-block animate-wave">👋</span>
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/85 font-medium mt-0.5">
            {monthName} {currentYear} • Organização hoje, tranquilidade sempre.
          </p>
        </div>

        {/* Center: Competency Month Pill Navigator */}
        <div className="flex items-center gap-1.5 bg-[#012E21] border border-[#03543D] p-1 rounded-xl shadow-inner z-10">
          <button
            type="button"
            onClick={handlePrevMonth}
            aria-label="Mês anterior"
            className="p-1.5 rounded-lg hover:bg-white/10 text-emerald-200 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleResetToCurrentMonth}
            title="Clique para voltar ao mês atual"
            className="px-3 py-1 text-xs font-bold text-white hover:text-[#F2B807] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-[#F2B807]" />
            <span>
              {monthName} {currentYear}
            </span>
          </button>

          <button
            type="button"
            onClick={handleNextMonth}
            aria-label="Próximo mês"
            className="p-1.5 rounded-lg hover:bg-white/10 text-emerald-200 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Mascot speech card */}
        <div className="hidden lg:flex items-center gap-3 z-10 bg-white/10 border border-white/15 px-3.5 py-2 rounded-xl backdrop-blur-xs">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-white p-0.5 shrink-0 shadow-2xs">
            <img
              src={POUPAGAIO_MASCOT_URL}
              alt="Mascote Poupagaio"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
            />
          </div>
          <p className="text-xs font-medium text-white max-w-[200px] leading-tight">
            Disciplina hoje, conquistas amanhã! ✍️
          </p>
        </div>
      </div>

      {/* ==================================================
          NÍVEL 1 — RESUMO DO MÊS (3 Cards principais)
          ================================================== */}
      <section className="bg-white border border-[#E8E4D5] rounded-2xl p-4 sm:p-5 shadow-xs">
        {/* Section Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-7 h-7 rounded-lg bg-[#EAF8F1] text-[#02402E] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#00B074]" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#02402E] font-display">
              Resumo do mês
            </h3>
            <p className="text-[11px] sm:text-xs text-[#5E6963]">
              Visão geral das suas finanças em {monthName}
            </p>
          </div>
        </div>

        {/* 3 Metrics Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Card 1: Entradas */}
          <div
            onClick={() => handleNavigate('entries')}
            className="bg-[#EAF8F1] border border-[#BDEBD5] rounded-2xl p-4 flex flex-col justify-between hover:shadow-xs transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#00B074]/15 text-[#00B074] flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                </div>
                <span className="text-xs font-bold text-[#02402E] uppercase tracking-wider">
                  Entradas
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#00B074] group-hover:translate-x-0.5 transition-transform" />
            </div>

            <div className="my-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#02402E] font-display tracking-tight">
                {formatCurrency(totalReceitas)}
              </span>
            </div>

            <div className="text-[11px] font-semibold text-[#00B074]">
              {entries.length > 0 ? `${entries.length} receitas registradas` : '100% do planejado'}
            </div>
          </div>

          {/* Card 2: Despesas */}
          <div
            onClick={() => handleNavigate('fixed_expenses')}
            className="bg-[#FDF1F3] border border-[#FAD1D8] rounded-2xl p-4 flex flex-col justify-between hover:shadow-xs transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FF3B6F]/15 text-[#FF3B6F] flex items-center justify-center">
                  <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
                </div>
                <span className="text-xs font-bold text-[#FF3B6F] uppercase tracking-wider">
                  Despesas
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#FF3B6F] group-hover:translate-x-0.5 transition-transform" />
            </div>

            <div className="my-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#FF3B6F] font-display tracking-tight">
                {formatCurrency(totalDespesas)}
              </span>
            </div>

            <div className="text-[11px] font-semibold text-[#FF3B6F]">
              {expensesPctOfIncome}% das entradas
            </div>
          </div>

          {/* Card 3: Saldo do mês */}
          <div
            onClick={() => handleNavigate('reports')}
            className="bg-[#FFF9EA] border border-[#FDE5A3] rounded-2xl p-4 flex flex-col justify-between hover:shadow-xs transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#F2B807]/25 text-[#B45309] flex items-center justify-center">
                  <Wallet className="w-4 h-4 stroke-[2.5]" />
                </div>
                <span className="text-xs font-bold text-[#02402E] uppercase tracking-wider">
                  Saldo do mês
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#B45309] group-hover:translate-x-0.5 transition-transform" />
            </div>

            <div className="my-3">
              <span
                className={`text-2xl sm:text-3xl font-extrabold font-display tracking-tight ${
                  saldoConsolidado >= 0 ? 'text-[#02402E]' : 'text-rose-600'
                }`}
              >
                {formatCurrency(saldoConsolidado)}
              </span>
            </div>

            <div className="text-[11px] font-semibold text-[#B45309]">
              {saldoConsolidado > 0 ? 'Positivo' : saldoConsolidado === 0 ? 'Equilíbrio' : 'Atenção'}
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          NÍVEL 2 — COMPOSIÇÃO DAS DESPESAS & DISTRIBUIÇÃO
          ================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Box: Composição das despesas (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-[#E8E4D5] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-[#F2B807]/20 text-[#02402E] flex items-center justify-center">
                <Receipt className="w-4 h-4 text-[#B45309]" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#02402E] font-display">
                  Composição das despesas
                </h3>
                <p className="text-[11px] sm:text-xs text-[#5E6963]">
                  Para onde vai o seu dinheiro neste mês?
                </p>
              </div>
            </div>

            {/* 3 Sub-category Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Gastos Fixos */}
              <div
                onClick={() => handleNavigate('fixed_expenses')}
                className="bg-[#F7F5FE] border border-[#E2DCFD] rounded-xl p-3.5 flex flex-col justify-between hover:shadow-xs transition-all cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-7 h-7 rounded-lg bg-[#8B5CF6]/15 text-[#7C3AED] flex items-center justify-center">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[#7C3AED] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[11px] font-bold text-[#5B21B6] uppercase tracking-wider">
                    Gastos Fixos
                  </p>
                  <p className="text-base sm:text-lg font-bold text-[#5B21B6] mt-1 font-display">
                    {formatCurrency(totalFixed)}
                  </p>
                </div>

                <div className="mt-3">
                  <p className="text-[10px] text-[#7C3AED] font-semibold mb-1">
                    {fixedPct}% das despesas
                  </p>
                  <div className="w-full h-1.5 bg-[#E2DCFD] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#8B5CF6] rounded-full transition-all duration-500"
                      style={{ width: `${fixedPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Gastos Variáveis */}
              <div
                onClick={() => handleNavigate('variable_expenses')}
                className="bg-[#FFF1F4] border border-[#FED4DD] rounded-xl p-3.5 flex flex-col justify-between hover:shadow-xs transition-all cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-7 h-7 rounded-lg bg-[#FF3B6F]/15 text-[#FF3B6F] flex items-center justify-center">
                      <CreditCard className="w-3.5 h-3.5" />
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[#FF3B6F] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[11px] font-bold text-[#BE123C] uppercase tracking-wider">
                    Gastos Variáveis
                  </p>
                  <p className="text-base sm:text-lg font-bold text-[#BE123C] mt-1 font-display">
                    {formatCurrency(totalVariable)}
                  </p>
                </div>

                <div className="mt-3">
                  <p className="text-[10px] text-[#FF3B6F] font-semibold mb-1">
                    {variablePct}% das despesas
                  </p>
                  <div className="w-full h-1.5 bg-[#FED4DD] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#FF3B6F] rounded-full transition-all duration-500"
                      style={{ width: `${variablePct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Parcelados */}
              <div
                onClick={() => handleNavigate('installments')}
                className="bg-[#FFF9EA] border border-[#FEE8B6] rounded-xl p-3.5 flex flex-col justify-between hover:shadow-xs transition-all cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-7 h-7 rounded-lg bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center">
                      <CalendarIcon className="w-3.5 h-3.5" />
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[#F59E0B] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[11px] font-bold text-[#B45309] uppercase tracking-wider">
                    Parcelados
                  </p>
                  <p className="text-base sm:text-lg font-bold text-[#B45309] mt-1 font-display">
                    {formatCurrency(totalInstallments)}
                  </p>
                </div>

                <div className="mt-3">
                  <p className="text-[10px] text-[#B45309] font-semibold mb-1">
                    {installmentsPct}% das despesas
                  </p>
                  <div className="w-full h-1.5 bg-[#FEE8B6] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#F59E0B] rounded-full transition-all duration-500"
                      style={{ width: `${installmentsPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Box: Distribuição das despesas (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-[#E8E4D5] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-7 h-7 rounded-lg bg-[#F2B807]/20 text-[#02402E] flex items-center justify-center">
              <PieChart className="w-4 h-4 text-[#B45309]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#02402E] font-display">
                Distribuição das despesas
              </h3>
            </div>
          </div>

          <div className="py-2 flex-1 flex items-center">
            <ExpensesDonutChart
              totalAmount={totalDespesas}
              fixedAmount={totalFixed}
              variableAmount={totalVariable}
              installmentsAmount={totalInstallments}
            />
          </div>
        </div>
      </section>

      {/* ==================================================
          NÍVEL 3 — OPERAÇÃO (3 Cards em linha)
          ================================================== */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Situação dos pagamentos */}
        <div className="bg-white border border-[#E8E4D5] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[#F2B807]/20 text-[#02402E] flex items-center justify-center">
                <Receipt className="w-4 h-4 text-[#B45309]" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#02402E] font-display">
                  Situação dos pagamentos
                </h3>
                <p className="text-[11px] text-[#5E6963]">Suas contas e compromissos</p>
              </div>
            </div>

            {/* 3 Status mini cards */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              {/* Pagas */}
              <div className="bg-[#EAF8F1] border border-[#BDEBD5] rounded-xl p-2.5 text-center flex flex-col justify-between">
                <div>
                  <div className="flex justify-center mb-1">
                    <CheckCircle2 className="w-4 h-4 text-[#00B074]" />
                  </div>
                  <span className="text-[10px] font-bold text-[#00B074] uppercase block">
                    Pagas
                  </span>
                  <span className="text-lg font-bold text-[#02402E] block my-0.5">
                    {paidCount}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#00B074] font-semibold">{paidPct}%</span>
                  <div className="w-full h-1 bg-[#BDEBD5] rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-[#00B074] rounded-full" style={{ width: `${paidPct}%` }} />
                  </div>
                </div>
              </div>

              {/* Pendentes */}
              <div className="bg-[#FFF9EA] border border-[#FDE5A3] rounded-xl p-2.5 text-center flex flex-col justify-between">
                <div>
                  <div className="flex justify-center mb-1">
                    <Clock className="w-4 h-4 text-[#F59E0B]" />
                  </div>
                  <span className="text-[10px] font-bold text-[#B45309] uppercase block">
                    Pendentes
                  </span>
                  <span className="text-lg font-bold text-[#02402E] block my-0.5">
                    {pendingCount}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#B45309] font-semibold">{pendingPct}%</span>
                  <div className="w-full h-1 bg-[#FDE5A3] rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-[#F59E0B] rounded-full" style={{ width: `${pendingPct}%` }} />
                  </div>
                </div>
              </div>

              {/* Atrasadas */}
              <div className="bg-[#FDF1F3] border border-[#FAD1D8] rounded-xl p-2.5 text-center flex flex-col justify-between">
                <div>
                  <div className="flex justify-center mb-1">
                    <AlertCircle className="w-4 h-4 text-[#FF3B6F]" />
                  </div>
                  <span className="text-[10px] font-bold text-[#FF3B6F] uppercase block">
                    Atrasadas
                  </span>
                  <span className="text-lg font-bold text-[#BE123C] block my-0.5">
                    {overdueCount}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#FF3B6F] font-semibold">{overduePct}%</span>
                  <div className="w-full h-1 bg-[#FAD1D8] rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-[#FF3B6F] rounded-full" style={{ width: `${overduePct}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Próximos vencimentos */}
        <div className="bg-white border border-[#E8E4D5] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#F2B807]/20 text-[#02402E] flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4 text-[#B45309]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#02402E] font-display">
                    Próximos vencimentos
                  </h3>
                  <p className="text-[11px] text-[#5E6963]">Contas do mês</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleNavigate('calendar')}
                className="text-[11px] font-bold text-[#02402E] hover:underline cursor-pointer"
              >
                Ver todos →
              </button>
            </div>

            {/* Content List */}
            <div className="space-y-2 mt-2">
              {upcomingItems.length === 0 ? (
                <div className="py-6 text-center space-y-1">
                  <div className="w-8 h-8 rounded-full bg-[#EAF8F1] text-[#00B074] mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-[#02402E]">Tudo em dia!</p>
                  <p className="text-[10px] text-[#5E6963]">Nenhum vencimento pendente.</p>
                </div>
              ) : (
                upcomingItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleNavigate('calendar')}
                    className="flex items-center justify-between p-2 rounded-xl border border-[#E8E4D5] bg-[#FAF8EE]/50 hover:bg-[#FAF8EE] transition-colors cursor-pointer text-left"
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="text-xs font-bold text-[#02402E] truncate">{item.title}</p>
                      <p className="text-[10px] text-[#5E6963]">
                        {item.dueDate.split('-').reverse().join('/')} • {item.category}
                      </p>
                    </div>
                    <span className="text-xs font-extrabold text-[#BE123C] shrink-0">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 3. Calendário do mês */}
        <div className="bg-white border border-[#E8E4D5] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#F2B807]/20 text-[#02402E] flex items-center justify-center">
                  <CalendarCheck className="w-4 h-4 text-[#B45309]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#02402E] font-display">
                    Calendário do mês
                  </h3>
                  <p className="text-[11px] text-[#5E6963]">
                    {monthName} {currentYear}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleNavigate('calendar')}
                className="text-[11px] font-bold text-[#02402E] hover:underline cursor-pointer"
              >
                Ver calendário →
              </button>
            </div>

            {/* Mini Calendar Grid */}
            <div className="mt-2">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                  <span key={i} className="text-[9px] font-bold text-[#5E6963]">
                    {d}
                  </span>
                ))}
              </div>

              {/* Day Cells */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {calendarGrid.map((item, idx) => {
                  if (!item) {
                    return <div key={`empty-${idx}`} className="h-6" />;
                  }

                  return (
                    <div
                      key={`day-${item.day}`}
                      onClick={() => handleNavigate('calendar')}
                      className={`h-6 rounded-md flex flex-col items-center justify-center cursor-pointer transition-colors relative ${
                        item.isToday
                          ? 'bg-[#02402E] text-white font-extrabold shadow-2xs'
                          : 'hover:bg-black/5 text-[#202724]'
                      }`}
                    >
                      <span className="text-[10px] leading-none">{item.day}</span>
                      
                      {/* Dots */}
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {item.hasFixed && <span className="w-1 h-1 rounded-full bg-[#8B5CF6]" />}
                        {item.hasVariable && <span className="w-1 h-1 rounded-full bg-[#FF3B6F]" />}
                        {item.hasInstallment && <span className="w-1 h-1 rounded-full bg-[#F59E0B]" />}
                        {item.hasEntry && <span className="w-1 h-1 rounded-full bg-[#00B074]" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mini Legend */}
              <div className="flex flex-wrap items-center justify-between gap-1 mt-3 pt-2 border-t border-[#E8E4D5] text-[9px] text-[#5E6963]">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
                  <span>Fixo</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B6F]" />
                  <span>Variável</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                  <span>Parcela</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00B074]" />
                  <span>Entrada</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          NÍVEL 4 — EVOLUÇÃO DO MÊS (Combo Chart)
          ================================================== */}
      <section className="bg-white border border-[#E8E4D5] rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#F2B807]/20 text-[#02402E] flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-[#B45309]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#02402E] font-display">
                Evolução do mês
              </h3>
              <p className="text-[11px] sm:text-xs text-[#5E6963]">
                Entradas vs Despesas nos últimos 6 meses
              </p>
            </div>
          </div>

          {/* Right Legend */}
          <div className="flex items-center gap-3 text-xs font-semibold text-[#202724]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#00B074]" />
              <span>Entradas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#FF3B6F]" />
              <span>Despesas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F2B807]" />
              <span>Saldo</span>
            </div>
          </div>
        </div>

        {/* Combo Chart */}
        <MonthlyEvolutionChart data={historyData} />
      </section>

    </div>
  );
}
