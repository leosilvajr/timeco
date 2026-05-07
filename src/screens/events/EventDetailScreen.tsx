import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Card, Button, Avatar } from '../../components';
import { ColorPalette, spacing, radius } from '../../constants/theme';
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

const makeMiniStyles = (c: ColorPalette) =>
  StyleSheet.create({
    wrap: { alignItems: 'center', gap: 4, width: 64 },
    name: {
      fontSize: 11,
      color: c.text,
      fontWeight: '600',
      textAlign: 'center',
    },
  });

/** Avatar miniatura com nome abaixo — usado nos confirmados em linha. */
const PlayerMini: React.FC<{ u?: User }> = ({ u }) => {
  const c = useThemedColors();
  const styles = useMemo(() => makeMiniStyles(c), [c]);
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

const makeRowStyles = (c: ColorPalette) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: c.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 6,
    },
    name: { fontSize: 15, color: c.text, fontWeight: '600' },
  });

const PlayerRow: React.FC<{ u?: User }> = ({ u }) => {
  const c = useThemedColors();
  const styles = useMemo(() => makeRowStyles(c), [c]);
  if (!u) return null;
  return (
    <View style={styles.row}>
      <Avatar name={u.name} photoURL={u.photoURL} size={36} />
      <Text style={styles.name}>{u.name}</Text>
    </View>
  );
};

const makeScreenStyles = (c: ColorPalette) =>
  StyleSheet.create({
    confirmCard: { marginBottom: spacing.lg },
    confirmTitle: { fontSize: 16, fontWeight: '700', color: c.text },
    confirmSub: {
      fontSize: 12,
      color: c.textSecondary,
      marginTop: 4,
      lineHeight: 17,
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: c.surfaceVariant,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      marginBottom: spacing.lg,
      alignSelf: 'flex-start',
    },
    statusTxt: { fontSize: 13, fontWeight: '700', color: c.text },
    statusChange: { fontSize: 12, fontWeight: '700', color: c.primary },
    miniRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      paddingVertical: spacing.sm,
    },
    miniLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: c.textSecondary,
      marginTop: spacing.md,
      marginBottom: 2,
    },
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
      color: c.primary,
    },
    actionLinkDanger: { color: c.danger },
    section: {
      fontSize: 15,
      fontWeight: '800',
      color: c.text,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    emptyTxt: {
      color: c.textSecondary,
      fontSize: 13,
      paddingVertical: 4,
    },
  });

export const EventDetailScreen: React.FC = () => {
  const c = useThemedColors();
  const route = useRoute<Rt>();
  const nav = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const [event, setEvent] = useState<Event | null>(null);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [busy, setBusy] = useState(false);

  const styles = useMemo(() => makeScreenStyles(c), [c]);

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
    const proceed =
      typeof window !== 'undefined'
        ? window.confirm('Cancelar este evento? Avisa todos que nao vai mais acontecer.')
        : true;
    if (!proceed) return;
    await setEventStatus(event.id, 'cancelled');
    await load();
  };

  const onClose = async () => {
    const proceed =
      typeof window !== 'undefined'
        ? window.confirm('Encerrar este evento? Vai pro Historico e some das listas.')
        : true;
    if (!proceed) return;
    await setEventStatus(event.id, 'finished');
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
          <View style={styles.miniRow}>
            {confirmed.map((id) => (
              <PlayerMini key={id} u={users[id]} />
            ))}
          </View>
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

      {/* Selo de status quando finalizado/cancelado */}
      {event.status === 'finished' || event.status === 'cancelled' ? (
        <View
          style={{
            backgroundColor:
              event.status === 'finished' ? c.surfaceVariant : c.danger + '22',
            borderWidth: 1,
            borderColor: event.status === 'finished' ? c.border : c.danger,
            borderRadius: radius.md,
            padding: spacing.md,
            marginBottom: spacing.lg,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: '800',
              color: event.status === 'finished' ? c.text : c.danger,
            }}
          >
            {event.status === 'finished'
              ? '🏁 Evento encerrado · arquivado no histórico'
              : '⛔ Evento cancelado'}
          </Text>
        </View>
      ) : null}

      {/* Botão primário do organizador: sortear / refazer sorteio */}
      {isOrganizer && (event.status === 'open' || event.status === 'teams_drawn') ? (
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
          {event.status !== 'finished' ? (
            <>
              <Pressable
                onPress={() => nav.navigate('EditEvent', { eventId: event.id })}
                hitSlop={6}
              >
                <Text style={styles.actionLink}>✏️ Editar</Text>
              </Pressable>
              <Pressable onPress={onClose} hitSlop={6}>
                <Text style={styles.actionLink}>🏁 Encerrar evento</Text>
              </Pressable>
              <Pressable onPress={onCancel} hitSlop={6}>
                <Text style={styles.actionLink}>⛔ Cancelar evento</Text>
              </Pressable>
            </>
          ) : null}
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
