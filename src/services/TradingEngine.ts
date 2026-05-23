/**
 * Motor de Trading com IA
 * Executa a lógica de decisão automatizada baseada em indicadores técnicos
 * 
 * ⚠️  MODO DEMO vs MODO REAL:
 *     - DEMO (padrão): Simula operações sem usar a API real da Binance
 *     - REAL: Executa ordens reais — use com cuidado!
 */
import { binanceAPI, KlineData } from './BinanceAPI';
import { generateSignal } from '../utils/indicators';
import { saveTrade, TradeRecord } from '../utils/storage';

export interface TradingState {
  isActive: boolean;
  isDemoMode: boolean;
  currentPrice: number;
  profitUSD: number;
  profitBRL: number;
  profitGoalBRL: number;
  openTrade: OpenTrade | null;
  lastSignal: string;
  rsi: number;
  trend: string;
  ema20: number;
  ema50: number;
  usdBrlRate: number;
  totalTrades: number;
  successfulTrades: number;
  lastUpdate: number;
  error: string | null;
}

export interface OpenTrade {
  symbol: string;
  buyPrice: number;
  quantity: number;
  buyTimestamp: number;
  currentPnlPercent: number;
  currentPnlUSD: number;
}

// Callbacks para atualização do estado
type StateUpdateCallback = (state: Partial<TradingState>) => void;

class TradingEngine {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private klineBuffer: KlineData[] = [];
  private state: TradingState = {
    isActive: false,
    isDemoMode: true,        // MODO DEMO habilitado por padrão (segurança)
    currentPrice: 0,
    profitUSD: 0,
    profitBRL: 0,
    profitGoalBRL: 200,
    openTrade: null,
    lastSignal: 'Aguardando...',
    rsi: 50,
    trend: 'NEUTRAL',
    ema20: 0,
    ema50: 0,
    usdBrlRate: 5.0,
    totalTrades: 0,
    successfulTrades: 0,
    lastUpdate: Date.now(),
    error: null,
  };

  private onStateUpdate: StateUpdateCallback | null = null;

  /**
   * Registra callback de atualização de estado
   */
  setStateUpdateCallback(callback: StateUpdateCallback): void {
    this.onStateUpdate = callback;
  }

  /**
   * Emite atualização de estado para os ouvintes
   */
  private emit(partial: Partial<TradingState>): void {
    Object.assign(this.state, partial);
    this.onStateUpdate?.(partial);
  }

  /**
   * Retorna o estado atual
   */
  getState(): TradingState {
    return { ...this.state };
  }

  /**
   * Configura o modo (DEMO ou REAL)
   */
  setDemoMode(isDemo: boolean): void {
    this.state.isDemoMode = isDemo;
    console.log(`[TradingEngine] Modo ${isDemo ? 'DEMO' : '⚠️  REAL'} ativado`);
  }

  /**
   * Define a meta de lucro em BRL
   */
  setProfitGoal(goalBRL: number): void {
    this.emit({ profitGoalBRL: goalBRL });
  }

  /**
   * Inicia o motor de trading
   * Verifica indicadores a cada 30 segundos
   */
  async start(apiKey: string, secretKey: string): Promise<void> {
    if (this.state.isActive) return;

    console.log('[TradingEngine] Iniciando motor de trading...');
    this.emit({ isActive: true, error: null });

    // Configura credenciais
    binanceAPI.setCredentials(apiKey, secretKey);

    // Busca taxa de câmbio
    try {
      const rate = await binanceAPI.getUSDtoBRLRate();
      this.emit({ usdBrlRate: rate });
    } catch {
      console.warn('[TradingEngine] Usando taxa de câmbio padrão');
    }

    // Carrega dados históricos iniciais
    await this.loadInitialData();

    // Executa ciclo imediatamente
    await this.runCycle();

    // Agenda ciclos a cada 30 segundos
    this.intervalId = setInterval(async () => {
      if (this.state.isActive) {
        await this.runCycle();
      }
    }, 30000);
  }

