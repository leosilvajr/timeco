import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../../../components';
import { colors, spacing, radius } from '../../../constants/theme';
import { useThemedColors } from '../../../store';
import {
  attackPercentage,
  blockPercentage,
  directPoints,
  efficiencyThresholds,
  passPercentage,
  servePercentage,
  setPercentage,
  totalActions,
  totalAttacks,
  totalBlocks,
  totalErrors,
  totalPasses,
  totalServes,
  totalSetActions,
} from '../../../services/volleyStats';
import { PlayerVolleyStats, VolleyPlayer } from '../../../types';

interface Props {
  player: VolleyPlayer;
  stats: PlayerVolleyStats;
  desktop: boolean;
}

/**
 * Card de análise individual de um jogador com 5 métricas (atk/sq/pass/blk/lev)
 * + linha de performance final (pontos diretos, ações, erros, eficiência).
 */
export const PlayerStatsCard: React.FC<Props> = ({ player, stats, desktop }) => {
  useThemedColors();
  const tA = totalAttacks(stats);
  const tS = totalServes(stats);
  const tP = totalPasses(stats);
  const tB = totalBlocks(stats);
  const tSet = totalSetActions(stats);
  const dp = directPoints(stats);
  const ta = totalActions(stats);
  const eff = ta > 0 ? (dp / ta) * 100 : 0;

  const styles = StyleSheet.create({
    card: {
      marginBottom: desktop ? 0 : spacing.sm,
      flexBasis: desktop ? '48%' : '100%',
      flexGrow: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    pNum: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pNumTxt: { color: colors.white, fontWeight: '900' },
    pName: { fontSize: 15, fontWeight: '800', color: colors.text },
    pPos: { fontSize: 12, color: colors.textSecondary },
    metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    metricBox: {
      flex: 1,
      minWidth: 120,
      padding: spacing.sm,
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceVariant,
    },
    metricLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    metricValue: { fontSize: 16, fontWeight: '900', color: colors.text, marginTop: 2 },
    metricSub: { fontSize: 10, color: colors.textMuted },
    perfRow: {
      marginTop: spacing.sm,
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: colors.surfaceVariant,
      padding: spacing.sm,
      borderRadius: radius.sm,
    },
    perfCol: { alignItems: 'center' },
    perfNum: { fontSize: 18, fontWeight: '900' },
    perfLabel: { fontSize: 10, color: colors.textSecondary },
  });

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.pNum}>
          <Text style={styles.pNumTxt}>{player.number}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.pName}>{player.name}</Text>
          <Text style={styles.pPos}>{player.position}</Text>
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>⚡ Ataque</Text>
          <Text style={styles.metricValue}>{attackPercentage(stats).toFixed(1)}%</Text>
          <Text style={styles.metricSub}>
            {stats.attacks.success} pts / {tA} total
          </Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>🏐 Saque</Text>
          <Text style={styles.metricValue}>{servePercentage(stats).toFixed(1)}%</Text>
          <Text style={styles.metricSub}>
            {stats.serves.ace} aces / {tS} total
          </Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>📡 Passe</Text>
          <Text style={styles.metricValue}>{passPercentage(stats).toFixed(1)}%</Text>
          <Text style={styles.metricSub}>
            {stats.passes.a + stats.passes.b}/{tP} bons
          </Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>🛡️ Bloqueio</Text>
          <Text style={styles.metricValue}>{blockPercentage(stats).toFixed(1)}%</Text>
          <Text style={styles.metricSub}>
            {stats.blocks.success} sucesso / {tB}
          </Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>🎯 Levant.</Text>
          <Text style={styles.metricValue}>{setPercentage(stats).toFixed(1)}%</Text>
          <Text style={styles.metricSub}>
            {stats.sets.success} certos / {tSet}
          </Text>
        </View>
      </View>

      <View style={styles.perfRow}>
        <View style={styles.perfCol}>
          <Text style={[styles.perfNum, { color: colors.success }]}>{dp}</Text>
          <Text style={styles.perfLabel}>Pontos diretos</Text>
        </View>
        <View style={styles.perfCol}>
          <Text style={[styles.perfNum, { color: colors.text }]}>{ta}</Text>
          <Text style={styles.perfLabel}>Ações totais</Text>
        </View>
        <View style={styles.perfCol}>
          <Text style={[styles.perfNum, { color: colors.danger }]}>{totalErrors(stats)}</Text>
          <Text style={styles.perfLabel}>Erros totais</Text>
        </View>
        <View style={styles.perfCol}>
          <Text
            style={[
              styles.perfNum,
              {
                color:
                  eff >= efficiencyThresholds.overall ? colors.success : colors.danger,
              },
            ]}
          >
            {eff.toFixed(1)}%
          </Text>
          <Text style={styles.perfLabel}>Eficiência</Text>
        </View>
      </View>
    </Card>
  );
};
