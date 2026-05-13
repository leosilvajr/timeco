import React from 'react';
import { useThemedColors } from '../../../store';

interface Props {
  emoji: string;
  title: string;
  subtitle: string;
  onClick: () => void;
}

/**
 * Banner clicavel de alerta no Home (perfil incompleto, notificacoes
 * nao lidas, etc). Estilo consistente: surfaceVariant + primaryLight
 * border + chevron.
 */
export const HomeAlertBanner: React.FC<Props> = ({
  emoji,
  title,
  subtitle,
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
        borderRadius: 10,
        background: c.surfaceVariant,
        border: `1px solid ${c.primaryLight}`,
        marginBottom: 12,
        width: '100%',
        cursor: 'pointer',
        color: c.text,
        fontFamily: 'inherit',
        textAlign: 'left',
      }}
    >
      <span style={{ fontSize: 22 }}>{emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: c.text }}>{title}</div>
        <div style={{ fontSize: 12, color: c.textSecondary, marginTop: 2 }}>
          {subtitle}
        </div>
      </div>
      <span style={{ fontSize: 22, color: c.textMuted }}>›</span>
    </button>
  );
};
