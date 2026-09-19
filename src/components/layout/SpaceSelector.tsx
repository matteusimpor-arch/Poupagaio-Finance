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
          <div className="w-7 h-7 rounded-lg bg-[#02402E] text-[#F2B807] flex items-center justify-center shrink-0">
            <ActiveIcon className="w-3.5 h-3.5" />
          </div>
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#F2B807] ring-2 ring-[#013324]"></span>
        </button>
      ) : (
        <button
          type="button"
          id="space-selector-btn"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-[#03543D] bg-[#012E21] hover:bg-[#01261B] transition-all duration-150 text-left cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#02402E] text-[#F2B807] border border-[#03543D] flex items-center justify-center shrink-0">
              <ActiveIcon className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-[#A4C9BE] uppercase font-bold tracking-wider">
                  Espaço Ativo
                </span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#F2B807]"></span>
              </div>
              <p className="text-xs font-bold truncate text-white">
                {currentSpace ? currentSpace.name : 'Pessoal'}
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#A4C9BE] transition-transform duration-200 shrink-0 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      )}

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 max-w-sm rounded-2xl border border-[#03543D] bg-[#012E21] p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 text-white">
          <div className="px-3 py-2 border-b border-[#03543D] mb-1">
            <p className="text-[11px] font-bold text-[#F2B807] uppercase tracking-wider">
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
                      ? 'bg-[#F2B807] text-[#02402E] font-bold'
                      : 'hover:bg-white/10 text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-[#02402E] text-[#F2B807]'
                        : 'bg-white/10 text-[#A4C9BE]'
                    }`}>
                      <SpaceIcon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold truncate ${isSelected ? 'text-[#02402E]' : 'text-white'}`}>{space.name}</p>
                      <span className={`text-[10px] block truncate capitalize ${isSelected ? 'text-[#02402E]/80' : 'text-[#A4C9BE]'}`}>
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
