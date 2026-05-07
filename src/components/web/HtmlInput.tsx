import React from 'react';
import { useThemedColors } from '../../store';

interface Props {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
  autoComplete?: string;
  error?: string;
  style?: React.CSSProperties;
}

/** Input web. Substitui Input do RN em arquivos .web.tsx. */
export const HtmlInput: React.FC<Props> = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  multiline,
  rows = 4,
  disabled,
  autoComplete,
  error,
  style,
}) => {
  const c = useThemedColors();
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: `1px solid ${error ? c.danger : c.border}`,
    background: c.surface,
    color: c.text,
    fontSize: 15,
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    minHeight: multiline ? rows * 24 : 44,
    resize: multiline ? ('vertical' as const) : ('none' as const),
    opacity: disabled ? 0.6 : 1,
    ...style,
  };

  return (
    <div style={{ marginBottom: 12 }}>
      {label ? (
        <label
          style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 700,
            color: c.textSecondary,
            marginBottom: 6,
          }}
        >
          {label}
        </label>
      ) : null}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          autoComplete={autoComplete}
          style={inputStyle}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          style={inputStyle}
        />
      )}
      {error ? (
        <p style={{ color: c.danger, fontSize: 12, margin: '4px 0 0' }}>{error}</p>
      ) : null}
    </div>
  );
};
