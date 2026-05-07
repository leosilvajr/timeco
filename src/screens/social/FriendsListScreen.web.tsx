import React, { useCallback, useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  HtmlScreen,
  HtmlHeader,
  HtmlAvatar,
  HtmlEmpty,
  HtmlButton,
  HtmlNotificationBell,
} from '../../components/web';
import {
  listFriends,
  subscribeIncomingRequests,
  subscribeFriendships,
} from '../../services/friendsService';
import { useAuthStore, useThemedColors } from '../../store';
import { User, FriendRequest } from '../../types';
import type { SocialStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<SocialStackParamList, 'FriendsList'>;

export const FriendsListScreen: React.FC = () => {
  const c = useThemedColors();
  const user = useAuthStore((s) => s.user);
  const nav = useNavigation<Nav>();
  const [friends, setFriends] = useState<User[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);

  const reloadFriends = useCallback(async () => {
    if (!user) return;
    try {
      const f = await listFriends(user.id);
      setFriends(f);
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsubReq = subscribeIncomingRequests(user.id, setRequests);
    const unsubFriendships = subscribeFriendships(user.id, () => {
      reloadFriends();
    });
    reloadFriends();
    return () => {
      unsubReq();
      unsubFriendships();
    };
  }, [user?.id, reloadFriends]);

  return (
    <HtmlScreen>
      <HtmlHeader
        title="Social"
        subtitle="Seus amigos jogadores"
        right={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => nav.navigate('AddFriend')}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                background: c.primary,
                color: c.white,
                border: 'none',
                fontSize: 28,
                lineHeight: '30px',
                cursor: 'pointer',
              }}
            >
              +
            </button>
            <HtmlNotificationBell />
          </div>
        }
      />

      {requests.length > 0 ? (
        <button
          onClick={() => nav.navigate('FriendRequests')}
          style={{
            background: c.secondary,
            borderRadius: 10,
            padding: 12,
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: 'none',
            cursor: 'pointer',
            color: c.black,
            width: '100%',
            textAlign: 'left',
            fontFamily: 'inherit',
          }}
        >
          <span style={{ fontWeight: 700 }}>
            🔔 Você tem {requests.length} convite
            {requests.length === 1 ? '' : 's'} pendente
            {requests.length === 1 ? '' : 's'}
          </span>
          <span style={{ fontSize: 22, fontWeight: 700 }}>›</span>
        </button>
      ) : null}

      {friends.length === 0 ? (
        <>
          <HtmlEmpty
            emoji="👥"
            title="Sem amigos ainda"
            subtitle="Adicione jogadores para poder convidá-los pros seus eventos."
          />
          <div style={{ marginTop: 12 }}>
            <HtmlButton title="Adicionar amigo" onClick={() => nav.navigate('AddFriend')} />
          </div>
        </>
      ) : (
        friends.map((f) => (
          <button
            key={f.id}
            onClick={() => nav.navigate('PlayerProfile', { userId: f.id })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              background: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: 16,
              marginBottom: 8,
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              fontFamily: 'inherit',
              color: 'inherit',
            }}
          >
            <HtmlAvatar name={f.name} photoURL={f.photoURL} size={44} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: c.text }}>{f.name}</div>
              <div
                style={{
                  fontSize: 12,
                  color: c.textSecondary,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {f.email}
              </div>
            </div>
            <span style={{ fontSize: 22, color: c.textMuted }}>›</span>
          </button>
        ))
      )}
    </HtmlScreen>
  );
};
