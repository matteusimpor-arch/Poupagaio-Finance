import React, { useState, useEffect, useRef } from 'react';
import { POUPAGAIO_MASCOT_URL } from '../../assets/mascot';
import { ActiveTab } from '../../types';
import {
  ArrowUpRight,
  CreditCard,
  FileText,
  Calendar,
  ShoppingBag,
  Target,
  BarChart3,
  HelpCircle,
  X,
  Sparkles,
} from 'lucide-react';

interface FloatingPoupagaioProps {
  onSelectTab: (tab: ActiveTab) => void;
}

export function FloatingPoupagaio({ onSelectTab }: FloatingPoupagaioProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Mouse tracking microinteraction for Poupagaio pupils on desktop
  useEffect(() => {
    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (prefersReducedMotion || isTouchDevice) return;

    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      if (!buttonRef.current) return;

      animationFrameId = requestAnimationFrame(() => {
        const rect = buttonRef.current?.getBoundingClientRect();
        if (!rect) return;

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = e.clientX - centerX;
        const deltaY = e.clientY - centerY;

        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const maxDistance = 400; // max radius of influence

        // Bounded displacement limit (max 2.5px)
        const factor = Math.min(distance / maxDistance, 1);
        const offsetX = (deltaX / (distance || 1)) * 2.5 * factor;
        const offsetY = (deltaY / (distance || 1)) * 2.5 * factor;

        setPupilOffset({
          x: Math.min(Math.max(offsetX, -2.5), 2.5),
          y: Math.min(Math.max(offsetY, -2.5), 2.5),
        });
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

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

  const shortcutItems: {
    id: ActiveTab;
    label: string;
    icon: React.ElementType;
    color: string;
  }[] = [
    { id: 'entries', label: '+ Cadastrar Entrada', icon: ArrowUpRight, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50' },
    { id: 'variable_expenses', label: '+ Cadastrar Gasto', icon: CreditCard, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50' },
    { id: 'fixed_expenses', label: '+ Cadastrar Gasto Fixo', icon: FileText, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50' },
    { id: 'installments', label: '+ Novo Parcelamento', icon: Calendar, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50' },
    { id: 'market', label: 'Ir para Mercado', icon: ShoppingBag, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/50' },
    { id: 'goals', label: 'Ir para Metas', icon: Target, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/50' },
    { id: 'reports', label: 'Visão Financeira', icon: BarChart3, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50' },
    { id: 'support', label: 'Suporte', icon: HelpCircle, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50' },
  ];

  const handleItemClick = (tab: ActiveTab) => {
    onSelectTab(tab);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 select-none">
      {/* Floating Action Menu Popover */}
      {isOpen && (
        <div
          ref={menuRef}
          className="absolute bottom-16 right-0 w-72 sm:w-80 bg-white dark:bg-[#1E2220] border border-[#DCE2DE] dark:border-[#2B322F] rounded-2xl shadow-xl p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150 z-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[#E2E8E4] dark:border-[#2E3532]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#02402E]/10 dark:bg-[#78D9A6]/15 flex items-center justify-center text-[#02402E] dark:text-[#78D9A6]">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#02402E] dark:text-[#78D9A6] font-display">
                  Assistente Poupagaio
                </h3>
                <p className="text-[10px] text-[#5E6963] dark:text-[#95A39B]">
                  Atalhos rápidos de navegação
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-[#5E6963] dark:text-[#95A39B] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Shortcut Items */}
          <div className="grid grid-cols-1 gap-1.5 max-h-[320px] overflow-y-auto pr-0.5">
            {shortcutItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemClick(item.id)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-transparent hover:border-[#DCE2DE] dark:hover:border-[#2B322F] hover:bg-[#F2F4F3] dark:hover:bg-[#181B1A] transition-all text-left cursor-pointer group"
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-[#202724] dark:text-[#F4F4F5] group-hover:text-[#02402E] dark:group-hover:text-[#78D9A6] truncate">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Mascot Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Abrir assistente Poupagaio"
        title="Assistente Poupagaio"
        className={`relative w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-white dark:bg-[#1E2220] border-2 ${
          isOpen ? 'border-[#02402E] dark:border-[#78D9A6] ring-4 ring-[#02402E]/15' : 'border-[#16A66A]/40'
        } p-1 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group active:scale-95 flex items-center justify-center overflow-hidden`}
      >
        <div
          className="w-full h-full relative flex items-center justify-center transition-transform duration-75"
          style={{
            transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px)`,
          }}
        >
          <img
            src={POUPAGAIO_MASCOT_URL}
            alt="Poupagaio Flutuante"
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain rounded-xl pointer-events-none"
          />
        </div>

        {/* Small status indicator pill */}
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#F2B807] rounded-full ring-2 ring-white dark:ring-[#1E2220] shadow-2xs" />
      </button>
    </div>
  );
}
