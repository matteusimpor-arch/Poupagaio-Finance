import React, { useState, useEffect, useRef } from 'react';
import { POUPAGAIO_ASSISTANTE_URL } from '../../assets/mascot';
import { ActiveTab } from '../../types';
import {
  Plus,
  CreditCard,
  Calendar,
  ShoppingBag,
  Target,
  BarChart3,
  X,
  CalendarCheck,
  ChevronRight,
  LifeBuoy,
  Heart,
  Sparkles,
} from 'lucide-react';

interface FloatingPoupagaioProps {
  onSelectTab: (tab: ActiveTab) => void;
  currentTab?: ActiveTab;
}

interface QuickActionItem {
  id: ActiveTab;
  label: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  category: 'CADASTRAR' | 'ORGANIZAR' | 'ANALISAR' | 'AJUDA';
}

export function FloatingPoupagaio({ onSelectTab }: FloatingPoupagaioProps) {
  const [isOpen, setIsOpen] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on Click Outside or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleItemClick = (tab: ActiveTab) => {
    onSelectTab(tab);
    setIsOpen(false);
  };

  const categories = [
    {
      name: 'CADASTRAR',
      items: [
        { id: 'entries' as ActiveTab, label: 'Entrada', icon: Plus, iconBg: 'bg-[#16A66A]', iconColor: 'text-white' },
        { id: 'variable_expenses' as ActiveTab, label: 'Gasto Variável', icon: Plus, iconBg: 'bg-[#E11D48]', iconColor: 'text-white' },
        { id: 'fixed_expenses' as ActiveTab, label: 'Gasto Fixo', icon: Calendar, iconBg: 'bg-[#8B5CF6]', iconColor: 'text-white' },
        { id: 'installments' as ActiveTab, label: 'Parcelamento', icon: CreditCard, iconBg: 'bg-[#F59E0B]', iconColor: 'text-white' },
      ],
    },
    {
      name: 'ORGANIZAR',
      items: [
        { id: 'market' as ActiveTab, label: 'Mercado', icon: ShoppingBag, iconBg: 'bg-[#02402E]', iconColor: 'text-white' },
        { id: 'goals' as ActiveTab, label: 'Metas', icon: Target, iconBg: 'bg-[#0D9488]', iconColor: 'text-white' },
        { id: 'wishlist' as ActiveTab, label: 'Lista de Desejos', icon: Heart, iconBg: 'bg-[#EC4899]', iconColor: 'text-white' },
      ],
    },
    {
      name: 'ANALISAR',
      items: [
        { id: 'reports' as ActiveTab, label: 'Visão Financeira', icon: BarChart3, iconBg: 'bg-[#16A66A]', iconColor: 'text-white' },
        { id: 'closing' as ActiveTab, label: 'Fechamento', icon: CalendarCheck, iconBg: 'bg-[#02402E]', iconColor: 'text-white' },
      ],
    },
    {
      name: 'AJUDA',
      items: [
        { id: 'support' as ActiveTab, label: 'Suporte', icon: LifeBuoy, iconBg: 'bg-[#F29F05]', iconColor: 'text-white' },
      ],
    },
  ];

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-30 select-none pb-[env(safe-area-inset-bottom)] pr-[env(safe-area-inset-right)]">
      
      {/* ==================================================
          QUICK ACCESS PANEL (Desktop Floating + Mobile Bottom Sheet)
          ================================================== */}
      {isOpen && (
        <>
          {/* Backdrop Overlay for Mobile */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs md:hidden z-40 animate-in fade-in duration-150"
            onClick={() => setIsOpen(false)}
          />

          <div
            ref={menuRef}
            className={`
              fixed md:absolute
              bottom-0 md:bottom-22 right-0 left-0 md:left-auto
              w-full md:w-[320px] lg:w-[340px]
              max-h-[85vh] md:max-h-[580px]
              bg-[#F2EFDC] dark:bg-[#181C1A]
              border-t md:border border-[#D9D4B8] dark:border-[#28322C]
              rounded-t-3xl md:rounded-2xl
              shadow-2xl md:shadow-xl
              p-4 sm:p-5 space-y-3
              animate-in fade-in slide-in-from-bottom-4 duration-200
              z-50 flex flex-col justify-between overflow-hidden
            `}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E2DCBE] dark:border-[#28322C] shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#02402E]/10 dark:bg-[#78D9A6]/15 p-1 shrink-0 flex items-center justify-center">
                  <img
                    src={POUPAGAIO_ASSISTANTE_URL}
                    alt="Poupagaio Assistente"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-[#02402E] dark:text-[#78D9A6] tracking-wider uppercase font-display truncate">
                    POUPAGAIO
                  </h3>
                  <p className="text-xs text-[#5E6963] dark:text-[#95A39B] truncate font-medium">
                    Acesso rápido
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl text-[#02402E] dark:text-[#95A39B] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                aria-label="Fechar acessos rápidos do Poupagaio"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CATEGORIES LIST */}
            <div className="space-y-3 flex-1 overflow-y-auto pr-1 no-scrollbar">
              {categories.map((cat) => (
                <div key={cat.name} className="space-y-1">
                  <span className="text-[10px] font-bold tracking-wider text-[#02402E]/80 dark:text-[#78D9A6]/80 uppercase px-1">
                    {cat.name}
                  </span>
                  <div className="grid grid-cols-1 gap-1">
                    {cat.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleItemClick(item.id)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-[#E2DCBE] dark:border-[#252E28] bg-white/90 dark:bg-[#1E2320] hover:bg-white dark:hover:bg-[#252C28] hover:border-[#F2B807] transition-all text-left cursor-pointer group shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${item.iconBg} ${item.iconColor} shadow-2xs`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-semibold text-[#02402E] dark:text-[#F4F4F5] group-hover:text-[#02402E] truncate">
                              {item.label}
                            </span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-[#8C9891] dark:text-[#6E7B74] group-hover:text-[#F29F05] group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* FOOTER */}
            <div className="pt-2 border-t border-[#E2DCBE] dark:border-[#28322C] shrink-0">
              <div className="p-2 rounded-xl bg-[#02402E] text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#F2B807] shrink-0" />
                <p className="text-[10.5px] text-[#F2EFDC] font-medium leading-tight truncate">
                  Poupagaio Finance • Atalhos rápidos
                </p>
              </div>
            </div>

          </div>
        </>
      )}

      {/* ==================================================
          FLOATING MASCOT BUTTON (NEW ASSISTANT MASCOT)
          ================================================== */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Abrir acessos rápidos do Poupagaio"
        title="Poupagaio - Acesso rápido"
        className="relative group cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-[#F2B807] rounded-full transition-transform active:scale-95 duration-200"
      >
        <div className="w-[52px] h-[52px] sm:w-[72px] sm:h-[72px] relative flex items-center justify-center filter drop-shadow-md group-hover:drop-shadow-xl group-hover:scale-105 transition-all duration-200">
          <img
            src={POUPAGAIO_ASSISTANTE_URL}
            alt="Poupagaio Assistente - Acesso Rápido"
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain pointer-events-none"
          />
        </div>
      </button>

    </div>
  );
}
