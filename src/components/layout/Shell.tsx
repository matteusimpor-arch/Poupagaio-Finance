import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { POUPAGAIO_MASCOT_URL } from '../../assets/mascot';
import { SpaceSelector } from './SpaceSelector';
import { SupabaseSchemaNotice } from './SupabaseSchemaNotice';
import { Avatar } from '../ui/avatar';
import { checklistService, FinancialAlert } from '../../lib/services/checklist';
import { formatCurrency } from '../../lib/formatters';
import {
  Home,
  ArrowUpRight,
  ArrowLeftRight,
  CreditCard,
  FileText,
  Calendar,
  ShoppingBag,
  Target,
  Gift,
  CalendarCheck,
  BarChart3,
  MoreHorizontal,
  User,
  Sun,
  Moon,
  LogOut,
  X,
  Plus,
  Bell,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { ActiveTab } from '../../types';
import { QUICK_ACTION_ITEMS } from '../../lib/constants/quickActions';

interface ShellProps {
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  children: React.ReactNode;
}

interface NavGroup {
  title: string;
  items: { id: ActiveTab; label: string; icon: React.ElementType }[];
}

export function Shell({ currentTab, onSelectTab, children }: ShellProps) {
  const { user, profile, currentSpace, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [alerts, setAlerts] = useState<FinancialAlert[]>([]);

  useEffect(() => {
    async function loadAlerts() {
      if (!currentSpace?.id) return;
      const now = new Date();
      try {
        const res = await checklistService.getMonthlyChecklist(currentSpace.id, now.getFullYear(), now.getMonth() + 1);
        setAlerts(res.alerts);
      } catch (e) {
        console.warn('Erro ao carregar alertas na barra de navegação:', e);
      }
    }
    loadAlerts();
    // Atualiza a cada 60 segundos
    const interval = setInterval(loadAlerts, 60000);
    return () => clearInterval(interval);
  }, [currentSpace?.id]);

  const navGroups: NavGroup[] = [
    {
      title: 'Visão Geral',
      items: [
        { id: 'home', label: 'Início', icon: Home },
        { id: 'movements', label: 'Movimentações', icon: ArrowLeftRight },
        { id: 'planning', label: 'Planejamento', icon: Target },
      ],
    },
    {
      title: 'Finanças',
      items: [
        { id: 'entries', label: 'Entradas', icon: ArrowUpRight },
        { id: 'fixed_expenses', label: 'Gastos Fixos', icon: FileText },
        { id: 'variable_expenses', label: 'Gastos Variáveis', icon: CreditCard },
        { id: 'installments', label: 'Parcelados', icon: Calendar },
      ],
    },
    {
      title: 'Organização',
      items: [
        { id: 'market', label: 'Mercado', icon: ShoppingBag },
        { id: 'goals', label: 'Metas', icon: Target },
        { id: 'wishlist', label: 'Lista de Desejos', icon: Gift },
      ],
    },
    {
      title: 'Relatórios',
      items: [
        { id: 'reports', label: 'Visão Financeira', icon: BarChart3 },
        { id: 'closing', label: 'Fechamento', icon: CalendarCheck },
      ],
    },
  ];

  // Reutiliza a configuração unificada de ações rápidas
  const actionSheetItems = QUICK_ACTION_ITEMS;

  const handleNavClick = (tab: ActiveTab) => {
    onSelectTab(tab);
    setIsMoreMenuOpen(false);
    setIsActionSheetOpen(false);
    setIsNotificationsOpen(false);
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-[#F3F4F4] dark:bg-[#181B1A] text-[#202724] dark:text-[#F4F4F5] transition-colors duration-200 overflow-hidden">
      {/* DESKTOP HORIZONTAL TOPBAR NAVIGATION */}
      <header className="hidden md:flex flex-col shrink-0 border-b border-[#E2E8E4] dark:border-[#2E3532] bg-white dark:bg-[#1E2220] z-30 shadow-3xs select-none">
        {/* Top line: Brand, Space Selector & User Controls */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-[#E2E8E4]/60 dark:border-[#2E3532]/60 gap-4">
          {/* Left: Brand & Space */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => handleNavClick('home')}>
              <div className="w-9 h-9 rounded-xl overflow-hidden border-2 border-[#16A66A]/30 bg-[#F3F4F4] dark:bg-[#232725] p-0.5 shrink-0 shadow-2xs">
                <img
                  src={POUPAGAIO_MASCOT_URL}
                  alt="Poupagaio Mascot"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-base tracking-tight font-display text-[#075C45] dark:text-[#78D9A6] leading-tight">
                  Poupagaio Finance
                </h1>
                <p className="text-[10px] text-[#5E6963] dark:text-[#95A39B] leading-none">
                  Organize hoje. Voe mais longe.
                </p>
              </div>
            </div>

            <div className="h-6 w-px bg-[#E2E8E4] dark:bg-[#2E3532]" />

            <div className="min-w-[190px]">
              <SpaceSelector />
            </div>
          </div>

          {/* Right: Notifications, Theme & Profile */}
          <div className="flex items-center gap-2.5">
            {/* Sino de Notificações */}
            <div className="relative">
              <button
                type="button"
                id="desktop-header-notifications-btn"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                aria-label="Notificações"
                className="p-2 rounded-xl border border-[#E2E8E4] hover:bg-black/5 dark:border-[#2E3532] dark:hover:bg-white/5 text-[#5E6963] dark:text-[#95A39B] cursor-pointer relative transition-colors"
              >
                <Bell className="w-4 h-4" />
                {alerts.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-600 rounded-full ring-2 ring-white dark:ring-[#1E2220]" />
                )}
                <span className="sr-only">Notificações</span>
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-[#E2E8E4] dark:border-[#2E3532] bg-white dark:bg-[#1E2220] p-4 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E2E8E4] dark:border-[#2E3532]">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#075C45] dark:text-[#78D9A6] flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-[#16A66A]" />
                      Alertas Ativos ({alerts.length})
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsNotificationsOpen(false)}
                      className="p-1 text-[#5E6963] dark:text-[#95A39B] hover:text-[#202724] dark:hover:text-[#F4F4F5] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  {alerts.length === 0 ? (
                    <div className="py-5 text-center space-y-1">
                      <p className="text-xs font-semibold text-[#202724] dark:text-[#F4F4F5]">
                        Tudo em dia!
                      </p>
                      <p className="text-[11px] text-[#5E6963] dark:text-[#95A39B]">
                        Você não tem lembretes ou avisos pendentes.
                      </p>
                    </div>
                  ) : (
                    <div className="py-2 divide-y divide-[#E2E8E4]/50 dark:divide-[#2E3532]/50 max-h-[280px] overflow-y-auto">
                      {alerts.slice(0, 5).map((alert) => (
                        <div
                          key={alert.id}
                          onClick={() => {
                            setIsNotificationsOpen(false);
                            onSelectTab('calendar');
                          }}
                          className="py-2.5 text-left cursor-pointer hover:bg-black/2 dark:hover:bg-white/2 transition-colors flex items-start gap-2.5"
                        >
                          {alert.severity === 'critical' ? (
                            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
                          ) : (
                            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[#202724] dark:text-[#F4F4F5] truncate">
                              {alert.title}
                            </p>
                            <p className="text-[10px] text-[#5E6963] dark:text-[#95A39B]">
                              Vence em: {alert.dueDate.split('-').reverse().join('/')} • {formatCurrency(alert.amount)}
                            </p>
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                            alert.severity === 'critical'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                          }`}>
                            {alert.badgeText}
                          </span>
                        </div>
                      ))}
                      {alerts.length > 5 && (
                        <div className="pt-2 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setIsNotificationsOpen(false);
                              onSelectTab('calendar');
                            }}
                            className="text-[11px] font-bold text-[#16A66A] hover:underline"
                          >
                            Ver mais {alerts.length - 5} alertas no Calendário →
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Alternar Tema */}
            <button
              type="button"
              id="topbar-toggle-theme"
              onClick={toggleTheme}
              aria-label="Alternar tema"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#E2E8E4] hover:bg-black/5 dark:border-[#2E3532] dark:hover:bg-white/5 text-xs text-[#5E6963] dark:text-[#95A39B] cursor-pointer transition-colors"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Escuro</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-[#D6A84B]" />
                  <span className="hidden lg:inline">Claro</span>
                </>
              )}
            </button>

            {/* Perfil */}
            <button
              type="button"
              id="topbar-profile-btn"
              onClick={() => handleNavClick('profile')}
              className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border transition-colors cursor-pointer text-left ${
                currentTab === 'profile'
                  ? 'bg-[#16A66A]/15 border-[#16A66A]/40 text-[#075C45] dark:bg-[#16A66A]/25 dark:text-[#78D9A6]'
                  : 'border-[#E2E8E4] dark:border-[#2E3532] hover:bg-black/5 text-[#202724] dark:hover:bg-white/5 dark:text-[#F4F4F5]'
              }`}
            >
              <Avatar
                name={profile?.full_name || user?.full_name || user?.email || 'U'}
                size="sm"
              />
              <span className="text-xs font-bold max-w-[100px] truncate hidden lg:inline">
                {profile?.full_name?.split(' ')[0] || user?.full_name?.split(' ')[0] || 'Usuário'}
              </span>
            </button>

            {/* Sair */}
            <button
              type="button"
              id="topbar-logout-btn"
              onClick={() => signOut()}
              aria-label="Sair da conta"
              title="Sair"
              className="p-2 rounded-xl hover:bg-red-50 text-red-600 dark:hover:bg-red-950/40 dark:text-red-400 cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom line: Horizontal Navigation Tabs Bar */}
        <nav className="flex items-center px-4 py-1.5 overflow-x-auto gap-1 no-scrollbar">
          {navGroups.map((group, groupIdx) => (
            <React.Fragment key={group.title}>
              {groupIdx > 0 && (
                <div className="h-4 w-px bg-[#E2E8E4] dark:bg-[#2E3532] mx-1 shrink-0" />
              )}
              <div className="flex items-center gap-1 shrink-0">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`nav-desktop-${item.id}`}
                      onClick={() => handleNavClick(item.id)}
                      type="button"
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                        isActive
                          ? 'bg-[#075C45] text-white shadow-xs dark:bg-[#16A66A] dark:text-[#101614]'
                          : 'text-[#5E6963] dark:text-[#95A39B] hover:text-[#202724] dark:hover:text-[#F4F4F5] hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white dark:text-[#101614]' : 'text-[#16A66A]'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </React.Fragment>
          ))}
        </nav>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-[calc(100dvh-5.5rem)] md:h-[calc(100dvh-5.25rem)] overflow-hidden">
        {/* MOBILE TOP BAR */}
        <header className="md:hidden flex items-center justify-between px-4 py-2.5 pt-[calc(0.625rem+env(safe-area-inset-top))] border-b border-[#E2E8E4] dark:border-[#2E3532] bg-white dark:bg-[#1E2220] sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl overflow-hidden border border-[#16A66A]/30 bg-[#F2F5F3] dark:bg-[#18211D] p-0.5 shrink-0">
              <img
                src={POUPAGAIO_MASCOT_URL}
                alt="Poupagaio Mascot"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <span className="font-bold text-sm tracking-tight font-display text-[#075C45] dark:text-[#78D9A6]">
              Poupagaio Finance
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Sino de Notificações no Topo Mobile */}
            <div className="relative">
              <button
                type="button"
                id="mobile-header-notifications-btn"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                aria-label="Notificações"
                className="p-2 rounded-xl border border-[#E2E8E4] hover:bg-black/5 dark:border-[#24312B] dark:hover:bg-white/5 text-[#5E6963] dark:text-[#95A39B] cursor-pointer relative"
              >
                <Bell className="w-4 h-4" />
                {alerts.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-600 rounded-full ring-2 ring-white dark:ring-[#1E2220]" />
                )}
                <span className="sr-only">Notificações</span>
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-[#E2E8E4] dark:border-[#24312B] bg-white dark:bg-[#18211D] p-4 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E2E8E4] dark:border-[#24312B]">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#075C45] dark:text-[#78D9A6] flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-[#16A66A]" />
                      Alertas Ativos ({alerts.length})
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsNotificationsOpen(false)}
                      className="p-1 text-[#5E6963] dark:text-[#95A39B] hover:text-[#202724] dark:hover:text-[#F7F4EA] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  {alerts.length === 0 ? (
                    <div className="py-5 text-center space-y-1">
                      <p className="text-xs font-semibold text-[#202724] dark:text-[#F7F4EA]">
                        Tudo em dia!
                      </p>
                      <p className="text-[11px] text-[#5E6963] dark:text-[#95A39B]">
                        Você não tem lembretes ou avisos pendentes.
                      </p>
                    </div>
                  ) : (
                    <div className="py-2 divide-y divide-[#E2E8E4]/50 dark:divide-[#24312B]/50 max-h-[280px] overflow-y-auto">
                      {alerts.slice(0, 5).map((alert) => (
                        <div
                          key={alert.id}
                          onClick={() => {
                            setIsNotificationsOpen(false);
                            onSelectTab('calendar');
                          }}
                          className="py-2.5 text-left cursor-pointer hover:bg-black/2 dark:hover:bg-white/2 transition-colors flex items-start gap-2.5"
                        >
                          {alert.severity === 'critical' ? (
                            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
                          ) : (
                            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[#202724] dark:text-[#F4F4F5] truncate">
                              {alert.title}
                            </p>
                            <p className="text-[10px] text-[#5E6963] dark:text-[#95A39B]">
                              Vence em: {alert.dueDate.split('-').reverse().join('/')} • {formatCurrency(alert.amount)}
                            </p>
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                            alert.severity === 'critical'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                          }`}>
                            {alert.badgeText}
                          </span>
                        </div>
                      ))}
                      {alerts.length > 5 && (
                        <div className="pt-2 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setIsNotificationsOpen(false);
                              onSelectTab('calendar');
                            }}
                            className="text-[11px] font-bold text-[#16A66A] hover:underline"
                          >
                            Ver mais {alerts.length - 5} alertas no Calendário →
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Alternância Tema no Topo Mobile */}
            <button
              type="button"
              id="mobile-header-toggle-theme-btn"
              onClick={toggleTheme}
              aria-label="Alternar tema"
              className="p-2 rounded-xl border border-[#E2E8E4] hover:bg-black/5 dark:border-[#24312B] dark:hover:bg-white/5 text-[#5E6963] dark:text-[#95A39B] cursor-pointer"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-[#D6A84B]" />}
            </button>
          </div>
        </header>

        {/* MOBILE SPACE SELECTOR BAR */}
        <div className="md:hidden px-3.5 py-1.5 border-b border-[#E2E8E4] dark:border-[#2E3532] bg-[#EBECEE]/80 dark:bg-[#181B1A]/80 backdrop-blur-sm">
          <SpaceSelector />
        </div>

        {/* SUPABASE SCHEMA NOTICE */}
        <SupabaseSchemaNotice />

        {/* SCROLLABLE VIEW CONTAINER (flex-1 min-h-0 overflow-y-auto) */}
        <main className="flex-1 min-h-0 overflow-y-auto px-3.5 py-3 sm:px-6 sm:py-5 md:px-8 md:py-6 pb-24 md:pb-8">
          {children}
        </main>

        {/* MOBILE BOTTOM NAVIGATION (5 Ícones com + Central) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-[#E2E8E4] dark:border-[#2E3532] bg-white/95 dark:bg-[#1E2220]/95 backdrop-blur-md px-2 py-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom))] z-40 flex items-center justify-between">
          {/* Item 1: Início */}
          <button
            type="button"
            id="nav-mobile-home"
            onClick={() => handleNavClick('home')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              currentTab === 'home'
                ? 'text-[#075C45] dark:text-[#78D9A6] font-bold'
                : 'text-[#5E6963] dark:text-[#95A39B] hover:text-[#202724] dark:hover:text-[#F4F4F5]'
            }`}
          >
            <Home className={`w-5 h-5 ${currentTab === 'home' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-0.5 leading-tight font-medium">Início</span>
          </button>

          {/* Item 2: Movimentações */}
          <button
            type="button"
            id="nav-mobile-movements"
            onClick={() => handleNavClick('movements')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              currentTab === 'movements'
                ? 'text-[#075C45] dark:text-[#78D9A6] font-bold'
                : 'text-[#5E6963] dark:text-[#95A39B] hover:text-[#202724] dark:hover:text-[#F4F4F5]'
            }`}
          >
            <ArrowLeftRight className={`w-5 h-5 ${currentTab === 'movements' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-0.5 leading-tight font-medium truncate max-w-[60px]">Movimentações</span>
          </button>

          {/* Item 3 CENTRAL: Botão "+" Destaque */}
          <div className="flex flex-col items-center justify-center px-1">
            <button
              type="button"
              id="nav-mobile-plus-action"
              onClick={() => setIsActionSheetOpen(true)}
              aria-label="Abrir ações rápidas"
              className="w-12 h-12 rounded-full bg-[#16A66A] hover:bg-[#075C45] text-white flex items-center justify-center shadow-md -mt-5 border-4 border-[#F3F4F4] dark:border-[#181B1A] transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* Item 4: Planejamento */}
          <button
            type="button"
            id="nav-mobile-planning"
            onClick={() => handleNavClick('planning')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              currentTab === 'planning'
                ? 'text-[#075C45] dark:text-[#78D9A6] font-bold'
                : 'text-[#5E6963] dark:text-[#95A39B] hover:text-[#202724] dark:hover:text-[#F7F4EA]'
            }`}
          >
            <Target className={`w-5 h-5 ${currentTab === 'planning' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-0.5 leading-tight font-medium truncate max-w-[60px]">Planejamento</span>
          </button>

          {/* Item 5: Perfil */}
          <button
            type="button"
            id="nav-mobile-profile"
            onClick={() => handleNavClick('profile')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              currentTab === 'profile'
                ? 'text-[#075C45] dark:text-[#78D9A6] font-bold'
                : 'text-[#5E6963] dark:text-[#95A39B] hover:text-[#202724] dark:hover:text-[#F7F4EA]'
            }`}
          >
            <User className={`w-5 h-5 ${currentTab === 'profile' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-0.5 leading-tight font-medium">Perfil</span>
          </button>
        </nav>
      </div>

      {/* BOTTOM SHEET / ACTION SHEET MOBILE DO BOTÃO '+' */}
      {isActionSheetOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex flex-col justify-end animate-in fade-in duration-200 md:hidden"
          onClick={() => setIsActionSheetOpen(false)}
        >
          <div
            className="bg-white dark:bg-[#141C18] border-t border-[#E8E4D5] dark:border-[#24312B] rounded-t-3xl p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Barra tátil superior */}
            <div className="w-12 h-1.5 bg-[#E8E4D5] dark:bg-[#24312B] rounded-full mx-auto" />

            <div className="flex items-center justify-between pb-1 border-b border-[#E8E4D5] dark:border-[#24312B]">
              <div>
                <h3 className="font-bold text-base font-display text-[#202724] dark:text-[#F7F4EA]">
                  O que você quer fazer?
                </h3>
                <p className="text-xs text-[#5E6963] dark:text-[#95A39B]">
                  Selecione um módulo para registrar ou gerenciar
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsActionSheetOpen(false)}
                className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#5E6963] dark:text-[#95A39B] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid de Ações do Bottom Sheet */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {actionSheetItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setIsActionSheetOpen(false);
                      handleNavClick(item.id);
                    }}
                    className="flex items-center gap-3 p-3 rounded-2xl border border-[#E8E4D5] dark:border-[#24312B] bg-[#F7F4EA]/40 dark:bg-[#18211D] hover:bg-[#16A66A]/10 transition-all text-left cursor-pointer group"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
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
        </div>
      )}
    </div>
  );
}
