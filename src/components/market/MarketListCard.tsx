import React, { useState } from 'react';
import {
  ShoppingListWithItems,
  ShoppingListItem,
  ShoppingListStatus,
  CreateShoppingListItemInput,
} from '../../types';
import { formatCurrency, formatDateBR } from '../../lib/formatters';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import {
  Check,
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  Archive,
  RotateCcw,
  Calendar,
  FileText,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  MoreVertical,
  CheckSquare,
  Square,
  Tag,
  DollarSign,
} from 'lucide-react';

interface MarketListCardProps {
  key?: React.Key;
  list: ShoppingListWithItems;
  onToggleItem: (item: ShoppingListItem, isChecked: boolean) => void;
  onQuickAddItem: (input: CreateShoppingListItemInput) => Promise<{ success: boolean; error?: string }>;
  onOpenAddItemModal: (list: ShoppingListWithItems) => void;
  onEditItem: (item: ShoppingListItem) => void;
  onDeleteItem: (item: ShoppingListItem) => void;
  onEditList: (list: ShoppingListWithItems) => void;
  onDeleteList: (list: ShoppingListWithItems) => void;
  onArchiveList: (list: ShoppingListWithItems) => void;
  onReopenList: (list: ShoppingListWithItems) => void;
  onCompleteList: (list: ShoppingListWithItems) => void;
  onUpdateItemActualPrice: (item: ShoppingListItem, newPrice: number) => void;
}

