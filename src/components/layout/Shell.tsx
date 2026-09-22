import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { POUPAGAIO_MASCOT_URL } from '../../assets/mascot';
import { PoupagaioLogo } from '../branding/PoupagaioLogo';
import { SpaceSelector } from './SpaceSelector';
import { SupabaseSchemaNotice } from './SupabaseSchemaNotice';
import { FloatingPoupagaio } from './FloatingPoupagaio';
import { BotanicalLeaves } from './BotanicalLeaves';
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
  Sun,
  Moon,
  LogOut,
  X,
  Bell,
  AlertCircle,
  Clock,
  HelpCircle,
  Menu,
  Youtube,
  Instagram,
  Linkedin,
} from 'lucide-react';
import { ActiveTab } from '../../types';
import { EntryModal } from '../entries/EntryModal';
import { VariableExpenseModal } from '../variable-expenses/VariableExpenseModal';
import { FixedExpenseModal } from '../fixed-expenses/FixedExpenseModal';
import { InstallmentPurchaseModal } from '../installments/InstallmentPurchaseModal';
import { entriesService } from '../../lib/services/entries';
import { variableExpensesService } from '../../lib/services/variableExpenses';
import { fixedExpensesService } from '../../lib/services/fixedExpenses';
import { installmentsService } from '../../lib/services/installments';
import {
  CreateEntryInput,
  UpdateEntryInput,
  CreateVariableExpenseInput,
  UpdateVariableExpenseInput,
  CreateFixedExpenseInput,
  UpdateFixedExpenseInput,
  CreateInstallmentPurchaseInput,
  UpdateInstallmentPurchaseInput,
} from '../../types';

interface ShellProps {
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  children: React.ReactNode;
  selectedYear?: number;
  selectedMonth?: number;
  onRefreshData?: () => void;
}

