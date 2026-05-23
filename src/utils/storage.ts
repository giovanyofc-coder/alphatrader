/**
 * Utilitário de armazenamento local com AsyncStorage
 * Salva e recupera dados de forma segura no dispositivo
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// Chaves de armazenamento
export const STORAGE_KEYS = {
  API_KEY: '@iatrader:apiKey',
  SECRET_KEY: '@iatrader:secretKey',
  IS_CONNECTED: '@iatrader:isConnected',
  PROFIT_GOAL: '@iatrader:profitGoal',
  TIME_LIMIT: '@iatrader:timeLimit',
  DEMO_MODE: '@iatrader:demoMode',
  TRADE_HISTORY: '@iatrader:tradeHistory',
};

/**
 * Salva um valor no AsyncStorage
 */
export async function saveData(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.error('[Storage] Erro ao salvar dados:', error);
    throw error;
  }
}

/**
 * Recupera um valor do AsyncStorage
 */
export async function loadData(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.error('[Storage] Erro ao carregar dados:', error);
    return null;
  }
}

/**
 * Remove um valor do AsyncStorage
 */
export async function removeData(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('[Storage] Erro ao remover dados:', error);
  }
}

/**
 * Salva as credenciais da Binance
 */
export async function saveCredentials(apiKey: string, secretKey: string): Promise<void> {
  await saveData(STORAGE_KEYS.API_KEY, apiKey);
  await saveData(STORAGE_KEYS.SECRET_KEY, secretKey);
  await saveData(STORAGE_KEYS.IS_CONNECTED, 'true');
}

/**
 * Carrega as credenciais da Binance
 */
export async function loadCredentials(): Promise<{
  apiKey: string | null;
  secretKey: string | null;
  isConnected: boolean;
}> {
  const apiKey = await loadData(STORAGE_KEYS.API_KEY);
  const secretKey = await loadData(STORAGE_KEYS.SECRET_KEY);
  const isConnected = await loadData(STORAGE_KEYS.IS_CONNECTED);

  return {
    apiKey,
    secretKey,
    isConnected: isConnected === 'true',
  };
}

/**
 * Remove as credenciais (desconectar)
 */
export async function clearCredentials(): Promise<void> {
  await removeData(STORAGE_KEYS.API_KEY);
  await removeData(STORAGE_KEYS.SECRET_KEY);
  await saveData(STORAGE_KEYS.IS_CONNECTED, 'false');
}

/**
 * Salva o histórico de operações
 */
export async function saveTrade(trade: TradeRecord): Promise<void> {
  try {
    const existing = await loadData(STORAGE_KEYS.TRADE_HISTORY);
    const history: TradeRecord[] = existing ? JSON.parse(existing) : [];
    history.unshift(trade); // adiciona no início
    // Mantém apenas os últimos 100 trades
    const trimmed = history.slice(0, 100);
    await saveData(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('[Storage] Erro ao salvar trade:', error);
  }
}

/**
 * Carrega o histórico de operações
 */
export async function loadTradeHistory(): Promise<TradeRecord[]> {
  try {
    const data = await loadData(STORAGE_KEYS.TRADE_HISTORY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[Storage] Erro ao carregar histórico:', error);
    return [];
  }
}

// Tipo de registro de operação
export interface TradeRecord {
  id: string;
  type: 'BUY' | 'SELL';
  symbol: string;
  price: number;
  quantity: number;
  profitUSD: number;
  profitBRL: number;
  timestamp: number;
  isDemo: boolean;
}
