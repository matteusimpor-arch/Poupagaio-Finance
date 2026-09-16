import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthUser, Profile, Space } from '../types';
import { authService } from '../lib/services/auth';
import { profileService, subscribeToSchemaStatus } from '../lib/services/profile';
import { spaceService } from '../lib/services/space';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  spaces: Space[];
  currentSpace: Space | null;
  isLoading: boolean;
  isInitializing: boolean;
  isSchemaPending: boolean;
  recheckSchema: () => Promise<boolean>;
  setCurrentSpace: (space: Space) => void;
  signUp: (data: { email: string; password: string; fullName: string }) => Promise<{ error: Error | null }>;
  signIn: (data: { email: string; password: string }) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updateProfileName: (newName: string) => Promise<{ error: Error | null }>;
  refreshData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [currentSpace, setCurrentSpaceState] = useState<Space | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isSchemaPending, setIsSchemaPending] = useState<boolean>(false);

  // Subscribe to schema missing events
  useEffect(() => {
    const unsubscribe = subscribeToSchemaStatus((pending) => {
      setIsSchemaPending(pending);
    });
    return unsubscribe;
  }, []);

  // Initialize and load user data idempotently
  const loadUserData = useCallback(async (authUser: AuthUser) => {
    try {
      setIsLoading(true);

      // 1. Ensure Profile exists (with safe fallback for PGRST205)
      const userProfile = await profileService.ensureProfile(
        authUser.id,
        authUser.full_name || authUser.email.split('@')[0]
      );
      setProfile(userProfile);

      // 2. Ensure Personal Space exists idempotently
      await spaceService.ensurePersonalSpace(authUser.id, 'Pessoal');

      // 3. Fetch all user spaces
      const userSpaces = await spaceService.getUserSpaces(authUser.id);
      setSpaces(userSpaces);

      // 4. Set current space (prioritize saved or first space)
      const savedSpaceId = localStorage.getItem(`poupagaio_active_space_${authUser.id}`);
      const active = userSpaces.find((s) => s.id === savedSpaceId) || userSpaces[0] || null;
      setCurrentSpaceState(active);
    } catch (err) {
      console.warn('Notice loading user data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Re-verify if Supabase tables have been created (profiles, spaces, space_members)
  const recheckSchema = useCallback(async (): Promise<boolean> => {
    if (!isSupabaseConfigured() || !supabase) return false;
    try {
      setIsLoading(true);
      const [pRes, sRes, mRes] = await Promise.all([
        supabase.from('profiles').select('id').limit(1),
        supabase.from('spaces').select('id').limit(1),
        supabase.from('space_members').select('id').limit(1),
      ]);

      const isMissing = [pRes.error, sRes.error, mRes.error].some(
        (err) => err && (err.code === 'PGRST205' || err.code === '42P01' || err.message?.includes('schema cache'))
      );

      if (isMissing) {
        setIsSchemaPending(true);
        return false;
      }

      setIsSchemaPending(false);
      if (user) {
        await loadUserData(user);
      }
      return true;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, loadUserData]);

  // Check existing session on mount
  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const { user: sessionUser } = await authService.getSession();
        if (isMounted) {
          if (sessionUser) {
            setUser(sessionUser);
            await loadUserData(sessionUser);
          } else {
            setUser(null);
            setProfile(null);
            setSpaces([]);
            setCurrentSpaceState(null);
          }
        }
      } catch (err) {
        console.error('Check session error:', err);
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    }

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [loadUserData]);

  const setCurrentSpace = (space: Space) => {
    setCurrentSpaceState(space);
    if (user) {
      localStorage.setItem(`poupagaio_active_space_${user.id}`, space.id);
    }
  };

  const signUp = async ({ email, password, fullName }: { email: string; password: string; fullName: string }) => {
    setIsLoading(true);
    try {
      const { user: newUser, error } = await authService.signUp({ email, password, fullName });
      if (error || !newUser) {
        return { error: error || new Error('Falha no cadastro.') };
      }

      setUser(newUser);
      await loadUserData(newUser);
      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.message || 'Erro inesperado.') };
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async ({ email, password }: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const { user: authUser, error } = await authService.signIn({ email, password });
      if (error || !authUser) {
        return { error: error || new Error('Credenciais inválidas.') };
      }

      setUser(authUser);
      await loadUserData(authUser);
      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.message || 'Erro ao conectar.') };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await authService.signOut();
      setUser(null);
      setProfile(null);
      setSpaces([]);
      setCurrentSpaceState(null);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    return await authService.resetPassword(email);
  };

  const updateProfileName = async (newName: string) => {
    if (!user) return { error: new Error('Usuário não autenticado.') };
    try {
      const updated = await profileService.updateProfile(user.id, { full_name: newName });
      if (updated) {
        setProfile(updated);
      }
      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.message || 'Erro ao atualizar perfil.') };
    }
  };

  const refreshData = async () => {
    if (user) {
      await loadUserData(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        spaces,
        currentSpace,
        isLoading,
        isInitializing,
        isSchemaPending,
        recheckSchema,
        setCurrentSpace,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updateProfileName,
        refreshData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
