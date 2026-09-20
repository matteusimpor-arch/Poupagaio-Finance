import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { POUPAGAIO_MASCOT_URL } from '../../assets/mascot';
import { entriesService } from '../../lib/services/entries';
import { checklistService, NormalizedChecklistExpense, MonthlyChecklistResult } from '../../lib/services/checklist';
import { calendarNotesService, CalendarNote } from '../../lib/services/calendarNotes';
import { goalsService } from '../../lib/services/goals';
import { installmentsService } from '../../lib/services/installments';
import { marketService } from '../../lib/services/market';
import { formatCurrency } from '../../lib/formatters';
import { ActiveTab, EntriesSummary, GoalWithProgress, InstallmentPurchaseWithInstallments, ShoppingListItem } from '../../types';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  CalendarCheck,
  Target,
  ShoppingBag,
  BarChart3,
  Sparkles,
  PieChart as PieIcon,
  TrendingUp,
  Leaf,
  Filter,
} from 'lucide-react';

interface DashboardHomeProps {
  onSelectTab: (tab: ActiveTab) => void;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const MONTH_SHORT_NAMES = [
  'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN',
  'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'
];

const DONUT_COLORS = {
  fixed: '#02402E',
  variable: '#16A66A',
  installments: '#F2B807',
};

export function DashboardHome({ onSelectTab }: DashboardHomeProps) {
  const { profile, user, currentSpace } = useAuth();
  const { theme } = useTheme();

  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);

  // Core Operational Data States
  const [checklistResult, setChecklistResult] = useState<MonthlyChecklistResult | null>(null);
  const [entriesSummary, setEntriesSummary] = useState<EntriesSummary>({
    totalPlanned: 0,
    totalReceived: 0,
    totalPending: 0,
    count: 0,
  });
  const [calendarNotes, setCalendarNotes] = useState<CalendarNote[]>([]);
  const [activeGoals, setActiveGoals] = useState<GoalWithProgress[]>([]);
  const [activeInstallments, setActiveInstallments] = useState<InstallmentPurchaseWithInstallments[]>([]);
  const [pendingMarketItems, setPendingMarketItems] = useState<ShoppingListItem[]>([]);
  
