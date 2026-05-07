import React from 'react';
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

/** Botao web. Substitui Button do RN em arquivos .web.tsx. */
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
  const c = useThemedColors();
  const isDisabled = disabled || loading;

  const bg =
    variant === 'primary'
      ? c.primary
      : variant === 'secondary'
      ? c.secondary
      : variant === 'danger'
      ? c.danger
      : 'transparent';
  const txt =
    variant === 'primary' || variant === 'danger'
      ? c.white
      : variant === 'secondary'
      ? c.black
      : c.primary;
  const border = variant === 'outline' ? `2px solid ${c.primary}` : 'none';

  return (
    <button
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      style={{
        minHeight: 50,
        borderRadius: 10,
        padding: '12px 16px',
        background: bg,
        color: txt,
        border,
        fontSize: 16,
        fontWeight: 700,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: fullWidth ? '100%' : undefined,
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {loading ? '...' : (
        <>
          {icon}
          {title}
        </>
      )}
    </button>
  );
};
