import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { useThemedColors, useUnreadCount } from '../../store';

/** Sininho web — pra usar dentro de telas .web.tsx. */
export const HtmlNotificationBell: React.FC = () => {
  const c = useThemedColors();
  const unread = useUnreadCount();
  const nav = useNavigation();

  const goToNotifications = () => {
    // initial: false pra empilhar Notifications em cima do ProfileHome
    // (em vez de resetar a stack do Perfil pra ter so Notifications).
    (nav as unknown as { navigate: (n: string, p?: unknown) => void }).navigate('Perfil', {
      screen: 'Notifications',
      initial: false,
    });
  };

  return (
    <button
      onClick={goToNotifications}
      style={{
        position: 'relative',
        width: 40,
        height: 40,
        borderRadius: 20,
        background: c.surfaceVariant,
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 20, lineHeight: '22px' }}>🔔</span>
      {unread > 0 ? (
        <span
          style={{
            position: 'absolute',
            top: 2,
            right: 2,
            minWidth: 18,
            height: 18,
            padding: '0 4px',
            borderRadius: 9,
            background: c.danger,
            color: c.white,
            fontSize: 10,
            fontWeight: 900,
            lineHeight: '14px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `2px solid ${c.surfaceVariant}`,
            boxSizing: 'border-box',
          }}
        >
          {unread > 99 ? '99+' : unread}
        </span>
      ) : null}
    </button>
  );
};
