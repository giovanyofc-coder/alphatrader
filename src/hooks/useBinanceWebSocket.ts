/**
 * Hook para conexão com WebSocket da Binance
 * Recebe dados de kline (candlestick) ao vivo para um símbolo específico
 */
import { useState, useEffect, useRef, useCallback } from 'react';

export interface LiveCandle {
  time: number;       // Timestamp de abertura
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isFinal: boolean;   // true quando o candle fechou
}

export interface WebSocketStatus {
  connected: boolean;
  error: string | null;
  reconnecting: boolean;
}

interface UseWebSocketReturn {
  currentCandle: LiveCandle | null;
  priceHistory: number[];    // Últimas N cotações para sparkline
  wsStatus: WebSocketStatus;
  lastPrice: number;
  priceChange24h: number;
}

const MAX_HISTORY = 60; // Mantém últimas 60 cotações para o gráfico

export function useBinanceWebSocket(symbol: string = 'BTCBRL'): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectCount = useRef(0);

  const [currentCandle, setCurrentCandle] = useState<LiveCandle | null>(null);
  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  const [lastPrice, setLastPrice] = useState(0);
  const [priceChange24h] = useState(0);
  const [wsStatus, setWsStatus] = useState<WebSocketStatus>({
    connected: false,
    error: null,
    reconnecting: false,
  });

  const connect = useCallback(() => {
    // Fecha conexão anterior se existir
    if (wsRef.current) {
      wsRef.current.close();
    }

    setWsStatus(prev => ({ ...prev, reconnecting: reconnectCount.current > 0 }));
    
    const formattedSymbol = symbol.toLowerCase();
    const WS_URL = `wss://stream.binance.com:9443/ws/${formattedSymbol}@kline_1m`;
    
    console.log(`[WebSocket] Conectando à Binance (${symbol})...`);

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`[WebSocket] Conectado à Binance (${symbol})!`);
      reconnectCount.current = 0;
      setWsStatus({ connected: true, error: null, reconnecting: false });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const kline = data.k;

        const candle: LiveCandle = {
          time: kline.t,
          open: parseFloat(kline.o),
          high: parseFloat(kline.h),
          low: parseFloat(kline.l),
          close: parseFloat(kline.c),
          volume: parseFloat(kline.v),
          isFinal: kline.x,
        };

        setCurrentCandle(candle);
        setLastPrice(candle.close);

        // Atualiza histórico de preços para o gráfico
        setPriceHistory(prev => {
          const updated = [...prev, candle.close];
          return updated.slice(-MAX_HISTORY);
        });

      } catch (err) {
        console.error('[WebSocket] Erro ao processar mensagem:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('[WebSocket] Erro de conexão:', err);
      setWsStatus(prev => ({
        ...prev,
        error: 'Erro de conexão com a Binance',
        connected: false,
      }));
    };

    ws.onclose = (event) => {
      console.log('[WebSocket] Conexão fechada. Código:', event.code);
      setWsStatus(prev => ({
        ...prev,
        connected: false,
      }));

      // Reconexão automática com backoff exponencial (máx 30s)
      if (reconnectCount.current < 10) {
        const delay = Math.min(1000 * Math.pow(2, reconnectCount.current), 30000);
        reconnectCount.current++;
        
        reconnectRef.current = setTimeout(() => {
          connect();
        }, delay);
      } else {
        setWsStatus(prev => ({
          ...prev,
          error: 'Falha ao reconectar. Verifique sua internet.',
          reconnecting: false,
        }));
      }
    };
  }, [symbol]);

  // Inicia conexão ao montar ou mudar o símbolo
  useEffect(() => {
    setPriceHistory([]); // Limpa histórico ao mudar símbolo
    connect();

    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (wsRef.current) wsRef.current.close(1000, 'Componente desmontado ou símbolo alterado');
    };
  }, [connect, symbol]);

  return {
    currentCandle,
    priceHistory,
    wsStatus,
    lastPrice,
    priceChange24h,
  };
}
