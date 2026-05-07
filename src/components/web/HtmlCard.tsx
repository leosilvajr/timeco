import React from 'react';
import { useThemedColors } from '../../store';

interface Props {
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/** Card web — substitui Card do RN em arquivos .web.tsx. */
export const HtmlCard: React.FC<Props> = ({ children, onClick, style }) => {
  const c = useThemedColors();
  const baseStyle: React.CSSProperties = {
    background: c.surface,
    borderRadius: 16,
    padding: 16,
    border: `1px solid ${c.border}`,
    marginBottom: 16,
    boxSizing: 'border-box',
    ...style,
  };
  if (onClick) {
    return (
      <button
        onClick={onClick}
        style={{
          ...baseStyle,
          cursor: 'pointer',
          textAlign: 'left',
          font: 'inherit',
          color: 'inherit',
          width: '100%',
          display: 'block',
        }}
      >
        {children}
      </button>
    );
  }
  return <div style={baseStyle}>{children}</div>;
};
