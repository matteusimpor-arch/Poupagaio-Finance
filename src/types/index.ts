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

export type ActiveTab = 'home' | 'transactions' | 'planning' | 'market' | 'more' | 'profile';
