import React from 'react';
import { useThemedColors } from '../../store';

interface Props {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

/** Cabecalho web (substitui Header do RN em arquivos .web.tsx). */
export const HtmlHeader: React.FC<Props> = ({ title, subtitle, onBack, right }) => {
  const c = useThemedColors();
  return (
    <div
      style={{
        padding: '12px 0',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {onBack ? (
        <button
          onClick={onBack}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            background: c.surfaceVariant,
            border: 'none',
            color: c.text,
            fontSize: 28,
            lineHeight: '28px',
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0,
          }}
        >
          ‹
        </button>
      ) : null}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: c.text,
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </h1>
        {subtitle ? (
          <p style={{ fontSize: 14, color: c.textSecondary, margin: '2px 0 0' }}>{subtitle}</p>
        ) : null}
      </div>
      {right}
    </div>
  );
};
