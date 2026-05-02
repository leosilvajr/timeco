import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing, Vibration, Platform } from 'react-native';
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
import type { ScoreboardStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<ScoreboardStackParamList, 'ScoreboardLive'>;

const TEAM_A_COLOR = '#0F9D58';
const TEAM_B_COLOR = '#4285F4';

interface SideProps {
  team: 'A' | 'B';
  name: string;
  score: number;
  setsWon: number;
  isMatchPoint: boolean;
  isSetPoint: boolean;
  bgColor: string;
  textColor: string;
  desktop: boolean;
  onPlus: () => void;
  onMinus: () => void;
  isWinner: boolean;
}

const Side: React.FC<SideProps> = ({
  name,
  score,
  setsWon,
  isMatchPoint,
  isSetPoint,
  bgColor,
  textColor,
  desktop,
  onPlus,
  onMinus,
  isWinner,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const lastScore = useRef(score);

  useEffect(() => {
    if (score !== lastScore.current) {
      const grew = score > lastScore.current;
      lastScore.current = score;
      if (grew) {
        scaleAnim.setValue(0.7);
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 4,
          tension: 80,
        }).start();
        if (Platform.OS !== 'web') {
          Vibration.vibrate(20);
        }
      }
    }
  }, [score, scaleAnim]);

  const styles = StyleSheet.create({
    side: {
      flex: 1,
      backgroundColor: bgColor,
      borderRadius: radius.xl,
      padding: spacing.lg,
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: desktop ? 480 : 340,
      gap: spacing.md,
    },
    name: {
      fontSize: desktop ? 26 : 20,
      fontWeight: '900',
      color: textColor,
      textAlign: 'center',
      textShadowColor: 'rgba(0,0,0,0.2)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    setsRow: {
      flexDirection: 'row',
      gap: 6,
      marginTop: 4,
    },
    setBubble: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: 'rgba(255,255,255,0.3)',
    },
    setBubbleFilled: {
      backgroundColor: textColor,
    },
    scoreWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    score: {
      fontSize: desktop ? 200 : 140,
      fontWeight: '900',
      color: textColor,
      lineHeight: desktop ? 220 : 160,
      letterSpacing: -4,
      textShadowColor: 'rgba(0,0,0,0.25)',
      textShadowOffset: { width: 0, height: 4 },
      textShadowRadius: 6,
    },
    badge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: radius.pill,
      backgroundColor: 'rgba(255,255,255,0.95)',
      marginTop: 6,
    },
    badgeTxt: {
      fontSize: 12,
      fontWeight: '900',
      color: '#DB4437',
      letterSpacing: 1,
    },
    winnerBanner: {
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: radius.pill,
      backgroundColor: 'rgba(255,255,255,0.95)',
      marginTop: 4,
    },
    winnerTxt: {
      fontSize: 14,
      fontWeight: '900',
      color: bgColor,
      letterSpacing: 0.5,
    },
    btnRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      width: '100%',
    },
    btn: {
      flex: 1,
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingVertical: desktop ? 18 : 14,
      borderRadius: radius.lg,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    btnPlus: {
      backgroundColor: 'rgba(255,255,255,0.95)',
    },
    btnTxt: {
      fontSize: desktop ? 22 : 18,
      fontWeight: '900',
      color: textColor,
    },
    btnPlusTxt: {
      color: bgColor,
    },
  });

  const setsArr = Array.from({ length: 5 }, (_, i) => i < setsWon);

  return (
    <View style={styles.side}>
      <View style={{ alignItems: 'center', gap: 4 }}>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
        <View style={styles.setsRow}>
          {setsArr.map((filled, i) => (
            <View key={i} style={[styles.setBubble, filled && styles.setBubbleFilled]} />
          ))}
        </View>
        {isMatchPoint ? (
          <View style={styles.badge}>
            <Text style={styles.badgeTxt}>MATCH POINT</Text>
          </View>
        ) : isSetPoint ? (
          <View style={styles.badge}>
            <Text style={styles.badgeTxt}>SET POINT</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.scoreWrap}>
        <Animated.Text style={[styles.score, { transform: [{ scale: scaleAnim }] }]}>
          {score}
        </Animated.Text>
        {isWinner ? (
          <View style={styles.winnerBanner}>
            <Text style={styles.winnerTxt}>🏆 VENCEDOR</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.btnRow}>
        <Pressable style={styles.btn} onPress={onMinus}>
          <Text style={styles.btnTxt}>−</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.btnPlus]} onPress={onPlus}>
          <Text style={[styles.btnTxt, styles.btnPlusTxt]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
};

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
    if (!state) {
      nav.replace('ScoreboardSetup');
    }
  }, [state, nav]);

  const styles = StyleSheet.create({
    layout: {
      flex: 1,
      flexDirection: desktop ? 'row' : 'column',
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    middleBar: {
      flexDirection: desktop ? 'column' : 'row',
      gap: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: desktop ? spacing.lg : spacing.sm,
      paddingHorizontal: desktop ? spacing.sm : 0,
    },
    centerInfo: {
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: colors.surfaceVariant,
      borderRadius: radius.md,
    },
    setLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '700',
      letterSpacing: 1,
    },
    setNumber: {
      fontSize: 28,
      fontWeight: '900',
      color: colors.primary,
      lineHeight: 32,
    },
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
    actionDangerBtn: {
      borderColor: colors.danger,
    },
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
    historyRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
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
  const isAMatchPoint = mp?.team === 'A' && mp.type === 'match_point';
  const isASetPoint = mp?.team === 'A' && mp.type === 'set_point';
  const isBMatchPoint = mp?.team === 'B' && mp.type === 'match_point';
  const isBSetPoint = mp?.team === 'B' && mp.type === 'set_point';
  const isFinished = state.status === 'finished';

  const onConfirmReset = () => {
    const ok = typeof window !== 'undefined' ? window.confirm('Zerar o placar e começar de novo?') : true;
    if (ok) reset();
  };

  const onConfirmExit = () => {
    const ok = typeof window !== 'undefined' ? window.confirm('Sair do placar? A partida será descartada.') : true;
    if (ok) {
      clear();
      nav.replace('ScoreboardSetup');
    }
  };

  return (
    <Screen scroll={!desktop} maxWidth={1400}>
      <Header
        title={`${state.config.teamAName} × ${state.config.teamBName}`}
        subtitle={`Set ${state.currentSetIndex + 1} · Melhor de ${state.config.bestOfSets}`}
        onBack={onConfirmExit}
      />

      <View style={styles.layout}>
        <Side
          team="A"
          name={state.config.teamAName}
          score={cur.a}
          setsWon={sw.a}
          isMatchPoint={isAMatchPoint}
          isSetPoint={isASetPoint}
          bgColor={TEAM_A_COLOR}
          textColor="#FFFFFF"
          desktop={desktop}
          onPlus={() => point('A')}
          onMinus={() => {
            // Undo só remove o último ponto registrado, mas se foi do outro time não funciona
            // Aqui implementamos um undo simplificado: remove 1 ponto do A se possível
            const setNow = state.sets[state.currentSetIndex];
            if (setNow && setNow.a > 0 && state.history[state.history.length - 1]?.team === 'A') {
              undo();
            }
          }}
          isWinner={isFinished && state.winner === 'A'}
        />

        <View style={styles.middleBar}>
          <View style={styles.centerInfo}>
            <Text style={styles.setLabel}>SET</Text>
            <Text style={styles.setNumber}>{state.currentSetIndex + 1}</Text>
          </View>
        </View>

        <Side
          team="B"
          name={state.config.teamBName}
          score={cur.b}
          setsWon={sw.b}
          isMatchPoint={isBMatchPoint}
          isSetPoint={isBSetPoint}
          bgColor={TEAM_B_COLOR}
          textColor="#FFFFFF"
          desktop={desktop}
          onPlus={() => point('B')}
          onMinus={() => {
            const setNow = state.sets[state.currentSetIndex];
            if (setNow && setNow.b > 0 && state.history[state.history.length - 1]?.team === 'B') {
              undo();
            }
          }}
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
            Vencedor por {sw.a > sw.b ? `${sw.a}` : `${sw.b}`} sets a {sw.a > sw.b ? `${sw.b}` : `${sw.a}`}
          </Text>
        </View>
      ) : null}

      {state.sets.length > 1 || state.sets[0]?.finished ? (
        <>
          <Pressable onPress={() => setSetsCollapsed((c) => !c)}>
            <Text style={styles.historyTitle}>
              Sets jogados {setsCollapsed ? '▾' : '▴'}
            </Text>
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
