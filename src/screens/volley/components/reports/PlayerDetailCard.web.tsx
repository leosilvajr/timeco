import React from 'react';
import { Card, Group, Stack, Text, Progress, SimpleGrid } from '@mantine/core';
import { useThemedColors } from '../../../../store';
import {
  attackPercentage,
  blockPercentage,
  directPoints,
  efficiencyThresholds,
  passPercentage,
  servePercentage,
  setPercentage,
  totalActions,
  totalAttacks,
  totalBlocks,
  totalErrors,
  totalPasses,
  totalServes,
  totalSetActions,
} from '../../../../services/volleyStats';
import { PlayerVolleyStats, VolleyPlayer } from '../../../../types';

interface Props {
  player: VolleyPlayer;
  stats: PlayerVolleyStats;
}

/** Card completo de analise individual de um jogador no Reports. */
export const PlayerDetailCard: React.FC<Props> = React.memo(({ player, stats }) => {
  const c = useThemedColors();
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
  ): React.ReactNode => (
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
        style={{
          color: pct >= threshold ? c.success : pct > 0 ? c.danger : c.textMuted,
        }}
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
});
PlayerDetailCard.displayName = 'PlayerDetailCard';
