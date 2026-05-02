import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Card, Button } from '../../components';
import { colors, spacing, radius } from '../../constants/theme';
import { useThemedColors } from '../../store';
import {
  finishCurrentSet,
  recordAction,
  subscribeVolleyMatch,
  updateScore,
} from '../../services/volleyScoutService';
import { emptyPlayerStats } from '../../services/volleyStats';
import { VolleyAction, VolleyMatch, VolleyPlayer, VolleySetData } from '../../types';
import type { VolleyStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<VolleyStackParamList, 'VolleyScout'>;
type Rt = RouteProp<VolleyStackParamList, 'VolleyScout'>;

interface ActionDef {
  action: VolleyAction;
  label: string;
  variant: 'good' | 'neutral' | 'bad' | 'gold';
}

const ACTIONS_BY_GROUP: Record<string, ActionDef[]> = {
  '🏐 SAQUE': [
    { action: 'serve_success', label: 'Certo', variant: 'good' },
    { action: 'ace', label: 'Ace', variant: 'gold' },
    { action: 'serve_error', label: 'Erro', variant: 'bad' },
  ],
  '⚡ ATAQUE': [
    { action: 'attack_point', label: 'Ponto', variant: 'good' },
    { action: 'attack', label: 'Normal', variant: 'neutral' },
    { action: 'attack_error', label: 'Erro', variant: 'bad' },
  ],
  '📡 PASSE': [
    { action: 'pass_a', label: 'A', variant: 'good' },
    { action: 'pass_b', label: 'B', variant: 'gold' },
    { action: 'pass_c', label: 'C', variant: 'bad' },
  ],
  '🛡️ BLOQUEIO': [
    { action: 'block_success', label: 'Sucesso', variant: 'good' },
    { action: 'block_error', label: 'Falha', variant: 'bad' },
  ],
  '🎯 LEVANTAMENTO': [
    { action: 'set_success', label: 'Certo', variant: 'good' },
    { action: 'set_error', label: 'Erro', variant: 'bad' },
    { action: 'set_ponta', label: 'Ponta', variant: 'neutral' },
    { action: 'set_saida', label: 'Saída', variant: 'neutral' },
    { action: 'set_meio', label: 'Meio', variant: 'neutral' },
    { action: 'set_fundo_meio', label: 'F.Meio', variant: 'neutral' },
    { action: 'set_fundo_saida', label: 'F.Saída', variant: 'neutral' },
  ],
};

const countOf = (set: VolleySetData | undefined, num: number, action: VolleyAction): number => {
  if (!set) return 0;
  const ps = set.playerStats[num] ?? emptyPlayerStats();
  switch (action) {
    case 'serve_success': return ps.serves.success;
    case 'serve_error': return ps.serves.error;
    case 'ace': return ps.serves.ace;
    case 'attack_point': return ps.attacks.success;
    case 'attack': return ps.attacks.normal;
    case 'attack_error': return ps.attacks.error;
    case 'pass_a': return ps.passes.a;
    case 'pass_b': return ps.passes.b;
    case 'pass_c': return ps.passes.c;
    case 'block_success': return ps.blocks.success;
    case 'block_error': return ps.blocks.error;
    case 'set_success': return ps.sets.success;
    case 'set_error': return ps.sets.error;
    case 'set_ponta': return ps.sets.ponta;
    case 'set_saida': return ps.sets.saida;
    case 'set_meio': return ps.sets.meio;
    case 'set_fundo_meio': return ps.sets.fundo_meio;
    case 'set_fundo_saida': return ps.sets.fundo_saida;
  }
};

export const VolleyScoutScreen: React.FC = () => {
  useThemedColors();
  const route = useRoute<Rt>();
  const nav = useNavigation<Nav>();
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
    playerCard: {
      marginBottom: spacing.sm,
    },
    playerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.sm,
    },
    pNum: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pNumTxt: { color: colors.white, fontWeight: '900' },
    pName: { fontSize: 15, fontWeight: '800', color: colors.text },
    pPos: { fontSize: 12, color: colors.textSecondary },
    groupTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textSecondary,
      marginTop: 8,
      marginBottom: 4,
    },
    actionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    actionPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingLeft: 10,
      paddingRight: 4,
      paddingVertical: 4,
      borderRadius: radius.pill,
    },
    actionLabel: { fontSize: 12, fontWeight: '700' },
    actionCount: {
      minWidth: 26,
      paddingHorizontal: 6,
      paddingVertical: 2,
      backgroundColor: 'rgba(255,255,255,0.85)',
      borderRadius: radius.pill,
      fontSize: 12,
      fontWeight: '900',
      color: '#1B2B20',
      textAlign: 'center',
      marginLeft: 4,
    },
    minusBtn: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: 'rgba(255,255,255,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 4,
    },
    minusBtnTxt: { color: '#1B2B20', fontWeight: '900', fontSize: 14 },
    bottomBar: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.md,
      marginBottom: spacing.xxl,
    },
  });

  const variantBg = (v: ActionDef['variant']): string => {
    switch (v) {
      case 'good': return colors.success;
      case 'gold': return colors.warning;
      case 'bad': return colors.danger;
      default: return colors.info;
    }
  };

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

      {match.players.map((player) => (
        <Card key={player.number} style={styles.playerCard}>
          <View style={styles.playerHeader}>
            <View style={styles.pNum}>
              <Text style={styles.pNumTxt}>{player.number}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pName}>{player.name}</Text>
              <Text style={styles.pPos}>{player.position}</Text>
            </View>
          </View>

          {Object.entries(ACTIONS_BY_GROUP).map(([group, actions]) => (
            <View key={group}>
              <Text style={styles.groupTitle}>{group}</Text>
              <View style={styles.actionsRow}>
                {actions.map((a) => (
                  <View
                    key={a.action}
                    style={[styles.actionPill, { backgroundColor: variantBg(a.variant) }]}
                  >
                    <Pressable onPress={() => onTap(player, a.action)}>
                      <Text style={[styles.actionLabel, { color: colors.white }]}>{a.label}</Text>
                    </Pressable>
                    <Text style={styles.actionCount}>
                      {countOf(currentSetData, player.number, a.action)}
                    </Text>
                    <Pressable style={styles.minusBtn} onPress={() => onMinus(player, a.action)}>
                      <Text style={styles.minusBtnTxt}>-</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </Card>
      ))}
    </Screen>
  );
};
