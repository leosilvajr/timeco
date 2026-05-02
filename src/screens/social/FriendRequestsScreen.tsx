import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Card, Button, Avatar, EmptyState } from '../../components';
import { colors, spacing } from '../../constants/theme';
import { acceptFriendRequest, declineFriendRequest, subscribeIncomingRequests } from '../../services/friendsService';
import { useAuthStore, useThemedColors } from '../../store';
import { FriendRequest } from '../../types';
import type { SocialStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<SocialStackParamList, 'FriendRequests'>;

export const FriendRequestsScreen: React.FC = () => {
  useThemedColors();
  const user = useAuthStore((s) => s.user);
  const nav = useNavigation<Nav>();
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [busy, setBusy] = useState<Set<string>>(new Set());

  // Realtime: a lista atualiza sozinha quando alguém envia um convite.
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeIncomingRequests(user.id, setRequests);
    return () => unsub();
  }, [user]);

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

  const styles = StyleSheet.create({
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
    sub: {
      fontSize: 12,
      color: colors.textSecondary,
    },
  });

  return (
    <Screen maxWidth={720}>
      <Header title="Convites recebidos" onBack={() => nav.goBack()} />
      {requests.length === 0 ? (
        <EmptyState emoji="📭" title="Sem convites" description="Você não tem convites de amizade pendentes." />
      ) : (
        requests.map((r) => (
          <Card key={r.id} style={styles.row}>
            <Avatar name={r.fromUserName} photoURL={r.fromUserPhoto} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{r.fromUserName}</Text>
              <Text style={styles.sub}>quer ser seu amigo</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Button
                title="Aceitar"
                onPress={() => onAccept(r)}
                loading={busy.has(r.id)}
                fullWidth={false}
                style={{ minHeight: 40, paddingHorizontal: 12 }}
              />
              <Button
                title="Recusar"
                variant="outline"
                onPress={() => onDecline(r)}
                loading={busy.has(r.id)}
                fullWidth={false}
                style={{ minHeight: 40, paddingHorizontal: 12 }}
              />
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
};
