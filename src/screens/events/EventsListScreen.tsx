import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, RefreshControl, FlatList, Pressable } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, EmptyState, Button, Card } from '../../components';
import { listEventsForUser } from '../../services/eventService';
import { useAuthStore } from '../../store';
import { Event } from '../../types';
import { colors, spacing, radius } from '../../constants/theme';
import { getSport } from '../../constants/sports';
import { Timestamp } from 'firebase/firestore';
import type { EventsStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<EventsStackParamList, 'EventsList'>;

const formatDate = (date: Date | Timestamp | null): string => {
  if (!date) return 'Sem data';
  const d = (date as Timestamp)?.toDate?.() ?? (date as Date);
  if (!d || Number.isNaN(d.getTime())) return 'Sem data';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const statusLabel: Record<Event['status'], string> = {
  open: 'Aberto',
  teams_drawn: 'Times sorteados',
  finished: 'Finalizado',
  cancelled: 'Cancelado',
};

const statusColor = (s: Event['status']) =>
  ({
    open: colors.info,
    teams_drawn: colors.primary,
    finished: colors.textMuted,
    cancelled: colors.danger,
  }[s]);

export const EventsListScreen: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const nav = useNavigation<Nav>();
  const [events, setEvents] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = await listEventsForUser(user.id);
      setEvents(data);
    } catch (e) {
      console.error('listEvents', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <Screen scroll={false}>
      <Header
        title="Jogos"
        subtitle="Eventos seus e dos seus amigos"
        right={
          <Pressable
            onPress={() => nav.navigate('CreateEvent')}
            style={styles.addBtn}
            hitSlop={8}
          >
            <Text style={styles.addBtnTxt}>+</Text>
          </Pressable>
        }
      />
      <FlatList
        data={events}
        keyExtractor={(e) => e.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              emoji="🏟️"
              title="Nenhum jogo ainda"
              description="Crie seu primeiro evento ou peça pra um amigo te convidar."
              action={<Button title="Criar evento" onPress={() => nav.navigate('CreateEvent')} />}
            />
          )
        }
        renderItem={({ item }) => {
          const sport = getSport(item.sport);
          const isOrganizer = item.organizerId === user?.id;
          const confirmedCount = Object.values(item.confirmations || {}).filter((s) => s === 'confirmed').length;
          return (
            <Card style={styles.card} onPress={() => nav.navigate('EventDetail', { eventId: item.id })}>
              <View style={styles.row}>
                <Text style={styles.emoji}>{sport.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.meta}>
                    {sport.label} • {formatDate(item.scheduledAt)}
                  </Text>
                  <Text style={styles.meta}>📍 {item.location || 'Sem local'}</Text>
                </View>
              </View>
              <View style={styles.footer}>
                <View style={[styles.status, { backgroundColor: statusColor(item.status) + '22' }]}>
                  <Text style={[styles.statusTxt, { color: statusColor(item.status) }]}>
                    {statusLabel[item.status]}
                  </Text>
                </View>
                <Text style={styles.confCount}>
                  ✅ {confirmedCount} / {item.invitedUserIds.length} confirmados
                </Text>
                {isOrganizer ? <Text style={styles.organizer}>👑 Você organiza</Text> : null}
              </View>
            </Card>
          );
        }}
        contentContainerStyle={events.length ? { paddingBottom: 80 } : { flex: 1 }}
      />
    </Screen>
  );
};

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
  card: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 38,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  meta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  footer: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  status: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  statusTxt: {
    fontSize: 12,
    fontWeight: '700',
  },
  confCount: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  organizer: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: '700',
  },
});
