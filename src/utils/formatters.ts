/**
 * Utilitários de formatação de números e datas
 */

/**
 * Formata um valor em BRL (Reais brasileiros)
 */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formata um valor em USD
 */
export function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
}

/**
 * Formata um número com casas decimais específicas
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

/**
 * Formata percentual
 */
export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Formata timestamp para hora legível
 */
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Formata timestamp para data e hora
 */
export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formata duração em horas para texto legível
 */
export function formatDuration(hours: number): string {
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes} min`;
  }
  if (hours === 1) return '1 hora';
  if (hours < 24) return `${hours} horas`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (remainingHours === 0) return `${days} dia${days > 1 ? 's' : ''}`;
  return `${days}d ${remainingHours}h`;
}

/**
 * Mascara a API key para exibição segura
 */
export function maskApiKey(key: string): string {
  if (!key || key.length < 8) return '****';
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
}

/**
 * Converte USD para BRL usando taxa fixa ou dinâmica
 * Taxa padrão: 5.00 (pode ser atualizada dinamicamente)
 */
export function usdToBRL(usdAmount: number, rate: number = 5.0): number {
  return usdAmount * rate;
}
