import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Avatar, EmptyState, Button, Card, NotificationBell } from '../../components';
import { colors, spacing, radius } from '../../constants/theme';
import {
  listFriends,
  subscribeIncomingRequests,
  subscribeFriendships,
} from '../../services/friendsService';
import { useAuthStore, useThemedColors } from '../../store';
import { useResponsive } from '../../hooks/useResponsive';
import { User, FriendRequest } from '../../types';
import type { SocialStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<SocialStackParamList, 'FriendsList'>;

export const FriendsListScreen: React.FC = () => {
  useThemedColors();
  const user = useAuthStore((s) => s.user);
  const nav = useNavigation<Nav>();
  const responsive = useResponsive();
  const cols = responsive.isDesktop ? 2 : 1;
  const [friends, setFriends] = useState<User[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const reloadFriends = useCallback(async () => {
    if (!user) return;
    try {
      const f = await listFriends(user.id);
      setFriends(f);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  // Realtime: convites e amizades atualizam sem precisar refresh.
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
  }, [user, reloadFriends]);

  const styles = StyleSheet.create({
    addBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addBtnTxt: {
      fontSize: 28,
      color: colors.white,
      lineHeight: 30,
      marginTop: -2,
    },
    requestsBanner: {
      backgroundColor: colors.secondary,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    requestsBannerTxt: {
      fontWeight: '700',
      color: colors.black,
    },
    requestsArrow: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.black,
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
    chev: {
      fontSize: 22,
      color: colors.textMuted,
    },
  });

  return (
    <Screen scroll={false}>
      <Header
        title="Social"
        subtitle="Seus amigos jogadores"
        right={
          <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
            <Pressable onPress={() => nav.navigate('AddFriend')} style={styles.addBtn} hitSlop={8}>
              <Text style={styles.addBtnTxt}>+</Text>
            </Pressable>
            <NotificationBell />
          </View>
        }
      />

      {requests.length > 0 ? (
        <Pressable
          onPress={() => nav.navigate('FriendRequests')}
          style={styles.requestsBanner}
        >
          <Text style={styles.requestsBannerTxt}>
            🔔 Você tem {requests.length} convite{requests.length === 1 ? '' : 's'} pendente{requests.length === 1 ? '' : 's'}
          </Text>
          <Text style={styles.requestsArrow}>›</Text>
        </Pressable>
      ) : null}

      <FlatList
        data={friends}
        keyExtractor={(f) => f.id}
        key={`cols-${cols}`}
        numColumns={cols}
        columnWrapperStyle={cols > 1 ? { gap: spacing.md } : undefined}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); reloadFriends(); }} />
        }
        ListEmptyComponent={
          <EmptyState
            emoji="👥"
            title="Sem amigos ainda"
            description="Adicione jogadores para poder convidá-los pros seus eventos."
            action={<Button title="Adicionar amigo" onPress={() => nav.navigate('AddFriend')} />}
          />
        }
        renderItem={({ item }) => (
          <Card style={[styles.row, cols > 1 && { flex: 1 }]} onPress={() => nav.navigate('PlayerProfile', { userId: item.id })}>
            <Avatar name={item.name} photoURL={item.photoURL} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.email}>{item.email}</Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </Card>
        )}
        contentContainerStyle={friends.length ? { paddingBottom: 80 } : { flex: 1 }}
      />
    </Screen>
  );
};
