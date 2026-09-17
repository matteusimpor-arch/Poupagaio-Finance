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

