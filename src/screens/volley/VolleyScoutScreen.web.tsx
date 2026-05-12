import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Card,
  Group,
  Stack,
  Text,
  Badge,
  ActionIcon,
  ScrollArea,
  Tooltip,
} from '@mantine/core';
import {
  HtmlScreen,
  HtmlHeader,
  HtmlButton,
  HtmlCard,
  webConfirm,
} from '../../components/web';
import { useThemedColors } from '../../store';
import {
  getVolleyMatch,
  subscribeVolleyMatch,
  performScoutAction,
  finishCurrentSet,
  undoLastPoint,
} from '../../services/volleyScoutService';
import { emptyPlayerStats } from '../../services/volleyStats';
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

const colorFor = (kind: ActionKind): string => {
  if (kind === 'positive') return 'timeco';
  if (kind === 'negative') return 'red';
  return 'gray';
};

export const VolleyScoutScreen: React.FC = () => {
  const c = useThemedColors();
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();

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
    const proceed = await webConfirm({
      title: 'Encerrar set',
      message: 'Tem certeza que quer encerrar este set?',
    });
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
      <HtmlScreen>
        <HtmlHeader title="Carregando..." onBack={() => nav.goBack()} />
      </HtmlScreen>
    );
  }

  const selectedPlayerObj: VolleyPlayer | undefined = match.players.find(
    (p) => p.number === selectedPlayer,
  );

  return (
    <HtmlScreen maxWidth={1200}>
      <HtmlHeader
        title={`Set ${match.currentSet}`}
        subtitle={`${match.teamAName} vs ${match.teamBName}`}
        onBack={() => nav.goBack()}
      />

      {/* Scoreboard compacto — Mantine Card, estética igual aos outros cards do app */}
      <Group gap="md" mb="md" grow>
        <Card
          withBorder
          radius="md"
          padding="md"
          style={{
            background: c.surfaceVariant,
            borderColor: c.primary,
            borderWidth: 2,
            textAlign: 'center',
          }}
        >
          <Text size="xs" fw={700} c="dimmed" tt="uppercase">
            {match.teamAName}
          </Text>
          <Text size="36px" fw={900} style={{ color: c.text, lineHeight: 1.1, marginTop: 4 }}>
            {currentSet?.scoreA ?? 0}
          </Text>
          <Text size="xs" c="dimmed" mt={2}>
            Sets: {setsWonA}
          </Text>
          {match.serveTeam === 'A' && !currentSet?.finished ? (
            <Badge color="timeco" variant="light" size="sm" mt={4} radius="sm">
              🎾 SAQUE
            </Badge>
          ) : null}
        </Card>

        <Card
          withBorder
          radius="md"
          padding="md"
          style={{
            background: c.surface,
            textAlign: 'center',
            borderWidth: 2,
          }}
        >
          <Text size="xs" fw={700} c="dimmed" tt="uppercase">
            {match.teamBName}
          </Text>
          <Text size="36px" fw={900} style={{ color: c.text, lineHeight: 1.1, marginTop: 4 }}>
            {currentSet?.scoreB ?? 0}
          </Text>
          <Text size="xs" c="dimmed" mt={2}>
            Sets: {setsWonB}
          </Text>
          {match.serveTeam === 'B' && !currentSet?.finished ? (
            <Badge color="timeco" variant="light" size="sm" mt={4} radius="sm">
              🎾 SAQUE
            </Badge>
          ) : null}
        </Card>
      </Group>

      {/* Player selector — pills minimalistas */}
      <Text
        size="xs"
        fw={800}
        c="dimmed"
        tt="uppercase"
        mb={6}
        style={{ letterSpacing: 0.6 }}
      >
        Jogador
      </Text>
      <ScrollArea type="auto" offsetScrollbars={false} scrollbarSize={6} mb="sm">
        <Group gap="xs" wrap="nowrap">
          {match.players.map((p) => {
            const isSel = p.number === selectedPlayer;
            return (
              <Badge
                key={p.number}
                size="lg"
                radius="xl"
                variant={isSel ? 'filled' : 'outline'}
                color="timeco"
                onClick={() => setSelectedPlayer(p.number)}
                style={{
                  cursor: 'pointer',
                  paddingLeft: 6,
                  paddingRight: 14,
                  height: 36,
                  flexShrink: 0,
                  textTransform: 'none',
                }}
                leftSection={
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      background: isSel ? c.surface : c.primary,
                      color: isSel ? c.primary : c.white,
                      fontWeight: 900,
                      fontSize: 12,
                    }}
                  >
                    {p.number}
                  </span>
                }
              >
                {p.name.split(' ')[0]}
              </Badge>
            );
          })}
        </Group>
      </ScrollArea>

      {/* Player heading */}
      {selectedPlayerObj ? (
        <Group justify="space-between" align="flex-end" mb="md" mt="xs">
          <div>
            <Text size="lg" fw={900} style={{ color: c.text }}>
              #{selectedPlayerObj.number} {selectedPlayerObj.name}
            </Text>
            <Text size="sm" c="dimmed">
              {selectedPlayerObj.position}
            </Text>
          </div>
        </Group>
      ) : null}

      {/* Cards de acoes — grid responsivo, estilo do app */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 12,
        }}
      >
        {CARDS.map((card) => (
          <HtmlCard key={card.title} style={{ marginBottom: 0 }}>
            <Text
              size="xs"
              fw={800}
              c="dimmed"
              tt="uppercase"
              mb="sm"
              ta="center"
              style={{ letterSpacing: 0.8 }}
            >
              {card.emoji}  {card.title}
            </Text>
            <Stack gap={6}>
              {card.actions.map((a) => {
                const count = a.read(playerStats);
                const kindColor = colorFor(a.kind);
                const dotColor =
                  a.kind === 'positive'
                    ? c.success
                    : a.kind === 'negative'
                    ? c.danger
                    : c.info;
                return (
                  <Group
                    key={a.action}
                    justify="space-between"
                    wrap="nowrap"
                    style={{
                      padding: '6px 10px',
                      borderRadius: 8,
                      background: count > 0 ? `${dotColor}14` : 'transparent',
                      transition: 'background 120ms ease',
                    }}
                  >
                    <Group gap={10} wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          background: dotColor,
                          flexShrink: 0,
                        }}
                      />
                      <Text size="sm" fw={600} c={c.text} truncate>
                        {a.label}
                      </Text>
                    </Group>
                    <Group gap={6} wrap="nowrap">
                      <Text
                        size="md"
                        fw={800}
                        ta="center"
                        style={{
                          color: count > 0 ? c.text : c.textMuted,
                          minWidth: 24,
                        }}
                      >
                        {count}
                      </Text>
                      <Tooltip label="Desfazer" position="top" withArrow openDelay={500}>
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          size="lg"
                          radius="md"
                          onClick={() => handleAction(a.action, -1)}
                          disabled={busy || count === 0}
                          aria-label={`Desfazer ${a.label}`}
                        >
                          −
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Registrar" position="top" withArrow openDelay={500}>
                        <ActionIcon
                          variant="filled"
                          color={kindColor}
                          size="lg"
                          radius="md"
                          onClick={() => handleAction(a.action, 1)}
                          disabled={busy}
                          aria-label={`Registrar ${a.label}`}
                        >
                          +
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Group>
                );
              })}
            </Stack>
          </HtmlCard>
        ))}
      </div>

      {/* Footer actions */}
      <Stack gap={8} mt="md">
        <Group grow gap={8}>
          <HtmlButton title="↶ Desfazer ponto" variant="outline" onClick={onUndoLastPoint} />
          {!currentSet?.finished ? (
            <HtmlButton title="🏁 Encerrar set" variant="ghost" onClick={onCloseSet} />
          ) : null}
        </Group>
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
      </Stack>

      <div style={{ height: 32 }} />
    </HtmlScreen>
  );
};
