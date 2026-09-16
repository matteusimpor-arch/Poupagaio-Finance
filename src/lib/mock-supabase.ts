import { Profile, Space, SpaceMember } from '../types';

interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  full_name: string;
  created_at: string;
}

const STORAGE_KEYS = {
  USERS: 'poupagaio_mock_users_v1',
  PROFILES: 'poupagaio_mock_profiles_v1',
  SPACES: 'poupagaio_mock_spaces_v1',
  SPACE_MEMBERS: 'poupagaio_mock_space_members_v1',
  CURRENT_SESSION: 'poupagaio_mock_session_v1',
};

const getStored = <T>(key: string, fallback: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
};

const setStored = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('LocalStorage write error:', err);
  }
};

export const mockSupabase = {
  auth: {
    async getSession() {
      const session = getStored<{ user: { id: string; email: string; user_metadata: { full_name?: string } } } | null>(
        STORAGE_KEYS.CURRENT_SESSION,
        null
      );
      return { data: { session }, error: null };
    },

    async signUp({ email, password, options }: { email: string; password: string; options?: { data?: { full_name?: string } } }) {
      const users = getStored<StoredUser[]>(STORAGE_KEYS.USERS, []);
      const normalizedEmail = email.trim().toLowerCase();

      if (users.some((u) => u.email === normalizedEmail)) {
        return { data: { user: null, session: null }, error: { message: 'Este e-mail já está cadastrado. Tente fazer login.' } };
      }

      if (password.length < 6) {
        return { data: { user: null, session: null }, error: { message: 'A senha deve conter no mínimo 6 caracteres.' } };
      }

      const userId = 'usr_' + Math.random().toString(36).substring(2, 11);
      const fullName = options?.data?.full_name?.trim() || normalizedEmail.split('@')[0];
      const newUser: StoredUser = {
        id: userId,
        email: normalizedEmail,
        passwordHash: btoa(password),
        full_name: fullName,
        created_at: new Date().toISOString(),
      };

      users.push(newUser);
      setStored(STORAGE_KEYS.USERS, users);

      const session = {
        user: {
          id: userId,
          email: normalizedEmail,
          user_metadata: { full_name: fullName },
        },
      };

      setStored(STORAGE_KEYS.CURRENT_SESSION, session);
      return { data: { user: session.user, session }, error: null };
    },

    async signInWithPassword({ email, password }: { email: string; password: string }) {
      const users = getStored<StoredUser[]>(STORAGE_KEYS.USERS, []);
      const normalizedEmail = email.trim().toLowerCase();
      const user = users.find((u) => u.email === normalizedEmail);

      if (!user || user.passwordHash !== btoa(password)) {
        return { data: { user: null, session: null }, error: { message: 'E-mail ou senha incorretos. Verifique suas credenciais.' } };
      }

      const session = {
        user: {
          id: user.id,
          email: user.email,
          user_metadata: { full_name: user.full_name },
        },
      };

      setStored(STORAGE_KEYS.CURRENT_SESSION, session);
      return { data: { user: session.user, session }, error: null };
    },

    async signOut() {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
      return { error: null };
    },

    async resetPasswordForEmail(email: string) {
      const users = getStored<StoredUser[]>(STORAGE_KEYS.USERS, []);
      const user = users.find((u) => u.email === email.trim().toLowerCase());
      if (!user) {
        // Standard security practice: Don't reveal if email exists or not
        return { data: {}, error: null };
      }
      return { data: {}, error: null };
    },
  },

  db: {
    async getProfile(userId: string): Promise<Profile | null> {
      const profiles = getStored<Profile[]>(STORAGE_KEYS.PROFILES, []);
      return profiles.find((p) => p.id === userId) || null;
    },

    async saveProfile(profile: Profile): Promise<Profile> {
      const profiles = getStored<Profile[]>(STORAGE_KEYS.PROFILES, []);
      const index = profiles.findIndex((p) => p.id === profile.id);
      if (index >= 0) {
        profiles[index] = { ...profiles[index], ...profile, updated_at: new Date().toISOString() };
      } else {
        profiles.push(profile);
      }
      setStored(STORAGE_KEYS.PROFILES, profiles);
      return profile;
    },

    async getSpacesForUser(userId: string): Promise<Space[]> {
      const spaces = getStored<Space[]>(STORAGE_KEYS.SPACES, []);
      const memberships = getStored<SpaceMember[]>(STORAGE_KEYS.SPACE_MEMBERS, []);
      
      // Strict RLS simulation: user must be owner OR member
      const userMemberSpaceIds = new Set(
        memberships.filter((m) => m.user_id === userId).map((m) => m.space_id)
      );

      return spaces.filter((s) => s.owner_id === userId || userMemberSpaceIds.has(s.id));
    },

    async createSpace(space: Omit<Space, 'id' | 'created_at' | 'updated_at'>): Promise<Space> {
      const spaces = getStored<Space[]>(STORAGE_KEYS.SPACES, []);
      const newSpace: Space = {
        ...space,
        id: 'spc_' + Math.random().toString(36).substring(2, 11),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      spaces.push(newSpace);
      setStored(STORAGE_KEYS.SPACES, spaces);
      return newSpace;
    },

    async addSpaceMember(member: Omit<SpaceMember, 'id' | 'created_at'>): Promise<SpaceMember> {
      const memberships = getStored<SpaceMember[]>(STORAGE_KEYS.SPACE_MEMBERS, []);
      const existing = memberships.find((m) => m.space_id === member.space_id && m.user_id === member.user_id);
      if (existing) {
        return existing;
      }
      const newMember: SpaceMember = {
        ...member,
        id: 'mbr_' + Math.random().toString(36).substring(2, 11),
        created_at: new Date().toISOString(),
      };
      memberships.push(newMember);
      setStored(STORAGE_KEYS.SPACE_MEMBERS, memberships);
      return newMember;
    },
  },
};
