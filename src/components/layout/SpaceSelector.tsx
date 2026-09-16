import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ChevronDown, Check, User, Users, Home, Building2, Sparkles } from 'lucide-react';
import { Badge } from '../ui/badge';

export function SpaceSelector() {
  const { currentSpace, spaces, setCurrentSpace } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const futureSpaceOptions = [
    { type: 'couple', name: 'Nossa Casa (Casal)', icon: Home },
    { type: 'family', name: 'Família', icon: Users },
    { type: 'business', name: 'Empresa', icon: Building2 },
  ];

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        id="space-selector-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-[#E8E4D5] bg-white hover:bg-black/5 dark:border-[#24312B] dark:bg-[#18211D] dark:hover:bg-white/5 transition-all duration-150 text-left cursor-pointer group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#16A66A]/15 text-[#075C45] dark:bg-[#16A66A]/25 dark:text-[#78D9A6] flex items-center justify-center shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#5E6963] dark:text-[#95A39B] uppercase font-semibold tracking-wider">
                Espaço Ativo
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#16A66A]"></span>
            </div>
            <p className="text-sm font-semibold truncate text-[#202724] dark:text-[#F7F4EA]">
              {currentSpace ? currentSpace.name : 'Pessoal'}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[#5E6963] dark:text-[#95A39B] transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full min-w-[260px] max-w-sm rounded-2xl border border-[#E8E4D5] bg-white p-2 shadow-xl dark:border-[#24312B] dark:bg-[#18211D] z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-[#E8E4D5]/60 dark:border-[#24312B]/60 mb-1">
            <p className="text-xs font-semibold text-[#5E6963] dark:text-[#95A39B] uppercase tracking-wider">
              Seus Espaços Financeiros
            </p>
          </div>

          <div className="space-y-1">
            {spaces.map((space) => {
              const isSelected = currentSpace?.id === space.id;
              return (
                <button
                  key={space.id}
                  type="button"
                  onClick={() => {
                    setCurrentSpace(space);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#16A66A]/10 text-[#075C45] dark:bg-[#16A66A]/20 dark:text-[#78D9A6]'
                      : 'hover:bg-black/5 text-[#202724] dark:hover:bg-white/5 dark:text-[#F7F4EA]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-[#16A66A]" />
                    <div>
                      <p className="text-sm font-medium">{space.name}</p>
                      <span className="text-[11px] text-[#5E6963] dark:text-[#95A39B] capitalize">
                        {space.type} • Proprietário
                      </span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#16A66A]" />}
                </button>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-[#E8E4D5]/60 dark:border-[#24312B]/60 space-y-1">
            <p className="px-3 py-1 text-[11px] font-medium text-[#5E6963] dark:text-[#95A39B] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#D6A84B]" />
              Preparado para múltiplos espaços:
            </p>
            {futureSpaceOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <div
                  key={opt.type}
                  className="flex items-center justify-between px-3 py-2 rounded-xl opacity-60 text-[#5E6963] dark:text-[#95A39B] bg-black/[0.02] dark:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-medium">{opt.name}</span>
                  </div>
                  <Badge variant="muted" className="text-[10px] py-0 px-2">
                    Em breve
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
