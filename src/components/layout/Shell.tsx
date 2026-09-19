import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { POUPAGAIO_MASCOT_URL } from '../../assets/mascot';
import { SpaceSelector } from './SpaceSelector';
import { SupabaseSchemaNotice } from './SupabaseSchemaNotice';
import { FloatingPoupagaio } from './FloatingPoupagaio';
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
  User,
  Sun,
  Moon,
  LogOut,
  X,
  Plus,
  Bell,
  AlertCircle,
  Clock,
  HelpCircle,
  Menu,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [alerts, setAlerts] = useState<FinancialAlert[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
        { id: 'support', label: 'Suporte', icon: HelpCircle },
      ],
    },
  ];

  const actionSheetItems = QUICK_ACTION_ITEMS;

  const handleNavClick = (tab: ActiveTab) => {
    onSelectTab(tab);
    setIsMobileMenuOpen(false);
    setIsActionSheetOpen(false);
    setIsNotificationsOpen(false);
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#EAEDEB] dark:bg-[#121614] text-[#202724] dark:text-[#F4F4F5] transition-colors duration-200 relative">
      {/* Decorative Botanical Leaf Background Patterns (subtle, non-intrusive) */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-[0.04] dark:opacity-[0.025] text-[#02402E] dark:text-[#78D9A6]">
        <svg className="absolute top-12 -left-10 w-80 h-80" viewBox="0 0 100 100" fill="currentColor">
          <path d="M50 0 C20 30 0 70 50 100 C100 70 80 30 50 0 Z M50 20 L50 80" stroke="currentColor" strokeWidth="2" />
        </svg>
        <svg className="absolute bottom-20 -right-12 w-96 h-96" viewBox="0 0 100 100" fill="currentColor">
          <path d="M50 0 C20 30 0 70 50 100 C100 70 80 30 50 0 Z M50 20 L50 80" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>

      {/* DESKTOP + MOBILE STICKY TRANSLUCENT NAVIGATION HEADER */}
      <header
        className={`sticky top-0 z-40 w-full border-b backdrop-blur-md transition-all duration-300 select-none ${
          isScrolled
            ? 'bg-white/85 dark:bg-[#1C211E]/85 border-[#DCE2DE] dark:border-[#2B322F] shadow-sm opacity-100'
            : 'bg-white/40 dark:bg-[#1C211E]/40 border-[#DCE2DE]/40 dark:border-[#2B322F]/40 opacity-60 hover:opacity-100 hover:bg-white/90 dark:hover:bg-[#1C211E]/90 focus-within:opacity-100'
        }`}
      >
        {/* Top line: Brand, Space Selector & User Controls */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 gap-3 transition-opacity duration-300">
          {/* Left: Brand & Space */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNavClick('home')}>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden border-2 border-[#16A66A]/30 bg-[#F2F4F3] dark:bg-[#232725] p-0.5 shrink-0 shadow-2xs">
                <img
                  src={POUPAGAIO_MASCOT_URL}
                  alt="Poupagaio Mascot"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-sm sm:text-base tracking-tight font-display text-[#02402E] dark:text-[#78D9A6] leading-tight truncate">
                  Poupagaio Finance
                </h1>
                <p className="text-[10px] text-[#5E6963] dark:text-[#95A39B] leading-none hidden sm:block">
                  Organize hoje. Voe mais longe.
                </p>
              </div>
            </div>

            <div className="h-5 w-px bg-[#DCE2DE] dark:bg-[#2B322F] hidden sm:block" />

            <div className="min-w-[150px] sm:min-w-[190px]">
              <SpaceSelector />
            </div>
          </div>

          {/* Right: Notifications, Theme & Profile */}
          <div className="flex items-center gap-2">
            {/* Sino de Notificações */}
            <div className="relative">
              <button
                type="button"
                id="header-notifications-btn"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                aria-label="Notificações"
                className="p-2 rounded-xl border border-[#DCE2DE] hover:bg-black/5 dark:border-[#2B322F] dark:hover:bg-white/5 text-[#5E6963] dark:text-[#95A39B] cursor-pointer relative transition-colors"
              >
                <Bell className="w-4 h-4" />
                {alerts.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-600 rounded-full ring-2 ring-white dark:ring-[#1C211E]" />
                )}
                <span className="sr-only">Notificações</span>
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-[#DCE2DE] dark:border-[#2B322F] bg-white dark:bg-[#1C211E] p-4 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-[#DCE2DE] dark:border-[#2B322F]">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#02402E] dark:text-[#78D9A6] flex items-center gap-1.5">
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
                    <div className="py-2 divide-y divide-[#DCE2DE]/50 dark:divide-[#2B322F]/50 max-h-[280px] overflow-y-auto">
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
              className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl border border-[#DCE2DE] hover:bg-black/5 dark:border-[#2B322F] dark:hover:bg-white/5 text-xs text-[#5E6963] dark:text-[#95A39B] cursor-pointer transition-colors"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden lg:inline">Escuro</span>
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-[#F2B807]" />
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
                  ? 'bg-[#16A66A]/15 border-[#16A66A]/40 text-[#02402E] dark:bg-[#16A66A]/25 dark:text-[#78D9A6]'
                  : 'border-[#DCE2DE] dark:border-[#2B322F] hover:bg-black/5 text-[#202724] dark:hover:bg-white/5 dark:text-[#F4F4F5]'
              }`}
            >
              <Avatar
                name={profile?.full_name || user?.full_name || user?.email || 'U'}
                size="sm"
              />
              <span className="text-xs font-bold max-w-[100px] truncate hidden md:inline">
                {profile?.full_name?.split(' ')[0] || user?.full_name?.split(' ')[0] || 'Usuário'}
              </span>
            </button>

            {/* Mobile Drawer Trigger Menu */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl border border-[#DCE2DE] dark:border-[#2B322F] hover:bg-black/5 dark:hover:bg-white/5 text-[#5E6963] dark:text-[#95A39B] cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Sair */}
            <button
              type="button"
              id="topbar-logout-btn"
              onClick={() => signOut()}
              aria-label="Sair da conta"
              title="Sair"
              className="hidden sm:flex p-2 rounded-xl hover:bg-red-50 text-red-600 dark:hover:bg-red-950/40 dark:text-red-400 cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE FULL DRAWER MENU */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex flex-col justify-end animate-in fade-in duration-200 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="bg-white dark:bg-[#1C211E] border-t border-[#DCE2DE] dark:border-[#2B322F] rounded-t-3xl p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#DCE2DE] dark:border-[#2B322F]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg overflow-hidden border border-[#16A66A]/30 p-0.5">
                  <img src={POUPAGAIO_MASCOT_URL} alt="Poupagaio" className="w-full h-full object-contain" />
                </div>
                <h3 className="font-bold text-sm font-display text-[#02402E] dark:text-[#78D9A6]">
                  Navegação Completa
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-full text-[#5E6963] dark:text-[#95A39B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-1">
              {navGroups.map((group) => (
                <div key={group.title} className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#5E6963]">
                    {group.title}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavClick(item.id)}
                          className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                            isActive
                              ? 'bg-[#02402E] text-white dark:bg-[#16A66A] dark:text-[#101614]'
                              : 'bg-[#F2F4F3] dark:bg-[#181B1A] text-[#202724] dark:text-[#F4F4F5]'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUPABASE SCHEMA NOTICE */}
      <SupabaseSchemaNotice />

      {/* NATURAL VERTICAL SCROLL MAIN CONTENT AREA */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 relative z-10">
        {children}
      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-[#DCE2DE] dark:border-[#2B322F] bg-white dark:bg-[#1C211E] py-8 px-4 sm:px-8 mt-8 transition-colors relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-1.5">
            <div className="flex items-center justify-center md:justify-start gap-2.5">
              <div className="w-7 h-7 rounded-lg overflow-hidden border border-[#16A66A]/30 p-0.5 bg-[#F2F4F3] dark:bg-[#232725]">
                <img src={POUPAGAIO_MASCOT_URL} alt="Poupagaio" className="w-full h-full object-contain" />
              </div>
              <span className="font-bold font-display text-sm text-[#02402E] dark:text-[#78D9A6]">
                Poupagaio Finance
              </span>
            </div>
            <p className="text-xs text-[#5E6963] dark:text-[#95A39B]">
              Organize hoje. Voe mais longe.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 text-xs font-semibold text-[#5E6963] dark:text-[#95A39B]">
            <button onClick={() => onSelectTab('home')} className="hover:text-[#02402E] dark:hover:text-[#78D9A6] transition-colors cursor-pointer">Início</button>
            <button onClick={() => onSelectTab('reports')} className="hover:text-[#02402E] dark:hover:text-[#78D9A6] transition-colors cursor-pointer">Visão Financeira</button>
            <button onClick={() => onSelectTab('support')} className="hover:text-[#02402E] dark:hover:text-[#78D9A6] transition-colors cursor-pointer">Suporte</button>
            <button onClick={() => onSelectTab('profile')} className="hover:text-[#02402E] dark:hover:text-[#78D9A6] transition-colors cursor-pointer">Meu Perfil</button>
          </div>

          {/* Credits */}
          <div className="text-xs text-[#5E6963] dark:text-[#95A39B] space-y-1">
            <p className="font-bold text-[#02402E] dark:text-[#78D9A6]">
              Desenvolvido por Mateus Araujo
            </p>
            <p className="text-[11px] opacity-80">
              © {new Date().getFullYear()} Poupagaio Finance. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-[#DCE2DE] dark:border-[#2B322F] bg-white/95 dark:bg-[#1C211E]/95 backdrop-blur-md px-2 py-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom))] z-40 flex items-center justify-between">
        <button
          type="button"
          onClick={() => handleNavClick('home')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
            currentTab === 'home'
              ? 'text-[#02402E] dark:text-[#78D9A6] font-bold'
              : 'text-[#5E6963] dark:text-[#95A39B]'
          }`}
        >
          <Home className={`w-5 h-5 ${currentTab === 'home' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-0.5 leading-tight font-medium">Início</span>
        </button>

        <button
          type="button"
          onClick={() => handleNavClick('movements')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
            currentTab === 'movements'
              ? 'text-[#02402E] dark:text-[#78D9A6] font-bold'
              : 'text-[#5E6963] dark:text-[#95A39B]'
          }`}
        >
          <ArrowLeftRight className={`w-5 h-5 ${currentTab === 'movements' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-0.5 leading-tight font-medium truncate max-w-[60px]">Movimentos</span>
        </button>

        <div className="flex flex-col items-center justify-center px-1">
          <button
            type="button"
            onClick={() => setIsActionSheetOpen(true)}
            aria-label="Abrir ações rápidas"
            className="w-12 h-12 rounded-full bg-[#16A66A] hover:bg-[#02402E] text-white flex items-center justify-center shadow-md -mt-5 border-4 border-[#EAEDEB] dark:border-[#121614] transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => handleNavClick('planning')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
            currentTab === 'planning'
              ? 'text-[#02402E] dark:text-[#78D9A6] font-bold'
              : 'text-[#5E6963] dark:text-[#95A39B]'
          }`}
        >
          <Target className={`w-5 h-5 ${currentTab === 'planning' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-0.5 leading-tight font-medium truncate max-w-[60px]">Planejar</span>
        </button>

        <button
          type="button"
          onClick={() => handleNavClick('profile')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
            currentTab === 'profile'
              ? 'text-[#02402E] dark:text-[#78D9A6] font-bold'
              : 'text-[#5E6963] dark:text-[#95A39B]'
          }`}
        >
          <User className={`w-5 h-5 ${currentTab === 'profile' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-0.5 leading-tight font-medium">Perfil</span>
        </button>
      </nav>

      {/* FLOATING POUPAGAIO ASSISTANT */}
      <FloatingPoupagaio onSelectTab={handleNavClick} />

      {/* BOTTOM SHEET ACTION SHEET MOBILE */}
      {isActionSheetOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex flex-col justify-end animate-in fade-in duration-200 md:hidden"
          onClick={() => setIsActionSheetOpen(false)}
        >
          <div
            className="bg-white dark:bg-[#1C211E] border-t border-[#DCE2DE] dark:border-[#2B322F] rounded-t-3xl p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-[#DCE2DE] dark:bg-[#2B322F] rounded-full mx-auto" />

            <div className="flex items-center justify-between pb-1 border-b border-[#DCE2DE] dark:border-[#2B322F]">
              <div>
                <h3 className="font-bold text-base font-display text-[#202724] dark:text-[#F4F4F5]">
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
                    className="flex items-center gap-3 p-3 rounded-2xl border border-[#DCE2DE] dark:border-[#2B322F] bg-[#F7F9F8] dark:bg-[#181B1A] hover:bg-[#16A66A]/10 transition-all text-left cursor-pointer group"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#202724] dark:text-[#F4F4F5] group-hover:text-[#02402E] dark:group-hover:text-[#78D9A6] truncate">
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
