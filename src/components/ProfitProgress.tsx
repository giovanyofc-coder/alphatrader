/**
 * Componente de progresso de lucro
 * Mostra a evolução do lucro em relação à meta definida
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { formatBRL, formatUSD } from '../utils/formatters';

interface ProfitProgressProps {
  profitBRL: number;
  profitGoalBRL: number;
  profitUSD: number;
  openTrade: {
    currentPnlPercent: number;
    currentPnlUSD: number;
    buyPrice: number;
  } | null;
  usdBrlRate: number;
}

export function ProfitProgress({
  profitBRL,
  profitGoalBRL,
  profitUSD,
  openTrade,
  usdBrlRate,
}: ProfitProgressProps) {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  const progress = profitGoalBRL > 0
    ? Math.min(Math.max(profitBRL / profitGoalBRL, 0), 1)
    : 0;

  // Anima a barra de progresso
  useEffect(() => {
    Animated.spring(animatedWidth, {
      toValue: progress,
      useNativeDriver: false,
      tension: 40,
      friction: 8,
    }).start();
  }, [progress]);

  const barColor = progress >= 1
    ? COLORS.secondary
    : progress > 0.7
    ? COLORS.warning
    : COLORS.primary;

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.title}>PROGRESSO DA META</Text>
        <Text style={[styles.percent, { color: barColor }]}>
          {(progress * 100).toFixed(1)}%
        </Text>
      </View>

      {/* Barra de progresso */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              backgroundColor: barColor,
              width: animatedWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
              shadowColor: barColor,
            },
          ]}
        />
      </View>

      {/* Valores */}
      <View style={styles.values}>
        <View>
          <Text style={styles.valueLabel}>LUCRO ACUMULADO</Text>
          <Text style={[
            styles.valueAmount,
            { color: profitBRL >= 0 ? COLORS.secondary : COLORS.danger }
          ]}>
            {formatBRL(profitBRL)}
          </Text>
          <Text style={styles.valueSub}>{formatUSD(profitUSD)}</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.goalContainer}>
          <Text style={styles.valueLabel}>META</Text>
          <Text style={styles.valueAmount}>{formatBRL(profitGoalBRL)}</Text>
          <Text style={styles.valueSub}>
            faltam {formatBRL(Math.max(profitGoalBRL - profitBRL, 0))}
          </Text>
        </View>
      </View>

      {/* Posição aberta */}
      {openTrade && (
        <View style={[
          styles.openTrade,
          {
            borderColor: openTrade.currentPnlPercent >= 0
              ? `${COLORS.secondary}44`
              : `${COLORS.danger}44`,
            backgroundColor: openTrade.currentPnlPercent >= 0
              ? `${COLORS.secondary}11`
              : `${COLORS.danger}11`,
          }
        ]}>
          <View style={styles.openTradeRow}>
            <Text style={styles.openTradeLabel}>📈 POSIÇÃO ABERTA</Text>
            <Text style={[
              styles.openTradePnl,
              { color: openTrade.currentPnlPercent >= 0 ? COLORS.secondary : COLORS.danger }
            ]}>
              {openTrade.currentPnlPercent >= 0 ? '+' : ''}
              {openTrade.currentPnlPercent.toFixed(3)}%
            </Text>
          </View>
          <View style={styles.openTradeRow}>
            <Text style={styles.openTradeSub}>
              Compra: {formatUSD(openTrade.buyPrice)}
            </Text>
            <Text style={[
              styles.openTradeSub,
              { color: openTrade.currentPnlUSD >= 0 ? COLORS.secondary : COLORS.danger }
            ]}>
              {openTrade.currentPnlUSD >= 0 ? '+' : ''}
              {formatBRL(openTrade.currentPnlUSD * usdBrlRate)}
            </Text>
          </View>
        </View>
      )}
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
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
  },
  percent: {
    fontSize: 14,
    fontWeight: '800',
  },
  progressTrack: {
    height: 8,
    backgroundColor: COLORS.cardBorder,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  progressBar: {
    height: '100%',
    borderRadius: RADIUS.full,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  values: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  separator: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },
  goalContainer: {
    flex: 1,
  },
  valueLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 2,
  },
  valueAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  valueSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  openTrade: {
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginTop: SPACING.md,
    borderWidth: 1,
  },
  openTradeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  openTradeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  openTradePnl: {
    fontSize: 14,
    fontWeight: '800',
  },
  openTradeSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
