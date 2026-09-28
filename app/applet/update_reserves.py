import sys

file_path = '/app/applet/src/lib/services/reserves.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

if 'import { goalsService }' not in content:
    content = content.replace(
        "import { installmentsService } from './installments';",
        "import { installmentsService } from './installments';\nimport { goalsService } from './goals';"
    )

old_func_start = '  async getReservesWithSummary('
old_func_end = '    } catch (err: any) {'

# Let us replace the entire method cleanly
new_method = """  async getReservesWithSummary(
    spaceId: string,
    year: number,
    month: number
  ): Promise<{
    reserves: Reserve[];
    summary: ReservesSummary;
    isTableMissing: boolean;
    error?: string;
  }> {
    if (!spaceId) {
      return { reserves: [], summary: emptyReservesSummary, isTableMissing: false };
    }
    const billingCycle = `${year}-${String(month).padStart(2, '0')}`;
    try {
      const [entriesRes, checklistRes, goalsRes] = await Promise.all([
        entriesService.getMonthSummary(spaceId, year, month),
        checklistService.getMonthlyChecklist(spaceId, year, month),
        goalsService.getGoalsWithProgress(spaceId),
      ]);
      const totalIncome = entriesRes?.totalPlanned || 0;
      const totalPaidExpenses = checklistRes?.stats?.paidAmount || 0;
      const totalBalance = Math.max(0, totalIncome - totalPaidExpenses);
      const totalGoalsAccumulated = goalsRes?.summary?.totalAccumulated || 0;
      const pendingExpenses = checklistRes?.stats?.pendingAmount || 0;

      let reserves: Reserve[] = [];
      let isTableMissing = false;
      if (supabase) {
        const { data, error } = await supabase
          .from('reserves')
          .select('*')
          .eq('space_id', spaceId)
          .eq('billing_cycle', billingCycle)
          .eq('is_archived', false)
          .order('is_preferred', { ascending: false })
          .order('name', { ascending: true });
        if (error) {
          if (isTableMissingError(error)) {
            isTableMissing = true;
          } else {
            console.warn('Aviso ao buscar reservas:', error.message || error);
          }
        } else if (data) {
          reserves = data;
        }
      }

      if (isTableMissing || !supabase) {
        const localList = getLocalData<Reserve[]>(LOCAL_RESERVES_KEY, []);
        reserves = (localList || []).filter(
          (r) => r && r.space_id === spaceId && r.billing_cycle === billingCycle && !r.is_archived
        );
      }

      let totalReserved = 0;
      let totalAllocated = 0;
      let totalSpentFromReserves = 0;
      for (const r of (reserves || [])) {
        const currentBal = Number(r?.current_balance) || 0;
        const alloc = Number(r?.allocated_amount) || 0;
        totalReserved += currentBal;
        totalAllocated += alloc;
        totalSpentFromReserves += Math.max(0, alloc - currentBal);
      }

      const freeBalance = Math.max(0, totalBalance - totalReserved - totalGoalsAccumulated);
      const afterCommitments = Math.max(0, totalBalance - pendingExpenses);

      return {
        reserves: reserves || [],
        summary: {
          totalBalance,
          totalReserved,
          freeBalance,
          totalAllocated,
          totalSpentFromReserves,
          count: (reserves || []).length,
          totalGoalsAccumulated,
          pendingExpenses,
          afterCommitments,
        },
        isTableMissing,
      };
    } catch (err: any) {
      console.warn('Erro ao obter reservas e sumário:', err);
      return {
        reserves: [],
        summary: emptyReservesSummary,
        isTableMissing: false,
        error: 'Erro ao carregar reservas.',
      };
    }
  },"""

start_idx = content.find('  async getReservesWithSummary(')
next_idx = content.find('  async createReserve(', start_idx)

if start_idx != -1 and next_idx != -1:
    content = content[:start_idx] + new_method + "\n\n  " + content[next_idx:]
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("reserves.ts updated successfully via Python.")
else:
    print("Error locating boundaries in reserves.ts")
