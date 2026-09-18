import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  Investment,
  InvestmentWithCalculations,
  InvestmentTransaction,
  InvestmentTransactionType,
  InvestmentsSummary,
  InvestmentCategory,
  InvestmentStatus,
  CreateInvestmentInput,
  UpdateInvestmentInput,
  CreateInvestmentTransactionInput,
  UpdateInvestmentTransactionInput,
} from '../../types';
import {
  investmentsService,
  emptyInvestmentsSummary,
  INVESTMENT_CATEGORIES,
} from '../../lib/services/investments';
import { formatCurrency } from '../../lib/formatters';
import {
  TrendingUp,
  Plus,
  Search,
  Filter,
  PieChart,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Wallet,
  AlertCircle,
  Database,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { InvestmentCard } from './InvestmentCard';
import { InvestmentModal } from './InvestmentModal';
import { InvestmentTransactionModal } from './InvestmentTransactionModal';
import { UpdateCurrentValueModal } from './UpdateCurrentValueModal';
import { InvestmentDetailsModal } from './InvestmentDetailsModal';

export function InvestmentsScreen() {
  const { currentSpace } = useAuth();

  const [investments, setInvestments] = useState<InvestmentWithCalculations[]>([]);
  const [summary, setSummary] = useState<InvestmentsSummary>(emptyInvestmentsSummary);
  const [isLoading, setIsLoading] = useState(true);
  const [isTableMissing, setIsTableMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros de busca e estado
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'active' | 'closed' | 'archived' | 'all'>('active');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Modais State
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [investmentToEdit, setInvestmentToEdit] = useState<Investment | null>(null);

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [activeInvestmentForTx, setActiveInvestmentForTx] = useState<Investment | null>(null);
  const [txToEdit, setTxToEdit] = useState<InvestmentTransaction | null>(null);
  const [defaultTxType, setDefaultTxType] = useState<InvestmentTransactionType>('contribution');

  const [isUpdateValueModalOpen, setIsUpdateValueModalOpen] = useState(false);
  const [activeInvestmentForValue, setActiveInvestmentForValue] = useState<Investment | null>(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedInvestmentDetails, setSelectedInvestmentDetails] = useState<InvestmentWithCalculations | null>(null);

  const loadData = async () => {
    if (!currentSpace?.id) return;
    setIsLoading(true);
    setError(null);

    const res = await investmentsService.getInvestmentsWithCalculations(currentSpace.id);

    if (res.isTableMissing) {
      setIsTableMissing(true);
      setIsLoading(false);
      return;
    }

    setIsTableMissing(false);
    if (res.error) {
      setError(res.error);
    } else {
      setInvestments(res.investments);
      setSummary(res.summary);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [currentSpace?.id]);

  // Atualiza detalhes do modal se um investimento for alterado
  useEffect(() => {
    if (selectedInvestmentDetails) {
      const updated = investments.find((i) => i.id === selectedInvestmentDetails.id);
      if (updated) {
        setSelectedInvestmentDetails(updated);
      }
    }
  }, [investments]);

  // Lista filtrada em memória
  const filteredInvestments = useMemo(() => {
    return investments.filter((inv) => {
      // Filtro de status
      if (selectedStatusFilter !== 'all' && inv.status !== selectedStatusFilter) {
        return false;
      }
      // Filtro de categoria
      if (selectedCategoryFilter !== 'all' && inv.category !== selectedCategoryFilter) {
        return false;
      }
      // Filtro de busca textual (nome, ticker, instituição)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = inv.name.toLowerCase().includes(q);
        const matchTicker = inv.ticker ? inv.ticker.toLowerCase().includes(q) : false;
        const matchInst = inv.institution ? inv.institution.toLowerCase().includes(q) : false;
        if (!matchName && !matchTicker && !matchInst) return false;
      }
      return true;
    });
  }, [investments, selectedStatusFilter, selectedCategoryFilter, searchQuery]);

  // Handlers CRUD de Investimentos
  const handleSaveInvestment = async (
    input: CreateInvestmentInput | UpdateInvestmentInput,
    isEdit: boolean
  ) => {
    if (!currentSpace?.id) return { success: false, error: 'Espaço não selecionado.' };

    if (isEdit && investmentToEdit) {
      const res = await investmentsService.updateInvestment(
        investmentToEdit.id,
        currentSpace.id,
        input as UpdateInvestmentInput
      );
      if (res.success) {
        await loadData();
        return { success: true };
      }
      return { success: false, error: res.error };
    } else {
      const res = await investmentsService.createInvestment(input as CreateInvestmentInput);
      if (res.success) {
        await loadData();
        return { success: true };
      }
      return { success: false, error: res.error };
    }
  };

  const handleDeleteInvestment = async (invId: string) => {
    if (!currentSpace?.id) return { success: false, error: 'Espaço não selecionado.' };
    const res = await investmentsService.deleteInvestment(invId, currentSpace.id);
    if (res.success) {
      if (selectedInvestmentDetails?.id === invId) {
        setIsDetailsModalOpen(false);
        setSelectedInvestmentDetails(null);
      }
      await loadData();
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  // Handlers CRUD de Valor Atual
  const handleSaveCurrentValue = async (investmentId: string, currentValue: number) => {
    if (!currentSpace?.id) return { success: false, error: 'Espaço não selecionado.' };
    const res = await investmentsService.updateCurrentValue(
      investmentId,
      currentSpace.id,
      currentValue
    );
    if (res.success) {
      await loadData();
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  // Handlers CRUD de Movimentações
  const handleSaveTransaction = async (
    input: CreateInvestmentTransactionInput | UpdateInvestmentTransactionInput,
    isEdit: boolean
  ) => {
    if (!currentSpace?.id) return { success: false, error: 'Espaço não selecionado.' };

    if (isEdit && txToEdit) {
      const res = await investmentsService.updateTransaction(
        txToEdit.id,
        currentSpace.id,
        input as UpdateInvestmentTransactionInput
      );
      if (res.success) {
        await loadData();
        return { success: true };
      }
      return { success: false, error: res.error };
    } else {
      const res = await investmentsService.createTransaction(
        input as CreateInvestmentTransactionInput
      );
      if (res.success) {
        await loadData();
        return { success: true };
      }
      return { success: false, error: res.error };
    }
  };

  const handleDeleteTransaction = async (txId: string) => {
    if (!currentSpace?.id) return { success: false, error: 'Espaço não selecionado.' };
    const res = await investmentsService.deleteTransaction(txId, currentSpace.id);
    if (res.success) {
      await loadData();
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const isPositiveOverallNominal = summary.nominalResultTotal >= 0;

  return (
    <div className="w-full max-w-[1440px] mx-auto space-y-5 animate-in fade-in duration-300">
      {/* Cabeçalho da Tela */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2E8E4] dark:border-[#2E3532]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#202724] dark:text-[#F4F4F5] tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-7 h-7 text-[#075C45] dark:text-[#78D9A6]" />
            <span>Investimentos</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#5E6963] dark:text-[#95A39B] mt-0.5">
            Acompanhe sua carteira e seus aportes em um só lugar.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setInvestmentToEdit(null);
            setIsInvestmentModalOpen(true);
          }}
          className="gap-2 text-xs sm:text-sm font-bold cursor-pointer self-start sm:self-auto py-2.5 px-4 rounded-xl shadow-xs"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Novo investimento</span>
        </Button>
      </div>

      {/* Caso as tabelas ainda não existam no Supabase */}
      {isTableMissing && (
        <Card className="border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs">
          <CardContent className="p-4 sm:p-5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Tabela de Investimentos pendente no Supabase
              </h4>
              <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
                O arquivo de migration <code>supabase/migrations/20260918_create_investments.sql</code> foi gerado. Aplique a migration no seu projeto do Supabase para ativar o banco de dados.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card de Resumo da Carteira (Totalizadores Consolidados das Posições Ativas) */}
      {!isTableMissing && (
        <Card className="border-[#E2E8E4] dark:border-[#2E3532] bg-white dark:bg-[#1C221F] shadow-xs overflow-hidden">
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8E4] dark:border-[#2E3532]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#075C45] dark:text-[#78D9A6] flex items-center gap-1.5">
                <PieChart className="w-4 h-4" /> Resumo da Carteira (Ativos)
              </span>
              <span className="text-xs text-[#5E6963] dark:text-[#95A39B]">
                {summary.activeCount} {summary.activeCount === 1 ? 'posição ativa' : 'posições ativas'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Patrimônio Atual Total */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#EBECEE]/70 via-white to-[#EBECEE]/40 dark:from-[#1E2220] dark:via-[#232725] dark:to-[#1E2220] border-2 border-[#16A66A]/40 dark:border-[#16A66A]/30 space-y-1 shadow-2xs">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5E6963] dark:text-[#95A39B]">
                  Patrimônio Atual Total
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold font-display text-[#075C45] dark:text-[#78D9A6]">
                  {formatCurrency(summary.currentValueTotal)}
                </div>
                <p className="text-[11px] text-[#5E6963] dark:text-[#95A39B]">
                  Soma do valor de mercado dos ativos em carteira
                </p>
              </div>

              {/* Capital Líquido Aportado Total */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#1C221F] border border-[#E2E8E4] dark:border-[#2E3532] space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5E6963] dark:text-[#95A39B]">
                  Capital Líquido Aportado
                </span>
                <div className="text-xl sm:text-2xl font-bold font-display text-[#202724] dark:text-[#F4F4F5]">
                  {formatCurrency(summary.netContributedTotal)}
                </div>
                <p className="text-[11px] text-[#5E6963] dark:text-[#95A39B]">
                  Total de Aportes (-) Total de Resgates
                </p>
              </div>

              {/* Resultado Nominal Total */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#1C221F] border border-[#E2E8E4] dark:border-[#2E3532] space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5E6963] dark:text-[#95A39B]">
                  Resultado Nominal Total
                </span>
                <div
                  className={`text-xl sm:text-2xl font-bold font-display ${
                    isPositiveOverallNominal
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {isPositiveOverallNominal ? '+' : ''}
                  {formatCurrency(summary.nominalResultTotal)}
                </div>
                <p className="text-[11px] text-[#5E6963] dark:text-[#95A39B]">
                  Ganho / Perda nominal sobre o capital aplicado
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Filtro por Status em Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#EBECEE] dark:bg-[#181B1A] rounded-2xl border border-[#E2E8E4] dark:border-[#2E3532] overflow-x-auto">
          <button
            type="button"
            onClick={() => setSelectedStatusFilter('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedStatusFilter === 'active'
                ? 'bg-white dark:bg-[#232725] text-[#075C45] dark:text-[#78D9A6] shadow-xs'
                : 'text-[#5E6963] dark:text-[#95A39B] hover:text-[#202724] dark:hover:text-[#F4F4F5]'
            }`}
          >
            Ativos ({summary.activeCount})
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusFilter('closed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedStatusFilter === 'closed'
                ? 'bg-white dark:bg-[#232725] text-[#075C45] dark:text-[#78D9A6] shadow-xs'
                : 'text-[#5E6963] dark:text-[#95A39B] hover:text-[#202724] dark:hover:text-[#F4F4F5]'
            }`}
          >
            Encerrados ({summary.closedCount})
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusFilter('archived')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedStatusFilter === 'archived'
                ? 'bg-white dark:bg-[#232725] text-[#075C45] dark:text-[#78D9A6] shadow-xs'
                : 'text-[#5E6963] dark:text-[#95A39B] hover:text-[#202724] dark:hover:text-[#F4F4F5]'
            }`}
          >
            Arquivados ({summary.archivedCount})
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedStatusFilter === 'all'
                ? 'bg-white dark:bg-[#232725] text-[#075C45] dark:text-[#78D9A6] shadow-xs'
                : 'text-[#5E6963] dark:text-[#95A39B] hover:text-[#202724] dark:hover:text-[#F4F4F5]'
            }`}
          >
            Todos ({investments.length})
          </button>
        </div>

        {/* Busca e Categoria */}
        <div className="flex items-center gap-2 flex-1 md:max-w-md">
          {/* Campo de Busca */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5E6963] dark:text-[#95A39B]" />
            <input
              type="text"
              placeholder="Buscar por nome, ticker ou instituição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#E2E8E4] dark:border-[#2E3532] bg-white dark:bg-[#1C221F] text-xs text-[#202724] dark:text-[#F4F4F5] focus:outline-none focus:ring-2 focus:ring-[#075C45] dark:focus:ring-[#16A66A]"
            />
          </div>

          {/* Filtro por Categoria */}
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#E2E8E4] dark:border-[#2E3532] bg-white dark:bg-[#1C221F] text-xs font-medium text-[#202724] dark:text-[#F4F4F5] focus:outline-none focus:ring-2 focus:ring-[#075C45] dark:focus:ring-[#16A66A] cursor-pointer"
          >
            <option value="all">Todas as categorias</option>
            {INVESTMENT_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Estado de Carregamento */}
      {isLoading && (
        <div className="py-12 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#075C45] dark:border-[#78D9A6] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-[#5E6963] dark:text-[#95A39B]">
            Carregando sua carteira de investimentos...
          </p>
        </div>
      )}

      {/* Grid de Investimentos */}
      {!isLoading && !isTableMissing && (
        <>
          {filteredInvestments.length === 0 ? (
            <Card className="border-[#E2E8E4] dark:border-[#2E3532] bg-white dark:bg-[#1C221F] shadow-xs p-8 text-center">
              <div className="max-w-md mx-auto space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#075C45]/10 text-[#075C45] dark:bg-[#16A66A]/20 dark:text-[#78D9A6] flex items-center justify-center mx-auto">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#202724] dark:text-[#F4F4F5] font-display">
                  {investments.length === 0
                    ? 'Você ainda não cadastrou investimentos.'
                    : 'Nenhum investimento encontrado.'}
                </h3>
                <p className="text-xs text-[#5E6963] dark:text-[#95A39B]">
                  {investments.length === 0
                    ? 'Adicione seu primeiro investimento para começar a acompanhar sua carteira.'
                    : 'Tente alterar os termos de busca ou remover os filtros aplicados.'}
                </p>

                {investments.length === 0 && (
                  <Button
                    variant="primary"
                    onClick={() => {
                      setInvestmentToEdit(null);
                      setIsInvestmentModalOpen(true);
                    }}
                    className="gap-2 text-xs font-bold cursor-pointer mt-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar primeiro investimento</span>
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInvestments.map((inv) => (
                <InvestmentCard
                  key={inv.id}
                  investment={inv}
                  onViewDetails={(i) => {
                    setSelectedInvestmentDetails(i);
                    setIsDetailsModalOpen(true);
                  }}
                  onEdit={(i) => {
                    setInvestmentToEdit(i);
                    setIsInvestmentModalOpen(true);
                  }}
                  onUpdateValue={(i) => {
                    setActiveInvestmentForValue(i);
                    setIsUpdateValueModalOpen(true);
                  }}
                  onAddTransaction={(i, type) => {
                    setActiveInvestmentForTx(i);
                    setTxToEdit(null);
                    setDefaultTxType(type);
                    setIsTransactionModalOpen(true);
                  }}
                  onDelete={handleDeleteInvestment}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal Criar / Editar Investimento */}
      <InvestmentModal
        isOpen={isInvestmentModalOpen}
        onClose={() => setIsInvestmentModalOpen(false)}
        onSave={handleSaveInvestment}
        investmentToEdit={investmentToEdit}
        spaceId={currentSpace?.id || ''}
      />

      {/* Modal Registrar / Editar Movimentação (Aporte ou Resgate) */}
      {activeInvestmentForTx && (
        <InvestmentTransactionModal
          isOpen={isTransactionModalOpen}
          onClose={() => setIsTransactionModalOpen(false)}
          onSave={handleSaveTransaction}
          investment={activeInvestmentForTx}
          transactionToEdit={txToEdit}
          defaultType={defaultTxType}
          spaceId={currentSpace?.id || ''}
        />
      )}

      {/* Modal Atualizar Valor Atual de Mercado */}
      <UpdateCurrentValueModal
        isOpen={isUpdateValueModalOpen}
        onClose={() => setIsUpdateValueModalOpen(false)}
        onSave={handleSaveCurrentValue}
        investment={activeInvestmentForValue}
      />

      {/* Modal de Detalhes do Investimento */}
      <InvestmentDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        investment={selectedInvestmentDetails}
        onOpenAddTransaction={(type) => {
          if (selectedInvestmentDetails) {
            setActiveInvestmentForTx(selectedInvestmentDetails);
            setTxToEdit(null);
            setDefaultTxType(type);
            setIsTransactionModalOpen(true);
          }
        }}
        onOpenUpdateValue={() => {
          if (selectedInvestmentDetails) {
            setActiveInvestmentForValue(selectedInvestmentDetails);
            setIsUpdateValueModalOpen(true);
          }
        }}
        onOpenEditInvestment={() => {
          if (selectedInvestmentDetails) {
            setInvestmentToEdit(selectedInvestmentDetails);
            setIsInvestmentModalOpen(true);
          }
        }}
        onEditTransaction={(tx) => {
          if (selectedInvestmentDetails) {
            setActiveInvestmentForTx(selectedInvestmentDetails);
            setTxToEdit(tx);
            setIsTransactionModalOpen(true);
          }
        }}
        onDeleteTransaction={handleDeleteTransaction}
      />
    </div>
  );
}
