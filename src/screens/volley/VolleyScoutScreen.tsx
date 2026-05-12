import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Button } from '../../components';
import { ColorPalette, spacing, radius } from '../../constants/theme';
import { useThemedColors } from '../../store';
import {
  getVolleyMatch,
  subscribeVolleyMatch,
  performScoutAction,
  finishCurrentSet,
  undoLastPoint,
} from '../../services/volleyScoutService';
import { emptyPlayerStats } from '../../services/volleyStats';
import { useResponsive } from '../../hooks/useResponsive';
import { toast } from '../../store/toastStore';
import { VolleyAction, VolleyMatch, VolleyPlayer, PlayerVolleyStats } from '../../types';
import type { VolleyStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<VolleyStackParamList, 'VolleyScout'>;
type Rt = RouteProp<VolleyStackParamList, 'VolleyScout'>;

// ============================================================================
// Configuracao das acoes — define os 5 cards e suas opcoes
// ============================================================================

type ActionKind = 'positive' | 'negative' | 'neutral';

interface ActionConfig {
  label: string;
  action: VolleyAction;
  kind: ActionKind;
  /** Lê o valor atual no PlayerVolleyStats. */
  read: (s: PlayerVolleyStats) => number;
}

interface CardConfig {
  title: string;
  emoji: string;
  actions: ActionConfig[];
}

const CARDS: CardConfig[] = [
  {
    title: 'SAQUE',
    emoji: '🎾',
    actions: [
      { label: 'Certo', action: 'serve_success', kind: 'neutral', read: (s) => s.serves.success },
      { label: 'Erro', action: 'serve_error', kind: 'negative', read: (s) => s.serves.error },
      { label: 'Ace', action: 'ace', kind: 'positive', read: (s) => s.serves.ace },
    ],
  },
  {
    title: 'ATAQUE',
    emoji: '⚡',
    actions: [
      { label: 'Ponto', action: 'attack_point', kind: 'positive', read: (s) => s.attacks.success },
      { label: 'Normal', action: 'attack', kind: 'neutral', read: (s) => s.attacks.normal },
      { label: 'Erro', action: 'attack_error', kind: 'negative', read: (s) => s.attacks.error },
    ],
  },
  {
    title: 'PASSE',
    emoji: '✋',
    actions: [
      { label: 'A', action: 'pass_a', kind: 'positive', read: (s) => s.passes.a },
      { label: 'B', action: 'pass_b', kind: 'neutral', read: (s) => s.passes.b },
      { label: 'C', action: 'pass_c', kind: 'neutral', read: (s) => s.passes.c },
      { label: 'Erro', action: 'pass_error', kind: 'negative', read: (s) => s.passes.error },
    ],
  },
  {
    title: 'BLOQUEIO',
    emoji: '🛡️',
    actions: [
      { label: 'Sucesso', action: 'block_success', kind: 'positive', read: (s) => s.blocks.success },
      { label: 'Normal', action: 'block_normal', kind: 'neutral', read: (s) => s.blocks.normal },
      { label: 'Falha', action: 'block_error', kind: 'negative', read: (s) => s.blocks.error },
    ],
  },
  {
    title: 'LEVANTAMENTO',
    emoji: '🎯',
    actions: [
      { label: 'Certo', action: 'set_success', kind: 'positive', read: (s) => s.sets.success },
      { label: 'Erro', action: 'set_error', kind: 'negative', read: (s) => s.sets.error },
      { label: 'Ponta', action: 'set_ponta', kind: 'neutral', read: (s) => s.sets.ponta },
      { label: 'Saída', action: 'set_saida', kind: 'neutral', read: (s) => s.sets.saida },
      { label: 'Meio', action: 'set_meio', kind: 'neutral', read: (s) => s.sets.meio },
      { label: 'F.Meio', action: 'set_fundo_meio', kind: 'neutral', read: (s) => s.sets.fundo_meio },
      { label: 'F.Saída', action: 'set_fundo_saida', kind: 'neutral', read: (s) => s.sets.fundo_saida },
    ],
  },
];

// ============================================================================
// Styles
// ============================================================================

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    scoreboard: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    teamBox: {
      flex: 1,
      padding: spacing.md,
      borderRadius: radius.md,
      alignItems: 'center',
      borderWidth: 2,
    },
    teamBoxA: { borderColor: c.primary, backgroundColor: c.surfaceVariant },
    teamBoxB: { borderColor: c.border, backgroundColor: c.surface },
    teamName: { fontSize: 12, fontWeight: '700', color: c.textSecondary },
    teamScore: { fontSize: 38, fontWeight: '900', color: c.text, lineHeight: 42 },
    teamSets: { fontSize: 11, color: c.textMuted, marginTop: 2 },
    serveBadge: { fontSize: 10, fontWeight: '800', color: c.primary, marginTop: 2 },

    playersStrip: { paddingBottom: spacing.sm },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      borderRadius: radius.pill,
      backgroundColor: c.surface,
      borderWidth: 2,
      borderColor: c.border,
      marginRight: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    chipSelected: { backgroundColor: c.primary, borderColor: c.primary },
    chipNum: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipNumSelected: { backgroundColor: c.surface },
    chipNumTxt: { color: c.onPrimary, fontSize: 12, fontWeight: '900' },
    chipNumTxtSelected: { color: c.primary },
    chipName: { fontSize: 13, fontWeight: '700', color: c.text },
    chipNameSelected: { color: c.onPrimary },

    playerHeading: { marginTop: spacing.md, marginBottom: spacing.sm },
    playerHeadingName: { fontSize: 18, fontWeight: '900', color: c.text },
    playerHeadingPos: { fontSize: 13, color: c.textSecondary, marginTop: 2 },

    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    cardTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: c.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    actionLabel: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      alignItems: 'center',
    },
    actionLabelPositive: { backgroundColor: c.success },
    actionLabelNegative: { backgroundColor: c.danger },
    actionLabelNeutral: { backgroundColor: c.info },
    actionLabelTxt: { color: c.white, fontSize: 14, fontWeight: '800' },
    actionCount: { minWidth: 36, fontSize: 18, fontWeight: '900', color: c.text, textAlign: 'center' },
    plusBtn: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: c.success,
      alignItems: 'center',
      justifyContent: 'center',
    },
    minusBtn: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: c.danger,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnTxt: { color: c.white, fontSize: 18, fontWeight: '900' },

    footerActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  });

