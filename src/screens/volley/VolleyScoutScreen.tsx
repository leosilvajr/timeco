import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Button, Card, Badge } from '../../components';
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

type ActionKind = 'positive' | 'negative' | 'neutral';

interface ActionConfig {
  label: string;
  action: VolleyAction;
  kind: ActionKind;
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
      { label: 'A — Perfeito', action: 'pass_a', kind: 'positive', read: (s) => s.passes.a },
      { label: 'B — Bom', action: 'pass_b', kind: 'neutral', read: (s) => s.passes.b },
      { label: 'C — Mediano', action: 'pass_c', kind: 'neutral', read: (s) => s.passes.c },
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
// Styles — segue padrao Mantine-ish do resto do Timeco
// ============================================================================

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    // Scoreboard
    scoreboard: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
    teamBox: {
      flex: 1,
      padding: spacing.md,
      borderRadius: radius.md,
      alignItems: 'center',
      borderWidth: 2,
    },
    teamBoxA: { borderColor: c.primary, backgroundColor: c.surfaceVariant },
    teamBoxB: { borderColor: c.border, backgroundColor: c.surface },
    teamName: {
      fontSize: 11,
      fontWeight: '700',
      color: c.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    teamScore: { fontSize: 36, fontWeight: '900', color: c.text, lineHeight: 40, marginTop: 4 },
    teamSets: { fontSize: 11, color: c.textMuted, marginTop: 2 },

    // Section title
    sectionLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 6,
    },

    // Player pills
    playersStrip: { paddingBottom: spacing.sm },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: radius.pill,
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderColor: c.border,
      marginRight: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      height: 36,
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

    // Player heading
    playerHeading: { marginTop: spacing.md, marginBottom: spacing.sm },
    playerHeadingName: { fontSize: 17, fontWeight: '900', color: c.text },
    playerHeadingPos: { fontSize: 13, color: c.textSecondary, marginTop: 2 },

    // Cards
    cardWrap: { marginBottom: spacing.md },
    cardTitle: {
      fontSize: 11,
      fontWeight: '800',
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },

    // Linha de acao
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 8,
      marginBottom: 4,
    },
    actionDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 10,
    },
    actionLabel: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: c.text,
    },
    actionCount: {
      minWidth: 28,
      fontSize: 16,
      fontWeight: '800',
      textAlign: 'center',
      marginRight: 6,
    },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 4,
    },
    iconBtnSubtle: {
      backgroundColor: c.surfaceVariant,
    },
    iconBtnFilled: {
      backgroundColor: c.primary,
    },
    iconBtnFilledPositive: { backgroundColor: c.success },
    iconBtnFilledNegative: { backgroundColor: c.danger },
    iconBtnFilledNeutral: { backgroundColor: c.info },
    iconBtnDisabled: { opacity: 0.4 },
    iconBtnTxt: { color: c.white, fontSize: 18, fontWeight: '900', lineHeight: 22 },
    iconBtnTxtSubtle: { color: c.textSecondary, fontSize: 18, fontWeight: '900', lineHeight: 22 },
  });

const dotColor = (kind: ActionKind, c: ColorPalette) =>
  kind === 'positive' ? c.success : kind === 'negative' ? c.danger : c.info;

const filledBg = (kind: ActionKind, styles: ReturnType<typeof makeStyles>) =>
  kind === 'positive'
    ? styles.iconBtnFilledPositive
    : kind === 'negative'
    ? styles.iconBtnFilledNegative
    : styles.iconBtnFilledNeutral;

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
            <View style={{ marginTop: 4 }}>
              <Badge label="🎾 SAQUE" variant="primary" size="sm" />
            </View>
          ) : null}
        </View>
        <View style={[styles.teamBox, styles.teamBoxB]}>
          <Text style={styles.teamName}>{match.teamBName}</Text>
          <Text style={styles.teamScore}>{currentSet?.scoreB ?? 0}</Text>
          <Text style={styles.teamSets}>Sets: {setsWonB}</Text>
          {match.serveTeam === 'B' && !currentSet?.finished ? (
            <View style={{ marginTop: 4 }}>
              <Badge label="🎾 SAQUE" variant="primary" size="sm" />
            </View>
          ) : null}
        </View>
      </View>

      {/* Player selector */}
      <Text style={styles.sectionLabel}>Jogador</Text>
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
                {p.name.split(' ')[0]}
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

      {/* Cards de acoes — Card compartilhado do app */}
      {CARDS.map((card) => (
        <Card key={card.title} style={styles.cardWrap}>
          <Text style={styles.cardTitle}>
            {card.emoji}  {card.title}
          </Text>
          {card.actions.map((a) => {
            const count = a.read(playerStats);
            const dColor = dotColor(a.kind, c);
            return (
              <View
                key={a.action}
                style={[
                  styles.actionRow,
                  count > 0 ? { backgroundColor: `${dColor}14` } : null,
                ]}
              >
                <View style={[styles.actionDot, { backgroundColor: dColor }]} />
                <Text style={styles.actionLabel} numberOfLines={1}>
                  {a.label}
                </Text>
                <Text
                  style={[
                    styles.actionCount,
                    { color: count > 0 ? c.text : c.textMuted },
                  ]}
                >
                  {count}
                </Text>
                <Pressable
                  style={[
                    styles.iconBtn,
                    styles.iconBtnSubtle,
                    count === 0 ? styles.iconBtnDisabled : null,
                  ]}
                  onPress={() => handleAction(a.action, -1)}
                  disabled={busy || count === 0}
                >
                  <Text style={styles.iconBtnTxtSubtle}>−</Text>
                </Pressable>
                <Pressable
                  style={[styles.iconBtn, filledBg(a.kind, styles)]}
                  onPress={() => handleAction(a.action, 1)}
                  disabled={busy}
                >
                  <Text style={styles.iconBtnTxt}>+</Text>
                </Pressable>
              </View>
            );
          })}
        </Card>
      ))}

      {/* Footer actions */}
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
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
