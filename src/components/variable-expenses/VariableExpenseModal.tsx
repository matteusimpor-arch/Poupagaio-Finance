import React, { useState, useEffect } from 'react';
import {
  VariableExpense,
  VariableExpenseStatus,
  CreateVariableExpenseInput,
  UpdateVariableExpenseInput,
} from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { X, DollarSign, Calendar, Tag, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { parseCurrencyInput, getISODateToday } from '../../lib/formatters';

interface VariableExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateVariableExpenseInput | UpdateVariableExpenseInput) => Promise<boolean>;
  editingExpense?: VariableExpense | null;
  spaceId: string;
}

export const VARIABLE_EXPENSE_CATEGORIES = [
  'Mercado',
  'Alimentação',
  'Combustível',
  'Transporte',
  'Saúde',
  'Lazer',
  'Compras',
  'Casa',
  'Educação',
  'Manutenção',
  'Outros',
];

export function VariableExpenseModal({
  isOpen,
  onClose,
  onSave,
  editingExpense,
  spaceId,
}: VariableExpenseModalProps) {
  const [description, setDescription] = useState('');
  const [rawAmount, setRawAmount] = useState('');
  const [date, setDate] = useState(getISODateToday());
  const [category, setCategory] = useState('Mercado');
  const [customCategory, setCustomCategory] = useState('');
  const [status, setStatus] = useState<VariableExpenseStatus>('paid');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const isEditing = Boolean(editingExpense);

  useEffect(() => {
    if (editingExpense) {
      setDescription(editingExpense.description);
      setRawAmount(editingExpense.amount.toFixed(2).replace('.', ','));
      setDate(editingExpense.date);
      if (VARIABLE_EXPENSE_CATEGORIES.includes(editingExpense.category)) {
        setCategory(editingExpense.category);
        setCustomCategory('');
      } else {
        setCategory('Outros');
        setCustomCategory(editingExpense.category);
      }
      setStatus(editingExpense.status);
      setNotes(editingExpense.notes || '');
    } else {
      setDescription('');
      setRawAmount('');
      setDate(getISODateToday());
      setCategory('Mercado');
      setCustomCategory('');
      setStatus('paid');
      setNotes('');
    }
    setErrors({});
    setGeneralError(null);
  }, [editingExpense, isOpen]);

  if (!isOpen) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const clean = val.replace(/[^\d.,]/g, '');
    setRawAmount(clean);
    if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!description.trim()) {
      newErrors.description = 'A descrição do gasto é obrigatória.';
    }

    const parsedAmount = parseCurrencyInput(rawAmount);
    if (parsedAmount <= 0) {
      newErrors.amount = 'Informe um valor maior que zero.';
    }

    if (!date) {
      newErrors.date = 'A data do gasto é obrigatória.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);

    const parsedAmount = parseCurrencyInput(rawAmount);
    const resolvedCategory =
      category === 'Outros' && customCategory.trim()
        ? customCategory.trim()
        : category;

    const payload: CreateVariableExpenseInput | UpdateVariableExpenseInput = {
      space_id: spaceId,
      description: description.trim(),
      amount: parsedAmount,
      date,
      category: resolvedCategory,
      status,
      notes: notes.trim() || null,
    };

    try {
      const success = await onSave(payload);
      if (success) {
        onClose();
      } else {
        setGeneralError('Não foi possível salvar este gasto. Tente novamente.');
      }
    } catch (err: any) {
      setGeneralError(err.message || 'Erro inesperado ao salvar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="variable-expense-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="w-full max-w-lg bg-white dark:bg-[#18211D] border border-[#E8E4D5] dark:border-[#24312B] rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E4D5] dark:border-[#24312B]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#D6A84B]/15 text-[#8A6318] dark:text-[#F2D58A] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
            <h2
              id="variable-expense-modal-title"
              className="text-lg font-bold font-display text-[#202724] dark:text-[#F7F4EA]"
            >
              {isEditing ? 'Editar gasto variável' : 'Novo gasto variável'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-[#5E6963] dark:text-[#95A39B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {generalError && (
            <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Descrição */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#202724] dark:text-[#F7F4EA]">
              Descrição <span className="text-rose-500">*</span>
            </label>
            <Input
              id="variable-expense-description-input"
              type="text"
              placeholder="Ex: Compras da semana no mercado, Combustível posto"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
              }}
              error={errors.description}
              autoFocus={!isEditing}
              className="rounded-2xl"
            />
          </div>

          {/* Valor e Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Valor */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#202724] dark:text-[#F7F4EA]">
                Valor (R$) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5E6963] dark:text-[#95A39B]">
                  <DollarSign className="w-4 h-4" />
                </div>
                <Input
                  id="variable-expense-amount-input"
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={rawAmount}
                  onChange={handleAmountChange}
                  error={errors.amount}
                  className="pl-9 rounded-2xl font-bold"
                />
              </div>
            </div>

            {/* Data */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#202724] dark:text-[#F7F4EA]">
                Data <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5E6963] dark:text-[#95A39B]">
                  <Calendar className="w-4 h-4" />
                </div>
                <Input
                  id="variable-expense-date-input"
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    if (errors.date) setErrors((prev) => ({ ...prev, date: '' }));
                  }}
                  error={errors.date}
                  className="pl-9 rounded-2xl font-medium"
                />
              </div>
            </div>
          </div>

          {/* Categoria */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#202724] dark:text-[#F7F4EA] flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#5E6963] dark:text-[#95A39B]" />
              Categoria
            </label>
            <select
              id="variable-expense-category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-11 px-3.5 rounded-2xl bg-white dark:bg-[#101614] border border-[#E8E4D5] dark:border-[#24312B] text-xs sm:text-sm text-[#202724] dark:text-[#F7F4EA] focus:outline-hidden focus:ring-2 focus:ring-[#16A66A] cursor-pointer"
            >
              {VARIABLE_EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {category === 'Outros' && (
            <div className="space-y-1.5 animate-in fade-in duration-100">
              <label className="text-xs font-medium text-[#5E6963] dark:text-[#95A39B]">
                Qual é a categoria?
              </label>
              <Input
                type="text"
                placeholder="Ex: Farmácia manipulada, Estacionamento"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="rounded-2xl"
              />
            </div>
          )}

          {/* Status: Pago ou Pendente */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#202724] dark:text-[#F7F4EA]">
              Status do gasto
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setStatus('paid')}
                className={`h-11 px-3.5 rounded-2xl border flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  status === 'paid'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-600 shadow-2xs'
                    : 'border-[#E8E4D5] dark:border-[#24312B] bg-white dark:bg-[#101614] text-[#5E6963] dark:text-[#95A39B] hover:border-[#16A66A]/40'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Pago</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('pending')}
                className={`h-11 px-3.5 rounded-2xl border flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  status === 'pending'
                    ? 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-600 shadow-2xs'
                    : 'border-[#E8E4D5] dark:border-[#24312B] bg-white dark:bg-[#101614] text-[#5E6963] dark:text-[#95A39B] hover:border-[#16A66A]/40'
                }`}
              >
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Pendente</span>
              </button>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#202724] dark:text-[#F7F4EA] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#5E6963] dark:text-[#95A39B]" />
              Observação <span className="text-[10px] font-normal text-[#5E6963] dark:text-[#95A39B]">(opcional)</span>
            </label>
            <textarea
              id="variable-expense-notes-textarea"
              rows={2}
              placeholder="Ex: Compra feita no cartão de débito ou detalhes da despesa..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#101614] border border-[#E8E4D5] dark:border-[#24312B] text-xs sm:text-sm text-[#202724] dark:text-[#F7F4EA] placeholder-[#5E6963]/60 dark:placeholder-[#95A39B]/60 focus:outline-hidden focus:ring-2 focus:ring-[#16A66A] resize-none"
            />
          </div>

          {/* Rodapé */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#E8E4D5] dark:border-[#24312B]">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-2xl cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="rounded-2xl font-bold cursor-pointer"
            >
              {isEditing ? 'Salvar alterações' : 'Cadastrar gasto variável'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
