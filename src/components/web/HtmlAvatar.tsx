import React from 'react';
import { useThemedColors } from '../../store';

interface Props {
  name?: string;
  photoURL?: string;
  size?: number;
}

const initials = (name?: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/** Avatar web. Renderiza img se tem photoURL, senao iniciais em circle. */
export const HtmlAvatar: React.FC<Props> = ({ name, photoURL, size = 44 }) => {
  const c = useThemedColors();
  const baseStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: size / 2,
    flexShrink: 0,
    objectFit: 'cover',
    display: 'block',
  };
  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt={name ?? ''}
        style={{ ...baseStyle, background: c.surfaceVariant }}
      />
    );
  }
  return (
    <div
      style={{
        ...baseStyle,
        background: c.primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: c.white,
        fontWeight: 800,
        fontSize: size * 0.4,
      }}
    >
      {initials(name)}
    </div>
  );
};
