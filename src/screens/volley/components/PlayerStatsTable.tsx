import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, radius } from '../../../constants/theme';
import { useThemedColors } from '../../../store';
import {
  attackPercentage,
  blockPercentage,
  efficiencyThresholds,
  emptyPlayerStats,
  passPercentage,
  servePercentage,
  totalAttacks,
  totalBlocks,
  totalServes,
  totalSetActions,
} from '../../../services/volleyStats';
import { PlayerVolleyStats, VolleyPlayer } from '../../../types';

interface Props {
  players: VolleyPlayer[];
  playerStatsForMode: Record<number, PlayerVolleyStats>;
}

const COLUMNS = [
  { key: 'player', label: 'Jogador', width: 130 },
  { key: 'atk', label: 'Atk', width: 60 },
  { key: 'pAtk', label: '%Atk', width: 50 },
  { key: 'sq', label: 'Sq', width: 60 },
  { key: 'pSq', label: '%Sq', width: 50 },
  { key: 'ace', label: 'Ace', width: 40 },
  { key: 'blk', label: 'Blk', width: 60 },
  { key: 'pass', label: 'Pass A/B/C', width: 90 },
  { key: 'pPass', label: '%Pass', width: 50 },
  { key: 'lev', label: 'Lev', width: 50 },
] as const;

/**
 * Tabela detalhada de estatísticas dos jogadores. Scrollable horizontal
 * para suportar todas as colunas em telas menores.
 */
export const PlayerStatsTable: React.FC<Props> = ({ players, playerStatsForMode }) => {
  useThemedColors();
  const styles = StyleSheet.create({
    table: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceVariant,
      paddingVertical: 8,
      paddingHorizontal: 6,
    },
    headerTxt: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textSecondary,
      textTransform: 'uppercase',
    },
    row: {
      flexDirection: 'row',
      paddingVertical: 8,
      paddingHorizontal: 6,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    cell: { fontSize: 12, color: colors.text },
    pctGood: { color: colors.success, fontWeight: '800' },
    pctBad: { color: colors.danger, fontWeight: '800' },
  });

  const fmtPct = (n: number, threshold: number) => (
    <Text style={n >= threshold ? styles.pctGood : styles.pctBad}>{n.toFixed(1)}%</Text>
  );

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator>
      <View style={styles.table}>
        <View style={styles.header}>
          {COLUMNS.map((c) => (
            <Text
              key={c.key}
              style={[
                styles.headerTxt,
                { width: c.width, textAlign: c.key === 'player' ? 'left' : 'center' },
              ]}
            >
              {c.label}
            </Text>
          ))}
        </View>
        {players.map((p) => {
          const s = playerStatsForMode[p.number] ?? emptyPlayerStats();
          return (
            <View key={p.number} style={styles.row}>
              <Text style={[styles.cell, { width: 130 }]}>
                {p.name} (#{p.number})
              </Text>
              <Text style={[styles.cell, { width: 60, textAlign: 'center' }]}>
                {s.attacks.success}/{totalAttacks(s)}
              </Text>
              <Text style={[styles.cell, { width: 50, textAlign: 'center' }]}>
                {fmtPct(attackPercentage(s), efficiencyThresholds.attack)}
              </Text>
              <Text style={[styles.cell, { width: 60, textAlign: 'center' }]}>
                {s.serves.success + s.serves.ace}/{totalServes(s)}
              </Text>
              <Text style={[styles.cell, { width: 50, textAlign: 'center' }]}>
                {fmtPct(servePercentage(s), efficiencyThresholds.serve)}
              </Text>
              <Text
                style={[
                  styles.cell,
                  {
                    width: 40,
                    textAlign: 'center',
                    color: colors.warning,
                    fontWeight: '800',
                  },
                ]}
              >
                {s.serves.ace}
              </Text>
              <Text style={[styles.cell, { width: 60, textAlign: 'center' }]}>
                {s.blocks.success}/{totalBlocks(s)}
              </Text>
              <Text style={[styles.cell, { width: 90, textAlign: 'center' }]}>
                <Text style={{ color: colors.success }}>{s.passes.a}</Text>/
                <Text style={{ color: colors.warning }}>{s.passes.b}</Text>/
                <Text style={{ color: colors.danger }}>{s.passes.c}</Text>
              </Text>
              <Text style={[styles.cell, { width: 50, textAlign: 'center' }]}>
                {fmtPct(passPercentage(s), efficiencyThresholds.pass)}
              </Text>
              <Text style={[styles.cell, { width: 50, textAlign: 'center' }]}>
                {totalSetActions(s)}
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};
