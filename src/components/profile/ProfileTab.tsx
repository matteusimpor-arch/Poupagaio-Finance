import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar } from '../ui/avatar';
import { Shield, Eye, EyeOff } from 'lucide-react';

interface ProfileCardProps {
  fullName: string;
  setFullName: (name: string) => void;
  handleSaveName: (e: React.FormEvent) => void;
  isSaving: boolean;
  saveSuccess: boolean;
}

export function ProfileCard({ fullName, setFullName, handleSaveName, isSaving, saveSuccess }: ProfileCardProps) {
  const { profile } = useAuth();
  return (
    <Card className="bg-white dark:bg-[#18211D]">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar src={profile?.avatar_url} name={fullName} size="lg" />
          <div className="space-y-1">
            <CardTitle>Informações do Perfil</CardTitle>
            <p className="text-sm text-gray-500">Seus dados básicos na aplicação.</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSaveName} className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Alterar foto</Button>
            <Button variant="ghost" size="sm" className="text-red-500">Remover</Button>
          </div>
          <p className="text-xs text-gray-400">JPG, PNG ou WEBP. Máx. 5MB.</p>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nome completo" />
          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>Salvar alterações</Button>
          </div>
          {saveSuccess && <p className="text-xs text-emerald-500">Salvo!</p>}
        </form>
      </CardContent>
    </Card>
  );
}

interface SecurityCardProps {
  newPassword: string;
  setNewPassword: (p: string) => void;
  confirmPassword: string;
  setConfirmPassword: (p: string) => void;
  showPassword: boolean;
  setShowPassword: (s: boolean) => void;
  handleUpdatePassword: (e: React.FormEvent) => void;
  isUpdatingPassword: boolean;
  passwordSuccess: boolean;
  passwordError: string;
}

export function SecurityCard({
  newPassword, setNewPassword, confirmPassword, setConfirmPassword,
  showPassword, setShowPassword, handleUpdatePassword, isUpdatingPassword,
  passwordSuccess, passwordError
}: SecurityCardProps) {
  return (
    <Card className="bg-white dark:bg-[#18211D]">
      <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-4 h-4" /> Segurança da Conta</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="relative">
            <Input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nova senha" />
            <button type="button" className="absolute right-3 top-2.5 text-gray-500" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
          </div>
          <Input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmar nova senha" />
          <p className="text-xs text-gray-500">A nova senha deve ter pelo menos 6 caracteres.</p>
          <div className="flex justify-end">
            <Button type="submit" disabled={isUpdatingPassword}>Alterar senha</Button>
          </div>
          {passwordSuccess && <p className="text-xs text-emerald-500">Senha atualizada!</p>}
          {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
