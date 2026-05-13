import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Button } from '../../components';
import { ColorPalette, spacing, radius } from '../../constants/theme';
import { useThemedColors } from '../../store';
import {
  getVolleyMatch,
  subscribeVolleyMatch,
  performScoutAction,
  previewScoutAction,
  finishCurrentSet,
  undoLastPoint,
  resetVolleyMatch,
  startVolleyMatch,
} from '../../services/volleyScoutService';
import { emptyPlayerStats } from '../../services/volleyStats';
import { isSetWon, setMomentum } from '../../services/volleyRules';
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

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    // Scoreboard compacto (pela metade)
    scoreboard: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    teamBox: {
      flex: 1,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 10,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 2,
      gap: 10,
    },
    teamBoxA: { borderColor: c.primary, backgroundColor: c.surfaceVariant },
    teamBoxB: { borderColor: c.border, backgroundColor: c.surface },
    teamInfo: { flex: 1, minWidth: 0 },
    teamName: {
      fontSize: 10,
      fontWeight: '800',
      color: c.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    teamScore: { fontSize: 24, fontWeight: '900', color: c.text, lineHeight: 26, minWidth: 30, textAlign: 'right' },
    teamSets: { fontSize: 10, color: c.textMuted, marginTop: 1 },

    sectionLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 6,
    },

    // Tab navigator de jogadores
    playersStrip: { paddingBottom: spacing.sm },
    tab: {
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
    tabSelected: { backgroundColor: c.primary, borderColor: c.primary },
    tabNum: {
      fontSize: 11,
      fontWeight: '900',
      color: c.text,
      opacity: 0.55,
    },
    tabNumSelected: { color: c.onPrimary, opacity: 0.85 },
    tabName: { fontSize: 14, fontWeight: '700', color: c.text },
    tabNameSelected: { color: c.onPrimary },

    // Player heading
    playerHeading: { marginTop: spacing.sm, marginBottom: 10 },
    playerHeadingName: { fontSize: 17, fontWeight: '900', color: c.text },
    playerHeadingPos: { fontSize: 11, color: c.textSecondary, marginTop: 2 },

    // Card
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.sm,
      marginBottom: 10,
    },
    cardTitle: {
      fontSize: 11,
      fontWeight: '800',
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 6,
      textAlign: 'center',
    },

    // Action row
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 2,
      paddingHorizontal: 10,
      borderRadius: 8,
      marginBottom: 2,
    },
    actionDot: { width: 8, height: 8, borderRadius: 4 },
    actionLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: c.text },
    actionCount: {
      minWidth: 28,
      fontSize: 18,
      fontWeight: '900',
      textAlign: 'center',
    },
    btn: {
      width: 30,
      height: 30,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnMinus: { backgroundColor: c.border },
    btnMinusDisabled: { backgroundColor: c.surfaceVariant },
    btnPlusPositive: { backgroundColor: c.success },
    btnPlusNegative: { backgroundColor: c.danger },
    btnPlusNeutral: { backgroundColor: c.info },
    btnTxt: {
      fontSize: 18,
      fontWeight: '900',
      lineHeight: 22,
      color: c.white,
    },
    btnTxtMinus: { color: c.text },
    btnTxtMinusDisabled: { color: c.textMuted },
  });

const dotColor = (kind: ActionKind, c: ColorPalette) =>
  kind === 'positive' ? c.success : kind === 'negative' ? c.danger : c.info;

const plusBg = (kind: ActionKind, styles: ReturnType<typeof makeStyles>) =>
  kind === 'positive'
    ? styles.btnPlusPositive
    : kind === 'negative'
    ? styles.btnPlusNegative
    : styles.btnPlusNeutral;

