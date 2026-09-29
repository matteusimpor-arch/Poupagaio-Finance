import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { formatCurrency } from '../../lib/formatters';

const actionClass = 'inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16A66A]';

interface OverviewProps {
  monthLabel: string;
  balance: number;
  income: number;
  expenses: number;
  free: number;
  reserved: number;
  afterCommitments: number;
  onPrevious: () => void;
  onNext: () => void;
  onAddIncome: () => void;
}

export function DashboardOverview(props: OverviewProps) {
  return (
    <section aria-label="Resumo financeiro" className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold font-display text-[#02402E] dark:text-[#78D9A6]">Seu mês em resumo</h1>
          <p className="mt-1 text-xs text-[#5E6963] dark:text-[#95A39B]">O essencial para acompanhar seu dinheiro.</p>
        </div>
        <div className="flex items-center rounded-xl border border-[#D2DDD6] bg-white dark:bg-[#1C211E] dark:border-[#28322C]">
          <button type="button" aria-label="Mês anterior" onClick={props.onPrevious} className={`${actionClass} hover:bg-[#EAF3EE] dark:hover:bg-white/5`}><ChevronLeft className="size-4" /></button>
          <span className="min-w-32 text-center text-xs font-semibold">{props.monthLabel}</span>
          <button type="button" aria-label="Próximo mês" onClick={props.onNext} className={`${actionClass} hover:bg-[#EAF3EE] dark:hover:bg-white/5`}><ChevronRight className="size-4" /></button>
        </div>
      </header>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <div className="col-span-2 md:col-span-1 rounded-2xl bg-[#02402E] p-5 text-white">
          <p className="text-xs font-medium text-white/75">Dinheiro disponível</p>
          <p className="mt-3 text-2xl font-bold font-display tabular-nums break-words">{formatCurrency(props.balance)}</p>
          <p className="mt-2 text-xs text-white/65">Saldo atual nas suas contas</p>
        </div>
        <div className="min-w-0 rounded-2xl border border-[#D2DDD6] bg-white p-4 md:p-5 dark:bg-[#1C211E] dark:border-[#28322C]">
          <div className="flex min-h-6 items-center justify-between gap-1">
            <p className="text-xs text-[#5E6963] dark:text-[#95A39B]">Entradas do mês</p>
            <button type="button" aria-label="Adicionar entrada" onClick={props.onAddIncome} className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[#16A66A] hover:bg-[#EAF3EE] dark:hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-[#16A66A] cursor-pointer"><Plus className="size-4" /></button>
          </div>
          <p className="mt-2 text-lg md:text-2xl font-bold font-display tabular-nums break-words text-[#16A66A]">{formatCurrency(props.income)}</p>
        </div>
        <div className="min-w-0 rounded-2xl border border-[#D2DDD6] bg-white p-4 md:p-5 dark:bg-[#1C211E] dark:border-[#28322C]">
          <p className="flex h-8 items-center text-xs text-[#5E6963] dark:text-[#95A39B]">Despesas do mês</p>
          <p className="mt-2 text-lg md:text-2xl font-bold font-display tabular-nums break-words text-rose-600 dark:text-rose-400">{formatCurrency(props.expenses)}</p>
        </div>
      </div>
      <details className="rounded-xl border border-[#D2DDD6] bg-white/80 dark:bg-[#1C211E] dark:border-[#28322C]">
        <summary className="cursor-pointer px-4 py-3 text-xs font-semibold text-[#5E6963] dark:text-[#95A39B] focus-visible:outline-2 focus-visible:outline-[#16A66A]">Detalhes do saldo</summary>
        <dl className="grid gap-4 px-4 pb-4 sm:grid-cols-3 text-xs">
          {([['Livre', props.free], ['Reservado', props.reserved], ['Após compromissos', props.afterCommitments]] as const).map(([label, value]) => (
            <div key={label}><dt className="text-[#5E6963] dark:text-[#95A39B]">{label}</dt><dd className="mt-1 font-semibold tabular-nums">{formatCurrency(value)}</dd></div>
          ))}
        </dl>
      </details>
    </section>
  );
}

type Filter = 'pending' | 'paid' | 'all';
export function DashboardAccountsToolbar({ filter, onFilter, onAdd, pending, amount }: {
  filter: Filter; onFilter: (filter: Filter) => void; onAdd: () => void; pending: number; amount: number;
}) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 className="text-lg font-bold font-display text-[#02402E] dark:text-[#78D9A6]">Contas do mês</h2>
        <p className="mt-1 text-xs text-[#5E6963] dark:text-[#95A39B]">{pending === 0 ? 'Nenhuma conta pendente' : `${pending} ${pending === 1 ? 'conta pendente' : 'contas pendentes'} · ${formatCurrency(amount)}`}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Filtrar contas" className="flex gap-1">
          {([['pending', 'Pendentes'], ['paid', 'Pagas'], ['all', 'Todas']] as const).map(([value, label]) => (
            <button type="button" key={value} aria-pressed={filter === value} onClick={() => onFilter(value)} className={`${actionClass} ${filter === value ? 'bg-[#E6F6EF] text-[#02402E] dark:bg-[#16A66A]/20 dark:text-[#78D9A6]' : 'text-[#5E6963] dark:text-[#95A39B] hover:bg-[#EAF3EE] dark:hover:bg-white/5'}`}>{label}</button>
          ))}
        </div>
        <button type="button" onClick={onAdd} className={`${actionClass} bg-[#02402E] text-white hover:bg-[#075C45] dark:bg-[#78D9A6] dark:text-[#101614]`}><Plus className="size-3.5" />Nova conta</button>
      </div>
    </header>
  );
}
