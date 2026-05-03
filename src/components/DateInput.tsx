import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Platform, Pressable } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
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

const pad = (n: number): string => String(n).padStart(2, '0');

const dateToISO = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const isoToDate = (iso: string): Date => {
  if (!iso) return new Date();
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
};

const todayISO = (): string => dateToISO(new Date());

const yearsAgoISO = (n: number): string => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  return dateToISO(d);
};

const formatDisplayDate = (iso: string): string => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
};

/**
 * Input de data cross-platform.
 * - Web: <input type="date"> HTML (calendário do navegador)
 * - Native (iOS/Android): @react-native-community/datetimepicker
 */
export const DateInput: React.FC<Props> = ({
  label,
  value,
  onChangeText,
  placeholder = 'Selecione a data',
  error,
  hint,
  mode,
}) => {
  useThemedColors();
  const [showPicker, setShowPicker] = useState(false);

  const minDate = mode === 'event' ? new Date() : isoToDate(yearsAgoISO(120));
  const maxDate = mode === 'birthdate' ? new Date() : undefined;

  const styles = StyleSheet.create({
    wrap: { marginBottom: spacing.md, alignSelf: 'stretch' },
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
      borderColor: error ? colors.danger : colors.border,
      fontSize: 16,
      color: colors.text,
      justifyContent: 'center',
    },
    inputText: {
      fontSize: 16,
      color: value ? colors.text : colors.textMuted,
    },
    error: { marginTop: 4, fontSize: 12, color: colors.danger },
    hint: { marginTop: 4, fontSize: 12, color: colors.textMuted },
  });

  const onNativeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    // Android dispara evento "set" ao confirmar e "dismissed" ao cancelar
    if (Platform.OS !== 'ios') {
      setShowPicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      onChangeText(dateToISO(selectedDate));
    }
  };

  const renderInput = () => {
    if (Platform.OS === 'web') {
      return React.createElement('input', {
        type: 'date',
        value,
        min: mode === 'event' ? todayISO() : yearsAgoISO(120),
        max: mode === 'birthdate' ? todayISO() : undefined,
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

    // Native: botão que abre o picker do sistema
    return (
      <>
        <Pressable style={styles.input} onPress={() => setShowPicker(true)}>
          <Text style={styles.inputText}>
            {value ? formatDisplayDate(value) : placeholder}
          </Text>
        </Pressable>
        {showPicker ? (
          <DateTimePicker
            value={value ? isoToDate(value) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onNativeChange}
            minimumDate={minDate}
            maximumDate={maxDate}
          />
        ) : null}
      </>
    );
  };

  // Fallback de texto livre não é mais usado — DateTimePicker cobre native.
  // Mantido apenas para tipos não suportados (improvável).
  if (Platform.OS !== 'web' && Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return (
      <View style={styles.wrap}>
        {label && <Text style={styles.label}>{label}</Text>}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="AAAA-MM-DD"
          placeholderTextColor={colors.textMuted}
          style={styles.input as never}
          keyboardType="numbers-and-punctuation"
        />
        {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {label && <Text style={styles.label}>{label}</Text>}
      {renderInput()}
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
};
