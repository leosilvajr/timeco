import React from 'react';
import { useThemedColors } from '../../../store';

interface Props {
  url: string;
  caption?: string;
  onClose: () => void;
}

/** Modal fullscreen pra visualizar uma foto. Fecha clicando fora. */
export const Lightbox: React.FC<Props> = ({ url, caption, onClose }) => {
  const c = useThemedColors();
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        cursor: 'pointer',
      }}
    >
      <img
        src={url}
        alt=""
        style={{ maxWidth: '95vw', maxHeight: '85vh', objectFit: 'contain' }}
      />
      {caption ? (
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: 16,
            right: 16,
            color: c.white,
            fontSize: 14,
            textAlign: 'center',
          }}
        >
          {caption}
        </div>
      ) : null}
    </div>
  );
};
