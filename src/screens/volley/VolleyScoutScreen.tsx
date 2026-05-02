import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Button } from '../../components';
import { colors, spacing, radius } from '../../constants/theme';
import { useThemedColors } from '../../store';
import { useResponsive } from '../../hooks/useResponsive';
import {
  finishCurrentSet,
  recordAction,
  subscribeVolleyMatch,
  updateScore,
} from '../../services/volleyScoutService';
import { VolleyAction, VolleyMatch, VolleyPlayer } from '../../types';
import type { VolleyStackParamList } from '../../navigation/types';
import { PlayerActionsCard } from './components/PlayerActionsCard';

type Nav = NativeStackNavigationProp<VolleyStackParamList, 'VolleyScout'>;
type Rt = RouteProp<VolleyStackParamList, 'VolleyScout'>;

export const VolleyScoutScreen: React.FC = () => {
  useThemedColors();
  const route = useRoute<Rt>();
  const nav = useNavigation<Nav>();
  const responsive = useResponsive();
  const desktop = responsive.isDesktop;
  const { matchId } = route.params;
  const [match, setMatch] = useState<VolleyMatch | null>(null);

  useEffect(() => {
    const unsub = subscribeVolleyMatch(matchId, (m) => setMatch(m));
    return () => unsub();
  }, [matchId]);

  const styles = StyleSheet.create({
    scorebar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    teamCol: { alignItems: 'center', flex: 1 },
    teamName: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
      maxWidth: 110,
      textAlign: 'center',
    },
    scoreNum: {
      fontSize: 38,
      fontWeight: '900',
      color: colors.primary,
      marginVertical: 4,
    },
    scoreCtl: { flexDirection: 'row', gap: 6 },
    scoreBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scoreBtnPlus: { backgroundColor: colors.success },
    scoreBtnMinus: { backgroundColor: colors.danger },
    scoreBtnTxt: { color: colors.white, fontWeight: '900', fontSize: 16 },
    setCol: { alignItems: 'center', flex: 1 },
    setLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
    setNum: {
      fontSize: 22,
      fontWeight: '900',
      color: colors.text,
      backgroundColor: colors.surfaceVariant,
      paddingHorizontal: 14,
      paddingVertical: 4,
      borderRadius: radius.md,
      marginTop: 4,
    },
    quickRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    quickBtn: {
      flex: 1,
    },
    historyRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: spacing.md,
    },
    historyChip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceVariant,
    },
    historyChipTxt: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
    },
    playersGrid: {
      flexDirection: desktop ? 'row' : 'column',
      flexWrap: 'wrap',
      gap: desktop ? spacing.md : 0,
      marginBottom: spacing.xxl,
    },
  });

  const onTap = async (player: VolleyPlayer, action: VolleyAction) => {
    if (!match) return;
    try {
      await recordAction(match, player.number, action);
    } catch (e) {
      console.error('recordAction', e);
    }
  };

  const onMinus = async (player: VolleyPlayer, action: VolleyAction) => {
    if (!match) return;
    try {
      await recordAction(match, player.number, action, -1);
    } catch (e) {
      console.error('recordAction(-1)', e);
    }
  };

  const onScore = async (team: 'A' | 'B', delta: number) => {
    if (!match) return;
    await updateScore(match, team, delta);
  };

  const onFinishSet = async () => {
    if (!match) return;
    const ok = typeof window !== 'undefined' ? window.confirm(`Finalizar Set ${match.currentSet}?`) : true;
    if (!ok) return;
    await finishCurrentSet(match);
  };

  if (!match) {
    return (
      <Screen>
        <Header title="Carregando..." onBack={() => nav.goBack()} />
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  const currentSetData = match.sets.find((s) => s.number === match.currentSet);
  const finishedSets = match.sets.filter((s) => s.finished);

  return (
    <Screen>
      <Header
        title={`${match.teamAName} x ${match.teamBName}`}
        subtitle={`Set ${match.currentSet} · Melhor de ${match.format}`}
        onBack={() => nav.goBack()}
      />

      <View style={styles.scorebar}>
        <View style={styles.teamCol}>
          <Text style={styles.teamName} numberOfLines={1}>{match.teamAName}</Text>
          <Text style={styles.scoreNum}>{currentSetData?.scoreA ?? 0}</Text>
          <View style={styles.scoreCtl}>
            <Pressable style={[styles.scoreBtn, styles.scoreBtnMinus]} onPress={() => onScore('A', -1)}>
              <Text style={styles.scoreBtnTxt}>-</Text>
            </Pressable>
            <Pressable style={[styles.scoreBtn, styles.scoreBtnPlus]} onPress={() => onScore('A', 1)}>
              <Text style={styles.scoreBtnTxt}>+</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.setCol}>
          <Text style={styles.setLabel}>SET</Text>
          <Text style={styles.setNum}>{match.currentSet}</Text>
          {match.status === 'in_progress' ? (
            <Pressable onPress={onFinishSet} style={{ marginTop: 6 }}>
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12 }}>Finalizar set</Text>
            </Pressable>
          ) : (
            <Text style={{ color: colors.success, fontWeight: '800', fontSize: 12, marginTop: 6 }}>
              FINALIZADO
            </Text>
          )}
        </View>

        <View style={styles.teamCol}>
          <Text style={styles.teamName} numberOfLines={1}>{match.teamBName}</Text>
          <Text style={styles.scoreNum}>{currentSetData?.scoreB ?? 0}</Text>
          <View style={styles.scoreCtl}>
            <Pressable style={[styles.scoreBtn, styles.scoreBtnMinus]} onPress={() => onScore('B', -1)}>
              <Text style={styles.scoreBtnTxt}>-</Text>
            </Pressable>
            <Pressable style={[styles.scoreBtn, styles.scoreBtnPlus]} onPress={() => onScore('B', 1)}>
              <Text style={styles.scoreBtnTxt}>+</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {finishedSets.length > 0 ? (
        <View style={styles.historyRow}>
          {finishedSets.map((s) => (
            <View key={s.number} style={styles.historyChip}>
              <Text style={styles.historyChipTxt}>
                Set {s.number}: {s.scoreA} x {s.scoreB}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.quickRow}>
        <View style={styles.quickBtn}>
          <Button
            title="🔄 Rodízio"
            variant="outline"
            onPress={() => nav.navigate('VolleyRotation', { matchId })}
          />
        </View>
        <View style={styles.quickBtn}>
          <Button
            title="📊 Relatórios"
            variant="outline"
            onPress={() => nav.navigate('VolleyReports', { matchId })}
          />
        </View>
      </View>

      <View style={styles.playersGrid}>
        {match.players.map((player) => (
          <PlayerActionsCard
            key={player.number}
            player={player}
            currentSet={currentSetData}
            onTap={onTap}
            onMinus={onMinus}
            desktop={desktop}
          />
        ))}
      </View>
    </Screen>
  );
};