export function MarketListCard({
  list,
  onToggleItem,
  onQuickAddItem,
  onOpenAddItemModal,
  onEditItem,
  onDeleteItem,
  onEditList,
  onDeleteList,
  onArchiveList,
  onReopenList,
  onCompleteList,
  onUpdateItemActualPrice,
}: MarketListCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [quickItemName, setQuickItemName] = useState('');
  const [quickItemQty, setQuickItemQty] = useState('1');
  const [isAddingQuick, setIsAddingQuick] = useState(false);
  const [editingPriceItemId, setEditingPriceItemId] = useState<string | null>(null);
  const [tempPriceValue, setTempPriceValue] = useState('');

  const isCompleted = list.status === 'completed';
  const isArchived = list.status === 'archived';
  const isActive = list.status === 'active';

  const { totalEstimated, totalActual, totalItems, checkedItems } = list.totals;
  const progressPercent = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = quickItemName.trim();
    if (!name) return;
    const qty = parseFloat(quickItemQty.replace(',', '.')) || 1;

    setIsAddingQuick(true);
    const res = await onQuickAddItem({
      shopping_list_id: list.id,
      space_id: list.space_id,
      name,
      quantity: Math.max(0.01, qty),
      unit: 'un',
      is_checked: false,
    });
    setIsAddingQuick(false);

    if (res.success) {
      setQuickItemName('');
      setQuickItemQty('1');
    }
  };

  const handleSavePrice = (item: ShoppingListItem) => {
    const val = parseFloat(tempPriceValue.replace(',', '.'));
    if (!isNaN(val) && val >= 0) {
      onUpdateItemActualPrice(item, val);
    }
    setEditingPriceItemId(null);
  };

  return (
    <Card
      id={`market-list-card-${list.id}`}
      className="bg-white dark:bg-[#1E2220] border-neutral-200 dark:border-neutral-800 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      <CardContent className="p-0">
        {/* Cabeçalho da Lista */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 dark:border-neutral-800/80">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <h3 className="font-semibold text-base sm:text-lg text-neutral-900 dark:text-neutral-100 truncate">
                  {list.name}
                </h3>

                {/* Status Badges */}
                {isActive && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                    Ativa
                  </span>
                )}
                {isCompleted && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
                    <CheckCircle2 className="w-3 h-3" />
                    Concluída
                  </span>
                )}
                {isArchived && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                    <Archive className="w-3 h-3" />
                    Arquivada
                  </span>
                )}
              </div>

              {/* Informações adicionais (Data, notas) */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
                {list.shopping_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span>Prevista: {formatDateBR(list.shopping_date)}</span>
                  </div>
                )}
                {list.completed_at && (
                  <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Finalizada em {formatDateBR(list.completed_at.split('T')[0])}</span>
                  </div>
                )}
                {list.notes && (
                  <div className="flex items-center gap-1 text-neutral-600 dark:text-neutral-300">
                    <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="truncate max-w-xs">{list.notes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Menu de Ações da Lista */}
            <div className="flex items-center gap-1 shrink-0 relative">
              {isActive && (
                <Button
                  id={`btn-complete-list-${list.id}`}
                  variant="default"
                  size="sm"
                  onClick={() => onCompleteList(list)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3 rounded-lg shadow-2xs font-medium"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Finalizar compra
                </Button>
              )}

              {/* Botão de Menu Dropdown */}
              <div className="relative">
                <Button
                  id={`btn-menu-list-${list.id}`}
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMenu(!showMenu)}
                  className="h-8 w-8 p-0 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>

                {showMenu && (
                  <div
                    className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-[#1E2220] rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-30 animate-in fade-in zoom-in-95 duration-150"
                    onClick={() => setShowMenu(false)}
                  >
                    {isActive && (
                      <>
                        <button
                          id={`btn-add-item-modal-${list.id}`}
                          onClick={() => onOpenAddItemModal(list)}
                          className="w-full text-left px-3 py-2 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                        >
                          <Plus className="w-3.5 h-3.5 text-orange-600" />
                          Adicionar item detalhado
                        </button>
                        <button
                          id={`btn-edit-list-${list.id}`}
                          onClick={() => onEditList(list)}
                          className="w-full text-left px-3 py-2 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-neutral-500" />
                          Editar dados da lista
                        </button>
                        <button
                          id={`btn-archive-list-${list.id}`}
                          onClick={() => onArchiveList(list)}
                          className="w-full text-left px-3 py-2 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                        >
                          <Archive className="w-3.5 h-3.5 text-neutral-500" />
                          Arquivar lista
                        </button>
                      </>
                    )}

                    {(isCompleted || isArchived) && (
                      <button
                        id={`btn-reopen-list-${list.id}`}
                        onClick={() => onReopenList(list)}
                        className="w-full text-left px-3 py-2 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                        Reabrir lista
                      </button>
                    )}

                    {isCompleted && (
                      <button
                        id={`btn-archive-completed-${list.id}`}
                        onClick={() => onArchiveList(list)}
                        className="w-full text-left px-3 py-2 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                      >
                        <Archive className="w-3.5 h-3.5 text-neutral-500" />
                        Arquivar lista
                      </button>
                    )}

                    <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1" />

                    <button
                      id={`btn-delete-list-${list.id}`}
                      onClick={() => onDeleteList(list)}
                      className="w-full text-left px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Excluir lista
                    </button>
                  </div>
                )}
              </div>

              {/* Botão de Expandir/Recolher Itens */}
              <Button
                id={`btn-toggle-expand-${list.id}`}
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8 p-0 rounded-lg text-neutral-500"
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Barra de Totais e Progresso */}
          <div className="mt-4 pt-3.5 border-t border-neutral-100 dark:border-neutral-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-100 dark:border-neutral-800">
              <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Itens no Carrinho
              </span>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5">
                {checkedItems} <span className="text-xs font-normal text-neutral-500">de {totalItems}</span>
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-100 dark:border-neutral-800">
              <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Total Estimado
              </span>
              <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mt-0.5">
                {formatCurrency(totalEstimated)}
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
              <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Total Real
              </span>
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                {formatCurrency(totalActual)}
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-100 dark:border-neutral-800 flex flex-col justify-center">
              <div className="flex items-center justify-between text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                <span>Progresso</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Corpo: Lista de Itens (Expandível) */}
        {isExpanded && (
          <div className="p-4 sm:p-5 space-y-3">
            {/* Adicionar Item Rápido (Somente quando ativa) */}
            {isActive && (
              <form onSubmit={handleQuickAdd} className="flex items-center gap-2 pb-2">
                <input
                  id={`input-quick-item-name-${list.id}`}
                  type="text"
                  placeholder="+ Adicionar item rápido..."
                  value={quickItemName}
                  onChange={(e) => setQuickItemName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors"
                />
                <input
                  id={`input-quick-item-qty-${list.id}`}
                  type="number"
                  min="0.01"
                  step="any"
                  placeholder="Qtd"
                  value={quickItemQty}
                  onChange={(e) => setQuickItemQty(e.target.value)}
                  className="w-16 px-2.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-xs text-center focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors"
                />
                <Button
                  id={`btn-quick-add-${list.id}`}
                  type="submit"
                  size="sm"
                  disabled={isAddingQuick || !quickItemName.trim()}
                  className="h-8.5 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Adicionar
                </Button>
                <Button
                  id={`btn-open-item-modal-${list.id}`}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenAddItemModal(list)}
                  className="h-8.5 px-2.5 rounded-xl text-neutral-600 dark:text-neutral-300 text-xs font-medium shrink-0"
                  title="Abrir modal com categoria, unidade e preços estimados"
                >
                  Detalhado
                </Button>
              </form>
            )}

            {/* Aviso quando lista está concluída / leitura */}
            {isCompleted && (
              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-700 dark:text-blue-300 flex items-center justify-between">
                <span>Esta compra foi finalizada. Os itens estão em modo histórico.</span>
                <button
                  id={`btn-reopen-list-inline-${list.id}`}
                  onClick={() => onReopenList(list)}
                  className="text-xs font-medium text-blue-800 dark:text-blue-200 underline hover:no-underline ml-2 shrink-0"
                >
                  Reabrir lista
                </button>
              </div>
            )}

            {/* Lista vazia de itens */}
            {list.items.length === 0 ? (
              <div className="py-6 text-center text-xs text-neutral-400 dark:text-neutral-500">
                Nenhum item adicionado nesta lista ainda.
              </div>
            ) : (
              <div className="space-y-1.5">
                {list.items.map((item) => {
                  const hasEst =
                    item.estimated_unit_price !== null && item.estimated_unit_price !== undefined;
                  const hasAct =
                    item.actual_unit_price !== null && item.actual_unit_price !== undefined;
                  const isEditingPrice = editingPriceItemId === item.id;

                  return (
                    <div
                      key={item.id}
                      id={`market-item-row-${item.id}`}
                      className={`group flex items-center justify-between gap-2 p-2.5 rounded-xl transition-colors ${
                        item.is_checked
                          ? 'bg-neutral-50/80 dark:bg-neutral-900/40 opacity-75'
                          : 'bg-white dark:bg-neutral-900/90 hover:bg-neutral-50 dark:hover:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/80'
                      }`}
                    >
                      {/* Checkbox Touch Target Otimizado para Mobile (min 44px) */}
                      <button
                        id={`btn-toggle-item-${item.id}`}
                        type="button"
                        onClick={() => onToggleItem(item, !item.is_checked)}
                        className="w-9 h-9 -ml-1 rounded-lg flex items-center justify-center text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0"
                        title={item.is_checked ? 'Desmarcar' : 'Marcar como comprado'}
                      >
                        {item.is_checked ? (
                          <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Square className="w-5 h-5 text-neutral-400 hover:text-emerald-500" />
                        )}
                      </button>

                      {/* Informações do Item */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-medium truncate ${
                              item.is_checked
                                ? 'line-through text-neutral-400 dark:text-neutral-500'
                                : 'text-neutral-800 dark:text-neutral-200'
                            }`}
                          >
                            {item.name}
                          </span>
                          <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 shrink-0">
                            {item.quantity} {item.unit || 'un'}
                          </span>
                        </div>

                        {/* Metadados: Categoria, Preços, Notas */}
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                          {item.category && item.category !== 'Geral' && (
                            <span>{item.category}</span>
                          )}
                          {hasEst && (
                            <span>Est: {formatCurrency(item.estimated_unit_price!)}/{item.unit || 'un'}</span>
                          )}
                          {item.notes && <span className="italic">"{item.notes}"</span>}
                        </div>
                      </div>

                      {/* Preço Real e Ações */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Editor Rápido de Preço Real */}
                        {isEditingPrice ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={tempPriceValue}
                              onChange={(e) => setTempPriceValue(e.target.value)}
                              placeholder="0,00"
                              autoFocus
                              className="w-16 px-1.5 py-1 text-xs rounded-lg border border-emerald-500 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-right focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleSavePrice(item)}
                              className="p-1 rounded-md bg-emerald-600 text-white text-xs hover:bg-emerald-700"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (isCompleted) return;
                              setEditingPriceItemId(item.id);
                              setTempPriceValue(
                                item.actual_unit_price !== null && item.actual_unit_price !== undefined
                                  ? String(item.actual_unit_price)
                                  : ''
                              );
                            }}
                            className={`text-xs font-semibold px-2 py-1 rounded-lg transition-colors ${
                              hasAct
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                                : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                            }`}
                            title="Clique para editar o preço real unitário pago"
                          >
                            {hasAct ? formatCurrency(item.actual_unit_price!) : '+ Preço real'}
                          </button>
                        )}

                        {/* Botões de Ação do Item */}
                        {!isCompleted && (
                          <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              id={`btn-edit-item-${item.id}`}
                              type="button"
                              onClick={() => onEditItem(item)}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                              title="Editar item detalhado"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`btn-delete-item-${item.id}`}
                              type="button"
                              onClick={() => onDeleteItem(item)}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Remover item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
