import React from 'react';
import { View, Text } from 'react-native';
import { useThemedColors } from '../../../../store';
import { efficiencyThresholds } from '../../../../services/volleyStats';
import { PlayerAggregate } from '../../../../services/volleyTeamStats';

interface Props {
  agg: PlayerAggregate;
}

/** Card por jogador com chips coloridos no Dashboard nativo. */
export const PlayerAggregateCard: React.FC<Props> = React.memo(({ agg }) => {
  const c = useThemedColors();
  const pctColor = (pct: number, threshold: number) =>
    pct >= threshold ? c.success : pct >= threshold * 0.7 ? c.warning : c.danger;

  const chip = (label: string, value: React.ReactNode) => (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        backgroundColor: c.surfaceVariant,
      }}
    >
      <Text style={{ fontSize: 11 }}>
        {label} <Text style={{ fontWeight: '800' }}>{value}</Text>
      </Text>
    </View>
  );

  return (
    <View
      style={{
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 10,
        padding: 10,
        marginBottom: 6,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginBottom: 6,
        }}
      >
        <View
          style={{
            backgroundColor: c.primary,
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 999,
          }}
        >
          <Text style={{ color: c.onPrimary, fontSize: 11, fontWeight: '900' }}>
            #{agg.player.number}
          </Text>
        </View>
        <Text style={{ fontSize: 14, fontWeight: '800', color: c.text }}>
          {agg.player.name}
        </Text>
        <Text style={{ fontSize: 11, color: c.textMuted }}>{agg.player.position}</Text>
        <View style={{ flex: 1 }} />
        <Text style={{ fontSize: 11, color: c.textSecondary }}>
          {agg.matchesPlayed} {agg.matchesPlayed === 1 ? 'jogo' : 'jogos'}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {chip(
          'Ataque',
          <Text style={{ color: pctColor(agg.attackPct, efficiencyThresholds.attack) }}>
            {agg.attackPct.toFixed(0)}%
          </Text>,
        )}
        {chip(
          'Saque',
          <Text style={{ color: pctColor(agg.servePct, efficiencyThresholds.serve) }}>
            {agg.servePct.toFixed(0)}%
          </Text>,
        )}
        {chip(
          'Passe',
          <Text style={{ color: pctColor(agg.passPct, efficiencyThresholds.pass) }}>
            {agg.passPct.toFixed(0)}%
          </Text>,
        )}
        {chip(
          'Bloq',
          <Text style={{ color: pctColor(agg.blockPct, efficiencyThresholds.block) }}>
            {agg.blockPct.toFixed(0)}%
          </Text>,
        )}
        {chip('Pontos', <Text style={{ color: c.primary }}>{agg.directPoints}</Text>)}
        {chip('Aces', agg.stats.serves.ace)}
        {chip('Blocks', agg.stats.blocks.success)}
      </View>
    </View>
  );
});
PlayerAggregateCard.displayName = 'PlayerAggregateCard';
