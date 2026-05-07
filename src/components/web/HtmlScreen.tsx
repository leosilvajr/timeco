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
  // Expo coloca `body { overflow: hidden }` no CSS reset, entao precisamos
  // fazer scroll internamente neste container. Usa height: 100% (preenche
  // #root que tem height: 100%) + overflowY: auto pra rolagem interna,
  // -webkit-overflow-scrolling: touch pra inercia em iOS.
  return (
    <div
      style={{
        fontFamily: FONT_FAMILY,
        background: c.background,
        color: c.text,
        height: '100%',
        width: '100%',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        boxSizing: 'border-box',
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
