import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { POUPAGAIO_MASCOT_URL } from '../../assets/mascot';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { entriesService } from '../../lib/services/entries';
import { checklistService, NormalizedChecklistExpense, MonthlyChecklistResult, FinancialAlert } from '../../lib/services/checklist';
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

  const [checklistResult, setChecklistResult] = useState<MonthlyChecklistResult | null>(null);
  const [entriesSummary, setEntriesSummary] = useState<EntriesSummary>({
    totalPlanned: 0,
    totalReceived: 0,
    totalPending: 0,
    count: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [checklistFilter, setChecklistFilter] = useState<'pending' | 'paid' | 'all'>('pending');
  const [actionError, setActionError] = useState<string | null>(null);

  // Load all operational financial data for the selected month/year
  const loadDashboardData = async () => {
    if (!currentSpace?.id) return;
    setIsLoading(true);
    setActionError(null);

    try {
      const [checklistRes, entriesRes] = await Promise.all([
        checklistService.getMonthlyChecklist(currentSpace.id, currentYear, currentMonth),
        entriesService.getMonthSummary(currentSpace.id, currentYear, currentMonth),
      ]);

      setChecklistResult(checklistRes);
      setEntriesSummary(entriesRes);
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
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth - 1);
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

  // Mascot dynamic messages (Section 4)
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

  return (
    <div className="w-full h-full md:max-h-[calc(100vh-120px)] md:overflow-hidden md:flex md:flex-col md:gap-3.5 pb-20 md:pb-0 animate-in fade-in duration-300">
      {actionError && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center justify-between shrink-0">
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} className="p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ==================================================
          1. HEADER OPERACIONAL COMPACTO (Shrink-0)
          ================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0 bg-white dark:bg-[#1E2220] p-3 rounded-2xl border border-[#E2E8E4] dark:border-[#2E3532] shadow-2xs">
        <div>
          <h1 className="text-base sm:text-lg font-bold font-display text-[#202724] dark:text-[#F4F4F5] tracking-tight">
            Olá, {firstName}! 👋
          </h1>
          <p className="text-[11px] text-[#5E6963] dark:text-[#95A39B]">
            Seu painel financeiro compacto para uso diário
          </p>
        </div>

        {/* Month Navigation Control */}
        <div className="flex items-center gap-1.5 self-start sm:self-center bg-[#F3F4F4] dark:bg-[#282E2B] p-1 rounded-xl border border-[#E2E8E4] dark:border-[#2E3532]">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#5E6963] dark:text-[#95A39B] cursor-pointer"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] sm:text-xs font-bold min-w-[90px] text-center font-display text-[#075C45] dark:text-[#78D9A6]">
            {MONTH_NAMES[currentMonth - 1]} {currentYear}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#5E6963] dark:text-[#95A39B] cursor-pointer"
            aria-label="Próximo mês"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ==================================================
          2. DICA DO POUPAGAIO — INSIGHT BAR (Shrink-0)
          ================================================== */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-1.5 shrink-0 rounded-xl border border-[#E2E8E4] dark:border-[#2E3532] bg-white dark:bg-[#1E2220] shadow-3xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg overflow-hidden border border-[#16A66A]/30 bg-[#F3F4F4] dark:bg-[#282E2B] p-0.5 shrink-0 flex items-center justify-center">
            <img
              src={POUPAGAIO_MASCOT_URL}
              alt="Poupagaio"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
            />
          </div>
          <p className="text-[11px] sm:text-xs text-[#202724] dark:text-[#F4F4F5] truncate font-medium">
            <span className="font-semibold text-[#075C45] dark:text-[#78D9A6] mr-1">Poupagaio diz:</span>
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
            className="shrink-0 text-[10px] font-bold text-[#075C45] hover:text-[#075C45]/80 dark:text-[#78D9A6] dark:hover:text-[#78D9A6]/80 flex items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-[#16A66A]/10 transition-colors cursor-pointer"
          >
            <span>{mascotActionLabel}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* ==================================================
          3. MAIN CONTENT GRID (Flex-1, min-h-0)
          ================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 flex-1 min-h-0">
        
        {/* LEFT COLUMN: Financial Health & Shortcuts (md:span-5) */}
        <div className="md:col-span-5 flex flex-col gap-3.5 min-h-0">
          
          {/* Card: Saldo do Mês (Destaque Principal) */}
          <Card className="border-[#E2E8E4] dark:border-[#2E3532] bg-white dark:bg-[#1E2220] shadow-xs shrink-0">
            <CardContent className="p-3.5 space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#E2E8E4]/60 dark:border-[#2E3532]/60">
                <div className="flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-[#16A66A]" />
                  <h2 className="text-xs font-bold font-display text-[#202724] dark:text-[#F4F4F5] uppercase tracking-wider">
                    Saldo do Mês
                  </h2>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[#5E6963] dark:text-[#95A39B] font-semibold">
                  {currentSpace?.name || 'Pessoal'}
                </span>
              </div>

              {/* Balanço Consolidado Principal */}
              <div className="p-3 rounded-xl bg-[#F8F9F8] dark:bg-[#18201D] border border-[#E2E8E4]/80 dark:border-[#2A312E] text-center space-y-0.5">
                <p className="text-[10px] uppercase font-bold text-[#5E6963] dark:text-[#95A39B]">
                  Balanço Disponível
                </p>
                <div className={`text-xl sm:text-2xl font-extrabold font-display tracking-tight ${saldoConsolidado < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[#075C45] dark:text-[#78D9A6]'}`}>
                  {formatCurrency(saldoConsolidado)}
                </div>
              </div>

              {/* Sub-indicadores Entradas vs Saídas */}
              <div className="grid grid-cols-2 gap-2">
                <div
                  onClick={() => onSelectTab('entries')}
                  className="p-2.5 rounded-xl bg-white dark:bg-[#1A1E1C] border border-[#E2E8E4] dark:border-[#2A312E] hover:border-emerald-500/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-1 text-[9px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Entradas</span>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-[#202724] dark:text-[#F4F4F5] mt-1 truncate">
                    {formatCurrency(totalReceitas)}
                  </p>
                </div>

                <div
                  onClick={() => onSelectTab('fixed_expenses')}
                  className="p-2.5 rounded-xl bg-white dark:bg-[#1A1E1C] border border-[#E2E8E4] dark:border-[#2A312E] hover:border-rose-500/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-1 text-[9px] uppercase font-bold text-rose-600 dark:text-rose-400">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    <span>Despesas</span>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-[#202724] dark:text-[#F4F4F5] mt-1 truncate">
                    {formatCurrency(totalDespesas)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card: Controle do Mês (Pago, Próximo, Atrasado) */}
          <Card className="border-[#E2E8E4] dark:border-[#2E3532] bg-white dark:bg-[#1E2220] shadow-xs flex-1 min-h-0 flex flex-col justify-between">
            <CardContent className="p-3.5 flex flex-col justify-between h-full space-y-3.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#E2E8E4]/60 dark:border-[#2E3532]/60">
                <h3 className="text-xs font-bold font-display text-[#202724] dark:text-[#F4F4F5] uppercase tracking-wider">
                  Situação do Mês
                </h3>
                <span className="text-[10px] text-[#5E6963] dark:text-[#95A39B] font-semibold">
                  Compromissos
                </span>
              </div>

              {/* 3 compact indicator rows */}
              <div className="space-y-2 flex-1 flex flex-col justify-center">
                {/* Pago */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/15">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] font-semibold text-[#5E6963] dark:text-[#95A39B]">Pago</span>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">{formatCurrency(totalPago)}</span>
                </div>

                {/* Próximo */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/15">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] font-semibold text-[#5E6963] dark:text-[#95A39B]">Próximo (Próx. 3 dias)</span>
                  </div>
                  <span className="text-xs font-extrabold text-amber-700 dark:text-amber-400">{formatCurrency(totalProximo)}</span>
                </div>

                {/* Atrasado */}
                <div className={`flex items-center justify-between p-2 rounded-xl border ${
                  totalAtrasado > 0
                    ? 'bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-400'
                    : 'bg-[#F8F9F8] dark:bg-[#1A1E1C]/40 border-[#E2E8E4]'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center ${totalAtrasado > 0 ? 'bg-rose-500/15 text-rose-600' : 'bg-black/5 dark:bg-white/10 text-[#5E6963]'}`}>
                      <AlertCircle className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] font-semibold text-[#5E6963] dark:text-[#95A39B]">Atrasado / Vence Hoje</span>
                  </div>
                  <span className={`text-xs font-extrabold ${totalAtrasado > 0 ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-[#202724] dark:text-[#F4F4F5]'}`}>
                    {formatCurrency(totalAtrasado)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Shortcuts */}
          <div className="grid grid-cols-4 gap-2 shrink-0">
            <button
              onClick={() => onSelectTab('entries')}
              className="flex flex-col items-center justify-center p-2 rounded-xl border border-[#E2E8E4] dark:border-[#2E3532] bg-white dark:bg-[#1E2220] hover:border-emerald-500/40 cursor-pointer text-center space-y-1 transition-colors group"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold text-[#202724] dark:text-[#F4F4F5] group-hover:text-[#075C45] dark:group-hover:text-[#78D9A6] truncate w-full">
                + Entrada
              </span>
            </button>

            <button
              onClick={() => onSelectTab('variable_expenses')}
              className="flex flex-col items-center justify-center p-2 rounded-xl border border-[#E2E8E4] dark:border-[#2E3532] bg-white dark:bg-[#1E2220] hover:border-rose-500/40 cursor-pointer text-center space-y-1 transition-colors group"
            >
              <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold text-[#202724] dark:text-[#F4F4F5] group-hover:text-rose-600 dark:group-hover:text-rose-400 truncate w-full">
                + Gasto
              </span>
            </button>

            <button
              onClick={() => onSelectTab('fixed_expenses')}
              className="flex flex-col items-center justify-center p-2 rounded-xl border border-[#E2E8E4] dark:border-[#2E3532] bg-white dark:bg-[#1E2220] hover:border-indigo-500/40 cursor-pointer text-center space-y-1 transition-colors group"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold text-[#202724] dark:text-[#F4F4F5] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate w-full">
                + Fixo
              </span>
            </button>

            <button
              onClick={() => onSelectTab('installments')}
              className="flex flex-col items-center justify-center p-2 rounded-xl border border-[#E2E8E4] dark:border-[#2E3532] bg-white dark:bg-[#1E2220] hover:border-amber-500/40 cursor-pointer text-center space-y-1 transition-colors group"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold text-[#202724] dark:text-[#F4F4F5] group-hover:text-amber-600 dark:group-hover:text-amber-400 truncate w-full">
                + Parcela
              </span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Checklist & Alertas Consolidados (md:span-7) */}
        <div className="md:col-span-7 flex flex-col min-h-0 bg-white dark:bg-[#1E2220] border border-[#E2E8E4] dark:border-[#2E3532] rounded-2xl shadow-xs p-4 gap-3">
          
          {/* Checklist Header */}
          <div className="flex items-center justify-between pb-1.5 border-b border-[#E2E8E4]/60 dark:border-[#2E3532]/60 shrink-0">
            <div>
              <h3 className="text-xs font-bold font-display text-[#202724] dark:text-[#F4F4F5] uppercase tracking-wider flex items-center gap-1.5">
                <CalendarCheck className="w-4 h-4 text-[#16A66A]" />
                Checklist Financeiro
              </h3>
              <p className="text-[10px] text-[#5E6963] dark:text-[#95A39B]">
                Marque e organize suas obrigações do mês
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onSelectTab('calendar')}
              className="rounded-xl border-[#E2E8E4] dark:border-[#2E3532] text-xs font-bold"
            >
              Calendário →
            </Button>
          </div>

          {/* Checklist Stats Progress Bar */}
          {checklistResult && (
            <div className="bg-[#F8F9F8] dark:bg-[#18201D] border border-[#E2E8E4]/80 dark:border-[#2A312E] rounded-xl p-2.5 space-y-1.5 shrink-0">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-[#5E6963] dark:text-[#95A39B]">
                  Progresso de Quitação: {checklistResult.stats.paidCount} de {checklistResult.stats.totalItems} pagos
                </span>
                <span className="text-[#075C45] dark:text-[#78D9A6]">
                  {checklistResult.stats.progressPercentage}%
                </span>
              </div>
              <div className="w-full bg-[#EBECEE] dark:bg-[#2A302D] h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#16A66A] rounded-full transition-all duration-300"
                  style={{ width: `${checklistResult.stats.progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Filters Bar */}
          <div className="flex items-center gap-1 shrink-0 bg-[#F3F4F4] dark:bg-[#282E2B] p-1 rounded-xl border border-[#E2E8E4]/80 dark:border-[#2E3532]/80">
            <button
              type="button"
              onClick={() => setChecklistFilter('pending')}
              className={`flex-1 text-center py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                checklistFilter === 'pending'
                  ? 'bg-white text-[#075C45] dark:bg-[#1E2220] dark:text-[#78D9A6] shadow-xs'
                  : 'text-[#5E6963] dark:text-[#95A39B] hover:text-[#202724] dark:hover:text-[#F4F4F5]'
              }`}
            >
              Pendentes ({checklistResult ? checklistResult.stats.pendingCount : 0})
            </button>
            <button
              type="button"
              onClick={() => setChecklistFilter('paid')}
              className={`flex-1 text-center py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                checklistFilter === 'paid'
                  ? 'bg-white text-[#075C45] dark:bg-[#1E2220] dark:text-[#78D9A6] shadow-xs'
                  : 'text-[#5E6963] dark:text-[#95A39B] hover:text-[#202724] dark:hover:text-[#F4F4F5]'
              }`}
            >
              Pagas ({checklistResult ? checklistResult.stats.paidCount : 0})
            </button>
            <button
              type="button"
              onClick={() => setChecklistFilter('all')}
              className={`flex-1 text-center py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                checklistFilter === 'all'
                  ? 'bg-white text-[#075C45] dark:bg-[#1E2220] dark:text-[#78D9A6] shadow-xs'
                  : 'text-[#5E6963] dark:text-[#95A39B] hover:text-[#202724] dark:hover:text-[#F4F4F5]'
              }`}
            >
              Todas ({checklistResult ? checklistResult.stats.totalItems : 0})
            </button>
          </div>

          {/* Scrollable Checklist Items List */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2">
            {isLoading ? (
              <p className="text-xs text-center text-[#5E6963] py-8">Carregando compromissos...</p>
            ) : filteredChecklistItems.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-[#E2E8E4] dark:border-[#2A312E] rounded-2xl bg-[#F8F9F8]/50 dark:bg-[#161918]/30">
                <CheckCircle2 className="w-7 h-7 text-emerald-500/40 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-[#202724] dark:text-[#F4F4F5]">
                  Nenhum compromisso nesta lista.
                </p>
                <p className="text-[10px] text-[#5E6963] dark:text-[#95A39B] mt-0.5">
                  Tudo quitado ou nenhum lançamento feito para esta competência.
                </p>
              </div>
            ) : (
              filteredChecklistItems.map((item) => {
                const formattedDate = item.dueDate.split('-').slice(2).join('/') + '/' + item.dueDate.split('-')[1];
                return (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                      item.status === 'paid'
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/15 border-emerald-200 dark:border-emerald-800/30'
                        : item.visualStatus === 'overdue' || item.visualStatus === 'today'
                        ? 'bg-rose-50/40 dark:bg-rose-950/15 border-rose-200 dark:border-rose-800/30 font-semibold'
                        : 'bg-[#F8F9F8]/60 dark:bg-[#1A1E1C]/60 border-[#E2E8E4] dark:border-[#2A312E]'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => handleToggleItemStatus(item)}
                        className={`mt-0.5 w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                          item.status === 'paid'
                            ? 'bg-emerald-600 border-emerald-600 text-white dark:bg-emerald-500'
                            : 'border-[#5E6963] dark:border-[#95A39B] hover:border-[#16A66A]'
                        }`}
                      >
                        {item.status === 'paid' && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>

                      <div className="min-w-0">
                        <p className={`text-xs font-bold truncate ${item.status === 'paid' ? 'line-through text-[#5E6963] dark:text-[#95A39B]' : 'text-[#202724] dark:text-[#F4F4F5]'}`}>
                          {item.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-[#5E6963] dark:text-[#95A39B]">
                          <span className="font-semibold text-black/20 dark:text-white/20">
                            {item.sourceType === 'fixed' ? 'Fixo' : item.sourceType === 'variable' ? 'Var' : `Parc ${item.installmentNumber}/${item.totalInstallments}`}
                          </span>
                          <span>•</span>
                          <span>{item.category}</span>
                          <span>•</span>
                          <span className={item.visualStatus === 'overdue' && item.status === 'pending' ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}>
                            Vence: {formattedDate}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className={`text-xs font-bold ${item.status === 'paid' ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#202724] dark:text-[#F4F4F5]'}`}>
                        {formatCurrency(item.amount)}
                      </p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded inline-block mt-0.5 ${
                        item.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : item.visualStatus === 'overdue'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 animate-pulse'
                          : item.visualStatus === 'today'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 font-extrabold'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                      }`}>
                        {item.status === 'paid' ? 'Pago' : item.visualStatus === 'overdue' ? 'Atrasado' : item.visualStatus === 'today' ? 'Hoje' : 'A Vencer'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
