import React from 'react';
import { useThemedColors } from '../../store';

interface Props {
  children: React.ReactNode;
  /** Largura maxima no desktop (default 840). */
  maxWidth?: number;
  /** Padding lateral (default 12). */
  sidePad?: number;
  /** Padding bottom extra para safe area / tab bar (default 24). */
  bottomPad?: number;
  /** Estilo extra opcional. */
  style?: React.CSSProperties;
}

const FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

/**
 * Container raiz para telas web. Substitui o componente Screen do RN
 * em arquivos .web.tsx. Aplica theme colors, fontFamily, minHeight 100vh
 * e centra o conteudo no desktop com maxWidth.
 */
export const HtmlScreen: React.FC<Props> = ({
  children,
  maxWidth = 840,
  sidePad = 12,
  bottomPad = 24,
  style,
}) => {
  const c = useThemedColors();
  return (
    <div
      style={{
        fontFamily: FONT_FAMILY,
        background: c.background,
        color: c.text,
        minHeight: '100vh',
        boxSizing: 'border-box',
        width: '100%',
        ...style,
      }}
    >
      <div
        style={{
          maxWidth,
          margin: '0 auto',
          padding: `0 ${sidePad}px ${bottomPad}px`,
          boxSizing: 'border-box',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export const WEB_FONT_FAMILY = FONT_FAMILY;
