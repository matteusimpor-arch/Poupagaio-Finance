import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { POUPAGAIO_MASCOT_URL } from '../../assets/mascot';
import { entriesService } from '../../lib/services/entries';
import {
  checklistService,
  NormalizedChecklistExpense,
  MonthlyChecklistResult,
} from '../../lib/services/checklist';
import { calendarNotesService, CalendarNote } from '../../lib/services/calendarNotes';
import { formatCurrency } from '../../lib/formatters';
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
  StickyNote,
} from 'lucide-react';
import { ActiveTab, EntriesSummary } from '../../types';

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

export function DashboardHome({ onSelectTab }: DashboardHomeProps) {
  const { profile, user, currentSpace } = useAuth();
  const { theme } = useTheme();

  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);

  // States
  const [checklistResult, setChecklistResult] = useState<MonthlyChecklistResult | null>(null);
  const [entriesSummary, setEntriesSummary] = useState<EntriesSummary>({
    totalPlanned: 0,
    totalReceived: 0,
    totalPending: 0,
    count: 0,
  });
  const [calendarNotes, setCalendarNotes] = useState<CalendarNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [checklistFilter, setChecklistFilter] = useState<'pending' | 'paid' | 'all'>('pending');
  const [actionError, setActionError] = useState<string | null>(null);

  // Selected Day in compact Mini Calendar
  const [selectedMiniDay, setSelectedMiniDay] = useState<number>(now.getDate());

  // Load operational financial data
  const loadDashboardData = async () => {
    if (!currentSpace?.id) return;
    setIsLoading(true);
    setActionError(null);

    try {
      const [checklistRes, entriesRes, notesRes] = await Promise.all([
        checklistService.getMonthlyChecklist(currentSpace.id, currentYear, currentMonth),
        entriesService.getMonthSummary(currentSpace.id, currentYear, currentMonth),
        calendarNotesService.getNotesByMonth(currentSpace.id, currentYear, currentMonth),
      ]);

      setChecklistResult(checklistRes);
      setEntriesSummary(entriesRes);
      setCalendarNotes(notesRes.notes || []);
    } catch (err) {
      console.warn('Erro ao carregar dados do painel operacional:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [currentSpace?.id, currentYear, currentMonth]);

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

  // Breakdown by subsystem
  const allItems = checklistResult ? checklistResult.items : [];
  const totalFixed = allItems.filter(i => i.sourceType === 'fixed').reduce((acc, i) => acc + i.amount, 0);
  const totalVariable = allItems.filter(i => i.sourceType === 'variable').reduce((acc, i) => acc + i.amount, 0);
  const totalInstallments = allItems.filter(i => i.sourceType === 'installment').reduce((acc, i) => acc + i.amount, 0);

  const countFixed = allItems.filter(i => i.sourceType === 'fixed').length;
  const countVariable = allItems.filter(i => i.sourceType === 'variable').length;
  const countInstallments = allItems.filter(i => i.sourceType === 'installment').length;

  const totalPago = checklistResult ? checklistResult.stats.paidAmount : 0;
  const totalPendente = checklistResult ? checklistResult.stats.pendingAmount : 0;

  const overdueItems = allItems.filter(i => i.visualStatus === 'overdue' && i.status === 'pending');
  const todayItems = allItems.filter(i => i.visualStatus === 'today' && i.status === 'pending');
  const upcomingItems = allItems.filter(i => i.visualStatus === 'upcoming' && i.status === 'pending');

  const totalAtrasado = overdueItems.reduce((acc, i) => acc + i.amount, 0) + todayItems.reduce((acc, i) => acc + i.amount, 0);
  const totalProximo = upcomingItems.reduce((acc, i) => acc + i.amount, 0);

  // User name
  const fullName = profile?.full_name || user?.full_name || user?.email?.split('@')[0] || '';
  const firstName = fullName.trim().split(' ')[0] || 'Usuário';

  // Mascot dynamic messages
  let mascotMessage = 'Tudo em ordem por aqui!';
  let mascotActionLabel = 'Ver calendário';
  let mascotActionTab: ActiveTab = 'calendar';

  if (overdueItems.length > 0) {
    mascotMessage = overdueItems.length === 1
      ? 'Você tem 1 compromisso vencido. Vamos regularizar?'
      : `Atenção: você tem ${overdueItems.length} compromissos vencidos!`;
    mascotActionLabel = 'Ver pendentes';
  } else if (todayItems.length > 0) {
    mascotMessage = todayItems.length === 1
      ? 'Hoje vence 1 compromisso importante. Não esqueça!'
      : `Hoje vencem ${todayItems.length} compromissos. Vamos quitar?`;
  } else if (upcomingItems.length > 0) {
    mascotMessage = 'Você tem compromissos com vencimento próximo.';
    mascotActionLabel = 'Ver calendário';
  } else if (totalDespesas === 0 && totalReceitas === 0) {
    mascotMessage = 'Vamos começar o mês? Registre suas primeiras receitas ou despesas.';
    mascotActionLabel = '+ Lançamento';
    mascotActionTab = 'entries';
  } else {
    mascotMessage = 'Parabéns! Seus compromissos do mês estão em dia!';
    mascotActionLabel = 'Ver calendário';
  }

  // Filter checklist items
  const filteredChecklistItems = checklistResult
    ? checklistResult.items.filter((item) => {
        if (checklistFilter === 'pending') return item.status === 'pending';
        if (checklistFilter === 'paid') return item.status === 'paid';
        return true;
      })
    : [];

  // Helper calculations for calendar
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

  // Próximos Vencimentos
  const rawPendingItems = checklistResult ? checklistResult.items.filter(i => i.status === 'pending') : [];
  const sortedUpcomingItems = [...rawPendingItems].sort((a, b) => {
    const dateA = new Date(a.dueDate).getTime();
    const dateB = new Date(b.dueDate).getTime();
    if (a.visualStatus === 'overdue' && b.visualStatus !== 'overdue') return -1;
    if (b.visualStatus === 'overdue' && a.visualStatus !== 'overdue') return 1;
    if (a.visualStatus === 'today' && b.visualStatus !== 'today') return -1;
    if (b.visualStatus === 'today' && a.visualStatus !== 'today') return 1;
    return dateA - dateB;
  }).slice(0, 4);

  return (
    <div className="w-full space-y-4 pb-12 animate-in fade-in duration-300 max-w-7xl mx-auto">
      {actionError && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} className="p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ==================================================
          1. CABEÇALHO OPERACIONAL (Saudação + Seletor de Competência)
          ================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#18211D] p-3.5 sm:p-4 rounded-2xl border border-[#E2E8E4] dark:border-[#24312B] shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-bold font-display text-[#202724] dark:text-[#F7F4EA] tracking-tight">
            Olá, {firstName}! 👋
          </h1>
          <p className="text-xs text-[#5E6963] dark:text-[#95A39B]">
            Visão consolidada das suas finanças
          </p>
        </div>

        {/* Competency Month Navigation Selector */}
        <div className="flex items-center gap-2 bg-[#F7F4EA] dark:bg-[#101614] p-1 rounded-xl border border-[#E2E8E4] dark:border-[#24312B] self-start sm:self-auto">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#5E6963] dark:text-[#95A39B] cursor-pointer transition-colors"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs sm:text-sm font-bold min-w-[120px] text-center font-display text-[#075C45] dark:text-[#78D9A6]">
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

      {/* ==================================================
          2. FAIXA POUPAGAIO DIZ
          ================================================== */}
      <div className="flex items-center justify-between gap-3 px-3.5 sm:px-4 py-2.5 rounded-2xl border border-[#E2E8E4] dark:border-[#24312B] bg-white dark:bg-[#18211D] shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl overflow-hidden border border-[#075C45]/20 bg-[#F7F4EA] dark:bg-[#101614] p-0.5 shrink-0 flex items-center justify-center">
            <img
              src={POUPAGAIO_MASCOT_URL}
              alt="Poupagaio"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
            />
          </div>
          <p className="text-xs sm:text-sm text-[#202724] dark:text-[#F7F4EA] truncate font-medium">
            <span className="font-semibold text-[#075C45] dark:text-[#78D9A6] mr-1.5">Poupagaio diz:</span>
            {mascotMessage}
          </p>
        </div>
        {mascotActionLabel && (
          <button
            type="button"
            onClick={() => {
              if (mascotActionLabel === 'Ver pendentes') {
                setChecklistFilter('pending');
              } else {
                onSelectTab(mascotActionTab);
              }
            }}
            className="shrink-0 text-xs font-bold text-[#075C45] hover:text-[#075C45]/80 dark:text-[#78D9A6] dark:hover:text-[#78D9A6]/80 flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-[#075C45]/10 transition-colors cursor-pointer"
          >
            <span>{mascotActionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ==================================================
          3. NÍVEL 1: "COMO ESTÁ MEU MÊS?" (RESUMO PRINCIPAL)
          ================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
        
        {/* CARD SALDO CONSOLIDADO */}
        <div className="md:col-span-6 bg-white dark:bg-[#18211D] border border-[#E2E8E4] dark:border-[#24312B] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between border-b border-[#E2E8E4]/60 dark:border-[#24312B]/60 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#075C45]/10 dark:bg-[#78D9A6]/10 text-[#075C45] dark:text-[#78D9A6] flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#5E6963] dark:text-[#95A39B]">
                Saldo do Mês
              </span>
            </div>
            {currentSpace?.name && (
              <span className="text-[10px] font-extrabold tracking-wider uppercase bg-[#075C45]/10 dark:bg-[#78D9A6]/15 text-[#075C45] dark:text-[#78D9A6] px-2 py-0.5 rounded-md">
                {currentSpace.name}
              </span>
            )}
          </div>

          <div className="my-3.5 text-center">
            <div className={`text-3xl sm:text-4xl font-extrabold font-display tracking-tight ${saldoConsolidado < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[#075C45] dark:text-[#78D9A6]'}`}>
              {formatCurrency(saldoConsolidado)}
            </div>
            <p className="text-xs text-[#5E6963] dark:text-[#95A39B] mt-1">
              Balanço disponível projetado para esta competência
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-[#E2E8E4]/60 dark:border-[#24312B]/60">
            <div
              onClick={() => onSelectTab('entries')}
              className="p-2.5 sm:p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 hover:border-emerald-500/40 cursor-pointer transition-all flex flex-col justify-between"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-emerald-800 dark:text-emerald-300">
                <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate">Entradas</span>
              </div>
              <p className="text-sm sm:text-base font-extrabold text-emerald-700 dark:text-emerald-300 mt-1 truncate">
                {formatCurrency(totalReceitas)}
              </p>
            </div>

            <div
              onClick={() => onSelectTab('reports')}
              className="p-2.5 sm:p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-500/20 hover:border-rose-500/40 cursor-pointer transition-all flex flex-col justify-between"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-rose-800 dark:text-rose-300">
                <ArrowDownRight className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span className="truncate">Despesas</span>
              </div>
              <p className="text-sm sm:text-base font-extrabold text-rose-700 dark:text-rose-300 mt-1 truncate">
                {formatCurrency(totalDespesas)}
              </p>
            </div>
          </div>
        </div>

        {/* CARD SITUAÇÃO DAS DESPESAS DO MÊS */}
        <div className="md:col-span-6 bg-white dark:bg-[#18211D] border border-[#E2E8E4] dark:border-[#24312B] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
          <div className="border-b border-[#E2E8E4]/60 dark:border-[#24312B]/60 pb-2.5">
            <h3 className="text-xs font-bold font-display text-[#202724] dark:text-[#F7F4EA] uppercase tracking-wider flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-[#075C45] dark:text-[#78D9A6]" />
              Situação dos Pagamentos
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-2.5 my-3.5">
            {/* Pago */}
            <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate">Pago</span>
              </div>
              <p className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-1.5 truncate">
                {formatCurrency(totalPago)}
              </p>
              <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 truncate mt-0.5">
                {checklistResult ? checklistResult.stats.paidCount : 0} quitados
              </span>
            </div>

            {/* Próximo */}
            <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-500/20 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-amber-800 dark:text-amber-300">
                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="truncate">Próximo</span>
              </div>
              <p className="text-sm sm:text-base font-extrabold text-amber-700 dark:text-amber-300 mt-1.5 truncate">
                {formatCurrency(totalProximo)}
              </p>
              <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80 truncate mt-0.5">
                Próx. 3 dias
              </span>
            </div>

            {/* Atrasado / Hoje */}
            <div className={`p-3 rounded-xl border flex flex-col justify-between ${
              totalAtrasado > 0
                ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-500/30'
                : 'bg-[#F7F4EA]/70 dark:bg-[#101614] border-[#E2E8E4] dark:border-[#24312B]'
            }`}>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase">
                <AlertCircle className={`w-3.5 h-3.5 shrink-0 ${totalAtrasado > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[#5E6963] dark:text-[#95A39B]'}`} />
                <span className={`truncate ${totalAtrasado > 0 ? 'text-rose-800 dark:text-rose-300' : 'text-[#5E6963] dark:text-[#95A39B]'}`}>
                  Atrasado
                </span>
              </div>
              <p className={`text-sm sm:text-base font-extrabold mt-1.5 truncate ${totalAtrasado > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[#202724] dark:text-[#F7F4EA]'}`}>
                {formatCurrency(totalAtrasado)}
              </p>
              <span className={`text-[10px] truncate mt-0.5 ${totalAtrasado > 0 ? 'text-rose-700/80 dark:text-rose-400/80 font-bold' : 'text-[#5E6963] dark:text-[#95A39B]'}`}>
                {overdueItems.length + todayItems.length} vencidos
              </span>
            </div>
          </div>

          {/* Barra de Progresso Global do Mês */}
          {checklistResult && (
            <div className="pt-2 border-t border-[#E2E8E4]/60 dark:border-[#24312B]/60">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#5E6963] dark:text-[#95A39B] mb-1">
                <span>Progresso: {checklistResult.stats.paidCount} de {checklistResult.stats.totalItems} obrigações pagas</span>
                <span className="text-[#075C45] dark:text-[#78D9A6] font-extrabold">{checklistResult.stats.progressPercentage}%</span>
              </div>
              <div className="w-full bg-[#E2E8E4] dark:bg-[#24312B] h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#075C45] dark:bg-[#78D9A6] rounded-full transition-all duration-300"
                  style={{ width: `${checklistResult.stats.progressPercentage}%` }}
                />
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ==================================================
          4. NÍVEL 2: "PARA ONDE VAI O DINHEIRO?" (COMPOSIÇÃO DAS DESPESAS)
          Apenas os 3 pilares de despesas:
          Gastos Fixos (amber), Gastos Variáveis (rose), Parcelados (indigo)
          ================================================== */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#5E6963] dark:text-[#95A39B]">
            Composição das Despesas
          </h2>
          <button
            type="button"
            onClick={() => onSelectTab('reports')}
            className="text-xs font-bold text-[#075C45] dark:text-[#78D9A6] hover:underline"
          >
            Ver relatório completo →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          
          {/* 1. GASTOS FIXOS (AMBER) */}
          <div
            onClick={() => onSelectTab('fixed_expenses')}
            className="p-3.5 sm:p-4 rounded-2xl border border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20 hover:border-amber-500/40 hover:shadow-xs cursor-pointer transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                  Gastos Fixos
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-600/40 group-hover:text-amber-600 transition-colors" />
            </div>
            <div className="mt-3">
              <p className="text-xl sm:text-2xl font-extrabold font-display text-amber-800 dark:text-amber-300 truncate">
                {formatCurrency(totalFixed)}
              </p>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5 truncate">
                {countFixed} {countFixed === 1 ? 'compromisso recorrente' : 'compromissos recorrentes'}
              </p>
            </div>
          </div>

          {/* 2. GASTOS VARIÁVEIS (ROSE) */}
          <div
            onClick={() => onSelectTab('variable_expenses')}
            className="p-3.5 sm:p-4 rounded-2xl border border-rose-500/20 bg-rose-50/50 dark:bg-rose-950/20 hover:border-rose-500/40 hover:shadow-xs cursor-pointer transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-900 dark:text-rose-200">
                  Gastos Variáveis
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-rose-600/40 group-hover:text-rose-600 transition-colors" />
            </div>
            <div className="mt-3">
              <p className="text-xl sm:text-2xl font-extrabold font-display text-rose-800 dark:text-rose-300 truncate">
                {formatCurrency(totalVariable)}
              </p>
              <p className="text-[11px] text-rose-800/80 dark:text-rose-300/80 mt-0.5 truncate">
                {countVariable} {countVariable === 1 ? 'despesa eventual' : 'despesas eventuais'}
              </p>
            </div>
          </div>

          {/* 3. PARCELADOS (INDIGO) */}
          <div
            onClick={() => onSelectTab('installments')}
            className="p-3.5 sm:p-4 rounded-2xl border border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 hover:border-indigo-500/40 hover:shadow-xs cursor-pointer transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-200">
                  Parcelados
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-indigo-600/40 group-hover:text-indigo-600 transition-colors" />
            </div>
            <div className="mt-3">
              <p className="text-xl sm:text-2xl font-extrabold font-display text-indigo-800 dark:text-indigo-300 truncate">
                {formatCurrency(totalInstallments)}
              </p>
              <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300/80 mt-0.5 truncate">
                {countInstallments} {countInstallments === 1 ? 'parcela neste mês' : 'parcelas neste mês'}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* ==================================================
          5. NÍVEL 3: "O QUE PRECISA DA MINHA ATENÇÃO?" + DETALHES
          Checklist interativo, Próximos Vencimentos e Mini Calendário
          ================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        
        {/* CHECKLIST FINANCEIRO INTERATIVO (7 COLS) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#18211D] border border-[#E2E8E4] dark:border-[#24312B] rounded-2xl p-4 sm:p-5 flex flex-col shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2E8E4]/60 dark:border-[#24312B]/60 mb-3">
            <div>
              <h3 className="text-xs sm:text-sm font-bold font-display text-[#202724] dark:text-[#F7F4EA] uppercase tracking-wider flex items-center gap-1.5">
                <CalendarCheck className="w-4 h-4 text-[#075C45] dark:text-[#78D9A6]" />
                Checklist de Contas
              </h3>
              <p className="text-[11px] text-[#5E6963] dark:text-[#95A39B]">
                Marque as contas conforme forem pagas
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab('calendar')}
              className="text-xs font-bold text-[#075C45] dark:text-[#78D9A6] hover:underline"
            >
              Ver no calendário →
            </button>
          </div>

          {/* Filtros de Status do Checklist */}
          <div className="flex items-center gap-1 bg-[#F7F4EA] dark:bg-[#101614] p-1 rounded-xl border border-[#E2E8E4] dark:border-[#24312B] mb-3">
            <button
              type="button"
              onClick={() => setChecklistFilter('pending')}
              className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                checklistFilter === 'pending'
                  ? 'bg-white text-[#075C45] dark:bg-[#18211D] dark:text-[#78D9A6] shadow-xs'
                  : 'text-[#5E6963] dark:text-[#95A39B]'
              }`}
            >
              Pendentes ({checklistResult ? checklistResult.stats.pendingCount : 0})
            </button>
            <button
              type="button"
              onClick={() => setChecklistFilter('paid')}
              className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                checklistFilter === 'paid'
                  ? 'bg-white text-[#075C45] dark:bg-[#18211D] dark:text-[#78D9A6] shadow-xs'
                  : 'text-[#5E6963] dark:text-[#95A39B]'
              }`}
            >
              Pagas ({checklistResult ? checklistResult.stats.paidCount : 0})
            </button>
            <button
              type="button"
              onClick={() => setChecklistFilter('all')}
              className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                checklistFilter === 'all'
                  ? 'bg-white text-[#075C45] dark:bg-[#18211D] dark:text-[#78D9A6] shadow-xs'
                  : 'text-[#5E6963] dark:text-[#95A39B]'
              }`}
            >
              Todas ({checklistResult ? checklistResult.stats.totalItems : 0})
            </button>
          </div>

          {/* Lista de Itens do Checklist */}
          <div className="overflow-y-auto max-h-[300px] pr-1 space-y-2">
            {isLoading ? (
              <p className="text-xs text-center text-[#5E6963] py-4">Carregando...</p>
            ) : filteredChecklistItems.length === 0 ? (
              <div className="text-center py-3.5 px-3 border border-dashed border-[#E2E8E4] dark:border-[#24312B] rounded-xl bg-[#F7F4EA]/40 dark:bg-[#101614]/40 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#075C45]/50 dark:text-[#78D9A6]/50 shrink-0" />
                <p className="text-xs font-medium text-[#5E6963] dark:text-[#95A39B]">Nenhuma conta nesta categoria</p>
              </div>
            ) : (
              filteredChecklistItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                    item.status === 'paid'
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800/20'
                      : item.visualStatus === 'overdue' || item.visualStatus === 'today'
                      ? 'bg-rose-50/40 dark:bg-rose-950/10 border-rose-200 dark:border-rose-800/20'
                      : 'bg-[#F7F4EA]/40 dark:bg-[#101614]/40 border-[#E2E8E4] dark:border-[#24312B]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => handleToggleItemStatus(item)}
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                        item.status === 'paid'
                          ? 'bg-emerald-600 border-emerald-600 text-white dark:bg-emerald-500'
                          : 'border-[#5E6963] dark:border-[#95A39B] hover:border-[#075C45] dark:hover:border-[#78D9A6]'
                      }`}
                    >
                      {item.status === 'paid' && <Check className="w-3.5 h-3.5 stroke-[3.5]" />}
                    </button>
                    <div className="min-w-0">
                      <p className={`text-xs font-bold truncate ${item.status === 'paid' ? 'line-through text-[#5E6963] dark:text-[#95A39B]' : 'text-[#202724] dark:text-[#F7F4EA]'}`}>
                        {item.title}
                      </p>
                      <span className="text-[10px] text-[#5E6963] dark:text-[#95A39B] uppercase font-bold tracking-wider">
                        {item.sourceType === 'fixed' ? 'Fixo' : item.sourceType === 'variable' ? 'Variável' : 'Parcelado'} • Vence {item.dueDate.split('-').slice(2).join('/')}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xs sm:text-sm font-bold ${item.status === 'paid' ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#202724] dark:text-[#F7F4EA]'}`}>
                      {formatCurrency(item.amount)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PRÓXIMOS VENCIMENTOS & CALENDÁRIO (5 COLS) */}
        <div className="lg:col-span-5 space-y-3.5">
          
          {/* PRÓXIMOS VENCIMENTOS */}
          <div className="bg-white dark:bg-[#18211D] border border-[#E2E8E4] dark:border-[#24312B] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8E4]/60 dark:border-[#24312B]/60 mb-2.5">
              <h3 className="text-xs font-bold font-display text-[#202724] dark:text-[#F7F4EA] uppercase tracking-wider">
                Próximos Vencimentos
              </h3>
              <button
                type="button"
                onClick={() => onSelectTab('calendar')}
                className="text-[11px] font-bold text-[#075C45] dark:text-[#78D9A6] hover:underline"
              >
                Ver todos →
              </button>
            </div>

            <div className="space-y-2">
              {sortedUpcomingItems.length === 0 ? (
                <div className="text-center py-2.5 px-3 border border-dashed border-[#E2E8E4] dark:border-[#24312B] rounded-xl bg-[#F7F4EA]/40 dark:bg-[#101614]/40 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500/60 shrink-0" />
                  <p className="text-xs font-semibold text-[#075C45] dark:text-[#78D9A6]">Tudo em dia!</p>
                </div>
              ) : (
                sortedUpcomingItems.map((item) => {
                  const [, m, d] = item.dueDate.split('-');
                  let relativeLabel = 'Próximo';
                  let badgeStyle = 'bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-400';
                  if (item.visualStatus === 'overdue') {
                    relativeLabel = 'Atrasado';
                    badgeStyle = 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 font-bold';
                  } else if (item.visualStatus === 'today') {
                    relativeLabel = 'Hoje';
                    badgeStyle = 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 font-bold';
                  } else if (item.visualStatus === 'upcoming') {
                    relativeLabel = 'Amanhã';
                    badgeStyle = 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400';
                  }

                  return (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl border border-[#E2E8E4] dark:border-[#24312B] bg-[#F7F4EA]/40 dark:bg-[#101614]/40 flex items-center justify-between gap-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#202724] dark:text-[#F7F4EA] truncate">
                          {item.title}
                        </p>
                        <span className="text-[10px] text-[#5E6963] dark:text-[#95A39B] uppercase font-bold">
                          Vence {d}/{m} • {formatCurrency(item.amount)}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${badgeStyle}`}>
                        {relativeLabel}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* MINI CALENDÁRIO COM ANOTAÇÕES */}
          <div className="bg-white dark:bg-[#18211D] border border-[#E2E8E4] dark:border-[#24312B] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8E4]/60 dark:border-[#24312B]/60 mb-2.5">
              <h3 className="text-xs font-bold font-display text-[#202724] dark:text-[#F7F4EA] uppercase tracking-wider">
                Calendário Financeiro
              </h3>
              <button
                type="button"
                onClick={() => onSelectTab('calendar')}
                className="text-[11px] font-bold text-[#075C45] dark:text-[#78D9A6] hover:underline"
              >
                Mês completo →
              </button>
            </div>

            <div className="grid grid-cols-7 text-center gap-1 pb-1 border-b border-[#E2E8E4]/40 dark:border-[#24312B]/40">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((wd, i) => (
                <span key={i} className={`text-[10px] font-bold ${i === 0 || i === 6 ? 'text-rose-500' : 'text-[#5E6963]'}`}>
                  {wd}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 mt-1.5 justify-items-center items-center">
              {Array.from({ length: firstDayWeekday }).map((_, idx) => (
                <div key={`empty-${idx}`} className="w-7 h-7" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const isDaySelected = dayNum === selectedMiniDay;

                const hasDayItems = (itemsByDate[dStr] || []).length > 0;
                const hasDayNotes = (notesByDate[dStr] || []).length > 0;
                const hasDayOverdue = (itemsByDate[dStr] || []).some(i => i.visualStatus === 'overdue' && i.status === 'pending');

                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => setSelectedMiniDay(dayNum)}
                    className={`w-7 h-7 rounded-full flex flex-col items-center justify-center text-[11px] font-bold relative transition-all cursor-pointer ${
                      isDaySelected
                        ? 'bg-[#075C45] text-white dark:bg-[#78D9A6] dark:text-[#101614] shadow-xs'
                        : dStr === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
                        ? 'border border-[#075C45] dark:border-[#78D9A6] text-[#075C45] dark:text-[#78D9A6]'
                        : 'hover:bg-black/5 dark:hover:bg-white/5 text-[#202724] dark:text-[#F7F4EA]'
                    }`}
                  >
                    <span>{dayNum}</span>
                    <div className="absolute -bottom-0.5 flex gap-0.5 justify-center">
                      {hasDayItems && (
                        <span className={`w-1 h-1 rounded-full ${hasDayOverdue ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                      )}
                      {hasDayNotes && (
                        <span className="w-1 h-1 rounded-full bg-amber-500" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Detalhe do dia selecionado */}
            <div className="mt-2.5 p-2.5 rounded-xl bg-[#F7F4EA]/70 dark:bg-[#101614] border border-[#E2E8E4] dark:border-[#24312B] text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-[#E2E8E4]/60 dark:border-[#24312B]/60 font-bold text-[#075C45] dark:text-[#78D9A6]">
                <span>{selectedMiniDay} de {MONTH_NAMES[currentMonth - 1]}</span>
                <span className="text-[10px] uppercase">{miniSelectedDayItems.length} conta(s)</span>
              </div>
              {miniSelectedDayItems.length === 0 && miniSelectedDayNotes.length === 0 ? (
                <p className="text-[11px] text-[#5E6963] dark:text-[#95A39B] italic pt-1">
                  Nenhum compromisso agendado para este dia.
                </p>
              ) : (
                <div className="space-y-1 pt-1">
                  {miniSelectedDayItems.slice(0, 2).map(item => (
                    <div key={item.id} className="text-[11px] font-semibold text-[#202724] dark:text-[#F7F4EA] flex items-center justify-between">
                      <span className="truncate max-w-[70%]">• {item.title}</span>
                      <span className="shrink-0">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  {miniSelectedDayNotes.slice(0, 1).map(note => (
                    <div key={note.id} className="text-[11px] font-medium text-amber-700 dark:text-amber-400 flex items-start gap-1">
                      <StickyNote className="w-3 h-3 shrink-0 mt-0.5" />
                      <span className="truncate">{note.content}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ==================================================
          6. NÍVEL 4: AÇÕES RÁPIDAS
          ================================================== */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#5E6963] dark:text-[#95A39B] mb-2.5">
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          {/* + Nova Entrada */}
          <button
            type="button"
            onClick={() => onSelectTab('entries')}
            className="flex items-center justify-between p-3.5 rounded-2xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 hover:border-emerald-500/40 hover:shadow-xs cursor-pointer text-left transition-all group shrink-0 active:scale-98"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-xs sm:text-sm text-[#202724] dark:text-[#F7F4EA] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                  + Entrada
                </h4>
                <p className="text-[10px] text-[#5E6963] dark:text-[#95A39B] truncate">
                  Novas receitas
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-600/40 group-hover:text-emerald-600 transition-colors shrink-0" />
          </button>

          {/* + Gasto Fixo */}
          <button
            type="button"
            onClick={() => onSelectTab('fixed_expenses')}
            className="flex items-center justify-between p-3.5 rounded-2xl border border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20 hover:border-amber-500/40 hover:shadow-xs cursor-pointer text-left transition-all group shrink-0 active:scale-98"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-xs sm:text-sm text-[#202724] dark:text-[#F7F4EA] group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                  + Gasto Fixo
                </h4>
                <p className="text-[10px] text-[#5E6963] dark:text-[#95A39B] truncate">
                  Recorrentes
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-600/40 group-hover:text-amber-600 transition-colors shrink-0" />
          </button>

          {/* + Gasto Variável */}
          <button
            type="button"
            onClick={() => onSelectTab('variable_expenses')}
            className="flex items-center justify-between p-3.5 rounded-2xl border border-rose-500/20 bg-rose-50/50 dark:bg-rose-950/20 hover:border-rose-500/40 hover:shadow-xs cursor-pointer text-left transition-all group shrink-0 active:scale-98"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-xs sm:text-sm text-[#202724] dark:text-[#F7F4EA] group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors truncate">
                  + Gasto Variável
                </h4>
                <p className="text-[10px] text-[#5E6963] dark:text-[#95A39B] truncate">
                  Do dia a dia
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-rose-600/40 group-hover:text-rose-600 transition-colors shrink-0" />
          </button>

          {/* + Parcelamento */}
          <button
            type="button"
            onClick={() => onSelectTab('installments')}
            className="flex items-center justify-between p-3.5 rounded-2xl border border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 hover:border-indigo-500/40 hover:shadow-xs cursor-pointer text-left transition-all group shrink-0 active:scale-98"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-xs sm:text-sm text-[#202724] dark:text-[#F7F4EA] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                  + Parcelamento
                </h4>
                <p className="text-[10px] text-[#5E6963] dark:text-[#95A39B] truncate">
                  Compras em parcelas
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-indigo-600/40 group-hover:text-indigo-600 transition-colors shrink-0" />
          </button>

        </div>
      </div>

    </div>
  );
}
