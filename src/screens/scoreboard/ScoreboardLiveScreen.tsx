import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header } from '../../components';
import { colors, spacing, radius } from '../../constants/theme';
import { useThemedColors } from '../../store';
import { useResponsive } from '../../hooks/useResponsive';
import { useScoreboardStore } from '../../store/scoreboardStore';
import {
  currentSetScore,
  matchPointStatus,
  setsWonByTeams,
} from '../../services/scoreboardLogic';
import { shareText } from '../../services/shareService';
import { formatScoreboardResult } from '../../utils/scoreboardShareText';
import type { ScoreboardStackParamList } from '../../navigation/types';
import { ScoreboardSide } from './components/ScoreboardSide';

type Nav = NativeStackNavigationProp<ScoreboardStackParamList, 'ScoreboardLive'>;

const TEAM_A_COLOR = '#0F9D58';
const TEAM_B_COLOR = '#4285F4';

export const ScoreboardLiveScreen: React.FC = () => {
  useThemedColors();
  const responsive = useResponsive();
  const desktop = responsive.isDesktop || responsive.isTablet;
  const nav = useNavigation<Nav>();
  const state = useScoreboardStore((s) => s.state);
  const point = useScoreboardStore((s) => s.point);
  const undo = useScoreboardStore((s) => s.undo);
  const reset = useScoreboardStore((s) => s.reset);
  const swap = useScoreboardStore((s) => s.swap);
  const clear = useScoreboardStore((s) => s.clear);
  const [setsCollapsed, setSetsCollapsed] = useState(true);

  useEffect(() => {
    if (!state) nav.replace('ScoreboardSetup');
  }, [state, nav]);

  const styles = StyleSheet.create({
    layout: {
      flex: 1,
      flexDirection: 'row',
      gap: desktop ? spacing.md : spacing.sm,
      marginBottom: spacing.md,
    },
    middleBar: {
      flexDirection: 'column',
      gap: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: desktop ? spacing.lg : 0,
      paddingHorizontal: desktop ? spacing.sm : 0,
    },
    centerInfo: {
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: colors.surfaceVariant,
      borderRadius: radius.md,
    },
    setLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '700', letterSpacing: 1 },
    setNumber: { fontSize: 28, fontWeight: '900', color: colors.primary, lineHeight: 32 },
    actionsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginTop: spacing.sm,
    },
    actionBtn: {
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    actionTxt: { fontSize: 13, fontWeight: '700', color: colors.text },
    actionDangerBtn: { borderColor: colors.danger },
    actionDangerTxt: { color: colors.danger },
    historyTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    historyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    setChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: colors.surfaceVariant,
      borderRadius: radius.pill,
      flexDirection: 'row',
      gap: 4,
      alignItems: 'center',
    },
    setChipNumber: { fontSize: 11, color: colors.textMuted, fontWeight: '700' },
    setChipScore: { fontSize: 13, fontWeight: '800', color: colors.text },
    finishedBox: {
      padding: spacing.lg,
      backgroundColor: colors.surfaceVariant,
      borderRadius: radius.lg,
      alignItems: 'center',
      marginTop: spacing.md,
      gap: 8,
    },
    finishedTitle: { fontSize: 22, fontWeight: '900', color: colors.text },
    finishedSub: { fontSize: 14, color: colors.textSecondary },
  });

  if (!state) return null;

  const sw = setsWonByTeams(state);
  const cur = currentSetScore(state);
  const mp = matchPointStatus(state);
  const isFinished = state.status === 'finished';

  // Undo "lateral" — só desfaz se o último ponto foi do time clicado.
  const undoForTeam = (team: 'A' | 'B') => {
    const setNow = state.sets[state.currentSetIndex];
    const lastTeam = state.history[state.history.length - 1]?.team;
    const score = team === 'A' ? setNow?.a : setNow?.b;
    if (setNow && (score ?? 0) > 0 && lastTeam === team) {
      undo();
    }
  };

  const onConfirmReset = () => {
    const ok =
      typeof window !== 'undefined' ? window.confirm('Zerar o placar e começar de novo?') : true;
    if (ok) reset();
  };

  const onConfirmExit = () => {
    const ok =
      typeof window !== 'undefined'
        ? window.confirm('Sair do placar? A partida será descartada.')
        : true;
    if (ok) {
      clear();
      nav.replace('ScoreboardSetup');
    }
  };

  return (
    <Screen scroll={!desktop} maxWidth={1400}>
      <Header
        title={`${state.config.teamAName} × ${state.config.teamBName}`}
        subtitle={
          (state.config.modalityLabel ? `${state.config.modalityLabel} · ` : '') +
          (state.config.bestOfSets > 1
            ? `Set ${state.currentSetIndex + 1}/${state.config.bestOfSets} · `
            : '') +
          `Até ${state.config.pointsToWin} pts` +
          (state.config.winByTwo ? ' (vantagem 2)' : '')
        }
        onBack={onConfirmExit}
      />

      <View style={styles.layout}>
        <ScoreboardSide
          name={state.config.teamAName}
          score={cur.a}
          setsWon={sw.a}
          isMatchPoint={mp?.team === 'A' && mp.type === 'match_point'}
          isSetPoint={mp?.team === 'A' && mp.type === 'set_point'}
          bgColor={TEAM_A_COLOR}
          textColor="#FFFFFF"
          desktop={desktop}
          onPlus={() => point('A')}
          onMinus={() => undoForTeam('A')}
          isWinner={isFinished && state.winner === 'A'}
        />

        {desktop ? (
          <View style={styles.middleBar}>
            <View style={styles.centerInfo}>
              <Text style={styles.setLabel}>SET</Text>
              <Text style={styles.setNumber}>{state.currentSetIndex + 1}</Text>
            </View>
          </View>
        ) : null}

        <ScoreboardSide
          name={state.config.teamBName}
          score={cur.b}
          setsWon={sw.b}
          isMatchPoint={mp?.team === 'B' && mp.type === 'match_point'}
          isSetPoint={mp?.team === 'B' && mp.type === 'set_point'}
          bgColor={TEAM_B_COLOR}
          textColor="#FFFFFF"
          desktop={desktop}
          onPlus={() => point('B')}
          onMinus={() => undoForTeam('B')}
          isWinner={isFinished && state.winner === 'B'}
        />
      </View>

      <View style={styles.actionsRow}>
        <Pressable style={styles.actionBtn} onPress={undo} disabled={state.history.length === 0}>
          <Text style={styles.actionTxt}>↶  Desfazer</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={swap}>
          <Text style={styles.actionTxt}>⇄  Trocar lados</Text>
        </Pressable>
        <Pressable
          style={styles.actionBtn}
          onPress={() =>
            shareText(
              formatScoreboardResult(state),
              isFinished ? 'Resultado da partida · Timeco' : 'Placar atual · Timeco',
            )
          }
        >
          <Text style={styles.actionTxt}>📲  Compartilhar</Text>
        </Pressable>
        <Pressable style={[styles.actionBtn, styles.actionDangerBtn]} onPress={onConfirmReset}>
          <Text style={[styles.actionTxt, styles.actionDangerTxt]}>↻  Zerar partida</Text>
        </Pressable>
      </View>

      {isFinished ? (
        <View style={styles.finishedBox}>
          <Text style={styles.finishedTitle}>
            🏆 {state.winner === 'A' ? state.config.teamAName : state.config.teamBName}
          </Text>
          <Text style={styles.finishedSub}>
            Vencedor por {Math.max(sw.a, sw.b)} sets a {Math.min(sw.a, sw.b)}
          </Text>
        </View>
      ) : null}

      {state.sets.length > 1 || state.sets[0]?.finished ? (
        <>
          <Pressable onPress={() => setSetsCollapsed((c) => !c)}>
            <Text style={styles.historyTitle}>Sets jogados {setsCollapsed ? '▾' : '▴'}</Text>
          </Pressable>
          {!setsCollapsed ? (
            <View style={styles.historyRow}>
              {state.sets.map((s, i) => (
                <View key={i} style={styles.setChip}>
                  <Text style={styles.setChipNumber}>S{i + 1}</Text>
                  <Text style={styles.setChipScore}>
                    {s.a} × {s.b}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
};
