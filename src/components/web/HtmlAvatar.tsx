import React from 'react';
import { Avatar as MantineAvatar } from '@mantine/core';
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

/** Avatar web baseado em Mantine Avatar. Mostra iniciais coloridas se sem foto. */
export const HtmlAvatar: React.FC<Props> = ({ name, photoURL, size = 44 }) => {
  const c = useThemedColors();
  return (
    <MantineAvatar
      src={photoURL}
      alt={name ?? ''}
      size={size}
      radius={size / 2}
      color="timeco"
      style={{
        background: photoURL ? c.surfaceVariant : c.primary,
        color: c.white,
        fontWeight: 800,
        fontSize: size * 0.4,
        flexShrink: 0,
      }}
    >
      {initials(name)}
    </MantineAvatar>
  );
};
