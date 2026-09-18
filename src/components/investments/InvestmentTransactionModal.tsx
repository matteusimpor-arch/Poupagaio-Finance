import React, { useState, useEffect } from 'react';
import {
  Investment,
  InvestmentTransaction,
  InvestmentTransactionType,
  CreateInvestmentTransactionInput,
  UpdateInvestmentTransactionInput,
} from '../../types';
import { X, ArrowUpRight, ArrowDownRight, Calendar, DollarSign, FileText } from 'lucide-react';
import { Button } from '../ui/button';

interface InvestmentTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    input: CreateInvestmentTransactionInput | UpdateInvestmentTransactionInput,
    isEdit: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  investment: Investment;
  transactionToEdit?: InvestmentTransaction | null;
  defaultType?: InvestmentTransactionType;
  spaceId: string;
}

export function InvestmentTransactionModal({
  isOpen,
  onClose,
  onSave,
  investment,
  transactionToEdit,
  defaultType = 'contribution',
  spaceId,
}: InvestmentTransactionModalProps) {
  const isEdit = Boolean(transactionToEdit);

  const [type, setType] = useState<InvestmentTransactionType>(defaultType);
  const [amount, setAmount] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setAmount(String(transactionToEdit.amount));
      setTransactionDate(transactionToEdit.transaction_date || new Date().toISOString().split('T')[0]);
      setNotes(transactionToEdit.notes || '');
    } else {
      setType(defaultType);
      setAmount('');
      setTransactionDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
    setError(null);
  }, [transactionToEdit, defaultType, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numericAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Informe um valor válido maior que zero.');
      return;
    }

    if (!transactionDate) {
      setError('Informe a data da movimentação.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isEdit) {
        const updateInput: UpdateInvestmentTransactionInput = {
          type,
          amount: numericAmount,
          transaction_date: transactionDate,
          notes: notes.trim() || null,
        };
        const res = await onSave(updateInput, true);
        if (!res.success) {
          setError(res.error || 'Erro ao atualizar movimentação.');
          setIsLoading(false);
          return;
        }
      } else {
        const createInput: CreateInvestmentTransactionInput = {
          investment_id: investment.id,
          space_id: spaceId,
          type,
          amount: numericAmount,
          transaction_date: transactionDate,
          notes: notes.trim() || null,
        };
        const res = await onSave(createInput, false);
        if (!res.success) {
          setError(res.error || 'Erro ao salvar movimentação.');
          setIsLoading(false);
          return;
        }
      }

      setIsLoading(false);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Ocorreu um erro inesperado.');
      setIsLoading(false);
    }
  };

  const isContribution = type === 'contribution';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#1C221F] border border-[#E2E8E4] dark:border-[#2E3532] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8E4] dark:border-[#2E3532] bg-[#F7F9F8] dark:bg-[#181D1A]">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                isContribution
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
              }`}
            >
              {isContribution ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#202724] dark:text-[#F4F4F5] font-display">
                {isEdit
                  ? 'Editar Movimentação'
                  : isContribution
                  ? 'Registrar Aporte'
                  : 'Registrar Resgate'}
              </h3>
              <p className="text-xs text-[#5E6963] dark:text-[#95A39B] truncate max-w-[220px]">
                Ativo: {investment.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#5E6963] hover:text-[#202724] dark:text-[#95A39B] dark:hover:text-[#F4F4F5] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 rounded-xl">
              {error}
            </div>
          )}

          {/* Seletor Tipo */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#F2F5F3] dark:bg-[#121915] rounded-2xl border border-[#E2E8E4] dark:border-[#2E3532]">
            <button
              type="button"
              onClick={() => setType('contribution')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                type === 'contribution'
                  ? 'bg-white dark:bg-[#232725] text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-[#5E6963] dark:text-[#95A39B] hover:text-[#202724] dark:hover:text-[#F4F4F5]'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Aporte (+)</span>
            </button>
            <button
              type="button"
              onClick={() => setType('withdrawal')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                type === 'withdrawal'
                  ? 'bg-white dark:bg-[#232725] text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-[#5E6963] dark:text-[#95A39B] hover:text-[#202724] dark:hover:text-[#F4F4F5]'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>Resgate (-)</span>
            </button>
          </div>

          {/* Valor */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#202724] dark:text-[#F4F4F5]">
              Valor da Movimentação (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8E4] dark:border-[#2E3532] bg-white dark:bg-[#232725] text-sm text-[#202724] dark:text-[#F4F4F5] focus:outline-none focus:ring-2 focus:ring-[#075C45] dark:focus:ring-[#16A66A]"
            />
          </div>

          {/* Data */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#202724] dark:text-[#F4F4F5]">
              Data *
            </label>
            <input
              type="date"
              required
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8E4] dark:border-[#2E3532] bg-white dark:bg-[#232725] text-sm text-[#202724] dark:text-[#F4F4F5] focus:outline-none focus:ring-2 focus:ring-[#075C45] dark:focus:ring-[#16A66A]"
            />
          </div>

          {/* Observações */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#202724] dark:text-[#F4F4F5]">
              Observação (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Reaplicação de dividendos, aporte mensal"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8E4] dark:border-[#2E3532] bg-white dark:bg-[#232725] text-sm text-[#202724] dark:text-[#F4F4F5] focus:outline-none focus:ring-2 focus:ring-[#075C45] dark:focus:ring-[#16A66A]"
            />
          </div>

          <p className="text-[11px] text-[#5E6963] dark:text-[#95A39B]">
            * Registrar um {type === 'contribution' ? 'aporte' : 'resgate'} atualiza o capital líquido aportado. Se o valor atual de mercado mudou, atualize-o na opção "Atualizar valor atual".
          </p>

          {/* Ações */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E2E8E4] dark:border-[#2E3532]">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="cursor-pointer"
            >
              {isLoading ? 'Salvando...' : 'Confirmar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
