import React from 'react';
import { POUPAGAIO_MASCOT_URL } from '../../assets/mascot';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';

export interface MascotWidgetProps {
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function MascotWidget({
  message = 'Vamos começar? Adicione sua primeira entrada para organizar seu mês.',
  actionLabel,
  onAction,
  className = '',
}: MascotWidgetProps) {
  return (
    <Card className={`overflow-hidden border-[#E8E4D5] dark:border-[#24312B] bg-gradient-to-br from-white via-[#F7F4EA]/40 to-white dark:from-[#18211D] dark:via-[#141C18] dark:to-[#18211D] shadow-xs ${className}`}>
      <CardContent className="p-4 sm:p-5 flex items-start sm:items-center gap-3.5 sm:gap-4">
        {/* Official mascot avatar in a dedicated container */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border border-[#16A66A]/30 bg-white dark:bg-[#101614] p-1 shrink-0 shadow-xs flex items-center justify-center">
          <img
            src={POUPAGAIO_MASCOT_URL}
            alt="Mascote Poupagaio"
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Message bubble content */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#16A66A]/15 text-[#075C45] dark:bg-[#16A66A]/20 dark:text-[#78D9A6]">
              <Sparkles className="w-3 h-3" />
              <span>Dica do Poupagaio</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#202724] dark:text-[#F7F4EA] font-medium leading-snug">
            {message}
          </p>
        </div>

        {/* Optional quick action */}
        {actionLabel && onAction && (
          <div className="shrink-0 self-center hidden sm:block">
            <Button
              variant="secondary"
              size="sm"
              onClick={onAction}
              className="gap-1.5 text-xs font-semibold"
            >
              <span>{actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
