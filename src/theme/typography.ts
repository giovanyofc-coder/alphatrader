/**
 * Estilos de tipografia do Alphatrader
 * Usa fontes do sistema para compatibilidade máxima
 */
import { StyleSheet } from 'react-native';
import { COLORS } from './colors';

export const TYPOGRAPHY = StyleSheet.create({
  // Títulos
  h1: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 1,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  h4: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Corpo de texto
  body: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400',
    color: COLORS.textMuted,
    lineHeight: 18,
  },

  // Labels
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Valores monetários
  money: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.secondary,
    letterSpacing: 1,
  },
  moneySmall: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.secondary,
  },

  // Código / dados técnicos
  mono: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: COLORS.primary,
  },
});