export function Shell({
  currentTab,
  onSelectTab,
  children,
  selectedYear,
  selectedMonth,
  onRefreshData,
}: ShellProps) {
  const { user, profile, currentSpace, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [alerts, setAlerts] = useState<FinancialAlert[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);

  // State for direct creation modals opened via Poupagaio
  const [poupagaioModal, setPoupagaioModal] = useState<
    'entries' | 'variable_expenses' | 'fixed_expenses' | 'installments' | null
  >(null);

  // Save handlers for Poupagaio direct modals
  const handleSaveEntryPoupagaio = async (data: CreateEntryInput | UpdateEntryInput): Promise<boolean> => {
    if (!user || !currentSpace?.id) return false;
    const res = await entriesService.createEntry(user.id, data as CreateEntryInput);
    if (res.error) {
      throw new Error(res.error);
    }
    setPoupagaioModal(null);
    if (onRefreshData) onRefreshData();
    return true;
  };

  const handleSaveVariableExpensePoupagaio = async (data: CreateVariableExpenseInput | UpdateVariableExpenseInput): Promise<boolean> => {
    if (!user || !currentSpace?.id) return false;
    const res = await variableExpensesService.createVariableExpense(user.id, data as CreateVariableExpenseInput);
    if (res.error) {
      throw new Error(res.error);
    }
    setPoupagaioModal(null);
    if (onRefreshData) onRefreshData();
    return true;
  };

  const handleSaveFixedExpensePoupagaio = async (data: CreateFixedExpenseInput | UpdateFixedExpenseInput): Promise<boolean> => {
    if (!user || !currentSpace?.id) return false;
    const res = await fixedExpensesService.createFixedExpense(user.id, data as CreateFixedExpenseInput);
    if (res.error) {
      throw new Error(res.error);
    }
    setPoupagaioModal(null);
    if (onRefreshData) onRefreshData();
    return true;
  };

  const handleSaveInstallmentPoupagaio = async (input: CreateInstallmentPurchaseInput | UpdateInstallmentPurchaseInput): Promise<{ success: boolean; error?: string }> => {
    if (!user || !currentSpace?.id) return { success: false, error: 'Espaço indisponível' };
    const res = await installmentsService.createPurchase({
      ...input,
      space_id: currentSpace.id,
    } as CreateInstallmentPurchaseInput);
    if (!res.error) {
      setPoupagaioModal(null);
      if (onRefreshData) onRefreshData();
      return { success: true };
    }
    return { success: false, error: res.error };
  };

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

  const navItems: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: 'home', label: 'Início', icon: Home },
    { id: 'movements', label: 'Movimentações', icon: ArrowLeftRight },
    { id: 'planning', label: 'Planejamento', icon: Target },
    { id: 'entries', label: 'Entradas', icon: ArrowUpRight },
    { id: 'fixed_expenses', label: 'Gastos Fixos', icon: FileText },
    { id: 'variable_expenses', label: 'Gastos Variáveis', icon: CreditCard },
    { id: 'installments', label: 'Parcelados', icon: Calendar },
    { id: 'market', label: 'Mercado', icon: ShoppingBag },
    { id: 'goals', label: 'Metas', icon: Target },
    { id: 'wishlist', label: 'Lista de Desejos', icon: Gift },
    { id: 'reports', label: 'Visão Financeira', icon: BarChart3 },
    { id: 'closing', label: 'Fechamento', icon: CalendarCheck },
    { id: 'support', label: 'Suporte', icon: HelpCircle },
  ];

  const handleNavClick = (tab: ActiveTab) => {
    onSelectTab(tab);
    setIsMobileMenuOpen(false);
    setIsNotificationsOpen(false);
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#EAEDEB] dark:bg-[#121614] text-[#202724] dark:text-[#F4F4F5] transition-colors duration-200 relative overflow-x-hidden">
      {/* Botanical Background Leaf Elements */}
      <BotanicalLeaves />

      {/* DESKTOP + MOBILE STICKY TRANSLUCENT NAVIGATION HEADER */}
      <header
        className={`sticky top-0 z-40 w-full border-b backdrop-blur-md transition-all duration-300 select-none ${
          isScrolled
            ? 'bg-[#EBF0EC]/95 dark:bg-[#161B18]/95 border-[#D2DDD6] dark:border-[#28322C] shadow-2xs opacity-100'
            : 'bg-[#EBF0EC]/80 dark:bg-[#161B18]/80 border-[#D2DDD6]/50 dark:border-[#28322C]/50 opacity-95 hover:opacity-100'
        }`}
      >
        {/* Top line: Brand, Space Selector & User Controls */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 gap-2 sm:gap-4 max-w-[1480px] mx-auto">
          {/* Left: Brand & Space */}
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            <div className="flex items-center gap-2 sm:gap-2.5 cursor-pointer shrink-0" onClick={() => handleNavClick('home')}>
              <PoupagaioLogo className="h-10 sm:h-12 md:h-14" />
              <div className="min-w-0 flex flex-col justify-center">
                <div className="font-bold text-sm sm:text-base md:text-lg tracking-tight font-display text-[#02402E] dark:text-[#78D9A6] leading-tight flex items-center gap-1">
                  <span>Poupagaio</span>
                  <span className="text-[#16A66A] dark:text-[#34D399] font-medium text-xs sm:text-sm">Finance</span>
                </div>
                <p className="text-[10px] text-[#5E6963] dark:text-[#95A39B] leading-none hidden lg:block">
                  Organize hoje, conquiste amamanhã.
                </p>
              </div>
            </div>

            <div className="h-5 w-px bg-[#DCE2DE] dark:bg-[#2B322F] hidden sm:block shrink-0" />

            <div className="hidden sm:block min-w-[150px] md:min-w-[180px]">
              <SpaceSelector />
            </div>
          </div>

          {/* Right: Notifications, Theme & Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
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
              className={`flex items-center gap-2 px-2 py-1 sm:px-2.5 sm:py-1 rounded-xl border transition-colors cursor-pointer text-left ${
                currentTab === 'profile'
                  ? 'bg-[#16A66A]/15 border-[#16A66A]/40 text-[#02402E] dark:bg-[#16A66A]/25 dark:text-[#78D9A6]'
                  : 'border-[#DCE2DE] dark:border-[#2B322F] hover:bg-black/5 text-[#202724] dark:hover:bg-white/5 dark:text-[#F4F4F5]'
              }`}
            >
              <Avatar
                name={profile?.full_name || user?.full_name || user?.email || 'U'}
                size="sm"
              />
              <span className="text-xs font-bold max-w-[90px] truncate hidden md:inline">
                {profile?.full_name?.split(' ')[0] || user?.full_name?.split(' ')[0] || 'Usuário'}
              </span>
            </button>

            {/* Mobile Menu Trigger */}
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

        {/* Mobile Space Selector Bar (Prevents congestion on mobile header) */}
        <div className="sm:hidden px-3 py-1.5 border-t border-[#D2DDD6]/60 dark:border-[#28322C]/60 bg-[#EBF0EC]/90 dark:bg-[#161B18]/90">
          <SpaceSelector />
        </div>

        {/* Desktop Horizontal Navigation Bar */}
        <nav className="hidden md:flex items-center px-6 py-1.5 overflow-x-auto gap-1.5 no-scrollbar border-t border-[#D2DDD6]/60 dark:border-[#28322C]/60 max-w-[1480px] mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#02402E] text-white dark:bg-[#16A66A] dark:text-[#101614] shadow-2xs font-bold'
                    : 'text-[#5E6963] dark:text-[#95A39B] hover:text-[#02402E] dark:hover:text-[#F4F4F5] hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white dark:text-[#101614]' : 'text-[#16A66A]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
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
                <PoupagaioLogo className="h-9 sm:h-10" />
                <h3 className="font-bold text-sm font-display text-[#02402E] dark:text-[#78D9A6]">
                  Navegação Poupagaio
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

            <div className="grid grid-cols-2 gap-2 pt-1">
              {navItems.map((item) => {
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
        </div>
      )}

      {/* SUPABASE SCHEMA NOTICE */}
      <SupabaseSchemaNotice />

      {/* NATURAL VERTICAL SCROLL MAIN CONTENT AREA */}
      <main className="flex-1 w-full max-w-[1480px] mx-auto px-2 sm:px-6 py-4 sm:py-6 relative z-10">
        {children}
      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-[#D2DDD6] dark:border-[#28322C] bg-white/80 dark:bg-[#161B18]/80 backdrop-blur-md py-8 px-4 sm:px-8 mt-12 transition-colors relative z-10">
        <div className="max-w-[1480px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-1.5">
            <div className="flex items-center justify-center md:justify-start gap-2.5">
              <PoupagaioLogo className="h-9 sm:h-10" />
              <div className="flex items-center gap-1 font-bold font-display text-sm sm:text-base text-[#02402E] dark:text-[#78D9A6]">
                <span>Poupagaio</span>
                <span className="text-[#16A66A] dark:text-[#34D399] font-medium text-xs">Finance</span>
              </div>
            </div>
            <p className="text-xs text-[#5E6963] dark:text-[#95A39B]">
              Organize hoje. Você mais longe.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 text-xs font-semibold text-[#5E6963] dark:text-[#95A39B]">
            <button onClick={() => onSelectTab('home')} className="hover:text-[#02402E] dark:hover:text-[#78D9A6] transition-colors cursor-pointer">Início</button>
            <button onClick={() => onSelectTab('reports')} className="hover:text-[#02402E] dark:hover:text-[#78D9A6] transition-colors cursor-pointer">Visão Financeira</button>
            <button onClick={() => onSelectTab('support')} className="hover:text-[#02402E] dark:hover:text-[#78D9A6] transition-colors cursor-pointer">Suporte</button>
            <button onClick={() => onSelectTab('profile')} className="hover:text-[#02402E] dark:hover:text-[#78D9A6] transition-colors cursor-pointer">Meu Perfil</button>
          </div>

          {/* Credits & Social */}
          <div className="text-xs text-[#5E6963] dark:text-[#95A39B] space-y-2">
            <p className="font-bold text-[#02402E] dark:text-[#78D9A6]">
              Desenvolvido por Mateus Araujo
            </p>
            <div className="flex items-center justify-center md:justify-end gap-3 text-[#02402E] dark:text-[#78D9A6]">
              <Youtube className="w-4 h-4 cursor-pointer hover:opacity-80 transition-opacity" />
              <Instagram className="w-4 h-4 cursor-pointer hover:opacity-80 transition-opacity" />
              <Linkedin className="w-4 h-4 cursor-pointer hover:opacity-80 transition-opacity" />
            </div>
            <p className="text-[11px] opacity-80">
              © 2026 Poupagaio Finance. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* FLOATING POUPAGAIO QUICK ACCESS ASSISTANT */}
      <FloatingPoupagaio
        onSelectTab={handleNavClick}
        currentTab={currentTab}
        onOpenCreateModal={(modalType) => setPoupagaioModal(modalType)}
      />

      {/* POUPAGAIO DIRECT CREATION MODALS */}
      {currentSpace?.id && (
        <>
          <EntryModal
            isOpen={poupagaioModal === 'entries'}
            onClose={() => setPoupagaioModal(null)}
            onSave={handleSaveEntryPoupagaio}
            spaceId={currentSpace.id}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
          />

          <VariableExpenseModal
            isOpen={poupagaioModal === 'variable_expenses'}
            onClose={() => setPoupagaioModal(null)}
            onSave={handleSaveVariableExpensePoupagaio}
            spaceId={currentSpace.id}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
          />

          <FixedExpenseModal
            isOpen={poupagaioModal === 'fixed_expenses'}
            onClose={() => setPoupagaioModal(null)}
            onSave={handleSaveFixedExpensePoupagaio}
            spaceId={currentSpace.id}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
          />

          <InstallmentPurchaseModal
            isOpen={poupagaioModal === 'installments'}
            onClose={() => setPoupagaioModal(null)}
            onSave={handleSaveInstallmentPoupagaio}
            spaceId={currentSpace.id}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
          />
        </>
      )}
    </div>
  );
}
