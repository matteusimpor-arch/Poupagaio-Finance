import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { POUPAGAIO_MASCOT_URL } from '../../assets/mascot';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { entriesService } from '../../lib/services/entries';
import { checklistService, NormalizedChecklistExpense, MonthlyChecklistResult, FinancialAlert } from '../../lib/services/checklist';
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
  ChevronRight as ChevronIcon,
  CalendarCheck,
  StickyNote,
} from 'lucide-react';
import { ActiveTab, EntriesSummary } from '../../types';

interface DashboardHomeProps {
  onSelectTab: (tab: ActiveTab) => void;
}

export function DashboardHome({ onSelectTab }: DashboardHomeProps) {
  const { profile, user, currentSpace } = useAuth();
  const { theme, toggleTheme } = useTheme();

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

  // Load all operational financial data for the selected month/year
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

  // Toggle item payment status directly from checklist
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

  const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const MONTH_SHORT_NAMES = [
    'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN',
    'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'
  ];

  // Helper calculations for calendar
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayWeekday = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 = Sun

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

  // Próximos Vencimentos List (Line 4 LHS) - Sorted by urgency
  const rawPendingItems = checklistResult ? checklistResult.items.filter(i => i.status === 'pending') : [];
  const sortedUpcomingItems = [...rawPendingItems].sort((a, b) => {
    // Urgency sorting helper
    const dateA = new Date(a.dueDate).getTime();
    const dateB = new Date(b.dueDate).getTime();
    if (a.visualStatus === 'overdue' && b.visualStatus !== 'overdue') return -1;
    if (b.visualStatus === 'overdue' && a.visualStatus !== 'overdue') return 1;
    if (a.visualStatus === 'today' && b.visualStatus !== 'today') return -1;
    if (b.visualStatus === 'today' && a.visualStatus !== 'today') return 1;
    return dateA - dateB;
  }).slice(0, 3); // Showing exactly 3 items to preserve height matching with calendar

  return (
    <div className="w-full h-full animate-in fade-in duration-300">
      {actionError && (
        <div className="p-2 mb-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center justify-between shrink-0">
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} className="p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ==================================================
          A. DESKTOP VIEW (hidden md:flex)
          Utilizes full viewport height, fits exactly inside 768px+ screens
          ================================================== */}
      <div className="hidden md:flex md:flex-col md:gap-4 w-full md:h-[calc(100dvh-3.6rem)] md:min-h-[550px]">
        
        {/* RESUMO PRINCIPAL (Saldo, Situação, Checklist) */}
        <div className="grid grid-cols-12 gap-3.5 shrink-0">
          
          {/* CARD 1: SALDO DO MÊS */}
          <div className="col-span-4 bg-white dark:bg-[#1E2220] border border-[#E2E8E4] dark:border-[#2E3532] rounded-2xl p-4 flex flex-col justify-between shadow-3xs">
            <div className="bg-[#EAFDF5] dark:bg-[#0F2F23]/70 border border-[#A7F3D0] dark:border-[#105E41] rounded-xl p-3 text-center space-y-1 relative">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1 bg-white/85 dark:bg-[#18201D]/85 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800/40 shadow-3xs">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-0.5 hover:bg-black/5 dark:hover:bg-white/5 rounded text-emerald-800 dark:text-emerald-300 cursor-pointer transition-colors"
                    aria-label="Mês anterior"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 min-w-[65px] text-center font-display">
                    {MONTH_SHORT_NAMES[currentMonth - 1]} {currentYear}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-0.5 hover:bg-black/5 dark:hover:bg-white/5 rounded text-emerald-800 dark:text-emerald-300 cursor-pointer transition-colors"
                    aria-label="Próximo mês"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                {currentSpace?.name && (
                  <span className="text-[8px] font-extrabold tracking-wider uppercase bg-emerald-600 dark:bg-emerald-500 text-white dark:text-[#101614] px-1.5 py-0.5 rounded-md shadow-3xs">
                    {currentSpace.name}
                  </span>
                )}
              </div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Saldo do Mês
              </p>
              <div className={`text-2xl font-extrabold font-display tracking-tight ${saldoConsolidado < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[#075C45] dark:text-[#78D9A6]'}`}>
                {formatCurrency(saldoConsolidado)}
              </div>
              <p className="text-[9px] text-emerald-700/80 dark:text-emerald-400/80">
                Balanço disponível para esta competência
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3.5">
              <div
                onClick={() => onSelectTab('entries')}
                className="p-2.5 rounded-xl bg-[#F8F9F8] dark:bg-[#18201D] border border-[#E2E8E4] dark:border-[#2A312E] hover:border-emerald-500/40 cursor-pointer transition-all flex flex-col justify-between"
              >
                <div className="flex items-center gap-1 text-[9px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                  <span>Entradas</span>
                </div>
                <p className="text-xs font-bold text-[#202724] dark:text-[#F4F4F5] mt-1.5 truncate">
                  {formatCurrency(totalReceitas)}
                </p>
                <span className="text-[8px] text-[#5E6963] dark:text-[#95A39B] mt-0.5 block truncate">
                  Receitas planejadas
                </span>
              </div>

              <div
                onClick={() => onSelectTab('fixed_expenses')}
                className="p-2.5 rounded-xl bg-[#F8F9F8] dark:bg-[#18201D] border border-[#E2E8E4] dark:border-[#2A312E] hover:border-rose-500/40 cursor-pointer transition-all flex flex-col justify-between"
              >
                <div className="flex items-center gap-1 text-[9px] uppercase font-bold text-rose-600 dark:text-rose-400">
                  <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
                  <span>Despesas</span>
                </div>
                <p className="text-xs font-bold text-[#202724] dark:text-[#F4F4F5] mt-1.5 truncate">
                  {formatCurrency(totalDespesas)}
                </p>
                <span className="text-[8px] text-[#5E6963] dark:text-[#95A39B] mt-0.5 block truncate">
                  Total planejado
                </span>
              </div>
            </div>
          </div>

          {/* CARD 2: SITUAÇÃO DO MÊS */}
          <div className="col-span-3 bg-white dark:bg-[#1E2220] border border-[#E2E8E4] dark:border-[#2E3532] rounded-2xl p-4 flex flex-col shadow-3xs">
            <div className="border-b border-[#E2E8E4]/60 dark:border-[#2E3532]/60 pb-1.5">
              <h3 className="text-xs font-bold font-display text-[#202724] dark:text-[#F4F4F5] uppercase tracking-wider">
                Situação do Mês
              </h3>
            </div>

            <div className="space-y-2.5 mt-3">
              <div className="p-2 rounded-xl bg-[#F0FDF4] dark:bg-[#0D241A] border border-[#D1FAE5] dark:border-[#154631] flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase text-emerald-800 dark:text-emerald-300">Pago</p>
                    <p className="text-[8px] text-[#5E6963] dark:text-[#95A39B] truncate">
                      {checklistResult ? checklistResult.stats.paidCount : 0} quitados
                    </p>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(totalPago)}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-[#FFFBEB] dark:bg-[#251F10] border border-[#FEF3C7] dark:border-[#4B3B1B] flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase text-amber-800 dark:text-amber-300">Próximo</p>
                    <p className="text-[8px] text-[#5E6963] dark:text-[#95A39B] truncate">
                      Próx. 3 dias
                    </p>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-amber-700 dark:text-amber-400">
                  {formatCurrency(totalProximo)}
                </span>
              </div>

              <div className={`p-2 rounded-xl flex items-center justify-between border ${
                totalAtrasado > 0
                  ? 'bg-[#FEF2F2] dark:bg-[#261214] border-[#FEE2E2] dark:border-[#4F1A21]'
                  : 'bg-[#F8F9F8] dark:bg-[#1A1E1C]/40 border-[#E2E8E4]'
              }`}>
                <div className="flex items-center gap-1.5 min-w-0">
                  <AlertCircle className={`w-3.5 h-3.5 shrink-0 ${totalAtrasado > 0 ? 'text-rose-600' : 'text-[#5E6963]'}`} />
                  <div className="min-w-0">
                    <p className={`text-[9px] font-bold uppercase ${totalAtrasado > 0 ? 'text-rose-800 dark:text-rose-300' : 'text-[#5E6963]'}`}>
                      Atrasado / Hoje
                    </p>
                    <p className="text-[8px] text-[#5E6963] dark:text-[#95A39B] truncate">
                      {overdueItems.length + todayItems.length} vencimentos
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-extrabold ${totalAtrasado > 0 ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-[#202724] dark:text-[#F4F4F5]'}`}>
                  {formatCurrency(totalAtrasado)}
                </span>
              </div>
            </div>
          </div>

          {/* CARD 3: CHECKLIST FINANCEIRO */}
          <div className="col-span-5 bg-white dark:bg-[#1E2220] border border-[#E2E8E4] dark:border-[#2E3532] rounded-2xl p-4 flex flex-col shadow-3xs">
            <div className="flex items-center justify-between pb-1 border-b border-[#E2E8E4]/60 dark:border-[#2E3532]/60">
              <div>
                <h3 className="text-xs font-bold font-display text-[#202724] dark:text-[#F4F4F5] uppercase tracking-wider flex items-center gap-1">
                  <CalendarCheck className="w-3.5 h-3.5 text-[#16A66A]" />
                  Checklist Financeiro
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab('calendar')}
                className="text-[10px] font-bold text-[#075C45] dark:text-[#78D9A6] hover:underline"
              >
                Ver calendário →
              </button>
            </div>

            {checklistResult && (
              <div className="my-1.5">
                <div className="flex items-center justify-between text-[9px] font-bold text-[#5E6963] dark:text-[#95A39B] mb-0.5">
                  <span>Progresso: {checklistResult.stats.paidCount} de {checklistResult.stats.totalItems} pagos</span>
                  <span className="text-[#075C45] dark:text-[#78D9A6] font-extrabold">{checklistResult.stats.progressPercentage}%</span>
                </div>
                <div className="w-full bg-[#EBECEE] dark:bg-[#2A302D] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#16A66A] rounded-full transition-all duration-300"
                    style={{ width: `${checklistResult.stats.progressPercentage}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-1 bg-[#F3F4F4] dark:bg-[#282E2B] p-0.5 rounded-lg border border-[#E2E8E4]/80 dark:border-[#2E3532]/80 shrink-0 mb-1.5">
              <button
                type="button"
                onClick={() => setChecklistFilter('pending')}
                className={`flex-1 text-center py-0.5 rounded text-[9px] font-bold cursor-pointer transition-colors ${
                  checklistFilter === 'pending'
                    ? 'bg-white text-[#075C45] dark:bg-[#1E2220] dark:text-[#78D9A6] shadow-3xs'
                    : 'text-[#5E6963] dark:text-[#95A39B]'
                }`}
              >
                Pendentes ({checklistResult ? checklistResult.stats.pendingCount : 0})
              </button>
              <button
                type="button"
                onClick={() => setChecklistFilter('paid')}
                className={`flex-1 text-center py-0.5 rounded text-[9px] font-bold cursor-pointer transition-colors ${
                  checklistFilter === 'paid'
                    ? 'bg-white text-[#075C45] dark:bg-[#1E2220] dark:text-[#78D9A6] shadow-3xs'
                    : 'text-[#5E6963] dark:text-[#95A39B]'
                }`}
              >
                Pagas ({checklistResult ? checklistResult.stats.paidCount : 0})
              </button>
              <button
                type="button"
                onClick={() => setChecklistFilter('all')}
                className={`flex-1 text-center py-0.5 rounded text-[9px] font-bold cursor-pointer transition-colors ${
                  checklistFilter === 'all'
                    ? 'bg-white text-[#075C45] dark:bg-[#1E2220] dark:text-[#78D9A6] shadow-3xs'
                    : 'text-[#5E6963] dark:text-[#95A39B]'
                }`}
              >
                Todas ({checklistResult ? checklistResult.stats.totalItems : 0})
              </button>
            </div>

            <div className="overflow-y-auto max-h-[140px] pr-1 space-y-1.5">
              {isLoading ? (
                <p className="text-[10px] text-center text-[#5E6963] py-4">Carregando...</p>
              ) : filteredChecklistItems.length === 0 ? (
                <div className="text-center py-4 border border-dashed border-[#E2E8E4] dark:border-[#2A312E] rounded-xl bg-[#F8F9F8]/50 dark:bg-[#161918]/30">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500/30 mx-auto mb-1" />
                  <p className="text-[10px] font-bold text-[#202724] dark:text-[#F4F4F5]">Tudo limpo!</p>
                </div>
              ) : (
                filteredChecklistItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-2 rounded-xl border flex items-center justify-between gap-2.5 transition-colors ${
                      item.status === 'paid'
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800/20'
                        : item.visualStatus === 'overdue' || item.visualStatus === 'today'
                        ? 'bg-rose-50/40 dark:bg-rose-950/10 border-rose-200 dark:border-rose-800/20 font-semibold'
                        : 'bg-[#F8F9F8]/60 dark:bg-[#1A1E1C]/60 border-[#E2E8E4] dark:border-[#2A312E]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => handleToggleItemStatus(item)}
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                          item.status === 'paid'
                            ? 'bg-emerald-600 border-emerald-600 text-white dark:bg-emerald-500'
                            : 'border-[#5E6963] dark:border-[#95A39B] hover:border-[#16A66A]'
                        }`}
                      >
                        {item.status === 'paid' && <Check className="w-2.5 h-2.5 stroke-[3.5]" />}
                      </button>
                      <div className="min-w-0">
                        <p className={`text-[11px] font-bold truncate ${item.status === 'paid' ? 'line-through text-[#5E6963] dark:text-[#95A39B]' : 'text-[#202724] dark:text-[#F4F4F5]'}`}>
                          {item.title}
                        </p>
                        <span className="text-[8px] text-[#5E6963] dark:text-[#95A39B] uppercase font-bold tracking-wider">
                          {item.category} • Vence {item.dueDate.split('-').slice(2).join('/')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-[11px] font-bold ${item.status === 'paid' ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#202724] dark:text-[#F4F4F5]'}`}>
                        {formatCurrency(item.amount)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* LINHA 4: PRÓXIMOS VENCIMENTOS + CALENDÁRIO DO MÊS */}
        <div className="grid grid-cols-12 gap-3.5 flex-grow flex-shrink flex-1 min-h-0">
          
          {/* COLUNA ESQUERDA: PRÓXIMOS VENCIMENTOS */}
          <div className="col-span-5 bg-white dark:bg-[#1E2220] border border-[#E2E8E4] dark:border-[#2E3532] rounded-2xl p-4 flex flex-col shadow-3xs h-full">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#E2E8E4]/60 dark:border-[#2E3532]/60 shrink-0 mb-3">
              <div>
                <h3 className="text-xs font-bold font-display text-[#202724] dark:text-[#F4F4F5] uppercase tracking-wider">
                  Próximos Vencimentos
                </h3>
                <p className="text-[9px] text-[#5E6963] dark:text-[#95A39B]">
                  Suas próximas contas e compromissos
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab('fixed_expenses')}
                className="text-[10px] font-bold text-[#075C45] dark:text-[#78D9A6] hover:underline"
              >
                Ver todos →
              </button>
            </div>

            <div className="flex-grow flex-shrink flex-1 min-h-0 flex flex-col justify-center">
              {sortedUpcomingItems.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-[#E2E8E4] dark:border-[#2A312E] rounded-xl bg-[#F8F9F8]/50 dark:bg-[#161918]/30 my-auto">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500/30 mx-auto mb-1" />
                  <p className="text-[10px] font-semibold text-[#202724] dark:text-[#F4F4F5]">Tudo pago por enquanto!</p>
                </div>
              ) : (
                <div className="space-y-2 flex-1 overflow-y-auto pr-0.5">
                  {sortedUpcomingItems.map((item) => {
                    const [, m, d] = item.dueDate.split('-');
                    const shortMonth = MONTH_SHORT_NAMES[Number(m) - 1];
                    
                    let relativeLabel = 'Próximo';
                    let badgeStyle = 'bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-400';
                    if (item.visualStatus === 'overdue') {
                      relativeLabel = 'Atrasado';
                      badgeStyle = 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 animate-pulse';
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
                        className="p-2.5 rounded-xl border border-[#E2E8E4] dark:border-[#2A312E] bg-white dark:bg-[#1A1E1C] flex items-center justify-between gap-3 group hover:border-[#16A66A]/40 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-[#F3F4F4] dark:bg-[#282E2B] flex flex-col items-center justify-center border border-[#E2E8E4] dark:border-[#2E3532] shrink-0 select-none">
                            <span className="text-[13px] font-extrabold text-[#202724] dark:text-[#F4F4F5] leading-none">
                              {d}
                            </span>
                            <span className="text-[7px] font-bold text-[#5E6963] dark:text-[#95A39B] tracking-wider mt-0.5 leading-none">
                              {shortMonth}
                            </span>
                          </div>

                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-[#202724] dark:text-[#F4F4F5] truncate leading-normal">
                              {item.title}
                            </h4>
                            <span className="text-[9px] text-[#5E6963] dark:text-[#95A39B] block truncate leading-none mt-0.5">
                              {item.sourceType === 'fixed' ? 'Gasto fixo' : item.sourceType === 'variable' ? 'Gasto variável' : 'Parcelado'} • {formatCurrency(item.amount)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${badgeStyle}`}>
                            {relativeLabel}
                          </span>
                          <ChevronIcon className="w-3.5 h-3.5 text-[#5E6963]/40 group-hover:text-[#16A66A] transition-colors" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* COLUNA DIREITA: CALENDÁRIO COMPACTO */}
          <div className="col-span-7 bg-white dark:bg-[#1E2220] border border-[#E2E8E4] dark:border-[#2E3532] rounded-2xl p-4 flex flex-col shadow-3xs h-full">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#E2E8E4]/60 dark:border-[#2E3532]/60 shrink-0 mb-3">
              <div>
                <h3 className="text-xs font-bold font-display text-[#202724] dark:text-[#F4F4F5] uppercase tracking-wider">
                  Calendário do Mês
                </h3>
                <p className="text-[9px] text-[#5E6963] dark:text-[#95A39B]">
                  Visualize seus vencimentos e anotações
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab('calendar')}
                className="text-[10px] font-bold text-[#075C45] dark:text-[#78D9A6] hover:underline"
              >
                Ver mês completo →
              </button>
            </div>

            <div className="flex-grow flex-shrink flex-1 min-h-0 flex flex-row gap-4">
              
              {/* Matrix days left */}
              <div className="w-[58%] flex flex-col h-full justify-between">
                <div className="grid grid-cols-7 text-center gap-1.5 pb-1 border-b border-[#E2E8E4]/40 dark:border-[#2E3532]/40">
                  {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((wd, i) => (
                    <span key={i} className={`text-[8px] font-bold ${i === 0 || i === 6 ? 'text-rose-500' : 'text-[#5E6963]'}`}>
                      {wd}
                    </span>
                  ))}
                </div>

                <div className="flex-grow grid grid-cols-7 gap-x-1.5 gap-y-1 sm:gap-y-1.5 mt-2 justify-items-center items-center content-around">
                  {Array.from({ length: firstDayWeekday }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="w-5.5 h-5.5" />
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
                        className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex flex-col items-center justify-center text-[10px] md:text-xs font-bold relative transition-all cursor-pointer ${
                          isDaySelected
                            ? 'bg-[#16A66A] text-white dark:text-[#101614] scale-105 shadow-3xs'
                            : dStr === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
                            ? 'border border-[#075C45] dark:border-[#78D9A6] text-[#075C45] dark:text-[#78D9A6]'
                            : 'hover:bg-black/5 dark:hover:bg-white/5 text-[#202724] dark:text-[#F4F4F5]'
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
              </div>

              {/* Day details right */}
              <div className="w-[42%] bg-[#F8F9F8] dark:bg-[#18201D] border border-[#E2E8E4] dark:border-[#2A312E] rounded-xl p-3 flex flex-col justify-between h-full">
                <div className="space-y-2 flex-grow flex-shrink flex-1 min-h-0 overflow-y-auto pr-0.5">
                  <div className="flex items-center justify-between pb-1 border-b border-[#E2E8E4]/60 dark:border-[#2E3532]/60 sticky top-0 bg-[#F8F9F8] dark:bg-[#18201D] z-10">
                    <span className="text-[10px] font-bold text-[#075C45] dark:text-[#78D9A6]">
                      {selectedMiniDay} de {MONTH_NAMES[currentMonth - 1].toLowerCase()}
                    </span>
                    <span className="text-[8px] uppercase tracking-wider font-extrabold bg-[#16A66A]/15 text-[#075C45] dark:text-[#78D9A6] px-1.5 py-0.5 rounded">
                      Info
                    </span>
                  </div>

                  {miniSelectedDayItems.length === 0 && miniSelectedDayNotes.length === 0 ? (
                    <p className="text-[9px] text-[#5E6963] dark:text-[#95A39B] italic pt-4 text-center">
                      Nenhum lançamento ou nota.
                    </p>
                  ) : (
                    <div className="space-y-1.5 pt-1">
                      {miniSelectedDayItems.slice(0, 2).map(item => (
                        <div key={item.id} className="text-[9px] font-semibold text-[#202724] dark:text-[#F4F4F5] flex items-center justify-between">
                          <span className="truncate max-w-[70%]">• {item.title}</span>
                          <span className="shrink-0">{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                      {miniSelectedDayNotes.slice(0, 2).map(note => (
                        <div key={note.id} className="text-[9px] font-medium text-amber-700 dark:text-amber-400 flex items-start gap-1">
                          <StickyNote className="w-2.5 h-2.5 shrink-0 mt-0.5" />
                          <span className="break-words line-clamp-2">{note.content}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onSelectTab('calendar')}
                  className="mt-2 w-full text-center text-[9px] font-bold text-[#16A66A] hover:underline flex items-center justify-center gap-0.5 shrink-0 pt-1"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>Gerenciar anotações</span>
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* ==================================================
          B. MOBILE VIEW (flex flex-col md:hidden)
          Highly streamlined, compact operational cards only
          ================================================== */}
      <div className="flex flex-col md:hidden gap-3.5 pb-20">
        
        {/* CABEÇALHO COMPACTO MOBILE */}
        <div className="flex items-center justify-between bg-white dark:bg-[#1E2220] px-3.5 py-2.5 rounded-xl border border-[#E2E8E4] dark:border-[#2E3532] shadow-3xs">
          <div>
            <h1 className="text-sm font-bold font-display text-[#202724] dark:text-[#F4F4F5] tracking-tight">
              Olá, {firstName}! 👋
            </h1>
            <p className="text-[9px] text-[#5E6963] dark:text-[#95A39B]">
              Organize suas contas hoje.
            </p>
          </div>

          {/* Selector */}
          <div className="flex items-center gap-1.5 bg-[#F3F4F4] dark:bg-[#282E2B] p-0.5 rounded-lg border border-[#E2E8E4] dark:border-[#2E3532]">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-[#5E6963] dark:text-[#95A39B] cursor-pointer"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <span className="text-[10px] font-bold min-w-[75px] text-center font-display text-[#075C45] dark:text-[#78D9A6]">
              {MONTH_SHORT_NAMES[currentMonth - 1]} {currentYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-[#5E6963] dark:text-[#95A39B] cursor-pointer"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* ALERTA POUPAGAIO (Omitido se não houver atrasos/hoje) */}
        {overdueItems.length > 0 || todayItems.length > 0 ? (
          <div className="flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-800/30 bg-rose-500/5 dark:bg-rose-950/20 shadow-3xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg overflow-hidden border border-[#16A66A]/30 bg-[#F3F4F4] dark:bg-[#282E2B] p-0.5 shrink-0 flex items-center justify-center">
                <img
                  src={POUPAGAIO_MASCOT_URL}
                  alt="Poupagaio"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-[10px] text-rose-800 dark:text-rose-300 truncate font-semibold">
                {mascotMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab('fixed_expenses')}
              className="shrink-0 text-[10px] font-bold text-rose-700 dark:text-rose-400 flex items-center gap-0.5"
            >
              <span>Ver</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </button>
          </div>
        ) : null}

        {/* CARD UNIFICADO: SALDO DO MÊS */}
        <div className="bg-white dark:bg-[#1E2220] border border-[#E2E8E4] dark:border-[#2E3532] rounded-2xl p-4 shadow-3xs">
          <div className="flex items-center justify-between border-b border-[#E2E8E4]/60 dark:border-[#2E3532]/60 pb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded bg-[#16A66A]/10 text-[#075C45] dark:text-[#78D9A6] flex items-center justify-center">
                <Wallet className="w-3 h-3" />
              </div>
              <span className="text-[10px] font-bold text-[#5E6963] dark:text-[#95A39B] uppercase tracking-wider">Saldo do Mês</span>
            </div>
            <span className="text-[9px] font-bold text-[#075C45] dark:text-[#78D9A6] uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
              Disponível
            </span>
          </div>

          <div className="mt-3 text-center">
            <h2 className={`text-3xl font-extrabold font-display tracking-tight ${saldoConsolidado < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[#075C45] dark:text-[#78D9A6]'}`}>
              {formatCurrency(saldoConsolidado)}
            </h2>
            <p className="text-[9px] text-[#5E6963] dark:text-[#95A39B] mt-0.5">
              Balanço projetado para esta competência
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4 pt-3.5 border-t border-[#E2E8E4]/60 dark:border-[#2E3532]/60">
            <div className="bg-[#F8F9F8] dark:bg-[#1A1D1B] rounded-xl p-2.5 border border-[#E2E8E4]/60 dark:border-[#2A312E]/60 text-center">
              <p className="text-[9px] uppercase font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> Entradas
              </p>
              <p className="text-sm font-bold text-[#202724] dark:text-[#F4F4F5] mt-1">
                {formatCurrency(totalReceitas)}
              </p>
            </div>
            <div className="bg-[#F8F9F8] dark:bg-[#1A1D1B] rounded-xl p-2.5 border border-[#E2E8E4]/60 dark:border-[#2A312E]/60 text-center">
              <p className="text-[9px] uppercase font-bold text-rose-600 dark:text-rose-400 flex items-center justify-center gap-0.5">
                <ArrowDownRight className="w-3 h-3" /> Despesas
              </p>
              <p className="text-sm font-bold text-[#202724] dark:text-[#F4F4F5] mt-1">
                {formatCurrency(totalDespesas)}
              </p>
            </div>
          </div>
        </div>

        {/* SITUAÇÃO DO MÊS MOBILE COMPACTA */}
        <div className="bg-white dark:bg-[#1E2220] border border-[#E2E8E4] dark:border-[#2E3532] rounded-2xl p-3.5 shadow-3xs">
          <p className="text-[10px] font-bold text-[#5E6963] dark:text-[#95A39B] uppercase tracking-wider mb-2.5">Situação do Mês</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded-xl bg-[#F0FDF4] dark:bg-[#0D241A] border border-[#D1FAE5]/60 dark:border-[#154631]/40 text-center">
              <span className="text-[8px] font-bold uppercase text-emerald-800 dark:text-emerald-300 block">Pago</span>
              <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 block mt-0.5">
                {formatCurrency(totalPago)}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-[#FFFBEB] dark:bg-[#251F10] border border-[#FEF3C7]/60 dark:border-[#4B3B1B]/40 text-center">
              <span className="text-[8px] font-bold uppercase text-amber-800 dark:text-amber-300 block">Próximo</span>
              <span className="text-xs font-extrabold text-amber-700 dark:text-amber-400 block mt-0.5">
                {formatCurrency(totalProximo)}
              </span>
            </div>
            <div className={`p-2 rounded-xl border text-center ${
              totalAtrasado > 0 
                ? 'bg-[#FEF2F2] dark:bg-[#261214] border-[#FEE2E2]/60 dark:border-[#4F1A21]/40' 
                : 'bg-[#F8F9F8] dark:bg-[#1A1E1C]/40 border-[#E2E8E4]/60'
            }`}>
              <span className={`text-[8px] font-bold uppercase block ${totalAtrasado > 0 ? 'text-rose-800 dark:text-rose-300' : 'text-[#5E6963]'}`}>Atrasado</span>
              <span className={`text-xs font-extrabold block mt-0.5 ${totalAtrasado > 0 ? 'text-rose-600 dark:text-rose-400 font-extrabold animate-pulse' : 'text-[#202724] dark:text-[#F4F4F5]'}`}>
                {formatCurrency(totalAtrasado)}
              </span>
            </div>
          </div>
        </div>

        {/* PRÓXIMOS COMPROMISSOS MOBILE */}
        <div className="bg-white dark:bg-[#1E2220] border border-[#E2E8E4] dark:border-[#2E3532] rounded-2xl p-4 shadow-3xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2E8E4]/60 dark:border-[#2E3532]/60 mb-3">
            <h3 className="text-xs font-bold font-display text-[#202724] dark:text-[#F4F4F5] uppercase tracking-wider">
              Próximos Compromissos
            </h3>
            <span className="text-[8px] uppercase font-extrabold bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded">
              Lembretes
            </span>
          </div>

          <div className="space-y-2">
            {sortedUpcomingItems.length === 0 ? (
              <div className="text-center py-5 border border-dashed border-[#E2E8E4]/60 dark:border-[#2E3532]/60 rounded-xl bg-[#F8F9F8]/50 dark:bg-[#161918]/30">
                <CheckCircle2 className="w-5 h-5 text-emerald-500/30 mx-auto mb-1" />
                <p className="text-[10px] font-semibold text-[#202724] dark:text-[#F4F4F5]">Tudo pago por enquanto!</p>
              </div>
            ) : (
              sortedUpcomingItems.map((item) => {
                const [, m, d] = item.dueDate.split('-');
                let relativeLabel = 'Próximo';
                if (item.visualStatus === 'overdue') relativeLabel = 'Atrasado';
                else if (item.visualStatus === 'today') relativeLabel = 'Hoje';
                else if (item.visualStatus === 'upcoming') relativeLabel = 'Amanhã';

                return (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-[#F3F4F4]/60 dark:border-[#282E2B]/60 last:border-0 last:pb-0">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-xs font-bold text-[#202724] dark:text-[#F4F4F5] truncate">{item.title}</p>
                      <span className="text-[9px] text-[#5E6963] dark:text-[#95A39B] uppercase font-bold tracking-wider">
                        Vence {d}/{m} • {item.sourceType === 'fixed' ? 'Fixo' : item.sourceType === 'variable' ? 'Variável' : 'Parcelado'}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-[#202724] dark:text-[#F4F4F5]">{formatCurrency(item.amount)}</p>
                      <span className={`text-[8px] font-extrabold uppercase px-1 py-0.5 rounded ${
                        item.visualStatus === 'overdue' 
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 animate-pulse' 
                          : item.visualStatus === 'today' 
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 font-bold' 
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                      }`}>
                        {relativeLabel}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#E2E8E4]/60 dark:border-[#2E3532]/60">
            <button
              type="button"
              onClick={() => onSelectTab('calendar')}
              className="w-full py-2 rounded-xl bg-[#F3F4F4] hover:bg-[#16A66A]/10 dark:bg-[#282E2B] text-center text-xs font-bold text-[#075C45] dark:text-[#78D9A6] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Ver calendário do mês completo</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
