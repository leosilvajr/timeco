import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../constants/theme';
import { useThemedColors } from '../store';
import { SPORTS } from '../constants/sports';
import { SportId } from '../types';

interface Props {
  value: SportId;
  onChange: (id: SportId) => void;
}

/**
 * Linha horizontal de chips com todos os esportes pra seleção em
 * formulários de criação/edição de evento.
 */
export const SportPicker: React.FC<Props> = ({ value, onChange }) => {
  useThemedColors();
  const styles = StyleSheet.create({
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      marginRight: 8,
      minWidth: 78,
    },
    chipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    emoji: { fontSize: 24 },
    label: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
      marginTop: 4,
    },
  });

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginBottom: spacing.md }}
    >
      {SPORTS.map((s) => {
        const selected = value === s.id;
        return (
          <Pressable
            key={s.id}
            onPress={() => onChange(s.id)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text style={styles.emoji}>{s.emoji}</Text>
            <Text style={[styles.label, selected && { color: colors.white }]}>{s.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};
