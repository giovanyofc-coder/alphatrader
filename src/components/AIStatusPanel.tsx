/**
 * Painel de status da IA — exibe indicadores técnicos em tempo real
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';

interface AIStatusPanelProps {
  rsi: number;
  trend: string;
  ema20: number;
  ema50: number;
  lastSignal: string;
  isActive: boolean;
}

export function AIStatusPanel({
  rsi,
  trend,
  ema20,
  ema50,
  lastSignal,
  isActive,
}: AIStatusPanelProps) {
  // Determina a cor do RSI
  const getRsiColor = (rsi: number) => {
    if (rsi < 35) return COLORS.secondary;   // Sobrevendido = verde (oportunidade)
    if (rsi > 65) return COLORS.danger;       // Sobrecomprado = vermelho
    return COLORS.primary;                    // Neutro = azul
  };

  // Determina a cor da tendência
  const getTrendColor = (trend: string) => {
    if (trend === 'UP') return COLORS.secondary;
    if (trend === 'DOWN') return COLORS.danger;
    return COLORS.textMuted;
  };

  const rsiColor = getRsiColor(rsi);
  const trendColor = getTrendColor(trend);

  return (
    <View style={styles.container}>
      {/* Título */}
      <View style={styles.titleRow}>
        <View style={[styles.dot, { backgroundColor: isActive ? COLORS.secondary : COLORS.textMuted }]} />
        <Text style={styles.title}>INDICADORES TÉCNICOS</Text>
      </View>

      {/* Grid de indicadores */}
      <View style={styles.grid}>
        {/* RSI */}
        <View style={styles.indicator}>
          <Text style={styles.indicatorLabel}>RSI (14)</Text>
          <Text style={[styles.indicatorValue, { color: rsiColor }]}>
            {rsi.toFixed(1)}
          </Text>
          <Text style={[styles.indicatorSub, { color: rsiColor }]}>
            {rsi < 35 ? 'SOBREVENDIDO' : rsi > 65 ? 'SOBRECOMPRADO' : 'NEUTRO'}
          </Text>
        </View>

        {/* Tendência */}
        <View style={styles.indicator}>
          <Text style={styles.indicatorLabel}>TENDÊNCIA</Text>
          <Text style={[styles.indicatorValue, { color: trendColor }]}>
            {trend === 'UP' ? '↑' : trend === 'DOWN' ? '↓' : '→'}
          </Text>
          <Text style={[styles.indicatorSub, { color: trendColor }]}>
            {trend === 'UP' ? 'ALTA' : trend === 'DOWN' ? 'BAIXA' : 'LATERAL'}
          </Text>
        </View>

        {/* EMA 20 */}
        <View style={styles.indicator}>
          <Text style={styles.indicatorLabel}>EMA 20</Text>
          <Text style={styles.indicatorValue}>
            {ema20 > 0 ? `$${(ema20 / 1000).toFixed(1)}k` : '---'}
          </Text>
          <Text style={styles.indicatorSub}>Curta</Text>
        </View>

        {/* EMA 50 */}
        <View style={styles.indicator}>
          <Text style={styles.indicatorLabel}>EMA 50</Text>
          <Text style={styles.indicatorValue}>
            {ema50 > 0 ? `$${(ema50 / 1000).toFixed(1)}k` : '---'}
          </Text>
          <Text style={styles.indicatorSub}>Longa</Text>
        </View>
      </View>

      {/* Último sinal */}
      <View style={styles.signalContainer}>
        <Text style={styles.signalLabel}>ÚLTIMO SINAL</Text>
        <Text style={styles.signalText} numberOfLines={2}>
          {lastSignal || 'Aguardando...'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.sm,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  indicator: {
    flex: 1,
    alignItems: 'center',
  },
  indicatorLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  indicatorValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 2,
  },
  indicatorSub: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  signalContainer: {
    backgroundColor: `${COLORS.primary}11`,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: `${COLORS.primary}22`,
  },
  signalLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 1,
    marginBottom: 3,
  },
  signalText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
});
