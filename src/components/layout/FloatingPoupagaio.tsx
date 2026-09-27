import React, { useState, useEffect, useRef } from 'react';
import { POUPAGAIO_ASSISTANTE_URL } from '../../assets/mascot';
import { ActiveTab } from '../../types';
import { useAssistant } from '../../hooks/useAssistant';
import { useAuth } from '../../hooks/useAuth';
import { entriesService } from '../../lib/services/entries';
import { checklistService } from '../../lib/services/checklist';
import { formatCurrency } from '../../lib/formatters';
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

export type PoupagaioEmotion = 'happy' | 'sad' | 'alert' | 'proud' | 'neutral';

export interface PoupagaioFinancialStats {
  income: number;
  expenses: number;
  balance: number;
  overdueCount: number;
  todayCount: number;
  pendingCount: number;
}

const getEmotionStyles = (emo: PoupagaioEmotion) => {
  switch (emo) {
    case 'happy':
      return {
        glowClass: 'ring-2 ring-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.35)]',
        badge: '🥳',
        badgeBg: 'bg-emerald-500',
        badgeBorder: 'border-emerald-200 dark:border-emerald-800',
        textColor: 'text-emerald-700 dark:text-emerald-300',
      };
    case 'sad':
      return {
        glowClass: 'ring-2 ring-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.35)]',
        badge: '😰',
        badgeBg: 'bg-rose-500',
        badgeBorder: 'border-rose-200 dark:border-rose-800',
        textColor: 'text-rose-700 dark:text-rose-300',
      };
    case 'alert':
      return {
        glowClass: 'ring-2 ring-amber-500/40 animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.5)]',
        badge: '⏰',
        badgeBg: 'bg-amber-500',
        badgeBorder: 'border-amber-200 dark:border-amber-800',
        textColor: 'text-amber-700 dark:text-amber-300',
      };
    case 'proud':
      return {
        glowClass: 'ring-2 ring-yellow-400/40 shadow-[0_0_25px_rgba(234,179,8,0.45)]',
        badge: '👑',
        badgeBg: 'bg-yellow-500',
        badgeBorder: 'border-yellow-200 dark:border-yellow-800',
        textColor: 'text-yellow-700 dark:text-yellow-300',
      };
    case 'neutral':
    default:
      return {
        glowClass: 'shadow-md border border-[#D2DDD6] dark:border-[#28322C]',
        badge: '🦜',
        badgeBg: 'bg-[#02402E] dark:bg-[#78D9A6]',
        badgeBorder: 'border-[#D2DDD6] dark:border-[#28322C]',
        textColor: 'text-[#02402E] dark:text-[#78D9A6]',
      };
  }
};

interface FloatingPoupagaioProps {
  onSelectTab: (tab: ActiveTab) => void;
  currentTab?: ActiveTab;
  onOpenCreateModal?: (modalType: 'entries' | 'variable_expenses' | 'fixed_expenses' | 'installments') => void;
}

interface QuickActionItem {
  id: ActiveTab;
  label: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  category: 'CADASTRAR' | 'ORGANIZAR' | 'ANALISAR' | 'AJUDA';
}

