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
  const chartHeight = 160;
  const chartPaddingTop = 20;
  const chartPaddingBottom = 24;
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
        <div className="min-w-[500px] w-full relative" style={{ height: `${chartHeight + 20}px` }}>
          
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
                  <span className="w-10 text-[10px] text-[#5E6963]/75 font-medium text-right pr-2">
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
            viewBox={`0 0 1000 ${chartHeight + 20}`}
            preserveAspectRatio="none"
          >
            {/* 1. DRAW SALDO LINE */}
            {data.length > 1 && (
              <polyline
                fill="none"
                stroke="#F2B807"
                strokeWidth="3"
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
          <div className="absolute inset-0 left-12 right-4 flex justify-between items-end pb-6">
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
                      className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs transition-all ${
                        isCurrent ? 'bg-[#02402E] ring-2 ring-[#F2B807]' : 'bg-[#F2B807]'
                      }`}
                    />
                  </div>

                  {/* CURRENT MONTH SALDO BADGE (Displayed like in reference image) */}
                  {isCurrent && (
                    <div
                      className="absolute z-30 pointer-events-none transform -translate-y-1/2 right-2 sm:right-4"
                      style={{ top: `${Math.max(20, balanceY)}px` }}
                    >
                      <div className="bg-[#02402E] text-white px-2.5 py-1 rounded-lg shadow-md border border-[#03543D] text-[10px] font-bold text-center leading-tight">
                        <span className="text-[#F2B807] block text-[9px] uppercase tracking-wider">Saldo</span>
                        <span>{formatCurrency(point.balance)}</span>
                      </div>
                    </div>
                  )}

                  {/* BARS: Entradas & Despesas */}
                  <div className="flex items-end gap-1 sm:gap-2 mb-1 z-10">
                    {/* Entradas Bar (Mint/Emerald) */}
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-bold text-[#00B074] mb-0.5 opacity-90 leading-none">
                        {point.entries > 0 ? formatBarTopLabel(point.entries) : ''}
                      </span>
                      <div
                        className="w-4 sm:w-6 md:w-8 bg-[#00B074] rounded-t-md transition-all duration-300 group-hover:brightness-110 shadow-2xs"
                        style={{ height: `${entriesHeight}px` }}
                      />
                    </div>

                    {/* Despesas Bar (Rose/Coral) */}
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-bold text-[#FF3B6F] mb-0.5 opacity-90 leading-none">
                        {point.expenses > 0 ? formatBarTopLabel(point.expenses) : ''}
                      </span>
                      <div
                        className="w-4 sm:w-6 md:w-8 bg-[#FF3B6F] rounded-t-md transition-all duration-300 group-hover:brightness-110 shadow-2xs"
                        style={{ height: `${expensesHeight}px` }}
                      />
                    </div>
                  </div>

                  {/* X-AXIS MONTH LABEL */}
                  <span
                    className={`text-xs font-bold mt-1 transition-colors ${
                      isCurrent
                        ? 'text-[#02402E] underline decoration-2 decoration-[#F2B807] underline-offset-4'
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
