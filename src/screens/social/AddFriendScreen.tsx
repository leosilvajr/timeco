import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Input, Button, Card, Avatar } from '../../components';
import { colors, spacing, radius } from '../../constants/theme';
import { searchUsersByEmail, searchUsersByName } from '../../services/userService';
import { sendFriendRequest, listFriendships, listOutgoingRequests } from '../../services/friendsService';
import { useAuthStore, useThemedColors } from '../../store';
import { User } from '../../types';
import type { SocialStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<SocialStackParamList, 'AddFriend'>;

export const AddFriendScreen: React.FC = () => {
  useThemedColors();
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
      // Busca em paralelo por email E por nome — independente de ter "@".
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
      setAlreadyFriendsIds(new Set(friendships.flatMap((f) => f.members).filter((id) => id !== user.id)));
      setPendingIds(new Set(outgoing.map((r) => r.toUserId)));
    } finally {
      setLoading(false);
    }
  };

  const onInvite = async (target: User) => {
    if (!user) return;
    setSending((s) => new Set(s).add(target.id));
    setMessage(null);
    try {
      await sendFriendRequest(user, target.id);
      setPendingIds((s) => new Set(s).add(target.id));
      setMessage(`Convite enviado para ${target.name}`);
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : 'Erro');
    } finally {
      setSending((s) => {
        const n = new Set(s);
        n.delete(target.id);
        return n;
      });
    }
  };

  const styles = StyleSheet.create({
    msg: {
      marginTop: spacing.md,
      textAlign: 'center',
      color: colors.textSecondary,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.sm,
    },
    name: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    email: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    tag: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radius.pill,
    },
    tagTxt: {
      fontSize: 12,
      fontWeight: '700',
    },
  });

  return (
    <Screen>
      <Header title="Adicionar amigo" onBack={() => nav.goBack()} />
      <Input
        label="Buscar por email ou nome"
        value={q}
        onChangeText={setQ}
        placeholder="exemplo@email.com ou nome"
        autoCapitalize="none"
        onSubmitEditing={onSearch}
      />
      <Button title="Buscar" onPress={onSearch} loading={loading} />
      {message ? <Text style={styles.msg}>{message}</Text> : null}

      <View style={{ marginTop: spacing.lg }}>
        {results.map((u) => {
          const isFriend = alreadyFriendsIds.has(u.id);
          const isPending = pendingIds.has(u.id);
          return (
            <Card key={u.id} style={styles.row}>
              <Avatar name={u.name} photoURL={u.photoURL} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{u.name}</Text>
                <Text style={styles.email}>{u.email}</Text>
              </View>
              {isFriend ? (
                <View style={[styles.tag, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={[styles.tagTxt, { color: colors.textSecondary }]}>Amigo</Text>
                </View>
              ) : isPending ? (
                <View style={[styles.tag, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={[styles.tagTxt, { color: colors.textSecondary }]}>Pendente</Text>
                </View>
              ) : (
                <Button
                  title="+ Adicionar"
                  onPress={() => onInvite(u)}
                  loading={sending.has(u.id)}
                  fullWidth={false}
                  style={{ minHeight: 40, paddingHorizontal: 14 }}
                />
              )}
            </Card>
          );
        })}
      </View>
    </Screen>
  );
};
