import React from 'react';
import { useThemedColors } from '../../../store';

interface Props {
  emoji: string;
  title: string;
  subtitle: string;
  badge?: string;
  onClick: () => void;
}

/** Botao de utilitario (Scoreboard, Volei avancado, etc) na secao Utilitarios. */
export const UtilityLink: React.FC<Props> = ({
  emoji,
  title,
  subtitle,
  badge,
  onClick,
}) => {
  const c = useThemedColors();
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
        borderRadius: 10,
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        fontFamily: 'inherit',
        color: 'inherit',
      }}
    >
      <span style={{ fontSize: 24 }}>{emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: c.text }}>
          {title}
          {badge ? (
            <span
              style={{
                fontSize: 9,
                fontWeight: 900,
                background: c.primary,
                color: c.white,
                borderRadius: 999,
                padding: '2px 6px',
                marginLeft: 4,
                letterSpacing: 0.5,
              }}
            >
              {badge}
            </span>
          ) : null}
        </div>
        <div style={{ fontSize: 12, color: c.textSecondary }}>{subtitle}</div>
      </div>
      <span style={{ fontSize: 18, color: c.textMuted }}>›</span>
    </button>
  );
};
