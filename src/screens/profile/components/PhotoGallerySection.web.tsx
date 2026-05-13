import React from 'react';
import { HtmlCard } from '../../../components/web';
import { useThemedColors } from '../../../store';

interface PhotoLike {
  id: string;
  url: string;
  caption?: string;
}

interface Props {
  title: string;
  photos: PhotoLike[];
  emptyText?: string;
  onPhotoClick: (photo: PhotoLike) => void;
  /** Se passado, mostra "X" pra apagar e botao "+ Foto" pra adicionar. */
  manage?: {
    onAdd: () => void;
    onRemove: (photo: PhotoLike) => void;
    uploading: boolean;
  };
  /** Estilo extra do card (ex.: marginTop). */
  cardStyle?: React.CSSProperties;
}

/**
 * Secao de galeria com grid 88x88 de fotos. Usada 2x no ProfileHome
 * (galeria pessoal — editavel; galeria em eventos — somente leitura).
 */
export const PhotoGallerySection: React.FC<Props> = ({
  title,
  photos,
  emptyText,
  onPhotoClick,
  manage,
  cardStyle,
}) => {
  const c = useThemedColors();
  return (
    <HtmlCard style={cardStyle}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: c.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 8,
        }}
      >
        {title} ({photos.length})
      </div>
      {photos.length === 0 && !manage ? (
        <div
          style={{
            fontSize: 12,
            color: c.textSecondary,
            textAlign: 'center',
            padding: '12px 0',
          }}
        >
          {emptyText || 'Sem fotos.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {photos.map((p) => (
            <div key={p.id} style={{ position: 'relative' }}>
              <button
                onClick={() => onPhotoClick(p)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                }}
              >
                <img
                  src={p.url}
                  alt=""
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: 10,
                    objectFit: 'cover',
                    background: c.surfaceVariant,
                    display: 'block',
                  }}
                />
              </button>
              {manage ? (
                <button
                  onClick={() => manage.onRemove(p)}
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    background: 'rgba(0,0,0,0.6)',
                    color: c.white,
                    border: 'none',
                    fontSize: 14,
                    fontWeight: 900,
                    cursor: 'pointer',
                    padding: 0,
                    lineHeight: '22px',
                  }}
                >
                  ×
                </button>
              ) : null}
            </div>
          ))}
          {manage ? (
            <button
              onClick={manage.onAdd}
              disabled={manage.uploading}
              style={{
                width: 88,
                height: 88,
                borderRadius: 10,
                background: c.surfaceVariant,
                border: `2px dashed ${c.primary}`,
                cursor: manage.uploading ? 'wait' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                color: c.primary,
              }}
            >
              <span style={{ fontSize: 26, fontWeight: 900, lineHeight: '28px' }}>+</span>
              <span style={{ fontSize: 10, fontWeight: 700 }}>
                {manage.uploading ? 'Enviando...' : 'Foto'}
              </span>
            </button>
          ) : null}
        </div>
      )}
    </HtmlCard>
  );
};
