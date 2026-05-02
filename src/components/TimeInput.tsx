import React from 'react';
import { View, Text, TextInput, StyleSheet, Platform } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';
import { useThemedColors } from '../store';

interface Props {
  label?: string;
  /** Valor no formato HH:MM */
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
}

/**
 * Input de hora cross-platform (web usa <input type="time"> HTML direto).
 */
export const TimeInput: React.FC<Props> = ({
  label,
  value,
  onChangeText,
  placeholder = 'HH:MM',
  error,
  hint,
}) => {
  useThemedColors();
  const styles = StyleSheet.create({
    wrap: { marginBottom: spacing.md, alignSelf: 'stretch' },
    label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 },
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
    inputError: { borderColor: colors.danger },
    error: { marginTop: 4, fontSize: 12, color: colors.danger },
    hint: { marginTop: 4, fontSize: 12, color: colors.textMuted },
  });

  const renderInput = () => {
    if (Platform.OS === 'web') {
      return React.createElement('input', {
        type: 'time',
        value,
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
