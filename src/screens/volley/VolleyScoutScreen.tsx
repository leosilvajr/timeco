import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Button, Badge } from '../../components';
import { ColorPalette, spacing, radius } from '../../constants/theme';
import { useThemedColors } from '../../store';
import {
  getVolleyMatch,
  subscribeVolleyMatch,
  performScoutAction,
  finishCurrentSet,
  undoLastPoint,
  resetVolleyMatch,
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

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    // Scoreboard
    scoreboard: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
    teamBox: {
      flex: 1,
      padding: spacing.sm,
      borderRadius: radius.md,
      alignItems: 'center',
      borderWidth: 2,
    },
    teamBoxA: { borderColor: c.primary, backgroundColor: c.surfaceVariant },
    teamBoxB: { borderColor: c.border, backgroundColor: c.surface },
    teamName: {
      fontSize: 11,
      fontWeight: '800',
      color: c.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    teamScore: { fontSize: 40, fontWeight: '900', color: c.text, lineHeight: 44, marginTop: 4 },
    teamSets: { fontSize: 11, color: c.textMuted, marginTop: 2 },

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

    // Help toggle + panel
    helpToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: c.surfaceVariant,
      borderWidth: 1,
      borderColor: c.border,
      borderStyle: 'dashed',
      marginBottom: 8,
    },
    helpToggleTxt: { fontSize: 13, fontWeight: '700', color: c.text },
    helpPanel: {
      backgroundColor: c.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.md,
      marginBottom: 10,
    },
    helpHeading: {
      fontSize: 14,
      fontWeight: '800',
      color: c.text,
      marginTop: 8,
      marginBottom: 4,
    },
    helpBody: {
      fontSize: 13,
      color: c.textSecondary,
      lineHeight: 19,
    },
    helpIntro: {
      fontSize: 13,
      color: c.text,
      lineHeight: 19,
    },
    helpBold: { fontWeight: '800', color: c.text },

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
  const [showHelp, setShowHelp] = useState(false);

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
      toast.error('Erro ao registrar ação.');
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

      {/* Scoreboard */}
      <View style={styles.scoreboard}>
        <View style={[styles.teamBox, styles.teamBoxA]}>
          <Text style={styles.teamName}>{match.teamAName}</Text>
          <Text style={styles.teamScore}>{currentSet?.scoreA ?? 0}</Text>
          <Text style={styles.teamSets}>Sets: {setsWonA}</Text>
          {match.serveTeam === 'A' && !currentSet?.finished ? (
            <View style={{ marginTop: 6 }}>
              <Badge label="🎾 SAQUE" variant="primary" size="sm" />
            </View>
          ) : null}
        </View>
        <View style={[styles.teamBox, styles.teamBoxB]}>
          <Text style={styles.teamName}>{match.teamBName}</Text>
          <Text style={styles.teamScore}>{currentSet?.scoreB ?? 0}</Text>
          <Text style={styles.teamSets}>Sets: {setsWonB}</Text>
          {match.serveTeam === 'B' && !currentSet?.finished ? (
            <View style={{ marginTop: 6 }}>
              <Badge label="🎾 SAQUE" variant="primary" size="sm" />
            </View>
          ) : null}
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

      {/* Painel Como funciona? — colapsavel */}
      <Pressable
        onPress={() => setShowHelp((v) => !v)}
        style={styles.helpToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: showHelp }}
      >
        <Text style={styles.helpToggleTxt}>{showHelp ? '▾' : '▸'}</Text>
        <Text style={styles.helpToggleTxt}>ℹ️ Como funciona o Scout?</Text>
      </Pressable>
      {showHelp ? (
        <View style={styles.helpPanel}>
          <Text style={styles.helpIntro}>
            <Text style={styles.helpBold}>Como usar: </Text>
            selecione o jogador no topo e use{' '}
            <Text style={styles.helpBold}>+</Text> pra registrar uma ação ou{' '}
            <Text style={styles.helpBold}>−</Text> pra desfazer. Quando a ação
            gera ponto, o placar e a rotação atualizam sozinhos. Cores:{' '}
            <Text style={[styles.helpBold, { color: c.success }]}>verde</Text> =
            gera ponto,{' '}
            <Text style={[styles.helpBold, { color: c.danger }]}>vermelho</Text> =
            entrega ponto,{' '}
            <Text style={[styles.helpBold, { color: c.info }]}>azul</Text> =
            neutro (só estatística).
          </Text>

          <Text style={styles.helpHeading}>🎾 SAQUE</Text>
          <Text style={styles.helpBody}>
            • <Text style={styles.helpBold}>Certo</Text>: saque dentro, adversário recebeu (sem impacto no placar).{'\n'}
            • <Text style={styles.helpBold}>Erro</Text>: saque na rede ou fora → ponto pro adversário.{'\n'}
            • <Text style={styles.helpBold}>Ace</Text>: saque direto, ninguém tocou ou caiu → ponto pra você.
          </Text>

          <Text style={styles.helpHeading}>⚡ ATAQUE</Text>
          <Text style={styles.helpBody}>
            • <Text style={styles.helpBold}>Ponto</Text>: ataque virou ponto direto → +1 pra você.{'\n'}
            • <Text style={styles.helpBold}>Normal</Text>: ataque defendido, o rali continua.{'\n'}
            • <Text style={styles.helpBold}>Erro</Text>: bola fora ou na rede → ponto pro adversário.
          </Text>

          <Text style={styles.helpHeading}>✋ PASSE</Text>
          <Text style={styles.helpBody}>
            Qualidade da recepção do saque adversário.{'\n'}
            • <Text style={styles.helpBold}>A — Perfeito</Text>: levantador recebe no alvo, qualquer jogada possível.{'\n'}
            • <Text style={styles.helpBold}>B — Bom</Text>: levantador trabalha confortável.{'\n'}
            • <Text style={styles.helpBold}>C — Mediano</Text>: passe ruim, jogada limitada (geralmente bola alta).{'\n'}
            • <Text style={styles.helpBold}>Erro</Text>: bola caiu ou foi direto pro adversário → ponto contra.
          </Text>

          <Text style={styles.helpHeading}>🛡️ BLOQUEIO</Text>
          <Text style={styles.helpBody}>
            • <Text style={styles.helpBold}>Sucesso</Text>: bola morta na quadra adversária → +1 pra você.{'\n'}
            • <Text style={styles.helpBold}>Normal</Text>: tocou e voltou pra sua defesa montar a jogada.{'\n'}
            • <Text style={styles.helpBold}>Falha</Text>: bola caiu na sua quadra ou mãos fora → ponto contra.
          </Text>

          <Text style={styles.helpHeading}>🎯 LEVANTAMENTO</Text>
          <Text style={styles.helpBody}>
            • <Text style={styles.helpBold}>Certo / Erro</Text>: avaliação geral do levantamento.{'\n'}
            • <Text style={styles.helpBold}>Ponta / Saída / Meio / F.Meio / F.Saída</Text>: pra
            qual zona da rede a bola foi distribuída (estatística de distribuição do levantador).
          </Text>

          <Text style={[styles.helpIntro, { marginTop: 10 }]}>
            <Text style={styles.helpBold}>Botões do rodapé:</Text>
            {'\n'}• <Text style={styles.helpBold}>↶ Desfazer ponto</Text> — reverte o último ponto registrado.
            {'\n'}• <Text style={styles.helpBold}>🏁 Encerrar set</Text> — fecha o set atual e abre o próximo.
            {'\n'}• <Text style={styles.helpBold}>📊 Relatórios</Text> — estatísticas por jogador no set atual ou acumuladas.
            {'\n'}• <Text style={styles.helpBold}>🔄 Rotação</Text> — visualiza/ajusta a rotação em quadra.
            {'\n'}• <Text style={styles.helpBold}>🗑️ Zerar tudo</Text> — apaga tudo e reinicia a partida (não dá pra desfazer).
          </Text>
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
                    count === 0 ? styles.btnMinusDisabled : styles.btnMinus,
                  ]}
                  onPress={() => handleAction(a.action, -1)}
                  disabled={busy || count === 0}
                >
                  <Text
                    style={[
                      styles.btnTxt,
                      count === 0 ? styles.btnTxtMinusDisabled : styles.btnTxtMinus,
                    ]}
                  >
                    −
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.btn, plusBg(a.kind, styles)]}
                  onPress={() => handleAction(a.action, 1)}
                  disabled={busy}
                >
                  <Text style={styles.btnTxt}>+</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      ))}
      </View>

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
        <Button
          title="🗑️  Zerar tudo"
          variant="danger"
          onPress={onResetAll}
        />
      </View>

      <View style={{ height: spacing.xxl }} />
    </Screen>
  );
};
