/**
 * Contexto global de trading
 * Fornece estado e ações do motor de IA para todos os componentes
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { tradingEngine, TradingState } from './TradingEngine';
import { loadCredentials, loadData, STORAGE_KEYS } from '../utils/storage';
import { zapiaBridge } from './ZapiaBridge';

interface TradingContextType {
  state: TradingState;
  apiKey: string;
  secretKey: string;
  isConnected: boolean;
  startTrading: () => Promise<void>;
  stopTrading: () => Promise<void>;
  setDemoMode: (isDemo: boolean) => void;
  setProfitGoal: (goal: number) => void;
  setSpendingLimit: (percent: number) => void;
  setSymbol: (symbol: string) => void;
  resetProfit: () => void;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export function TradingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TradingState>(tradingEngine.getState());
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  // Carrega credenciais salvas ao iniciar
  useEffect(() => {
    async function loadSaved() {
      const creds = await loadCredentials();
      if (creds.apiKey) setApiKey(creds.apiKey);
      if (creds.secretKey) setSecretKey(creds.secretKey);
      setIsConnected(creds.isConnected);

      // Carrega token do Zapia
      const zapiaToken = await loadData(STORAGE_KEYS.ZAPIA_TOKEN);
      if (zapiaToken) zapiaBridge.setToken(zapiaToken);

      // Carrega configurações salvas
      const demoMode = await loadData(STORAGE_KEYS.DEMO_MODE);
      tradingEngine.setDemoMode(demoMode !== 'false'); // DEMO por padrão

      const profitGoal = await loadData(STORAGE_KEYS.PROFIT_GOAL);
      if (profitGoal) tradingEngine.setProfitGoal(parseFloat(profitGoal));
    }

    loadSaved();

    // Registra callback de atualização de estado
    tradingEngine.setStateUpdateCallback((partial) => {
      setState(prev => ({ ...prev, ...partial }));
    });
  }, []);

  const startTrading = useCallback(async () => {
    if (!apiKey || !secretKey) {
      console.warn('[Context] Credenciais não configuradas');
      return;
    }
    await tradingEngine.start(apiKey, secretKey);
  }, [apiKey, secretKey]);

  const stopTrading = useCallback(async () => {
    await tradingEngine.stop();
  }, []);

  const setDemoMode = useCallback((isDemo: boolean) => {
    tradingEngine.setDemoMode(isDemo);
    setState(prev => ({ ...prev, isDemoMode: isDemo }));
  }, []);

  const setProfitGoal = useCallback((goal: number) => {
    tradingEngine.setProfitGoal(goal);
    setState(prev => ({ ...prev, profitGoalBRL: goal }));
  }, []);

  const setSpendingLimit = useCallback((percent: number) => {
    tradingEngine.setSpendingLimit(percent);
    setState(prev => ({ ...prev, spendingLimitPercent: percent }));
  }, []);

  const setSymbol = useCallback((symbol: string) => {
    tradingEngine.setSymbol(symbol);
    setState(prev => ({ ...prev, selectedSymbol: symbol }));
  }, []);

  const resetProfit = useCallback(() => {
    tradingEngine.resetProfit();
  }, []);

  return (
    <TradingContext.Provider
      value={{
        state,
        apiKey,
        secretKey,
        isConnected,
        startTrading,
        stopTrading,
        setDemoMode,
        setProfitGoal,
        setSpendingLimit,
        setSymbol,
        resetProfit,
      }}
    >
      {children}
    </TradingContext.Provider>
  );
}

export function useTradingContext(): TradingContextType {
  const ctx = useContext(TradingContext);
  if (!ctx) throw new Error('useTradingContext deve ser usado dentro de TradingProvider');
  return ctx;
}
