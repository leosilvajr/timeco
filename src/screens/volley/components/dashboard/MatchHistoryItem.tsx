import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useThemedColors } from '../../../../store';
import { VolleyMatch } from '../../../../types';
import { matchOutcome } from '../../../../services/volleyTeamStats';

interface Props {
  match: VolleyMatch;
  onPress: () => void;
}

const formatDateBR = (iso: string): string => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
};

/** Item da lista 'Ultimas partidas' do Dashboard nativo. */
export const MatchHistoryItem: React.FC<Props> = React.memo(({ match, onPress }) => {
  const c = useThemedColors();
  const o = matchOutcome(match);
  const isFinished = match.status === 'finished';
  const isScheduled = match.status === 'scheduled';
  const statusLabel = isScheduled
    ? 'EM BREVE'
    : !isFinished
    ? 'EM ANDAMENTO'
    : o.won
    ? 'VITÓRIA'
    : 'DERROTA';
  const statusColor = isScheduled
    ? c.info
    : !isFinished
    ? c.warning
    : o.won
    ? c.success
    : c.danger;

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 10,
        padding: 12,
        marginBottom: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 14, fontWeight: '800', color: c.text }}>
          vs {match.teamBName}
        </Text>
        <Text style={{ fontSize: 12, color: c.textSecondary }}>
          {formatDateBR(match.date)} · {match.location}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 16, fontWeight: '900', color: c.text }}>
          {o.setsA} x {o.setsB}
        </Text>
        <Text style={{ fontSize: 10, fontWeight: '700', color: statusColor }}>
          {statusLabel}
        </Text>
      </View>
    </Pressable>
  );
});
MatchHistoryItem.displayName = 'MatchHistoryItem';
