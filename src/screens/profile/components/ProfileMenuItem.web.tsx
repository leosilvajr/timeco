import React from 'react';
import { useThemedColors } from '../../../store';

interface Props {
  label: string;
  onClick: () => void;
  /** Mostra badge vermelho (notif). Soh aparece se badge > 0. */
  badge?: number;
  /** Texto secundario a direita (mutuamente exclusivo com badge). */
  value?: string;
}

/** Item de menu do ProfileHome web: label + badge/value + chevron. */
export const ProfileMenuItem: React.FC<Props> = ({ label, onClick, badge, value }) => {
  const c = useThemedColors();
  return (
    <button
      onClick={onClick}
      style={{
        background: c.surface,
        border: `1px solid ${c.border}`,
        borderRadius: 10,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        fontFamily: 'inherit',
        color: 'inherit',
      }}
    >
      <span style={{ fontSize: 15, color: c.text, fontWeight: 600 }}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {badge && badge > 0 ? (
          <span
            style={{
              minWidth: 22,
              height: 22,
              padding: '0 6px',
              borderRadius: 11,
              background: c.danger,
              color: c.white,
              fontSize: 12,
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {badge > 99 ? '99+' : badge}
          </span>
        ) : value ? (
          <span style={{ fontSize: 13, color: c.textMuted }}>{value}</span>
        ) : null}
        <span style={{ fontSize: 22, color: c.textMuted }}>›</span>
      </span>
    </button>
  );
};
