import React, { useState, useEffect } from 'react';
import { GoalWithProgress, CreateGoalContributionInput } from '@/src/types';
import { formatCurrency } from '@/src/lib/formatters';
import { Button } from '@/src/components/ui/button';
import { MoneyOriginSelector } from '../ui/MoneyOriginSelector';
import { X, PlusCircle, Calendar, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { reservesService } from '@/src/lib/services/reserves';
import { supabase } from '@/src/lib/supabase';

interface ContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: GoalWithProgress | null;
  onSave: (
    input: CreateGoalContributionInput
  ) => Promise<{ success: boolean; error?: string }>;
}

export function ContributionModal({
  isOpen,
  onClose,
  goal,
  onSave,
}: ContributionModalProps) {
  const [amount, setAmount] = useState('');
  const [contributionDate, setContributionDate] = useState('');
  const [notes, setNotes] = useState('');
  const [sources, setSources] = useState<Array<{ reserve_id: string | null; amount: number; is_free_balance: boolean }>>([]);
  const [isSourcesValid, setIsSourcesValid] = useState(true);
  const [sourcesError, setSourcesError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setAmount('');
      setContributionDate(today);
      setNotes('');
      setSources([]);
      setIsSourcesValid(true);
      setSourcesError(null);
      setErrorMessage(null);
    }
  }, [isOpen, goal]);

  if (!isOpen || !goal) return null;

  const numericAmount = parseFloat(amount.replace(',', '.')) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMessage('Informe um valor de aporte válido maior que zero.');
      return;
    }
    if (!contributionDate) {
      setErrorMessage('Por favor, selecione a data do aporte.');
      return;
    }
    if (!isSourcesValid) {
      setErrorMessage(sourcesError || 'Origem do dinheiro inválida ou saldo insuficiente.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: userData } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
      const userId = userData?.user?.id || '';

      // 1. Se houver origens em reservas, efetuar a retirada/débito atômico das reservas
      for (const src of sources) {
        if (!src.is_free_balance && src.reserve_id) {
          const withdrawRes = await reservesService.withdrawMoney(userId, {
            reserve_id: src.reserve_id,
            space_id: goal.space_id,
            amount: src.amount,
            notes: `Aporte na meta: ${goal.name}`,
            date: contributionDate,
          });
          if (!withdrawRes.reserve) {
            setErrorMessage(withdrawRes.error || 'Erro ao debitar da reserva selecionada.');
            setIsSubmitting(false);
            return;
          }
        }
      }

      // 2. Registrar o aporte na meta
      const payload: CreateGoalContributionInput = {
        goal_id: goal.id,
        space_id: goal.space_id,
        amount: numericAmount,
        contribution_date: contributionDate,
        notes: notes.trim() ? notes.trim() : null,
      };

      const res = await onSave(payload);
      if (!res.success) {
        setErrorMessage(res.error || 'Erro ao registrar aporte.');
        setIsSubmitting(false);
        return;
      }
      onClose();
    } catch {
      setErrorMessage('Ocorreu um erro ao processar o aporte.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const accumulated = (goal as any).accumulatedAmount || 0;
  const remainingBefore = Math.max(0, goal.target_amount - accumulated);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1E2220] border border-[#E2E8E4] dark:border-[#2E3532] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8E4] dark:border-[#2E3532]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#16A66A]/10 text-[#075C45] dark:bg-[#16A66A]/20 dark:text-[#78D9A6] flex items-center justify-center shrink-0">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-[#202724] dark:text-[#F4F4F5]">
                Novo Aporte
              </h3>
              <p className="text-xs text-[#5E6963] dark:text-[#95A39B] truncate max-w-[220px] sm:max-w-xs">
                {goal.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#5E6963] hover:text-[#202724] hover:bg-black/5 dark:text-[#95A39B] dark:hover:text-[#F4F4F5] dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Card Resumo da Meta */}
          <div className="p-3.5 rounded-xl bg-[#F3F4F4] dark:bg-[#232725] border border-[#E2E8E4] dark:border-[#2E3532] space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[#5E6963] dark:text-[#95A39B]">Objetivo</span>
              <span className="font-semibold text-[#202724] dark:text-[#F4F4F5]">
                {goal.name}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#5E6963] dark:text-[#95A39B]">Acumulado atual</span>
              <span className="font-bold text-[#075C45] dark:text-[#78D9A6]">
                {formatCurrency(accumulated)} / {formatCurrency(goal.target_amount)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-[#E2E8E4]/60 dark:border-[#2E3532]/60">
              <span className="text-[#5E6963] dark:text-[#95A39B]">Falta alcançar</span>
              <span className="font-medium text-[#202724] dark:text-[#F4F4F5]">
                {remainingBefore > 0 ? formatCurrency(remainingBefore) : 'Meta atingida! 🎉'}
              </span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Valor do Aporte */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#202724] dark:text-[#F4F4F5] flex items-center justify-between">
              <span>Valor do aporte (R$) <span className="text-rose-500">*</span></span>
              {remainingBefore > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(String(remainingBefore))}
                  className="text-[11px] text-[#16A66A] hover:underline cursor-pointer"
                >
                  Aportar restante ({formatCurrency(remainingBefore)})
                </button>
              )}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-[#5E6963] dark:text-[#95A39B]">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-[#E2E8E4] dark:border-[#2E3532] bg-white dark:bg-[#232725] text-[#202724] dark:text-[#F4F4F5] placeholder:text-[#5E6963]/50 focus:outline-hidden focus:ring-2 focus:ring-[#16A66A]/40"
              />
            </div>
          </div>

          {/* Money Origin Selector */}
          <MoneyOriginSelector
            spaceId={goal.space_id}
            requiredAmount={numericAmount}
            onChange={(newSources, isValid, err) => {
              setSources(newSources);
              setIsSourcesValid(isValid);
              setSourcesError(err || null);
            }}
          />

          {/* Data do Aporte */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#202724] dark:text-[#F4F4F5] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#5E6963]" />
              <span>Data do aporte <span className="text-rose-500">*</span></span>
            </label>
            <input
              type="date"
              required
              value={contributionDate}
              onChange={(e) => setContributionDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E2E8E4] dark:border-[#2E3532] bg-white dark:bg-[#232725] text-[#202724] dark:text-[#F4F4F5] focus:outline-hidden focus:ring-2 focus:ring-[#16A66A]/40"
            />
          </div>

          {/* Observação */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#202724] dark:text-[#F4F4F5] flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-[#5E6963]" />
              <span>Observação (opcional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Sobra do mês, 13º salário, Rendimento..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E2E8E4] dark:border-[#2E3532] bg-white dark:bg-[#232725] text-[#202724] dark:text-[#F4F4F5] placeholder:text-[#5E6963]/50 focus:outline-hidden focus:ring-2 focus:ring-[#16A66A]/40"
            />
          </div>

          {/* Dica */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#16A66A]/10 text-[#075C45] dark:text-[#78D9A6] text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>O aporte é uma realocação de patrimônio e não altera o total de dinheiro disponível.</span>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="cursor-pointer text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || !isSourcesValid}
              className="cursor-pointer text-xs font-semibold"
            >
              {isSubmitting ? 'Registrando...' : 'Confirmar aporte'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
