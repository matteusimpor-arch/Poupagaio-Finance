import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { POUPAGAIO_MASCOT_URL } from '../../assets/mascot';
import { SpaceSelector } from './SpaceSelector';
import { SupabaseSchemaNotice } from './SupabaseSchemaNotice';
import { Avatar } from '../ui/avatar';
import { Badge } from '../ui/badge';
import {
  Home,
  ArrowLeftRight,
  Target,
  ShoppingBag,
  MoreHorizontal,
  User,
  Sun,
  Moon,
  LogOut,
  Info,
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
  const [comingSoonNotice, setComingSoonNotice] = useState<string | null>(null);

  const navItems: { id: ActiveTab; label: string; icon: React.ElementType; isReady: boolean }[] = [
    { id: 'home', label: 'Início', icon: Home, isReady: true },
    { id: 'transactions', label: 'Transações', icon: ArrowLeftRight, isReady: false },
    { id: 'planning', label: 'Planejar', icon: Target, isReady: false },
    { id: 'market', label: 'Mercado', icon: ShoppingBag, isReady: false },
    { id: 'more', label: 'Mais', icon: MoreHorizontal, isReady: false },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.isReady) {
      onSelectTab(item.id);
    } else {
      setComingSoonNotice(item.label);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#F7F4EA] dark:bg-[#101614] text-[#202724] dark:text-[#F7F4EA] transition-colors duration-200">
      {/* DESKTOP SIDEBAR (Visible on md and up) */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 border-r border-[#E8E4D5] dark:border-[#24312B] bg-white dark:bg-[#141C18] p-5 shrink-0 justify-between">
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-[#16A66A]/30 bg-[#F7F4EA] dark:bg-[#18211D] p-0.5 shrink-0 shadow-sm">
              <img
                src={POUPAGAIO_MASCOT_URL}
                alt="Poupagaio Mascot"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-lg"
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

          {/* Space Selector (CRITICAL ARCHITECTURE REQUIREMENT) */}
          <div className="pt-1">
            <SpaceSelector />
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-desktop-${item.id}`}
                  onClick={() => handleNavClick(item)}
                  type="button"
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-[#075C45] text-white shadow-sm dark:bg-[#16A66A] dark:text-[#101614]'
                      : 'hover:bg-black/5 text-[#202724] dark:hover:bg-white/5 dark:text-[#F7F4EA]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white dark:text-[#101614]' : 'text-[#16A66A]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {!item.isReady && (
                    <Badge variant="muted" className="text-[10px] py-0 px-2">
                      Em breve
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar: User Profile & Preferences */}
        <div className="space-y-3 pt-6 border-t border-[#E8E4D5] dark:border-[#24312B]">
          {/* Profile Quick Access Button */}
          <button
            type="button"
            id="nav-desktop-profile"
            onClick={() => onSelectTab('profile')}
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

          {/* Theme Switcher & Logout Row */}
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
        {/* MOBILE TOP BAR (Visible below md) */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-[#E8E4D5] dark:border-[#24312B] bg-white dark:bg-[#141C18] sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl overflow-hidden border border-[#16A66A]/30 bg-[#F7F4EA] dark:bg-[#18211D] p-0.5 shrink-0">
              <img
                src={POUPAGAIO_MASCOT_URL}
                alt="Poupagaio Mascot"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-lg"
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
              onClick={() => onSelectTab('profile')}
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

        {/* MOBILE SPACE SELECTOR BAR (below md) */}
        <div className="md:hidden px-4 py-2 border-b border-[#E8E4D5] dark:border-[#24312B] bg-[#F7F4EA]/80 dark:bg-[#101614]/80 backdrop-blur-sm">
          <SpaceSelector />
        </div>

        {/* SUPABASE SCHEMA PENDING NOTICE */}
        <SupabaseSchemaNotice />

        {/* SCROLLABLE VIEW CONTAINER */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>

        {/* MOBILE BOTTOM NAVIGATION (Section 9 & 14) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-[#E8E4D5] dark:border-[#24312B] bg-white/95 dark:bg-[#141C18]/95 backdrop-blur-md px-2 py-1.5 z-40 flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-mobile-${item.id}`}
                onClick={() => handleNavClick(item)}
                type="button"
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl min-w-[56px] transition-colors cursor-pointer relative ${
                  isActive
                    ? 'text-[#075C45] dark:text-[#78D9A6] font-bold'
                    : 'text-[#5E6963] dark:text-[#95A39B] hover:text-[#202724] dark:hover:text-[#F7F4EA]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-[10px] mt-0.5 leading-tight">{item.label}</span>
                {!item.isReady && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D6A84B] absolute top-1 right-3"></span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Discrete Coming Soon Modal/Toast */}
      {comingSoonNotice && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-[#18211D] border border-[#E8E4D5] dark:border-[#24312B] rounded-2xl p-5 shadow-xl space-y-3 relative">
            <button
              type="button"
              onClick={() => setComingSoonNotice(null)}
              className="absolute top-3 right-3 text-[#5E6963] hover:text-[#202724] dark:text-[#95A39B] dark:hover:text-[#F7F4EA] p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 text-[#075C45] dark:text-[#78D9A6]">
              <div className="w-8 h-8 rounded-lg bg-[#16A66A]/15 flex items-center justify-center">
                <Info className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm font-display">
                Módulo “{comingSoonNotice}”
              </h4>
            </div>

            <p className="text-xs text-[#5E6963] dark:text-[#95A39B] leading-relaxed">
              Este módulo financeiro será adicionado na próxima etapa de desenvolvimento. A Etapa 1 focou na fundação técnica, autenticação e arquitetura de múltiplos espaços.
            </p>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setComingSoonNotice(null)}
                className="w-full py-2 rounded-xl bg-[#075C45] dark:bg-[#16A66A] text-white dark:text-[#101614] text-xs font-semibold cursor-pointer"
              >
                Compreendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
