import React from 'react';
import { useThemedColors } from '../../../../store';

interface Props {
  emoji: string;
  title: string;
  playerNumber: number;
  playerName: string;
  playerPosition?: string;
  value: number | string;
}

/** Card de destaque (Maior pontuador, Melhor sacador, etc) no Dashboard. */
export const HighlightRow: React.FC<Props> = React.memo(
  ({ emoji, title, playerNumber, playerName, playerPosition, value }) => {
    const c = useThemedColors();
    return (
      <div
        style={{
          background: c.surface,
          border: `1px solid ${c.border}`,
          borderRadius: 10,
          padding: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span style={{ fontSize: 22 }}>{emoji}</span>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 11,
              color: c.textSecondary,
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: c.text }}>
            #{playerNumber} {playerName}
            {playerPosition ? (
              <span style={{ color: c.textMuted, fontWeight: 600 }}>
                {' '}
                · {playerPosition}
              </span>
            ) : null}
          </div>
        </div>
        <div style={{ fontSize: 20, fontWeight: 900, color: c.primary }}>{value}</div>
      </div>
    );
  },
);
HighlightRow.displayName = 'HighlightRow';
