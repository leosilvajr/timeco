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
 * Input de hora cross-platform (web usa <input type="time">).
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

  const inputStyle = [styles.input, !!error && styles.inputError];

  const renderInput = () => {
    if (Platform.OS === 'web') {
      const webProps = { type: 'time' } as unknown as Record<string, unknown>;
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
