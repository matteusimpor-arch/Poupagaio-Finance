import React, { useState, useEffect } from 'react';
import { Wallet, AlertTriangle } from 'lucide-react';
import { Reserve } from '@/src/types';
import { reservesService } from '@/src/lib/services/reserves';
import { formatCurrency } from '@/src/lib/formatters';

interface MoneyOriginSelectorProps {
  spaceId: string;
  year?: number;
  month?: number;
  requiredAmount: number;
  onChange: (
    sources: Array<{ reserve_id: string | null; amount: number; is_free_balance: boolean }>,
    isValid: boolean,
    error?: string
  ) => void;
}

export function MoneyOriginSelector({
  spaceId,
  year,
  month,
  requiredAmount,
  onChange,
}: MoneyOriginSelectorProps) {
  const [loading, setLoading] = useState(true);
  const [freeBalance, setFreeBalance] = useState(0);
  const [reserves, setReserves] = useState<Reserve[]>([]);
  const [originType, setOriginType] = useState<'free_balance' | 'reserve'>('free_balance');
  const [selectedReserveId, setSelectedReserveId] = useState<string | null>(null);
  const [allowSplit, setAllowSplit] = useState(false);

  const now = new Date();
  const y = year || now.getFullYear();
  const m = month || now.getMonth() + 1;

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      const res = await reservesService.getReservesWithSummary(spaceId, y, m);
      if (isMounted) {
        setFreeBalance(res.summary.freeBalance || 0);
        setReserves(res.reserves || []);
        if (res.reserves.length > 0 && !selectedReserveId) {
          setSelectedReserveId(res.reserves[0].id);
        }
        setLoading(false);
      }
    }
    if (spaceId) {
      loadData();
    }
    return () => {
      isMounted = false;
    };
  }, [spaceId, y, m]);

  const selectedReserve = reserves.find((r) => r.id === selectedReserveId);
  const reserveBalance = Number(selectedReserve?.current_balance) || 0;
  const isReserveInsufficient = originType === 'reserve' && reserveBalance < requiredAmount;
  const shortfall = Math.max(0, requiredAmount - reserveBalance);

  useEffect(() => {
    if (requiredAmount <= 0 || isNaN(requiredAmount)) {
      onChange([], false, 'Informe um valor válido.');
      return;
    }

    if (originType === 'free_balance') {
      if (freeBalance < requiredAmount) {
        onChange(
          [],
          false,
          `Saldo Livre insuficiente (${formatCurrency(freeBalance)} disponíveis para um valor de ${formatCurrency(requiredAmount)}).`
        );
      } else {
        onChange([{ reserve_id: null, amount: requiredAmount, is_free_balance: true }], true);
      }
    } else if (originType === 'reserve') {
      if (!selectedReserveId) {
        onChange([], false, 'Selecione uma reserva válida.');
        return;
      }
      if (isReserveInsufficient) {
        if (allowSplit) {
          if (freeBalance < shortfall) {
            onChange(
              [],
              false,
              `Saldo Livre insuficiente para completar o restante (${formatCurrency(freeBalance)} disponíveis, necessários ${formatCurrency(shortfall)}).`
            );
          } else {
            onChange(
              [
                { reserve_id: selectedReserveId, amount: reserveBalance, is_free_balance: false },
                { reserve_id: null, amount: shortfall, is_free_balance: true },
              ],
              true
            );
          }
        } else {
          onChange([], false, `Saldo insuficiente na reserva "${selectedReserve?.name || ''}".`);
        }
      } else {
        onChange([{ reserve_id: selectedReserveId, amount: requiredAmount, is_free_balance: false }], true);
      }
    }
  }, [originType, selectedReserveId, allowSplit, freeBalance, reserveBalance, requiredAmount, selectedReserve]);

  if (loading) {
    return <div className="py-4 text-center text-xs text-[#5E6963]">Carregando origens financeiras...</div>;
  }

  return (
    <div className="space-y-3">
      <label className="text-xs font-bold uppercase tracking-wider text-[#5E6963] dark:text-[#95A39B] block">
        De onde vem o dinheiro? *
      </label>
      <div className="space-y-2">
        {/* Saldo Livre Option */}
        <label
          onClick={() => {
            setOriginType('free_balance');
            setSelectedReserveId(null);
            setAllowSplit(false);
          }}
          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
            originType === 'free_balance'
              ? 'border-[#16A66A] bg-[#16A66A]/10 text-[#02402E] dark:text-[#78D9A6] shadow-2xs'
              : 'border-[#D2DDD6] dark:border-[#28322C] bg-white dark:bg-[#161B18] hover:bg-black/5 text-[#202724] dark:text-[#F4F4F5]'
          }`}
        >
          <div className="flex items-center gap-3">
            <input
              type="radio"
              name="money_origin"
              checked={originType === 'free_balance'}
              onChange={() => {
                setOriginType('free_balance');
                setSelectedReserveId(null);
                setAllowSplit(false);
              }}
              className="w-4 h-4 text-[#16A66A] accent-[#16A66A]"
            />
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#16A66A]" />
              <span className="font-bold text-xs sm:text-sm">Saldo Livre</span>
            </div>
          </div>
          <span className={`font-extrabold text-xs ${freeBalance < requiredAmount ? 'text-rose-500' : 'text-[#16A66A]'}`}>
            {formatCurrency(freeBalance)} disponíveis
          </span>
        </label>

        {/* Reserves List */}
        {reserves.map((res) => {
          const isSelected = originType === 'reserve' && selectedReserveId === res.id;
          const resBal = Number(res.current_balance) || 0;
          const insufficient = resBal < requiredAmount;
          return (
            <label
              key={res.id}
              onClick={() => {
                setOriginType('reserve');
                setSelectedReserveId(res.id);
                setAllowSplit(false);
              }}
              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'border-[#16A66A] bg-[#16A66A]/10 text-[#02402E] dark:text-[#78D9A6] shadow-2xs'
                  : 'border-[#D2DDD6] dark:border-[#28322C] bg-white dark:bg-[#161B18] hover:bg-black/5 text-[#202724] dark:text-[#F4F4F5]'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="money_origin"
                  checked={isSelected}
                  onChange={() => {
                    setOriginType('reserve');
                    setSelectedReserveId(res.id);
                    setAllowSplit(false);
                  }}
                  className="w-4 h-4 text-[#16A66A] accent-[#16A66A]"
                />
                <div className="flex items-center gap-2">
                  <span className="text-base">{res.icon || '💰'}</span>
                  <div>
                    <span className="font-bold text-xs sm:text-sm">{res.name}</span>
                    {res.category && (
                      <p className="text-[10px] text-[#5E6963] dark:text-[#95A39B]">Categoria: {res.category}</p>
                    )}
                  </div>
                </div>
              </div>
              <span className={`font-extrabold text-xs ${insufficient ? 'text-amber-600 dark:text-amber-400' : 'text-[#02402E] dark:text-[#78D9A6]'}`}>
                {formatCurrency(resBal)}
              </span>
            </label>
          );
        })}
      </div>

      {/* Insufficient balance warning & split option */}
      {isReserveInsufficient && selectedReserve && (
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2.5">
          <div className="flex items-start gap-2 text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold">Saldo insuficiente nesta reserva.</p>
              <p>
                A reserva possui <strong>{formatCurrency(reserveBalance)}</strong> disponíveis e faltam{' '}
                <strong>{formatCurrency(shortfall)}</strong>.
              </p>
            </div>
          </div>
          <div className="pt-1">
            <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-[#161B18] border border-amber-300 dark:border-amber-700 cursor-pointer">
              <input
                type="checkbox"
                checked={allowSplit}
                onChange={(e) => setAllowSplit(e.target.checked)}
                className="w-4 h-4 text-[#16A66A] accent-[#16A66A]"
              />
              <span className="text-xs font-semibold text-[#202724] dark:text-[#F4F4F5]">
                Completar <strong>{formatCurrency(shortfall)}</strong> com Saldo Livre (Pagamento/Aporte Dividido)
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
