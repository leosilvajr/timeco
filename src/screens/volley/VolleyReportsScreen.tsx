import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header } from '../../components';
import { colors, spacing, radius } from '../../constants/theme';
import { useThemedColors } from '../../store';
import { useResponsive } from '../../hooks/useResponsive';
import { subscribeVolleyMatch } from '../../services/volleyScoutService';
import {
  accumulateAcrossSets,
  emptyPlayerStats,
  teamSummary,
} from '../../services/volleyStats';
import { PlayerVolleyStats, VolleyMatch } from '../../types';
import type { VolleyStackParamList } from '../../navigation/types';

import { TeamSummaryCards } from './components/TeamSummaryCards';
import { PlayerStatsTable } from './components/PlayerStatsTable';
import { PlayerStatsCard } from './components/PlayerStatsCard';

type Nav = NativeStackNavigationProp<VolleyStackParamList, 'VolleyReports'>;
type Rt = RouteProp<VolleyStackParamList, 'VolleyReports'>;

type Mode = 'current' | 'all';

export const VolleyReportsScreen: React.FC = () => {
  useThemedColors();
  const route = useRoute<Rt>();
  const nav = useNavigation<Nav>();
  const responsive = useResponsive();
  const desktop = responsive.isDesktop;
  const { matchId } = route.params;
  const [match, setMatch] = useState<VolleyMatch | null>(null);
  const [mode, setMode] = useState<Mode>('current');

  useEffect(() => {
    const unsub = subscribeVolleyMatch(matchId, setMatch);
    return () => unsub();
  }, [matchId]);

  const playerStatsForMode = useMemo((): Record<number, PlayerVolleyStats> => {
    if (!match) return {};
    if (mode === 'current') {
      const set = match.sets.find((s) => s.number === match.currentSet);
      return set?.playerStats ?? {};
    }
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
    playersGrid: {
      flexDirection: desktop ? 'row' : 'column',
      flexWrap: 'wrap',
      gap: desktop ? spacing.md : 0,
    },
  });

  if (!match) {
    return (
      <Screen>
        <Header title="Carregando..." onBack={() => nav.goBack()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header
        title="Relatórios"
        subtitle={`${match.teamAName} x ${match.teamBName}`}
        onBack={() => nav.goBack()}
      />

      <View style={styles.modeRow}>
        <Pressable
          style={[styles.modeBtn, mode === 'current' && styles.modeBtnActive]}
          onPress={() => setMode('current')}
        >
          <Text style={[styles.modeTxt, mode === 'current' && styles.modeTxtActive]}>
            Set atual
          </Text>
        </Pressable>
        <Pressable
          style={[styles.modeBtn, mode === 'all' && styles.modeBtnActive]}
          onPress={() => setMode('all')}
        >
          <Text style={[styles.modeTxt, mode === 'all' && styles.modeTxtActive]}>Acumulado</Text>
        </Pressable>
      </View>

      <View style={styles.setHistoryRow}>
        {match.sets.map((s) => {
          const active = s.number === match.currentSet && mode === 'current';
          return (
            <View
              key={s.number}
              style={[styles.setHistoryChip, active && styles.setHistoryChipActive]}
            >
              <Text style={[styles.setHistoryTxt, active && styles.setHistoryTxtActive]}>
                Set {s.number}: {s.scoreA} x {s.scoreB} {s.finished ? '✓' : ''}
              </Text>
            </View>
          );
        })}
      </View>

      <TeamSummaryCards
        totalPoints={summary.totalPoints}
        totalAces={summary.totalAces}
        totalBlocks={summary.totalBlocks}
        totalErrors={summary.totalErrors}
        desktop={desktop}
      />

      <Text style={styles.sectionTitle}>Tabela detalhada</Text>
      <PlayerStatsTable players={match.players} playerStatsForMode={playerStatsForMode} />

      <Text style={styles.sectionTitle}>Análise individual</Text>
      <View style={styles.playersGrid}>
        {match.players.map((p) => (
          <PlayerStatsCard
            key={p.number}
            player={p}
            stats={playerStatsForMode[p.number] ?? emptyPlayerStats()}
            desktop={desktop}
          />
        ))}
      </View>
    </Screen>
  );
};
