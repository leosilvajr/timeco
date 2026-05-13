import React from 'react';
import { useThemedColors } from '../../../../store';
import { efficiencyThresholds } from '../../../../services/volleyStats';
import { PlayerAggregate } from '../../../../services/volleyTeamStats';

interface Props {
  agg: PlayerAggregate;
}

/** Card por jogador com chips coloridos de eficiencia. */
export const PlayerAggregateCard: React.FC<Props> = React.memo(({ agg }) => {
  const c = useThemedColors();
  const pctColor = (pct: number, threshold: number): string =>
    pct >= threshold ? c.success : pct >= threshold * 0.7 ? c.warning : c.danger;

  const chipBg = c.surfaceVariant;
  const chip = (label: string, value: React.ReactNode): React.ReactNode => (
    <span style={{ padding: '2px 8px', borderRadius: 6, background: chipBg }}>
      {label} <strong>{value}</strong>
    </span>
  );

  return (
    <div
      style={{
        background: c.surface,
        border: `1px solid ${c.border}`,
        borderRadius: 10,
        padding: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 6,
        }}
      >
        <span
          style={{
            background: c.primary,
            color: c.onPrimary,
            fontSize: 11,
            fontWeight: 900,
            padding: '2px 8px',
            borderRadius: 999,
          }}
        >
          #{agg.player.number}
        </span>
        <span style={{ fontSize: 14, fontWeight: 800, color: c.text }}>
          {agg.player.name}
        </span>
        <span style={{ fontSize: 11, color: c.textMuted }}>{agg.player.position}</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: c.textSecondary }}>
          {agg.matchesPlayed} {agg.matchesPlayed === 1 ? 'jogo' : 'jogos'}
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          fontSize: 11,
        }}
      >
        {chip(
          'Ataque',
          <span style={{ color: pctColor(agg.attackPct, efficiencyThresholds.attack) }}>
            {agg.attackPct.toFixed(0)}%
          </span>,
        )}
        {chip(
          'Saque',
          <span style={{ color: pctColor(agg.servePct, efficiencyThresholds.serve) }}>
            {agg.servePct.toFixed(0)}%
          </span>,
        )}
        {chip(
          'Passe',
          <span style={{ color: pctColor(agg.passPct, efficiencyThresholds.pass) }}>
            {agg.passPct.toFixed(0)}%
          </span>,
        )}
        {chip(
          'Bloq',
          <span style={{ color: pctColor(agg.blockPct, efficiencyThresholds.block) }}>
            {agg.blockPct.toFixed(0)}%
          </span>,
        )}
        {chip('Pontos', <span style={{ color: c.primary }}>{agg.directPoints}</span>)}
        {chip('Aces', agg.stats.serves.ace)}
        {chip('Blocks', agg.stats.blocks.success)}
      </div>
    </div>
  );
});
PlayerAggregateCard.displayName = 'PlayerAggregateCard';
