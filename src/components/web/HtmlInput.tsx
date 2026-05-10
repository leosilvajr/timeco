import React from 'react';
import { TextInput, Textarea, PasswordInput } from '@mantine/core';
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

/** Input web baseado em Mantine TextInput / Textarea / PasswordInput. */
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
  useThemedColors();
  const commonProps = {
    label,
    placeholder,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(e.currentTarget.value),
    disabled,
    autoComplete,
    error,
    radius: 'md' as const,
    size: 'md' as const,
    style: { marginBottom: 12, ...style },
  };

  if (multiline) {
    return <Textarea {...commonProps} rows={rows} autosize minRows={rows} maxRows={rows + 4} />;
  }

  if (type === 'password') {
    return <PasswordInput {...commonProps} />;
  }

  return <TextInput {...commonProps} type={type} />;
};
