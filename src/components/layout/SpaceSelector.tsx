import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ChevronDown, Check, User, Users, Home, Building2 } from 'lucide-react';

interface SpaceSelectorProps {
  isCollapsed?: boolean;
}

export function SpaceSelector({ isCollapsed = false }: SpaceSelectorProps) {
  const { currentSpace, spaces, setCurrentSpace, memberships, user } = useAuth();
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

  const getSpaceTypeIcon = (type: string) => {
    switch (type) {
      case 'personal':
        return User;
      case 'couple':
        return Home;
      case 'family':
        return Users;
      case 'business':
        return Building2;
      default:
        return User;
    }
  };

  const getSpaceTypeLabel = (type: string) => {
    switch (type) {
      case 'personal':
        return 'Pessoal';
      case 'couple':
        return 'Casal';
      case 'family':
        return 'Família';
      case 'business':
        return 'Empresa';
      default:
        return 'Outro';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Proprietário';
      case 'admin':
        return 'Administrador';
      case 'member':
        return 'Membro';
      case 'viewer':
        return 'Visualizador';
      default:
        return role;
    }
  };

  const ActiveIcon = currentSpace ? getSpaceTypeIcon(currentSpace.type) : User;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {isCollapsed ? (
        <button
          type="button"
          id="space-selector-btn-compact"
          onClick={() => setIsOpen(!isOpen)}
          title={`Espaço Ativo: ${currentSpace ? currentSpace.name : 'Pessoal'}`}
          aria-label={`Espaço Ativo: ${currentSpace ? currentSpace.name : 'Pessoal'}`}
          className="w-10 h-10 mx-auto rounded-xl border border-[#E8E4D5] bg-white hover:bg-black/5 dark:border-[#24312B] dark:bg-[#18211D] dark:hover:bg-white/5 transition-all duration-150 flex items-center justify-center cursor-pointer relative group"
        >
          <div className="w-7 h-7 rounded-lg bg-[#16A66A]/15 text-[#075C45] dark:bg-[#16A66A]/25 dark:text-[#78D9A6] flex items-center justify-center">
            <ActiveIcon className="w-4 h-4" />
          </div>
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#16A66A] ring-2 ring-white dark:ring-[#18211D]"></span>
        </button>
      ) : (
        <button
          type="button"
          id="space-selector-btn"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-[#E8E4D5] bg-white hover:bg-black/2 transition-all duration-150 text-left cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#02402E]/10 text-[#02402E] flex items-center justify-center shrink-0">
              <ActiveIcon className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-[#5E6963] uppercase font-bold tracking-wider">
                  Espaço Ativo
                </span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#02402E]"></span>
              </div>
              <p className="text-xs font-bold truncate text-[#02402E]">
                {currentSpace ? currentSpace.name : 'Pessoal'}
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#5E6963] transition-transform duration-200 shrink-0 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      )}

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 max-w-sm rounded-2xl border border-[#E8E4D5] bg-white p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-[#E8E4D5]/60 mb-1">
            <p className="text-[11px] font-bold text-[#02402E] uppercase tracking-wider">
              Seus Espaços Financeiros
            </p>
          </div>

          <div className="space-y-1">
            {spaces.map((space) => {
              const isSelected = currentSpace?.id === space.id;
              const spaceRole = memberships?.find((m) => m.space_id === space.id)?.role ||
                (space.owner_id === user?.id ? 'owner' : 'member');
              const SpaceIcon = getSpaceTypeIcon(space.type);

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
                      ? 'bg-[#F2B807]/20 text-[#02402E] font-bold'
                      : 'hover:bg-black/5 text-[#202724]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-[#F2B807] text-[#02402E]'
                        : 'bg-black/5 text-[#5E6963]'
                    }`}>
                      <SpaceIcon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate text-[#02402E]">{space.name}</p>
                      <span className="text-[10px] text-[#5E6963] block truncate capitalize">
                        {getSpaceTypeLabel(space.type)} • {getRoleLabel(spaceRole)}
                      </span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#02402E] shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
