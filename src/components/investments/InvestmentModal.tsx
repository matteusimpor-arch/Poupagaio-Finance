import React, { useState, useEffect } from 'react';
import {
  Investment,
  InvestmentCategory,
  InvestmentStatus,
  CreateInvestmentInput,
  UpdateInvestmentInput,
} from '../../types';
import { INVESTMENT_CATEGORIES } from '../../lib/services/investments';
import { X, TrendingUp, DollarSign, Building2, Tag, FileText } from 'lucide-react';
import { Button } from '../ui/button';

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    input: CreateInvestmentInput | UpdateInvestmentInput,
    isEdit: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  investmentToEdit?: Investment | null;
  spaceId: string;
}

export function InvestmentModal({
  isOpen,
  onClose,
  onSave,
  investmentToEdit,
  spaceId,
}: InvestmentModalProps) {
  const isEdit = Boolean(investmentToEdit);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<InvestmentCategory>('fixed_income');
  const [institution, setInstitution] = useState('');
  const [ticker, setTicker] = useState('');
  const [currentValue, setCurrentValue] = useState<string>('0');
  const [status, setStatus] = useState<InvestmentStatus>('active');
  const [notes, setNotes] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (investmentToEdit) {
      setName(investmentToEdit.name || '');
      setCategory(investmentToEdit.category || 'fixed_income');
      setInstitution(investmentToEdit.institution || '');
      setTicker(investmentToEdit.ticker || '');
      setCurrentValue(
        investmentToEdit.current_value !== undefined ? String(investmentToEdit.current_value) : '0'
      );
      setStatus(investmentToEdit.status || 'active');
      setNotes(investmentToEdit.notes || '');
    } else {
      setName('');
      setCategory('fixed_income');
      setInstitution('');
      setTicker('');
      setCurrentValue('0');
      setStatus('active');
      setNotes('');
    }
    setError(null);
  }, [investmentToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome do investimento é obrigatório.');
      return;
    }

    const numericVal = parseFloat(currentValue.replace(',', '.'));
    if (isNaN(numericVal) || numericVal < 0) {
      setError('Informe um valor atual válido (maior ou igual a 0).');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isEdit) {
        const updateInput: UpdateInvestmentInput = {
          name: name.trim(),
          category,
          institution: institution.trim() || null,
          ticker: ticker.trim().toUpperCase() || null,
          current_value: numericVal,
          status,
          notes: notes.trim() || null,
        };
        const res = await onSave(updateInput, true);
        if (!res.success) {
          setError(res.error || 'Erro ao atualizar investimento.');
          setIsLoading(false);
          return;
        }
      } else {
        const createInput: CreateInvestmentInput = {
          space_id: spaceId,
          name: name.trim(),
          category,
          institution: institution.trim() || null,
          ticker: ticker.trim().toUpperCase() || null,
          current_value: numericVal,
          status,
          notes: notes.trim() || null,
        };
        const res = await onSave(createInput, false);
        if (!res.success) {
          setError(res.error || 'Erro ao criar investimento.');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-[#1C221F] border border-[#E2E8E4] dark:border-[#2E3532] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8E4] dark:border-[#2E3532] bg-[#F7F9F8] dark:bg-[#181D1A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#075C45]/10 text-[#075C45] dark:bg-[#16A66A]/20 dark:text-[#78D9A6] flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#202724] dark:text-[#F4F4F5] font-display">
                {isEdit ? 'Editar Investimento' : 'Novo Investimento'}
              </h3>
              <p className="text-xs text-[#5E6963] dark:text-[#95A39B]">
                {isEdit ? 'Atualize as informações do seu ativo' : 'Cadastre um ativo para acompanhar sua carteira'}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 rounded-xl">
              {error}
            </div>
          )}

          {/* Nome */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#202724] dark:text-[#F4F4F5] flex items-center gap-1.5">
              <span>Nome do Ativo / Investimento</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Tesouro Selic 2029, PETR4, CDB X"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8E4] dark:border-[#2E3532] bg-white dark:bg-[#232725] text-sm text-[#202724] dark:text-[#F4F4F5] focus:outline-none focus:ring-2 focus:ring-[#075C45] dark:focus:ring-[#16A66A]"
            />
          </div>

          {/* Grid Categoria + Ticker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Categoria */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#202724] dark:text-[#F4F4F5]">
                Categoria *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as InvestmentCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8E4] dark:border-[#2E3532] bg-white dark:bg-[#232725] text-sm text-[#202724] dark:text-[#F4F4F5] focus:outline-none focus:ring-2 focus:ring-[#075C45] dark:focus:ring-[#16A66A]"
              >
                {INVESTMENT_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Ticker / Código */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#202724] dark:text-[#F4F4F5]">
                Ticker / Código (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: PETR4, HGLG11"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8E4] dark:border-[#2E3532] bg-white dark:bg-[#232725] text-sm uppercase text-[#202724] dark:text-[#F4F4F5] focus:outline-none focus:ring-2 focus:ring-[#075C45] dark:focus:ring-[#16A66A]"
              />
            </div>
          </div>

          {/* Grid Instituição + Valor Atual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Instituição */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#202724] dark:text-[#F4F4F5]">
                Instituição / Corretora
              </label>
              <input
                type="text"
                placeholder="Ex: XP, Nubank,BTG"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8E4] dark:border-[#2E3532] bg-white dark:bg-[#232725] text-sm text-[#202724] dark:text-[#F4F4F5] focus:outline-none focus:ring-2 focus:ring-[#075C45] dark:focus:ring-[#16A66A]"
              />
            </div>

            {/* Valor Atual */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#202724] dark:text-[#F4F4F5]">
                Valor Atual (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8E4] dark:border-[#2E3532] bg-white dark:bg-[#232725] text-sm text-[#202724] dark:text-[#F4F4F5] focus:outline-none focus:ring-2 focus:ring-[#075C45] dark:focus:ring-[#16A66A]"
              />
            </div>
          </div>

          {/* Status (Apenas no Editar ou opcional) */}
          {isEdit && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#202724] dark:text-[#F4F4F5]">
                Status da posição
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as InvestmentStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8E4] dark:border-[#2E3532] bg-white dark:bg-[#232725] text-sm text-[#202724] dark:text-[#F4F4F5] focus:outline-none focus:ring-2 focus:ring-[#075C45] dark:focus:ring-[#16A66A]"
              >
                <option value="active">Ativo (Em carteira)</option>
                <option value="closed">Encerrado (Posição zerada)</option>
                <option value="archived">Arquivado</option>
              </select>
            </div>
          )}

          {/* Observações */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#202724] dark:text-[#F4F4F5]">
              Observações (Opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Detalhes adicionais, estratégia ou taxa de rentabilidade..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8E4] dark:border-[#2E3532] bg-white dark:bg-[#232725] text-sm text-[#202724] dark:text-[#F4F4F5] focus:outline-none focus:ring-2 focus:ring-[#075C45] dark:focus:ring-[#16A66A]"
            />
          </div>

          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300">
            <strong>Dica:</strong> Cadastrar um investimento apenas registra a posição em carteira. Para registrar aportes ou resgates históricos, utilize o botão "+ Registrar aporte" após a criação.
          </div>

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
              {isLoading ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Criar Investimento'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
