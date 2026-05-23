/**
 * Indicadores técnicos para análise de mercado
 * Inclui RSI, EMA e análise de volume
 */

/**
 * Calcula o RSI (Relative Strength Index) para um período
 * @param prices Array de preços de fechamento
 * @param period Período do RSI (padrão: 14)
 * @returns Valor do RSI entre 0 e 100
 */
export function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) {
    return 50; // Retorna neutro se não houver dados suficientes
  }

  let gains = 0;
  let losses = 0;

  // Calcula ganhos e perdas iniciais
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Suavização de Wilder para períodos subsequentes
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
    }
  }

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/**
 * Calcula a EMA (Exponential Moving Average)
 * @param prices Array de preços
 * @param period Período da EMA
 * @returns Array de valores EMA
 */
export function calculateEMA(prices: number[], period: number): number[] {
  if (prices.length < period) return [];

  const multiplier = 2 / (period + 1);
  const ema: number[] = [];

  // Primeira EMA é a média simples dos primeiros 'period' valores
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
  }
  ema.push(sum / period);

  // EMA subsequentes
  for (let i = period; i < prices.length; i++) {
    const currentEMA = (prices[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
    ema.push(currentEMA);
  }

  return ema;
}

/**
 * Retorna o último valor da EMA
 */
export function getLastEMA(prices: number[], period: number): number {
  const ema = calculateEMA(prices, period);
  return ema.length > 0 ? ema[ema.length - 1] : 0;
}

/**
 * Analisa o volume para detectar volume acima da média
 * @param volumes Array de volumes
 * @param period Período para média de volume
 * @returns true se volume atual está acima da média
 */
export function isVolumeHigh(volumes: number[], period: number = 20): boolean {
  if (volumes.length < period) return false;

  const recent = volumes.slice(-period);
  const avgVolume = recent.reduce((a, b) => a + b, 0) / period;
  const lastVolume = volumes[volumes.length - 1];

  return lastVolume > avgVolume * 1.2; // 20% acima da média
}

/**
 * Análise completa para decisão de trading
 */
export interface TradingSignal {
  action: 'BUY' | 'SELL' | 'HOLD';
  rsi: number;
  ema20: number;
  ema50: number;
  trend: 'UP' | 'DOWN' | 'NEUTRAL';
  confidence: number; // 0 a 1
  reason: string;
}

/**
 * Gera um sinal de trading baseado nos indicadores
 * @param closes Array de preços de fechamento (do mais antigo ao mais recente)
 * @param volumes Array de volumes
 * @param currentPnlPercent Percentual de lucro/perda atual da posição aberta
 */
export function generateSignal(
  closes: number[],
  volumes: number[],
  currentPnlPercent: number = 0
): TradingSignal {
  if (closes.length < 50) {
    return {
      action: 'HOLD',
      rsi: 50,
      ema20: 0,
      ema50: 0,
      trend: 'NEUTRAL',
      confidence: 0,
      reason: 'Dados insuficientes para análise',
    };
  }

  const rsi = calculateRSI(closes);
  const ema20 = getLastEMA(closes, 20);
  const ema50 = getLastEMA(closes, 50);
  const highVolume = isVolumeHigh(volumes);

  // Determina tendência
  const trend: 'UP' | 'DOWN' | 'NEUTRAL' =
    ema20 > ema50 ? 'UP' : ema20 < ema50 ? 'DOWN' : 'NEUTRAL';

  // ========================================
  // LÓGICA DE COMPRA (BUY)
  // Critérios: RSI < 35 (oversold) E EMA20 > EMA50 (uptrend)
  // ========================================
  if (rsi < 35 && trend === 'UP' && currentPnlPercent === 0) {
    const confidence = Math.min(0.9, (35 - rsi) / 35 + (highVolume ? 0.1 : 0));
    return {
      action: 'BUY',
      rsi,
      ema20,
      ema50,
      trend,
      confidence,
      reason: `RSI sobrevendido (${rsi.toFixed(1)}) + tendência de alta`,
    };
  }

  // ========================================
  // LÓGICA DE VENDA (SELL)
  // Critérios: RSI > 65 OU stop-loss atingido
  // ========================================
  if (currentPnlPercent !== 0) {
    // Stop-loss: -1%
    if (currentPnlPercent <= -1) {
      return {
        action: 'SELL',
        rsi,
        ema20,
        ema50,
        trend,
        confidence: 0.95,
        reason: `Stop-loss acionado (${currentPnlPercent.toFixed(2)}%)`,
      };
    }

    // Take-profit por RSI
    if (rsi > 65) {
      const confidence = Math.min(0.9, (rsi - 65) / 35);
      return {
        action: 'SELL',
        rsi,
        ema20,
        ema50,
        trend,
        confidence,
        reason: `RSI sobrecomprado (${rsi.toFixed(1)})`,
      };
    }

    // Tendência inverteu
    if (trend === 'DOWN' && currentPnlPercent > 0) {
      return {
        action: 'SELL',
        rsi,
        ema20,
        ema50,
        trend,
        confidence: 0.7,
        reason: 'Tendência reverteu para baixa',
      };
    }
  }

  return {
    action: 'HOLD',
    rsi,
    ema20,
    ema50,
    trend,
    confidence: 0,
    reason: 'Aguardando sinal',
  };
}
