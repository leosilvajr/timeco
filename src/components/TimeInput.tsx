import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Platform, Pressable } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
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

const pad = (n: number): string => String(n).padStart(2, '0');

const timeToHHMM = (d: Date): string => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

const hhmmToDate = (hhmm: string): Date => {
  const d = new Date();
  if (!hhmm) return d;
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isFinite(h) && Number.isFinite(m)) {
    d.setHours(h, m, 0, 0);
  }
  return d;
};

/**
 * Input de hora cross-platform.
 * - Web: <input type="time"> HTML
 * - Native (Android/iOS): @react-native-community/datetimepicker
 */
export const TimeInput: React.FC<Props> = ({
  label,
  value,
  onChangeText,
  placeholder = 'Selecione o horário',
  error,
  hint,
}) => {
  useThemedColors();
  const [showPicker, setShowPicker] = useState(false);

  const styles = StyleSheet.create({
    wrap: { marginBottom: spacing.md, alignSelf: 'stretch' },
    label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 },
    input: {
      minHeight: 50,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      borderWidth: 1.5,
      borderColor: error ? colors.danger : colors.border,
      fontSize: 16,
      color: colors.text,
      justifyContent: 'center',
    },
    inputText: { fontSize: 16, color: value ? colors.text : colors.textMuted },
    error: { marginTop: 4, fontSize: 12, color: colors.danger },
    hint: { marginTop: 4, fontSize: 12, color: colors.textMuted },
  });

  const onNativeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') {
      setShowPicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      onChangeText(timeToHHMM(selectedDate));
    }
  };

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
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      return (
        <>
          <Pressable style={styles.input} onPress={() => setShowPicker(true)}>
            <Text style={styles.inputText}>{value || placeholder}</Text>
          </Pressable>
          {showPicker ? (
            <DateTimePicker
              value={hhmmToDate(value)}
              mode="time"
              is24Hour
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onNativeChange}
            />
          ) : null}
        </>
      );
    }
    // Fallback
    return (
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="HH:MM"
        placeholderTextColor={colors.textMuted}
        style={styles.input as never}
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
