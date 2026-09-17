import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { POUPAGAIO_MASCOT_URL } from '../../assets/mascot';
import { SpaceSelector } from './SpaceSelector';
import { SupabaseSchemaNotice } from './SupabaseSchemaNotice';
import { Avatar } from '../ui/avatar';
import {
  Home,
  ArrowUpRight,
  ArrowLeftRight,
  CreditCard,
  FileText,
  Calendar,
  ShoppingBag,
  TrendingUp,
  Target,
  Gift,
  CalendarCheck,
  MoreHorizontal,
  User,
  Sun,
  Moon,
  LogOut,
  X,
  Plus,
  Bell,
} from 'lucide-react';
import { ActiveTab } from '../../types';

interface ShellProps {
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  children: React.ReactNode;
}

export function Shell({ currentTab, onSelectTab, children }: ShellProps) {
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isMobileNotificationsOpen, setIsMobileNotificationsOpen] = useState(false);

  const sidebarNavItems: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: 'home', label: 'Início', icon: Home },
    { id: 'movements', label: 'Movimentações', icon: ArrowLeftRight },
    { id: 'planning', label: 'Planejamento', icon: Target },
    { id: 'entries', label: 'Entradas', icon: ArrowUpRight },
    { id: 'fixed_expenses', label: 'Gastos Fixos', icon: FileText },
    { id: 'variable_expenses', label: 'Gastos Variáveis', icon: CreditCard },
    { id: 'installments', label: 'Parcelados', icon: Calendar },
    { id: 'market', label: 'Mercado', icon: ShoppingBag },
    { id: 'investments', label: 'Investimentos', icon: TrendingUp },
    { id: 'goals', label: 'Metas', icon: Target },
    { id: 'wishlist', label: 'Lista de Desejos', icon: Gift },
    { id: 'closing', label: 'Fechamento', icon: CalendarCheck },
  ];

  // Action Sheet Items for Mobile "+" Button
  const actionSheetItems: { id: ActiveTab; label: string; description: string; icon: React.ElementType; color: string }[] = [
    { id: 'entries', label: 'Entradas', description: 'Receitas e ganhos', icon: ArrowUpRight, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400' },
    { id: 'fixed_expenses', label: 'Gastos Fixos', description: 'Contas recorrentes', icon: FileText, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400' },
    { id: 'variable_expenses', label: 'Gastos Variáveis', description: 'Despesas do dia a dia', icon: CreditCard, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400' },
    { id: 'installments', label: 'Parcelados', description: 'Compras em parcelas', icon: Calendar, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400' },
    { id: 'market', label: 'Mercado', description: 'Listas e compras', icon: ShoppingBag, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/40 dark:text-orange-400' },
    { id: 'investments', label: 'Investimentos', description: 'Aplicações e resgates', icon: TrendingUp, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400' },
    { id: 'goals', label: 'Metas', description: 'Objetivos financeiros', icon: Target, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40 dark:text-teal-400' },
    { id: 'wishlist', label: 'Lista de Desejos', description: 'Sonhos de consumo', icon: Gift, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400' },
    { id: 'closing', label: 'Fechamento', description: 'Resumo da competência', icon: CalendarCheck, color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 dark:text-cyan-400' },
  ];

  const handleNavClick = (tab: ActiveTab) => {
    onSelectTab(tab);
    setIsMoreMenuOpen(false);
    setIsActionSheetOpen(false);
  };

  return (
    <div className="min-h-screen w-full flex bg-[#F7F4EA] dark:bg-[#101614] text-[#202724] dark:text-[#F7F4EA] transition-colors duration-200">
      {/* DESKTOP SIDEBAR (Visible on md and up) */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 border-r border-[#E8E4D5] dark:border-[#24312B] bg-white dark:bg-[#141C18] p-5 shrink-0 justify-between select-none">
        <div className="space-y-5 overflow-y-auto max-h-[calc(100vh-140px)] pr-1">
          {/* Brand Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-[#16A66A]/30 bg-[#F7F4EA] dark:bg-[#18211D] p-0.5 shrink-0 shadow-sm">
              <img
                src={POUPAGAIO_MASCOT_URL}
                alt="Poupagaio Mascot"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-base tracking-tight font-display text-[#075C45] dark:text-[#78D9A6] truncate">
                Poupagaio Finance
              </h1>
              <p className="text-[11px] text-[#5E6963] dark:text-[#95A39B] truncate">
                Organize hoje. Voe mais longe.
              </p>
            </div>
          </div>

          {/* Space Selector */}
          <div className="pt-1">
            <SpaceSelector />
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1 pt-1">
            {sidebarNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-desktop-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  type="button"
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-[#075C45] text-white shadow-xs dark:bg-[#16A66A] dark:text-[#101614]'
                      : 'hover:bg-black/5 text-[#202724] dark:hover:bg-white/5 dark:text-[#F7F4EA]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white dark:text-[#101614]' : 'text-[#16A66A]'}`} />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar: User Profile & Preferences */}
        <div className="space-y-3 pt-4 border-t border-[#E8E4D5] dark:border-[#24312B] shrink-0">
          <button
            type="button"
            id="nav-desktop-profile"
            onClick={() => handleNavClick('profile')}
            className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-colors cursor-pointer text-left ${
              currentTab === 'profile'
                ? 'bg-[#16A66A]/15 text-[#075C45] dark:bg-[#16A66A]/25 dark:text-[#78D9A6]'
                : 'hover:bg-black/5 text-[#202724] dark:hover:bg-white/5 dark:text-[#F7F4EA]'
            }`}
          >
            <Avatar
              name={profile?.full_name || user?.full_name || user?.email || 'U'}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold truncate">
                {profile?.full_name || user?.full_name || 'Usuário'}
              </p>
              <p className="text-[11px] text-[#5E6963] dark:text-[#95A39B] truncate">
                {user?.email}
              </p>
            </div>
            <User className="w-4 h-4 text-[#5E6963] dark:text-[#95A39B]" />
          </button>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              id="sidebar-toggle-theme"
              onClick={toggleTheme}
              aria-label="Alternar tema"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#E8E4D5] hover:bg-black/5 dark:border-[#24312B] dark:hover:bg-white/5 text-xs text-[#5E6963] dark:text-[#95A39B] cursor-pointer transition-colors"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="w-3.5 h-3.5" />
                  <span>Escuro</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-[#D6A84B]" />
                  <span>Claro</span>
                </>
              )}
            </button>

            <button
              type="button"
              id="sidebar-logout-btn"
              onClick={() => signOut()}
              aria-label="Sair da conta"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-red-50 text-red-600 dark:hover:bg-red-950/40 dark:text-red-400 text-xs font-medium cursor-pointer transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* MOBILE TOP BAR */}
        <header className="md:hidden flex items-center justify-between px-4 py-2.5 pt-[calc(0.625rem+env(safe-area-inset-top))] border-b border-[#E8E4D5] dark:border-[#24312B] bg-white dark:bg-[#141C18] sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl overflow-hidden border border-[#16A66A]/30 bg-[#F7F4EA] dark:bg-[#18211D] p-0.5 shrink-0">
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
                onClick={() => setIsMobileNotificationsOpen(!isMobileNotificationsOpen)}
                aria-label="Notificações"
                className="p-2 rounded-xl border border-[#E8E4D5] hover:bg-black/5 dark:border-[#24312B] dark:hover:bg-white/5 text-[#5E6963] dark:text-[#95A39B] cursor-pointer relative"
              >
                <Bell className="w-4 h-4" />
                <span className="sr-only">Notificações</span>
              </button>

              {isMobileNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-[#E8E4D5] dark:border-[#24312B] bg-white dark:bg-[#18211D] p-4 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E8E4D5] dark:border-[#24312B]">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#075C45] dark:text-[#78D9A6]">
                      Notificações
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsMobileNotificationsOpen(false)}
                      className="p-1 text-[#5E6963] dark:text-[#95A39B] hover:text-[#202724] dark:hover:text-[#F7F4EA] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="py-3 text-center space-y-1">
                    <p className="text-xs font-semibold text-[#202724] dark:text-[#F7F4EA]">
                      Tudo em dia!
                    </p>
                    <p className="text-[11px] text-[#5E6963] dark:text-[#95A39B]">
                      Você não tem lembretes ou avisos pendentes.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Alternância Tema no Topo Mobile */}
            <button
              type="button"
              id="mobile-header-toggle-theme-btn"
              onClick={toggleTheme}
              aria-label="Alternar tema"
              className="p-2 rounded-xl border border-[#E8E4D5] hover:bg-black/5 dark:border-[#24312B] dark:hover:bg-white/5 text-[#5E6963] dark:text-[#95A39B] cursor-pointer"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-[#D6A84B]" />}
            </button>
          </div>
        </header>

        {/* MOBILE SPACE SELECTOR BAR */}
        <div className="md:hidden px-3.5 py-1.5 border-b border-[#E8E4D5] dark:border-[#24312B] bg-[#F7F4EA]/80 dark:bg-[#101614]/80 backdrop-blur-sm">
          <SpaceSelector />
        </div>

        {/* SUPABASE SCHEMA NOTICE */}
        <SupabaseSchemaNotice />

        {/* SCROLLABLE VIEW CONTAINER */}
        <main className="flex-1 overflow-y-auto px-3.5 py-3.5 sm:px-6 sm:py-6 md:p-8 pb-24 md:pb-8">
          {children}
        </main>

        {/* MOBILE BOTTOM NAVIGATION (5 Ícones com + Central) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-[#E8E4D5] dark:border-[#24312B] bg-white/95 dark:bg-[#141C18]/95 backdrop-blur-md px-2 py-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom))] z-40 flex items-center justify-between">
          {/* Item 1: Início */}
          <button
            type="button"
            id="nav-mobile-home"
            onClick={() => handleNavClick('home')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              currentTab === 'home'
                ? 'text-[#075C45] dark:text-[#78D9A6] font-bold'
                : 'text-[#5E6963] dark:text-[#95A39B] hover:text-[#202724] dark:hover:text-[#F7F4EA]'
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
                : 'text-[#5E6963] dark:text-[#95A39B] hover:text-[#202724] dark:hover:text-[#F7F4EA]'
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
              className="w-12 h-12 rounded-full bg-[#16A66A] hover:bg-[#075C45] text-white flex items-center justify-center shadow-md -mt-5 border-4 border-[#F7F4EA] dark:border-[#101614] transition-all cursor-pointer active:scale-95"
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
