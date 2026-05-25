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

import { zapiaBridge } from './ZapiaBridge';

export interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
}

export interface TradingState {
  isActive: boolean;
  isDemoMode: boolean;
  selectedSymbol: string;    // Símbolo selecionado (ex: BTCBRL)
  availableSymbols: string[]; // Lista de símbolos disponíveis
  currentPrice: number;
  usdtBalance: number;       // Saldo em USDT
  spendingLimitPercent: number; // % do saldo a usar por trade
  profitUSD: number;
  profitBRL: number;
  profitGoalBRL: number;
  openTrade: OpenTrade | null;
  lastSignal: string;
  logs: LogEntry[];          // Histórico recente
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
  highestPrice: number; // Para Trailing Stop
}

// Callbacks para atualização do estado
type StateUpdateCallback = (state: Partial<TradingState>) => void;

class TradingEngine {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private klineBuffer: KlineData[] = [];
  private state: TradingState = {
    isActive: false,
    isDemoMode: true,        // MODO DEMO habilitado por padrão (segurança)
    selectedSymbol: 'BTCBRL',
    availableSymbols: ['BTCBRL', 'ETHBRL', 'SOLBRL', 'DOGEBRL', 'BNBBRL'],
    currentPrice: 0,
    usdtBalance: 0,
    spendingLimitPercent: 1.5, // 1.5% por padrão
    profitUSD: 0,
    profitBRL: 0,
    profitGoalBRL: 200,
    openTrade: null,
    lastSignal: 'Aguardando...',
    logs: [],
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
    
    // Sincroniza com Zapia
    zapiaBridge.syncState(this.getState());
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
   * Define o limite de gasto por trade (%)
   */
  setSpendingLimit(percent: number): void {
    this.emit({ spendingLimitPercent: percent });
  }

  /**
   * Inicia o motor de trading
   * Verifica indicadores a cada 30 segundos
   */
  async start(apiKey: string, secretKey: string): Promise<void> {
    if (this.state.isActive) return;

    console.log('[TradingEngine] Iniciando motor de trading...');
    this.emit({ isActive: true, error: null });
    this.addLog(`Iniciando IA (${this.state.isDemoMode ? 'Modo Demo' : 'Modo Real'})`, 'INFO');

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
    
    this.addLog('IA Interrompida pelo usuário', 'WARNING');

    this.emit({
      isActive: false,
      lastSignal: 'Motor parado',
      openTrade: null,
    });
  }

  /**
   * Altera o símbolo de trading
   */
  async setSymbol(symbol: string): Promise<void> {
    if (this.state.openTrade) {
      this.addLog('Não é possível mudar o símbolo com posição aberta', 'WARNING');
      return;
    }
    
    this.emit({ selectedSymbol: symbol, lastSignal: `Símbolo alterado para ${symbol}` });
    this.klineBuffer = [];
    
    if (this.state.isActive) {
      await this.loadInitialData();
    }
  }

  /**
   * Carrega dados históricos de klines
   */
  private async loadInitialData(): Promise<void> {
    try {
      this.klineBuffer = await binanceAPI.getKlines(this.state.selectedSymbol, '5m', 100);
      const lastClose = this.klineBuffer[this.klineBuffer.length - 1]?.close || 0;
      this.emit({ currentPrice: lastClose });
      console.log(`[TradingEngine] ${this.klineBuffer.length} candles carregados para ${this.state.selectedSymbol}`);
    } catch (error) {
      console.error('[TradingEngine] Erro ao carregar dados:', error);
      this.emit({ error: `Falha ao carregar dados de ${this.state.selectedSymbol}` });
    }
  }

  /**
   * Ciclo principal de trading
   * Busca novos dados, analisa indicadores e executa ordens se necessário
   */
  private async runCycle(): Promise<void> {
    if (!this.state.isActive) return;

    try {
      // 0. Atualiza saldo da Binance
      let currentBalance = 0;
      if (this.state.isDemoMode) {
        currentBalance = 1000; // Demo fixo em $1000 por enquanto
      } else {
        try {
          currentBalance = await binanceAPI.getBalance('USDT');
        } catch (e) {
          console.warn('[TradingEngine] Falha ao atualizar saldo real');
          currentBalance = this.state.usdtBalance; // Mantém o último
        }
      }
      this.emit({ usdtBalance: currentBalance });

      // 0. Verifica comandos remotos do Zapia
      const commands = await zapiaBridge.getCommands();
      if (commands.includes('STOP')) {
        console.log('[TradingEngine] Comando remoto: STOP');
        await this.stop();
        return;
      }
      if (commands.includes('RESET_PROFIT')) {
        this.resetProfit();
      }

      // 1. Atualiza dados de mercado
      const newKlines = await binanceAPI.getKlines(this.state.selectedSymbol, '5m', 5);
      this.klineBuffer = [...this.klineBuffer.slice(-95), ...newKlines];

      const closes = this.klineBuffer.map(k => k.close);
      const volumes = this.klineBuffer.map(k => k.volume);
      const currentPrice = closes[closes.length - 1];
      this.emit({ currentPrice, lastUpdate: Date.now() });

      // 2. Atualiza PnL e Trailing Stop da posição aberta
      if (this.state.openTrade) {
        const buyPrice = this.state.openTrade.buyPrice;
        const highestPrice = Math.max(this.state.openTrade.highestPrice, currentPrice);
        const pnlPercent = ((currentPrice - buyPrice) / buyPrice) * 100;
        const pnlUSD = (currentPrice - buyPrice) * this.state.openTrade.quantity;
        
        // Distância do topo (Trailing Stop)
        const dropFromHigh = ((highestPrice - currentPrice) / highestPrice) * 100;

        this.emit({
          openTrade: {
            ...this.state.openTrade,
            currentPnlPercent: pnlPercent,
            currentPnlUSD: pnlUSD,
            highestPrice: highestPrice,
          },
        });

        // 2.1 Verifica gatilho do Trailing Stop (ex: caiu 0.5% do topo estando no lucro)
        if (pnlPercent > 0.2 && dropFromHigh >= 0.5) {
          console.log(`[TradingEngine] 📉 Trailing Stop acionado! Queda de ${dropFromHigh.toFixed(2)}% do topo.`);
          await this.closeTrade(`Trailing Stop acionado (${dropFromHigh.toFixed(2)}% do topo)`);
          return;
        }
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

      // Usa porcentagem configurada do saldo disponível
      const tradeAmountUSDT = usdtBalance * (this.state.spendingLimitPercent / 100);
      const quantity = tradeAmountUSDT / currentPrice;

      console.log(
        `[TradingEngine] ${this.state.isDemoMode ? '[DEMO]' : '[REAL]'} Comprando ` +
        `${quantity.toFixed(6)} ${this.state.selectedSymbol} @ $${currentPrice.toFixed(2)}`
      );

      let order;
      if (this.state.isDemoMode) {
        order = await binanceAPI.simulateBuyOrder(this.state.selectedSymbol, quantity, currentPrice);
      } else {
        // ⚠️  OPERAÇÃO REAL
        order = await binanceAPI.placeBuyOrder(this.state.selectedSymbol, quantity);
      }

      this.addLog(`COMPRA: ${this.state.selectedSymbol} @ $${order.price.toFixed(2)}`, 'SUCCESS');

      this.emit({
        openTrade: {
          symbol: this.state.selectedSymbol,
          buyPrice: order.price,
          quantity: order.quantity,
          buyTimestamp: order.timestamp,
          currentPnlPercent: 0,
          currentPnlUSD: 0,
          highestPrice: order.price,
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

      this.addLog(
        `VENDA: ${symbol} @ $${order.price.toFixed(2)} | ` +
        `Lucro: ${profitBRL >= 0 ? '+' : ''}R$${profitBRL.toFixed(2)}`,
        profitBRL >= 0 ? 'SUCCESS' : 'ERROR'
      );

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
   * Adiciona uma entrada ao diário de operações
   */
  private addLog(message: string, type: LogEntry['type'] = 'INFO'): void {
    const newLog: LogEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      timestamp: Date.now(),
      message,
      type,
    };
    
    const newLogs = [newLog, ...this.state.logs].slice(0, 10); // Mantém apenas os 10 últimos
    this.emit({ logs: newLogs });
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
