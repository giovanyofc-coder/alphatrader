/**
 * Card com borda neon — componente base do tema cyberpunk
 */
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';

interface NeonCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  accent?: 'primary' | 'secondary' | 'danger' | 'warning';
  noPadding?: boolean;
}

export function NeonCard({
  children,
  style,
  accent = 'primary',
  noPadding = false,
}: NeonCardProps) {
  const accentColor = {
    primary: COLORS.primary,
    secondary: COLORS.secondary,
    danger: COLORS.danger,
    warning: COLORS.warning,
  }[accent];

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: `${accentColor}44`,
          shadowColor: accentColor,
        },
        noPadding ? styles.noPadding : null,
        style,
      ]}
    >
      {/* Linha de acento no topo */}
      <View style={[styles.topAccent, { backgroundColor: accentColor }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    // Sombra neon (Android)
    elevation: 8,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    borderTopLeftRadius: RADIUS.md,
    borderTopRightRadius: RADIUS.md,
  },
  noPadding: {
    padding: 0,
  },
});
