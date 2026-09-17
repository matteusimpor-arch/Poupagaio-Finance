export type SpaceType = 'personal' | 'couple' | 'family' | 'business';

export type SpaceRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Space {
  id: string;
  name: string;
  type: SpaceType;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface SpaceMember {
  id: string;
  space_id: string;
  user_id: string;
  role: SpaceRole;
  created_at: string;
  profile?: Profile;
}

export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
}

export type ActiveTab = 
  | 'home' 
  | 'movements'
  | 'planning'
  | 'entries' 
  | 'fixed_expenses' 
  | 'variable_expenses' 
  | 'installments' 
  | 'market' 
  | 'investments' 
  | 'goals' 
  | 'wishlist' 
  | 'closing' 
  | 'profile';

export type EntryStatus = 'pending' | 'received';

export interface Entry {
  id: string;
  space_id: string;
  created_by?: string | null;
  user_id?: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: string;
  status: EntryStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEntryInput {
  space_id: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category?: string;
  status?: EntryStatus;
  notes?: string | null;
}

export interface UpdateEntryInput {
  description?: string;
  amount?: number;
  date?: string; // YYYY-MM-DD
  category?: string;
  status?: EntryStatus;
  notes?: string | null;
}

export interface EntriesSummary {
  totalPlanned: number; // Total previsto
  totalReceived: number; // Total recebido
  totalPending: number;  // A receber
  count: number;
}

// ==========================================
// GASTOS FIXOS (FIXED EXPENSES) — ETAPA 3.3
// ==========================================
export type ExpenseRecurrence = 'monthly' | 'yearly';
export type FixedExpenseComputedStatus = 'paid' | 'upcoming' | 'overdue';

export interface FixedExpense {
  id: string;
  space_id: string;
  created_by?: string | null;
  description: string;
  amount: number;
  due_day: number; // 1 - 31
  due_month?: number | null; // 1 - 12 (obrigatório para yearly, null para monthly)
  category: string;
  recurrence: ExpenseRecurrence;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FixedExpensePayment {
  id: string;
  fixed_expense_id: string;
  space_id: string;
  billing_cycle: string; // YYYY-MM
  paid_at: string; // YYYY-MM-DD
  amount_paid: number;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FixedExpenseWithStatus extends FixedExpense {
  computedStatus: FixedExpenseComputedStatus;
  isPaid: boolean;
  payment?: FixedExpensePayment | null;
  dueDateThisMonth: string; // YYYY-MM-DD
}

export interface CreateFixedExpenseInput {
  space_id: string;
  description: string;
  amount: number;
  due_day: number;
  due_month?: number | null;
  category?: string;
  recurrence?: ExpenseRecurrence;
  notes?: string | null;
}

export interface UpdateFixedExpenseInput {
  description?: string;
  amount?: number;
  due_day?: number;
  due_month?: number | null;
  category?: string;
  recurrence?: ExpenseRecurrence;
  notes?: string | null;
}

export interface FixedExpensesSummary {
  totalMonth: number;   // Total previsto no mês
  totalPaid: number;    // Pago
  totalPending: number; // A pagar (atrasados + próximos)
  totalUpcoming: number; // Apenas próximos
  totalOverdue: number;  // Apenas atrasados
  count: number;
  paidCount: number;
  upcomingCount: number;
  overdueCount: number;
}

// ==========================================
// GASTOS VARIÁVEIS (VARIABLE EXPENSES) — ETAPA 3.3
// ==========================================
export type VariableExpenseStatus = 'pending' | 'paid';

export interface VariableExpense {
  id: string;
  space_id: string;
  created_by?: string | null;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: string;
  status: VariableExpenseStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateVariableExpenseInput {
  space_id: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category?: string;
  status?: VariableExpenseStatus;
  notes?: string | null;
}

export interface UpdateVariableExpenseInput {
  description?: string;
  amount?: number;
  date?: string; // YYYY-MM-DD
  category?: string;
  status?: VariableExpenseStatus;
  notes?: string | null;
}

export interface VariableExpensesSummary {
  totalMonth: number;   // Total de variáveis do mês
  totalPaid: number;    // Pago
  totalPending: number; // Pendente
  count: number;
  paidCount: number;
  pendingCount: number;
}

