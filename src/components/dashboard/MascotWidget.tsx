import React from 'react';
import { POUPAGAIO_MASCOT_URL } from '../../assets/mascot';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';

export type MascotReaction = 'welcoming' | 'encouraging' | 'alert' | 'celebrating' | 'neutral';

export interface MascotWidgetProps {
  reaction?: MascotReaction;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function MascotWidget({
  reaction = 'welcoming',
  message = 'Vamos começar? Adicione sua primeira entrada para organizar seu mês.',
  actionLabel,
  onAction,
  className = '',
}: MascotWidgetProps) {
  // Configured reactions for future expansion without duplicating mascot image
  const reactionConfig: Record<MascotReaction, { tag: string; badgeClass: string }> = {
    welcoming: {
      tag: 'Dica do Poupagaio',
      badgeClass: 'bg-[#16A66A]/15 text-[#075C45] dark:bg-[#16A66A]/20 dark:text-[#78D9A6]',
    },
    encouraging: {
      tag: 'Dica Financeira',
      badgeClass: 'bg-[#D6A84B]/15 text-[#8c6511] dark:bg-[#D6A84B]/25 dark:text-[#F2D58A]',
    },
    alert: {
      tag: 'Aviso do Poupagaio',
      badgeClass: 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/25 dark:text-amber-300',
    },
    celebrating: {
      tag: 'Parabéns!',
      badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300',
    },
    neutral: {
      tag: 'Poupagaio',
      badgeClass: 'bg-black/5 text-[#5E6963] dark:bg-white/10 dark:text-[#95A39B]',
    },
  };

  const currentConfig = reactionConfig[reaction] || reactionConfig.welcoming;

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
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${currentConfig.badgeClass}`}>
              <Sparkles className="w-3 h-3" />
              <span>{currentConfig.tag}</span>
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
