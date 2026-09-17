import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { POUPAGAIO_MASCOT_URL } from '../../assets/mascot';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  ShoppingBag,
  Target,
  FileText,
  CreditCard,
  Gift,
  CalendarCheck,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { ActiveTab } from '../../types';

interface DashboardHomeProps {
  onSelectTab: (tab: ActiveTab) => void;
}

export function DashboardHome({ onSelectTab }: DashboardHomeProps) {
  const { profile, user, currentSpace, isSchemaPending } = useAuth();
  const [showInfoModal, setShowInfoModal] = useState(false);

  const fullName = profile?.full_name || user?.full_name || user?.email?.split('@')[0] || 'Amigo(a)';
  const firstName = fullName.split(' ')[0];

  const quickModules = [
    { id: 'entries' as ActiveTab, label: 'Entradas', icon: ArrowUpRight, desc: 'Gerencie suas receitas e ganhos' },
    { id: 'variable_expenses' as ActiveTab, label: 'Gastos Variáveis', icon: CreditCard, desc: 'Controle despesas do dia a dia' },
    { id: 'fixed_expenses' as ActiveTab, label: 'Gastos Fixos', icon: FileText, desc: 'Contas recorrentes e assinaturas' },
    { id: 'market' as ActiveTab, label: 'Mercado', icon: ShoppingBag, desc: 'Listas e compras de supermercado' },
    { id: 'investments' as ActiveTab, label: 'Investimentos', icon: TrendingUp, desc: 'Acompanhe seu patrimônio' },
    { id: 'goals' as ActiveTab, label: 'Metas', icon: Target, desc: 'Objetivos financeiros' },
    { id: 'wishlist' as ActiveTab, label: 'Lista de Desejos', icon: Gift, desc: 'Desejos e sonhos futuros' },
    { id: 'closing' as ActiveTab, label: 'Fechamento', icon: CalendarCheck, desc: 'Balanço mensal' },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 pb-24 md:pb-8 animate-in fade-in duration-300">
      {/* Top Greeting & System Status Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16A66A]/10 text-[#075C45] dark:bg-[#16A66A]/20 dark:text-[#78D9A6] text-xs font-semibold mb-2">
            <span>Espaço Ativo:</span>
            <span className="font-bold">{currentSpace?.name || 'Pessoal'}</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold font-display text-[#202724] dark:text-[#F7F4EA] tracking-tight">
            Olá, {firstName} 👋
          </h1>
          <p className="text-sm text-[#5E6963] dark:text-[#95A39B] mt-1">
            Aqui está o panorama geral da sua saúde financeira.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isSchemaPending ? (
            <div className="px-3.5 py-2 rounded-2xl bg-[#D6A84B]/15 border border-[#D6A84B]/30 text-xs font-medium text-[#8c6511] dark:text-[#F2D58A] flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>Configuração do Banco Pendente</span>
            </div>
          ) : (
            <div className="px-3.5 py-2 rounded-2xl bg-[#075C45]/10 border border-[#16A66A]/20 text-xs font-medium text-[#075C45] dark:text-[#78D9A6] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16A66A]" />
              <span>Sincronizado com Supabase</span>
            </div>
          )}
        </div>
      </div>

      {/* 4 Overview Metric Cards (Prepared for future data with real empty states R$ 0,00) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-[#E8E4D5] dark:border-[#24312B] bg-white dark:bg-[#18211D] shadow-xs">
          <div className="flex items-center justify-between text-[#5E6963] dark:text-[#95A39B] mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Saldo Atual</span>
            <div className="w-8 h-8 rounded-xl bg-[#075C45]/10 text-[#075C45] dark:bg-[#16A66A]/20 dark:text-[#78D9A6] flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold font-display text-[#202724] dark:text-[#F7F4EA]">
              R$ 0,00
            </div>
            <p className="text-[11px] text-[#5E6963] dark:text-[#95A39B]">
              Atualizado agora
            </p>
          </div>
        </Card>

        <Card className="p-5 border-[#E8E4D5] dark:border-[#24312B] bg-white dark:bg-[#18211D] shadow-xs">
          <div className="flex items-center justify-between text-[#5E6963] dark:text-[#95A39B] mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Entradas do Mês</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400">
              R$ 0,00
            </div>
            <p className="text-[11px] text-[#5E6963] dark:text-[#95A39B]">
              Nenhum registro este mês
            </p>
          </div>
        </Card>

        <Card className="p-5 border-[#E8E4D5] dark:border-[#24312B] bg-white dark:bg-[#18211D] shadow-xs">
          <div className="flex items-center justify-between text-[#5E6963] dark:text-[#95A39B] mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Gastos do Mês</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold font-display text-[#202724] dark:text-[#F7F4EA]">
              R$ 0,00
            </div>
            <p className="text-[11px] text-[#5E6963] dark:text-[#95A39B]">
              0% do planejado
            </p>
          </div>
        </Card>

        <Card className="p-5 border-[#E8E4D5] dark:border-[#24312B] bg-white dark:bg-[#18211D] shadow-xs">
          <div className="flex items-center justify-between text-[#5E6963] dark:text-[#95A39B] mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Economia do Mês</span>
            <div className="w-8 h-8 rounded-xl bg-[#D6A84B]/15 text-[#D6A84B] dark:bg-[#D6A84B]/25 dark:text-[#F2D58A] flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold font-display text-[#202724] dark:text-[#F7F4EA]">
              R$ 0,00
            </div>
            <p className="text-[11px] text-[#5E6963] dark:text-[#95A39B]">
              Taxa de poupança 0%
            </p>
          </div>
        </Card>
      </div>

      {/* Hero Welcome Banner with Mascot */}
      <Card className="overflow-hidden border-[#E8E4D5] dark:border-[#24312B] bg-gradient-to-r from-white via-[#F7F4EA]/50 to-white dark:from-[#18211D] dark:via-[#141C18] dark:to-[#18211D]">
        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl overflow-hidden border-2 border-[#16A66A]/30 bg-[#F7F4EA] dark:bg-[#101614] p-2 shrink-0 shadow-md">
            <img
              src={POUPAGAIO_MASCOT_URL}
              alt="Mascote Poupagaio"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain rounded-2xl"
            />
          </div>
          <div className="flex-1 space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#16A66A]/15 text-[#075C45] dark:bg-[#16A66A]/20 dark:text-[#78D9A6] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dica do Poupagaio</span>
            </div>
            <h2 className="text-xl font-bold font-display text-[#075C45] dark:text-[#78D9A6]">
              Organize hoje. Voe mais longe.
            </h2>
            <p className="text-sm text-[#5E6963] dark:text-[#95A39B] leading-relaxed">
              Explore os módulos abaixo para registrar suas entradas, controlar gastos variáveis e gerenciar suas metas. A interface está pronta para receber seus dados financeiros de forma segura e privada.
            </p>
            <div className="pt-1">
              <Button
                variant="primary"
                size="sm"
                onClick={() => onSelectTab('entries')}
                className="gap-2"
              >
                <span>Começar Lançamentos</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Navigation Modules Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold font-display text-[#202724] dark:text-[#F7F4EA]">
            Módulos do Poupagaio
          </h3>
          <span className="text-xs text-[#5E6963] dark:text-[#95A39B]">
            Selecione um módulo para navegar
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => onSelectTab(mod.id)}
                className="group p-5 rounded-2xl border border-[#E8E4D5] dark:border-[#24312B] bg-white dark:bg-[#18211D] hover:border-[#16A66A] dark:hover:border-[#16A66A] hover:shadow-md transition-all text-left flex flex-col justify-between cursor-pointer"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#075C45]/10 text-[#075C45] dark:bg-[#16A66A]/25 dark:text-[#78D9A6] flex items-center justify-center group-hover:bg-[#16A66A] group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#202724] dark:text-[#F7F4EA] group-hover:text-[#075C45] dark:group-hover:text-[#78D9A6] transition-colors">
                      {mod.label}
                    </h4>
                    <p className="text-xs text-[#5E6963] dark:text-[#95A39B] mt-1 line-clamp-2">
                      {mod.desc}
                    </p>
                  </div>
                </div>
                <div className="pt-4 flex items-center justify-between text-xs font-semibold text-[#16A66A] opacity-0 group-hover:opacity-150 transition-opacity">
                  <span>Acessar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
