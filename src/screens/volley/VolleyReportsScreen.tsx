import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Card, Button } from '../../components';
import { exportMatchReportPdf } from '../../services/volleyReportExport';
import { toast } from '../../store/toastStore';
import { ColorPalette, spacing, radius } from '../../constants/theme';
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
  teamSummary,
  totalAttacks,
  totalBlocks,
  totalErrors,
  totalPasses,
  totalServes,
} from '../../services/volleyStats';
import { PlayerVolleyStats, VolleyMatch, VolleyPlayer } from '../../types';
import type { VolleyStackParamList } from '../../navigation/types';

import { TeamSummaryCards } from './components/TeamSummaryCards';
import { PlayerStatsCard } from './components/PlayerStatsCard';

type Nav = NativeStackNavigationProp<VolleyStackParamList, 'VolleyReports'>;
type Rt = RouteProp<VolleyStackParamList, 'VolleyReports'>;

type Mode = 'all' | number;

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    modeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
    modeBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: radius.md,
      alignItems: 'center',
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderColor: c.border,
    },
    modeBtnActive: { backgroundColor: c.primary, borderColor: c.primary },
    modeTxt: { color: c.text, fontWeight: '700', fontSize: 13 },
    modeTxtActive: { color: c.onPrimary },
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
      backgroundColor: c.surfaceVariant,
    },
    setHistoryChipActive: { backgroundColor: c.primary },
    setHistoryTxt: { fontSize: 12, fontWeight: '700', color: c.text },
    setHistoryTxtActive: { color: c.onPrimary },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '800',
      color: c.textMuted,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    // Compact player row (substitui tabela horizontal)
    compactCard: {
      marginBottom: spacing.sm,
      padding: spacing.md,
    },
    compactHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    compactNum: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    compactNumTxt: { color: c.onPrimary, fontWeight: '900', fontSize: 13 },
    compactName: { fontSize: 14, fontWeight: '800', color: c.text },
    compactPos: { fontSize: 11, color: c.textSecondary },
    pointsBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.pill,
      backgroundColor: c.primary + '22',
    },
    pointsBadgeTxt: { color: c.primary, fontSize: 12, fontWeight: '800' },
    metricsRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
    metric: {
      flex: 1,
      minWidth: 70,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      backgroundColor: c.surfaceVariant,
      borderRadius: radius.sm,
      alignItems: 'center',
    },
    metricLabel: {
      fontSize: 9,
      fontWeight: '700',
      color: c.textSecondary,
      textTransform: 'uppercase',
    },
    metricValue: { fontSize: 14, fontWeight: '900', marginTop: 2 },
    metricSub: { fontSize: 9, color: c.textMuted },

    // Player tabs pra analise individual — limpo, sem badge aninhado
    playersStrip: { paddingBottom: spacing.sm },
    playerChip: {
      paddingHorizontal: 16,
      height: 40,
      borderRadius: radius.pill,
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderColor: c.border,
      marginRight: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    playerChipSelected: { backgroundColor: c.primary, borderColor: c.primary },
    playerChipNum: {
      fontSize: 11,
      fontWeight: '900',
      color: c.text,
      opacity: 0.55,
    },
    playerChipNumSelected: { color: c.onPrimary, opacity: 0.85 },
    playerChipName: { fontSize: 14, fontWeight: '700', color: c.text },
    playerChipNameSelected: { color: c.onPrimary },
  });


// ============================================================================
// Main screen
// ============================================================================

