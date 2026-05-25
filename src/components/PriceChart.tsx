/**
 * Gráfico de preços ao vivo do BTC/USDT
 * Mostra linha de preço com dados do WebSocket da Binance
 * Usa react-native-chart-kit para compatibilidade com Expo Go
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { formatUSD } from '../utils/formatters';
import { WebSocketStatus } from '../hooks/useBinanceWebSocket';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface PriceChartProps {
  priceHistory: number[];
  lastPrice: number;
  wsStatus: WebSocketStatus;
  symbol?: string;
}

export function PriceChart({ 
  priceHistory, 
  lastPrice, 
  wsStatus, 
  symbol = 'BTC/USDT' 
}: PriceChartProps) {
  // Formata o símbolo para exibição (ex: BTCUSDT -> BTC/USDT)
  const displaySymbol = symbol.includes('/') 
    ? symbol 
    : symbol.replace('USDT', '/USDT').replace('BRL', '/BRL');
  // Prepara dados para o gráfico — usa os últimos 30 pontos
  const chartData = useMemo(() => {
    const data = priceHistory.length > 0 ? priceHistory.slice(-30) : [0];

    // Garante pelo menos 2 pontos para o gráfico
    if (data.length < 2) return [lastPrice || 50000, lastPrice || 50000];
    return data;
  }, [priceHistory, lastPrice]);

  // Calcula variação de preço no período exibido
  const priceChange = useMemo(() => {
    if (chartData.length < 2) return 0;
    const first = chartData[0];
    const last = chartData[chartData.length - 1];
    return ((last - first) / first) * 100;
  }, [chartData]);

  const isPositive = priceChange >= 0;
  const lineColor = isPositive ? COLORS.secondary : COLORS.danger;

  return (
    <View style={styles.container}>
      {/* Cabeçalho do gráfico */}
      <View style={styles.header}>
        <View>
          <Text style={styles.symbol}>{displaySymbol}</Text>
          <Text style={[styles.price, { color: lineColor }]}>
            {lastPrice > 0 ? formatUSD(lastPrice) : '---'}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {/* Status da conexão WebSocket */}
          <View style={styles.wsStatus}>
            <View
              style={[
                styles.wsIndicator,
                {
                  backgroundColor: wsStatus.connected
                    ? COLORS.secondary
                    : wsStatus.reconnecting
                    ? COLORS.warning
                    : COLORS.danger,
                },
              ]}
            />
            <Text style={styles.wsText}>
              {wsStatus.connected ? 'AO VIVO' : wsStatus.reconnecting ? 'RECONECT.' : 'OFFLINE'}
            </Text>
          </View>
          {/* Variação de preço */}
          <Text style={[styles.change, { color: lineColor }]}>
            {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
          </Text>
        </View>
      </View>

      {/* Gráfico */}
      {priceHistory.length < 2 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>
            {wsStatus.reconnecting ? 'Reconectando...' : 'Aguardando dados ao vivo...'}
          </Text>
        </View>
      ) : (
        <LineChart
          data={{
            labels: [],
            datasets: [{ data: chartData }],
          }}
          width={SCREEN_WIDTH - SPACING.md * 2}
          height={160}
          withDots={false}
          withInnerLines={false}
          withOuterLines={false}
          withVerticalLabels={false}
          withHorizontalLabels={true}
          chartConfig={{
            backgroundColor: COLORS.surface,
            backgroundGradientFrom: COLORS.surface,
            backgroundGradientTo: COLORS.surface,
            decimalPlaces: 0,
            color: () => lineColor,
            labelColor: () => COLORS.textMuted,
            propsForLabels: { fontSize: 10 },
            strokeWidth: 2,
            propsForBackgroundLines: {
              stroke: COLORS.border,
              strokeDasharray: '4',
            },
          }}
          bezier
          style={styles.chart}
          fromZero={false}
        />
      )}

      {/* Erro de conexão */}
      {wsStatus.error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️  {wsStatus.error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  symbol: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  price: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  wsStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  wsIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  wsText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
  },
  change: {
    fontSize: 16,
    fontWeight: '700',
  },
  chart: {
    borderRadius: 0,
    paddingRight: 0,
  },
  loadingContainer: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: SPACING.sm,
  },
  errorBanner: {
    backgroundColor: `${COLORS.danger}22`,
    padding: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: `${COLORS.danger}44`,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    textAlign: 'center',
  },
});
