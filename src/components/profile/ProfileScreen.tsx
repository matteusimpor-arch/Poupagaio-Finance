import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar } from '../ui/avatar';
import { User, Mail, Sun, Moon, LogOut, Check, Save } from 'lucide-react';

export function ProfileScreen() {
  const { user, profile, updateProfileName, signOut } = useAuth();
  const { theme, toggleTheme, setTheme } = useTheme();

  const [fullName, setFullName] = useState(profile?.full_name || user?.full_name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (profile?.full_name || user?.full_name) {
      setFullName(profile?.full_name || user?.full_name || '');
    }
  }, [profile?.full_name, user?.full_name]);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('O nome não pode ficar vazio.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    setSaveSuccess(false);

    const { error } = await updateProfileName(fullName.trim());
    setIsSaving(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3.5 sm:space-y-6 pb-20 md:pb-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-display text-[#075C45] dark:text-[#78D9A6]">
          Meu Perfil & Configurações
        </h1>
        <p className="text-xs sm:text-sm text-[#5E6963] dark:text-[#95A39B]">
          Gerencie seus dados pessoais e preferências do Poupagaio Finance.
        </p>
      </div>

      {/* User Summary Card */}
      <Card className="border-[#E2E8E4] dark:border-[#24312B] bg-white dark:bg-[#18211D]">
        <CardContent className="p-4 pt-4 sm:p-6 flex flex-row items-center gap-3.5 sm:gap-5">
          <Avatar
            name={profile?.full_name || user?.full_name || user?.email || 'U'}
            size="lg"
            className="w-12 h-12 sm:w-16 sm:h-16 text-base sm:text-xl shadow-xs shrink-0"
          />
          <div className="space-y-0.5 text-left flex-1 min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-[#202724] dark:text-[#F7F4EA] truncate">
              {profile?.full_name || user?.full_name || 'Usuário'}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-[#5E6963] dark:text-[#95A39B] truncate">
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{user?.email}</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-[#16A66A] dark:text-[#78D9A6] font-medium pt-0.5">
              Membro desde: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR') : 'Hoje'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Edit Name Form */}
      <Card className="border-[#E2E8E4] dark:border-[#24312B] bg-white dark:bg-[#18211D]">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-[#16A66A]" />
            Dados Pessoais
          </CardTitle>
          <CardDescription>
            Atualize seu nome de exibição no aplicativo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveName} className="space-y-3.5 sm:space-y-4">
            <Input
              id="profile-name-input"
              label="Nome Completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Seu nome"
              error={errorMsg}
            />

            <div className="w-full space-y-1.5 text-left">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#5E6963] dark:text-[#95A39B]">
                E-mail da Conta
              </label>
              <input
                type="text"
                value={user?.email || ''}
                disabled
                className="w-full h-10 sm:h-11 px-3.5 rounded-xl border border-[#E2E8E4] bg-black/[0.03] text-[#5E6963] text-xs sm:text-sm dark:bg-white/[0.03] dark:border-[#24312B] dark:text-[#95A39B] cursor-not-allowed"
              />
              <p className="text-[11px] text-[#5E6963] dark:text-[#95A39B]">
                O e-mail é gerenciado pelo Supabase Auth.
              </p>
            </div>

            {saveSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                Nome atualizado com sucesso no seu perfil!
              </div>
            )}

            <div className="pt-1 flex justify-end">
              <Button
                type="submit"
                id="save-profile-btn"
                variant="primary"
                size="sm"
                isLoading={isSaving}
                className="gap-2 text-xs font-semibold py-1.5 px-4 h-8 sm:h-9"
              >
                <Save className="w-4 h-4" />
                Salvar Alterações
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Appearance / Theme Settings */}
      <Card className="border-[#E2E8E4] dark:border-[#24312B] bg-white dark:bg-[#18211D]">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sun className="w-4 h-4 text-[#D6A84B]" />
            Aparência
          </CardTitle>
          <CardDescription>
            Escolha como prefere visualizar o Poupagaio Finance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <button
              type="button"
              id="theme-light-btn"
              onClick={() => setTheme('light')}
              className={`p-3 sm:p-4 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer ${
                theme === 'light'
                  ? 'border-[#16A66A] bg-[#16A66A]/10 text-[#075C45] font-semibold ring-2 ring-[#16A66A]/30'
                  : 'border-[#E2E8E4] bg-white text-[#5E6963] hover:bg-black/5 dark:bg-[#18211D] dark:border-[#24312B]'
              }`}
            >
              <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-[#D6A84B]" />
              <span className="text-xs sm:text-sm">Tema Claro</span>
              <span className="text-[10px] sm:text-[11px] text-[#5E6963] dark:text-[#95A39B]">
                Cores Claras & Verde
              </span>
            </button>

            <button
              type="button"
              id="theme-dark-btn"
              onClick={() => setTheme('dark')}
              className={`p-3 sm:p-4 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'border-[#16A66A] bg-[#16A66A]/20 text-[#78D9A6] font-semibold ring-2 ring-[#16A66A]/30'
                  : 'border-[#E2E8E4] bg-white text-[#5E6963] hover:bg-black/5 dark:bg-[#18211D] dark:border-[#24312B] dark:text-[#95A39B]'
              }`}
            >
              <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-[#78D9A6]" />
              <span className="text-xs sm:text-sm">Tema Escuro</span>
              <span className="text-[10px] sm:text-[11px] text-[#5E6963] dark:text-[#95A39B]">
                Grafite Profundo
              </span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Session Management / Logout */}
      <Card className="border-red-200 dark:border-red-950/50">
        <CardHeader>
          <CardTitle className="text-base text-red-600 dark:text-red-400 flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Sessão
          </CardTitle>
          <CardDescription>
            Encerre sua sessão com segurança neste dispositivo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#202724] dark:text-[#F7F4EA]">
                Sair da sua conta
              </p>
              <p className="text-xs text-[#5E6963] dark:text-[#95A39B]">
                Você poderá entrar novamente a qualquer momento com sua senha.
              </p>
            </div>
            <Button
              id="profile-logout-btn"
              variant="danger"
              size="sm"
              onClick={() => signOut()}
              className="gap-2 shrink-0"
            >
              <LogOut className="w-4 h-4" />
              Sair da Conta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
