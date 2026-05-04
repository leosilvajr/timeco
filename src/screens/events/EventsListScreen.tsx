import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, RefreshControl, FlatList, Pressable } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, EmptyState, Button, Card, FilterChips, FilterOption, NotificationBell } from '../../components';
import { listEventsForUser } from '../../services/eventService';
import { useAuthStore, useThemedColors } from '../../store';
import { Event } from '../../types';
import { colors, spacing, radius } from '../../constants/theme';
import { getSport } from '../../constants/sports';
import { useResponsive } from '../../hooks/useResponsive';
import { Timestamp } from 'firebase/firestore';
import type { EventsStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<EventsStackParamList, 'EventsList'>;
type Rt = RouteProp<EventsStackParamList, 'EventsList'>;

type Filter = 'upcoming' | 'history' | 'all';

const isHistory = (e: Event): boolean =>
  e.status === 'finished' || e.status === 'cancelled';

const eventDate = (e: Event): Date | null => {
  const ts = e.scheduledAt as Timestamp | Date | null;
  if (!ts) return null;
  const d = (ts as Timestamp)?.toDate?.() ?? (ts as Date);
  return d && !Number.isNaN(d.getTime()) ? d : null;
};

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
  useThemedColors();
  const user = useAuthStore((s) => s.user);
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const responsive = useResponsive();
  const cols = responsive.isDesktop ? 2 : 1;
  const [events, setEvents] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>(route.params?.initialFilter ?? 'upcoming');

  useEffect(() => {
    if (route.params?.initialFilter) {
      setFilter(route.params.initialFilter);
    }
  }, [route.params?.initialFilter]);

  const filteredEvents = useMemo(() => {
    const now = Date.now();
    const sorted = [...events];
    if (filter === 'upcoming') {
      return sorted
        .filter((e) => !isHistory(e))
        .sort((a, b) => {
          const da = eventDate(a)?.getTime() ?? Infinity;
          const db = eventDate(b)?.getTime() ?? Infinity;
          return da - db;
        });
    }
    if (filter === 'history') {
      return sorted
        .filter((e) => isHistory(e) || (eventDate(e)?.getTime() ?? Infinity) < now)
        .sort((a, b) => {
          const da = eventDate(a)?.getTime() ?? 0;
          const db = eventDate(b)?.getTime() ?? 0;
          return db - da;
        });
    }
    return sorted.sort((a, b) => {
      const da = eventDate(a)?.getTime() ?? 0;
      const db = eventDate(b)?.getTime() ?? 0;
      return db - da;
    });
  }, [events, filter]);

  const counts = useMemo(() => {
    const now = Date.now();
    let upcoming = 0;
    let history = 0;
    for (const e of events) {
      if (isHistory(e) || (eventDate(e)?.getTime() ?? Infinity) < now) history += 1;
      else upcoming += 1;
    }
    return { upcoming, history, all: events.length };
  }, [events]);

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

  const styles = StyleSheet.create({
    headerBtns: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
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
    quickBtn: {
      paddingHorizontal: 12,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surfaceVariant,
      borderWidth: 1.5,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    quickBtnTxt: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.primary,
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

  return (
    <Screen scroll={false}>
      <Header
        title="Jogos"
        subtitle="Eventos seus e dos seus amigos"
        right={
          <View style={styles.headerBtns}>
            <Pressable
              onPress={() => nav.navigate('QuickDraw')}
              style={styles.quickBtn}
              hitSlop={8}
            >
              <Text style={styles.quickBtnTxt}>🎲 Sorteio rápido</Text>
            </Pressable>
            <Pressable
              onPress={() => nav.navigate('CreateEvent')}
              style={styles.addBtn}
              hitSlop={8}
            >
              <Text style={styles.addBtnTxt}>+</Text>
            </Pressable>
            <NotificationBell />
          </View>
        }
      />
      <FilterChips<Filter>
        value={filter}
        onChange={setFilter}
        options={[
          { key: 'upcoming', label: 'Próximos', count: counts.upcoming },
          { key: 'history', label: 'Histórico', count: counts.history },
          { key: 'all', label: 'Todos', count: counts.all },
        ] as FilterOption<Filter>[]}
      />

      <FlatList
        data={filteredEvents}
        keyExtractor={(e) => e.id}
        key={`cols-${cols}`}
        numColumns={cols}
        columnWrapperStyle={cols > 1 ? { gap: spacing.md } : undefined}
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
          loading ? null : filter === 'history' ? (
            <EmptyState
              emoji="📜"
              title="Sem histórico"
              description="Quando seus eventos forem finalizados, eles aparecem aqui."
            />
          ) : (
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
            <Card style={[styles.card, cols > 1 && { flex: 1 }]} onPress={() => nav.navigate('EventDetail', { eventId: item.id })}>
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
