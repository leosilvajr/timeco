import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Button } from '../../components';
import { spacing } from '../../constants/theme';
import { useAuthStore, useThemedColors } from '../../store';
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
import { useResponsive } from '../../hooks/useResponsive';
import { toast } from '../../store/toastStore';
import { VolleyAction, VolleyMatch, VolleyPlayer, PlayerVolleyStats } from '../../types';
import { invalidateVolleyMatchesCache } from '../../services/volleyCacheService';
import { usePendingWritesCount } from '../../hooks/usePendingWritesCount';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { MatchStatusBanners } from './components/scout/MatchStatusBanners';
import { SetMomentumBanner } from './components/scout/SetMomentumBanner';
import { Scoreboard } from './components/scout/Scoreboard';
import { PlayerTabsStrip } from './components/scout/PlayerTabsStrip';
import { ActionCard, type CardConfig } from './components/scout/ActionCard';
import type { VolleyStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<VolleyStackParamList, 'VolleyScout'>;
type Rt = RouteProp<VolleyStackParamList, 'VolleyScout'>;

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
      { label: 'Bola de 2ª — Ponto', action: 'set_dump_point', kind: 'positive', read: (s) => s.sets.dump_point },
      { label: 'Bola de 2ª — Normal', action: 'set_dump', kind: 'neutral', read: (s) => s.sets.dump_normal },
      { label: 'Bola de 2ª — Erro', action: 'set_dump_error', kind: 'negative', read: (s) => s.sets.dump_error },
    ],
  },
];

// Estilos do main screen — apenas o que nao foi extraido pros componentes.
const makeMainStyles = () => ({
  playerHeading: { marginTop: spacing.sm, marginBottom: 10 } as const,
});

export const VolleyScoutScreen: React.FC = () => {
  const c = useThemedColors();
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const responsive = useResponsive();
  const { width: windowW } = useWindowDimensions();
  const user = useAuthStore((s) => s.user);
  const styles = useMemo(() => makeMainStyles(), []);

  // Em landscape (tela larga >= 720) cards lado a lado em 2 colunas
  const isWide = windowW >= 720;

  const [match, setMatch] = useState<VolleyMatch | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const { pending: pendingWrites, trackWrite } = usePendingWritesCount();
  const { isReachable } = useNetworkStatus();

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

    // Persistencia serializada em background. trackWrite incrementa o
    // contador 'pendingWrites' enquanto a write nao resolve (importante
    // quando offline). onSnapshot reconcilia sozinho.
    writeQueueRef.current = writeQueueRef.current
      .then(() =>
        trackWrite(
          performScoutAction(current, selectedPlayer, action, delta),
        ),
      )
      .then(() => undefined)
      .catch((e) => {
        console.error('performScoutAction', e);
        if (isReachable) toast.error('Erro ao registrar acao.');
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
      if (user) invalidateVolleyMatchesCache(user.id);
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
      if (user) invalidateVolleyMatchesCache(user.id);
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
      if (user) invalidateVolleyMatchesCache(user.id);
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

      <MatchStatusBanners match={match} busy={busy} onStartMatch={onStartMatch} />

      {pendingWrites > 0 ? (
        <View
          style={{
            backgroundColor: c.info + '22',
            borderWidth: 1,
            borderColor: c.info,
            borderRadius: 8,
            paddingVertical: 6,
            paddingHorizontal: 10,
            marginBottom: 8,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              color: c.info,
              fontWeight: '700',
              textAlign: 'center',
            }}
          >
            ⏳ {pendingWrites} {pendingWrites === 1 ? 'ação' : 'ações'} aguardando sincronizar
          </Text>
        </View>
      ) : null}
      <SetMomentumBanner match={match} currentSet={currentSet} onCloseSet={onCloseSet} />
      <Scoreboard match={match} currentSet={currentSet} setsWonA={setsWonA} setsWonB={setsWonB} />
      <PlayerTabsStrip
        players={match.players}
        inCourtNumbers={match.currentRotation}
        selectedPlayer={selectedPlayer}
        onSelect={setSelectedPlayer}
      />

      {/* Player heading */}
      {selectedPlayerObj ? (
        <View style={styles.playerHeading}>
          <Text style={{ fontSize: 17, fontWeight: '900', color: c.text }}>
            #{selectedPlayerObj.number} {selectedPlayerObj.name}
          </Text>
          <Text style={{ fontSize: 11, color: c.textSecondary, marginTop: 2 }}>
            {selectedPlayerObj.position}
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
          <ActionCard
            key={card.title}
            card={card}
            playerStats={playerStats}
            busy={busy}
            isLocked={isLocked}
            onAction={handleAction}
            wide={isWide}
          />
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
