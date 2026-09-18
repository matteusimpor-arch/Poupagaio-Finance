import React, { useState } from 'react';
import {
  InvestmentWithCalculations,
  InvestmentTransaction,
  InvestmentTransactionType,
} from '../../types';
import { INVESTMENT_CATEGORY_MAP } from '../../lib/services/investments';
import { formatCurrency, formatDateBR } from '../../lib/formatters';
import {
  X,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Edit2,
  Trash2,
  Plus,
  Minus,
  Calendar,
  AlertTriangle,
  Building2,
  Tag,
  DollarSign,
  Info,
} from 'lucide-react';
import { Button } from '../ui/button';

interface InvestmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  investment: InvestmentWithCalculations | null;
  onOpenAddTransaction: (type: InvestmentTransactionType) => void;
  onOpenUpdateValue: () => void;
  onOpenEditInvestment: () => void;
  onEditTransaction: (tx: InvestmentTransaction) => void;
  onDeleteTransaction: (txId: string) => Promise<{ success: boolean; error?: string }>;
}

export function InvestmentDetailsModal({
  isOpen,
  onClose,
  investment,
  onOpenAddTransaction,
  onOpenUpdateValue,
  onOpenEditInvestment,
  onEditTransaction,
  onDeleteTransaction,
}: InvestmentDetailsModalProps) {
  const [txToDelete, setTxToDelete] = useState<InvestmentTransaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!isOpen || !investment) return null;

  const categoryLabel = INVESTMENT_CATEGORY_MAP[investment.category] || investment.category;
  const isPositiveNominal = investment.nominalResult >= 0;

  const handleConfirmDeleteTransaction = async () => {
    if (!txToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    const res = await onDeleteTransaction(txToDelete.id);
    if (!res.success) {
      setDeleteError(res.error || 'Erro ao excluir movimentação.');
      setIsDeleting(false);
      return;
    }

    setIsDeleting(false);
    setTxToDelete(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-[#1C221F] border border-[#E2E8E4] dark:border-[#2E3532] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8E4] dark:border-[#2E3532] bg-[#F7F9F8] dark:bg-[#181D1A] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#075C45]/10 text-[#075C45] dark:bg-[#16A66A]/20 dark:text-[#78D9A6] flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-[#202724] dark:text-[#F4F4F5] font-display truncate">
                  {investment.name}
                </h3>
                {investment.ticker && (
                  <span className="px-2 py-0.5 rounded-md bg-[#16A66A]/10 text-[#075C45] dark:text-[#78D9A6] text-xs font-bold shrink-0">
                    {investment.ticker}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#5E6963] dark:text-[#95A39B] truncate">
                {categoryLabel} {investment.institution ? `• ${investment.institution}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#5E6963] hover:text-[#202724] dark:text-[#95A39B] dark:hover:text-[#F4F4F5] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo rolável */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Dashboard de Desempenho do Ativo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Valor Atual */}
            <div className="p-3.5 rounded-2xl bg-[#F2F5F3] dark:bg-[#121915] border border-[#E2E8E4] dark:border-[#2E3532] space-y-1">
              <span className="text-[11px] font-semibold text-[#5E6963] dark:text-[#95A39B]">Valor Atual</span>
              <p className="text-base sm:text-lg font-extrabold text-[#202724] dark:text-[#F4F4F5] font-display">
                {formatCurrency(investment.current_value)}
              </p>
            </div>

            {/* Capital Líquido Aportado */}
            <div className="p-3.5 rounded-2xl bg-[#F2F5F3] dark:bg-[#121915] border border-[#E2E8E4] dark:border-[#2E3532] space-y-1">
              <span className="text-[11px] font-semibold text-[#5E6963] dark:text-[#95A39B]">Capital Líquido</span>
              <p className="text-base sm:text-lg font-extrabold text-[#202724] dark:text-[#F4F4F5] font-display">
                {formatCurrency(investment.netContributed)}
              </p>
            </div>

            {/* Resultado Nominal */}
            <div className="p-3.5 rounded-2xl bg-[#F2F5F3] dark:bg-[#121915] border border-[#E2E8E4] dark:border-[#2E3532] space-y-1">
              <span className="text-[11px] font-semibold text-[#5E6963] dark:text-[#95A39B]">Ganho/Perda (R$)</span>
              <p
                className={`text-base sm:text-lg font-extrabold font-display ${
                  isPositiveNominal
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {isPositiveNominal ? '+' : ''}
                {formatCurrency(investment.nominalResult)}
              </p>
            </div>

            {/* Rentabilidade Nominal % */}
            <div className="p-3.5 rounded-2xl bg-[#F2F5F3] dark:bg-[#121915] border border-[#E2E8E4] dark:border-[#2E3532] space-y-1">
              <span className="text-[11px] font-semibold text-[#5E6963] dark:text-[#95A39B]">Retorno %</span>
              <p
                className={`text-base sm:text-lg font-extrabold font-display ${
                  investment.nominalReturnPercentage === null
                    ? 'text-[#5E6963] dark:text-[#95A39B]'
                    : (investment.nominalReturnPercentage || 0) >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {investment.nominalReturnPercentage !== null
                  ? `${investment.nominalReturnPercentage >= 0 ? '+' : ''}${investment.nominalReturnPercentage.toFixed(2)}%`
                  : 'N/A'}
              </p>
            </div>
          </div>

          {/* Totais de Aportes vs Resgates */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-[#F7F9F8] dark:bg-[#181D1A] p-3 rounded-2xl border border-[#E2E8E4] dark:border-[#2E3532]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[#5E6963] dark:text-[#95A39B]">Total Aportes: </span>
                <strong className="text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(investment.totalContributions)}
                </strong>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <ArrowDownRight className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[#5E6963] dark:text-[#95A39B]">Total Resgates: </span>
                <strong className="text-rose-600 dark:text-rose-400">
                  {formatCurrency(investment.totalWithdrawals)}
                </strong>
              </div>
            </div>
          </div>

          {/* Botões de Ações Rápidas do Ativo */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenAddTransaction('contribution')}
              className="gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Aporte</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenAddTransaction('withdrawal')}
              className="gap-1.5 text-xs text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
              <span>Registrar Resgate</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onOpenUpdateValue}
              className="gap-1.5 text-xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Atualizar Valor</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onOpenEditInvestment}
              className="gap-1.5 text-xs cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Editar Ativo</span>
            </Button>
          </div>

          {/* Tabela de Histórico de Movimentações */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#075C45] dark:text-[#78D9A6]">
                Histórico de Movimentações
              </h4>
              <span className="text-xs text-[#5E6963] dark:text-[#95A39B]">
                {investment.transactions.length}{' '}
                {investment.transactions.length === 1 ? 'registro' : 'registros'}
              </span>
            </div>

            {investment.transactions.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-[#F7F9F8] dark:bg-[#181D1A] border border-dashed border-[#E2E8E4] dark:border-[#2E3532] space-y-1">
                <p className="text-xs font-bold text-[#202724] dark:text-[#F4F4F5]">
                  Nenhuma movimentação registrada.
                </p>
                <p className="text-[11px] text-[#5E6963] dark:text-[#95A39B]">
                  Aportes e resgates ajudam a calcular com precisão seu capital aplicado e rendimento real.
                </p>
              </div>
            ) : (
              <div className="border border-[#E2E8E4] dark:border-[#2E3532] rounded-2xl overflow-hidden bg-white dark:bg-[#1C221F]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F7F9F8] dark:bg-[#181D1A] text-[#5E6963] dark:text-[#95A39B] border-b border-[#E2E8E4] dark:border-[#2E3532]">
                      <tr>
                        <th className="py-2.5 px-3 font-bold">Data</th>
                        <th className="py-2.5 px-3 font-bold">Tipo</th>
                        <th className="py-2.5 px-3 font-bold">Valor</th>
                        <th className="py-2.5 px-3 font-bold">Observação</th>
                        <th className="py-2.5 px-3 font-bold text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8E4] dark:divide-[#2E3532]">
                      {investment.transactions.map((tx) => {
                        const isContrib = tx.type === 'contribution';
                        return (
                          <tr key={tx.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                            <td className="py-2.5 px-3 font-medium text-[#202724] dark:text-[#F4F4F5]">
                              {formatDateBR(tx.transaction_date)}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  isContrib
                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                    : 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                                }`}
                              >
                                {isContrib ? (
                                  <>
                                    <ArrowUpRight className="w-3 h-3" /> Aporte
                                  </>
                                ) : (
                                  <>
                                    <ArrowDownRight className="w-3 h-3" /> Resgate
                                  </>
                                )}
                              </span>
                            </td>
                            <td className={`py-2.5 px-3 font-bold ${isContrib ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              {isContrib ? '+' : '-'} {formatCurrency(tx.amount)}
                            </td>
                            <td className="py-2.5 px-3 text-[#5E6963] dark:text-[#95A39B] max-w-[150px] truncate">
                              {tx.notes || '-'}
                            </td>
                            <td className="py-2.5 px-3 text-right space-x-1">
                              <button
                                type="button"
                                onClick={() => onEditTransaction(tx)}
                                title="Editar movimentação"
                                className="p-1 rounded-lg text-[#5E6963] hover:text-[#202724] dark:text-[#95A39B] dark:hover:text-[#F4F4F5] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setTxToDelete(tx)}
                                title="Excluir movimentação"
                                className="p-1 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Diálogo de Confirmação de Exclusão de Movimentação */}
        {txToDelete && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-sm bg-white dark:bg-[#1C221F] border border-[#E2E8E4] dark:border-[#2E3532] rounded-3xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/15 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base font-display text-[#202724] dark:text-[#F4F4F5]">
                  Excluir movimentação?
                </h4>
              </div>

              <p className="text-xs text-[#5E6963] dark:text-[#95A39B]">
                Esta ação removerá a movimentação do histórico e recalculará os totais do investimento.
              </p>

              {deleteError && (
                <p className="text-xs text-rose-600 font-semibold">{deleteError}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8E4] dark:border-[#2E3532]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTxToDelete(null)}
                  disabled={isDeleting}
                  className="cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleConfirmDeleteTransaction}
                  disabled={isDeleting}
                  className="cursor-pointer bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
