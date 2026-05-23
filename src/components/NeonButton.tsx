/**
 * Botão com efeito neon — componente de ação principal
 */
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACING } from '../theme/spacing';

interface NeonButtonProps {
  title: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'filled' | 'outline' | 'ghost';
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function NeonButton({
  title,
  onPress,
  color = COLORS.primary,
  disabled = false,
  loading = false,
  size = 'md',
  variant = 'filled',
  icon,
  style,
  textStyle,
  fullWidth = false,
}: NeonButtonProps) {
  const heights = { sm: 36, md: 48, lg: 60 };
  const fontSizes = { sm: 13, md: 15, lg: 18 };

  const buttonStyle: ViewStyle = {
    height: heights[size],
    backgroundColor: variant === 'filled' ? color : 'transparent',
    borderColor: color,
    borderWidth: variant === 'ghost' ? 0 : 1.5,
    shadowColor: color,
    elevation: variant === 'filled' ? 8 : 4,
    shadowOpacity: variant === 'filled' ? 0.5 : 0.2,
    opacity: disabled ? 0.4 : 1,
    width: fullWidth ? '100%' : undefined,
  };

  const labelStyle: TextStyle = {
    fontSize: fontSizes[size],
    color: variant === 'filled' ? COLORS.background : color,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[styles.button, buttonStyle, style]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'filled' ? COLORS.background : color} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text style={[styles.label, labelStyle, textStyle]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: SPACING.sm,
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
