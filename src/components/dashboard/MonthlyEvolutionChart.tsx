import React, { useState } from 'react';
import { formatCurrency } from '../../lib/formatters';

export interface MonthlyHistoryPoint {
  monthKey: string; // e.g. "2026-09"
  shortLabel: string; // e.g. "Set"
  fullLabel: string; // e.g. "Setembro 2026"
  entries: number;
  expenses: number;
  balance: number;
  isCurrent: boolean;
}

interface MonthlyEvolutionChartProps {
  data: MonthlyHistoryPoint[];
}

export function MonthlyEvolutionChart({ data }: MonthlyEvolutionChartProps) {
  const [activeTooltipIndex, setActiveTooltipIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-[#5E6963]">
        Sem dados históricos disponíveis
      </div>
    );
  }

  // Calculate dynamic scale
  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.entries, d.expenses, Math.abs(d.balance))),
    1000
  );

  // Round up to clean step (e.g. 2000, 5000, 10000)
  const roughMax = maxVal * 1.25;
  const step = Math.ceil(roughMax / 4 / 500) * 500 || 1000;
  const yAxisMax = step * 4;
  const ySteps = [yAxisMax, step * 3, step * 2, step, 0];

  const formatYLabel = (val: number) => {
    if (val === 0) return '0';
    if (val >= 1000) {
      const k = val / 1000;
      return Number.isInteger(k) ? `${k} mil` : `${k.toFixed(1).replace('.', ',')} mil`;
    }
    return `${val}`;
  };

  const formatBarTopLabel = (val: number) => {
    if (val === 0) return '0';
    if (val >= 1000) {
      const k = (val / 1000).toFixed(1).replace('.', ',');
      return `${k} mil`;
    }
    return `${Math.round(val)}`;
  };

  // Dimensions
  const chartHeight = 96;
  const chartPaddingTop = 14;
  const chartPaddingBottom = 18;
  const usableHeight = chartHeight - chartPaddingTop - chartPaddingBottom;

  const getYPos = (val: number) => {
    const clamped = Math.max(0, Math.min(val, yAxisMax));
    return chartPaddingTop + usableHeight - (clamped / yAxisMax) * usableHeight;
  };

  const activePoint = activeTooltipIndex !== null ? data[activeTooltipIndex] : null;

  return (
    <div className="w-full relative select-none">
      {/* CHART CONTAINER */}
      <div className="w-full overflow-x-auto no-scrollbar">
        <div className="min-w-[420px] w-full relative" style={{ height: `${chartHeight + 14}px` }}>
          
          {/* Y-AXIS GRID LINES & LABELS */}
          <div className="absolute inset-0 left-0 right-0 pointer-events-none">
            {ySteps.map((val) => {
              const topPos = getYPos(val);
              return (
                <div
                  key={val}
                  className="absolute left-0 right-0 flex items-center"
                  style={{ top: `${topPos}px` }}
                >
                  <span className="w-9 text-[9px] text-[#5E6963]/75 font-medium text-right pr-1.5">
                    {formatYLabel(val)}
                  </span>
                  <div className="flex-1 border-b border-[#E8E4D5]/70" />
                </div>
              );
            })}
          </div>

          {/* SVG FOR BARS AND LINE */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox={`0 0 1000 ${chartHeight + 14}`}
            preserveAspectRatio="none"
          >
            {/* 1. DRAW SALDO LINE */}
            {data.length > 1 && (
              <polyline
                fill="none"
                stroke="#F2B807"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={data
                  .map((d, idx) => {
                    const x = 50 + (idx / (data.length - 1)) * 900;
                    const y = getYPos(d.balance);
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />
            )}
          </svg>

          {/* COLUMNS & INTERACTIVE NODES */}
          <div className="absolute inset-0 left-10 right-3 flex justify-between items-end pb-4">
            {data.map((point, idx) => {
              const entriesHeight = Math.max(2, (point.entries / yAxisMax) * usableHeight);
              const expensesHeight = Math.max(2, (point.expenses / yAxisMax) * usableHeight);
              const balanceY = getYPos(point.balance);

              const isCurrent = point.isCurrent;

              return (
                <div
                  key={point.monthKey}
                  className="flex-1 flex flex-col items-center justify-end h-full relative cursor-pointer group"
                  onMouseEnter={() => setActiveTooltipIndex(idx)}
                  onMouseLeave={() => setActiveTooltipIndex(null)}
                  onClick={() => setActiveTooltipIndex(activeTooltipIndex === idx ? null : idx)}
                >
                  {/* Saldo Line Node */}
                  <div
                    className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: '50%',
                      top: `${balanceY}px`,
                    }}
                  >
                    <div
                      className={`w-2.5 h-2.5 rounded-full border border-white shadow-2xs transition-all ${
                        isCurrent ? 'bg-[#02402E] ring-1.5 ring-[#F2B807]' : 'bg-[#F2B807]'
                      }`}
                    />
                  </div>

                  {/* CURRENT MONTH SALDO BADGE (Displayed like in reference image) */}
                  {isCurrent && (
                    <div
                      className="absolute z-30 pointer-events-none transform -translate-y-1/2 right-1 sm:right-2"
                      style={{ top: `${Math.max(12, balanceY)}px` }}
                    >
                      <div className="bg-[#02402E] text-white px-1.5 py-0.5 rounded-md shadow-md border border-[#03543D] text-[9px] font-bold text-center leading-tight">
                        <span className="text-[#F2B807] block text-[8px] uppercase tracking-wider">Saldo</span>
                        <span>{formatCurrency(point.balance)}</span>
                      </div>
                    </div>
                  )}

                  {/* BARS: Entradas & Despesas */}
                  <div className="flex items-end gap-1 sm:gap-1.5 mb-0.5 z-10">
                    {/* Entradas Bar (Mint/Emerald) */}
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] font-bold text-[#00B074] mb-0.5 opacity-90 leading-none">
                        {point.entries > 0 ? formatBarTopLabel(point.entries) : ''}
                      </span>
                      <div
                        className="w-3.5 sm:w-5 md:w-6 bg-[#00B074] rounded-t transition-all duration-300 group-hover:brightness-110 shadow-2xs"
                        style={{ height: `${entriesHeight}px` }}
                      />
                    </div>

                    {/* Despesas Bar (Rose/Coral) */}
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] font-bold text-[#FF3B6F] mb-0.5 opacity-90 leading-none">
                        {point.expenses > 0 ? formatBarTopLabel(point.expenses) : ''}
                      </span>
                      <div
                        className="w-3.5 sm:w-5 md:w-6 bg-[#FF3B6F] rounded-t transition-all duration-300 group-hover:brightness-110 shadow-2xs"
                        style={{ height: `${expensesHeight}px` }}
                      />
                    </div>
                  </div>

                  {/* X-AXIS MONTH LABEL */}
                  <span
                    className={`text-[10px] font-bold mt-0.5 transition-colors ${
                      isCurrent
                        ? 'text-[#02402E] underline decoration-2 decoration-[#F2B807] underline-offset-2'
                        : 'text-[#5E6963]'
                    }`}
                  >
                    {point.shortLabel}
                  </span>
                </div>
              );
            })}
          </div>

          {/* INTERACTIVE HOVER / TAP TOOLTIP */}
          {activePoint && (
            <div
              className="absolute z-40 bg-[#02402E] text-white p-2.5 rounded-xl shadow-xl border border-[#03543D] text-xs pointer-events-none transform -translate-x-1/2 -translate-y-full transition-all duration-150"
              style={{
                left: `${
                  (data.findIndex((d) => d.monthKey === activePoint.monthKey) / (data.length - 1)) * 80 +
                  15
                }%`,
                top: `${getYPos(Math.max(activePoint.entries, activePoint.expenses)) - 10}px`,
              }}
            >
              <p className="font-bold text-[#F2B807] text-[11px] border-b border-white/20 pb-1 mb-1">
                {activePoint.fullLabel}
              </p>
              <div className="space-y-0.5 text-[10px]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-emerald-300">Entradas:</span>
                  <span className="font-bold">{formatCurrency(activePoint.entries)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-rose-300">Despesas:</span>
                  <span className="font-bold">{formatCurrency(activePoint.expenses)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 pt-0.5 border-t border-white/10">
                  <span className="text-[#F2B807]">Saldo:</span>
                  <span className="font-bold text-white">{formatCurrency(activePoint.balance)}</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