  /**
   * Para o motor de trading
   */
  async stop(): Promise<void> {
    console.log('[TradingEngine] Parando motor de trading...');

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Se houver posição aberta, vende ao parar
    if (this.state.openTrade) {
      await this.closeTrade('Motor parado manualmente');
    }

    this.emit({
      isActive: false,
      lastSignal: 'Motor parado',
      openTrade: null,
    });
  }

  /**
   * Carrega dados históricos de klines
   */
  private async loadInitialData(): Promise<void> {
    try {
      this.klineBuffer = await binanceAPI.getKlines('BTCUSDT', '5m', 100);
      const lastClose = this.klineBuffer[this.klineBuffer.length - 1]?.close || 0;
      this.emit({ currentPrice: lastClose });
      console.log(`[TradingEngine] ${this.klineBuffer.length} candles carregados`);
    } catch (error) {
      console.error('[TradingEngine] Erro ao carregar dados:', error);
      this.emit({ error: 'Falha ao carregar dados de mercado' });
    }
  }

  /**
   * Ciclo principal de trading
   * Busca novos dados, analisa indicadores e executa ordens se necessário
   */
  private async runCycle(): Promise<void> {
    if (!this.state.isActive) return;

    try {
      // 1. Atualiza dados de mercado
      const newKlines = await binanceAPI.getKlines('BTCUSDT', '5m', 5);

      // Atualiza buffer mantendo os últimos 100 candles
      this.klineBuffer = [...this.klineBuffer.slice(-95), ...newKlines];

      const closes = this.klineBuffer.map(k => k.close);
      const volumes = this.klineBuffer.map(k => k.volume);
      const currentPrice = closes[closes.length - 1];

      this.emit({ currentPrice, lastUpdate: Date.now() });

      // 2. Atualiza PnL da posição aberta
      if (this.state.openTrade) {
        const buyPrice = this.state.openTrade.buyPrice;
        const pnlPercent = ((currentPrice - buyPrice) / buyPrice) * 100;
        const pnlUSD = (currentPrice - buyPrice) * this.state.openTrade.quantity;

        this.emit({
          openTrade: {
            ...this.state.openTrade,
            currentPnlPercent: pnlPercent,
            currentPnlUSD: pnlUSD,
          },
        });
      }

      // 3. Verifica se meta foi atingida
      if (this.state.profitBRL >= this.state.profitGoalBRL) {
        console.log('[TradingEngine] 🎯 Meta de lucro atingida!');
        this.emit({ lastSignal: `🎯 Meta atingida! R$ ${this.state.profitBRL.toFixed(2)}` });
        await this.stop();
        return;
      }

      // 4. Gera sinal de trading
      const pnlPercent = this.state.openTrade?.currentPnlPercent || 0;
      const signal = generateSignal(closes, volumes, pnlPercent);

      this.emit({
        rsi: signal.rsi,
        trend: signal.trend,
        ema20: signal.ema20,
        ema50: signal.ema50,
        lastSignal: signal.reason,
      });

      console.log(
        `[TradingEngine] Sinal: ${signal.action} | RSI: ${signal.rsi.toFixed(1)} | Tendência: ${signal.trend}`
      );

      // 5. Executa ação baseada no sinal
      if (signal.action === 'BUY' && !this.state.openTrade) {
        await this.openTrade(currentPrice, signal.reason);
      } else if (signal.action === 'SELL' && this.state.openTrade) {
        await this.closeTrade(signal.reason);
      }

    } catch (error: any) {
      const msg = error?.message || 'Erro no ciclo de trading';
      console.error('[TradingEngine] Erro no ciclo:', msg);
      this.emit({ error: msg });
    }
  }

