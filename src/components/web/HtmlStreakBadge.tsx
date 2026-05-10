import React from 'react';
import { useThemedColors } from '../../store';

interface Props {
  days: number;
  unit?: string;
}

/** Selo de streak web — fogo laranja se >= 3 dias. */
export const HtmlStreakBadge: React.FC<Props> = ({ days, unit = 'dias' }) => {
  const c = useThemedColors();
  const hot = days >= 3;
  const accent = '#FF6B35';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: hot ? `${accent}22` : c.surfaceVariant,
        color: hot ? accent : c.textSecondary,
        padding: '4px 10px',
        borderRadius: 999,
        border: `1px solid ${hot ? accent : c.border}`,
        fontSize: 12,
        fontWeight: 800,
      }}
    >
      <span style={{ fontSize: 14 }}>🔥</span>
      {days} {unit}
    </span>
  );
};
