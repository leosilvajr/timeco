import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Card, Button, Avatar, EmptyState } from '../../components';
import { colors, spacing, radius } from '../../constants/theme';
import { getSport } from '../../constants/sports';
import { Event, User, ConfirmationStatus } from '../../types';
import {
  getEventById,
  setConfirmation,
  deleteEvent,
  setEventStatus,
} from '../../services/eventService';
import { getUsersByIds } from '../../services/userService';
import { useAuthStore } from '../../store';
import type { EventsStackParamList } from '../../navigation/types';
import { Timestamp } from 'firebase/firestore';

type Nav = NativeStackNavigationProp<EventsStackParamList, 'EventDetail'>;
type Rt = RouteProp<EventsStackParamList, 'EventDetail'>;

const formatDate = (date: Date | Timestamp | null): string => {
  if (!date) return '';
  const d = (date as Timestamp)?.toDate?.() ?? (date as Date);
  if (!d || Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const EventDetailScreen: React.FC = () => {
  const route = useRoute<Rt>();
  const nav = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const [event, setEvent] = useState<Event | null>(null);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const e = await getEventById(route.params.eventId);
    setEvent(e);
    if (e) {
      const all = await getUsersByIds([e.organizerId, ...e.invitedUserIds]);
      const map: Record<string, User> = {};
      for (const u of all) map[u.id] = u;
      setUsers(map);
    }
  }, [route.params.eventId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!event || !user) {
    return (
      <Screen>
        <Header title="Carregando..." onBack={() => nav.goBack()} />
      </Screen>
    );
  }

  const isOrganizer = event.organizerId === user.id;
  const myStatus: ConfirmationStatus = event.confirmations?.[user.id] ?? 'pending';
  const sport = getSport(event.sport);
  const confirmed = event.invitedUserIds.filter((id) => event.confirmations?.[id] === 'confirmed');
  const declined = event.invitedUserIds.filter((id) => event.confirmations?.[id] === 'declined');
  const pending = event.invitedUserIds.filter((id) => (event.confirmations?.[id] ?? 'pending') === 'pending');

  const setMyStatus = async (status: ConfirmationStatus) => {
    setBusy(true);
    try {
      await setConfirmation(event.id, user.id, status);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    const proceed = typeof window !== 'undefined' ? window.confirm('Apagar este evento?') : true;
    if (!proceed) return;
    await deleteEvent(event.id);
    nav.goBack();
  };

  const onCancel = async () => {
    await setEventStatus(event.id, 'cancelled');
    await load();
  };

  return (
    <Screen>
      <Header title={event.title} onBack={() => nav.goBack()} subtitle={`${sport.emoji} ${sport.label}`} />

      <Card style={styles.heroCard}>
        <Text style={styles.dateBig}>{formatDate(event.scheduledAt)}</Text>
        <Text style={styles.location}>📍 {event.location}</Text>
        <Text style={styles.organizer}>👑 Organizador: {event.organizerName}</Text>
        {event.notes ? <Text style={styles.notes}>📝 {event.notes}</Text> : null}
      </Card>

      {!isOrganizer && event.status === 'open' ? (
        <Card style={styles.confirmCard}>
          <Text style={styles.confirmTitle}>Você vai?</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Button
                title={myStatus === 'confirmed' ? '✅ Confirmado' : 'Vou'}
                variant={myStatus === 'confirmed' ? 'primary' : 'outline'}
                onPress={() => setMyStatus('confirmed')}
                loading={busy}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title={myStatus === 'declined' ? '❌ Não vou' : 'Não vou'}
                variant={myStatus === 'declined' ? 'danger' : 'outline'}
                onPress={() => setMyStatus('declined')}
                loading={busy}
              />
            </View>
          </View>
        </Card>
      ) : null}

      {isOrganizer && event.status !== 'cancelled' ? (
        <Card style={{ marginBottom: spacing.lg, gap: spacing.sm }}>
          <Button
            title={event.status === 'teams_drawn' ? '🎲 Refazer sorteio' : '⭐ Definir estrelas e sortear times'}
            onPress={() => nav.navigate('RatePlayers', { eventId: event.id })}
          />
          {event.status === 'teams_drawn' ? (
            <Button title="Ver times sorteados" variant="outline" onPress={() => nav.navigate('DrawResult', { eventId: event.id })} />
          ) : null}
          <Button title="Cancelar evento" variant="outline" onPress={onCancel} />
          <Button title="Excluir evento" variant="ghost" onPress={onDelete} />
        </Card>
      ) : null}

      {!isOrganizer && event.status === 'teams_drawn' ? (
        <View style={{ marginBottom: spacing.lg }}>
          <Button title="🎲 Ver times sorteados" onPress={() => nav.navigate('DrawResult', { eventId: event.id })} />
        </View>
      ) : null}

      <Text style={styles.section}>✅ Confirmados ({confirmed.length})</Text>
      {confirmed.length === 0 ? (
        <Text style={styles.emptyTxt}>Ninguém confirmou ainda.</Text>
      ) : (
        confirmed.map((id) => <PlayerRow key={id} u={users[id]} />)
      )}

      <Text style={styles.section}>⏳ Pendentes ({pending.length})</Text>
      {pending.length === 0 ? (
        <Text style={styles.emptyTxt}>Ninguém pendente.</Text>
      ) : (
        pending.map((id) => <PlayerRow key={id} u={users[id]} />)
      )}

      {declined.length > 0 ? (
        <>
          <Text style={styles.section}>❌ Não vão ({declined.length})</Text>
          {declined.map((id) => <PlayerRow key={id} u={users[id]} />)}
        </>
      ) : null}
      <View style={{ height: spacing.xxl }} />
    </Screen>
  );
};

const PlayerRow: React.FC<{ u?: User }> = ({ u }) => {
  if (!u) return null;
  return (
    <View style={styles.playerRow}>
      <Avatar name={u.name} photoURL={u.photoURL} size={36} />
      <Text style={styles.playerName}>{u.name}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    marginBottom: spacing.lg,
  },
  dateBig: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.white,
    textTransform: 'capitalize',
  },
  location: {
    fontSize: 15,
    color: colors.white,
    marginTop: 6,
  },
  organizer: {
    fontSize: 13,
    color: colors.white,
    opacity: 0.9,
    marginTop: 8,
  },
  notes: {
    fontSize: 13,
    color: colors.white,
    opacity: 0.9,
    marginTop: 6,
  },
  confirmCard: {
    marginBottom: spacing.lg,
  },
  confirmTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  section: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyTxt: {
    color: colors.textSecondary,
    fontSize: 13,
    paddingVertical: 4,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 6,
  },
  playerName: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
  },
});
