import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Card, Button, Avatar } from '../../components';
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
import { useAuthStore, useThemedColors } from '../../store';
import type { EventsStackParamList } from '../../navigation/types';

import { EventHero } from './components/EventHero';
import { EventGallery } from './components/EventGallery';

type Nav = NativeStackNavigationProp<EventsStackParamList, 'EventDetail'>;
type Rt = RouteProp<EventsStackParamList, 'EventDetail'>;

/** Avatar miniatura com nome abaixo — usado nos confirmados em linha. */
const PlayerMini: React.FC<{ u?: User }> = ({ u }) => {
  useThemedColors();
  const styles = StyleSheet.create({
    wrap: { alignItems: 'center', gap: 4, width: 64 },
    name: {
      fontSize: 11,
      color: colors.text,
      fontWeight: '600',
      textAlign: 'center',
    },
  });
  if (!u) return null;
  const firstName = u.name.split(' ')[0];
  return (
    <View style={styles.wrap}>
      <Avatar name={u.name} photoURL={u.photoURL} size={48} />
      <Text style={styles.name} numberOfLines={1}>
        {firstName}
      </Text>
    </View>
  );
};

const PlayerRow: React.FC<{ u?: User }> = ({ u }) => {
  useThemedColors();
  const styles = StyleSheet.create({
    row: {
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
    name: { fontSize: 15, color: colors.text, fontWeight: '600' },
  });
  if (!u) return null;
  return (
    <View style={styles.row}>
      <Avatar name={u.name} photoURL={u.photoURL} size={36} />
      <Text style={styles.name}>{u.name}</Text>
    </View>
  );
};

export const EventDetailScreen: React.FC = () => {
  useThemedColors();
  const route = useRoute<Rt>();
  const nav = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const [event, setEvent] = useState<Event | null>(null);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [busy, setBusy] = useState(false);

  const styles = StyleSheet.create({
    confirmCard: { marginBottom: spacing.lg },
    confirmTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
    confirmSub: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
      lineHeight: 17,
    },
    // Indicador compacto quando user já confirmou ou recusou
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surfaceVariant,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      marginBottom: spacing.lg,
      alignSelf: 'flex-start',
    },
    statusTxt: { fontSize: 13, fontWeight: '700', color: colors.text },
    statusChange: { fontSize: 12, fontWeight: '700', color: colors.primary },
    // Confirmados horizontal em miniaturas
    miniRow: {
      flexDirection: 'row',
      gap: spacing.md,
      paddingVertical: spacing.sm,
    },
    miniLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
      marginTop: spacing.md,
      marginBottom: 2,
    },
    // Linha de ações secundárias compactas (organizador)
    actionsLinkRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.lg,
      paddingVertical: spacing.sm,
      marginBottom: spacing.lg,
    },
    actionLink: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.primary,
    },
    actionLinkDanger: { color: colors.danger },
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
  });

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
    }, [load]),
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

  const allParticipantIds = [
    event.organizerId,
    ...event.invitedUserIds.filter((id) => id !== event.organizerId),
  ];
  const confirmed = allParticipantIds.filter((id) => event.confirmations?.[id] === 'confirmed');
  const declined = allParticipantIds.filter((id) => event.confirmations?.[id] === 'declined');
  const pending = allParticipantIds.filter(
    (id) => (event.confirmations?.[id] ?? 'pending') === 'pending',
  );

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
    <Screen maxWidth={840}>
      <Header
        title={event.title}
        onBack={() => nav.goBack()}
        subtitle={`${sport.emoji} ${sport.label}`}
      />

      <EventHero event={event} />

      {/* Confirmados em miniatura — logo abaixo do hero verde */}
      {confirmed.length > 0 ? (
        <>
          <Text style={styles.miniLabel}>✅ Confirmados ({confirmed.length})</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.miniRow}
          >
            {confirmed.map((id) => (
              <PlayerMini key={id} u={users[id]} />
            ))}
          </ScrollView>
        </>
      ) : null}

      {/* Confirmação: card completo se pendente, pílula compacta se já decidiu */}
      {(event.status === 'open' || event.status === 'teams_drawn') && myStatus === 'pending' ? (
        <Card style={styles.confirmCard}>
          <Text style={styles.confirmTitle}>
            {isOrganizer ? 'Você vai jogar?' : 'Você vai?'}
          </Text>
          {isOrganizer ? (
            <Text style={styles.confirmSub}>
              Como organizador, confirme se você também vai entrar nos times sorteados.
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Button
                title="Vou"
                variant="outline"
                onPress={() => setMyStatus('confirmed')}
                loading={busy}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title="Não vou"
                variant="outline"
                onPress={() => setMyStatus('declined')}
                loading={busy}
              />
            </View>
          </View>
        </Card>
      ) : (event.status === 'open' || event.status === 'teams_drawn') ? (
        <Pressable
          onPress={() => setMyStatus(myStatus === 'confirmed' ? 'declined' : 'confirmed')}
          style={styles.statusPill}
        >
          <Text style={styles.statusTxt}>
            {myStatus === 'confirmed' ? '✅ Você confirmou' : '❌ Você não vai'}
          </Text>
          <Text style={styles.statusChange}>· trocar</Text>
        </Pressable>
      ) : null}

      {/* Botão primário do organizador: sortear / refazer sorteio */}
      {isOrganizer && event.status !== 'cancelled' ? (
        <View style={{ gap: spacing.sm, marginBottom: spacing.sm }}>
          <Button
            title={
              event.status === 'teams_drawn'
                ? '🎲 Refazer sorteio'
                : '⭐ Definir estrelas e sortear times'
            }
            onPress={() => nav.navigate('RatePlayers', { eventId: event.id })}
          />
          {event.status === 'teams_drawn' ? (
            <Button
              title="Ver times sorteados"
              variant="outline"
              onPress={() => nav.navigate('DrawResult', { eventId: event.id })}
            />
          ) : null}
        </View>
      ) : null}

      {/* Ações secundárias do organizador como linha de links discretos */}
      {isOrganizer && event.status !== 'cancelled' ? (
        <View style={styles.actionsLinkRow}>
          <Pressable onPress={() => nav.navigate('EditEvent', { eventId: event.id })} hitSlop={6}>
            <Text style={styles.actionLink}>✏️ Editar</Text>
          </Pressable>
          <Pressable onPress={onCancel} hitSlop={6}>
            <Text style={styles.actionLink}>⛔ Cancelar evento</Text>
          </Pressable>
          <Pressable onPress={onDelete} hitSlop={6}>
            <Text style={[styles.actionLink, styles.actionLinkDanger]}>🗑️ Excluir</Text>
          </Pressable>
        </View>
      ) : null}

      {!isOrganizer && event.status === 'teams_drawn' ? (
        <View style={{ marginBottom: spacing.lg }}>
          <Button
            title="🎲 Ver times sorteados"
            onPress={() => nav.navigate('DrawResult', { eventId: event.id })}
          />
        </View>
      ) : null}

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

      <EventGallery event={event} user={user} isOrganizer={isOrganizer} />

      <View style={{ height: spacing.xxl }} />
    </Screen>
  );
};
