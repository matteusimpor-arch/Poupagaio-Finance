/**
 * Utilitários de formatação para moeda e data no padrão brasileiro
 */

export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Converte string digitada para valor numérico positivo.
 * Suporta formatos: "1500,50", "1.500,50", "1500.50", "R$ 1.500,50"
 */
export function parseCurrencyInput(raw: string): number {
  if (!raw) return 0;
  // Remove símbolos não numéricos, exceto vírgula e ponto
  let clean = raw.replace(/[^\d.,]/g, '').trim();

  // Se tem vírgula como separador decimal (ex: 1.500,50 ou 1500,50)
  if (clean.includes(',')) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  }

  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

/**
 * Converte data ISO 'YYYY-MM-DD' para 'DD/MM/AAAA'
 */
export function formatDateBR(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  // Se já estiver no formato YYYY-MM-DD
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  } catch {
    return dateStr;
  }
}

/**
 * Retorna a data atual no formato 'YYYY-MM-DD' considerando o fuso horário local
 */
export function getISODateToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export function getMonthNameBR(month: number): string {
  return MONTH_NAMES[month - 1] || '';
}

export function getMonthYearLabel(year: number, month: number): string {
  const name = getMonthNameBR(month);
  return `${name} de ${year}`;
}

/**
 * Calcula data inicial e final do mês no formato 'YYYY-MM-DD'
 */
export function getMonthDateRange(year: number, month: number): { startDate: string; endDate: string } {
  const startMonthStr = String(month).padStart(2, '0');
  const startDate = `${year}-${startMonthStr}-01`;

  // Último dia do mês: dia 0 do mês seguinte
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${startMonthStr}-${String(lastDay).padStart(2, '0')}`;

  return { startDate, endDate };
}