export const VolleyReportsScreen: React.FC = () => {
  const c = useThemedColors();
  const route = useRoute<Rt>();
  const nav = useNavigation<Nav>();
  const { matchId } = route.params;
  const [match, setMatch] = useState<VolleyMatch | null>(null);
  // Default mode: 'all' (visao geral) se a partida ja finalizou; senao, o set atual.
  const [mode, setMode] = useState<Mode | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const styles = useMemo(() => makeStyles(c), [c]);

  useEffect(() => {
    const unsub = subscribeVolleyMatch(matchId, (m) => {
      setMatch(m);
      if (m && m.players.length > 0 && selectedPlayer === null) {
        setSelectedPlayer(m.players[0].number);
      }
      // Define o default do mode na primeira carga: finalizada -> Visao geral, senao o set atual
      if (m && mode === null) {
        setMode(m.status === 'finished' ? 'all' : m.currentSet);
      }
    });
    return () => unsub();
  }, [matchId, selectedPlayer, mode]);

  const effectiveMode: Mode = mode ?? 'all';

  const playerStatsForMode = useMemo((): Record<number, PlayerVolleyStats> => {
    if (!match) return {};
    if (effectiveMode === 'all') {
      const result: Record<number, PlayerVolleyStats> = {};
      for (const p of match.players) {
        result[p.number] = accumulateAcrossSets(match.sets, p.number);
      }
      return result;
    }
    // effectiveMode = numero do set
    const set = match.sets.find((s) => s.number === effectiveMode);
    return set?.playerStats ?? {};
  }, [match, effectiveMode]);

  const summary = useMemo(() => teamSummary(playerStatsForMode), [playerStatsForMode]);

  if (!match) {
    return (
      <Screen>
        <Header title="Carregando..." onBack={() => nav.goBack()} />
      </Screen>
    );
  }

  const selectedPlayerObj = match.players.find((p) => p.number === selectedPlayer);
  const selectedPlayerStats =
    selectedPlayer !== null
      ? playerStatsForMode[selectedPlayer] ?? emptyPlayerStats()
      : emptyPlayerStats();

  return (
    <Screen>
      <Header
        title="Relatórios"
        subtitle={`${match.teamAName} x ${match.teamBName}`}
        onBack={() => nav.goBack()}
      />

      {/* Filtros: Visao geral + um chip por set, todos clicaveis */}
      <View style={styles.setHistoryRow}>
        <Pressable
          style={[
            styles.setHistoryChip,
            effectiveMode === 'all' && styles.setHistoryChipActive,
          ]}
          onPress={() => setMode('all')}
        >
          <Text
            style={[
              styles.setHistoryTxt,
              effectiveMode === 'all' && styles.setHistoryTxtActive,
            ]}
          >
            📊 Visão geral
          </Text>
        </Pressable>
        {match.sets.map((s) => {
          const active = effectiveMode === s.number;
          return (
            <Pressable
              key={s.number}
              style={[styles.setHistoryChip, active && styles.setHistoryChipActive]}
              onPress={() => setMode(s.number)}
            >
              <Text style={[styles.setHistoryTxt, active && styles.setHistoryTxtActive]}>
                Set {s.number}: {s.scoreA}x{s.scoreB} {s.finished ? '✓' : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Team summary */}
      <Text style={styles.sectionTitle}>
        Resumo do time — {effectiveMode === 'all' ? 'Visão geral' : `Set ${effectiveMode}`}
      </Text>
      <TeamSummaryCards
        totalPoints={summary.totalPoints}
        totalAces={summary.totalAces}
        totalBlocks={summary.totalBlocks}
        totalErrors={summary.totalErrors}
        desktop={false}
      />

      {/* Análise individual — tabs por jogador */}
      <Text style={styles.sectionTitle}>Análise individual</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.playersStrip}
      >
        {match.players.map((p) => {
          const isSel = p.number === selectedPlayer;
          return (
            <Pressable
              key={p.number}
              style={[styles.playerChip, isSel && styles.playerChipSelected]}
              onPress={() => setSelectedPlayer(p.number)}
            >
              <Text style={[styles.playerChipNum, isSel && styles.playerChipNumSelected]}>
                #{p.number}
              </Text>
              <Text style={[styles.playerChipName, isSel && styles.playerChipNameSelected]}>
                {p.name.split(' ')[0]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {selectedPlayerObj ? (
        <View style={{ marginTop: spacing.sm }}>
          <PlayerStatsCard
            player={selectedPlayerObj}
            stats={selectedPlayerStats}
            desktop={false}
          />
        </View>
      ) : null}

      {/* Export PDF — disponivel sempre, mas mais util quando a partida finaliza */}
      <View style={{ marginTop: spacing.md }}>
        <Button
          title={match.status === 'finished' ? '📄 Exportar e compartilhar PDF' : '📄 Exportar PDF parcial'}
          variant="secondary"
          onPress={async () => {
            try {
              await exportMatchReportPdf(match);
            } catch (e) {
              console.error('export pdf', e);
              toast.error('Não foi possível gerar o PDF.');
            }
          }}
        />
      </View>

      <View style={{ height: spacing.xxl }} />
    </Screen>
  );
};
