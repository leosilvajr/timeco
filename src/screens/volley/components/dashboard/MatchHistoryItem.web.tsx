import React from 'react';
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

/** Item da lista 'Ultimas partidas' do Dashboard. */
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
    <div
      onClick={onPress}
      role="button"
      tabIndex={0}
      style={{
        background: c.surface,
        border: `1px solid ${c.border}`,
        borderRadius: 10,
        padding: 12,
        marginBottom: 6,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: c.text }}>
          vs {match.teamBName}
        </div>
        <div style={{ fontSize: 12, color: c.textSecondary }}>
          {formatDateBR(match.date)} · {match.location}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: c.text }}>
          {o.setsA} x {o.setsB}
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: statusColor }}>
          {statusLabel}
        </div>
      </div>
    </div>
  );
});
MatchHistoryItem.displayName = 'MatchHistoryItem';
