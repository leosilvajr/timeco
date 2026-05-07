import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  HtmlScreen,
  HtmlHeader,
  HtmlCard,
  HtmlButton,
  HtmlAvatar,
  HtmlEmpty,
} from '../../components/web';
import {
  acceptFriendRequest,
  declineFriendRequest,
  subscribeIncomingRequests,
} from '../../services/friendsService';
import { useAuthStore, useThemedColors } from '../../store';
import { FriendRequest } from '../../types';
import type { SocialStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<SocialStackParamList, 'FriendRequests'>;

export const FriendRequestsScreen: React.FC = () => {
  const c = useThemedColors();
  const user = useAuthStore((s) => s.user);
  const nav = useNavigation<Nav>();
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [busy, setBusy] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeIncomingRequests(user.id, setRequests);
    return () => unsub();
  }, [user?.id]);

  const markBusy = (id: string, b: boolean) =>
    setBusy((s) => {
      const n = new Set(s);
      if (b) n.add(id);
      else n.delete(id);
      return n;
    });

  const onAccept = async (r: FriendRequest) => {
    markBusy(r.id, true);
    try {
      await acceptFriendRequest(r);
    } finally {
      markBusy(r.id, false);
    }
  };

  const onDecline = async (r: FriendRequest) => {
    markBusy(r.id, true);
    try {
      await declineFriendRequest(r.id);
    } finally {
      markBusy(r.id, false);
    }
  };

  return (
    <HtmlScreen maxWidth={720}>
      <HtmlHeader title="Convites recebidos" onBack={() => nav.goBack()} />
      {requests.length === 0 ? (
        <HtmlEmpty
          emoji="📭"
          title="Sem convites"
          subtitle="Você não tem convites de amizade pendentes."
        />
      ) : (
        requests.map((r) => (
          <HtmlCard key={r.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <HtmlAvatar name={r.fromUserName} photoURL={r.fromUserPhoto} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: c.text }}>
                  {r.fromUserName}
                </div>
                <div style={{ fontSize: 12, color: c.textSecondary }}>quer ser seu amigo</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <HtmlButton
                  title="Aceitar"
                  onClick={() => onAccept(r)}
                  loading={busy.has(r.id)}
                  fullWidth={false}
                  style={{ minHeight: 40, padding: '0 12px' }}
                />
                <HtmlButton
                  title="Recusar"
                  variant="outline"
                  onClick={() => onDecline(r)}
                  loading={busy.has(r.id)}
                  fullWidth={false}
                  style={{ minHeight: 40, padding: '0 12px' }}
                />
              </div>
            </div>
          </HtmlCard>
        ))
      )}
    </HtmlScreen>
  );
};
