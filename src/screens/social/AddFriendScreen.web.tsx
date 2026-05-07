import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  HtmlScreen,
  HtmlHeader,
  HtmlButton,
  HtmlInput,
  HtmlAvatar,
  HtmlCard,
} from '../../components/web';
import { searchUsersByEmail, searchUsersByName } from '../../services/userService';
import {
  sendFriendRequest,
  listFriendships,
  listOutgoingRequests,
} from '../../services/friendsService';
import { formatError } from '../../utils/errorMessages';
import { useAuthStore, useThemedColors } from '../../store';
import { User } from '../../types';
import type { SocialStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<SocialStackParamList, 'AddFriend'>;

export const AddFriendScreen: React.FC = () => {
  const c = useThemedColors();
  const user = useAuthStore((s) => s.user);
  const nav = useNavigation<Nav>();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [alreadyFriendsIds, setAlreadyFriendsIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const onSearch = async () => {
    if (!user) return;
    const trimmed = q.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      const [byEmail, byName] = await Promise.all([
        searchUsersByEmail(trimmed),
        searchUsersByName(trimmed),
      ]);
      const map = new Map<string, User>();
      for (const u of [...byEmail, ...byName]) {
        if (u.id !== user.id) map.set(u.id, u);
      }
      setResults(Array.from(map.values()));

      const [friendships, outgoing] = await Promise.all([
        listFriendships(user.id),
        listOutgoingRequests(user.id),
      ]);
      setAlreadyFriendsIds(
        new Set(friendships.flatMap((f) => f.members).filter((id) => id !== user.id)),
      );
      setPendingIds(new Set(outgoing.map((r) => r.toUserId)));
    } finally {
      setLoading(false);
    }
  };

  const onInvite = async (target: User) => {
    if (!user) return;
    if (sending.has(target.id)) return;
    setSending((s) => new Set(s).add(target.id));
    setMessage(null);
    try {
      await sendFriendRequest(user, target.id);
      setPendingIds((s) => new Set(s).add(target.id));
      setMessage(`Convite enviado para ${target.name}.`);
    } catch (e: unknown) {
      setMessage(formatError(e, 'Não conseguimos enviar o convite agora. Tente de novo.'));
    } finally {
      setSending((s) => {
        const n = new Set(s);
        n.delete(target.id);
        return n;
      });
    }
  };

  return (
    <HtmlScreen maxWidth={600}>
      <HtmlHeader title="Adicionar amigo" onBack={() => nav.goBack()} />
      <HtmlInput
        label="Buscar por email ou nome"
        value={q}
        onChange={setQ}
        placeholder="exemplo@email.com ou nome"
      />
      <HtmlButton title="Buscar" onClick={onSearch} loading={loading} />
      {message ? (
        <p style={{ marginTop: 12, textAlign: 'center', color: c.textSecondary }}>{message}</p>
      ) : null}

      <div style={{ marginTop: 8 }}>
        <HtmlButton title="Cancelar" variant="ghost" onClick={() => nav.popToTop()} />
      </div>

      <div style={{ marginTop: 16 }}>
        {results.map((u) => {
          const isFriend = alreadyFriendsIds.has(u.id);
          const isPending = pendingIds.has(u.id);
          return (
            <HtmlCard key={u.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <HtmlAvatar name={u.name} photoURL={u.photoURL} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: c.text }}>{u.name}</div>
                  <div
                    style={{
                      fontSize: 12,
                      color: c.textSecondary,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {u.email}
                  </div>
                </div>
                {isFriend ? (
                  <span
                    style={{
                      padding: '6px 10px',
                      borderRadius: 999,
                      background: c.surfaceVariant,
                      color: c.textSecondary,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    Amigo
                  </span>
                ) : isPending ? (
                  <span
                    style={{
                      padding: '6px 10px',
                      borderRadius: 999,
                      background: c.surfaceVariant,
                      color: c.textSecondary,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    Pendente
                  </span>
                ) : (
                  <HtmlButton
                    title="+ Adicionar"
                    onClick={() => onInvite(u)}
                    loading={sending.has(u.id)}
                    fullWidth={false}
                    style={{ minHeight: 40, padding: '0 14px' }}
                  />
                )}
              </div>
            </HtmlCard>
          );
        })}
      </div>
    </HtmlScreen>
  );
};
