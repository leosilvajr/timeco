import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HtmlScreen, HtmlHeader, HtmlEmpty, HtmlButton } from '../../components/web';
import { useAuthStore, useNotificationStore, useThemedColors } from '../../store';
import {
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/notificationService';
import { AppNotification, NotificationType } from '../../types';
import type { ProfileStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'Notifications'>;

const ICONS: Record<NotificationType, string> = {
  friend_request: '👤',
  friend_accepted: '✅',
  event_invite: '📅',
  event_updated: '✏️',
  teams_drawn: '🎲',
  event_cancelled: '🚫',
  chat_message: '💬',
};

const formatRelative = (ts: AppNotification['createdAt']): string => {
  if (!ts) return '';
  const d =
    (ts as { toDate?: () => Date }).toDate?.() ?? (ts instanceof Date ? ts : null);
  if (!d) return '';
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return 'agora';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} h`;
  return `${Math.floor(diffSec / 86400)} d`;
};

export const NotificationsScreen: React.FC = () => {
  const c = useThemedColors();
  const nav = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const notifications = useNotificationStore((s) => s.notifications);

  const onTap = async (n: AppNotification) => {
    if (!n.read) {
      try {
        await markNotificationRead(n.id);
      } catch (err) {
        console.warn('markRead', err);
      }
    }
    if (n.link === 'FriendsList' || n.link === 'FriendRequests') {
      nav.getParent()?.navigate('Social', { screen: n.link } as never);
    } else if (n.link?.startsWith('Chat:')) {
      const friendId = n.link.slice('Chat:'.length);
      nav
        .getParent()
        ?.navigate('Social', {
          screen: 'Chat',
          params: { friendId, friendName: n.title.replace(/^Mensagem de /, '') },
        } as never);
    } else if ((n.link && n.type.startsWith('event_')) || n.type === 'teams_drawn') {
      nav
        .getParent()
        ?.navigate('Jogos', { screen: 'EventDetail', params: { eventId: n.link } } as never);
    }
  };

  const onMarkAll = async () => {
    if (!user) return;
    try {
      await markAllNotificationsRead(user.id);
    } catch (err) {
      console.warn('markAllRead', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <HtmlScreen>
      <HtmlHeader
        title="Notificações"
        subtitle={unreadCount > 0 ? `${unreadCount} não lidas` : undefined}
        onBack={() => nav.goBack()}
      />

      {unreadCount > 0 ? (
        <div style={{ marginBottom: 12 }}>
          <HtmlButton title="Marcar todas como lidas" variant="outline" onClick={onMarkAll} />
        </div>
      ) : null}

      {notifications.length === 0 ? (
        <HtmlEmpty
          emoji="🔔"
          title="Sem notificações"
          subtitle="Você verá aqui convites, mensagens, atualizações de eventos e mais."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => onTap(n)}
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                background: n.read ? c.surface : c.surfaceVariant,
                border: `1px solid ${n.read ? c.border : c.primary}`,
                borderRadius: 10,
                padding: 12,
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer',
                fontFamily: 'inherit',
                color: 'inherit',
              }}
            >
              <span style={{ fontSize: 26, flexShrink: 0 }}>{ICONS[n.type] ?? '🔔'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: c.text }}>{n.title}</div>
                <div
                  style={{
                    fontSize: 13,
                    color: c.textSecondary,
                    marginTop: 2,
                    lineHeight: 1.4,
                  }}
                >
                  {n.body}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 6,
                  }}
                >
                  {!n.read ? (
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        background: c.primary,
                        display: 'inline-block',
                      }}
                    />
                  ) : null}
                  <span style={{ fontSize: 11, color: c.textMuted }}>
                    {formatRelative(n.createdAt)}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </HtmlScreen>
  );
};
