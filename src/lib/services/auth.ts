import { supabase, isSupabaseConfigured } from '../supabase';
import { mockSupabase } from '../mock-supabase';
import { AuthUser } from '../../types';

export const authService = {
  async getSession(): Promise<{ user: AuthUser | null; error: Error | null }> {
    try {
      if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase.auth.getSession();
        if (error) return { user: null, error };
        if (!data.session?.user) return { user: null, error: null };
        return {
          user: {
            id: data.session.user.id,
            email: data.session.user.email || '',
            full_name: data.session.user.user_metadata?.full_name,
          },
          error: null,
        };
      }

      const { data, error } = await mockSupabase.auth.getSession();
      if (error) return { user: null, error: new Error(error.message) };
      if (!data.session?.user) return { user: null, error: null };
      return {
        user: {
          id: data.session.user.id,
          email: data.session.user.email,
          full_name: data.session.user.user_metadata?.full_name,
        },
        error: null,
      };
    } catch (err: any) {
      return { user: null, error: new Error(err.message || 'Erro ao obter sessão') };
    }
  },

  async signUp({
    email,
    password,
    fullName,
  }: {
    email: string;
    password: string;
    fullName: string;
  }): Promise<{ user: AuthUser | null; error: Error | null }> {
    try {
      if (!email || !password) {
        return { user: null, error: new Error('Preencha todos os campos obrigatórios.') };
      }
      if (password.length < 6) {
        return { user: null, error: new Error('A senha deve ter pelo menos 6 caracteres.') };
      }

      if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: { full_name: fullName.trim() },
          },
        });

        if (error) {
          if (error.message.includes('already registered')) {
            return { user: null, error: new Error('Este e-mail já está cadastrado.') };
          }
          return { user: null, error: new Error(error.message) };
        }

        if (!data.user) {
          return { user: null, error: new Error('Não foi possível concluir o cadastro.') };
        }

        return {
          user: {
            id: data.user.id,
            email: data.user.email || '',
            full_name: fullName.trim(),
          },
          error: null,
        };
      }

      const { data, error } = await mockSupabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName.trim() } },
      });

      if (error) return { user: null, error: new Error(error.message) };
      if (!data.user) return { user: null, error: new Error('Falha no cadastro.') };

      return {
        user: {
          id: data.user.id,
          email: data.user.email,
          full_name: fullName.trim(),
        },
        error: null,
      };
    } catch (err: any) {
      return { user: null, error: new Error(err.message || 'Erro inesperado durante cadastro.') };
    }
  },

  async signIn({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<{ user: AuthUser | null; error: Error | null }> {
    try {
      if (!email || !password) {
        return { user: null, error: new Error('Informe o e-mail e a senha.') };
      }

      if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            return { user: null, error: new Error('E-mail ou senha incorretos.') };
          }
          return { user: null, error: new Error(error.message) };
        }

        if (!data.user) {
          return { user: null, error: new Error('Erro ao iniciar sessão.') };
        }

        return {
          user: {
            id: data.user.id,
            email: data.user.email || '',
            full_name: data.user.user_metadata?.full_name,
          },
          error: null,
        };
      }

      const { data, error } = await mockSupabase.auth.signInWithPassword({ email, password });
      if (error) return { user: null, error: new Error(error.message) };
      if (!data.user) return { user: null, error: new Error('Erro ao iniciar sessão.') };

      return {
        user: {
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name,
        },
        error: null,
      };
    } catch (err: any) {
      return { user: null, error: new Error(err.message || 'Erro inesperado ao entrar.') };
    }
  },

  async signOut(): Promise<{ error: Error | null }> {
    try {
      if (isSupabaseConfigured() && supabase) {
        const { error } = await supabase.auth.signOut();
        return { error: error ? new Error(error.message) : null };
      }
      await mockSupabase.auth.signOut();
      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.message || 'Erro ao sair da conta.') };
    }
  },

  async resetPassword(email: string): Promise<{ error: Error | null }> {
    try {
      if (!email) {
        return { error: new Error('Por favor, informe seu e-mail cadastrado.') };
      }
      if (isSupabaseConfigured() && supabase) {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
          redirectTo: window.location.origin,
        });
        return { error: error ? new Error(error.message) : null };
      }
      await mockSupabase.auth.resetPasswordForEmail(email);
      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.message || 'Erro ao solicitar recuperação.') };
    }
  },
};
