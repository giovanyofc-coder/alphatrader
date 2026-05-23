/**
 * Campo de entrada com estilo neon cyberpunk
 */
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';

interface NeonInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  editable?: boolean;
  style?: ViewStyle;
  prefix?: string;     // ex: "R$" ou "$"
  hint?: string;       // texto de ajuda abaixo do campo
}

export function NeonInput({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  editable = true,
  style,
  prefix,
  hint,
}: NeonInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isVisible, setIsVisible] = useState(!secureTextEntry);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputFocused,
          !editable && styles.inputDisabled,
        ]}
      >
        {prefix && <Text style={styles.prefix}>{prefix}</Text>}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !isVisible}
          keyboardType={keyboardType}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setIsVisible(!isVisible)} style={styles.eyeButton}>
            <Ionicons
              name={isVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={COLORS.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 52,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  prefix: {
    color: COLORS.textSecondary,
    fontSize: 15,
    marginRight: SPACING.xs,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '500',
  },
  eyeButton: {
    padding: SPACING.xs,
  },
  hint: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
    marginLeft: 2,
  },
});
