import React, { useState } from 'react';
import { InvestmentWithCalculations, InvestmentStatus } from '../../types';
import { INVESTMENT_CATEGORY_MAP } from '../../lib/services/investments';
import { formatCurrency } from '../../lib/formatters';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Edit2,
  Trash2,
  Plus,
  Minus,
  MoreVertical,
  Eye,
  Building2,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';

interface InvestmentCardProps {
  key?: React.Key;
  investment: InvestmentWithCalculations;
  onViewDetails: (inv: InvestmentWithCalculations) => void;
  onEdit: (inv: InvestmentWithCalculations) => void;
  onUpdateValue: (inv: InvestmentWithCalculations) => void;
  onAddTransaction: (inv: InvestmentWithCalculations, type: 'contribution' | 'withdrawal') => void;
  onDelete: (invId: string) => Promise<{ success: boolean; error?: string }>;
}

export function InvestmentCard({
  investment,
  onViewDetails,
  onEdit,
  onUpdateValue,
  onAddTransaction,
  onDelete,
}: InvestmentCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const categoryLabel = INVESTMENT_CATEGORY_MAP[investment.category] || investment.category;
  const isPositiveNominal = investment.nominalResult >= 0;

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    const res = await onDelete(investment.id);
    if (!res.success) {
      setDeleteError(res.error || 'Erro ao excluir investimento.');
      setIsDeleting(false);
      return;
    }
    setIsDeleting(false);
    setIsDeleteConfirmOpen(false);
  };

  // Status Badge formatting
  const getStatusBadge = (status: InvestmentStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
            Ativo
          </span>
        );
      case 'closed':
        return (
          <span className="px-2 py-0.5 rounded-md bg-gray-500/10 text-gray-700 dark:text-gray-400 text-[10px] font-bold">
            Encerrado
          </span>
        );
      case 'archived':
        return (
          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-bold">
            Arquivado
          </span>
        );
    }
  };

  return (
    <Card className="border-[#E2E8E4] dark:border-[#2E3532] bg-white dark:bg-[#1C221F] shadow-xs hover:border-[#16A66A]/40 transition-all overflow-hidden flex flex-col group">
      <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-[#075C45]/10 text-[#075C45] dark:bg-[#16A66A]/20 dark:text-[#78D9A6] text-[10px] font-bold uppercase tracking-wider">
                {categoryLabel}
              </span>
              {investment.ticker && (
                <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[10px] font-bold tracking-wider">
                  {investment.ticker}
                </span>
              )}
              {getStatusBadge(investment.status)}
            </div>

            <h4
              onClick={() => onViewDetails(investment)}
              className="text-base font-bold text-[#202724] dark:text-[#F4F4F5] font-display mt-1.5 truncate cursor-pointer hover:text-[#075C45] dark:hover:text-[#78D9A6] transition-colors"
            >
              {investment.name}
            </h4>

            {investment.institution && (
              <p className="text-xs text-[#5E6963] dark:text-[#95A39B] truncate">
                {investment.institution}
              </p>
            )}
          </div>

          {/* Menu Dropdown de Ações */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 rounded-xl text-[#5E6963] hover:text-[#202724] dark:text-[#95A39B] dark:hover:text-[#F4F4F5] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1 w-48 rounded-2xl border border-[#E2E8E4] dark:border-[#2E3532] bg-white dark:bg-[#18211D] p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onViewDetails(investment);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold text-[#202724] dark:text-[#F4F4F5] text-left cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#075C45] dark:text-[#78D9A6]" />
                    <span>Ver detalhes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onUpdateValue(investment);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold text-[#202724] dark:text-[#F4F4F5] text-left cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Atualizar valor atual</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onAddTransaction(investment, 'contribution');
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 text-left cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Registrar aporte</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onAddTransaction(investment, 'withdrawal');
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold text-rose-600 dark:text-rose-400 text-left cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span>Registrar resgate</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onEdit(investment);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold text-[#202724] dark:text-[#F4F4F5] text-left cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Editar investimento</span>
                  </button>

                  <div className="my-1 border-t border-[#E2E8E4] dark:border-[#2E3532]" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsDeleteConfirmOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold text-rose-600 dark:text-rose-400 text-left cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir ativo</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Indicadores Principais em Cards de Resumo Interno */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Valor Atual */}
          <div className="p-2.5 rounded-xl bg-[#F2F5F3] dark:bg-[#121915] border border-[#E2E8E4] dark:border-[#2E3532]">
            <span className="text-[10px] font-semibold text-[#5E6963] dark:text-[#95A39B]">Valor Atual</span>
            <p className="text-sm font-bold text-[#202724] dark:text-[#F4F4F5] truncate font-display">
              {formatCurrency(investment.current_value)}
            </p>
          </div>

          {/* Capital Líquido Aportado */}
          <div className="p-2.5 rounded-xl bg-[#F2F5F3] dark:bg-[#121915] border border-[#E2E8E4] dark:border-[#2E3532]">
            <span className="text-[10px] font-semibold text-[#5E6963] dark:text-[#95A39B]">Capital Líquido</span>
            <p className="text-sm font-bold text-[#202724] dark:text-[#F4F4F5] truncate font-display">
              {formatCurrency(investment.netContributed)}
            </p>
          </div>
        </div>

        {/* Resultado Nominal & Percentual */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F7F9F8] dark:bg-[#181D1A] border border-[#E2E8E4] dark:border-[#2E3532]">
          <div>
            <span className="text-[10px] font-semibold text-[#5E6963] dark:text-[#95A39B]">Ganho / Perda</span>
            <p
              className={`text-sm font-bold font-display ${
                isPositiveNominal
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {isPositiveNominal ? '+' : ''}
              {formatCurrency(investment.nominalResult)}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-semibold text-[#5E6963] dark:text-[#95A39B]">Retorno %</span>
            <p
              className={`text-sm font-bold font-display ${
                investment.nominalReturnPercentage === null
                  ? 'text-[#5E6963] dark:text-[#95A39B]'
                  : investment.nominalReturnPercentage >= 0
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

        {/* Botão Principal de Detalhes e Ações Rápidas */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#E2E8E4] dark:border-[#2E3532]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(investment)}
            className="flex-1 text-xs gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Detalhes</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onUpdateValue(investment)}
            className="text-xs gap-1 cursor-pointer"
            title="Atualizar Valor Atual"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAddTransaction(investment, 'contribution')}
            className="text-xs text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
            title="Registrar Aporte"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>

      {/* Modal de Confirmação de Exclusão do Ativo Inteiro */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-[#1C221F] border border-[#E2E8E4] dark:border-[#2E3532] rounded-3xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base font-display text-[#202724] dark:text-[#F4F4F5]">
                Excluir investimento?
              </h4>
            </div>

            <p className="text-xs text-[#5E6963] dark:text-[#95A39B]">
              Esta ação excluirá permanentemente o ativo <strong>{investment.name}</strong> e todo o seu histórico de aportes e resgates.
            </p>

            {deleteError && (
              <p className="text-xs text-rose-600 font-semibold">{deleteError}</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8E4] dark:border-[#2E3532]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteConfirmOpen(false)}
                disabled={isDeleting}
                className="cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="cursor-pointer bg-rose-600 hover:bg-rose-700 text-white"
              >
                {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
