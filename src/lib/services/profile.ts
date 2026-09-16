import { supabase } from '../supabase';
import { Profile } from '../../types';

// Global listener for schema pending status (when tables are not yet created in Supabase)
type SchemaStatusListener = (isPending: boolean, message?: string) => void;
const schemaListeners = new Set<SchemaStatusListener>();
let currentSchemaPending = false;

export function subscribeToSchemaStatus(listener: SchemaStatusListener) {
  schemaListeners.add(listener);
  listener(currentSchemaPending);
  return () => schemaListeners.delete(listener);
}

export function notifySchemaPending(isPending: boolean, message?: string) {
  currentSchemaPending = isPending;
  schemaListeners.forEach((fn) => fn(isPending, message));
}

export function isTableMissingError(error: any): boolean {
  if (!error) return false;
  return (
    error.code === 'PGRST205' ||
    error.code === '42P01' || // undefined_table
    Boolean(
      error.message &&
        (error.message.includes('schema cache') ||
          error.message.includes('Could not find the table') ||
          error.message.includes('relation "public.profiles" does not exist') ||
          error.message.includes('relation "public.spaces" does not exist') ||
          error.message.includes('relation "public.space_members" does not exist'))
    )
  );
}

export const profileService = {
  async getProfile(userId: string): Promise<Profile | null> {
    try {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // record does not exist yet

        if (isTableMissingError(error)) {
          notifySchemaPending(true, 'Tabelas do Supabase ainda não foram criadas no SQL Editor.');
          return null;
        }

        console.warn('Erro ao consultar perfil no Supabase:', error.message || error);
        return null;
      }

      notifySchemaPending(false);
      return data as Profile;
    } catch (err: any) {
      if (isTableMissingError(err)) {
        notifySchemaPending(true);
        return null;
      }
      console.warn('getProfile error:', err?.message || err);
      return null;
    }
  },

  async updateProfile(
    userId: string,
    updates: { full_name?: string; avatar_url?: string | null }
  ): Promise<Profile | null> {
    try {
      const now = new Date().toISOString();
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: now,
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        if (isTableMissingError(error)) {
          notifySchemaPending(true);
          return null;
        }
        throw error;
      }

      notifySchemaPending(false);
      return data as Profile;
    } catch (err: any) {
      if (isTableMissingError(err)) {
        notifySchemaPending(true);
        return null;
      }
      console.error('updateProfile error:', err);
      throw err;
    }
  },

  async ensureProfile(userId: string, fullName: string): Promise<Profile | null> {
    try {
      const existing = await this.getProfile(userId);
      if (existing) return existing;

      const now = new Date().toISOString();
      const newProfile: Profile = {
        id: userId,
        full_name: fullName.trim() || 'Usuário',
        avatar_url: null,
        created_at: now,
        updated_at: now,
      };

      if (!supabase) return null;
      const { data, error } = await supabase
        .from('profiles')
        .upsert(newProfile)
        .select()
        .single();

      if (error) {
        if (isTableMissingError(error)) {
          notifySchemaPending(true, 'Tabelas do Supabase ainda não foram criadas no SQL Editor.');
          return null;
        }

        // Se outra transação concorrente acabou de inserir, busca novamente
        const fetched = await this.getProfile(userId);
        if (fetched) return fetched;

        throw error;
      }

      notifySchemaPending(false);
      return data as Profile;
    } catch (err: any) {
      if (isTableMissingError(err)) {
        notifySchemaPending(true);
        return null;
      }
      console.error('ensureProfile error:', err);
      throw err;
    }
  },
};
