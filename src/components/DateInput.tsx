import React from 'react';
import { View, Text, TextInput, StyleSheet, Platform } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';
import { useThemedColors } from '../store';

interface Props {
  label?: string;
  /** Valor no formato AAAA-MM-DD (ISO date) */
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  /** Para data de nascimento, use 'birthdate'. Para futuro, use 'event'. */
  mode?: 'birthdate' | 'event';
}

const today = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const yearsAgo = (n: number): string => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Input de data cross-platform.
 * - Web: renderiza <input type="date"> HTML direto pro calendário nativo
 *   do navegador (RN Web não propaga `type=date` no TextInput).
 * - Native: TextInput simples como fallback.
 */
export const DateInput: React.FC<Props> = ({
  label,
  value,
  onChangeText,
  placeholder = 'AAAA-MM-DD',
  error,
  hint,
  mode,
}) => {
  useThemedColors();
  const styles = StyleSheet.create({
    wrap: {
      marginBottom: spacing.md,
      alignSelf: 'stretch',
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 6,
    },
    input: {
      minHeight: 50,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      fontSize: 16,
      color: colors.text,
    },
    inputError: {
      borderColor: colors.danger,
    },
    error: {
      marginTop: 4,
      fontSize: 12,
      color: colors.danger,
    },
    hint: {
      marginTop: 4,
      fontSize: 12,
      color: colors.textMuted,
    },
  });

  const renderInput = () => {
    if (Platform.OS === 'web') {
      const min = mode === 'event' ? today() : yearsAgo(120);
      const max = mode === 'birthdate' ? today() : undefined;
      // Usa <input> HTML direto. RN Web sobrescreve `type` no TextInput,
      // então spread não funciona.
      return React.createElement('input', {
        type: 'date',
        value,
        min,
        max,
        onChange: (e: { target: { value: string } }) => onChangeText(e.target.value),
        placeholder,
        style: {
          minHeight: 50,
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          paddingLeft: spacing.md,
          paddingRight: spacing.md,
          borderWidth: 1.5,
          borderStyle: 'solid',
          borderColor: error ? colors.danger : colors.border,
          fontSize: 16,
          color: colors.text,
          fontFamily: 'inherit',
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box',
        } as React.CSSProperties,
      });
    }
    return (
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, !!error && styles.inputError]}
        keyboardType="numbers-and-punctuation"
      />
    );
  };

  return (
    <View style={styles.wrap}>
      {label && <Text style={styles.label}>{label}</Text>}
      {renderInput()}
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
};
