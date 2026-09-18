import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { POUPAGAIO_MASCOT_URL } from '../../assets/mascot';
import { MascotWidget } from './MascotWidget';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar } from '../ui/avatar';
import { entriesService } from '../../lib/services/entries';
import { fixedExpensesService } from '../../lib/services/fixedExpenses';
import { variableExpensesService } from '../../lib/services/variableExpenses';
import { installmentsService, emptyMonthSummary } from '../../lib/services/installments';
import { formatCurrency } from '../../lib/formatters';
import {
  EntriesSummary,
  FixedExpensesSummary,
  VariableExpensesSummary,
  InstallmentsMonthSummary,
} from '../../types';
import {
  Bell,
  Sun,
  Moon,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  FileText,
  Calendar,
  TrendingUp,
  Target,
  Gift,
  ShoppingBag,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight,
  X,
  Info,
  Sparkles,
} from 'lucide-react';
import { ActiveTab } from '../../types';
import { QUICK_ACTION_ITEMS } from '../../lib/constants/quickActions';

interface DashboardHomeProps {
  onSelectTab: (tab: ActiveTab) => void;
}

export function DashboardHome({ onSelectTab }: DashboardHomeProps) {
  const { profile, user, currentSpace } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  // Real Supabase entries and expenses state for current month
  const [entriesSummary, setEntriesSummary] = useState<EntriesSummary>({
    totalPlanned: 0,
    totalReceived: 0,
    totalPending: 0,
    count: 0,
  });
  const [fixedSummary, setFixedSummary] = useState<FixedExpensesSummary>({
    totalMonth: 0,
    totalPaid: 0,
    totalPending: 0,
    totalUpcoming: 0,
    totalOverdue: 0,
    count: 0,
    paidCount: 0,
    upcomingCount: 0,
    overdueCount: 0,
  });
  const [variableSummary, setVariableSummary] = useState<VariableExpensesSummary>({
    totalMonth: 0,
    totalPaid: 0,
    totalPending: 0,
    count: 0,
    paidCount: 0,
    pendingCount: 0,
  });
  const [installmentsSummary, setInstallmentsSummary] = useState<InstallmentsMonthSummary>(emptyMonthSummary);
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadAllData() {
      if (!currentSpace?.id) return;
      setIsLoadingData(true);
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      try {
        const [entriesResult, fixedResult, variableResult, installmentsResult] = await Promise.allSettled([
          entriesService.getMonthSummary(currentSpace.id, year, month),
          fixedExpensesService.getMonthSummary(currentSpace.id, year, month),
          variableExpensesService.getMonthSummary(currentSpace.id, year, month),
          installmentsService.getMonthSummary(currentSpace.id, year, month),
        ]);

        if (isMounted) {
          if (entriesResult.status === 'fulfilled') setEntriesSummary(entriesResult.value);
          if (fixedResult.status === 'fulfilled') setFixedSummary(fixedResult.value);
          if (variableResult.status === 'fulfilled') setVariableSummary(variableResult.value);
          if (installmentsResult.status === 'fulfilled') setInstallmentsSummary(installmentsResult.value);
          setIsLoadingData(false);
        }
      } catch {
        if (isMounted) {
          setIsLoadingData(false);
        }
      }
    }

    loadAllData();
    return () => {
      isMounted = false;
    };
  }, [currentSpace?.id]);

  // Cálculos financeiros reais da competência atual (gastos fixos + variáveis + parcelas do mês)
  const totalReceitas = entriesSummary.totalPlanned;
  const totalDespesas = fixedSummary.totalMonth + variableSummary.totalMonth + installmentsSummary.totalMonth;
  const saldoConsolidado = totalReceitas - totalDespesas;
  const totalDespesasCount = fixedSummary.count + variableSummary.count + installmentsSummary.count;

  // Situação do mês: Pago, Próximo, Atrasado
  const totalPago = fixedSummary.totalPaid + variableSummary.totalPaid + installmentsSummary.totalPaid;
  const totalProximo = fixedSummary.totalUpcoming + variableSummary.totalPending + installmentsSummary.totalUpcoming;
  const totalAtrasado = fixedSummary.totalOverdue + installmentsSummary.totalOverdue;

  // Derive real user first name from Supabase authenticated user/profile (never fictional)
  const fullName = profile?.full_name || user?.full_name || user?.email?.split('@')[0] || '';
  const firstName = fullName.trim().split(' ')[0] || 'Usuário';

  // Mensagem contextual da mascote baseada no estado financeiro real (Section 4)
  let mascotMessage = 'Vamos começar? Cadastre sua primeira entrada.';
  let mascotActionLabel = 'Ver entradas';
  let mascotActionTab: ActiveTab = 'entries';

  const totalOverdueCount = fixedSummary.overdueCount + installmentsSummary.overdueCount;
  if (totalOverdueCount > 0 || totalAtrasado > 0) {
    mascotMessage = totalOverdueCount === 1
      ? 'Há um compromisso que precisa da sua atenção.'
      : `Há ${totalOverdueCount} compromissos que precisam da sua atenção.`;
    mascotActionLabel = 'Ver detalhes';
    mascotActionTab = fixedSummary.overdueCount > 0 ? 'fixed_expenses' : (installmentsSummary.overdueCount > 0 ? 'installments' : 'movements');
  } else if (totalProximo > 0) {
    mascotMessage = 'Você tem compromissos chegando nos próximos dias.';
    mascotActionLabel = 'Ver movimentações';
    mascotActionTab = 'movements';
  } else if (entriesSummary.count === 0 && totalDespesasCount === 0) {
    mascotMessage = 'Vamos começar? Cadastre sua primeira entrada.';
    mascotActionLabel = 'Ver entradas';
    mascotActionTab = 'entries';
  } else {
    mascotMessage = 'Seu mês está organizado até aqui.';
    mascotActionLabel = '';
    mascotActionTab = 'movements';
  }

  // Ações rápidas desktop enxutas (Section 10 - sem duplicar toda a navegação)
  const desktopQuickActions = [
    {
      id: 'entries' as ActiveTab,
      label: '+ Entrada',
      desc: 'Receitas e ganhos',
      icon: ArrowUpRight,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400',
      hoverBorder: 'hover:border-emerald-500/50',
    },
    {
      id: 'variable_expenses' as ActiveTab,
      label: '+ Gasto',
      desc: 'Despesas do dia a dia',
      icon: CreditCard,
      color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400',
      hoverBorder: 'hover:border-rose-500/50',
    },
    {
      id: 'installments' as ActiveTab,
      label: '+ Parcelado',
      desc: 'Compras em parcelas',
      icon: Calendar,
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400',
      hoverBorder: 'hover:border-indigo-500/50',
    },
    {
      id: 'market' as ActiveTab,
      label: '+ Mercado',
      desc: 'Listas e compras',
      icon: ShoppingBag,
      color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/40 dark:text-orange-400',
      hoverBorder: 'hover:border-orange-500/50',
    },
  ];

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-5 lg:space-y-6 pb-24 md:pb-8 animate-in fade-in duration-300">
      {/* ==================================================
          1. CABEÇALHO DESKTOP COMPACTO (Section 2)
          Substitui o antigo bloco gigante por uma barra de topo limpa e funcional
          ================================================== */}
      <div className="hidden md:flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold font-display text-[#202724] dark:text-[#F7F4EA] tracking-tight">
            Olá, {firstName}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-[#5E6963] dark:text-[#95A39B] mt-0.5">
            Vamos organizar suas finanças?
          </p>
        </div>

        {/* Controles de Cabeçalho: + Novo, Notificações, Tema, Perfil */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Botão Global "+ Novo" no Desktop */}
          <div className="relative">
            <button
              type="button"
              id="desktop-header-new-btn"
              onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#075C45] hover:bg-[#075C45]/90 text-white dark:bg-[#16A66A] dark:hover:bg-[#16A66A]/90 dark:text-[#101614] text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Novo</span>
            </button>

            {/* Dropdown Menu "+ Novo" */}
            {isNewMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsNewMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-[#E2E8E4] dark:border-[#24312B] bg-white dark:bg-[#18211D] p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1.5 border-b border-[#E2E8E4] dark:border-[#24312B] mb-1 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#075C45] dark:text-[#78D9A6]">
                      Novo lançamento
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsNewMenuOpen(false)}
                      className="p-1 text-[#5E6963] dark:text-[#95A39B] hover:text-[#202724] dark:hover:text-[#F7F4EA] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-0.5 max-h-[360px] overflow-y-auto">
                    {QUICK_ACTION_ITEMS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setIsNewMenuOpen(false);
                            onSelectTab(item.id);
                          }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-[#F2F5F3] dark:hover:bg-white/5 transition-colors text-left cursor-pointer group"
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[#202724] dark:text-[#F7F4EA] group-hover:text-[#075C45] dark:group-hover:text-[#78D9A6] truncate">
                              {item.label}
                            </p>
                            <p className="text-[10px] text-[#5E6963] dark:text-[#95A39B] truncate">
                              {item.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sino de Notificações */}
          <div className="relative">
            <button
              type="button"
              id="header-notifications-btn"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              aria-label="Notificações"
              className="p-2 rounded-xl border border-[#E2E8E4] hover:bg-black/5 dark:border-[#24312B] dark:hover:bg-white/5 text-[#5E6963] dark:text-[#95A39B] transition-colors cursor-pointer relative"
            >
              <Bell className="w-4 h-4" />
              <span className="sr-only">Notificações</span>
            </button>

            {isNotificationsOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsNotificationsOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl border border-[#E2E8E4] dark:border-[#24312B] bg-white dark:bg-[#18211D] p-4 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E2E8E4] dark:border-[#24312B]">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#075C45] dark:text-[#78D9A6]">
                      Notificações
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsNotificationsOpen(false)}
                      className="p-1 text-[#5E6963] dark:text-[#95A39B] hover:text-[#202724] dark:hover:text-[#F7F4EA] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="py-4 text-center space-y-1">
                    <p className="text-xs font-semibold text-[#202724] dark:text-[#F7F4EA]">
                      Tudo em dia!
                    </p>
                    <p className="text-[11px] text-[#5E6963] dark:text-[#95A39B]">
                      Você não tem lembretes ou avisos pendentes no momento.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Alternância Claro/Escuro */}
          <button
            type="button"
            id="header-toggle-theme-btn"
            onClick={toggleTheme}
            aria-label="Alternar tema claro e escuro"
            className="p-2 rounded-xl border border-[#E2E8E4] hover:bg-black/5 dark:border-[#24312B] dark:hover:bg-white/5 text-[#5E6963] dark:text-[#95A39B] transition-colors cursor-pointer"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4 text-[#D6A84B]" />
            )}
            <span className="sr-only">Alternar tema</span>
          </button>

          {/* Acesso ao Perfil */}
          <button
            type="button"
            id="header-profile-btn"
            onClick={() => onSelectTab('profile')}
            aria-label="Acessar Perfil"
            className="flex items-center gap-2 p-1.5 pr-3 rounded-xl border border-[#E2E8E4] hover:bg-black/5 dark:border-[#24312B] dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <Avatar
              name={fullName || user?.email || 'U'}
              size="sm"
            />
            <span className="text-xs font-semibold text-[#202724] dark:text-[#F7F4EA] hidden sm:inline max-w-[120px] truncate">
              {firstName}
            </span>
          </button>
        </div>
      </div>

      {/* ==================================================
          2. DICA DO POUPAGAIO — INSIGHT COMPACTO (Section 3 & 4)
          Componente horizontal, discreto, útil e contextual
          ================================================== */}
      <div className="hidden md:flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl border border-[#E2E8E4] dark:border-[#24312B] bg-white dark:bg-[#18211D] shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl overflow-hidden border border-[#16A66A]/30 bg-[#F2F5F3] dark:bg-[#101614] p-0.5 shrink-0 flex items-center justify-center">
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
        {mascotActionLabel ? (
          <button
            type="button"
            onClick={() => onSelectTab(mascotActionTab)}
            className="shrink-0 text-xs font-semibold text-[#075C45] hover:text-[#075C45]/80 dark:text-[#78D9A6] dark:hover:text-[#78D9A6]/80 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-[#16A66A]/10 transition-colors cursor-pointer"
          >
            <span>{mascotActionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {/* ==================================================
          3. RESUMO FINANCEIRO (Section 5: Saldo do Mês no topo da hierarquia)
          ================================================== */}
      {/* DESKTOP VERSION OF SALDO DO MÊS */}
      <Card className="hidden md:block border-[#E2E8E4] dark:border-[#24312B] bg-white dark:bg-[#18211D] shadow-xs overflow-hidden">
        <CardContent className="p-4 sm:p-5 space-y-4 sm:space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8E4] dark:border-[#24312B]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#075C45]/10 text-[#075C45] dark:bg-[#16A66A]/20 dark:text-[#78D9A6] flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold font-display text-[#202724] dark:text-[#F7F4EA]">
                Saldo do mês
              </h2>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#F2F5F3] dark:bg-[#101614] border border-[#E2E8E4] dark:border-[#24312B] text-[#5E6963] dark:text-[#95A39B]">
              Espaço: {currentSpace?.name || 'Pessoal'}
            </span>
          </div>

          {/* Indicadores Visuais: Entradas, Despesas, Saldo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5">
            {/* Indicador 1: Saldo Principal com destaque visual protagonista */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#F2F5F3] via-white to-[#F2F5F3]/50 dark:from-[#121915] dark:via-[#18211D] dark:to-[#121915] border-2 border-[#16A66A]/40 dark:border-[#16A66A]/30 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5E6963] dark:text-[#95A39B]">
                  Saldo Consolidado
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#16A66A]/15 text-[#075C45] dark:text-[#78D9A6] text-[10px] font-bold">
                  Balanço Mês
                </span>
              </div>
              <div
                className={`text-3xl lg:text-[32px] font-extrabold font-display ${
                  saldoConsolidado < 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-[#075C45] dark:text-[#78D9A6]'
                }`}
              >
                {formatCurrency(saldoConsolidado)}
              </div>
              <p className="text-[11px] text-[#5E6963] dark:text-[#95A39B]">
                {totalReceitas > 0 || totalDespesas > 0
                  ? saldoConsolidado >= 0
                    ? 'Saldo líquido disponível'
                    : 'Saldo negativo no período'
                  : 'Balanço disponível no mês'}
              </p>
            </div>

            {/* Indicador 2: Entradas (clicável para abrir Entradas) */}
            <div
              onClick={() => onSelectTab('entries')}
              className="p-5 rounded-2xl bg-white dark:bg-[#18211D] border border-[#E2E8E4] dark:border-[#24312B] hover:border-[#16A66A]/50 transition-all cursor-pointer space-y-1.5 group"
            >
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#5E6963] dark:text-[#95A39B]">
                <span className="group-hover:text-[#075C45] dark:group-hover:text-[#78D9A6] transition-colors">Entradas</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Receitas
                </span>
              </div>
              <div className="text-2xl sm:text-[26px] font-bold font-display text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalReceitas)}
              </div>
              <p className="text-[11px] text-[#5E6963] dark:text-[#95A39B]">
                {entriesSummary.count} {entriesSummary.count === 1 ? 'lançamento registrado' : 'lançamentos registrados'}
              </p>
            </div>

            {/* Indicador 3: Despesas (clicável para abrir Gastos Fixos) */}
            <div
              onClick={() => onSelectTab('fixed_expenses')}
              className="p-5 rounded-2xl bg-white dark:bg-[#18211D] border border-[#E2E8E4] dark:border-[#24312B] hover:border-rose-500/50 transition-all cursor-pointer space-y-1.5 group"
            >
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#5E6963] dark:text-[#95A39B]">
                <span className="group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">Despesas</span>
                <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  Saídas
                </span>
              </div>
              <div className="text-2xl sm:text-[26px] font-bold font-display text-rose-600 dark:text-rose-400">
                {formatCurrency(totalDespesas)}
              </div>
              <p className="text-[11px] text-[#5E6963] dark:text-[#95A39B]">
                {totalDespesasCount} {totalDespesasCount === 1 ? 'despesa no período' : 'despesas no período'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MOBILE COMPACT VERSION OF SALDO DO MÊS */}
      <Card className="md:hidden border-[#E2E8E4] dark:border-[#24312B] bg-white dark:bg-[#18211D] shadow-xs">
        <CardContent className="p-4 pt-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2E8E4]/80 dark:border-[#24312B]/60">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5E6963] dark:text-[#95A39B]">
              Saldo do mês
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#16A66A]/10 text-[#075C45] dark:text-[#78D9A6]">
              Consolidado
            </span>
          </div>

          <div className="py-2 px-3 flex flex-col items-center justify-center text-center space-y-0.5 bg-[#F2F5F3] dark:bg-[#121915]/40 rounded-xl border border-[#E2E8E4]/60 dark:border-[#24312B]/40">
            <span className="text-[11px] font-semibold text-[#5E6963] dark:text-[#95A39B]">
              Saldo consolidado
            </span>
            <div className={`text-2xl font-extrabold font-display tracking-tight ${saldoConsolidado < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[#075C45] dark:text-[#78D9A6]'}`}>
              {formatCurrency(saldoConsolidado)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#E2E8E4]/80 dark:border-[#24312B]/60">
            <button
              type="button"
              onClick={() => onSelectTab('entries')}
              className="flex flex-col p-2.5 rounded-xl bg-[#F2F5F3] dark:bg-[#121915] border border-[#E2E8E4] dark:border-[#24312B] text-left cursor-pointer active:scale-98 transition-transform"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> Entradas
              </span>
              <span className="text-xs font-bold text-[#202724] dark:text-[#F7F4EA] mt-0.5">
                {formatCurrency(totalReceitas)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('fixed_expenses')}
              className="flex flex-col p-2.5 rounded-xl bg-[#F2F5F3] dark:bg-[#121915] border border-[#E2E8E4] dark:border-[#24312B] text-left cursor-pointer active:scale-98 transition-transform"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1">
                <ArrowDownRight className="w-3.5 h-3.5" /> Despesas
              </span>
              <span className="text-xs font-bold text-[#202724] dark:text-[#F7F4EA] mt-0.5">
                {formatCurrency(totalDespesas)}
              </span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* ==================================================
          3. SITUAÇÃO DO MÊS ("Este mês" com Pago, Próximo, Atrasado)
          ================================================== */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-lg font-bold font-display text-[#202724] dark:text-[#F7F4EA]">
            Este mês
          </h3>
          <span className="text-[11px] sm:text-xs text-[#5E6963] dark:text-[#95A39B]">
            Status de pagamentos
          </span>
        </div>

        {/* DESKTOP VIEW: 3 Large Cards */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Indicador Pago (Verde) */}
          <div
            onClick={() => onSelectTab('fixed_expenses')}
            className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2 cursor-pointer hover:border-emerald-500/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Pago
              </span>
              <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-display text-emerald-700 dark:text-emerald-300">
              {formatCurrency(totalPago)}
            </div>
            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
              {fixedSummary.paidCount + variableSummary.paidCount + installmentsSummary.paidCount} quitados no mês
            </p>
          </div>

          {/* Indicador Próximo (Amarelo / Dourado) */}
          <div
            onClick={() => onSelectTab('fixed_expenses')}
            className="p-5 rounded-2xl border border-[#D6A84B]/30 bg-[#F7F4EA] dark:bg-[#D6A84B]/10 space-y-2 cursor-pointer hover:border-[#D6A84B]/60 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8c6511] dark:text-[#F2D58A]">
                Próximo
              </span>
              <div className="w-7 h-7 rounded-xl bg-[#D6A84B]/20 text-[#b07d17] dark:text-[#F2D58A] flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-display text-[#8c6511] dark:text-[#F2D58A]">
              {formatCurrency(totalProximo)}
            </div>
            <p className="text-[11px] text-[#8c6511]/80 dark:text-[#F2D58A]/80">
              {fixedSummary.upcomingCount + variableSummary.pendingCount + installmentsSummary.upcomingCount} pendentes no mês
            </p>
          </div>

          {/* Indicador Atrasado (Vermelho) */}
          <div
            onClick={() => onSelectTab('fixed_expenses')}
            className="p-5 rounded-2xl border border-rose-500/20 bg-rose-50/50 dark:bg-rose-950/20 space-y-2 cursor-pointer hover:border-rose-500/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                Atrasado
              </span>
              <div className="w-7 h-7 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-display text-rose-700 dark:text-rose-300">
              {formatCurrency(totalAtrasado)}
            </div>
            <p className="text-[11px] text-rose-700/80 dark:text-rose-400/80">
              {totalOverdueCount > 0
                ? `${totalOverdueCount} ${totalOverdueCount === 1 ? 'conta vencida' : 'contas vencidas'}`
                : 'Nenhuma conta atrasada'}
            </p>
          </div>
        </div>

        {/* MOBILE COMPACT VIEW: 3 Columns in 1 Row */}
        <div className="grid md:hidden grid-cols-3 gap-2">
          {/* Pago */}
          <div
            onClick={() => onSelectTab('fixed_expenses')}
            className="p-2 sm:p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-0.5 cursor-pointer text-center active:scale-98 transition-transform flex flex-col items-center justify-center"
          >
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300 truncate">
              <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="truncate">Pago</span>
            </div>
            <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200 truncate">
              {formatCurrency(totalPago)}
            </p>
          </div>

          {/* Próximo */}
          <div
            onClick={() => onSelectTab('fixed_expenses')}
            className="p-2 sm:p-2.5 rounded-xl border border-[#D6A84B]/30 bg-[#F2F5F3] dark:bg-[#D6A84B]/10 space-y-0.5 cursor-pointer text-center active:scale-98 transition-transform flex flex-col items-center justify-center"
          >
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase text-[#8c6511] dark:text-[#F2D58A] truncate">
              <Clock className="w-3 h-3 shrink-0 text-[#b07d17] dark:text-[#F2D58A]" />
              <span className="truncate">Próximo</span>
            </div>
            <p className="text-xs font-bold text-[#5c4207] dark:text-[#f7e3b2] truncate">
              {formatCurrency(totalProximo)}
            </p>
          </div>

          {/* Atrasado */}
          <div
            onClick={() => onSelectTab('fixed_expenses')}
            className="p-2 sm:p-2.5 rounded-xl border border-rose-500/20 bg-rose-50/50 dark:bg-rose-950/20 space-y-0.5 cursor-pointer text-center active:scale-98 transition-transform flex flex-col items-center justify-center"
          >
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase text-rose-800 dark:text-rose-300 truncate">
              <AlertCircle className="w-3 h-3 shrink-0 text-rose-600 dark:text-rose-400" />
              <span className="truncate">Atrasado</span>
            </div>
            <p className="text-xs font-bold text-rose-900 dark:text-rose-200 truncate">
              {formatCurrency(totalAtrasado)}
            </p>
          </div>
        </div>
      </div>

      {/* ==================================================
          4. AÇÕES RÁPIDAS (Desktop / Tablet enxuto - Section 10)
          ================================================== */}
      <div className="hidden md:block space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold font-display text-[#202724] dark:text-[#F7F4EA]">
            Ações rápidas
          </h3>
          <span className="text-xs text-[#5E6963] dark:text-[#95A39B]">
            Lançamentos frequentes
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {desktopQuickActions.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                id={`shortcut-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`p-3.5 rounded-2xl border border-[#E2E8E4] dark:border-[#24312B] bg-white dark:bg-[#18211D] ${item.hoverBorder} hover:shadow-xs active:scale-[0.98] transition-all text-left flex items-center gap-3 cursor-pointer group`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="min-w-0">
                  <h4 className="font-bold text-xs sm:text-sm text-[#202724] dark:text-[#F7F4EA] group-hover:text-[#075C45] dark:group-hover:text-[#78D9A6] transition-colors leading-tight">
                    {item.label}
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-[#5E6963] dark:text-[#95A39B] truncate mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================================================
          5. METAS (Card "Minhas metas")
          ================================================== */}
      <Card className="border-[#E2E8E4] dark:border-[#24312B] bg-white dark:bg-[#18211D] shadow-xs">
        <CardContent className="p-4 pt-4 sm:p-6 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-[#E2E8E4] dark:border-[#24312B]">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#D6A84B]/15 text-[#b07d17] dark:bg-[#D6A84B]/25 dark:text-[#F2D58A] flex items-center justify-center shrink-0">
                <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <h3 className="text-sm sm:text-base font-bold font-display text-[#202724] dark:text-[#F7F4EA]">
                Minhas metas
              </h3>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsGoalModalOpen(true)}
              className="gap-1 text-xs font-semibold cursor-pointer py-1 px-2.5 h-8 sm:h-9"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Criar meta</span>
            </Button>
          </div>

          {/* Estado inicial de metas */}
          <div className="py-3 px-3 sm:py-6 sm:px-4 text-center flex flex-col items-center justify-center space-y-1.5 sm:space-y-2 rounded-xl sm:rounded-2xl bg-[#F2F5F3]/70 dark:bg-[#101614]/50 border border-dashed border-[#E2E8E4] dark:border-[#24312B]">
            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-[#16A66A]/10 text-[#075C45] dark:bg-[#16A66A]/20 dark:text-[#78D9A6] flex items-center justify-center shrink-0">
              <Target className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-[#202724] dark:text-[#F7F4EA]">
              Nenhuma meta criada ainda.
            </p>
            <p className="text-[11px] sm:text-xs text-[#5E6963] dark:text-[#95A39B] max-w-sm leading-snug">
              Crie objetivos como reserva de emergência, viagens ou conquistas para acompanhar seu progresso.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Modal leve de Aviso "Funcionalidade em desenvolvimento" para "+ Criar meta" */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-[#E8E4D5] dark:border-[#24312B] bg-white dark:bg-[#18211D] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E4D5] dark:border-[#24312B]">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-[#075C45] dark:text-[#78D9A6]" />
                <h4 className="font-bold text-base font-display text-[#202724] dark:text-[#F7F4EA]">
                  Criar Nova Meta
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsGoalModalOpen(false)}
                className="p-1 rounded-full text-[#5E6963] dark:text-[#95A39B] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-center py-2">
              <span className="inline-block px-3 py-1 rounded-full bg-[#D6A84B]/15 text-[#8c6511] dark:text-[#F2D58A] text-xs font-bold uppercase tracking-wider">
                Funcionalidade em desenvolvimento.
              </span>
              <p className="text-xs text-[#5E6963] dark:text-[#95A39B] leading-relaxed">
                O módulo de metas permitirá definir valores-alvo, prazos e aportes mensais sugeridos pelo Poupagaio. A lógica completa será implementada na etapa de Metas.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsGoalModalOpen(false)}
                className="cursor-pointer"
              >
                Fechar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setIsGoalModalOpen(false);
                  onSelectTab('goals');
                }}
                className="cursor-pointer"
              >
                Ver Módulo Metas
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
