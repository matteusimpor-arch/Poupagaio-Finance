import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { goalsService } from '../../lib/services/goals';
import { wishlistService } from '../../lib/services/wishlist';
import { fixedExpensesService } from '../../lib/services/fixedExpenses';
import { GoalWithProgress, WishlistItem, ActiveTab, CreateGoalInput, UpdateGoalInput } from '../../types';
import { formatCurrency, getMonthNameBR, getMonthYearLabel } from '../../lib/formatters';
import { GoalModal } from '../goals/GoalModal';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import {
  Target,
  Gift,
  Calendar,
  ChevronRight,
  Plus,
  Sparkles,
  TrendingUp,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  PiggyBank,
  ShoppingBag,
  Layers,
} from 'lucide-react';

interface PlanningScreenProps {
  onSelectTab: (tab: ActiveTab) => void;
}

interface FutureCommitmentMonth {
  year: number;
  month: number;
  cycle: string;
  monthLabel: string;
  totalFixed: number;
  totalInstallments: number;
  totalCommitted: number;
  installmentsCount: number;
  fixedCount: number;
}

export function PlanningScreen({ onSelectTab }: PlanningScreenProps) {
  const { currentSpace } = useAuth();

  // Data states
  const [goals, setGoals] = useState<GoalWithProgress[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [futureMonths, setFutureMonths] = useState<FutureCommitmentMonth[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State for + Criar Meta
  const [isGoalModalOpen, setIsGoalModalOpen] = useState<boolean>(false);

  // Load all planning data
  const loadPlanningData = useCallback(async () => {
    if (!currentSpace?.id) return;
    setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch Goals
      const goalsRes = await goalsService.getGoalsWithProgress(currentSpace.id, {
        filterStatus: 'active',
      });
      setGoals(goalsRes.goals || []);

      // 2. Fetch Wishlist
      const wishlistRes = await wishlistService.getWishlistItems(currentSpace.id, {
        filterStatus: 'active',
      });
      setWishlistItems(wishlistRes.items || []);

      // 3. Project Future Commitments for the upcoming 4 months
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      const upcomingList: { year: number; month: number; cycle: string; monthLabel: string }[] = [];
      for (let i = 1; i <= 4; i++) {
        const d = new Date(currentYear, currentMonth - 1 + i, 1);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const cycle = `${y}-${String(m).padStart(2, '0')}`;
        upcomingList.push({
          year: y,
          month: m,
          cycle,
          monthLabel: getMonthYearLabel(y, m),
        });
      }

      // Fetch Fixed Expenses & Installments in batch
      const [fixedRes, installmentsRes] = await Promise.all([
        fixedExpensesService.getFixedExpensesWithStatus(currentSpace.id, currentYear, currentMonth),
        supabase
          ? supabase
              .from('installments')
              .select('*')
              .eq('space_id', currentSpace.id)
              .gte('due_date', `${upcomingList[0].cycle}-01`)
              .lte('due_date', `${upcomingList[3].cycle}-31`)
          : Promise.resolve({ data: [] }),
      ]);

      const fixedList = fixedRes.expenses || [];
      const installmentRows = installmentsRes.data || [];

      // Calculate future commitments for each month
      const compiledMonths: FutureCommitmentMonth[] = upcomingList.map((item) => {
        const cyclePrefix = item.cycle;
        const targetCycleDateStr = `${item.year}-${String(item.month).padStart(2, '0')}-01`;

        // Fixed expenses applicable to this future month (respecting start_date & recurrence)
        const applicableFixed = fixedList.filter((f) => {
          const expStartDate = f.start_date ? f.start_date.substring(0, 10) : '1970-01-01';
          if (targetCycleDateStr < expStartDate) {
            return false;
          }
          if (f.recurrence === 'yearly') {
            return f.due_month === item.month;
          }
          return true;
        });

        const totalFixed = applicableFixed.reduce((acc, f) => acc + (Number(f.amount) || 0), 0);

        // Installments due in this future month
        const monthInstallments = installmentRows.filter((i: any) =>
          i.due_date.startsWith(cyclePrefix)
        );
        const totalInstallments = monthInstallments.reduce(
          (acc: number, i: any) => acc + (Number(i.amount) || 0),
          0
        );

        return {
          year: item.year,
          month: item.month,
          cycle: item.cycle,
          monthLabel: item.monthLabel,
          totalFixed: Number(totalFixed.toFixed(2)),
          totalInstallments: Number(totalInstallments.toFixed(2)),
          totalCommitted: Number((totalFixed + totalInstallments).toFixed(2)),
          fixedCount: applicableFixed.length,
          installmentsCount: monthInstallments.length,
        };
      });

      setFutureMonths(compiledMonths);
    } catch (err: any) {
      console.error('Erro ao carregar dados do planejamento:', err);
      setError('Ocorreu um erro ao carregar o planejamento futuro.');
    } finally {
      setIsLoading(false);
    }
  }, [currentSpace?.id]);

  useEffect(() => {
    loadPlanningData();
  }, [loadPlanningData]);

  // Aggregate metrics
  const totalTargetGoals = useMemo(() => {
    return goals.reduce((acc, g) => acc + g.target_amount, 0);
  }, [goals]);

  const totalAccumulatedGoals = useMemo(() => {
    return goals.reduce((acc, g) => acc + g.current_amount, 0);
  }, [goals]);

  const totalWishlistEstimated = useMemo(() => {
    return wishlistItems.reduce((acc, w) => acc + (w.estimated_amount || 0), 0);
  }, [wishlistItems]);

  const totalFutureCommitted = useMemo(() => {
    return futureMonths.reduce((acc, m) => acc + m.totalCommitted, 0);
  }, [futureMonths]);

  // Goal creation handler
  const handleSaveGoal = async (
    input: CreateGoalInput | UpdateGoalInput
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentSpace?.id) return { success: false, error: 'Espaço indisponível' };
    const res = await goalsService.createGoal({
      ...input,
      space_id: currentSpace.id,
    } as CreateGoalInput);
    if (!res.error) {
      setIsGoalModalOpen(false);
      loadPlanningData();
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  return (
    <div className="space-y-6 pb-12 max-w-[1280px] mx-auto px-4 sm:px-6">
      {/* HEADER */}
      <div className="pb-2 border-b border-[#D2DDD6] dark:border-[#28322C] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#02402E] dark:bg-[#16A66A] text-white dark:text-[#101614] shadow-2xs">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-[#02402E] dark:text-[#78D9A6]">
              Planejamento Financeiro
            </h1>
            <p className="text-xs text-[#5E6963] dark:text-[#95A39B]">
              Organize metas, lista de desejos e acompanhe seus compromissos futuros.
            </p>
          </div>
        </div>
      </div>

      {/* CARDS RESUMO COMPACTOS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metas Ativas */}
        <Card className="border-[#D2DDD6] dark:border-[#28322C] bg-white/90 dark:bg-[#1C211E]/90 backdrop-blur-md shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-[#5E6963] dark:text-[#95A39B] uppercase tracking-wider">
                Metas Ativas ({goals.length})
              </p>
              <h3 className="text-base sm:text-lg font-extrabold text-[#02402E] dark:text-[#78D9A6]">
                {formatCurrency(totalAccumulatedGoals)}{' '}
                <span className="text-xs font-medium text-[#5E6963] dark:text-[#95A39B]">
                  / {formatCurrency(totalTargetGoals)}
                </span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-[#16A66A]">
              <PiggyBank className="w-5 h-5 stroke-[2]" />
            </div>
          </CardContent>
        </Card>

        {/* Lista de Desejos */}
        <Card className="border-[#D2DDD6] dark:border-[#28322C] bg-white/90 dark:bg-[#1C211E]/90 backdrop-blur-md shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-[#5E6963] dark:text-[#95A39B] uppercase tracking-wider">
                Lista de Desejos ({wishlistItems.length})
              </p>
              <h3 className="text-base sm:text-lg font-extrabold text-[#02402E] dark:text-[#78D9A6]">
                {formatCurrency(totalWishlistEstimated)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Gift className="w-5 h-5 stroke-[2]" />
            </div>
          </CardContent>
        </Card>

        {/* Compromissos Futuros */}
        <Card className="border-[#D2DDD6] dark:border-[#28322C] bg-white/90 dark:bg-[#1C211E]/90 backdrop-blur-md shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-[#5E6963] dark:text-[#95A39B] uppercase tracking-wider">
                Compromissos Futuros (4 Meses)
              </p>
              <h3 className="text-base sm:text-lg font-extrabold text-[#E11D48] dark:text-rose-400">
                {formatCurrency(totalFutureCommitted)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center text-[#E11D48] dark:text-rose-400">
              <Calendar className="w-5 h-5 stroke-[2]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SEÇÃO 1: METAS DE ECONOMIA */}
      <section className="bg-white/90 dark:bg-[#1C211E]/90 backdrop-blur-md border border-[#D2DDD6] dark:border-[#28322C] rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E2ECE6] dark:border-[#28322C]">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-[#16A66A]" />
            <h2 className="text-base font-bold font-display text-[#02402E] dark:text-[#78D9A6]">
              Metas de Economia Ativas
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsGoalModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-[#02402E] dark:bg-[#16A66A] text-white dark:text-[#101614] text-xs font-bold hover:bg-[#16A66A] transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Criar Meta</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('goals')}
              className="text-xs text-[#16A66A] hover:underline font-bold cursor-pointer flex items-center gap-1"
            >
              <span>Ver todas as metas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        ) : goals.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <PiggyBank className="w-8 h-8 text-[#5E6963] dark:text-[#95A39B] mx-auto opacity-50" />
            <p className="text-xs font-bold text-[#02402E] dark:text-[#78D9A6]">
              Nenhuma meta ativas no momento.
            </p>
            <p className="text-[11px] text-[#5E6963] dark:text-[#95A39B]">
              Crie uma nova meta de economia para começar a planejar seu futuro.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.slice(0, 4).map((goal) => {
              const progress = Math.min(100, Math.round(goal.progress_percentage || 0));
              return (
                <div
                  key={goal.id}
                  onClick={() => onSelectTab('goals')}
                  className="p-4 rounded-2xl border border-[#E2ECE6] dark:border-[#28322C] bg-[#F4F8F5] dark:bg-[#222825] hover:border-[#16A66A] transition-all cursor-pointer space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-bold text-[#02402E] dark:text-[#78D9A6] font-display">
                        {goal.name}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#E2ECE6] dark:bg-[#28322C] text-[#5E6963] dark:text-[#95A39B] font-semibold">
                        {goal.category}
                      </span>
                    </div>
                    <span className="text-xs font-extrabold text-[#16A66A]">{progress}%</span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-[#E2ECE6] dark:bg-[#28322C] overflow-hidden">
                    <div
                      className="h-full bg-[#16A66A] rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#5E6963] dark:text-[#95A39B]">
                    <span>
                      Acumulado:{' '}
                      <strong className="text-[#02402E] dark:text-[#78D9A6]">
                        {formatCurrency(goal.current_amount)}
                      </strong>
                    </span>
                    <span>
                      Alvo:{' '}
                      <strong className="text-[#02402E] dark:text-[#78D9A6]">
                        {formatCurrency(goal.target_amount)}
                      </strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SEÇÃO 2: LISTA DE DESEJOS */}
      <section className="bg-white/90 dark:bg-[#1C211E]/90 backdrop-blur-md border border-[#D2DDD6] dark:border-[#28322C] rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2ECE6] dark:border-[#28322C]">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-base font-bold font-display text-[#02402E] dark:text-[#78D9A6]">
              Lista de Desejos
            </h2>
          </div>

          <button
            type="button"
            onClick={() => onSelectTab('wishlist')}
            className="text-xs text-[#16A66A] hover:underline font-bold cursor-pointer flex items-center gap-1"
          >
            <span>Ver lista de desejos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <Gift className="w-8 h-8 text-[#5E6963] dark:text-[#95A39B] mx-auto opacity-50" />
            <p className="text-xs font-bold text-[#02402E] dark:text-[#78D9A6]">
              Sua lista de desejos está vazia.
            </p>
            <p className="text-[11px] text-[#5E6963] dark:text-[#95A39B]">
              Adicione itens que deseja adquirir futuramente.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {wishlistItems.slice(0, 6).map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectTab('wishlist')}
                className="p-3.5 rounded-2xl border border-[#E2ECE6] dark:border-[#28322C] bg-[#F4F8F5] dark:bg-[#222825] hover:border-[#16A66A] transition-all cursor-pointer space-y-1.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-[#02402E] dark:text-[#78D9A6] truncate font-display">
                      {item.title}
                    </h3>
                    {item.priority && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                          item.priority === 'high'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {item.priority === 'high' ? 'Alta' : 'Média'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#5E6963] dark:text-[#95A39B] truncate">
                    {item.category || 'Geral'}
                  </p>
                </div>

                <div className="pt-1 flex items-center justify-between text-xs border-t border-[#E2ECE6] dark:border-[#28322C]">
                  <span className="text-[10px] text-[#5E6963] dark:text-[#95A39B]">Valor:</span>
                  <strong className="text-[#02402E] dark:text-[#78D9A6]">
                    {formatCurrency(item.estimated_amount || 0)}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SEÇÃO 3: COMPROMISSOS FUTUROS (PRÓXIMOS MESES) */}
      <section className="bg-white/90 dark:bg-[#1C211E]/90 backdrop-blur-md border border-[#D2DDD6] dark:border-[#28322C] rounded-2xl p-5 shadow-2xs space-y-4">
        <div>
          <h2 className="text-base font-bold font-display text-[#02402E] dark:text-[#78D9A6] flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#E11D48] dark:text-rose-400" />
            Compromissos Financeiros Futuros (Próximos Meses)
          </h2>
          <p className="text-xs text-[#5E6963] dark:text-[#95A39B]">
            Projeção baseada nos Gastos Fixos recorrentes e parcelas individuais vincendas.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <Skeleton key={n} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {futureMonths.map((monthItem) => (
              <div
                key={monthItem.cycle}
                className="p-4 rounded-2xl border border-[#E2ECE6] dark:border-[#28322C] bg-[#F4F8F5] dark:bg-[#222825] space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-[#E2ECE6] dark:border-[#28322C]">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#02402E] dark:text-[#78D9A6] font-display">
                    {monthItem.monthLabel}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-bold">
                    Projeção
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-base font-extrabold text-[#E11D48] dark:text-rose-400">
                    {formatCurrency(monthItem.totalCommitted)}
                  </p>
                  <p className="text-[10px] text-[#5E6963] dark:text-[#95A39B]">
                    Comprometido na competência
                  </p>
                </div>

                <div className="pt-2 text-[11px] space-y-1 text-[#5E6963] dark:text-[#95A39B] border-t border-[#E2ECE6] dark:border-[#28322C]">
                  <div className="flex items-center justify-between">
                    <span>Fixos ({monthItem.fixedCount}):</span>
                    <span className="font-semibold text-[#02402E] dark:text-[#78D9A6]">
                      {formatCurrency(monthItem.totalFixed)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Parcelas ({monthItem.installmentsCount}):</span>
                    <span className="font-semibold text-[#02402E] dark:text-[#78D9A6]">
                      {formatCurrency(monthItem.totalInstallments)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MODAL CRIAR META */}
      {currentSpace?.id && (
        <GoalModal
          isOpen={isGoalModalOpen}
          onClose={() => setIsGoalModalOpen(false)}
          onSave={handleSaveGoal}
          spaceId={currentSpace.id}
        />
      )}
    </div>
  );
}
