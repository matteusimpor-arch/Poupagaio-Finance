import React from 'react';
import { formatCurrency } from '../../lib/formatters';

interface ExpensesDonutChartProps {
  totalAmount: number;
  fixedAmount: number;
  variableAmount: number;
  installmentsAmount: number;
}

export function ExpensesDonutChart({
  totalAmount,
  fixedAmount,
  variableAmount,
  installmentsAmount,
}: ExpensesDonutChartProps) {
  const safeTotal = totalAmount > 0 ? totalAmount : 0;

  const fixedPct = safeTotal > 0 ? (fixedAmount / safeTotal) * 100 : 0;
  const variablePct = safeTotal > 0 ? (variableAmount / safeTotal) * 100 : 0;
  const installmentsPct = safeTotal > 0 ? (installmentsAmount / safeTotal) * 100 : 0;

  // SVG Donut Math
  const radius = 46;
  const strokeWidth = 16;
  const circumference = 2 * Math.PI * radius; // ~289.026

  const fixedStroke = (fixedPct / 100) * circumference;
  const variableStroke = (variablePct / 100) * circumference;
  const installmentsStroke = (installmentsPct / 100) * circumference;

  const fixedOffset = 0;
  const variableOffset = -fixedStroke;
  const installmentsOffset = -(fixedStroke + variableStroke);

  return (
    <div className="flex flex-row items-center justify-between gap-3 w-full h-full">
      {/* DONUT SVG WITH CENTER VALUE */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            stroke="#F2EFDC"
            strokeWidth={strokeWidth}
          />

          {safeTotal > 0 ? (
            <>
              {/* Segment 1: Gastos Fixos (Purple) */}
              {fixedStroke > 0 && (
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="transparent"
                  stroke="#8B5CF6"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${fixedStroke} ${circumference}`}
                  strokeDashoffset={fixedOffset}
                  strokeLinecap={safeTotal === fixedAmount ? 'butt' : 'round'}
                  className="transition-all duration-500"
                />
              )}

              {/* Segment 2: Gastos Variáveis (Pink/Rose) */}
              {variableStroke > 0 && (
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="transparent"
                  stroke="#FF3B6F"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${variableStroke} ${circumference}`}
                  strokeDashoffset={variableOffset}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              )}

              {/* Segment 3: Parcelados (Amber/Orange) */}
              {installmentsStroke > 0 && (
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="transparent"
                  stroke="#F59E0B"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${installmentsStroke} ${circumference}`}
                  strokeDashoffset={installmentsOffset}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              )}
            </>
          ) : null}
        </svg>

        {/* Center Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-1 pointer-events-none">
          <span className="text-[11px] sm:text-xs font-extrabold text-[#02402E] tracking-tight truncate max-w-[70px]">
            {formatCurrency(safeTotal)}
          </span>
          <span className="text-[9px] text-[#5E6963] font-medium uppercase tracking-wider">
            Total
          </span>
        </div>
      </div>

      {/* LEGEND ON THE RIGHT */}
      <div className="flex flex-col justify-center space-y-1.5 w-full min-w-0">
        {/* Gastos Fixos */}
        <div className="flex items-center justify-between gap-1.5 text-[11px] font-medium">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#8B5CF6] shrink-0" />
            <span className="text-[#202724] truncate">Gastos Fixos</span>
          </div>
          <span className="font-bold text-[#202724] shrink-0">
            {fixedPct.toFixed(1).replace('.', ',')}%
          </span>
        </div>

        {/* Gastos Variáveis */}
        <div className="flex items-center justify-between gap-1.5 text-[11px] font-medium">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#FF3B6F] shrink-0" />
            <span className="text-[#202724] truncate">Gastos Variáveis</span>
          </div>
          <span className="font-bold text-[#202724] shrink-0">
            {variablePct.toFixed(1).replace('.', ',')}%
          </span>
        </div>

        {/* Parcelados */}
        <div className="flex items-center justify-between gap-1.5 text-[11px] font-medium">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B] shrink-0" />
            <span className="text-[#202724] truncate">Parcelados</span>
          </div>
          <span className="font-bold text-[#202724] shrink-0">
            {installmentsPct.toFixed(1).replace('.', ',')}%
          </span>
        </div>
      </div>
    </div>
  );
}
