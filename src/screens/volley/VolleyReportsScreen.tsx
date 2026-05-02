import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Card } from '../../components';
import { colors, spacing, radius } from '../../constants/theme';
import { useThemedColors } from '../../store';
import { subscribeVolleyMatch } from '../../services/volleyScoutService';
import {
  accumulateAcrossSets,
  attackPercentage,
  blockPercentage,
  directPoints,
  efficiencyThresholds,
  emptyPlayerStats,
  passPercentage,
  servePercentage,
  setPercentage,
  teamSummary,
  totalActions,
  totalAttacks,
  totalBlocks,
  totalErrors,
  totalPasses,
  totalServes,
  totalSetActions,
} from '../../services/volleyStats';
import { PlayerVolleyStats, VolleyMatch } from '../../types';
import type { VolleyStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<VolleyStackParamList, 'VolleyReports'>;
type Rt = RouteProp<VolleyStackParamList, 'VolleyReports'>;

type Mode = 'current' | 'all';

export const VolleyReportsScreen: React.FC = () => {
  useThemedColors();
  const route = useRoute<Rt>();
  const nav = useNavigation<Nav>();
  const { matchId } = route.params;
  const [match, setMatch] = useState<VolleyMatch | null>(null);
  const [mode, setMode] = useState<Mode>('current');

  useEffect(() => {
    const unsub = subscribeVolleyMatch(matchId, (m) => setMatch(m));
    return () => unsub();
  }, [matchId]);

  const playerStatsForMode = useMemo((): Record<number, PlayerVolleyStats> => {
    if (!match) return {};
    if (mode === 'current') {
      const set = match.sets.find((s) => s.number === match.currentSet);
      return set?.playerStats ?? {};
    }
    // acumulado: soma todos os sets
    const result: Record<number, PlayerVolleyStats> = {};
    for (const p of match.players) {
      result[p.number] = accumulateAcrossSets(match.sets, p.number);
    }
    return result;
  }, [match, mode]);

  const summary = useMemo(() => teamSummary(playerStatsForMode), [playerStatsForMode]);

  const styles = StyleSheet.create({
    modeRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    modeBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: radius.md,
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    modeBtnActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    modeTxt: { color: colors.text, fontWeight: '700', fontSize: 13 },
    modeTxtActive: { color: colors.white },
    summaryGrid: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
      flexWrap: 'wrap',
    },
    summaryCard: {
      flex: 1,
      minWidth: 140,
      borderRadius: radius.md,
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    summaryNum: { fontSize: 26, fontWeight: '900', color: colors.text },
    summaryLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
    setHistoryRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: spacing.md,
    },
    setHistoryChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceVariant,
    },
    setHistoryChipActive: {
      backgroundColor: colors.primary,
    },
    setHistoryTxt: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
    },
    setHistoryTxtActive: { color: colors.white },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.text,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    table: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceVariant,
      paddingVertical: 8,
      paddingHorizontal: 6,
    },
    tableHeaderTxt: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textSecondary,
      textTransform: 'uppercase',
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 8,
      paddingHorizontal: 6,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    tableCell: { fontSize: 12, color: colors.text },
    tableCellPlayer: { flex: 2 },
    tableCellNum: { flex: 1, textAlign: 'center' },
    pctGood: { color: colors.success, fontWeight: '800' },
    pctBad: { color: colors.danger, fontWeight: '800' },
    playerCard: { marginBottom: spacing.sm },
    playerHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
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
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    metricBox: {
      flex: 1,
      minWidth: 120,
      padding: spacing.sm,
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceVariant,
    },
    metricLabel: { fontSize: 10, color: colors.textSecondary, fontWeight: '700', textTransform: 'uppercase' },
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

  if (!match) {
    return (
      <Screen>
        <Header title="Carregando..." onBack={() => nav.goBack()} />
      </Screen>
    );
  }

  const fmtPct = (n: number, threshold: number) => {
    const good = n >= threshold;
    return (
      <Text style={good ? styles.pctGood : styles.pctBad}>{n.toFixed(1)}%</Text>
    );
  };

  return (
    <Screen>
      <Header title="Relatórios" subtitle={`${match.teamAName} x ${match.teamBName}`} onBack={() => nav.goBack()} />

      <View style={styles.modeRow}>
        <Pressable
          style={[styles.modeBtn, mode === 'current' && styles.modeBtnActive]}
          onPress={() => setMode('current')}
        >
          <Text style={[styles.modeTxt, mode === 'current' && styles.modeTxtActive]}>Set atual</Text>
        </Pressable>
        <Pressable
          style={[styles.modeBtn, mode === 'all' && styles.modeBtnActive]}
          onPress={() => setMode('all')}
        >
          <Text style={[styles.modeTxt, mode === 'all' && styles.modeTxtActive]}>Acumulado</Text>
        </Pressable>
      </View>

      <View style={styles.setHistoryRow}>
        {match.sets.map((s) => (
          <View
            key={s.number}
            style={[
              styles.setHistoryChip,
              s.number === match.currentSet && mode === 'current' && styles.setHistoryChipActive,
            ]}
          >
            <Text
              style={[
                styles.setHistoryTxt,
                s.number === match.currentSet && mode === 'current' && styles.setHistoryTxtActive,
              ]}
            >
              Set {s.number}: {s.scoreA} x {s.scoreB} {s.finished ? '✓' : ''}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNum}>{summary.totalPoints}</Text>
          <Text style={styles.summaryLabel}>Pontos diretos</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryNum, { color: colors.warning }]}>{summary.totalAces}</Text>
          <Text style={styles.summaryLabel}>Aces</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryNum, { color: colors.info }]}>{summary.totalBlocks}</Text>
          <Text style={styles.summaryLabel}>Bloqueios</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryNum, { color: colors.danger }]}>{summary.totalErrors}</Text>
          <Text style={styles.summaryLabel}>Erros</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Tabela detalhada</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderTxt, { width: 130 }]}>Jogador</Text>
            <Text style={[styles.tableHeaderTxt, { width: 60, textAlign: 'center' }]}>Atk</Text>
            <Text style={[styles.tableHeaderTxt, { width: 50, textAlign: 'center' }]}>%Atk</Text>
            <Text style={[styles.tableHeaderTxt, { width: 60, textAlign: 'center' }]}>Sq</Text>
            <Text style={[styles.tableHeaderTxt, { width: 50, textAlign: 'center' }]}>%Sq</Text>
            <Text style={[styles.tableHeaderTxt, { width: 40, textAlign: 'center' }]}>Ace</Text>
            <Text style={[styles.tableHeaderTxt, { width: 60, textAlign: 'center' }]}>Blk</Text>
            <Text style={[styles.tableHeaderTxt, { width: 90, textAlign: 'center' }]}>Pass A/B/C</Text>
            <Text style={[styles.tableHeaderTxt, { width: 50, textAlign: 'center' }]}>%Pass</Text>
            <Text style={[styles.tableHeaderTxt, { width: 50, textAlign: 'center' }]}>Lev</Text>
          </View>
          {match.players.map((p) => {
            const s = playerStatsForMode[p.number] ?? emptyPlayerStats();
            return (
              <View key={p.number} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: 130 }]}>
                  {p.name} (#{p.number})
                </Text>
                <Text style={[styles.tableCell, { width: 60, textAlign: 'center' }]}>
                  {s.attacks.success}/{totalAttacks(s)}
                </Text>
                <Text style={[styles.tableCell, { width: 50, textAlign: 'center' }]}>
                  {fmtPct(attackPercentage(s), efficiencyThresholds.attack)}
                </Text>
                <Text style={[styles.tableCell, { width: 60, textAlign: 'center' }]}>
                  {s.serves.success + s.serves.ace}/{totalServes(s)}
                </Text>
                <Text style={[styles.tableCell, { width: 50, textAlign: 'center' }]}>
                  {fmtPct(servePercentage(s), efficiencyThresholds.serve)}
                </Text>
                <Text style={[styles.tableCell, { width: 40, textAlign: 'center', color: colors.warning, fontWeight: '800' }]}>
                  {s.serves.ace}
                </Text>
                <Text style={[styles.tableCell, { width: 60, textAlign: 'center' }]}>
                  {s.blocks.success}/{totalBlocks(s)}
                </Text>
                <Text style={[styles.tableCell, { width: 90, textAlign: 'center' }]}>
                  <Text style={{ color: colors.success }}>{s.passes.a}</Text>/
                  <Text style={{ color: colors.warning }}>{s.passes.b}</Text>/
                  <Text style={{ color: colors.danger }}>{s.passes.c}</Text>
                </Text>
                <Text style={[styles.tableCell, { width: 50, textAlign: 'center' }]}>
                  {fmtPct(passPercentage(s), efficiencyThresholds.pass)}
                </Text>
                <Text style={[styles.tableCell, { width: 50, textAlign: 'center' }]}>
                  {totalSetActions(s)}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <Text style={styles.sectionTitle}>Análise individual</Text>
      {match.players.map((p) => {
        const s = playerStatsForMode[p.number] ?? emptyPlayerStats();
        const tA = totalAttacks(s);
        const tS = totalServes(s);
        const tP = totalPasses(s);
        const tB = totalBlocks(s);
        const tSet = totalSetActions(s);
        const dp = directPoints(s);
        const ta = totalActions(s);
        const eff = ta > 0 ? (dp / ta) * 100 : 0;
        return (
          <Card key={p.number} style={styles.playerCard}>
            <View style={styles.playerHeader}>
              <View style={styles.pNum}>
                <Text style={styles.pNumTxt}>{p.number}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pName}>{p.name}</Text>
                <Text style={styles.pPos}>{p.position}</Text>
              </View>
            </View>

            <View style={styles.metricsGrid}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>⚡ Ataque</Text>
                <Text style={styles.metricValue}>{attackPercentage(s).toFixed(1)}%</Text>
                <Text style={styles.metricSub}>{s.attacks.success} pts / {tA} total</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>🏐 Saque</Text>
                <Text style={styles.metricValue}>{servePercentage(s).toFixed(1)}%</Text>
                <Text style={styles.metricSub}>{s.serves.ace} aces / {tS} total</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>📡 Passe</Text>
                <Text style={styles.metricValue}>{passPercentage(s).toFixed(1)}%</Text>
                <Text style={styles.metricSub}>{s.passes.a + s.passes.b}/{tP} bons</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>🛡️ Bloqueio</Text>
                <Text style={styles.metricValue}>{blockPercentage(s).toFixed(1)}%</Text>
                <Text style={styles.metricSub}>{s.blocks.success} sucesso / {tB}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>🎯 Levant.</Text>
                <Text style={styles.metricValue}>{setPercentage(s).toFixed(1)}%</Text>
                <Text style={styles.metricSub}>{s.sets.success} certos / {tSet}</Text>
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
                <Text style={[styles.perfNum, { color: colors.danger }]}>{totalErrors(s)}</Text>
                <Text style={styles.perfLabel}>Erros totais</Text>
              </View>
              <View style={styles.perfCol}>
                <Text style={[styles.perfNum, { color: eff >= efficiencyThresholds.overall ? colors.success : colors.danger }]}>
                  {eff.toFixed(1)}%
                </Text>
                <Text style={styles.perfLabel}>Eficiência</Text>
              </View>
            </View>
          </Card>
        );
      })}
    </Screen>
  );
};
