import React from 'react';
import { Timestamp } from 'firebase/firestore';
import { useThemedColors } from '../../../store';
import { Event } from '../../../types';
import { getSport } from '../../../constants/sports';

interface Props {
  event: Event;
  onClick: () => void;
}

const eventDate = (e: Event): Date | null => {
  const ts = e.scheduledAt as Timestamp | Date | null;
  if (!ts) return null;
  const d = (ts as Timestamp)?.toDate?.() ?? (ts as Date);
  return d && !Number.isNaN(d.getTime()) ? d : null;
};

const formatRelative = (d: Date): string => {
  const diffMs = d.getTime() - Date.now();
  const diffHr = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays > 1) return `Em ${diffDays} dias`;
  if (diffDays === 1) return 'Amanhã';
  if (diffHr > 1) return `Em ${diffHr}h`;
  if (diffHr >= 0) return 'Hoje';
  return 'Em andamento';
};

const formatDateTime = (d: Date): string =>
  d.toLocaleString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

/** Card de evento na lista 'Proximos jogos' do Home. */
export const UpcomingEventItem: React.FC<Props> = ({ event, onClick }) => {
  const c = useThemedColors();
  const sport = getSport(event.sport);
  const d = eventDate(event);
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        background: c.surface,
        border: `1px solid ${c.border}`,
        borderRadius: 16,
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        fontFamily: 'inherit',
        color: 'inherit',
      }}
    >
      <span style={{ fontSize: 30 }}>{sport.emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: c.text,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {event.title}
        </div>
        <div style={{ fontSize: 13, color: c.primary, fontWeight: 700 }}>
          {d ? formatRelative(d) : 'Sem data'}
        </div>
        <div
          style={{
            fontSize: 12,
            color: c.textSecondary,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {d ? formatDateTime(d) : ''} · 📍 {event.location}
        </div>
      </div>
      <span style={{ fontSize: 22, color: c.textMuted }}>›</span>
    </button>
  );
};
