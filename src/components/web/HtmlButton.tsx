import React from 'react';
import { Button as MantineButton } from '@mantine/core';
import { useThemedColors } from '../../store';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

interface Props {
  title: string;
  onClick: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: React.CSSProperties;
}

const VARIANT_MAP: Record<
  Variant,
  { variant: 'filled' | 'outline' | 'subtle'; color?: string }
> = {
  primary: { variant: 'filled', color: 'timeco' },
  secondary: { variant: 'filled', color: 'yellow' },
  outline: { variant: 'outline', color: 'timeco' },
  ghost: { variant: 'subtle', color: 'gray' },
  danger: { variant: 'filled', color: 'red' },
};

/** Botao web baseado em Mantine. Substitui Button do RN em arquivos .web.tsx. */
export const HtmlButton: React.FC<Props> = ({
  title,
  onClick,
  variant = 'primary',
  loading,
  disabled,
  icon,
  fullWidth = true,
  style,
}) => {
  useThemedColors();
  const cfg = VARIANT_MAP[variant];
  return (
    <MantineButton
      variant={cfg.variant}
      color={cfg.color}
      onClick={onClick}
      loading={loading}
      disabled={disabled}
      leftSection={icon}
      fullWidth={fullWidth}
      size="md"
      radius="md"
      style={{
        fontWeight: 700,
        ...style,
      }}
    >
      {title}
    </MantineButton>
  );
};
