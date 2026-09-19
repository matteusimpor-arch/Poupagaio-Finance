import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { spaceService } from '../../lib/services/space';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar } from '../ui/avatar';
import { Badge } from '../ui/badge';
import {
  User,
  Mail,
  LogOut,
  Users,
  Briefcase,
  Layers,
  Sparkles,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import { Space, SpaceType, SpaceRole, SpaceMember } from '../../types';

type TabType = 'profile' | 'spaces';

export function ProfileScreen() {
  const { user, profile, spaces, memberships, currentSpace, updateProfileName, updatePassword, createSpace, updateSpaceName, setCurrentSpace, signOut } = useAuth();
  const { theme, toggleTheme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [fullName, setFullName] = useState(profile?.full_name || user?.full_name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  const [activeSpaceMembers, setActiveSpaceMembers] = useState<SpaceMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceType, setNewSpaceType] = useState<'couple' | 'family' | 'business'>('couple');
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [spaceCreateSuccess, setSpaceCreateSuccess] = useState(false);
  const [spaceCreateError, setSpaceCreateError] = useState('');
  const [editSpaceName, setEditSpaceName] = useState(currentSpace?.name || '');
  const [isUpdatingSpaceName, setIsUpdatingSpaceName] = useState(false);
  const [spaceUpdateSuccess, setSpaceUpdateSuccess] = useState(false);
  const [spaceUpdateError, setSpaceUpdateError] = useState('');

  useEffect(() => {
    if (profile?.full_name || user?.full_name) {
      setFullName(profile?.full_name || user?.full_name || '');
    }
  }, [profile?.full_name, user?.full_name]);

  useEffect(() => {
    if (currentSpace) {
      setEditSpaceName(currentSpace.name);
    }
  }, [currentSpace]);

  useEffect(() => {
    const loadActiveSpaceMembers = async (spaceId: string) => {
      setIsLoadingMembers(true);
      try {
        const members = await spaceService.getSpaceMembers(spaceId);
        setActiveSpaceMembers(members);
      } catch (err) {
        console.warn('Erro ao carregar membros:', err);
      } finally {
        setIsLoadingMembers(false);
      }
    };
    if (currentSpace?.id) {
      loadActiveSpaceMembers(currentSpace.id);
    }
  }, [currentSpace?.id]);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) { setErrorMsg('O nome não pode ficar vazio.'); return; }
    setIsSaving(true);
    setErrorMsg('');
    setSaveSuccess(false);
    const { error } = await updateProfileName(fullName.trim());
    setIsSaving(false);
    if (error) { setErrorMsg(error.message); } else { setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 3000); }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setPasswordError('As senhas não coincidem.'); return; }
    if (newPassword.length < 6) { setPasswordError('A nova senha deve ter pelo menos 6 caracteres.'); return; }
    setIsUpdatingPassword(true);
    setPasswordError('');
    setPasswordSuccess(false);
    const { error } = await updatePassword(newPassword);
    setIsUpdatingPassword(false);
    if (error) { setPasswordError(error.message); } else { setPasswordSuccess(true); setNewPassword(''); setConfirmPassword(''); setTimeout(() => setPasswordSuccess(false), 3000); }
  };

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpaceName.trim()) { setSpaceCreateError('O nome do espaço não pode ficar vazio.'); return; }
    setIsCreatingSpace(true);
    setSpaceCreateError('');
    setSpaceCreateSuccess(false);
    const { error } = await createSpace(newSpaceName.trim(), newSpaceType);
    setIsCreatingSpace(false);
    if (error) { setSpaceCreateError(error.message); } else { setSpaceCreateSuccess(true); setNewSpaceName(''); setTimeout(() => setSpaceCreateSuccess(false), 3000); }
  };

  const handleUpdateSpaceName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSpace) return;
    if (!editSpaceName.trim()) { setSpaceUpdateError('O nome do espaço não pode ficar vazio.'); return; }
    setIsUpdatingSpaceName(true);
    setSpaceUpdateError('');
    setSpaceUpdateSuccess(false);
    const { error } = await updateSpaceName(currentSpace.id, editSpaceName.trim());
    setIsUpdatingSpaceName(false);
    if (error) { setSpaceUpdateError(error.message); } else { setSpaceUpdateSuccess(true); setTimeout(() => setSpaceUpdateSuccess(false), 3000); }
  };

  const getRoleLabel = (role?: SpaceRole) => role === 'owner' ? 'Proprietário' : role === 'admin' ? 'Administrador' : 'Membro';
  const getRoleBadgeColor = (role?: SpaceRole) => role === 'owner' ? 'bg-amber-100 text-amber-800' : role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800';

  const currentSpaceRole = memberships.find((m) => m.space_id === currentSpace?.id)?.role || (currentSpace?.owner_id === user?.id ? 'owner' : 'member');

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      <h1 className="text-2xl font-bold text-[#075C45] dark:text-[#78D9A6]">Meu Perfil & Configurações</h1>
      
      <div className="flex gap-2">
        <button onClick={() => setActiveTab('profile')} className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'profile' ? 'bg-white text-[#075C45]' : 'text-gray-500'}`}>Meu Perfil</button>
        <button onClick={() => setActiveTab('spaces')} className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'spaces' ? 'bg-white text-[#075C45]' : 'text-gray-500'}`}>Espaços</button>
      </div>

      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white dark:bg-[#18211D]">
            <CardHeader><CardTitle>Perfil</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSaveName} className="space-y-4">
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                <Button type="submit" disabled={isSaving}>Salvar</Button>
                {saveSuccess && <p className="text-xs text-emerald-500">Salvo!</p>}
              </form>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-[#18211D]">
            <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-4 h-4" /> Segurança</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <Input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nova senha" />
                <Input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmar nova senha" />
                <Button type="button" variant="ghost" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</Button>
                <Button type="submit" disabled={isUpdatingPassword}>Alterar senha</Button>
                {passwordSuccess && <p className="text-xs text-emerald-500">Senha atualizada!</p>}
                {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
              </form>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-[#18211D]">
            <CardContent className="p-5">
              <Button variant="danger" onClick={() => signOut()} className="w-full gap-2"><LogOut className="w-4 h-4" /> Sair da Conta</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
