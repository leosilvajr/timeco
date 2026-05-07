import React from 'react';
import { useThemedColors } from '../../store';

interface Props {
  emoji?: string;
  title: string;
  subtitle?: string;
}

/** Empty state web — emoji + titulo + descricao centralizados. */
export const HtmlEmpty: React.FC<Props> = ({ emoji, title, subtitle }) => {
  const c = useThemedColors();
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '32px 16px',
        color: c.textSecondary,
      }}
    >
      {emoji ? <div style={{ fontSize: 40, marginBottom: 8 }}>{emoji}</div> : null}
      <p style={{ fontSize: 15, fontWeight: 700, color: c.text, margin: 0 }}>{title}</p>
      {subtitle ? (
        <p style={{ fontSize: 13, color: c.textSecondary, margin: '6px 0 0' }}>{subtitle}</p>
      ) : null}
    </div>
  );
};
