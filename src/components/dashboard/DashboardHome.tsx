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
  Legend,
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
  ChevronRight as ChevronIcon,
  CalendarCheck,
  StickyNote,
  Target,
  ShoppingBag,
  BarChart3,
  Sparkles,
  PieChart as PieIcon,
  TrendingUp,
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

const PIE_COLORS = [
  '#02402E', '#16A66A', '#F2B807', '#F29F05',
  '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4', '#64748B'
];

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

  // Category data for Donut Chart
  const categoryMap: Record<string, number> = {};
  if (checklistResult?.items) {
    checklistResult.items.forEach((item) => {
      categoryMap[item.category] = (categoryMap[item.category] || 0) + item.amount;
    });
  }
  const donutData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value,
  })).sort((a, b) => b.value - a.value);

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

  const notesByDate: Record<string, CalendarNote[]> = {};
  calendarNotes.forEach((note) => {
    if (!notesByDate[note.note_date]) notesByDate[note.note_date] = [];
    notesByDate[note.note_date].push(note);
  });

  const selectedMiniDateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(selectedMiniDay).padStart(2, '0')}`;
  const miniSelectedDayItems = itemsByDate[selectedMiniDateStr] || [];
  const miniSelectedDayNotes = notesByDate[selectedMiniDateStr] || [];

  const rawPendingItems = checklistResult ? checklistResult.items.filter(i => i.status === 'pending') : [];
  const sortedUpcomingItems = [...rawPendingItems].sort((a, b) => {
    const dateA = new Date(a.dueDate).getTime();
    const dateB = new Date(b.dueDate).getTime();
    if (a.visualStatus === 'overdue' && b.visualStatus !== 'overdue') return -1;
    if (b.visualStatus === 'overdue' && a.visualStatus !== 'overdue') return 1;
    if (a.visualStatus === 'today' && b.visualStatus !== 'today') return -1;
    if (b.visualStatus === 'today' && a.visualStatus !== 'today') return 1;
    return dateA - dateB;
  }).slice(0, 5);

  return (
    <div className="w-full space-y-8 pb-16 animate-in fade-in duration-300">
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
          SEÇÃO 1: RESUMO FINANCEIRO E CABEÇALHO
          ================================================== */}
      <section className="space-y-4">
        {/* Welcome Header & Month Control */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1E2220] border border-[#DCE2DE] dark:border-[#2B322F] rounded-2xl p-5 shadow-3xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold font-display text-[#202724] dark:text-[#F4F4F5]">
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

          {/* Month/Year Navigation Control */}
          <div className="flex items-center gap-2 bg-[#F2F4F3] dark:bg-[#181B1A] p-1 rounded-xl border border-[#DCE2DE] dark:border-[#2B322F] self-start sm:self-auto">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#5E6963] dark:text-[#95A39B] cursor-pointer transition-colors"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold min-w-[95px] text-center font-display text-[#02402E] dark:text-[#78D9A6]">
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

        {/* 4 Summary Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Saldo do Mês */}
          <div className="bg-gradient-to-br from-[#02402E] to-[#04523B] text-white rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-200 font-display">
                Saldo do Mês
              </span>
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-[#F2B807]">
                <Wallet className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
                {formatCurrency(saldoConsolidado)}
              </div>
              <p className="text-[11px] text-emerald-100/80 mt-1">
                {saldoConsolidado >= 0 ? 'Sua receita cobre as despesas do mês' : 'Suas despesas superam a receita prevista'}
              </p>
            </div>

            <div className="pt-2 border-t border-white/15 flex items-center justify-between text-[10px] text-emerald-200">
              <span>Balanço da competência</span>
              <span className="font-bold text-[#F2C438]">
                {saldoConsolidado >= 0 ? '+ Sobra' : '- Déficit'}
              </span>
            </div>
          </div>

          {/* Card 2: Entradas */}
          <div
            onClick={() => onSelectTab('entries')}
            className="bg-white dark:bg-[#1E2220] border border-[#DCE2DE] dark:border-[#2B322F] rounded-2xl p-5 shadow-3xs space-y-3 hover:border-emerald-500/40 transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-display flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4" />
                Entradas
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-xl sm:text-2xl font-bold font-display text-[#202724] dark:text-[#F4F4F5]">
                {formatCurrency(totalReceitas)}
              </div>
              <p className="text-[11px] text-[#5E6963] dark:text-[#95A39B] mt-1">
                Receitas planejadas para este mês
              </p>
            </div>

            <div className="pt-2 border-t border-[#DCE2DE]/60 dark:border-[#2B322F]/60 flex items-center justify-between text-[10px] text-[#5E6963] dark:text-[#95A39B]">
              <span>Recebidas: {formatCurrency(entriesSummary.totalReceived)}</span>
              <ChevronIcon className="w-3.5 h-3.5 text-[#16A66A]" />
            </div>
          </div>

          {/* Card 3: Despesas */}
          <div
            onClick={() => onSelectTab('fixed_expenses')}
            className="bg-white dark:bg-[#1E2220] border border-[#DCE2DE] dark:border-[#2B322F] rounded-2xl p-5 shadow-3xs space-y-3 hover:border-rose-500/40 transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 font-display flex items-center gap-1.5">
                <ArrowDownRight className="w-4 h-4" />
                Despesas
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-xl sm:text-2xl font-bold font-display text-[#202724] dark:text-[#F4F4F5]">
                {formatCurrency(totalDespesas)}
              </div>
              <p className="text-[11px] text-[#5E6963] dark:text-[#95A39B] mt-1">
                Soma de fixos, variáveis e parcelados
              </p>
            </div>

            <div className="pt-2 border-t border-[#DCE2DE]/60 dark:border-[#2B322F]/60 flex items-center justify-between text-[10px] text-[#5E6963] dark:text-[#95A39B]">
              <span>Pendente: {formatCurrency(totalPendente)}</span>
              <ChevronIcon className="w-3.5 h-3.5 text-rose-500" />
            </div>
          </div>

          {/* Card 4: Situação do Mês */}
          <div className="bg-white dark:bg-[#1E2220] border border-[#DCE2DE] dark:border-[#2B322F] rounded-2xl p-5 shadow-3xs space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#202724] dark:text-[#F4F4F5] font-display">
                Situação do Mês
              </span>
              <Clock className="w-4 h-4 text-[#F29F05]" />
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
                <span className="font-semibold text-[11px]">Quitado:</span>
                <span className="font-bold">{formatCurrency(totalPago)}</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300">
                <span className="font-semibold text-[11px]">Próximos 3 dias:</span>
                <span className="font-bold">{formatCurrency(totalProximo)}</span>
              </div>
              <div className={`flex items-center justify-between p-1.5 rounded-lg ${
                totalAtrasado > 0 ? 'bg-rose-500/15 text-rose-800 dark:text-rose-300 font-bold' : 'bg-gray-50 dark:bg-gray-900/40 text-gray-600 dark:text-gray-400'
              }`}>
                <span className="font-semibold text-[11px]">Atrasado / Hoje:</span>
                <span>{formatCurrency(totalAtrasado)}</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ==================================================
          SEÇÃO 2: ANÁLISE GRÁFICA & CHECKLIST
          ================================================== */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#DCE2DE] dark:border-[#2B322F] pb-3">
          <div>
            <h2 className="text-lg font-bold font-display text-[#02402E] dark:text-[#78D9A6] flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#16A66A]" />
              Análise e Evolução Financeira
            </h2>
            <p className="text-xs text-[#5E6963] dark:text-[#95A39B]">
              Gráficos de composição de despesas e evolução mensal das suas contas.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Donut Chart: Composição das Despesas */}
          <div className="bg-white dark:bg-[#1E2220] border border-[#DCE2DE] dark:border-[#2B322F] rounded-2xl p-5 shadow-3xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE2DE]/60 dark:border-[#2B322F]/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#02402E]/10 dark:bg-[#78D9A6]/15 flex items-center justify-center text-[#02402E] dark:text-[#78D9A6]">
                  <PieIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-display text-[#202724] dark:text-[#F4F4F5]">
                    Composição das Despesas
                  </h3>
                  <p className="text-[11px] text-[#5E6963] dark:text-[#95A39B]">
                    Distribuição por categoria neste mês
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#02402E] dark:text-[#78D9A6]">
                Total: {formatCurrency(totalDespesas)}
              </span>
            </div>

            {donutData.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <p className="text-xs text-[#5E6963] dark:text-[#95A39B]">
                  Nenhuma despesa cadastrada para este mês.
                </p>
                <button
                  type="button"
                  onClick={() => onSelectTab('variable_expenses')}
                  className="px-4 py-2 rounded-xl bg-[#02402E] text-white text-xs font-bold hover:bg-[#04523B] transition-all cursor-pointer"
                >
                  + Adicionar Despesa
                </button>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {donutData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: number) => [formatCurrency(value), 'Valor']}
                      contentStyle={{
                        backgroundColor: theme === 'dark' ? '#1E2220' : '#FFFFFF',
                        borderColor: '#DCE2DE',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Bar/Line Chart: Evolução Financeira */}
          <div className="bg-white dark:bg-[#1E2220] border border-[#DCE2DE] dark:border-[#2B322F] rounded-2xl p-5 shadow-3xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE2DE]/60 dark:border-[#2B322F]/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-display text-[#202724] dark:text-[#F4F4F5]">
                    Evolução Financeira
                  </h3>
                  <p className="text-[11px] text-[#5E6963] dark:text-[#95A39B]">
                    Entradas vs Despesas e Tendência de Saldo
                  </p>
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(val) => `R$${val}`} />
                  <RechartsTooltip
                    formatter={(value: number) => [formatCurrency(value)]}
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#1E2220' : '#FFFFFF',
                      borderColor: '#DCE2DE',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="Entradas" fill="#16A66A" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Despesas" fill="#E11D48" radius={[6, 6, 0, 0]} />
                  <Line type="monotone" dataKey="Saldo" stroke="#F2B807" strokeWidth={3} dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Checklist Financeiro Completo */}
        <div className="bg-white dark:bg-[#1E2220] border border-[#DCE2DE] dark:border-[#2B322F] rounded-2xl p-5 shadow-3xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DCE2DE]/60 dark:border-[#2B322F]/60 pb-3">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-[#16A66A]" />
              <div>
                <h3 className="text-sm font-bold font-display text-[#202724] dark:text-[#F4F4F5]">
                  Checklist e Vencimentos do Mês
                </h3>
                <p className="text-[11px] text-[#5E6963] dark:text-[#95A39B]">
                  Marque como pago diretamente aqui para atualizar seus relatórios
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-[#F2F4F3] dark:bg-[#181B1A] p-1 rounded-xl border border-[#DCE2DE] dark:border-[#2B322F]">
              <button
                type="button"
                onClick={() => setChecklistFilter('pending')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  checklistFilter === 'pending'
                    ? 'bg-white text-[#02402E] dark:bg-[#1E2220] dark:text-[#78D9A6] shadow-3xs'
                    : 'text-[#5E6963] dark:text-[#95A39B]'
                }`}
              >
                Pendentes ({checklistResult ? checklistResult.stats.pendingCount : 0})
              </button>
              <button
                type="button"
                onClick={() => setChecklistFilter('paid')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  checklistFilter === 'paid'
                    ? 'bg-white text-[#02402E] dark:bg-[#1E2220] dark:text-[#78D9A6] shadow-3xs'
                    : 'text-[#5E6963] dark:text-[#95A39B]'
                }`}
              >
                Pagas ({checklistResult ? checklistResult.stats.paidCount : 0})
              </button>
              <button
                type="button"
                onClick={() => setChecklistFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  checklistFilter === 'all'
                    ? 'bg-white text-[#02402E] dark:bg-[#1E2220] dark:text-[#78D9A6] shadow-3xs'
                    : 'text-[#5E6963] dark:text-[#95A39B]'
                }`}
              >
                Todas ({checklistResult ? checklistResult.stats.totalItems : 0})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredChecklistItems.length === 0 ? (
              <div className="col-span-2 text-center py-8 border border-dashed border-[#DCE2DE] dark:border-[#2B322F] rounded-xl bg-[#F7F9F8] dark:bg-[#181B1A]">
                <CheckCircle2 className="w-6 h-6 text-emerald-500/40 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-[#202724] dark:text-[#F4F4F5]">Nenhum lançamento nesta lista.</p>
              </div>
            ) : (
              filteredChecklistItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                    item.status === 'paid'
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800/30'
                      : item.visualStatus === 'overdue' || item.visualStatus === 'today'
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/30 font-semibold'
                      : 'bg-[#F7F9F8] dark:bg-[#181B1A] border-[#DCE2DE] dark:border-[#2B322F]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => handleToggleItemStatus(item)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                        item.status === 'paid'
                          ? 'bg-emerald-600 border-emerald-600 text-white dark:bg-emerald-500'
                          : 'border-[#5E6963] dark:border-[#95A39B] hover:border-[#16A66A]'
                      }`}
                    >
                      {item.status === 'paid' && <Check className="w-3.5 h-3.5 stroke-[3.5]" />}
                    </button>
                    <div className="min-w-0">
                      <p className={`text-xs font-bold truncate ${item.status === 'paid' ? 'line-through text-[#5E6963] dark:text-[#95A39B]' : 'text-[#202724] dark:text-[#F4F4F5]'}`}>
                        {item.title}
                      </p>
                      <span className="text-[10px] text-[#5E6963] dark:text-[#95A39B] uppercase font-bold tracking-wider block">
                        {item.category} • Vence {item.dueDate.split('-').reverse().join('/')}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xs font-bold ${item.status === 'paid' ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#202724] dark:text-[#F4F4F5]'}`}>
                      {formatCurrency(item.amount)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ==================================================
          SEÇÃO 3: ORGANIZAÇÃO & DADOS COMPLEMENTARES
          ================================================== */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#DCE2DE] dark:border-[#2B322F] pb-3">
          <div>
            <h2 className="text-lg font-bold font-display text-[#02402E] dark:text-[#78D9A6] flex items-center gap-2">
              <Target className="w-5 h-5 text-[#F2B807]" />
              Organização e Destaques
            </h2>
            <p className="text-xs text-[#5E6963] dark:text-[#95A39B]">
              Seu calendário, metas de economia e lista de compras em um único lugar.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Calendário do Mês */}
          <div className="bg-white dark:bg-[#1E2220] border border-[#DCE2DE] dark:border-[#2B322F] rounded-2xl p-5 shadow-3xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE2DE]/60 dark:border-[#2B322F]/60 pb-2.5">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#16A66A]" />
                <h3 className="text-sm font-bold font-display text-[#202724] dark:text-[#F4F4F5]">
                  Calendário ({MONTH_SHORT_NAMES[currentMonth - 1]})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab('calendar')}
                className="text-xs font-bold text-[#02402E] dark:text-[#78D9A6] hover:underline"
              >
                Abrir →
              </button>
            </div>

            {/* Mini Calendar Matrix */}
            <div className="space-y-2">
              <div className="grid grid-cols-7 text-center text-[10px] font-bold text-[#5E6963]">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((wd, i) => (
                  <span key={i}>{wd}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {Array.from({ length: firstDayWeekday }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="h-6" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const dStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const isDaySelected = dayNum === selectedMiniDay;
                  const hasDayItems = (itemsByDate[dStr] || []).length > 0;

                  return (
                    <button
                      key={dayNum}
                      type="button"
                      onClick={() => setSelectedMiniDay(dayNum)}
                      className={`h-7 rounded-lg text-xs font-bold relative flex items-center justify-center cursor-pointer transition-all ${
                        isDaySelected
                          ? 'bg-[#02402E] text-white dark:bg-[#78D9A6] dark:text-[#101614]'
                          : 'hover:bg-black/5 dark:hover:bg-white/5 text-[#202724] dark:text-[#F4F4F5]'
                      }`}
                    >
                      <span>{dayNum}</span>
                      {hasDayItems && (
                        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#F2B807]" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Day Details Preview */}
              <div className="p-3 rounded-xl bg-[#F7F9F8] dark:bg-[#181B1A] border border-[#DCE2DE] dark:border-[#2B322F] space-y-1.5 text-xs">
                <span className="font-bold text-[#02402E] dark:text-[#78D9A6] block">
                  Dia {selectedMiniDay}: {miniSelectedDayItems.length} vencimento(s)
                </span>
                {miniSelectedDayItems.slice(0, 2).map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-[11px]">
                    <span className="truncate">{item.title}</span>
                    <span className="font-bold">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Metas em Destaque */}
          <div className="bg-white dark:bg-[#1E2220] border border-[#DCE2DE] dark:border-[#2B322F] rounded-2xl p-5 shadow-3xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE2DE]/60 dark:border-[#2B322F]/60 pb-2.5">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#F2B807]" />
                <h3 className="text-sm font-bold font-display text-[#202724] dark:text-[#F4F4F5]">
                  Metas de Economia
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab('goals')}
                className="text-xs font-bold text-[#02402E] dark:text-[#78D9A6] hover:underline"
              >
                Gerenciar →
              </button>
            </div>

            <div className="space-y-3">
              {activeGoals.length === 0 ? (
                <div className="py-8 text-center space-y-2 border border-dashed border-[#DCE2DE] dark:border-[#2B322F] rounded-xl bg-[#F7F9F8] dark:bg-[#181B1A]">
                  <p className="text-xs text-[#5E6963] dark:text-[#95A39B]">Nenhuma meta ativa cadastrada.</p>
                  <button
                    type="button"
                    onClick={() => onSelectTab('goals')}
                    className="text-xs font-bold text-[#02402E] dark:text-[#78D9A6] hover:underline"
                  >
                    + Criar Meta
                  </button>
                </div>
              ) : (
                activeGoals.map((goal) => {
                  const pct = Math.min(goal.progressPercentage, 100);
                  return (
                    <div key={goal.id} className="p-3 rounded-xl border border-[#DCE2DE] dark:border-[#2B322F] bg-[#F7F9F8] dark:bg-[#181B1A] space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="truncate">{goal.name}</span>
                        <span className="text-[#02402E] dark:text-[#78D9A6]">{pct}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-[#16A66A] rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#5E6963] dark:text-[#95A39B]">
                        <span>Acumulado: {formatCurrency(goal.currentAmount)}</span>
                        <span>Alvo: {formatCurrency(goal.targetAmount)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Card 3: Destaque de Mercado e Compras */}
          <div className="bg-white dark:bg-[#1E2220] border border-[#DCE2DE] dark:border-[#2B322F] rounded-2xl p-5 shadow-3xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE2DE]/60 dark:border-[#2B322F]/60 pb-2.5">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-bold font-display text-[#202724] dark:text-[#F4F4F5]">
                  Lista de Mercado
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab('market')}
                className="text-xs font-bold text-[#02402E] dark:text-[#78D9A6] hover:underline"
              >
                Ver lista →
              </button>
            </div>

            <div className="space-y-2">
              {pendingMarketItems.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-[#DCE2DE] dark:border-[#2B322F] rounded-xl bg-[#F7F9F8] dark:bg-[#181B1A]">
                  <p className="text-xs text-[#5E6963] dark:text-[#95A39B]">Nenhum item pendente no mercado.</p>
                </div>
              ) : (
                pendingMarketItems.map((item) => (
                  <div key={item.id} className="p-2.5 rounded-xl border border-[#DCE2DE] dark:border-[#2B322F] bg-[#F7F9F8] dark:bg-[#181B1A] flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#202724] dark:text-[#F4F4F5] truncate">{item.name}</span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">{item.category}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
