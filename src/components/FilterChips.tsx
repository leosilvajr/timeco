import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../constants/theme';
import { useThemedColors } from '../store';

export interface FilterOption<K extends string = string> {
  key: K;
  label: string;
  count?: number;
}

interface Props<K extends string> {
  options: FilterOption<K>[];
  value: K;
  onChange: (key: K) => void;
}

/**
 * Linha de chips usada como filtro. O ativo fica com fundo primary, os
 * outros surface neutro. Suporta exibição opcional de contagem (ex:
 * "Próximos · 5"). Reutilizável em listas filtráveis.
 */
export const FilterChips = <K extends string>({ options, value, onChange }: Props<K>): React.ReactElement => {
  useThemedColors();
  const styles = StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
      flexWrap: 'wrap',
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    txt: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    txtActive: { color: colors.white },
  });
  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <Pressable
            key={opt.key}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onChange(opt.key)}
          >
            <Text style={[styles.txt, active && styles.txtActive]}>
              {opt.label}
              {opt.count != null && opt.count > 0 ? ` · ${opt.count}` : ''}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};
