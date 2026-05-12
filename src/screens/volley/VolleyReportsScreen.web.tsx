import React, { useEffect, useMemo, useState } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Card,
  Group,
  Stack,
  Text,
  Badge,
  Progress,
  SegmentedControl,
  ScrollArea,
  SimpleGrid,
} from '@mantine/core';
import { HtmlScreen, HtmlHeader, HtmlCard } from '../../components/web';
import { useThemedColors } from '../../store';
import { subscribeVolleyMatch } from '../../services/volleyScoutService';
import {
  accumulateAcrossSets,
  attackPercentage,
  blockPercentage,
  directPoints,
  efficiencyThresholds,
  emptyPlayerStats,
  passPercentage,
  servePercentage,
  setPercentage,
  teamSummary,
  totalActions,
  totalAttacks,
  totalBlocks,
  totalErrors,
  totalPasses,
  totalServes,
  totalSetActions,
} from '../../services/volleyStats';
import { PlayerVolleyStats, VolleyMatch, VolleyPlayer } from '../../types';
import type { VolleyStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<VolleyStackParamList, 'VolleyReports'>;
type Rt = RouteProp<VolleyStackParamList, 'VolleyReports'>;

type Mode = 'current' | 'all';

// ============================================================================
// Componentes auxiliares
// ============================================================================

const TeamSummaryBlock: React.FC<{
  label: string;
  value: number | string;
  emoji: string;
  color: string;
}> = ({ label, value, emoji, color }) => (
  <Card withBorder radius="md" padding="md" style={{ textAlign: 'center' }}>
    <Text size="xl" style={{ marginBottom: 4 }}>
      {emoji}
    </Text>
    <Text size="28px" fw={900} style={{ color, lineHeight: 1.1 }}>
      {value}
    </Text>
    <Text size="xs" c="dimmed" fw={700} tt="uppercase" mt={4}>
      {label}
    </Text>
  </Card>
);

/** Linha compacta de jogador (substitui a tabela wide pra mobile). */
const PlayerRow: React.FC<{
  player: VolleyPlayer;
  stats: PlayerVolleyStats;
  c: ReturnType<typeof useThemedColors>;
}> = ({ player, stats, c }) => {
  const aPct = attackPercentage(stats);
  const sPct = servePercentage(stats);
  const pPct = passPercentage(stats);
  const bPct = blockPercentage(stats);
  const dp = directPoints(stats);

  const metric = (label: string, value: string, sub: string, ok?: boolean) => (
    <div style={{ flex: 1, minWidth: 80, textAlign: 'center' }}>
      <Text size="xs" c="dimmed" fw={700} tt="uppercase">
        {label}
      </Text>
      <Text
        size="sm"
        fw={800}
        style={{ color: ok === undefined ? c.text : ok ? c.success : c.danger }}
      >
        {value}
      </Text>
      <Text size="xs" c="dimmed">
        {sub}
      </Text>
    </div>
  );

  return (
    <Card withBorder radius="md" padding="sm">
      <Group justify="space-between" wrap="nowrap" mb="xs">
        <Group gap={10} wrap="nowrap">
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              background: c.primary,
              color: c.onPrimary,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            {player.number}
          </span>
          <div style={{ minWidth: 0 }}>
            <Text size="sm" fw={800} style={{ color: c.text }} truncate>
              {player.name}
            </Text>
            <Text size="xs" c="dimmed">
              {player.position}
            </Text>
          </div>
        </Group>
        <Badge size="md" color="timeco" variant="light" radius="sm">
          {dp} pts
        </Badge>
      </Group>
      <Group gap="xs" wrap="nowrap" style={{ overflowX: 'auto' }}>
        {metric(
          'Ataque',
          `${aPct.toFixed(0)}%`,
          `${stats.attacks.success}/${totalAttacks(stats)}`,
          aPct >= efficiencyThresholds.attack,
        )}
        {metric(
          'Saque',
          `${sPct.toFixed(0)}%`,
          `${stats.serves.ace} aces`,
          sPct >= efficiencyThresholds.serve,
        )}
        {metric(
          'Passe',
          `${pPct.toFixed(0)}%`,
          `A:${stats.passes.a} B:${stats.passes.b}`,
          pPct >= efficiencyThresholds.pass,
        )}
        {metric(
          'Bloq.',
          totalBlocks(stats) > 0 ? `${bPct.toFixed(0)}%` : '—',
          `${stats.blocks.success}/${totalBlocks(stats)}`,
          bPct >= efficiencyThresholds.block,
        )}
      </Group>
    </Card>
  );
};

/** Card completo de análise individual de um jogador. */
const PlayerDetailCard: React.FC<{
  player: VolleyPlayer;
  stats: PlayerVolleyStats;
  c: ReturnType<typeof useThemedColors>;
}> = ({ player, stats, c }) => {
  const aPct = attackPercentage(stats);
  const sPct = servePercentage(stats);
  const pPct = passPercentage(stats);
  const bPct = blockPercentage(stats);
  const setPct = setPercentage(stats);
  const dp = directPoints(stats);
  const ta = totalActions(stats);
  const errs = totalErrors(stats);
  const eff = ta > 0 ? (dp / ta) * 100 : 0;

  const metric = (
    emoji: string,
    label: string,
    pct: number,
    sub: string,
    threshold: number,
  ) => (
    <Card withBorder radius="md" padding="md">
      <Group gap={8} mb={4}>
        <Text size="sm">{emoji}</Text>
        <Text size="xs" fw={700} c="dimmed" tt="uppercase">
          {label}
        </Text>
      </Group>
      <Text
        size="xl"
        fw={900}
        style={{ color: pct >= threshold ? c.success : pct > 0 ? c.danger : c.textMuted }}
      >
        {pct.toFixed(1)}%
      </Text>
      <Text size="xs" c="dimmed" mt={2}>
        {sub}
      </Text>
      <Progress
        value={pct}
        color={pct >= threshold ? 'timeco' : 'red'}
        size="sm"
        radius="sm"
        mt={6}
      />
    </Card>
  );

  return (
    <Stack gap="sm">
      <Card withBorder radius="md" padding="md" style={{ background: c.surfaceVariant }}>
        <Group gap={12}>
          <span
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              background: c.primary,
              color: c.onPrimary,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            {player.number}
          </span>
          <div>
            <Text size="lg" fw={900} style={{ color: c.text }}>
              {player.name}
            </Text>
            <Text size="sm" c="dimmed">
              {player.position}
            </Text>
          </div>
        </Group>
      </Card>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
        {metric(
          '⚡',
          'Ataque',
          aPct,
          `${stats.attacks.success} pts · ${totalAttacks(stats)} tentativas`,
          efficiencyThresholds.attack,
        )}
        {metric(
          '🎾',
          'Saque',
          sPct,
          `${stats.serves.ace} aces · ${totalServes(stats)} totais`,
          efficiencyThresholds.serve,
        )}
        {metric(
          '✋',
          'Passe',
          pPct,
          `A:${stats.passes.a} B:${stats.passes.b} C:${stats.passes.c} · ${totalPasses(stats)} totais`,
          efficiencyThresholds.pass,
        )}
        {metric(
          '🛡️',
          'Bloqueio',
          bPct,
          `${stats.blocks.success} sucessos · ${totalBlocks(stats)} totais`,
          efficiencyThresholds.block,
        )}
        {metric(
          '🎯',
          'Levantamento',
          setPct,
          `${stats.sets.success} certos · ${totalSetActions(stats)} totais`,
          efficiencyThresholds.set,
        )}
      </SimpleGrid>

      <Card withBorder radius="md" padding="md">
        <Text size="xs" fw={800} c="dimmed" tt="uppercase" mb="sm" ta="center">
          Performance final
        </Text>
        <SimpleGrid cols={4} spacing="xs">
          <div style={{ textAlign: 'center' }}>
            <Text size="lg" fw={900} style={{ color: c.success }}>
              {dp}
            </Text>
            <Text size="xs" c="dimmed">
              Pontos diretos
            </Text>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Text size="lg" fw={900} style={{ color: c.text }}>
              {ta}
            </Text>
            <Text size="xs" c="dimmed">
              Ações totais
            </Text>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Text size="lg" fw={900} style={{ color: c.danger }}>
              {errs}
            </Text>
            <Text size="xs" c="dimmed">
              Erros
            </Text>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Text
              size="lg"
              fw={900}
              style={{
                color: eff >= efficiencyThresholds.overall ? c.success : c.danger,
              }}
            >
              {eff.toFixed(1)}%
            </Text>
            <Text size="xs" c="dimmed">
              Eficiência
            </Text>
          </div>
        </SimpleGrid>
      </Card>
    </Stack>
  );
};

// ============================================================================
// Main screen
// ============================================================================

export const VolleyReportsScreen: React.FC = () => {
  const c = useThemedColors();
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const [match, setMatch] = useState<VolleyMatch | null>(null);
  const [mode, setMode] = useState<Mode>('current');
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);

  useEffect(() => {
    const unsub = subscribeVolleyMatch(route.params.matchId, (m) => {
      setMatch(m);
      if (m && m.players.length > 0 && selectedPlayer === null) {
        setSelectedPlayer(m.players[0].number);
      }
    });
    return () => unsub();
  }, [route.params.matchId, selectedPlayer]);

  const playerStatsForMode = useMemo((): Record<number, PlayerVolleyStats> => {
    if (!match) return {};
    if (mode === 'current') {
      const set = match.sets.find((s) => s.number === match.currentSet);
      return set?.playerStats ?? {};
    }
    const result: Record<number, PlayerVolleyStats> = {};
    for (const p of match.players) {
      result[p.number] = accumulateAcrossSets(match.sets, p.number);
    }
    return result;
  }, [match, mode]);

  const summary = useMemo(() => teamSummary(playerStatsForMode), [playerStatsForMode]);

  if (!match) {
    return (
      <HtmlScreen>
        <HtmlHeader title="Carregando..." onBack={() => nav.goBack()} />
      </HtmlScreen>
    );
  }

  const setsWonA = match.sets.filter((s) => s.finished && s.scoreA > s.scoreB).length;
  const setsWonB = match.sets.filter((s) => s.finished && s.scoreB > s.scoreA).length;
  const winner =
    match.status === 'finished'
      ? setsWonA > setsWonB
        ? match.teamAName
        : match.teamBName
      : null;

  const selectedPlayerObj = match.players.find((p) => p.number === selectedPlayer);
  const selectedPlayerStats =
    selectedPlayer !== null
      ? playerStatsForMode[selectedPlayer] ?? emptyPlayerStats()
      : emptyPlayerStats();

  return (
    <HtmlScreen maxWidth={1100}>
      <HtmlHeader
        title="Relatórios"
        subtitle={`${match.teamAName} vs ${match.teamBName}`}
        onBack={() => nav.goBack()}
      />

      {/* Match summary */}
      <HtmlCard>
        <Stack gap="xs" align="center">
          <Text size="xs" c="dimmed" fw={700} tt="uppercase">
            Resultado
          </Text>
          <Text size="32px" fw={900} style={{ color: c.text, lineHeight: 1 }}>
            {setsWonA} <span style={{ color: c.textMuted }}>×</span> {setsWonB}
          </Text>
          {winner ? (
            <Badge size="lg" color="timeco" variant="light" radius="md">
              🏆 {winner}
            </Badge>
          ) : (
            <Text size="sm" c="dimmed">
              Em andamento
            </Text>
          )}
        </Stack>

        {/* Tabela de sets compacta */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `auto ${'1fr '.repeat(match.sets.length)}`,
            gap: 4,
            fontSize: 13,
            marginTop: 16,
          }}
        >
          <div style={{ fontWeight: 700, color: c.textSecondary }}>Set</div>
          {match.sets.map((s) => (
            <div
              key={s.number}
              style={{
                fontWeight: 700,
                color: c.textSecondary,
                textAlign: 'center',
              }}
            >
              {s.number}
            </div>
          ))}
          <div style={{ fontWeight: 700, color: c.text }}>{match.teamAName}</div>
          {match.sets.map((s) => (
            <div
              key={`a-${s.number}`}
              style={{
                textAlign: 'center',
                color: s.scoreA > s.scoreB ? c.primary : c.text,
                fontWeight: s.scoreA > s.scoreB ? 800 : 600,
              }}
            >
              {s.scoreA}
            </div>
          ))}
          <div style={{ fontWeight: 700, color: c.text }}>{match.teamBName}</div>
          {match.sets.map((s) => (
            <div
              key={`b-${s.number}`}
              style={{
                textAlign: 'center',
                color: s.scoreB > s.scoreA ? c.primary : c.text,
                fontWeight: s.scoreB > s.scoreA ? 800 : 600,
              }}
            >
              {s.scoreB}
            </div>
          ))}
        </div>
      </HtmlCard>

      {/* Mode toggle */}
      <Text size="xs" fw={800} c="dimmed" tt="uppercase" mb={6} style={{ letterSpacing: 0.6 }}>
        Modo de visualização
      </Text>
      <SegmentedControl
        value={mode}
        onChange={(v) => setMode(v as Mode)}
        color="timeco"
        radius="md"
        fullWidth
        mb="md"
        data={[
          { value: 'current', label: `Set atual (${match.currentSet})` },
          { value: 'all', label: 'Acumulado (todos sets)' },
        ]}
      />

      {/* Team summary cards */}
      <Text size="xs" fw={800} c="dimmed" tt="uppercase" mb={6} style={{ letterSpacing: 0.6 }}>
        Resumo do time
      </Text>
      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm" mb="lg">
        <TeamSummaryBlock
          label="Pontos diretos"
          value={summary.totalPoints}
          emoji="🎯"
          color={c.success}
        />
        <TeamSummaryBlock
          label="Aces"
          value={summary.totalAces}
          emoji="🎾"
          color={c.warning}
        />
        <TeamSummaryBlock
          label="Bloqueios"
          value={summary.totalBlocks}
          emoji="🛡️"
          color={c.info}
        />
        <TeamSummaryBlock
          label="Erros"
          value={summary.totalErrors}
          emoji="❌"
          color={c.danger}
        />
      </SimpleGrid>

      {/* Tabela detalhada — agora EMPILHADA por jogador (mobile-first) */}
      <Text size="xs" fw={800} c="dimmed" tt="uppercase" mb={6} style={{ letterSpacing: 0.6 }}>
        Estatísticas por jogador
      </Text>
      <Stack gap="xs" mb="lg">
        {match.players.map((p) => (
          <PlayerRow
            key={p.number}
            player={p}
            stats={playerStatsForMode[p.number] ?? emptyPlayerStats()}
            c={c}
          />
        ))}
      </Stack>

      {/* Análise individual — tabs limpas estilo pill + card completo */}
      <Text size="xs" fw={800} c="dimmed" tt="uppercase" mb={6} style={{ letterSpacing: 0.8 }}>
        Análise individual
      </Text>
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 8,
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
        }}
      >
        {match.players.map((p) => {
          const isSel = p.number === selectedPlayer;
          return (
            <button
              key={p.number}
              onClick={() => setSelectedPlayer(p.number)}
              style={{
                padding: '8px 16px',
                height: 40,
                borderRadius: 999,
                background: isSel ? c.primary : c.surface,
                border: `1.5px solid ${isSel ? c.primary : c.border}`,
                color: isSel ? c.onPrimary : c.text,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 14,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                flexShrink: 0,
                transition: 'all 120ms ease',
              }}
            >
              <span
                style={{
                  opacity: isSel ? 0.85 : 0.55,
                  fontSize: 11,
                  fontWeight: 900,
                }}
              >
                #{p.number}
              </span>
              <span>{p.name.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {selectedPlayerObj ? (
        <div style={{ marginTop: 8 }}>
          <PlayerDetailCard player={selectedPlayerObj} stats={selectedPlayerStats} c={c} />
        </div>
      ) : null}

      <div style={{ height: 32 }} />
    </HtmlScreen>
  );
};
