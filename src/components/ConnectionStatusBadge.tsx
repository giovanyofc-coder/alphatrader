/**
 * Badge de status da conexão com a Binance
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';

interface ConnectionStatusBadgeProps {
  isConnected: boolean;
  apiKey?: string;
}

export function ConnectionStatusBadge({ isConnected, apiKey }: ConnectionStatusBadgeProps) {
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: isConnected ? `${COLORS.secondary}22` : `${COLORS.danger}22`,
          borderColor: isConnected ? `${COLORS.secondary}66` : `${COLORS.danger}66`,
        },
      ]}
    >
      <View
        style={[
          styles.dot,
          { backgroundColor: isConnected ? COLORS.secondary : COLORS.danger },
        ]}
      />
      <Ionicons
        name={isConnected ? 'checkmark-circle' : 'close-circle'}
        size={14}
        color={isConnected ? COLORS.secondary : COLORS.danger}
        style={styles.icon}
      />
      <Text
        style={[
          styles.text,
          { color: isConnected ? COLORS.secondary : COLORS.danger },
        ]}
      >
        {isConnected
          ? `Conectado${apiKey ? ` • ${apiKey.substring(0, 4)}...` : ''}`
          : 'Desconectado'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 5,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