export const VolleyScoutScreen: React.FC = () => {
  const c = useThemedColors();
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const responsive = useResponsive();
  const { width: windowW } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(c), [c]);

  // Em landscape (tela larga >= 720) cards lado a lado em 2 colunas
  const isWide = windowW >= 720;

  const [match, setMatch] = useState<VolleyMatch | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const matchRef = useRef<VolleyMatch | null>(null);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    matchRef.current = match;
  }, [match]);

  const load = useCallback(async () => {
    const m = await getVolleyMatch(route.params.matchId);
    setMatch(m);
    if (m && m.players.length > 0 && selectedPlayer === null) {
      setSelectedPlayer(m.players[0].number);
    }
  }, [route.params.matchId, selectedPlayer]);

  useEffect(() => {
    const unsub = subscribeVolleyMatch(route.params.matchId, (m) => {
      if (m) {
        setMatch(m);
        matchRef.current = m;
      }
    });
    return () => unsub();
  }, [route.params.matchId]);

  useEffect(() => {
    if (match && match.players.length > 0 && selectedPlayer === null) {
      setSelectedPlayer(match.players[0].number);
    }
  }, [match, selectedPlayer]);

  const currentSet = match?.sets[match.currentSet - 1];
  const setsWonA = match?.sets.filter((s) => s.finished && s.scoreA > s.scoreB).length ?? 0;
  const setsWonB = match?.sets.filter((s) => s.finished && s.scoreB > s.scoreA).length ?? 0;

  const playerStats: PlayerVolleyStats = useMemo(() => {
    if (!currentSet || selectedPlayer === null) return emptyPlayerStats();
    return currentSet.playerStats[selectedPlayer] ?? emptyPlayerStats();
  }, [currentSet, selectedPlayer]);

  const handleAction = (action: VolleyAction, delta: 1 | -1) => {
    const current = matchRef.current;
    if (!current || selectedPlayer === null) return;
    if (current.status === 'finished' || current.status === 'scheduled') return;

    // Optimistic UI
    const next = previewScoutAction(current, selectedPlayer, action, delta);
    if (!next) return;
    setMatch(next);
    matchRef.current = next;

    // Persistencia serializada em background
    writeQueueRef.current = writeQueueRef.current
      .then(() => performScoutAction(current, selectedPlayer, action, delta))
      .catch((e) => {
        console.error('performScoutAction', e);
        toast.error('Erro de rede. Sincronizando...');
        getVolleyMatch(route.params.matchId).then((m) => {
          if (m) {
            setMatch(m);
            matchRef.current = m;
          }
        });
      });
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

  const onStartMatch = async () => {
    if (!match) return;
    setBusy(true);
    try {
      await startVolleyMatch(match.id);
      toast.success('Partida iniciada!');
    } catch (e) {
      console.error('startVolleyMatch', e);
      toast.error('Não conseguimos iniciar a partida.');
    } finally {
      setBusy(false);
    }
  };

  const onResetAll = async () => {
    if (!match) return;
    const proceed =
      typeof window !== 'undefined'
        ? window.confirm(
            'Zerar tudo? Todos os sets, placares e estatísticas vão ser apagados. Essa ação não pode ser desfeita.',
          )
        : true;
    if (!proceed) return;
    setBusy(true);
    try {
      await resetVolleyMatch(match);
      toast.success('Tudo zerado! Partida começa do zero.');
      await load();
    } catch (e) {
      console.error('resetVolleyMatch', e);
      toast.error('Erro ao zerar partida.');
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

  const isLocked = match.status !== 'in_progress';

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

      {/* Banners de status */}
      {match.status === 'scheduled' ? (
        <View
          style={{
            backgroundColor: c.warning + '22',
            borderWidth: 2,
            borderColor: c.warning,
            borderRadius: 10,
            padding: 14,
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '800', color: c.warning, marginBottom: 6, textAlign: 'center' }}>
            ⏳ PARTIDA AGENDADA
          </Text>
          <Text style={{ fontSize: 13, color: c.text, marginBottom: 10, textAlign: 'center' }}>
            Essa partida está marcada pra{' '}
            <Text style={{ fontWeight: '800' }}>
              {match.date.split('-').reverse().join('/')}
            </Text>
            . Inicie agora pra começar a registrar.
          </Text>
          <Button title="🏐 Iniciar partida agora" onPress={onStartMatch} loading={busy} />
        </View>
      ) : null}
      {match.status === 'finished' ? (
        <View
          style={{
            backgroundColor: c.success + '22',
            borderWidth: 2,
            borderColor: c.success,
            borderRadius: 10,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '800', color: c.success, marginBottom: 4, textAlign: 'center' }}>
            🏁 PARTIDA FINALIZADA
          </Text>
          <Text style={{ fontSize: 12, color: c.textSecondary, textAlign: 'center' }}>
            Modo somente leitura. Os contadores não podem mais ser alterados.
          </Text>
        </View>
      ) : null}

      {/* Banner de SET POINT / MATCH POINT / SET GANHO */}
      {currentSet && !currentSet.finished
        ? (() => {
            const won = isSetWon(currentSet, match.format);
            if (won.won) {
              const winnerName = won.winner === 'A' ? match.teamAName : match.teamBName;
              return (
                <Pressable
                  onPress={onCloseSet}
                  style={{
                    marginBottom: 6,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    backgroundColor: c.success,
                  }}
                >
                  <Text
                    style={{
                      color: c.white,
                      fontSize: 12,
                      fontWeight: '900',
                      textAlign: 'center',
                      letterSpacing: 0.5,
                    }}
                  >
                    🏆 {winnerName.toUpperCase()} VENCEU O SET — TOQUE PRA ENCERRAR
                  </Text>
                </Pressable>
              );
            }
            const m = setMomentum(currentSet, match);
            if (m.kind === 'normal') return null;
            const teamName = m.team === 'A' ? match.teamAName : match.teamBName;
            const bg = m.kind === 'match_point' ? c.danger : c.warning;
            const label = m.kind === 'match_point' ? 'MATCH POINT' : 'SET POINT';
            return (
              <View
                style={{
                  marginBottom: 6,
                  paddingVertical: 4,
                  paddingHorizontal: 10,
                  borderRadius: 8,
                  backgroundColor: bg,
                }}
              >
                <Text
                  style={{
                    color: c.white,
                    fontSize: 11,
                    fontWeight: '900',
                    textAlign: 'center',
                    letterSpacing: 0.5,
                  }}
                >
                  ⚡ {label} — {teamName}
                </Text>
              </View>
            );
          })()
        : null}

      {/* Scoreboard compacto */}
      <View style={styles.scoreboard}>
        <View style={[styles.teamBox, styles.teamBoxA]}>
          <View style={styles.teamInfo}>
            <Text style={styles.teamName} numberOfLines={1}>
              {match.teamAName}
            </Text>
            <Text style={styles.teamSets}>
              Sets {setsWonA}
              {match.serveTeam === 'A' && !currentSet?.finished ? ' · 🎾' : ''}
            </Text>
          </View>
          <Text style={styles.teamScore}>{currentSet?.scoreA ?? 0}</Text>
        </View>
        <View style={[styles.teamBox, styles.teamBoxB]}>
          <View style={styles.teamInfo}>
            <Text style={styles.teamName} numberOfLines={1}>
              {match.teamBName}
            </Text>
            <Text style={styles.teamSets}>
              Sets {setsWonB}
              {match.serveTeam === 'B' && !currentSet?.finished ? ' · 🎾' : ''}
            </Text>
          </View>
          <Text style={styles.teamScore}>{currentSet?.scoreB ?? 0}</Text>
        </View>
      </View>

      {/* Player tabs */}
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
              style={[styles.tab, isSel && styles.tabSelected]}
              onPress={() => setSelectedPlayer(p.number)}
            >
              <Text style={[styles.tabNum, isSel && styles.tabNumSelected]}>
                #{p.number}
              </Text>
              <Text style={[styles.tabName, isSel && styles.tabNameSelected]}>
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

      {/* Cards — em landscape (>=720px) usa grid de 2 colunas */}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: isWide ? 10 : 0,
        }}
      >
      {CARDS.map((card) => (
        <View
          key={card.title}
          style={[
            styles.card,
            isWide
              ? { width: '48%', flexGrow: 1, marginBottom: 0 }
              : null,
          ]}
        >
          <Text style={styles.cardTitle}>
            {card.emoji}  {card.title}
          </Text>
          {card.actions.map((a) => {
            const count = a.read(playerStats);
            const dot = dotColor(a.kind, c);
            const hasValue = count > 0;
            return (
              <View
                key={a.action}
                style={[
                  styles.actionRow,
                  hasValue ? { backgroundColor: `${dot}14` } : null,
                ]}
              >
                <View style={[styles.actionDot, { backgroundColor: dot }]} />
                <Text style={styles.actionLabel} numberOfLines={1}>
                  {a.label}
                </Text>
                <Text
                  style={[
                    styles.actionCount,
                    { color: hasValue ? c.text : c.textMuted },
                  ]}
                >
                  {count}
                </Text>
                <Pressable
                  style={[
                    styles.btn,
                    count === 0 || isLocked ? styles.btnMinusDisabled : styles.btnMinus,
                    isLocked ? { opacity: 0.5 } : null,
                  ]}
                  onPress={() => handleAction(a.action, -1)}
                  disabled={busy || count === 0 || isLocked}
                >
                  <Text
                    style={[
                      styles.btnTxt,
                      count === 0 || isLocked ? styles.btnTxtMinusDisabled : styles.btnTxtMinus,
                    ]}
                  >
                    −
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.btn,
                    isLocked ? styles.btnMinusDisabled : plusBg(a.kind, styles),
                    isLocked ? { opacity: 0.5 } : null,
                  ]}
                  onPress={() => handleAction(a.action, 1)}
                  disabled={busy || isLocked}
                >
                  <Text style={[styles.btnTxt, isLocked ? styles.btnTxtMinusDisabled : null]}>+</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      ))}
      </View>

      {/* Footer actions */}
      {!isLocked ? (
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
      ) : null}

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
        {!isLocked ? (
          <Button
            title="🗑️  Zerar tudo"
            variant="danger"
            onPress={onResetAll}
          />
        ) : null}
      </View>

      <View style={{ height: spacing.xxl }} />
    </Screen>
  );
};
