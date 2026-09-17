import React from 'react';
import { ActiveTab } from '../../types';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import {
  ArrowUpRight,
  CreditCard,
  FileText,
  ShoppingBag,
  TrendingUp,
  Target,
  Gift,
  CalendarCheck,
  ArrowLeft,
  Sparkles,
  Layers,
} from 'lucide-react';

interface ModulePlaceholderProps {
  tab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

const moduleDetails: Record<ActiveTab, { title: string; subtitle: string; icon: React.ElementType; description: string; highlights: string[] }> = {
  home: {
    title: 'Início',
    subtitle: 'Visão geral financeira',
    icon: Sparkles,
    description: 'Painel principal de controle financeiro.',
    highlights: ['Saldo consolidado', 'Resumo mensal', 'Acesso rápido aos módulos'],
  },
  entries: {
    title: 'Entradas',
    subtitle: 'Receitas e ganhos',
    icon: ArrowUpRight,
    description: 'Gerencie salários, freelances, rendimentos e outras fontes de receita de forma organizada.',
    highlights: ['Categorização por fonte', 'Recorrência mensal', 'Histórico detalhado'],
  },
  fixed_expenses: {
    title: 'Gastos Fixos',
    subtitle: 'Contas recorrentes',
    icon: FileText,
    description: 'Controle aluguel, condomínio, internet, assinaturas e todas as obrigações fixas mensais.',
    highlights: ['Lembretes de vencimento', 'Controle de assinaturas', 'Impacto no orçamento'],
  },
  variable_expenses: {
    title: 'Gastos Variáveis',
    subtitle: 'Despesas do dia a dia',
    icon: CreditCard,
    description: 'Acompanhe alimentação, lazer, transporte e despesas cotidianas sem complicações.',
    highlights: ['Gráficos por categoria', 'Limite de gastos', 'Lançamento rápido'],
  },
  installments: {
    title: 'Parcelados',
    subtitle: 'Compras a prazo e faturas',
    icon: CreditCard,
    description: 'Visualize parcelas futuras, cartões de crédito e compromissos financeiros a longo prazo.',
    highlights: ['Projeção de meses futuros', 'Controle por cartão', 'Parcelas restantes'],
  },
  market: {
    title: 'Mercado',
    subtitle: 'Listas e compras de supermercado',
    icon: ShoppingBag,
    description: 'Organize listas de compras e compare preços para economizar nas idas ao supermercado.',
    highlights: ['Listas inteligentes', 'Histórico de preços', 'Estimativa de gasto'],
  },
  investments: {
    title: 'Investimentos',
    subtitle: 'Patrimônio e rentabilidade',
    icon: TrendingUp,
    description: 'Acompanhe a evolução do seu patrimônio em renda fixa, variável e reservas de emergência.',
    highlights: ['Evolução patrimonial', 'Alocação de ativos', 'Dividendos e proventos'],
  },
  goals: {
    title: 'Metas',
    subtitle: 'Objetivos financeiros',
    icon: Target,
    description: 'Defina e alcance metas como viagem dos sonhos, compra de carro ou independência financeira.',
    highlights: ['Progresso visual', 'Aporte mensal sugerido', 'Prazos estimados'],
  },
  wishlist: {
    title: 'Lista de Desejos',
    subtitle: 'Sonhos e desejos de consumo',
    icon: Gift,
    description: 'Guarde desejos de consumo para planejar compras conscientes sem comprometer o orçamento.',
    highlights: ['Priorização de desejos', 'Meta de economia dedicada', 'Análise de custo-benefício'],
  },
  closing: {
    title: 'Fechamento do Mês',
    subtitle: 'Balanço e retrospectiva',
    icon: CalendarCheck,
    description: 'Analise o desempenho financeiro de cada mês e descubra onde você economizou mais.',
    highlights: ['Balanço comparativo', 'Taxa de poupança', 'Lições para o próximo mês'],
  },
  movements: {
    title: 'Movimentações',
    subtitle: 'Entradas e saídas financeiras',
    icon: ArrowUpRight,
    description: 'Central de controle de todas as movimentações financeiras, entradas, gastos fixos e variáveis.',
    highlights: ['Lançamento de receitas', 'Registro de despesas', 'Histórico completo'],
  },
  planning: {
    title: 'Planejamento',
    subtitle: 'Metas e projeções futuras',
    icon: Target,
    description: 'Gerencie metas, listas de desejos e projeções orçamentárias para o seu futuro financeiro.',
    highlights: ['Metas de economia', 'Lista de desejos', 'Acompanhamento de progresso'],
  },
  profile: {
    title: 'Perfil & Configurações',
    subtitle: 'Sua conta e preferências',
    icon: Layers,
    description: 'Gerencie suas informações pessoais, altere seu nome e personalize o Poupagaio Finance.',
    highlights: ['Dados da conta', 'Espaços de trabalho', 'Tema claro e escuro'],
  },
};

export function ModulePlaceholder({ tab, onSelectTab }: ModulePlaceholderProps) {
  const info = moduleDetails[tab] || moduleDetails.home;
  const Icon = info.icon;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-24 md:pb-8 animate-in fade-in duration-300">
      {/* Top Breadcrumb / Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onSelectTab('home')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#5E6963] dark:text-[#95A39B] hover:text-[#075C45] dark:hover:text-[#78D9A6] cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para o Início</span>
        </button>

        <span className="text-xs px-3 py-1 rounded-full bg-[#D6A84B]/15 text-[#8c6511] dark:text-[#F2D58A] font-semibold border border-[#D6A84B]/30">
          Funcionalidade em desenvolvimento
        </span>
      </div>

      {/* Main Module Header & Empty State Card */}
      <Card className="overflow-hidden border-[#E8E4D5] dark:border-[#24312B] bg-white dark:bg-[#18211D]">
        <CardContent className="p-8 md:p-12 text-center flex flex-col items-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-[#075C45]/10 text-[#075C45] dark:bg-[#16A66A]/20 dark:text-[#78D9A6] flex items-center justify-center shadow-xs">
            <Icon className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-lg">
            <div className="inline-block px-3 py-1 rounded-full bg-[#16A66A]/10 text-[#075C45] dark:bg-[#16A66A]/20 dark:text-[#78D9A6] text-xs font-bold uppercase tracking-wider">
              Funcionalidade em desenvolvimento.
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-display text-[#075C45] dark:text-[#78D9A6]">
              {info.title}
            </h1>
            <p className="text-sm font-medium text-[#5E6963] dark:text-[#95A39B]">
              {info.subtitle}
            </p>
            <p className="text-xs text-[#202724] dark:text-[#F7F4EA] pt-2 leading-relaxed">
              {info.description}
            </p>
          </div>

          {/* Highlights */}
          <div className="w-full max-w-md grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {info.highlights.map((h, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-[#F7F4EA] dark:bg-[#111614] border border-[#E8E4D5] dark:border-[#24312B] text-xs font-medium text-[#202724] dark:text-[#F7F4EA] flex items-center justify-center text-center"
              >
                {h}
              </div>
            ))}
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => onSelectTab('home')}
              className="gap-2 cursor-pointer"
            >
              <span>Ir para o Início</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
