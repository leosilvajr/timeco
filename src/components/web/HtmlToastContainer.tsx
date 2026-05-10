import React from 'react';
import { useToastStore, ToastType } from '../../store/toastStore';
import { useThemedColors } from '../../store';

const ICONS: Record<ToastType, string> = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

const COLORS_FOR = (
  type: ToastType,
  c: ReturnType<typeof useThemedColors>,
): { bg: string; fg: string; border: string } => {
  switch (type) {
    case 'success':
      return { bg: c.success, fg: c.white, border: c.success };
    case 'error':
      return { bg: c.danger, fg: c.white, border: c.danger };
    case 'warning':
      return { bg: c.warning, fg: c.black, border: c.warning };
    case 'info':
    default:
      return { bg: c.surface, fg: c.text, border: c.border };
  }
};

/**
 * Container fixo de toasts no canto superior direito (desktop) ou inferior
 * central (mobile via media query). Renderizar uma vez no App raiz.
 */
export const HtmlToastContainer: React.FC = () => {
  const c = useThemedColors();
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        bottom: 'auto',
        left: 'auto',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxWidth: 360,
        width: 'calc(100% - 32px)',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => {
        const palette = COLORS_FOR(t.type, c);
        return (
          <div
            key={t.id}
            role="status"
            style={{
              pointerEvents: 'auto',
              background: palette.bg,
              color: palette.fg,
              border: `1px solid ${palette.border}`,
              borderRadius: 10,
              padding: '12px 14px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              fontSize: 14,
              fontFamily: 'inherit',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              animation: 'timeco-toast-in 200ms ease-out',
            }}
          >
            <span style={{ fontSize: 18, flexShrink: 0 }}>{ICONS[t.type]}</span>
            <span style={{ flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {t.message}
            </span>
            {t.action ? (
              <button
                onClick={() => {
                  t.action?.onPress();
                  dismiss(t.id);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: palette.fg,
                  fontWeight: 800,
                  fontSize: 13,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {t.action.label}
              </button>
            ) : null}
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Fechar"
              style={{
                background: 'transparent',
                border: 'none',
                color: palette.fg,
                opacity: 0.7,
                fontSize: 18,
                lineHeight: 1,
                cursor: 'pointer',
                padding: 0,
                marginLeft: 4,
              }}
            >
              ×
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes timeco-toast-in {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 600px) {
          [role="status"] {
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
};
