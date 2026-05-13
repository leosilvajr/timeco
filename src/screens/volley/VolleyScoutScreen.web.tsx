import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Stack, Text } from '@mantine/core';
import { HtmlScreen, HtmlHeader, HtmlButton, webConfirm } from '../../components/web';
import { useAuthStore, useThemedColors } from '../../store';
import { invalidateVolleyMatchesCache } from '../../services/volleyCacheService';
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
import { toast } from '../../store/toastStore';
import { VolleyAction, VolleyMatch, VolleyPlayer, PlayerVolleyStats } from '../../types';
import { MatchStatusBanners } from './components/scout/MatchStatusBanners.web';
import { SetMomentumBanner } from './components/scout/SetMomentumBanner.web';
import { Scoreboard } from './components/scout/Scoreboard.web';
import { PlayerTabsStrip } from './components/scout/PlayerTabsStrip.web';
import {
  ActionCard,
  type CardConfig,
} from './components/scout/ActionCard.web';
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
    ],
  },
];

export const VolleyScoutScreen: React.FC = () => {
  const c = useThemedColors();
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const user = useAuthStore((s) => s.user);

  const [match, setMatch] = useState<VolleyMatch | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  // Refs pra UI otimista: state local atualizado na hora, persistencia
  // serializada via writeQueue pra evitar race condition.
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

  // onSnapshot ja entrega o estado inicial, entao nao precisamos do getVolleyMatch
  // adicional no abrir da tela. Cortamos 1 read e o flash de re-render.
  useEffect(() => {
    const unsub = subscribeVolleyMatch(route.params.matchId, (m) => {
      if (m) {
        setMatch(m);
        matchRef.current = m;
      }
    });
    return () => unsub();
  }, [route.params.matchId]);

  // Quando o match carrega pela primeira vez, auto-seleciona o primeiro jogador.
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

    // 1. Optimistic: aplica a mudanca local imediatamente (UI instantanea)
    const next = previewScoutAction(current, selectedPlayer, action, delta);
    if (!next) return;
    setMatch(next);
    matchRef.current = next;

    // 2. Persistencia em background, serializada via queue pra evitar race
    //    (cliques rapidos consecutivos chegariam no Firestore em paralelo
    //    com 'last-write-wins' e perderiam contagem)
    writeQueueRef.current = writeQueueRef.current
      .then(() => performScoutAction(current, selectedPlayer, action, delta))
      .catch((e) => {
        console.error('performScoutAction', e);
        toast.error('Erro de rede. Sincronizando...');
        // onSnapshot reconcilia sozinho com o que ficou no Firestore — nao precisa
        // de getVolleyMatch extra aqui.
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
    const proceed = await webConfirm({
      title: 'Encerrar set',
      message: 'Tem certeza que quer encerrar este set?',
    });
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
    const proceed = await webConfirm({
      title: 'Zerar tudo',
      message:
        'Todos os sets, placares e estatísticas vão ser apagados. Essa ação não pode ser desfeita. Continuar?',
      confirmLabel: 'Zerar tudo',
      danger: true,
    });
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
      <HtmlScreen>
        <HtmlHeader title="Carregando..." onBack={() => nav.goBack()} />
      </HtmlScreen>
    );
  }

  // Bloqueia +/- e acoes destrutivas quando a partida nao esta in_progress.
  const isLocked = match.status !== 'in_progress';

  const selectedPlayerObj: VolleyPlayer | undefined = match.players.find(
    (p) => p.number === selectedPlayer,
  );

  return (
    <HtmlScreen maxWidth={1200}>
      {/* Esconde scrollbar do strip de jogadores (Chrome/Safari) */}
      <style>{`.volley-tabs-strip::-webkit-scrollbar { display: none; }`}</style>
      <HtmlHeader
        title={`Set ${match.currentSet}`}
        subtitle={`${match.teamAName} vs ${match.teamBName}`}
        onBack={() => nav.goBack()}
      />

      <MatchStatusBanners match={match} busy={busy} onStartMatch={onStartMatch} />

      {/* Scoreboard + tabs sticky no topo do scroll */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: c.background,
          marginLeft: -12,
          marginRight: -12,
          paddingLeft: 12,
          paddingRight: 12,
          paddingTop: 6,
          paddingBottom: 8,
          marginBottom: 12,
          boxShadow: `0 2px 4px ${c.background === '#FFFFFF' ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.3)'}`,
        }}
      >
        <SetMomentumBanner match={match} currentSet={currentSet} onCloseSet={onCloseSet} />
        <Scoreboard
          match={match}
          currentSet={currentSet}
          setsWonA={setsWonA}
          setsWonB={setsWonB}
        />
        <PlayerTabsStrip
          players={match.players}
          selectedPlayer={selectedPlayer}
          onSelect={setSelectedPlayer}
        />
      </div>

      {/* Player heading */}
      {selectedPlayerObj ? (
        <div style={{ marginTop: 8, marginBottom: 10 }}>
          <Text size="lg" fw={900} style={{ color: c.text }}>
            #{selectedPlayerObj.number} {selectedPlayerObj.name}
          </Text>
          <Text size="xs" c="dimmed" mt={2}>
            {selectedPlayerObj.position}
          </Text>
        </div>
      ) : null}

      {/* Cards de ações — grid responsivo, mais compactos */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 10,
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
          />
        ))}
      </div>

      {/* Footer actions */}
      <Stack gap={8} mt="md">
        {!isLocked ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <HtmlButton title="↶ Desfazer ponto" variant="outline" onClick={onUndoLastPoint} />
            </div>
            {!currentSet?.finished ? (
              <div style={{ flex: 1 }}>
                <HtmlButton title="🏁 Encerrar set" variant="ghost" onClick={onCloseSet} />
              </div>
            ) : null}
          </div>
        ) : null}
        <HtmlButton
          title="📊 Relatórios"
          variant="secondary"
          onClick={() => nav.navigate('VolleyReports', { matchId: match.id })}
        />
        <HtmlButton
          title="🔄 Rotação"
          variant="ghost"
          onClick={() => nav.navigate('VolleyRotation', { matchId: match.id })}
        />
        {!isLocked ? (
          <HtmlButton
            title="🗑️  Zerar tudo"
            variant="danger"
            onClick={onResetAll}
          />
        ) : null}
      </Stack>

      <div style={{ height: 32 }} />
    </HtmlScreen>
  );
};
