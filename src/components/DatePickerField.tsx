import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView } from 'react-native';
import {
  format,
  addMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  parseISO,
  isValid,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { spacing, radius, ColorPalette } from '../constants/theme';
import { useThemedColors } from '../store';
import { Button } from './Button';

interface DatePickerFieldProps {
  label?: string;
  /** Data em ISO yyyy-MM-dd (ou vazio). */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Data minima permitida (yyyy-MM-dd). Datas anteriores ficam disabled. */
  minDate?: string;
  /** Permitir limpar campo (botao X). Default true. */
  allowClear?: boolean;
}

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

/**
 * Campo de data com modal de calendario mensal.
 * - Sem dependencias externas (so date-fns que ja temos)
 * - PT-BR ja localizado
 * - Suporta minDate pra desabilitar datas anteriores
 * - Funciona em web e native sem ajuste extra
 *
 * Baseado no DatePickerField do FitAdmin, adaptado pra Timeco
 * (theme + spacing/radius do projeto + Button named export).
 */
export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Selecionar data',
  minDate,
  allowClear = true,
}) => {
  const c = useThemedColors();
  const [open, setOpen] = useState(false);

  const parsedValue = useMemo(() => {
    if (value) {
      const d = parseISO(value);
      if (isValid(d)) return d;
    }
    return null;
  }, [value]);

  const minDateObj = useMemo(() => {
    if (!minDate) return null;
    const d = parseISO(minDate);
    return isValid(d) ? d : null;
  }, [minDate]);

  const [cursor, setCursor] = useState<Date>(parsedValue || new Date());

  const calendarDays = useMemo(() => {
    const start = startOfMonth(cursor);
    const end = endOfMonth(cursor);
    const days = eachDayOfInterval({ start, end });
    const firstDayOfWeek = start.getDay();
    const padStart: (Date | null)[] = Array(firstDayOfWeek).fill(null);
    return [...padStart, ...days];
  }, [cursor]);

  const displayLabel = parsedValue
    ? format(parsedValue, "dd 'de' MMM 'de' yyyy", { locale: ptBR })
    : placeholder;

  const isDayDisabled = (d: Date | null): boolean => {
    if (!d) return true;
    if (minDateObj && d < minDateObj) return true;
    return false;
  };

  const handleSelect = (d: Date) => {
    if (isDayDisabled(d)) return;
    const iso = format(d, 'yyyy-MM-dd');
    onChange(iso);
    setOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setOpen(false);
  };

  const styles = makeStyles(c);

  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        style={styles.input}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.inputIcon}>📅</Text>
        <Text style={[styles.inputText, { color: parsedValue ? c.text : c.textMuted }]}>
          {displayLabel}
        </Text>
        {parsedValue && allowClear ? (
          <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.clearIcon}>×</Text>
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => undefined} style={styles.modal}>
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => setCursor(addMonths(cursor, -1))}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.chevron}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>
                {format(cursor, "MMMM 'de' yyyy", { locale: ptBR })}
              </Text>
              <TouchableOpacity
                onPress={() => setCursor(addMonths(cursor, 1))}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.weekRow}>
              {WEEKDAY_LABELS.map((w, i) => (
                <Text key={i} style={styles.weekday}>
                  {w}
                </Text>
              ))}
            </View>

            <ScrollView style={styles.daysScroll}>
              <View style={styles.daysGrid}>
                {calendarDays.map((d, i) => {
                  if (!d) return <View key={`pad-${i}`} style={styles.dayCell} />;
                  const isSelected = parsedValue && isSameDay(d, parsedValue);
                  const isCurrentMonth = isSameMonth(d, cursor);
                  const disabled = isDayDisabled(d);
                  return (
                    <TouchableOpacity
                      key={d.toISOString()}
                      style={[
                        styles.dayCell,
                        isSelected ? styles.dayCellSelected : null,
                      ]}
                      onPress={() => handleSelect(d)}
                      disabled={disabled}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          { color: isCurrentMonth ? c.text : c.textMuted },
                          isSelected ? styles.dayTextSelected : null,
                          disabled ? { color: c.textMuted, opacity: 0.4 } : null,
                        ]}
                      >
                        {d.getDate()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <Button title="Hoje" onPress={() => handleSelect(new Date())} variant="outline" />
              <Button title="Fechar" onPress={() => setOpen(false)} variant="ghost" />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    field: { marginBottom: spacing.md },
    label: {
      fontSize: 13,
      fontWeight: '700',
      marginBottom: spacing.xs,
      color: c.textSecondary,
    },
    input: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    inputIcon: { fontSize: 16 },
    inputText: { flex: 1, fontSize: 15, fontWeight: '500' },
    clearIcon: { fontSize: 18, color: c.textMuted, fontWeight: '700' },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    modal: {
      width: '100%',
      maxWidth: 380,
      borderRadius: radius.xl,
      padding: spacing.lg,
      backgroundColor: c.surface,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '700',
      textTransform: 'capitalize',
      color: c.text,
    },
    chevron: {
      fontSize: 28,
      color: c.primary,
      fontWeight: '700',
      lineHeight: 30,
    },
    weekRow: {
      flexDirection: 'row',
      marginBottom: spacing.xs,
    },
    weekday: {
      flex: 1,
      textAlign: 'center',
      fontSize: 11,
      fontWeight: '700',
      color: c.textMuted,
    },
    daysScroll: { maxHeight: 320 },
    daysGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    dayCell: {
      width: `${100 / 7}%`,
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayCellSelected: {
      backgroundColor: c.primary,
      borderRadius: radius.md,
    },
    dayText: { fontSize: 15, fontWeight: '500' },
    dayTextSelected: { color: c.onPrimary, fontWeight: '800' },
    footer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
  });
