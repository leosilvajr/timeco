import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Card, EmptyState, Button } from '../../components';
import { colors, spacing, radius } from '../../constants/theme';
import {
  useAuthStore,
  useNotificationStore,
  useThemedColors,
} from '../../store';
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
  useThemedColors();
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
    // Navegação simples baseada em link — para já cobre os casos atuais.
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
    } else if (n.link && n.type.startsWith('event_') || n.type === 'teams_drawn') {
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

  const styles = StyleSheet.create({
    item: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      marginBottom: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
    },
    itemUnread: {
      backgroundColor: colors.surfaceVariant,
      borderColor: colors.primary,
    },
    icon: {
      fontSize: 26,
    },
    body: {
      flex: 1,
    },
    title: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    text: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
      lineHeight: 18,
    },
    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 6,
    },
    time: {
      fontSize: 11,
      color: colors.textMuted,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Screen>
      <Header title="Notificações" subtitle={unreadCount > 0 ? `${unreadCount} não lidas` : undefined} onBack={() => nav.goBack()} />

      {unreadCount > 0 ? (
        <View style={{ marginBottom: spacing.md }}>
          <Button title="Marcar todas como lidas" variant="outline" onPress={onMarkAll} />
        </View>
      ) : null}

      {notifications.length === 0 ? (
        <EmptyState
          emoji="🔔"
          title="Sem notificações"
          description="Você verá aqui convites, mensagens, atualizações de eventos e mais."
        />
      ) : (
        notifications.map((n) => (
          <Pressable
            key={n.id}
            onPress={() => onTap(n)}
            style={[styles.item, !n.read && styles.itemUnread]}
          >
            <Text style={styles.icon}>{ICONS[n.type] ?? '🔔'}</Text>
            <View style={styles.body}>
              <Text style={styles.title}>{n.title}</Text>
              <Text style={styles.text}>{n.body}</Text>
              <View style={styles.meta}>
                {!n.read ? <View style={styles.unreadDot} /> : null}
                <Text style={styles.time}>{formatRelative(n.createdAt)}</Text>
              </View>
            </View>
          </Pressable>
        ))
      )}
    </Screen>
  );
};