  // Historical evolution chart state
  const [evolutionData, setEvolutionData] = useState<Array<{
    monthLabel: string;
    Entradas: number;
    Despesas: number;
    Saldo: number;
  }>>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [checklistFilter, setChecklistFilter] = useState<'pending' | 'paid' | 'all'>('pending');
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedMiniDay, setSelectedMiniDay] = useState<number>(now.getDate());

  // Load All Dashboard Data
  const loadDashboardData = async () => {
    if (!currentSpace?.id) return;
    setIsLoading(true);
    setActionError(null);

    try {
      const [
        checklistRes,
        entriesRes,
        notesRes,
        goalsRes,
        installmentsRes,
        marketListsRes,
      ] = await Promise.all([
        checklistService.getMonthlyChecklist(currentSpace.id, currentYear, currentMonth),
        entriesService.getMonthSummary(currentSpace.id, currentYear, currentMonth),
        calendarNotesService.getNotesByMonth(currentSpace.id, currentYear, currentMonth),
        goalsService.getGoalsWithProgress(currentSpace.id, { filterStatus: 'active' }),
        installmentsService.getPurchasesWithInstallments(currentSpace.id, { filterStatus: 'active' }),
        marketService.getShoppingLists(currentSpace.id, { filterStatus: 'active' }),
      ]);

      setChecklistResult(checklistRes);
      setEntriesSummary(entriesRes);
      setCalendarNotes(notesRes.notes || []);
      setActiveGoals((goalsRes.goals || []).slice(0, 3));
      setActiveInstallments((installmentsRes.purchases || []).slice(0, 3));
      
      const allItems = (marketListsRes.lists || []).flatMap(l => l.items || []).filter(i => !i.is_checked);
      setPendingMarketItems(allItems.slice(0, 4));

      // Build 6-month financial evolution data
      const monthOffsets = [-3, -2, -1, 0, 1, 2];
      const evolution = await Promise.all(
        monthOffsets.map(async (offset) => {
          const d = new Date(currentYear, currentMonth - 1 + offset, 1);
          const y = d.getFullYear();
          const m = d.getMonth() + 1;
          const [ent, chk] = await Promise.all([
            entriesService.getMonthSummary(currentSpace.id, y, m),
            checklistService.getMonthlyChecklist(currentSpace.id, y, m),
          ]);
          const inc = ent.totalPlanned;
          const exp = chk.stats.totalAmount;
          return {
            monthLabel: `${MONTH_SHORT_NAMES[m - 1]}/${String(y).slice(-2)}`,
            Entradas: inc,
            Despesas: exp,
            Saldo: inc - exp,
          };
        })
      );
      setEvolutionData(evolution);

    } catch (err) {
      console.warn('Erro ao carregar dados do painel:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [currentSpace?.id, currentYear, currentMonth]);

  // Navigate months
  const handlePrevMonth = () => {
    setSelectedMiniDay(1);
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    setSelectedMiniDay(1);
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Toggle item payment status
  const handleToggleItemStatus = async (item: NormalizedChecklistExpense) => {
    if (!currentSpace?.id) return;
    const res = await checklistService.toggleItemPaymentStatus(item, currentSpace.id, currentYear, currentMonth);
    if (res.success) {
      await loadDashboardData();
    } else if (res.error) {
      setActionError(res.error);
    }
  };

  // Financial calculations
  const totalReceitas = entriesSummary.totalPlanned;
  const totalDespesas = checklistResult ? checklistResult.stats.totalAmount : 0;
  const saldoConsolidado = totalReceitas - totalDespesas;

  const totalPago = checklistResult ? checklistResult.stats.paidAmount : 0;
  const totalPendente = checklistResult ? checklistResult.stats.pendingAmount : 0;

  const overdueItems = checklistResult ? checklistResult.items.filter(i => i.visualStatus === 'overdue' && i.status === 'pending') : [];
  const todayItems = checklistResult ? checklistResult.items.filter(i => i.visualStatus === 'today' && i.status === 'pending') : [];
  const upcomingItems = checklistResult ? checklistResult.items.filter(i => i.visualStatus === 'upcoming' && i.status === 'pending') : [];

  const totalAtrasado = overdueItems.reduce((acc, i) => acc + i.amount, 0) + todayItems.reduce((acc, i) => acc + i.amount, 0);
  const totalProximo = upcomingItems.reduce((acc, i) => acc + i.amount, 0);

  // User details
  const fullName = profile?.full_name || user?.full_name || user?.email?.split('@')[0] || '';
  const firstName = fullName.trim().split(' ')[0] || 'Usuário';

  // Category breakdown for Donut Chart (Gastos Fixos, Gastos Variáveis, Parcelados)
  let fixedSum = 0;
  let variableSum = 0;
  let installmentSum = 0;

  if (checklistResult?.items) {
    checklistResult.items.forEach((item) => {
      if (item.type === 'fixed') fixedSum += item.amount;
      else if (item.type === 'variable') variableSum += item.amount;
      else if (item.type === 'installment') installmentSum += item.amount;
    });
  }

  const donutData = [
    { name: 'Gastos Fixos', value: fixedSum, color: DONUT_COLORS.fixed },
    { name: 'Gastos Variáveis', value: variableSum, color: DONUT_COLORS.variable },
    { name: 'Parcelados', value: installmentSum, color: DONUT_COLORS.installments },
  ].filter(d => d.value > 0);

  // Filter checklist items
  const filteredChecklistItems = checklistResult
    ? checklistResult.items.filter((item) => {
        if (checklistFilter === 'pending') return item.status === 'pending';
        if (checklistFilter === 'paid') return item.status === 'paid';
        return true;
      })
    : [];

  // Helper calculations for mini calendar
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayWeekday = new Date(currentYear, currentMonth - 1, 1).getDay();

  const itemsByDate: Record<string, NormalizedChecklistExpense[]> = {};
  if (checklistResult) {
    checklistResult.items.forEach((item) => {
      if (!itemsByDate[item.dueDate]) itemsByDate[item.dueDate] = [];
      itemsByDate[item.dueDate].push(item);
    });
  }

  const selectedMiniDateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(selectedMiniDay).padStart(2, '0')}`;
  const miniSelectedDayItems = itemsByDate[selectedMiniDateStr] || [];

  return (
    <div className="w-full space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Action error banner */}
      {actionError && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center justify-between">
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} className="p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ==================================================
          SEÇÃO 1: CABEÇALHO & 4 CARDS DE RESUMO FINANCEIRO
          ================================================== */}
      <section className="space-y-4">
        {/* Welcome Banner & Month Control */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 dark:bg-[#1C211E]/80 backdrop-blur-md border border-[#D2DDD6] dark:border-[#28322C] rounded-2xl p-5 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold font-display text-[#02402E] dark:text-[#78D9A6]">
                Olá, {firstName}! 👋
              </h1>
              {currentSpace?.name && (
                <span className="text-[10px] font-extrabold uppercase bg-[#02402E] text-white dark:bg-[#78D9A6] dark:text-[#101614] px-2 py-0.5 rounded-md">
                  {currentSpace.name}
                </span>
              )}
            </div>
            <p className="text-xs text-[#5E6963] dark:text-[#95A39B] mt-0.5">
              Acompanhe seu balanço, próximos vencimentos e saúde financeira.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <p className="text-xs italic text-[#02402E]/70 dark:text-[#78D9A6]/80 font-medium hidden lg:block">
              "Disciplina hoje, conquistas amanhã." 🍃
            </p>

            {/* Month/Year Navigation Control */}
            <div className="flex items-center gap-1.5 bg-[#EAF3EE] dark:bg-[#181B1A] p-1 rounded-xl border border-[#CDE0D5] dark:border-[#2B322F]">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#5E6963] dark:text-[#95A39B] cursor-pointer transition-colors"
                aria-label="Mês anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold min-w-[100px] text-center font-display text-[#02402E] dark:text-[#78D9A6]">
                {MONTH_NAMES[currentMonth - 1]} {currentYear}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#5E6963] dark:text-[#95A39B] cursor-pointer transition-colors"
                aria-label="Próximo mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 4 Summary Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Saldo do Mês (Deep Green #02402E) */}
          <div className="bg-[#02402E] text-white rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden flex flex-col justify-between border border-[#02402E]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#A1D9BD] font-display">
                Saldo do Mês
              </span>
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-[#F2B807]">
                <Wallet className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
                {formatCurrency(saldoConsolidado)}
              </div>
              <p className="text-[11px] text-[#C0E3D3] mt-1 font-medium flex items-center gap-1">
                {saldoConsolidado >= 0 ? 'Seu resultado está positivo! 🚀' : 'Saldo do período negativo ⚠️'}
              </p>
            </div>
          </div>

          {/* Card 2: Entradas */}
          <div className="bg-white/90 dark:bg-[#1C211E]/90 backdrop-blur-md border border-[#D2DDD6] dark:border-[#28322C] rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5E6963] dark:text-[#95A39B] font-display">
                Entradas
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#E6F6EF] dark:bg-[#16A66A]/20 flex items-center justify-center text-[#16A66A]">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#02402E] dark:text-[#78D9A6] font-display">
                {formatCurrency(totalReceitas)}
              </div>
              <p className="text-[11px] text-[#5E6963] dark:text-[#95A39B] mt-1">
                {entriesSummary.count} receita(s) registrada(s)
              </p>
            </div>
          </div>

          {/* Card 3: Despesas */}
          <div className="bg-white/90 dark:bg-[#1C211E]/90 backdrop-blur-md border border-[#D2DDD6] dark:border-[#28322C] rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5E6963] dark:text-[#95A39B] font-display">
                Despesas
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#FEE2E2] dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400 font-display">
                {formatCurrency(totalDespesas)}
              </div>
              <p className="text-[11px] text-[#5E6963] dark:text-[#95A39B] mt-1">
                {checklistResult?.stats.totalCount || 0} lançamento(s) no mês
              </p>
            </div>
          </div>

          {/* Card 4: Situação do Mês */}
          <div className="bg-white/90 dark:bg-[#1C211E]/90 backdrop-blur-md border border-[#D2DDD6] dark:border-[#28322C] rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5E6963] dark:text-[#95A39B] font-display">
                Situação do Mês
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#5E6963] dark:text-[#95A39B] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#16A66A]" /> Quitado:
                </span>
                <span className="font-bold text-[#16A66A]">{formatCurrency(totalPago)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[#5E6963] dark:text-[#95A39B] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Próximos:
                </span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{formatCurrency(totalProximo)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[#5E6963] dark:text-[#95A39B] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Atrasado / Hoje:
                </span>
                <span className="font-bold text-rose-600 dark:text-rose-400">{formatCurrency(totalAtrasado)}</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ==================================================
          SEÇÃO 2: ANÁLISE E EVOLUÇÃO FINANCEIRA (CHARTS)
          ================================================== */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold font-display text-[#02402E] dark:text-[#78D9A6] flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#16A66A]" />
            Análise e Evolução Financeira
          </h2>
          <p className="text-xs text-[#5E6963] dark:text-[#95A39B]">
            Gráficos de composição de despesas e evolução mensal das suas contas.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chart 1: Composição das Despesas (Donut) */}
          <div className="lg:col-span-5 bg-white/90 dark:bg-[#1C211E]/90 backdrop-blur-md border border-[#D2DDD6] dark:border-[#28322C] rounded-2xl p-5 shadow-2xs space-y-4 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2ECE6] dark:border-[#28322C]">
              <div>
                <h3 className="text-sm font-bold text-[#02402E] dark:text-[#78D9A6] font-display">
                  Composição das Despesas
                </h3>
                <p className="text-[11px] text-[#5E6963] dark:text-[#95A39B]">
                  Distribuição por categoria neste mês
                </p>
              </div>
              <PieIcon className="w-4 h-4 text-[#16A66A]" />
            </div>

            {donutData.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#5E6963] dark:text-[#95A39B]">
                Nenhuma despesa cadastrada para exibir o gráfico.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 items-center gap-4 my-2">
                <div className="h-44 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(val: number) => formatCurrency(val)}
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? '#1C211E' : '#FFFFFF',
                          borderColor: theme === 'dark' ? '#28322C' : '#D2DDD6',
                          borderRadius: '12px',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Donut Center Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-[10px] uppercase font-bold text-[#5E6963] dark:text-[#95A39B]">
                      Total
                    </span>
                    <span className="text-xs font-extrabold text-[#02402E] dark:text-[#78D9A6]">
                      {formatCurrency(totalDespesas)}
                    </span>
                  </div>
                </div>

                {/* Legend List */}
                <div className="space-y-2 text-xs">
                  {donutData.map((d) => {
                    const percentage = totalDespesas > 0 ? ((d.value / totalDespesas) * 100).toFixed(1) : '0';
                    return (
                      <div key={d.name} className="flex items-center justify-between p-2 rounded-xl bg-[#F4F8F5] dark:bg-[#222825] border border-[#E2ECE6] dark:border-[#2C3630]">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-md shrink-0" style={{ backgroundColor: d.color }} />
                          <span className="font-semibold text-[#202724] dark:text-[#F4F4F5]">{d.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-[#02402E] dark:text-[#78D9A6]">{formatCurrency(d.value)}</span>
                          <span className="text-[10px] text-[#5E6963] dark:text-[#95A39B] ml-1.5">({percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Chart 2: Evolução Financeira (Composed Chart) */}
          <div className="lg:col-span-7 bg-white/90 dark:bg-[#1C211E]/90 backdrop-blur-md border border-[#D2DDD6] dark:border-[#28322C] rounded-2xl p-5 shadow-2xs space-y-4 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2ECE6] dark:border-[#28322C]">
              <div>
                <h3 className="text-sm font-bold text-[#02402E] dark:text-[#78D9A6] font-display">
                  Evolução Financeira
                </h3>
                <p className="text-[11px] text-[#5E6963] dark:text-[#95A39B]">
                  Entradas vs Despesas e Tendência de Saldo
                </p>
              </div>
              <TrendingUp className="w-4 h-4 text-[#16A66A]" />
            </div>

            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={evolutionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#28322C' : '#E2ECE6'} />
                  <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: theme === 'dark' ? '#95A39B' : '#5E6963' }} />
                  <YAxis tick={{ fontSize: 10, fill: theme === 'dark' ? '#95A39B' : '#5E6963' }} tickFormatter={(v) => `R$${v >= 1000 ? (v/1000).toFixed(0) + 'k' : v}`} />
                  <RechartsTooltip
                    formatter={(val: number) => formatCurrency(val)}
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#1C211E' : '#FFFFFF',
                      borderColor: theme === 'dark' ? '#28322C' : '#D2DDD6',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="Entradas" fill="#16A66A" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="Despesas" fill="#E11D48" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Line type="monotone" dataKey="Saldo" stroke="#F2B807" strokeWidth={3} dot={{ r: 4, fill: '#F2B807' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Legend Footer */}
            <div className="flex items-center justify-center gap-6 pt-2 border-t border-[#E2ECE6] dark:border-[#28322C] text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#16A66A]" />
                <span className="text-[#5E6963] dark:text-[#95A39B]">Entradas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#E11D48]" />
                <span className="text-[#5E6963] dark:text-[#95A39B]">Despesas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#F2B807]" />
                <span className="text-[#5E6963] dark:text-[#95A39B]">Saldo Líquido</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          SEÇÃO 3: CHECKLIST E VENCIMENTOS DO MÊS
          ================================================== */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold font-display text-[#02402E] dark:text-[#78D9A6] flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-[#16A66A]" />
              Checklist e Vencimentos do Mês
            </h2>
            <p className="text-xs text-[#5E6963] dark:text-[#95A39B]">
              Marque como pago diretamente aqui para atualizar seus relatórios.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-white/80 dark:bg-[#1C211E]/80 border border-[#D2DDD6] dark:border-[#28322C] p-1 rounded-xl shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setChecklistFilter('pending')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                checklistFilter === 'pending'
                  ? 'bg-[#02402E] text-white dark:bg-[#16A66A] dark:text-[#101614]'
                  : 'text-[#5E6963] dark:text-[#95A39B] hover:text-[#02402E]'
              }`}
            >
              Pendentes ({checklistResult?.stats.pendingCount || 0})
            </button>
            <button
              type="button"
              onClick={() => setChecklistFilter('paid')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                checklistFilter === 'paid'
                  ? 'bg-[#02402E] text-white dark:bg-[#16A66A] dark:text-[#101614]'
                  : 'text-[#5E6963] dark:text-[#95A39B] hover:text-[#02402E]'
              }`}
            >
              Pagas ({checklistResult?.stats.paidCount || 0})
            </button>
            <button
              type="button"
              onClick={() => setChecklistFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                checklistFilter === 'all'
                  ? 'bg-[#02402E] text-white dark:bg-[#16A66A] dark:text-[#101614]'
                  : 'text-[#5E6963] dark:text-[#95A39B] hover:text-[#02402E]'
              }`}
            >
              Todas ({checklistResult?.stats.totalCount || 0})
            </button>
          </div>
        </div>

        {/* Checklist List Container */}
        <div className="bg-white/90 dark:bg-[#1C211E]/90 backdrop-blur-md border border-[#D2DDD6] dark:border-[#28322C] rounded-2xl p-5 shadow-2xs divide-y divide-[#E2ECE6] dark:divide-[#28322C]">
          {filteredChecklistItems.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-[#16A66A] mx-auto opacity-60" />
              <p className="text-sm font-bold text-[#02402E] dark:text-[#78D9A6]">
                Nenhum lançamento nesta lista.
              </p>
              <p className="text-xs text-[#5E6963] dark:text-[#95A39B]">
                Alterne os filtros acima ou cadastre novos gastos fixos, variáveis ou parcelamentos.
              </p>
            </div>
          ) : (
            filteredChecklistItems.slice(0, 8).map((item) => {
              const isPaid = item.status === 'paid';
              return (
                <div
                  key={item.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-[#F6FAF7] dark:hover:bg-[#222825] px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleItemStatus(item)}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                        isPaid
                          ? 'bg-[#16A66A] border-[#16A66A] text-white'
                          : 'border-[#BDC9C1] dark:border-[#38443D] hover:border-[#16A66A] bg-white dark:bg-[#181B1A]'
                      }`}
                      title={isPaid ? 'Marcar como não pago' : 'Marcar como pago'}
                    >
                      {isPaid && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold truncate ${isPaid ? 'line-through text-[#8A9690] dark:text-[#6A7870]' : 'text-[#202724] dark:text-[#F4F4F5]'}`}>
                          {item.title}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#E8F2EC] dark:bg-[#25322A] text-[#02402E] dark:text-[#78D9A6] font-semibold shrink-0">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5E6963] dark:text-[#95A39B]">
                        Vencimento: {item.dueDate.split('-').reverse().join('/')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <span className={`text-sm font-bold font-display ${isPaid ? 'text-[#8A9690] dark:text-[#6A7870]' : 'text-[#02402E] dark:text-[#78D9A6]'}`}>
                      {formatCurrency(item.amount)}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleToggleItemStatus(item)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isPaid
                          ? 'bg-[#E2ECE6] dark:bg-[#28322C] text-[#5E6963] dark:text-[#95A39B] hover:bg-rose-100 hover:text-rose-700'
                          : 'bg-[#02402E] text-white hover:bg-[#16A66A] dark:bg-[#78D9A6] dark:text-[#101614]'
                      }`}
                    >
                      {isPaid ? 'Pago ✓' : 'Marcar Pago'}
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {filteredChecklistItems.length > 8 && (
            <div className="pt-3 text-center">
              <button
                type="button"
                onClick={() => onSelectTab('closing')}
                className="text-xs font-bold text-[#16A66A] hover:underline cursor-pointer"
              >
                Ver todos os {filteredChecklistItems.length} lançamentos na Fechamento do Mês →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ==================================================
          SEÇÃO 4: ORGANIZAÇÃO E DESTAQUES (3 CARDS GRID)
          ================================================== */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold font-display text-[#02402E] dark:text-[#78D9A6] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#16A66A]" />
            Organização e Destaques
          </h2>
          <p className="text-xs text-[#5E6963] dark:text-[#95A39B]">
            Seu calendário, metas de economia e lista de compras em um único lugar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Calendário */}
          <div className="bg-white/90 dark:bg-[#1C211E]/90 backdrop-blur-md border border-[#D2DDD6] dark:border-[#28322C] rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2ECE6] dark:border-[#28322C]">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#16A66A]" />
                <h3 className="text-sm font-bold text-[#02402E] dark:text-[#78D9A6] font-display">
                  Calendário ({MONTH_SHORT_NAMES[currentMonth - 1]})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab('calendar')}
                className="text-xs text-[#16A66A] hover:underline font-bold cursor-pointer"
              >
                Abrir →
              </button>
            </div>

            {/* Mini Grid representation */}
            <div className="space-y-2">
              <div className="grid grid-cols-7 text-center text-[10px] font-bold text-[#5E6963] dark:text-[#95A39B]">
                <span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold">
                {Array.from({ length: Math.min(daysInMonth, 14) }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const hasItems = itemsByDate[dateKey] && itemsByDate[dateKey].length > 0;
                  const isSelected = selectedMiniDay === dayNum;

                  return (
                    <button
                      key={dayNum}
                      type="button"
                      onClick={() => setSelectedMiniDay(dayNum)}
                      className={`h-7 rounded-lg flex items-center justify-center cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#02402E] text-white font-bold'
                          : hasItems
                          ? 'bg-[#E6F6EF] text-[#02402E] font-bold border border-[#16A66A]/40'
                          : 'bg-[#F4F8F5] dark:bg-[#222825] text-[#202724] dark:text-[#F4F4F5]'
                      }`}
                    >
                      {dayNum}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#F4F8F5] dark:bg-[#222825] border border-[#E2ECE6] dark:border-[#28322C] text-xs">
              <span className="font-bold text-[#02402E] dark:text-[#78D9A6]">Dia {selectedMiniDay}: </span>
              <span className="text-[#5E6963] dark:text-[#95A39B]">
                {miniSelectedDayItems.length} vencimento(s) cadastrado(s)
              </span>
            </div>
          </div>

          {/* Card 2: Metas de Economia */}
          <div className="bg-white/90 dark:bg-[#1C211E]/90 backdrop-blur-md border border-[#D2DDD6] dark:border-[#28322C] rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2ECE6] dark:border-[#28322C]">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#16A66A]" />
                <h3 className="text-sm font-bold text-[#02402E] dark:text-[#78D9A6] font-display">
                  Metas de Economia
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab('goals')}
                className="text-xs text-[#16A66A] hover:underline font-bold cursor-pointer"
              >
                Gerenciar →
              </button>
            </div>

            {activeGoals.length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <p className="text-xs text-[#5E6963] dark:text-[#95A39B]">Nenhuma meta ativa cadastrada.</p>
                <button
                  type="button"
                  onClick={() => onSelectTab('goals')}
                  className="px-3 py-1.5 rounded-xl bg-[#02402E] text-white text-xs font-bold cursor-pointer hover:bg-[#16A66A]"
                >
                  + Criar Meta
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {activeGoals.map((goal) => {
                  const percent = Math.min(Math.round(goal.progress_percentage || 0), 100);
                  return (
                    <div key={goal.id} className="space-y-1">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-[#202724] dark:text-[#F4F4F5] truncate">{goal.title}</span>
                        <span className="text-[#16A66A]">{percent}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#E2ECE6] dark:bg-[#28322C] overflow-hidden">
                        <div className="h-full bg-[#16A66A] rounded-full transition-all duration-300" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Card 3: Lista de Mercado */}
          <div className="bg-white/90 dark:bg-[#1C211E]/90 backdrop-blur-md border border-[#D2DDD6] dark:border-[#28322C] rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2ECE6] dark:border-[#28322C]">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#16A66A]" />
                <h3 className="text-sm font-bold text-[#02402E] dark:text-[#78D9A6] font-display">
                  Lista de Mercado
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab('market')}
                className="text-xs text-[#16A66A] hover:underline font-bold cursor-pointer"
              >
                Ver lista →
              </button>
            </div>

            {pendingMarketItems.length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <p className="text-xs text-[#5E6963] dark:text-[#95A39B]">Nenhum item pendente na lista.</p>
                <button
                  type="button"
                  onClick={() => onSelectTab('market')}
                  className="px-3 py-1.5 rounded-xl bg-[#02402E] text-white text-xs font-bold cursor-pointer hover:bg-[#16A66A]"
                >
                  + Ir para Mercado
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingMarketItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-[#F4F8F5] dark:bg-[#222825] text-xs">
                    <span className="font-semibold text-[#202724] dark:text-[#F4F4F5] truncate">{item.name}</span>
                    <span className="text-[11px] text-[#5E6963] dark:text-[#95A39B]">{item.quantity} {item.unit || 'un'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </section>
    </div>
  );
}
