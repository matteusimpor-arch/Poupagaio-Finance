import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  InstallmentPurchaseWithInstallments,
  CreateInstallmentPurchaseInput,
  UpdateInstallmentPurchaseInput,
} from '@/src/types';
import { INSTALLMENT_CATEGORIES, calculateInstallmentsSchedule } from '@/src/lib/services/installments';
import { formatCurrency, getDefaultDateForBillingCycle } from '@/src/lib/formatters';
import { Button } from '@/src/components/ui/button';
import { X, Calendar, CheckCircle2, Calculator } from 'lucide-react';

interface InstallmentPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  spaceId: string;
  purchaseToEdit?: InstallmentPurchaseWithInstallments | null;
  onSave: (
    input: CreateInstallmentPurchaseInput | UpdateInstallmentPurchaseInput
  ) => Promise<{ success: boolean; error?: string }>;
  onDelete?: (deleteOption: 'only_installment' | 'full_purchase') => Promise<boolean>;
  selectedYear?: number;
  selectedMonth?: number;
}

export function InstallmentPurchaseModal({
  isOpen,
  onClose,
  purchaseToEdit,
  onSave,
  selectedYear,
  selectedMonth,
}: InstallmentPurchaseModalProps) {
  const [description, setDescription] = useState('');
  const [inputMode, setInputMode] = useState<'total' | 'installment'>('total');
  const [totalAmountInput, setTotalAmountInput] = useState('');
  const [installmentAmountInput, setInstallmentAmountInput] = useState('');
  const [installmentCount, setInstallmentCount] = useState<number>(12);
  const [firstDueDate, setFirstDueDate] = useState('');
  const [category, setCategory] = useState<string>('Outros');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isEditing = Boolean(purchaseToEdit);
  const hasPaidInstallments = (purchaseToEdit?.paidCount || 0) > 0;

  useEffect(() => {
    if (purchaseToEdit) {
      setDescription(purchaseToEdit.description || '');
      const tot = purchaseToEdit.total_amount ? Number(purchaseToEdit.total_amount) : 0;
      setTotalAmountInput(tot ? String(tot) : '');
      const count = purchaseToEdit.installment_count || 12;
      setInstallmentCount(count);
      if (tot && count > 0) {
        setInstallmentAmountInput((tot / count).toFixed(2).replace('.', ','));
      }
      setInputMode('total');
      setFirstDueDate(purchaseToEdit.first_due_date || '');
      setCategory(purchaseToEdit.category || 'Outros');
      setNotes(purchaseToEdit.notes || '');
    } else {
      const defaultDate = getDefaultDateForBillingCycle(selectedYear, selectedMonth);
      setDescription('');
      setTotalAmountInput('');
      setInstallmentAmountInput('');
      setInstallmentCount(12);
      setInputMode('total');
      setFirstDueDate(defaultDate);
      setCategory('Outros');
      setNotes('');
    }
    setErrorMessage(null);
    setShowDeleteConfirm(false);
  }, [purchaseToEdit, isOpen, selectedYear, selectedMonth]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Derived effective total amount
  const effectiveTotalAmount = useMemo(() => {
    if (inputMode === 'total') {
      return parseFloat(totalAmountInput.replace(',', '.')) || 0;
    } else {
      const instAmt = parseFloat(installmentAmountInput.replace(',', '.')) || 0;
      return instAmt * installmentCount;
    }
  }, [inputMode, totalAmountInput, installmentAmountInput, installmentCount]);

  // Schedule preview
  const schedulePreview = useMemo(() => {
    if (effectiveTotalAmount <= 0 || installmentCount < 2 || !firstDueDate) {
      return null;
    }
    try {
      const schedule = calculateInstallmentsSchedule(effectiveTotalAmount, installmentCount, firstDueDate);
      const firstInstallment = schedule[0];
      const lastInstallment = schedule[schedule.length - 1];
      const isUniform = firstInstallment.amount === lastInstallment.amount;
      return {
        totalAmount: effectiveTotalAmount,
        installmentCount,
        firstAmount: firstInstallment.amount,
        lastAmount: lastInstallment.amount,
        isUniform,
        firstDueDate: firstInstallment.due_date.split('-').reverse().join('/'),
        lastDueDate: lastInstallment.due_date.split('-').reverse().join('/'),
      };
    } catch {
      return null;
    }
  }, [effectiveTotalAmount, installmentCount, firstDueDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!description.trim()) {
      setErrorMessage('Informe a descrição da compra.');
      return;
    }
    if (effectiveTotalAmount <= 0) {
      setErrorMessage('Informe um valor total ou da parcela válido.');
      return;
    }
    if (installmentCount < 2 || installmentCount > 120) {
      setErrorMessage('A quantidade de parcelas deve estar entre 2 e 120.');
      return;
    }
    if (!firstDueDate) {
      setErrorMessage('Informe a data do primeiro vencimento.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateInstallmentPurchaseInput | UpdateInstallmentPurchaseInput = {
        description: description.trim(),
        total_amount: effectiveTotalAmount,
        installment_count: installmentCount,
        first_due_date: firstDueDate,
        category,
        notes: notes.trim() ? notes.trim() : null,
      };

      const res = await onSave(payload);
      if (!res.success) {
        setErrorMessage(res.error || 'Erro ao salvar parcelamento.');
        setIsSubmitting(false);
        return;
      }
      onClose();
    } catch {
      setErrorMessage('Ocorreu um erro ao processar o parcelamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const quickCounts = [2, 3, 6, 10, 12, 18, 24, 36, 48];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-[#18211D] rounded-2xl border border-[#D2DDD6] dark:border-[#28322C] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D2DDD6] dark:border-[#28322C] bg-[#F7FAF8] dark:bg-[#1C2420]">
          <div>
            <h3 className="text-base font-bold font-display text-[#02402E] dark:text-[#78D9A6] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#F59E0B]" />
              {isEditing ? 'Editar Compra Parcelada' : 'Novo Parcelamento'}
            </h3>
            <p className="text-xs text-[#5E6963] dark:text-[#95A39B] mt-0.5">
              {isEditing
                ? hasPaidInstallments
                  ? 'Existem parcelas pagas. Valores e datas bloqueados por segurança.'
                  : 'Atualize os dados ou o valor da compra.'
                : 'Cadastre uma compra parcelada informando o valor total ou o valor da parcela.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#5E6963] hover:text-[#02402E] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
              <span className="font-bold">Atenção:</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Descrição */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#5E6963] dark:text-[#95A39B] mb-1.5">
              Descrição da Compra *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Smartphone novo, TV 4K, Passagem aérea..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2DDD6] dark:border-[#28322C] bg-white dark:bg-[#141C18] text-[#202724] dark:text-[#F4F4F5] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#16A66A]/40 transition-all"
            />
          </div>

          {/* COMO DESEJA INFORMAR O VALOR? */}
          {(!isEditing || !hasPaidInstallments) && (
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5E6963] dark:text-[#95A39B]">
                Como deseja informar o valor? *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setInputMode('total')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    inputMode === 'total'
                      ? 'border-[#F59E0B] bg-[#F59E0B]/10 text-[#02402E] dark:text-[#FDE68A] shadow-2xs'
                      : 'border-[#D2DDD6] dark:border-[#28322C] bg-white dark:bg-[#141C18] text-[#5E6963] dark:text-[#95A39B]'
                  }`}
                >
                  <Calculator className="w-4 h-4 text-[#F59E0B]" />
                  <span>Valor total da compra</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('installment')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    inputMode === 'installment'
                      ? 'border-[#F59E0B] bg-[#F59E0B]/10 text-[#02402E] dark:text-[#FDE68A] shadow-2xs'
                      : 'border-[#D2DDD6] dark:border-[#28322C] bg-white dark:bg-[#141C18] text-[#5E6963] dark:text-[#95A39B]'
                  }`}
                >
                  <Calculator className="w-4 h-4 text-[#F59E0B]" />
                  <span>Valor da parcela</span>
                </button>
              </div>
            </div>
          )}

          {/* Grid: Valor (Total ou Parcela) e Qtd Parcelas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {inputMode === 'total' ? (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5E6963] dark:text-[#95A39B] mb-1.5">
                  Valor Total da Compra (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-[#5E6963]">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    disabled={isEditing && hasPaidInstallments}
                    value={totalAmountInput}
                    onChange={(e) => {
                      setTotalAmountInput(e.target.value);
                      const val = parseFloat(e.target.value) || 0;
                      if (installmentCount > 0) {
                        setInstallmentAmountInput((val / installmentCount).toFixed(2));
                      }
                    }}
                    placeholder="0,00"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#D2DDD6] dark:border-[#28322C] bg-white dark:bg-[#141C18] text-[#202724] dark:text-[#F4F4F5] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#16A66A]/40 ${
                      isEditing && hasPaidInstallments ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5E6963] dark:text-[#95A39B] mb-1.5">
                  Valor da Parcela (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-[#5E6963]">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    disabled={isEditing && hasPaidInstallments}
                    value={installmentAmountInput}
                    onChange={(e) => {
                      setInstallmentAmountInput(e.target.value);
                      const instVal = parseFloat(e.target.value) || 0;
                      setTotalAmountInput((instVal * installmentCount).toFixed(2));
                    }}
                    placeholder="0,00"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#D2DDD6] dark:border-[#28322C] bg-white dark:bg-[#141C18] text-[#202724] dark:text-[#F4F4F5] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#16A66A]/40 ${
                      isEditing && hasPaidInstallments ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5E6963] dark:text-[#95A39B] mb-1.5">
                Qtd de Parcelas (2 a 120) *
              </label>
              <input
                type="number"
                min="2"
                max="120"
                required
                disabled={isEditing && hasPaidInstallments}
                value={installmentCount}
                onChange={(e) => {
                  const count = parseInt(e.target.value, 10) || 2;
                  setInstallmentCount(count);
                  if (inputMode === 'total') {
                    const tot = parseFloat(totalAmountInput) || 0;
                    if (count > 0) setInstallmentAmountInput((tot / count).toFixed(2));
                  } else {
                    const instVal = parseFloat(installmentAmountInput) || 0;
                    setTotalAmountInput((instVal * count).toFixed(2));
                  }
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border border-[#D2DDD6] dark:border-[#28322C] bg-white dark:bg-[#141C18] text-[#202724] dark:text-[#F4F4F5] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#16A66A]/40 ${
                  isEditing && hasPaidInstallments ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              />
            </div>
          </div>

          {/* Atalhos rápidos de parcelas */}
          {(!isEditing || !hasPaidInstallments) && (
            <div className="space-y-1.5">
              <span className="text-[11px] text-[#5E6963] dark:text-[#95A39B]">Atalhos frequentes:</span>
              <div className="flex flex-wrap gap-1.5">
                {quickCounts.map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => {
                      setInstallmentCount(count);
                      if (inputMode === 'total') {
                        const tot = parseFloat(totalAmountInput) || 0;
                        setInstallmentAmountInput((tot / count).toFixed(2));
                      } else {
                        const instVal = parseFloat(installmentAmountInput) || 0;
                        setTotalAmountInput((instVal * count).toFixed(2));
                      }
                    }}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium border transition-colors cursor-pointer ${
                      installmentCount === count
                        ? 'bg-[#F59E0B] text-white border-[#F59E0B]'
                        : 'border-[#D2DDD6] dark:border-[#28322C] bg-[#F7FAF8] dark:bg-[#141C18] text-[#5E6963] dark:text-[#95A39B] hover:border-[#F59E0B]'
                    }`}
                  >
                    {count}x
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Primeiro Vencimento e Categoria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5E6963] dark:text-[#95A39B] mb-1.5">
                Primeiro Vencimento *
              </label>
              <input
                type="date"
                required
                disabled={isEditing && hasPaidInstallments}
                value={firstDueDate}
                onChange={(e) => setFirstDueDate(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border border-[#D2DDD6] dark:border-[#28322C] bg-white dark:bg-[#141C18] text-[#202724] dark:text-[#F4F4F5] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#16A66A]/40 ${
                  isEditing && hasPaidInstallments ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5E6963] dark:text-[#95A39B] mb-1.5">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2DDD6] dark:border-[#28322C] bg-white dark:bg-[#141C18] text-[#202724] dark:text-[#F4F4F5] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#16A66A]/40 cursor-pointer"
              >
                {INSTALLMENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Resumo do Parcelamento (Visível em tempo real) */}
          {schedulePreview && (
            <div className="p-3.5 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-[#D97706] dark:text-[#FDE68A]">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#F59E0B]" />
                  Resumo do Parcelamento
                </span>
                <span>{schedulePreview.installmentCount} parcelas</span>
              </div>
              <div className="text-sm font-extrabold text-[#02402E] dark:text-[#F7F4EA]">
                {schedulePreview.installmentCount}x de {formatCurrency(schedulePreview.firstAmount)}
              </div>
              <p className="text-[11px] text-[#5E6963] dark:text-[#95A39B]">
                Total: <strong className="text-[#202724] dark:text-white">{formatCurrency(schedulePreview.totalAmount)}</strong> • Início: {schedulePreview.firstDueDate} até {schedulePreview.lastDueDate} (centavos distribuídos rigorosamente sem divergência contábil)
              </p>
            </div>
          )}

          {/* Observações */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#5E6963] dark:text-[#95A39B] mb-1.5">
              Observações (Opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Cartão de crédito, compra parcelada sem juros..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-[#D2DDD6] dark:border-[#28322C] bg-white dark:bg-[#141C18] text-[#202724] dark:text-[#F4F4F5] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#16A66A]/40 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-[#D2DDD6] dark:border-[#28322C]">
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
              disabled={isSubmitting}
              className="cursor-pointer text-xs font-semibold bg-[#F59E0B] hover:bg-[#D97706] text-white"
            >
              {isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar Compra' : 'Criar Compra e Parcelas'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