  /**
   * Abre uma nova posição de compra
   * Usa 1-2% do saldo disponível (microtrade)
   */
  private async openTrade(currentPrice: number, reason: string): Promise<void> {
    try {
      let usdtBalance: number;

      if (this.state.isDemoMode) {
        // DEMO: saldo simulado de $1000
        usdtBalance = 1000;
      } else {
        // REAL: busca saldo real
        usdtBalance = await binanceAPI.getBalance('USDT');
      }

      if (usdtBalance < 10) {
        this.emit({ lastSignal: 'Saldo insuficiente para operar' });
        return;
      }

      // Usa 1.5% do saldo disponível
      const tradeAmountUSDT = usdtBalance * 0.015;
      const quantity = tradeAmountUSDT / currentPrice;

      console.log(
        `[TradingEngine] ${this.state.isDemoMode ? '[DEMO]' : '[REAL]'} Comprando ` +
        `${quantity.toFixed(6)} BTC @ $${currentPrice.toFixed(2)}`
      );

      let order;
      if (this.state.isDemoMode) {
        order = await binanceAPI.simulateBuyOrder('BTCUSDT', quantity, currentPrice);
      } else {
        // ⚠️  OPERAÇÃO REAL
        order = await binanceAPI.placeBuyOrder('BTCUSDT', quantity);
      }

      this.emit({
        openTrade: {
          symbol: 'BTCUSDT',
          buyPrice: order.price,
          quantity: order.quantity,
          buyTimestamp: order.timestamp,
          currentPnlPercent: 0,
          currentPnlUSD: 0,
        },
        lastSignal: `${this.state.isDemoMode ? '[DEMO] ' : ''}COMPRA @ $${order.price.toFixed(2)} — ${reason}`,
        error: null,
      });

    } catch (error: any) {
      console.error('[TradingEngine] Erro ao abrir posição:', error?.message);
      this.emit({ error: `Falha na compra: ${error?.message}` });
    }
  }

  /**
   * Fecha a posição aberta (venda)
   */
  private async closeTrade(reason: string): Promise<void> {
    if (!this.state.openTrade) return;

    try {
      const { symbol, buyPrice, quantity } = this.state.openTrade;
      const currentPrice = this.state.currentPrice;

      console.log(
        `[TradingEngine] ${this.state.isDemoMode ? '[DEMO]' : '[REAL]'} Vendendo ` +
        `${quantity.toFixed(6)} BTC @ $${currentPrice.toFixed(2)}`
      );

      let order;
      if (this.state.isDemoMode) {
        order = await binanceAPI.simulateSellOrder(symbol, quantity, currentPrice);
      } else {
        // ⚠️  OPERAÇÃO REAL
        order = await binanceAPI.placeSellOrder(symbol, quantity);
      }

      // Calcula lucro
      const profitUSD = (order.price - buyPrice) * quantity;
      const profitBRL = profitUSD * this.state.usdBrlRate;

      const newTotalProfitUSD = this.state.profitUSD + profitUSD;
      const newTotalProfitBRL = this.state.profitBRL + profitBRL;
      const newTotalTrades = this.state.totalTrades + 1;
      const newSuccessful = profitUSD > 0
        ? this.state.successfulTrades + 1
        : this.state.successfulTrades;

      // Registra no histórico
      const record: TradeRecord = {
        id: order.orderId.toString(),
        type: 'SELL',
        symbol,
        price: order.price,
        quantity,
        profitUSD,
        profitBRL,
        timestamp: order.timestamp,
        isDemo: this.state.isDemoMode,
      };
      await saveTrade(record);

      this.emit({
        openTrade: null,
        profitUSD: newTotalProfitUSD,
        profitBRL: newTotalProfitBRL,
        totalTrades: newTotalTrades,
        successfulTrades: newSuccessful,
        lastSignal:
          `${this.state.isDemoMode ? '[DEMO] ' : ''}VENDA @ $${order.price.toFixed(2)} | ` +
          `Lucro: ${profitBRL >= 0 ? '+' : ''}R$${profitBRL.toFixed(2)} — ${reason}`,
        error: null,
      });

    } catch (error: any) {
      console.error('[TradingEngine] Erro ao fechar posição:', error?.message);
      this.emit({ error: `Falha na venda: ${error?.message}` });
    }
  }

  /**
   * Reseta o lucro acumulado (para nova sessão)
   */
  resetProfit(): void {
    this.emit({ profitUSD: 0, profitBRL: 0, totalTrades: 0, successfulTrades: 0 });
  }
}

// Exporta instância singleton do motor
export const tradingEngine = new TradingEngine();