// ============================================================================
// Main screen
// ============================================================================

export const VolleyScoutScreen: React.FC = () => {
  const c = useThemedColors();
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const responsive = useResponsive();
  const styles = useMemo(() => makeStyles(c), [c]);

  const [match, setMatch] = useState<VolleyMatch | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const m = await getVolleyMatch(route.params.matchId);
    setMatch(m);
    if (m && m.players.length > 0 && selectedPlayer === null) {
      setSelectedPlayer(m.players[0].number);
    }
  }, [route.params.matchId, selectedPlayer]);

  useEffect(() => {
    load();
    const unsub = subscribeVolleyMatch(route.params.matchId, (m) => {
      if (m) setMatch(m);
    });
    return () => unsub();
  }, [route.params.matchId]);

  const currentSet = match?.sets[match.currentSet - 1];
  const setsWonA = match?.sets.filter((s) => s.finished && s.scoreA > s.scoreB).length ?? 0;
  const setsWonB = match?.sets.filter((s) => s.finished && s.scoreB > s.scoreA).length ?? 0;

  const playerStats: PlayerVolleyStats = useMemo(() => {
    if (!currentSet || selectedPlayer === null) return emptyPlayerStats();
    return currentSet.playerStats[selectedPlayer] ?? emptyPlayerStats();
  }, [currentSet, selectedPlayer]);

  const handleAction = async (action: VolleyAction, delta: 1 | -1) => {
    if (busy || !match || selectedPlayer === null) return;
    setBusy(true);
    try {
      await performScoutAction(match, selectedPlayer, action, delta);
    } catch (e) {
      console.error('performScoutAction', e);
      toast.error('Erro ao registrar ação. Tente de novo.');
    } finally {
      setBusy(false);
    }
  };

  const onUndoLastPoint = async () => {
    if (!match) return;
    setBusy(true);
    try {
      await undoLastPoint(match);
      toast.info('Último ponto desfeito.');
    } catch (e) {
      console.error('undoLastPoint', e);
      toast.error('Erro ao desfazer ponto.');
    } finally {
      setBusy(false);
    }
  };

  const onCloseSet = async () => {
    if (!match || !currentSet || currentSet.finished) return;
    const proceed =
      typeof window !== 'undefined' ? window.confirm('Encerrar este set?') : true;
    if (!proceed) return;
    setBusy(true);
    try {
      await finishCurrentSet(match);
      toast.success('Set encerrado!');
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (!match) {
    return (
      <Screen>
        <Header title="Carregando..." onBack={() => nav.goBack()} />
      </Screen>
    );
  }

  const selectedPlayerObj: VolleyPlayer | undefined = match.players.find(
    (p) => p.number === selectedPlayer,
  );

  return (
    <Screen maxWidth={responsive.isDesktop ? 1200 : undefined}>
      <Header
        title={`Set ${match.currentSet}`}
        subtitle={`${match.teamAName} vs ${match.teamBName}`}
        onBack={() => nav.goBack()}
      />

      {/* Scoreboard compacto */}
      <View style={styles.scoreboard}>
        <View style={[styles.teamBox, styles.teamBoxA]}>
          <Text style={styles.teamName}>{match.teamAName}</Text>
          <Text style={styles.teamScore}>{currentSet?.scoreA ?? 0}</Text>
          <Text style={styles.teamSets}>Sets: {setsWonA}</Text>
          {match.serveTeam === 'A' && !currentSet?.finished ? (
            <Text style={styles.serveBadge}>🎾 SAQUE</Text>
          ) : null}
        </View>
        <View style={[styles.teamBox, styles.teamBoxB]}>
          <Text style={styles.teamName}>{match.teamBName}</Text>
          <Text style={styles.teamScore}>{currentSet?.scoreB ?? 0}</Text>
          <Text style={styles.teamSets}>Sets: {setsWonB}</Text>
          {match.serveTeam === 'B' && !currentSet?.finished ? (
            <Text style={styles.serveBadge}>🎾 SAQUE</Text>
          ) : null}
        </View>
      </View>

      {/* Chips de jogadores (tab navigator horizontal) */}
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
              style={[styles.chip, isSel && styles.chipSelected]}
              onPress={() => setSelectedPlayer(p.number)}
            >
              <View style={[styles.chipNum, isSel && styles.chipNumSelected]}>
                <Text style={[styles.chipNumTxt, isSel && styles.chipNumTxtSelected]}>
                  {p.number}
                </Text>
              </View>
              <Text style={[styles.chipName, isSel && styles.chipNameSelected]}>
                {p.name.split(' ')[0].toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Player heading */}
      {selectedPlayerObj ? (
        <View style={styles.playerHeading}>
          <Text style={styles.playerHeadingName}>
            #{selectedPlayerObj.number} {selectedPlayerObj.name}
          </Text>
          <Text style={styles.playerHeadingPos}>{selectedPlayerObj.position}</Text>
        </View>
      ) : null}

      {/* Cards de ações */}
      {CARDS.map((card) => (
        <View key={card.title} style={styles.card}>
          <Text style={styles.cardTitle}>
            {card.emoji}  {card.title}
          </Text>
          {card.actions.map((a) => {
            const labelStyle =
              a.kind === 'positive'
                ? styles.actionLabelPositive
                : a.kind === 'negative'
                ? styles.actionLabelNegative
                : styles.actionLabelNeutral;
            const count = a.read(playerStats);
            return (
              <View key={a.action} style={styles.actionRow}>
                <View style={[styles.actionLabel, labelStyle]}>
                  <Text style={styles.actionLabelTxt}>{a.label}</Text>
                </View>
                <Text style={styles.actionCount}>{count}</Text>
                <Pressable style={styles.plusBtn} onPress={() => handleAction(a.action, 1)}>
                  <Text style={styles.btnTxt}>+</Text>
                </Pressable>
                <Pressable
                  style={styles.minusBtn}
                  onPress={() => handleAction(a.action, -1)}
                  disabled={count === 0}
                >
                  <Text style={[styles.btnTxt, count === 0 ? { opacity: 0.4 } : null]}>−</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      ))}

      {/* Footer actions */}
      <View style={styles.footerActions}>
        <View style={{ flex: 1 }}>
          <Button title="↶ Desfazer ponto" variant="outline" onPress={onUndoLastPoint} />
        </View>
        {!currentSet?.finished ? (
          <View style={{ flex: 1 }}>
            <Button title="🏁 Encerrar set" variant="ghost" onPress={onCloseSet} />
          </View>
        ) : null}
      </View>

      <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
        <Button
          title="📊 Relatórios"
          variant="secondary"
          onPress={() => nav.navigate('VolleyReports', { matchId: match.id })}
        />
        <Button
          title="🔄 Rotação"
          variant="ghost"
          onPress={() => nav.navigate('VolleyRotation', { matchId: match.id })}
        />
      </View>

      <View style={{ height: spacing.xxl }} />
    </Screen>
  );
};
