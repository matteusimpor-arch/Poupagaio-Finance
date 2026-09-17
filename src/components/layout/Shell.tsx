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

  // Exactly as requested in Section 7: Início, Movimentações, Planejamento, Perfil
  const mobileBottomNav: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: 'home', label: 'Início', icon: Home },
    { id: 'movements', label: 'Movimentações', icon: ArrowLeftRight },
    { id: 'planning', label: 'Planejamento', icon: Target },
    { id: 'profile', label: 'Perfil', icon: User },
  ];

  const handleNavClick = (tab: ActiveTab) => {
    onSelectTab(tab);
    setIsMoreMenuOpen(false);
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
        <header className="md:hidden flex items-center justify-between p-4 border-b border-[#E8E4D5] dark:border-[#24312B] bg-white dark:bg-[#141C18] sticky top-0 z-30">
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
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Alternar tema"
              className="p-2 rounded-xl border border-[#E8E4D5] hover:bg-black/5 dark:border-[#24312B] dark:hover:bg-white/5 text-[#5E6963] dark:text-[#95A39B] cursor-pointer"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-[#D6A84B]" />}
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('profile')}
              aria-label="Abrir perfil"
              className="cursor-pointer"
            >
              <Avatar
                name={profile?.full_name || user?.full_name || user?.email || 'U'}
                size="sm"
              />
            </button>
          </div>
        </header>

        {/* MOBILE SPACE SELECTOR BAR */}
        <div className="md:hidden px-4 py-2 border-b border-[#E8E4D5] dark:border-[#24312B] bg-[#F7F4EA]/80 dark:bg-[#101614]/80 backdrop-blur-sm">
          <SpaceSelector />
        </div>

        {/* SUPABASE SCHEMA NOTICE */}
        <SupabaseSchemaNotice />

        {/* SCROLLABLE VIEW CONTAINER */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>

        {/* MOBILE BOTTOM NAVIGATION */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-[#E8E4D5] dark:border-[#24312B] bg-white/95 dark:bg-[#141C18]/95 backdrop-blur-md px-2 py-2 z-40 flex items-center justify-around">
          {mobileBottomNav.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                id={`nav-mobile-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                type="button"
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl min-w-[64px] transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#075C45] dark:text-[#78D9A6] font-bold'
                    : 'text-[#5E6963] dark:text-[#95A39B] hover:text-[#202724] dark:hover:text-[#F7F4EA]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-[11px] mt-0.5 leading-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* MOBILE "MAIS" MODULES DRAWER / MODAL */}
      {isMoreMenuOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex flex-col justify-end animate-in fade-in duration-150 md:hidden">
          <div className="bg-white dark:bg-[#141C18] border-t border-[#E8E4D5] dark:border-[#24312B] rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E4D5] dark:border-[#24312B]">
              <h3 className="font-bold text-base font-display text-[#075C45] dark:text-[#78D9A6]">
                Todos os Módulos
              </h3>
              <button
                type="button"
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#5E6963] dark:text-[#95A39B] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {sidebarNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    type="button"
                    className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-semibold text-left transition-colors cursor-pointer ${
                      isActive
                        ? 'border-[#16A66A] bg-[#075C45] text-white dark:bg-[#16A66A] dark:text-[#101614]'
                        : 'border-[#E8E4D5] dark:border-[#24312B] bg-[#F7F4EA]/50 dark:bg-[#18211D] text-[#202724] dark:text-[#F7F4EA]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#E8E4D5] dark:border-[#24312B] flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleNavClick('profile')}
                className="flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-medium text-[#075C45] dark:text-[#78D9A6] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>Perfil & Configurações</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  signOut();
                }}
                className="flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
