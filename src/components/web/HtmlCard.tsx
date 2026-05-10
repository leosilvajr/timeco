import React from 'react';
import { Card as MantineCard } from '@mantine/core';
import { useThemedColors } from '../../store';

interface Props {
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/** Card web baseado em Mantine Card (shadow + border + radius). */
export const HtmlCard: React.FC<Props> = ({ children, onClick, style }) => {
  const c = useThemedColors();
  const baseStyle: React.CSSProperties = {
    background: c.surface,
    color: c.text,
    marginBottom: 16,
    ...style,
  };

  if (onClick) {
    return (
      <MantineCard
        shadow="xs"
        padding="lg"
        radius="md"
        withBorder
        onClick={onClick}
        style={{
          ...baseStyle,
          cursor: 'pointer',
          transition: 'transform 80ms ease, box-shadow 120ms ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        }}
      >
        {children}
      </MantineCard>
    );
  }

  return (
    <MantineCard shadow="xs" padding="lg" radius="md" withBorder style={baseStyle}>
      {children}
    </MantineCard>
  );
};
