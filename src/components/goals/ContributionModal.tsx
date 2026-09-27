import React, { useState, useEffect } from 'react';
import { GoalWithProgress, CreateGoalContributionInput, Reserve } from '../../types';
import { formatCurrency } from '../../lib/formatters';
import { reservesService } from '../../lib/services/reserves';
import { Button } from '../ui/button';
import { X, PlusCircle, AlertCircle, Calendar, FileText, CheckCircle2, Wallet, PiggyBank } from 'lucide-react';

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
  const [sourceType, setSourceType] = useState<'free_balance' | 'reserve'>('free_balance');
  const [selectedReserveId, setSelectedReserveId] = useState<string>('');
  const [reserves, setReserves] = useState<Reserve[]>([]);
  const [freeBalance, setFreeBalance] = useState<number>(0);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && goal) {
      const today = new Date().toISOString().split('T')[0];
      setContributionDate(today);
      setAmount('');
      setNotes('');
      setSourceType('free_balance');
      setSelectedReserveId('');
      setErrorMessage(null);

      // Carregar reservas e saldo livre do mês/espaço
      const loadReservesAndBalance = async () => {
        setIsLoadingData(true);
        try {
          const [year, month] = today.split('-').map(Number);
          const res = await reservesService.getReservesWithSummary(goal.space_id, year, month);
          setReserves(res.reserves || []);
          setFreeBalance(res.summary.freeBalance || 0);
        } catch (err) {
          console.warn('Erro ao carregar reservas para aporte:', err);
        } finally {
          setIsLoadingData(false);
        }
      };

      loadReservesAndBalance();
    }
  }, [isOpen, goal]);

  if (!isOpen || !goal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const numericAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMessage('Informe um valor de aporte válido maior que zero.');
      return;
    }

    if (!contributionDate) {
      setErrorMessage('Por favor, selecione a data do aporte.');
      return;
    }

    // Validação de saldo insuficiente
    if (sourceType === 'free_balance') {
      if (numericAmount > freeBalance) {
        setErrorMessage(`Saldo livre insuficiente. Disponível: ${formatCurrency(freeBalance)}`);
        return;
      }
    } else if (sourceType === 'reserve') {
      if (!selectedReserveId) {
        setErrorMessage('Selecione uma reserva ou caixinha de origem.');
        return;
      }
      const selectedRes = reserves.find((r) => r.id === selectedReserveId);
      if (!selectedRes) {
        setErrorMessage('Reserva selecionada não encontrada.');
        return;
      }
      const availableReserveBal = Number(selectedRes.current_balance) || 0;
      if (numericAmount > availableReserveBal) {
        setErrorMessage(`Saldo insuficiente nesta reserva. Disponível: ${formatCurrency(availableReserveBal)}`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const selectedRes = sourceType === 'reserve' ? reserves.find((r) => r.id === selectedReserveId) : null;
      const payload: CreateGoalContributionInput = {
        goal_id: goal.id,
        space_id: goal.space_id,
        amount: numericAmount,
        contribution_date: contributionDate,
        source_type: sourceType,
        source_id: sourceType === 'reserve' ? selectedReserveId : null,
        source_name: sourceType === 'reserve' ? (selectedRes?.name || 'Reserva') : 'Saldo Livre',
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

          {/* Origem do Dinheiro */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#202724] dark:text-[#F4F4F5] block">
              Origem do dinheiro <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSourceType('free_balance')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                  sourceType === 'free_balance'
                    ? 'border-[#16A66A] bg-[#16A66A]/5 dark:bg-[#16A66A]/10 text-[#075C45] dark:text-[#78D9A6]'
                    : 'border-[#E2E8E4] dark:border-[#2E3532] bg-white dark:bg-[#232725] text-[#5E6963] dark:text-[#95A39B]'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Saldo Livre</span>
                </div>
                <span className="text-[11px] opacity-80">
                  Disponível: {formatCurrency(freeBalance)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSourceType('reserve')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                  sourceType === 'reserve'
                    ? 'border-[#16A66A] bg-[#16A66A]/5 dark:bg-[#16A66A]/10 text-[#075C45] dark:text-[#78D9A6]'
                    : 'border-[#E2E8E4] dark:border-[#2E3532] bg-white dark:bg-[#232725] text-[#5E6963] dark:text-[#95A39B]'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <PiggyBank className="w-3.5 h-3.5" />
                  <span>Reserva / Caixinha</span>
                </div>
                <span className="text-[11px] opacity-80">
                  {reserves.length} {reserves.length === 1 ? 'reserva real' : 'reservas reais'}
                </span>
              </button>
            </div>

            {/* Seleção de Reserva Específica */}
            {sourceType === 'reserve' && (
              <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                <span className="text-[11px] font-semibold text-[#5E6963] dark:text-[#95A39B] block">
                  Selecione a Reserva de Origem:
                </span>
                {isLoadingData ? (
                  <p className="text-xs text-[#5E6963] py-2">Carregando reservas...</p>
                ) : reserves.length === 0 ? (
                  <p className="text-xs text-amber-600 dark:text-amber-400 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
                    Nenhuma reserva/caixinha encontrada neste mês. Cadastre uma reserva antes de usá-la como origem.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {reserves.map((res) => {
                      const isSelected = selectedReserveId === res.id;
                      const resBal = Number(res.current_balance) || 0;
                      return (
                        <div
                          key={res.id}
                          onClick={() => setSelectedReserveId(res.id)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-[#16A66A] bg-[#16A66A]/10 text-[#075C45] dark:text-[#78D9A6]'
                              : 'border-[#E2E8E4] dark:border-[#2E3532] bg-white dark:bg-[#232725] hover:bg-black/5 dark:hover:bg-white/5 text-[#202724] dark:text-[#F4F4F5]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">{res.icon || '💰'}</span>
                            <span className="text-xs font-semibold">{res.name}</span>
                          </div>
                          <span className="text-xs font-bold">
                            Disponível: {formatCurrency(resBal)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
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
              placeholder="Ex: Reserva extra, bônus..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E2E8E4] dark:border-[#2E3532] bg-white dark:bg-[#232725] text-[#202724] dark:text-[#F4F4F5] placeholder:text-[#5E6963]/50 focus:outline-hidden focus:ring-2 focus:ring-[#16A66A]/40"
            />
          </div>

          {/* Dica */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#16A66A]/10 text-[#075C45] dark:text-[#78D9A6] text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>O aporte movimenta o saldo existente sem registrar nova receita.</span>
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
              disabled={isSubmitting}
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