export function FloatingPoupagaio({ onSelectTab, currentTab, onOpenCreateModal }: FloatingPoupagaioProps) {
  const { showAssistant } = useAssistant();
  const { user, currentSpace } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Emotions & Speech States
  const [stats, setStats] = useState<PoupagaioFinancialStats | null>(null);
  const [emotion, setEmotion] = useState<PoupagaioEmotion>('neutral');
  const [speechText, setSpeechText] = useState<string>('');
  const [showBubble, setShowBubble] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Snappy draggable position states
  const [pos, setPos] = useState<{ side: 'left' | 'right'; y: number }>(() => {
    const saved = localStorage.getItem('poupagaio-assistant-position');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.side === 'left' || parsed.side === 'right') && typeof parsed.y === 'number') {
          return parsed;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
    // Default standard bottom-right snap
    return { side: 'right', y: window.innerHeight - 150 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [isTransitioning, setIsTransitioning] = useState(false);

  const dragStartRef = useRef<{ startX: number; startY: number; buttonX: number; buttonY: number; hasMoved: boolean }>({
    startX: 0,
    startY: 0,
    buttonX: 0,
    buttonY: 0,
    hasMoved: false,
  });

  const wasDraggingRef = useRef(false);

  // Determine emotion and choose speech text
  const determineEmotionAndSpeech = (s: PoupagaioFinancialStats) => {
    let emp: PoupagaioEmotion = 'neutral';
    let text = '';

    if (s.overdueCount > 0 || s.todayCount > 0) {
      emp = 'alert';
      const options = [
        `Ei, psiu! Temos ${s.overdueCount + s.todayCount} contas vencendo hoje ou em atraso. Não deixe os juros voarem alto! 🦜⏰`,
        `Fique de olho! Temos compromissos pendentes hoje na lista. Vamos dar baixa nisso? 🦜👀`,
        `Alerta de boleto! 🔔 Vamos organizar esses pagamentos pendentes antes que o prazo expire!`
      ];
      text = options[Math.floor(Math.random() * options.length)];
    } else if (s.balance < 0) {
      emp = 'sad';
      const absBal = formatCurrency(Math.abs(s.balance));
      const options = [
        `Eita... nosso saldo está negativo em ${absBal}! Vamos dar uma segurada nos gastos variáveis para voltar ao azul? 🦜💔`,
        `Estamos no vermelho neste mês! Que tal uma folguinha nas comprinhas supérfluas hoje? Eu te ajudo! 🦜📉`,
        `As despesas voaram mais alto que as receitas. Vamos equilibrar as contas juntos? 🦜`
      ];
      text = options[Math.floor(Math.random() * options.length)];
    } else if (s.income > 0 && s.balance > s.income * 0.4) {
      emp = 'proud';
      const options = [
        `Uau! Você economizou mais de 40% das suas entradas! Que orgulho nível master! 🦜👑✨`,
        `Poupança decolando! Sobrou um ótimo saldo livre neste mês. Que tal mandar um pouquinho pras suas Reservas? 🦜💎`,
        `Você é mestre das finanças! Saldo super saudável e contas organizadas. Parabéns! 🦜🚀`
      ];
      text = options[Math.floor(Math.random() * options.length)];
    } else if (s.balance >= 0) {
      emp = 'happy';
      const balStr = formatCurrency(s.balance);
      const options = [
        `Tudo sob controle! Estamos no azul com saldo de ${balStr}. Vamos manter esse voo firme! 🦜🥳`,
        `Que dia lindo para economizar! Nosso saldo está verdinho e as contas em dia. Parabéns! 🦜🍃`,
        `Nenhum boleto atrasado e saldo positivo! Você está mandando super bem nas finanças! 🦜✨`
      ];
      text = options[Math.floor(Math.random() * options.length)];
    } else {
      emp = 'neutral';
      const options = [
        "Olá! Sou o Poupagaio, seu parceiro de finanças. Pronto para organizar as contas de hoje? 🦜🚀",
        "Que tal fazer um lançamento rápido? É só clicar em mim para escolher o tipo de transação! 🦜",
        "Organize hoje, decole amanhã! Vamos construir sua liberdade financeira juntos?"
      ];
      text = options[Math.floor(Math.random() * options.length)];
    }

    setEmotion(emp);
    setSpeechText(text);
  };

  const fetchStats = async () => {
    if (!currentSpace?.id) return;
    try {
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth() + 1;
      const [chk, ent] = await Promise.all([
        checklistService.getMonthlyChecklist(currentSpace.id, y, m),
        entriesService.getMonthSummary(currentSpace.id, y, m),
      ]);

      const income = ent.totalPlanned || 0;
      const expenses = chk.stats.totalAmount || 0;
      const balance = income - expenses;
      const overdueCount = chk.stats.overdueCount || 0;
      const todayCount = chk.stats.todayCount || 0;
      const pendingCount = chk.stats.pendingCount || 0;

      const newStats = {
        income,
        expenses,
        balance,
        overdueCount,
        todayCount,
        pendingCount,
      };

      setStats(newStats);
      determineEmotionAndSpeech(newStats);
    } catch (err) {
      console.warn('Erro ao carregar dados do assistente Poupagaio:', err);
    }
  };

  // Fetch financial statistics on load & when currentSpace changes
  useEffect(() => {
    fetchStats();

    // Small interval to keep the stats in sync
    const interval = setInterval(fetchStats, 20000);
    return () => clearInterval(interval);
  }, [currentSpace?.id]);

  // Trigger bubble on settings or tab changes, or reset visibility
  useEffect(() => {
    if (currentSpace?.id) {
      setShowBubble(true);
      fetchStats();
    }
  }, [currentSpace?.id, currentTab]);

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

  // Handle Resize and Keep Assistant accessible on screen
  useEffect(() => {
    const handleResize = () => {
      const buttonHeight = buttonRef.current?.offsetHeight || 72;
      const minY = 16;
      const maxY = window.innerHeight - buttonHeight - 16;

      setPos((current) => {
        const clampedY = Math.max(minY, Math.min(maxY, current.y));
        if (clampedY !== current.y) {
          return { ...current, y: clampedY };
        }
        return current;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);

    const buttonRect = e.currentTarget.getBoundingClientRect();
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      buttonX: buttonRect.left,
      buttonY: buttonRect.top,
      hasMoved: false,
    };

    setIsDragging(true);
    setDragPos({ x: buttonRect.left, y: buttonRect.top });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;

    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;

    // Movement threshold (5px) to differentiate click and drag
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      dragStartRef.current.hasMoved = true;
    }

    let newX = dragStartRef.current.buttonX + dx;
    let newY = dragStartRef.current.buttonY + dy;

    // Clamps keeping the assistant within screen bounds
    const buttonWidth = buttonRef.current?.offsetWidth || 72;
    const buttonHeight = buttonRef.current?.offsetHeight || 72;

    const minX = 16;
    const maxX = window.innerWidth - buttonWidth - 16;
    const minY = 16;
    const maxY = window.innerHeight - buttonHeight - 16;

    newX = Math.max(minX, Math.min(maxX, newX));
    newY = Math.max(minY, Math.min(maxY, newY));

    setDragPos({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDragging(false);

    const buttonWidth = buttonRef.current?.offsetWidth || 72;
    const buttonHeight = buttonRef.current?.offsetHeight || 72;

    // Nearest lateral snapping logic
    const midX = window.innerWidth / 2;
    const centerX = dragPos.x + buttonWidth / 2;
    const side = centerX < midX ? 'left' : 'right';

    const minY = 16;
    const maxY = window.innerHeight - buttonHeight - 16;
    const finalY = Math.max(minY, Math.min(maxY, dragPos.y));

    const newPos = { side, y: finalY };
    setPos(newPos);
    localStorage.setItem('poupagaio-assistant-position', JSON.stringify(newPos));

    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 300);

    if (dragStartRef.current.hasMoved) {
      wasDraggingRef.current = true;
      e.stopPropagation();
      e.preventDefault();
    } else {
      wasDraggingRef.current = false;
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    if (wasDraggingRef.current) {
      wasDraggingRef.current = false;
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    setIsOpen(!isOpen);
  };

  const handleItemClick = (tab: ActiveTab, categoryName: string) => {
    setIsOpen(false);
    if (categoryName === 'CADASTRAR' && onOpenCreateModal) {
      if (
        tab === 'entries' ||
        tab === 'variable_expenses' ||
        tab === 'fixed_expenses' ||
        tab === 'installments'
      ) {
        onOpenCreateModal(tab);
        return;
      }
    }
    onSelectTab(tab);
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
        { id: 'reserves' as ActiveTab, label: 'Reservas', icon: Sparkles, iconBg: 'bg-[#16A66A]', iconColor: 'text-white' },
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

  // Snappy layout positioning styles
  const containerStyle: React.CSSProperties = isDragging
    ? {
        position: 'fixed',
        left: `${dragPos.x}px`,
        top: `${dragPos.y}px`,
        right: 'auto',
        zIndex: 100,
        touchAction: 'none',
      }
    : {
        position: 'fixed',
        top: `${pos.y}px`,
        left: pos.side === 'left' ? '16px' : 'auto',
        right: pos.side === 'right' ? '16px' : 'auto',
        zIndex: 100,
        transition: isTransitioning ? 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
        touchAction: 'none',
      };

  // Align panel based on snap side
  const menuAlignClass = pos.side === 'left'
    ? 'md:left-0 md:right-auto'
    : 'md:right-0 md:left-auto';

  if (!showAssistant) return null;

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      className="select-none"
    >
      
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
              bottom-0 md:bottom-24 right-0 left-0 ${menuAlignClass}
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
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-[#5E6963] dark:text-[#95A39B] font-semibold truncate">
                      Humor: {getEmotionStyles(emotion).badge}
                    </span>
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ${getEmotionStyles(emotion).badgeBg} text-white uppercase tracking-wider scale-90 origin-left`}>
                      {emotion === 'happy' ? 'Feliz' : emotion === 'sad' ? 'Triste' : emotion === 'alert' ? 'Alerta' : emotion === 'proud' ? 'Orgulhoso' : 'Neutro'}
                    </span>
                  </div>
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
                          onClick={() => handleItemClick(item.id, cat.name)}
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
          FLOATING MASCOT BUTTON (NEW ASSISTANT MASCOT WITH EMOTIONS)
          ================================================== */}
      {/* Speech Bubble */}
      {showBubble && speechText && (
        <div
          onClick={() => {
            // Cycle through random messages when clicked
            if (stats) determineEmotionAndSpeech(stats);
          }}
          className={`
            absolute bottom-2 sm:bottom-4
            w-[240px] sm:w-[285px]
            p-3.5 sm:p-4 rounded-2xl bg-[#F2EFDC] dark:bg-[#181C1A]
            border-2 border-[#D9D4B8] dark:border-[#28322C]
            shadow-xl text-xs font-semibold leading-relaxed
            text-[#02402E] dark:text-[#E2EFDC]
            animate-in fade-in zoom-in-90 duration-200
            cursor-pointer select-none group/bubble z-50
            ${pos.side === 'right' ? 'right-full mr-3.5 origin-bottom-right' : 'left-full ml-3.5 origin-bottom-left'}
          `}
        >
          {/* Close button for the speech bubble */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowBubble(false);
            }}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] shadow-xs border border-white hover:bg-rose-700 transition-colors cursor-pointer"
          >
            ✕
          </button>

          {/* Bubble Tail */}
          <div
            className={`
              absolute bottom-4 w-3.5 h-3.5 bg-[#F2EFDC] dark:bg-[#181C1A]
              border-r-2 border-b-2 border-[#D9D4B8] dark:border-[#28322C]
              transform rotate-45
              ${pos.side === 'right' ? '-right-[8px]' : '-left-[8px]'}
            `}
          />

          <div className="space-y-1 relative">
            <p className="pr-2 text-[11.5px] font-semibold text-[#02402E] dark:text-[#E6ECE8]">{speechText}</p>
            <div className="flex items-center justify-between pt-2 mt-1.5 border-t border-[#E2DCBE] dark:border-[#28322C] text-[9.5px] text-[#5E6963] dark:text-[#95A39B] font-bold">
              <span>Mascote Poupagaio</span>
              <span className="text-[10px] text-[#16A66A] dark:text-[#78D9A6] group-hover/bubble:translate-x-0.5 transition-transform flex items-center gap-0.5">
                Outra dica ↻
              </span>
            </div>
          </div>
        </div>
      )}

      <button
        ref={buttonRef}
        type="button"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={(e) => {
          handleButtonClick(e);
          // Auto trigger speech update and visibility when clicked
          if (stats) {
            determineEmotionAndSpeech(stats);
            setShowBubble(true);
          }
        }}
        aria-label="Abrir acessos rápidos do Poupagaio"
        title="Poupagaio - Pressione e arraste para reposicionar"
        className={`relative group focus:outline-none focus-visible:ring-4 focus-visible:ring-[#F2B807] rounded-full transition-all duration-200 ${
          isDragging ? 'cursor-grabbing scale-95' : 'cursor-grab active:cursor-grabbing hover:scale-105'
        }`}
      >
        {/* Dynamic Glowing Aura based on financial health */}
        <div className={`w-[52px] h-[52px] sm:w-[72px] sm:h-[72px] rounded-full relative flex items-center justify-center filter drop-shadow-md group-hover:drop-shadow-xl transition-all duration-300 ${getEmotionStyles(emotion).glowClass}`}>
          
          {/* Dynamic Emotion Emoji Badge */}
          <div className={`absolute -top-1 -right-1 sm:top-0 sm:right-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full ${getEmotionStyles(emotion).badgeBg} border border-white dark:border-gray-800 flex items-center justify-center text-[10px] sm:text-xs shadow-md z-10 animate-bounce`}>
            {getEmotionStyles(emotion).badge}
          </div>

          <img
            src={POUPAGAIO_ASSISTANTE_URL}
            alt="Poupagaio Assistente - Acesso Rápido"
            referrerPolicy="no-referrer"
            className="w-[85%] h-[85%] object-contain pointer-events-none"
          />
        </div>
      </button>

    </div>
  );
}
