import React, { useState, useEffect } from 'react';
import { GoalWithProgress, CreateGoalContributionInput, Reserve } from '../../types';
import { formatCurrency } from '../../lib/formatters';
import { Button } from '../ui/button';
import {
  X,
  PlusCircle,
  AlertCircle,
  Calendar,
  FileText,
  CheckCircle2,
  Wallet,
  PiggyBank,
  Check,
} from 'lucide-react';

interface ContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: GoalWithProgress | null;
  onSave: (
    input: CreateGoalContributionInput
  ) => Promise<{ success: boolean; error?: string }>;
  freeBalance?: number;
  reserves?: Reserve[];
}

export function ContributionModal({
  isOpen,
  onClose,
  goal,
  onSave,
  freeBalance = 0,
  reserves = [],
}: ContributionModalProps) {
  const [amount, setAmount] = useState('');
  const [contributionDate, setContributionDate] = useState('');
  const [originType, setOriginType] = useState<'free_balance' | 'reserve'>('free_balance');
  const [selectedReserveId, setSelectedReserveId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Inicializa a data atual no formato YYYY-MM-DD e reseta seleções
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setContributionDate(today);
      setAmount('');
      setNotes('');
      setErrorMessage(null);
      setOriginType('free_balance');

      // Se houver reservas disponíveis, seleciona a primeira como padrão caso o usuário troque
      if (reserves && reserves.length > 0) {
        setSelectedReserveId(reserves[0].id);
      } else {
        setSelectedReserveId('');
      }
    }
  }, [isOpen, goal, reserves]);

  if (!isOpen || !goal) return null;

  // Calcula o saldo disponível da origem atualmente selecionada
  const selectedReserve = reserves.find((r) => r.id === selectedReserveId);
  const availableBalance = originType === 'free_balance'
    ? Math.max(0, freeBalance)
    : Math.max(0, selectedReserve?.current_balance || 0);

  const numericAmount = parseFloat(amount.replace(',', '.'));
  const isAmountValid = !isNaN(numericAmount) && numericAmount > 0;
  const isInsufficient = isAmountValid && numericAmount > availableBalance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isAmountValid) {
      setErrorMessage('Informe um valor de aporte válido maior que zero.');
      return;
    }

    if (numericAmount > availableBalance) {
      setErrorMessage(
        `Saldo insuficiente. Você possui ${formatCurrency(availableBalance)} disponíveis nesta origem.`
      );
      return;
    }

    if (originType === 'reserve' && !selectedReserveId) {
      setErrorMessage('Selecione a reserva de origem do dinheiro.');
      return;
    }

    if (!contributionDate) {
      setErrorMessage('Por favor, selecione a data do aporte.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: CreateGoalContributionInput = {
        goal_id: goal.id,
        space_id: goal.space_id,
        amount: numericAmount,
        contribution_date: contributionDate,
        origin_type: originType,
        reserve_id: originType === 'reserve' ? selectedReserveId : null,
        reserve_name: originType === 'reserve' ? (selectedReserve?.name || null) : null,
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

  const remainingBefore = Math.max(0, goal.target_amount - goal.accumulatedAmount);

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
                {formatCurrency(goal.accumulatedAmount)} / {formatCurrency(goal.target_amount)}
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

          {/* 1. SELEÇÃO DA ORIGEM DO DINHEIRO */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#5E6963] dark:text-[#95A39B]">
                Origem do Dinheiro <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] font-semibold text-[#075C45] dark:text-[#78D9A6]">
                Disponível: {formatCurrency(availableBalance)}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {/* Opção: Saldo Livre */}
              <button
                type="button"
                onClick={() => setOriginType('free_balance')}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  originType === 'free_balance'
                    ? 'border-[#16A66A] bg-[#16A66A]/5 dark:bg-[#16A66A]/10 ring-1 ring-[#16A66A]'
                    : 'border-[#E2E8E4] dark:border-[#2E3532] bg-white dark:bg-[#232725] hover:border-[#16A66A]/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      originType === 'free_balance'
                        ? 'bg-[#16A66A] text-white'
                        : 'bg-[#F3F4F4] text-[#5E6963] dark:bg-[#1E2220] dark:text-[#95A39B]'
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#202724] dark:text-[#F4F4F5]">
                      Saldo Livre
                    </div>
                    <div className="text-[11px] text-[#5E6963] dark:text-[#95A39B]">
                      Disponível: <strong className="text-[#075C45] dark:text-[#78D9A6]">{formatCurrency(freeBalance)}</strong>
                    </div>
                  </div>
                </div>
                {originType === 'free_balance' && (
                  <div className="w-5 h-5 rounded-full bg-[#16A66A] text-white flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </button>

              {/* Opção: Caixinhas / Reservas (se existirem) */}
              {reserves && reserves.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-[#5E6963] dark:text-[#95A39B] block">
                    Ou retirar de uma Reserva / Caixinha:
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
                    {reserves.map((r) => {
                      const isSelected = originType === 'reserve' && selectedReserveId === r.id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => {
                            setOriginType('reserve');
                            setSelectedReserveId(r.id);
                          }}
                          className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#16A66A] bg-[#16A66A]/5 dark:bg-[#16A66A]/10 ring-1 ring-[#16A66A]'
                              : 'border-[#E2E8E4] dark:border-[#2E3532] bg-white dark:bg-[#232725] hover:border-[#16A66A]/40'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-base shrink-0">{r.icon || '💰'}</span>
                            <div className="truncate">
                              <div className="text-xs font-bold text-[#202724] dark:text-[#F4F4F5] truncate">
                                {r.name}
                              </div>
                              <div className="text-[10px] text-[#5E6963] dark:text-[#95A39B]">
                                Saldo: <strong className="text-[#075C45] dark:text-[#78D9A6]">{formatCurrency(r.current_balance)}</strong>
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-[#16A66A] text-white flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Alerta Amigável de Saldo Insuficiente em Tempo Real */}
          {isInsufficient && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Saldo insuficiente. Você possui <strong>{formatCurrency(availableBalance)}</strong> disponíveis nesta origem.
              </span>
            </div>
          )}

          {/* Valor do Aporte */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#202724] dark:text-[#F4F4F5] flex items-center justify-between">
              <span>Valor do aporte (R$) <span className="text-rose-500">*</span></span>
              {remainingBefore > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const targetVal = Math.min(remainingBefore, availableBalance > 0 ? availableBalance : remainingBefore);
                    setAmount(String(targetVal));
                  }}
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
                className={`w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border bg-white dark:bg-[#232725] text-[#202724] dark:text-[#F4F4F5] placeholder:text-[#5E6963]/50 focus:outline-hidden focus:ring-2 ${
                  isInsufficient
                    ? 'border-rose-400 focus:ring-rose-400/40'
                    : 'border-[#E2E8E4] dark:border-[#2E3532] focus:ring-[#16A66A]/40'
                }`}
              />
            </div>
          </div>

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

          {/* Dica Contábil */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#16A66A]/10 text-[#075C45] dark:text-[#78D9A6] text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              Transferência interna entre origens: seu patrimônio é mantido e alocado com transparência.
            </span>
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
              disabled={isSubmitting || isInsufficient || !isAmountValid}
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
