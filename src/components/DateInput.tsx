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
 * - Web: usa <input type="date"> nativo (calendário do navegador).
 * - Native: TextInput com placeholder AAAA-MM-DD (fallback simples).
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

  const inputStyle = [styles.input, !!error && styles.inputError];

  // No web, usa input HTML nativo com type="date" (calendário do browser).
  // O React Native Web aceita props extras via spread.
  const renderInput = () => {
    if (Platform.OS === 'web') {
      const min = mode === 'event' ? today() : yearsAgo(120);
      const max = mode === 'birthdate' ? today() : undefined;
      // RN Web não tipa as props HTML, então usamos um cast pra passar type/min/max.
      const webProps = {
        type: 'date',
        min,
        max,
      } as unknown as Record<string, unknown>;
      return (
        <TextInput
          {...webProps}
          value={value}
          onChangeText={onChangeText}
          style={inputStyle}
          placeholderTextColor={colors.textMuted}
          placeholder={placeholder}
        />
      );
    }
    // Native: textInput simples (futuramente integrar @react-native-community/datetimepicker)
    return (
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={inputStyle}
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
