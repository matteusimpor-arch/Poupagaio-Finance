import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
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
  User,
  Settings,
  LogOut,
  X,
  Plus,
  Bell,
  AlertCircle,
  Clock,
  Menu,
} from 'lucide-react';
import { ActiveTab } from '../../types';
import { QUICK_ACTION_ITEMS } from '../../lib/constants/quickActions';

interface ShellProps {
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  children: React.ReactNode;
}

export function Shell({ currentTab, onSelectTab, children }: ShellProps) {
  const { user, profile, currentSpace, signOut } = useAuth();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isMobileNotificationsOpen, setIsMobileNotificationsOpen] = useState(false);
  const [alerts, setAlerts] = useState<FinancialAlert[]>([]);

  useEffect(() => {
    async function loadAlerts() {
      if (!currentSpace?.id) return;
      const now = new Date();
      try {
        const res = await checklistService.getMonthlyChecklist(
          currentSpace.id,
          now.getFullYear(),
          now.getMonth() + 1
        );
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
    { id: 'entries', label: 'Entradas', icon: ArrowLeftRight },
    { id: 'fixed_expenses', label: 'Gastos Fixos', icon: FileText },
    { id: 'variable_expenses', label: 'Gastos Variáveis', icon: CreditCard },
    { id: 'installments', label: 'Parcelados', icon: Calendar },
    { id: 'market', label: 'Mercado', icon: ShoppingBag },
    { id: 'goals', label: 'Metas', icon: Target },
    { id: 'wishlist', label: 'Lista de Desejos', icon: Gift },
    { id: 'reports', label: 'Visão Financeira', icon: BarChart3 },
    { id: 'closing', label: 'Fechamento', icon: CalendarCheck },
  ];

  const handleNavClick = (tab: ActiveTab) => {
    onSelectTab(tab);
    setIsMobileDrawerOpen(false);
    setIsActionSheetOpen(false);
  };

  const actionSheetItems = QUICK_ACTION_ITEMS;

  const fullName = profile?.full_name || user?.full_name || 'Mateus Araujo';
  const userEmail = user?.email || 'matteuss.a@icloud.com';

  return (
    <div className="h-[100dvh] w-full flex bg-[#02402E] text-[#202724] font-sans antialiased overflow-hidden relative">
      {/* Botanical leaf silhouette watermark in background */}
      <div className="absolute right-0 top-0 bottom-0 w-96 pointer-events-none opacity-15 overflow-hidden hidden lg:block z-0">
        <svg viewBox="0 0 400 800" className="w-full h-full object-cover" fill="#03543D">
          <path d="M400,0 C300,100 250,250 350,400 C450,550 300,700 400,800 L400,0 Z" />
          <path d="M350,150 C280,180 200,240 260,320 C320,400 220,500 380,620" fill="none" stroke="#04694C" strokeWidth="12" strokeLinecap="round" opacity="0.4" />
          <circle cx="340" cy="220" r="40" opacity="0.2" />
          <circle cx="280" cy="380" r="55" opacity="0.15" />
          <circle cx="360" cy="540" r="45" opacity="0.25" />
        </svg>
      </div>

      {/* ==================================================
          DESKTOP SIDEBAR (Visible on md and up)
          Matching visual reference:
          Deep green bg #013324, gold active pill, clean icons
          ================================================== */}
      <aside className="hidden md:flex flex-col w-56 lg:w-60 h-[100dvh] border-r border-[#03543D] bg-[#013324] p-3.5 lg:p-4 shrink-0 select-none z-20 shadow-lg relative">
        {/* Top Header: Brand Header */}
        <div className="shrink-0 flex items-center gap-3 pb-3.5 border-b border-[#03543D]/60">
          <div className="w-9 h-9 rounded-xl overflow-hidden border border-[#F2B807]/30 bg-white p-0.5 shrink-0 shadow-2xs">
            <img
              src={POUPAGAIO_MASCOT_URL}
              alt="Poupagaio Mascot"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-sm tracking-tight font-display text-white truncate">
                Poupagaio
              </h1>
              <span className="text-[11px] font-bold text-[#F2B807] font-display">
                Finance
              </span>
            </div>
            <p className="text-[9.5px] text-[#A4C9BE] truncate leading-tight mt-0.5">
              Mais que controle, mais liberdade.
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 min-h-0 overflow-y-auto py-2 pr-1 space-y-1 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-desktop-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                type="button"
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#F2B807] text-[#02402E] font-bold shadow-xs'
                    : 'text-[#E2EDE8] hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-[#02402E] stroke-[2.5]' : 'text-[#A4C9BE]'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Space Selector Card */}
        <div className="shrink-0 pt-2.5 pb-2 border-t border-[#03543D]/60">
          <SpaceSelector />
        </div>

        {/* Bottom Sidebar: User Profile & Actions */}
        <div className="shrink-0 pt-2 border-t border-[#03543D]/60 space-y-1">
          {/* User Info Card */}
          <div className="flex items-center gap-2.5 p-1 rounded-xl">
            <Avatar name={fullName} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{fullName}</p>
              <p className="text-[10px] text-[#A4C9BE] truncate">{userEmail}</p>
            </div>
          </div>

          {/* Configurações Link */}
          <button
            type="button"
            id="nav-desktop-settings"
            onClick={() => handleNavClick('profile')}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              currentTab === 'profile'
                ? 'bg-white/15 text-[#F2B807] font-bold'
                : 'text-[#A4C9BE] hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-3.5 h-3.5 shrink-0" />
            <span>Configurações</span>
          </button>

          {/* Sair Button */}
          <button
            type="button"
            id="sidebar-logout-btn"
            onClick={() => signOut()}
            aria-label="Sair da conta"
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* ==================================================
          MOBILE DRAWER SIDEBAR (When opened via Menu button)
          ================================================== */}
      {isMobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex md:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileDrawerOpen(false)}
        >
          <div
            className="w-72 max-w-[85vw] h-full bg-[#013324] border-r border-[#03543D] p-4 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-200 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-[#03543D]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl overflow-hidden border border-[#F2B807]/30 bg-white p-0.5 shrink-0">
                    <img
                      src={POUPAGAIO_MASCOT_URL}
                      alt="Poupagaio Mascot"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm text-white">Poupagaio Finance</h2>
                    <p className="text-[10px] text-[#A4C9BE]">Organize hoje. Voe mais longe.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-[#A4C9BE]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Space Selector in Drawer */}
              <div className="py-2.5">
                <SpaceSelector />
              </div>

              {/* Navigation list */}
              <nav className="space-y-1 py-1 max-h-[50vh] overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      type="button"
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                        isActive
                          ? 'bg-[#F2B807] text-[#02402E] font-bold shadow-xs'
                          : 'text-[#E2EDE8] hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Profile */}
            <div className="pt-3 border-t border-[#03543D] space-y-2">
              <div className="flex items-center gap-2.5">
                <Avatar name={fullName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{fullName}</p>
                  <p className="text-[10px] text-[#A4C9BE] truncate">{userEmail}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => handleNavClick('profile')}
                  className="text-xs text-[#A4C9BE] font-medium flex items-center gap-1 hover:text-white"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Configurações</span>
                </button>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="text-xs text-rose-400 font-medium flex items-center gap-1 hover:text-rose-300"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          MAIN CONTENT AREA
          ================================================== */}
      <div className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-hidden bg-[#02402E] relative z-10">
        {/* MOBILE TOP BAR */}
        <header className="md:hidden flex items-center justify-between px-4 py-2.5 pt-[calc(0.625rem+env(safe-area-inset-top))] border-b border-[#03543D] bg-[#013324] sticky top-0 z-30 shadow-2xs text-white">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              aria-label="Menu"
              className="p-1.5 rounded-lg border border-[#03543D] bg-[#02402E] text-[#F2B807] hover:bg-white/5 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg overflow-hidden border border-[#F2B807]/30 bg-white p-0.5 shrink-0">
                <img
                  src={POUPAGAIO_MASCOT_URL}
                  alt="Poupagaio Mascot"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-bold text-sm tracking-tight font-display text-white">
                Poupagaio Finance
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                id="mobile-header-notifications-btn"
                onClick={() => setIsMobileNotificationsOpen(!isMobileNotificationsOpen)}
                aria-label="Notificações"
                className="p-2 rounded-xl border border-[#03543D] bg-[#02402E] hover:bg-white/5 text-[#A4C9BE] cursor-pointer relative"
              >
                <Bell className="w-4 h-4" />
                {alerts.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-[#02402E]" />
                )}
              </button>

              {isMobileNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-[#E8E4D5] bg-white p-4 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 text-[#202724]">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E8E4D5]">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#02402E] flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-[#02402E]" />
                      Alertas Ativos ({alerts.length})
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsMobileNotificationsOpen(false)}
                      className="p-1 text-[#5E6963] hover:text-[#202724] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {alerts.length === 0 ? (
                    <div className="py-5 text-center space-y-1">
                      <p className="text-xs font-semibold text-[#202724]">Tudo em dia!</p>
                      <p className="text-[11px] text-[#5E6963]">
                        Você não tem lembretes ou avisos pendentes.
                      </p>
                    </div>
                  ) : (
                    <div className="py-2 divide-y divide-[#E8E4D5]/50 max-h-[280px] overflow-y-auto">
                      {alerts.slice(0, 5).map((alert) => (
                        <div
                          key={alert.id}
                          onClick={() => {
                            setIsMobileNotificationsOpen(false);
                            onSelectTab('calendar');
                          }}
                          className="py-2.5 text-left cursor-pointer hover:bg-black/2 transition-colors flex items-start gap-2.5"
                        >
                          {alert.severity === 'critical' ? (
                            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                          ) : (
                            <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[#202724] truncate">
                              {alert.title}
                            </p>
                            <p className="text-[10px] text-[#5E6963]">
                              Vence em: {alert.dueDate.split('-').reverse().join('/')} •{' '}
                              {formatCurrency(alert.amount)}
                            </p>
                          </div>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                              alert.severity === 'critical'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {alert.badgeText}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* SUPABASE SCHEMA NOTICE */}
        <SupabaseSchemaNotice />

        {/* MAIN CONTAINER:
            On desktop Home, fits exactly in 100dvh without page scroll!
            On mobile or other tabs, scrolls cleanly.
        */}
        <main
          className={`flex-1 min-h-0 ${
            currentTab === 'home'
              ? 'overflow-y-auto lg:overflow-hidden p-3 sm:p-4 lg:p-4 xl:p-5 flex flex-col justify-between pb-24 md:pb-4'
              : 'overflow-y-auto p-3 sm:p-5 lg:p-6 pb-24 md:pb-6'
          }`}
        >
          {children}
        </main>

        {/* MOBILE BOTTOM NAVIGATION */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-[#03543D] bg-[#013324]/95 backdrop-blur-md px-2 py-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom))] z-40 flex items-center justify-between shadow-lg text-white">
          {/* Item 1: Início */}
          <button
            type="button"
            id="nav-mobile-home"
            onClick={() => handleNavClick('home')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              currentTab === 'home'
                ? 'text-[#F2B807] font-bold'
                : 'text-[#A4C9BE] hover:text-white'
            }`}
          >
            <Home className={`w-5 h-5 ${currentTab === 'home' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-0.5 leading-tight font-medium">Início</span>
          </button>

          {/* Item 2: Entradas */}
          <button
            type="button"
            id="nav-mobile-entries"
            onClick={() => handleNavClick('entries')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              currentTab === 'entries'
                ? 'text-[#F2B807] font-bold'
                : 'text-[#A4C9BE] hover:text-white'
            }`}
          >
            <ArrowLeftRight
              className={`w-5 h-5 ${currentTab === 'entries' ? 'stroke-[2.5]' : 'stroke-2'}`}
            />
            <span className="text-[10px] mt-0.5 leading-tight font-medium truncate max-w-[60px]">
              Entradas
            </span>
          </button>

          {/* Item 3 CENTRAL: Botão "+" Destaque */}
          <div className="flex flex-col items-center justify-center px-1">
            <button
              type="button"
              id="nav-mobile-plus-action"
              onClick={() => setIsActionSheetOpen(true)}
              aria-label="Abrir ações rápidas"
              className="w-12 h-12 rounded-full bg-[#F2B807] hover:bg-[#F29F05] text-[#02402E] flex items-center justify-center shadow-md -mt-5 border-4 border-[#013324] transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-6 h-6 stroke-[3]" />
            </button>
          </div>

          {/* Item 4: Visão Financeira */}
          <button
            type="button"
            id="nav-mobile-reports"
            onClick={() => handleNavClick('reports')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              currentTab === 'reports'
                ? 'text-[#F2B807] font-bold'
                : 'text-[#A4C9BE] hover:text-white'
            }`}
          >
            <BarChart3
              className={`w-5 h-5 ${currentTab === 'reports' ? 'stroke-[2.5]' : 'stroke-2'}`}
            />
            <span className="text-[10px] mt-0.5 leading-tight font-medium truncate max-w-[60px]">
              Relatórios
            </span>
          </button>

          {/* Item 5: Perfil */}
          <button
            type="button"
            id="nav-mobile-profile"
            onClick={() => handleNavClick('profile')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              currentTab === 'profile'
                ? 'text-[#F2B807] font-bold'
                : 'text-[#A4C9BE] hover:text-white'
            }`}
          >
            <User
              className={`w-5 h-5 ${currentTab === 'profile' ? 'stroke-[2.5]' : 'stroke-2'}`}
            />
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
            className="bg-[#FAF8EE] border-t border-[#E8E4D5] rounded-t-3xl p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Barra tátil superior */}
            <div className="w-12 h-1.5 bg-[#E8E4D5] rounded-full mx-auto" />

            <div className="flex items-center justify-between pb-1 border-b border-[#E8E4D5]">
              <div>
                <h3 className="font-bold text-base font-display text-[#02402E]">
                  O que você quer fazer?
                </h3>
                <p className="text-xs text-[#5E6963]">
                  Selecione um módulo para registrar ou gerenciar
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsActionSheetOpen(false)}
                className="p-1.5 rounded-full hover:bg-black/5 text-[#5E6963] cursor-pointer"
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
                    className="flex items-center gap-3 p-3 rounded-2xl border border-[#E8E4D5] bg-white hover:bg-[#F2B807]/20 transition-all text-left cursor-pointer group"
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#02402E] truncate">{item.label}</p>
                      <p className="text-[10px] text-[#5E6963] truncate">{item.description}</p>
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
