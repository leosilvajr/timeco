import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, radius } from '../../../constants/theme';
import { useThemedColors } from '../../../store';
import { TeamSummary } from '../../../services/volleyStats';

interface Props {
  summary: TeamSummary;
}

/**
 * Cards de eficiencia agregada do time inteiro:
 * % ataque, % saque, % passe, % bloqueio + totais de tentativas.
 * Pra Reports — complementa TeamSummaryCards (KPIs basicos).
 */
export const TeamEfficiencyCards: React.FC<Props> = ({ summary }) => {
  const c = useThemedColors();
  const styles = StyleSheet.create({
    grid: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
      flexWrap: 'wrap',
    },
    card: {
      flex: 1,
      minWidth: 140,
      borderRadius: radius.md,
      padding: spacing.sm,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    label: {
      fontSize: 11,
      color: c.textSecondary,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    pct: { fontSize: 22, fontWeight: '900', color: c.text, marginTop: 2 },
    sub: { fontSize: 11, color: c.textMuted, marginTop: 2 },
  });
  return (
    <View style={styles.grid}>
      <View style={styles.card}>
        <Text style={styles.label}>⚡ Ataque</Text>
        <Text style={styles.pct}>{summary.attackPct.toFixed(1)}%</Text>
        <Text style={styles.sub}>
          {summary.totalAttackPoints} pts / {summary.totalAttacks} tentativas
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>🎾 Saque</Text>
        <Text style={styles.pct}>{summary.servePct.toFixed(1)}%</Text>
        <Text style={styles.sub}>
          {summary.totalAces} aces / {summary.totalServes} totais
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>✋ Passe</Text>
        <Text style={styles.pct}>{summary.passPct.toFixed(1)}%</Text>
        <Text style={styles.sub}>
          {summary.totalPassesGood} A+B / {summary.totalPasses} totais
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>🛡️ Bloqueio</Text>
        <Text style={styles.pct}>{summary.blockPct.toFixed(1)}%</Text>
        <Text style={styles.sub}>
          {summary.totalBlocks} pts / {summary.totalBlocksTotal} totais
        </Text>
      </View>
      {summary.totalDumps > 0 ? (
        <View style={styles.card}>
          <Text style={styles.label}>🎯 Bola de 2ª</Text>
          <Text style={styles.pct}>
            {summary.totalDumps > 0
              ? ((summary.totalDumpPoints / summary.totalDumps) * 100).toFixed(1)
              : '0'}
            %
          </Text>
          <Text style={styles.sub}>
            {summary.totalDumpPoints} pts / {summary.totalDumps} tentativas
          </Text>
        </View>
      ) : null}
    </View>
  );
};
