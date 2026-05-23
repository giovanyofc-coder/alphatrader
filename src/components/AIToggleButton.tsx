/**
 * Botão de Liga/Desliga da IA — elemento principal do Dashboard
 * Grande, vistoso e animado
 */
import React, { useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  View,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACING } from '../theme/spacing';

interface AIToggleButtonProps {
  isActive: boolean;
  isDemoMode: boolean;
  isConnected: boolean;
  loading?: boolean;
  onToggle: () => void;
}

export function AIToggleButton({
  isActive,
  isDemoMode,
  isConnected,
  loading = false,
  onToggle,
}: AIToggleButtonProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Animação de pulso quando a IA está ativa
  useEffect(() => {
    if (isActive) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.06,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );

      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 1200,
            useNativeDriver: false,
          }),
        ])
      );

      pulse.start();
      glow.start();

      return () => {
        pulse.stop();
        glow.stop();
      };
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [isActive]);

  const activeColor = isDemoMode ? COLORS.warning : COLORS.secondary;
  const buttonColor = isActive ? activeColor : COLORS.textMuted;

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.4],
  });

  return (
    <View style={styles.wrapper}>
      {/* Efeito de brilho externo */}
      {isActive && (
        <Animated.View
          style={[
            styles.glow,
            {
              backgroundColor: buttonColor,
              opacity: glowOpacity,
            },
          ]}
        />
      )}

      <Animated.View style={[styles.buttonWrapper, { transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity
          onPress={onToggle}
          disabled={loading || !isConnected}
          activeOpacity={0.85}
          style={[
            styles.button,
            {
              backgroundColor: isActive
                ? `${buttonColor}22`
                : `${COLORS.surface}`,
              borderColor: buttonColor,
              shadowColor: buttonColor,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={buttonColor} size="large" />
          ) : (
            <>
              <Ionicons
                name={isActive ? 'power' : 'power-outline'}
                size={42}
                color={buttonColor}
              />
              <Text style={[styles.label, { color: buttonColor }]}>
                {isActive ? 'DESLIGAR IA' : 'LIGAR IA'}
              </Text>
              <Text style={styles.modeText}>
                {isDemoMode ? '🎮 MODO DEMO' : '⚡ MODO REAL'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Aviso de desconectado */}
      {!isConnected && (
        <Text style={styles.disconnectedText}>
          Conecte a Binance primeiro
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  glow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    top: 0,
  },
  buttonWrapper: {
    borderRadius: 75,
  },
  button: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 12,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: SPACING.xs,
  },
  modeText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 3,
    letterSpacing: 0.5,
  },
  disconnectedText: {
    fontSize: 11,
    color: COLORS.danger,
    marginTop: SPACING.sm,
    fontWeight: '500',
  },
});
