import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../../../constants/theme';
import { useThemedColors } from '../../../store';

interface Props {
  totalPoints: number;
  totalAces: number;
  totalBlocks: number;
  totalErrors: number;
  desktop: boolean;
}

/**
 * 4 cards horizontais com totais agregados do time:
 * pontos diretos, aces, bloqueios e erros.
 */
export const TeamSummaryCards: React.FC<Props> = ({
  totalPoints,
  totalAces,
  totalBlocks,
  totalErrors,
  desktop,
}) => {
  useThemedColors();
  const styles = StyleSheet.create({
    grid: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
      flexWrap: 'wrap',
    },
    card: {
      flex: 1,
      minWidth: desktop ? 200 : 140,
      borderRadius: radius.md,
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    num: { fontSize: 26, fontWeight: '900', color: colors.text },
    label: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  });
  return (
    <View style={styles.grid}>
      <View style={styles.card}>
        <Text style={styles.num}>{totalPoints}</Text>
        <Text style={styles.label}>Pontos diretos</Text>
      </View>
      <View style={styles.card}>
        <Text style={[styles.num, { color: colors.warning }]}>{totalAces}</Text>
        <Text style={styles.label}>Aces</Text>
      </View>
      <View style={styles.card}>
        <Text style={[styles.num, { color: colors.info }]}>{totalBlocks}</Text>
        <Text style={styles.label}>Bloqueios</Text>
      </View>
      <View style={styles.card}>
        <Text style={[styles.num, { color: colors.danger }]}>{totalErrors}</Text>
        <Text style={styles.label}>Erros</Text>
      </View>
    </View>
  );
};
