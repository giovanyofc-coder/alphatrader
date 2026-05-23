/**
 * Serviço de integração com a API da Binance
 * Suporta autenticação HMAC-SHA256 para operações autenticadas
 * 
 * ⚠️  ATENÇÃO: As funções marcadas com [REAL TRADE] executam operações reais.
 *              Em MODO DEMO, são substituídas por simulações.
 */
import axios, { AxiosInstance } from 'axios';
import CryptoJS from 'crypto-js';

// URL base da API da Binance
const BINANCE_BASE_URL = 'https://api.binance.com';

// Taxa de conversão USD/BRL (fallback)
let USD_BRL_RATE = 5.0;

export interface KlineData {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
}

export interface AccountBalance {
  asset: string;
  free: number;
  locked: number;
}

export interface OrderResult {
  orderId: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  status: string;
  timestamp: number;
  isDemo: boolean;
}

class BinanceAPIService {
  private client: AxiosInstance;
  private apiKey: string = '';
  private secretKey: string = '';

  constructor() {
    this.client = axios.create({
      baseURL: BINANCE_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Configura as credenciais da API
   */
  setCredentials(apiKey: string, secretKey: string): void {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.client.defaults.headers['X-MBX-APIKEY'] = apiKey;
  }

  /**
   * Gera assinatura HMAC-SHA256 para requisições autenticadas
   */
  private sign(queryString: string): string {
    return CryptoJS.HmacSHA256(queryString, this.secretKey).toString(CryptoJS.enc.Hex);
  }

  /**
   * Testa a conectividade com a Binance
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/api/v3/ping');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Valida as credenciais de API
   * @throws Error se as credenciais forem inválidas
   */
  async validateCredentials(): Promise<{ valid: boolean; error?: string }> {
    if (!this.apiKey || !this.secretKey) {
      return { valid: false, error: 'API Key e Secret Key são obrigatórios' };
    }

    try {
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = this.sign(queryString);

      await this.client.get(`/api/v3/account?${queryString}&signature=${signature}`);
      return { valid: true };
    } catch (error: any) {
      const msg = error?.response?.data?.msg || 'Credenciais inválidas';
      if (error?.response?.status === 401) {
        return { valid: false, error: 'API Key inválida ou sem permissão' };
      }
      if (error?.response?.data?.code === -2014) {
        return { valid: false, error: 'Formato de API Key inválido' };
      }
      return { valid: false, error: msg };
    }
  }

  /**
   * Busca dados de candlestick (klines) históricos
   * @param symbol Par de trading (ex: BTCUSDT)
   * @param interval Intervalo (1m, 5m, 15m, 1h, etc.)
   * @param limit Quantidade de candles
   */
  async getKlines(
    symbol: string = 'BTCUSDT',
    interval: string = '5m',
    limit: number = 100
  ): Promise<KlineData[]> {
    try {
      const response = await this.client.get('/api/v3/klines', {
        params: { symbol, interval, limit },
      });

      return response.data.map((k: any[]) => ({
        openTime: k[0],
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5]),
        closeTime: k[6],
      }));
    } catch (error: any) {
      console.error('[Binance] Erro ao buscar klines:', error?.message);
      throw new Error('Falha ao buscar dados de mercado');
    }
  }

  /**
   * Busca o preço atual de um símbolo
   */
  async getCurrentPrice(symbol: string = 'BTCUSDT'): Promise<number> {
    try {
      const response = await this.client.get('/api/v3/ticker/price', {
        params: { symbol },
      });
      return parseFloat(response.data.price);
    } catch (error) {
      console.error('[Binance] Erro ao buscar preço:', error);
      throw new Error('Falha ao buscar preço atual');
    }
  }

  /**
   * Busca o saldo da conta
   */
  async getAccountBalances(): Promise<AccountBalance[]> {
    try {
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = this.sign(queryString);

      const response = await this.client.get(
        `/api/v3/account?${queryString}&signature=${signature}`
      );

      return response.data.balances
        .filter((b: any) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
        .map((b: any) => ({
          asset: b.asset,
          free: parseFloat(b.free),
          locked: parseFloat(b.locked),
        }));
    } catch (error: any) {
      console.error('[Binance] Erro ao buscar saldo:', error?.message);
      throw new Error('Falha ao buscar saldo da conta');
    }
  }

  /**
   * Busca o saldo de um ativo específico
   */
  async getBalance(asset: string): Promise<number> {
    const balances = await this.getAccountBalances();
    const balance = balances.find(b => b.asset === asset);
    return balance ? balance.free : 0;
  }

  /**
   * [REAL TRADE] Cria uma ordem de compra a mercado
   * ⚠️  Esta função executa uma operação REAL na Binance
   * 
   * @param symbol Par de trading
   * @param quantity Quantidade do ativo base a comprar
   */
  async placeBuyOrder(symbol: string, quantity: number): Promise<OrderResult> {
    const timestamp = Date.now();
    const params = {
      symbol,
      side: 'BUY',
      type: 'MARKET',
      quantity: quantity.toFixed(6),
      timestamp,
    };

    const queryString = Object.entries(params)
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    const signature = this.sign(queryString);

    try {
      const response = await this.client.post(
        `/api/v3/order?${queryString}&signature=${signature}`
      );

      const data = response.data;
      const price = parseFloat(data.fills?.[0]?.price || data.price || '0');

      return {
        orderId: data.orderId,
        symbol: data.symbol,
        side: 'BUY',
        price,
        quantity: parseFloat(data.executedQty),
        status: data.status,
        timestamp,
        isDemo: false,
      };
    } catch (error: any) {
      const msg = error?.response?.data?.msg || 'Erro ao criar ordem de compra';
      throw new Error(msg);
    }
  }

  /**
   * [REAL TRADE] Cria uma ordem de venda a mercado
   * ⚠️  Esta função executa uma operação REAL na Binance
   * 
   * @param symbol Par de trading
   * @param quantity Quantidade do ativo base a vender
   */
  async placeSellOrder(symbol: string, quantity: number): Promise<OrderResult> {
    const timestamp = Date.now();
    const params = {
      symbol,
      side: 'SELL',
      type: 'MARKET',
      quantity: quantity.toFixed(6),
      timestamp,
    };

    const queryString = Object.entries(params)
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    const signature = this.sign(queryString);

    try {
      const response = await this.client.post(
        `/api/v3/order?${queryString}&signature=${signature}`
      );

      const data = response.data;
      const price = parseFloat(data.fills?.[0]?.price || data.price || '0');

      return {
        orderId: data.orderId,
        symbol: data.symbol,
        side: 'SELL',
        price,
        quantity: parseFloat(data.executedQty),
        status: data.status,
        timestamp,
        isDemo: false,
      };
    } catch (error: any) {
      const msg = error?.response?.data?.msg || 'Erro ao criar ordem de venda';
      throw new Error(msg);
    }
  }

  /**
   * [DEMO] Simula uma ordem de compra sem executar na Binance
   */
  async simulateBuyOrder(symbol: string, quantity: number, price: number): Promise<OrderResult> {
    // Simula latência de rede
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      orderId: Date.now(),
      symbol,
      side: 'BUY',
      price,
      quantity,
      status: 'FILLED',
      timestamp: Date.now(),
      isDemo: true,
    };
  }

  /**
   * [DEMO] Simula uma ordem de venda sem executar na Binance
   */
  async simulateSellOrder(symbol: string, quantity: number, price: number): Promise<OrderResult> {
    // Simula latência de rede
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      orderId: Date.now(),
      symbol,
      side: 'SELL',
      price,
      quantity,
      status: 'FILLED',
      timestamp: Date.now(),
      isDemo: true,
    };
  }

  /**
   * Busca a taxa de câmbio USD/BRL
   * Usa API pública do Open Exchange Rates (fallback: taxa fixa)
   */
  async getUSDtoBRLRate(): Promise<number> {
    try {
      const response = await axios.get(
        'https://api.exchangerate-api.com/v4/latest/USD',
        { timeout: 5000 }
      );
      const rate = response.data?.rates?.BRL;
      if (rate) {
        USD_BRL_RATE = rate;
        return rate;
      }
    } catch {
      console.warn('[Binance] Usando taxa de câmbio fixa: 5.0');
    }
    return USD_BRL_RATE;
  }
}

// Exporta instância singleton
export const binanceAPI = new BinanceAPIService();
