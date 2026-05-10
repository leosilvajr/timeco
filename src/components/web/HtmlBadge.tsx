import React from 'react';
import { useThemedColors } from '../../store';

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary';

interface Props {
  label: string;
  variant?: Variant;
  emoji?: string;
  size?: 'sm' | 'md';
}

/** Badge web — tag colorida com texto. */
export const HtmlBadge: React.FC<Props> = ({
  label,
  variant = 'default',
  emoji,
  size = 'md',
}) => {
  const c = useThemedColors();
  const palette: Record<Variant, { bg: string; fg: string }> = {
    default: { bg: c.surfaceVariant, fg: c.textSecondary },
    success: { bg: c.success + '22', fg: c.success },
    warning: { bg: c.warning + '22', fg: c.warning },
    danger: { bg: c.danger + '22', fg: c.danger },
    info: { bg: c.info + '22', fg: c.info },
    primary: { bg: c.primary + '22', fg: c.primary },
  };
  const small = size === 'sm';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: palette[variant].bg,
        color: palette[variant].fg,
        padding: small ? '2px 8px' : '4px 10px',
        borderRadius: 999,
        fontSize: small ? 10 : 12,
        fontWeight: 700,
      }}
    >
      {emoji ? <span style={{ fontSize: small ? 11 : 13 }}>{emoji}</span> : null}
      {label}
    </span>
  );
};
