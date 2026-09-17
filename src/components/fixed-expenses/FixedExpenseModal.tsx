import React, { useState, useEffect } from 'react';
import {
  FixedExpenseWithStatus,
  CreateFixedExpenseInput,
  UpdateFixedExpenseInput,
  ExpenseRecurrence,
} from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { X, DollarSign, Calendar, Tag, FileText, Repeat, AlertCircle } from 'lucide-react';
import { parseCurrencyInput } from '../../lib/formatters';

interface FixedExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateFixedExpenseInput | UpdateFixedExpenseInput) => Promise<boolean>;
  editingExpense?: FixedExpenseWithStatus | null;
  spaceId: string;
}

export const FIXED_EXPENSE_CATEGORIES = [
  'Aluguel',
  'Financiamento',
  'Internet',
  'Telefone',
  'Energia',
  'Água',
  'Escola',
  'Academia',
  'Assinaturas',
  'Condomínio',
  'Outros',
];

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function FixedExpenseModal({
  isOpen,
  onClose,
  onSave,
  editingExpense,
  spaceId,
}: FixedExpenseModalProps) {
  const [description, setDescription] = useState('');
  const [rawAmount, setRawAmount] = useState('');
  const [dueDay, setDueDay] = useState('10');
  const [dueMonth, setDueMonth] = useState('1');
  const [category, setCategory] = useState('Aluguel');
  const [customCategory, setCustomCategory] = useState('');
  const [recurrence, setRecurrence] = useState<ExpenseRecurrence>('monthly');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const isEditing = Boolean(editingExpense);

  useEffect(() => {
    if (editingExpense) {
      setDescription(editingExpense.description);
      setRawAmount(editingExpense.amount.toFixed(2).replace('.', ','));
      setDueDay(String(editingExpense.due_day));
      setDueMonth(String(editingExpense.due_month || 1));
      if (FIXED_EXPENSE_CATEGORIES.includes(editingExpense.category)) {
        setCategory(editingExpense.category);
        setCustomCategory('');
      } else {
        setCategory('Outros');
        setCustomCategory(editingExpense.category);
      }
      setRecurrence(editingExpense.recurrence || 'monthly');
      setNotes(editingExpense.notes || '');
    } else {
      setDescription('');
      setRawAmount('');
      setDueDay('10');
      setDueMonth(String(new Date().getMonth() + 1));
      setCategory('Aluguel');
      setCustomCategory('');
      setRecurrence('monthly');
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
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: '' }));
    }
  };

  const handleDueDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    const num = parseInt(val, 10);
    if (!val) {
      setDueDay('');
    } else if (num >= 1 && num <= 31) {
      setDueDay(val);
    }
    if (errors.due_day) {
      setErrors((prev) => ({ ...prev, due_day: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!description.trim()) {
      newErrors.description = 'A descrição é obrigatória.';
    }

    const parsedAmount = parseCurrencyInput(rawAmount);
    if (parsedAmount <= 0) {
      newErrors.amount = 'Informe um valor maior que zero.';
    }

    const dayNum = parseInt(dueDay, 10);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
      newErrors.due_day = 'Informe um dia válido entre 1 e 31.';
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

    const payload: CreateFixedExpenseInput | UpdateFixedExpenseInput = {
      space_id: spaceId,
      description: description.trim(),
      amount: parsedAmount,
      due_day: parseInt(dueDay, 10),
      due_month: recurrence === 'yearly' ? parseInt(dueMonth, 10) : null,
      category: resolvedCategory,
      recurrence,
      notes: notes.trim() || null,
    };

    try {
      const success = await onSave(payload);
      if (success) {
        onClose();
      } else {
        setGeneralError('Não foi possível salvar o gasto fixo. Verifique os dados e tente novamente.');
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
      aria-labelledby="fixed-expense-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-[#18211D] border border-[#E8E4D5] dark:border-[#24312B] rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
      >
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E4D5] dark:border-[#24312B]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Repeat className="w-4 h-4" />
            </div>
            <h2
              id="fixed-expense-modal-title"
              className="text-lg font-bold font-display text-[#202724] dark:text-[#F7F4EA]"
            >
              {isEditing ? 'Editar gasto fixo' : 'Novo gasto fixo'}
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

        {/* Formulário com Scroll */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {generalError && (
            <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Campo Descrição */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#202724] dark:text-[#F7F4EA]">
              Descrição <span className="text-rose-500">*</span>
            </label>
            <Input
              id="fixed-expense-description-input"
              type="text"
              placeholder="Ex: Aluguel do apartamento, Internet fibra"
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

          {/* Linha: Valor e Dia do Vencimento */}
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
                  id="fixed-expense-amount-input"
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

            {/* Dia do Vencimento */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#202724] dark:text-[#F7F4EA]">
                Dia do vencimento <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5E6963] dark:text-[#95A39B]">
                  <Calendar className="w-4 h-4" />
                </div>
                <Input
                  id="fixed-expense-dueday-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="Ex: 10"
                  value={dueDay}
                  onChange={handleDueDayChange}
                  error={errors.due_day}
                  className="pl-9 rounded-2xl font-medium"
                />
              </div>
              <p className="text-[10px] text-[#5E6963] dark:text-[#95A39B]">
                Dia do mês em que vence (1 a 31)
              </p>
            </div>
          </div>

          {/* Linha: Categoria e Recorrência */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Categoria */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#202724] dark:text-[#F7F4EA] flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#5E6963] dark:text-[#95A39B]" />
                Categoria
              </label>
              <select
                id="fixed-expense-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-11 px-3.5 rounded-2xl bg-white dark:bg-[#101614] border border-[#E8E4D5] dark:border-[#24312B] text-xs sm:text-sm text-[#202724] dark:text-[#F7F4EA] focus:outline-hidden focus:ring-2 focus:ring-[#16A66A] cursor-pointer"
              >
                {FIXED_EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Recorrência */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#202724] dark:text-[#F7F4EA] flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-[#5E6963] dark:text-[#95A39B]" />
                Recorrência
              </label>
              <select
                id="fixed-expense-recurrence-select"
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as ExpenseRecurrence)}
                className="w-full h-11 px-3.5 rounded-2xl bg-white dark:bg-[#101614] border border-[#E8E4D5] dark:border-[#24312B] text-xs sm:text-sm text-[#202724] dark:text-[#F7F4EA] focus:outline-hidden focus:ring-2 focus:ring-[#16A66A] cursor-pointer"
              >
                <option value="monthly">Mensal (todo mês)</option>
                <option value="yearly">Anual (uma vez por ano)</option>
              </select>
            </div>
          </div>

          {/* Mês de Vencimento para Recorrência Anual */}
          {recurrence === 'yearly' && (
            <div className="space-y-1.5 animate-in fade-in duration-100">
              <label className="text-xs font-bold text-[#202724] dark:text-[#F7F4EA] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#5E6963] dark:text-[#95A39B]" />
                Mês de vencimento <span className="text-rose-500">*</span>
              </label>
              <select
                id="fixed-expense-duemonth-select"
                value={dueMonth}
                onChange={(e) => setDueMonth(e.target.value)}
                className="w-full h-11 px-3.5 rounded-2xl bg-white dark:bg-[#101614] border border-[#E8E4D5] dark:border-[#24312B] text-xs sm:text-sm text-[#202724] dark:text-[#F7F4EA] focus:outline-hidden focus:ring-2 focus:ring-[#16A66A] cursor-pointer"
              >
                {MONTH_NAMES.map((mName, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {mName} (Mês {idx + 1})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-[#5E6963] dark:text-[#95A39B]">
                Esta despesa incidirá e será cobrada apenas no mês de vencimento escolhido.
              </p>
            </div>
          )}

          {/* Categoria Personalizada se selecionou 'Outros' */}
          {category === 'Outros' && (
            <div className="space-y-1.5 animate-in fade-in duration-100">
              <label className="text-xs font-medium text-[#5E6963] dark:text-[#95A39B]">
                Qual é a categoria?
              </label>
              <Input
                type="text"
                placeholder="Ex: Streaming, Mensalidade curso"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="rounded-2xl"
              />
            </div>
          )}

          {/* Observações */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#202724] dark:text-[#F7F4EA] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#5E6963] dark:text-[#95A39B]" />
              Observação <span className="text-[10px] font-normal text-[#5E6963] dark:text-[#95A39B]">(opcional)</span>
            </label>
            <textarea
              id="fixed-expense-notes-textarea"
              rows={2}
              placeholder="Ex: Débito automático no banco ou código do cliente..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#101614] border border-[#E8E4D5] dark:border-[#24312B] text-xs sm:text-sm text-[#202724] dark:text-[#F7F4EA] placeholder-[#5E6963]/60 dark:placeholder-[#95A39B]/60 focus:outline-hidden focus:ring-2 focus:ring-[#16A66A] resize-none"
            />
          </div>

          {/* Rodapé de Ações */}
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
              {isEditing ? 'Salvar alterações' : 'Cadastrar gasto fixo'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
