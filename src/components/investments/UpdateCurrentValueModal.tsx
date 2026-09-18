import React, { useState, useEffect } from 'react';
import { Investment } from '../../types';
import { X, RefreshCw, DollarSign } from 'lucide-react';
import { Button } from '../ui/button';
import { formatCurrency } from '../../lib/formatters';

interface UpdateCurrentValueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    investmentId: string,
    currentValue: number
  ) => Promise<{ success: boolean; error?: string }>;
  investment: Investment | null;
}

export function UpdateCurrentValueModal({
  isOpen,
  onClose,
  onSave,
  investment,
}: UpdateCurrentValueModalProps) {
  const [currentValue, setCurrentValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (investment) {
      setCurrentValue(
        investment.current_value !== undefined ? String(investment.current_value) : '0'
      );
    }
    setError(null);
  }, [investment, isOpen]);

  if (!isOpen || !investment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numericVal = parseFloat(currentValue.replace(',', '.'));
    if (isNaN(numericVal) || numericVal < 0) {
      setError('Informe um valor atual válido (maior ou igual a 0).');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await onSave(investment.id, numericVal);
      if (!res.success) {
        setError(res.error || 'Erro ao atualizar valor atual.');
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Ocorreu um erro inesperado.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#1C221F] border border-[#E2E8E4] dark:border-[#2E3532] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8E4] dark:border-[#2E3532] bg-[#F7F9F8] dark:bg-[#181D1A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#075C45]/10 text-[#075C45] dark:bg-[#16A66A]/20 dark:text-[#78D9A6] flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#202724] dark:text-[#F4F4F5] font-display">
                Atualizar Valor Atual
              </h3>
              <p className="text-xs text-[#5E6963] dark:text-[#95A39B] truncate max-w-[220px]">
                {investment.name}
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

          <div className="p-3.5 rounded-2xl bg-[#F2F5F3] dark:bg-[#121915] border border-[#E2E8E4] dark:border-[#2E3532] space-y-1">
            <span className="text-[11px] text-[#5E6963] dark:text-[#95A39B]">Valor atual registrado anteriormente</span>
            <p className="text-base font-bold text-[#202724] dark:text-[#F4F4F5]">
              {formatCurrency(investment.current_value)}
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#202724] dark:text-[#F4F4F5]">
              Novo Valor Atual de Mercado (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="0.00"
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8E4] dark:border-[#2E3532] bg-white dark:bg-[#232725] text-sm text-[#202724] dark:text-[#F4F4F5] focus:outline-none focus:ring-2 focus:ring-[#075C45] dark:focus:ring-[#16A66A]"
            />
          </div>

          <p className="text-[11px] text-[#5E6963] dark:text-[#95A39B]">
            Esta ação atualiza a cotação/posição do ativo e não cria nenhuma movimentação no histórico de aportes/resgates.
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
              {isLoading ? 'Atualizando...' : 'Atualizar Valor'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
