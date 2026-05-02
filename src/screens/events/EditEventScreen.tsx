import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Input, Button, Card, Avatar, DateInput, TimeInput } from '../../components';
import { SPORTS, getSport } from '../../constants/sports';
import { colors, radius, spacing } from '../../constants/theme';
import { listFriends } from '../../services/friendsService';
import { getEventById, updateEvent } from '../../services/eventService';
import { notifySafe } from '../../services/notificationService';
import { useAuthStore, useThemedColors } from '../../store';
import { Event, SportId, User } from '../../types';
import { Timestamp } from 'firebase/firestore';
import type { EventsStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<EventsStackParamList, 'EditEvent'>;
type Rt = RouteProp<EventsStackParamList, 'EditEvent'>;

const pad = (n: number) => String(n).padStart(2, '0');

const splitDateTime = (ts: Event['scheduledAt']): { date: string; time: string } => {
  if (!ts) return { date: '', time: '' };
  const d = (ts as Timestamp)?.toDate?.() ?? (ts as Date);
  if (!d || Number.isNaN(d.getTime())) return { date: '', time: '' };
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
};

export const EditEventScreen: React.FC = () => {
  useThemedColors();
  const route = useRoute<Rt>();
  const nav = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);

  const [event, setEvent] = useState<Event | null>(null);
  const [title, setTitle] = useState('');
  const [sport, setSport] = useState<SportId>('soccer');
  const [location, setLocation] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [playersPerTeam, setPlayersPerTeam] = useState('5');
  const [teamsCount, setTeamsCount] = useState('2');
  const [balanceByAge, setBalanceByAge] = useState(false);
  const [balanceByHeight, setBalanceByHeight] = useState(false);
  const [balanceByWeight, setBalanceByWeight] = useState(false);
  const [notes, setNotes] = useState('');
  const [friends, setFriends] = useState<User[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [friendQuery, setFriendQuery] = useState('');
  const [friendsPage, setFriendsPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const FRIENDS_PAGE_SIZE = 30;

  useEffect(() => {
    (async () => {
      const e = await getEventById(route.params.eventId);
      if (!e) return;
      setEvent(e);
      setTitle(e.title);
      setSport(e.sport);
      setLocation(e.location);
      const { date, time } = splitDateTime(e.scheduledAt);
      setDateStr(date);
      setTimeStr(time);
      setPlayersPerTeam(String(e.playersPerTeam));
      setTeamsCount(String(e.teamsCount));
      setBalanceByAge(e.balanceByAge);
      setBalanceByHeight(e.balanceByHeight);
      setBalanceByWeight(e.balanceByWeight ?? false);
      setNotes(e.notes ?? '');
      setSelected(new Set(e.invitedUserIds));
    })();
  }, [route.params.eventId]);

  useEffect(() => {
    if (!user) return;
    listFriends(user.id).then(setFriends).catch(console.error);
  }, [user]);

  const filteredFriends = useMemo(() => {
    const q = friendQuery.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter(
      (f) => f.name.toLowerCase().includes(q) || f.email.toLowerCase().includes(q),
    );
  }, [friends, friendQuery]);

  const visibleFriends = useMemo(
    () => filteredFriends.slice(0, friendsPage * FRIENDS_PAGE_SIZE),
    [filteredFriends, friendsPage],
  );
  const hasMoreFriends = visibleFriends.length < filteredFriends.length;

  const toggleFriend = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const onSave = async () => {
    setError(null);
    if (!event || !user) return;
    if (event.organizerId !== user.id) return setError('Apenas o organizador pode editar');
    if (!title.trim()) return setError('Informe um título');
    if (!location.trim()) return setError('Informe o local');
    if (!dateStr || !timeStr) return setError('Informe data e horário');

    const scheduledAt = new Date(`${dateStr}T${timeStr}:00`);
    if (Number.isNaN(scheduledAt.getTime())) return setError('Data/horário inválidos');

    setLoading(true);
    try {
      // Detecta novos convidados pra disparar notificação só pra eles
      const newInvitedIds = Array.from(selected).filter((id) => !event.invitedUserIds.includes(id));

      // Atualiza confirmações: mantém as existentes; novos = pending
      const newConfirmations = { ...(event.confirmations ?? {}) };
      for (const id of newInvitedIds) newConfirmations[id] = 'pending';
      // Remove confirmações de quem foi removido da lista
      for (const id of Object.keys(newConfirmations)) {
        if (id !== event.organizerId && !selected.has(id)) {
          delete newConfirmations[id];
        }
      }

      await updateEvent(event.id, {
        title: title.trim(),
        sport,
        location: location.trim(),
        scheduledAt: Timestamp.fromDate(scheduledAt) as unknown as Date,
        playersPerTeam: parseInt(playersPerTeam, 10) || 5,
        teamsCount: parseInt(teamsCount, 10) || 2,
        balanceByAge,
        balanceByHeight,
        balanceByWeight,
        invitedUserIds: Array.from(selected),
        confirmations: newConfirmations,
        notes: notes.trim() || undefined,
      });

      // Notifica novos convidados sobre o convite e os antigos sobre a atualização
      await Promise.all([
        ...newInvitedIds.map((uid) =>
          notifySafe(
            uid,
            'event_invite',
            `Convite: ${title.trim()}`,
            `${user.name} convidou você para um jogo em ${location.trim()}`,
            event.id,
          ),
        ),
        ...event.invitedUserIds
          .filter((uid) => selected.has(uid))
          .map((uid) =>
            notifySafe(
              uid,
              'event_updated',
              `Evento atualizado: ${title.trim()}`,
              `O evento foi editado pelo organizador`,
              event.id,
            ),
          ),
      ]);

      nav.goBack();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    label: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    sport: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      marginRight: 8,
      minWidth: 78,
    },
    sportSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    sportEmoji: { fontSize: 24 },
    sportLabel: { fontSize: 12, fontWeight: '700', color: colors.text, marginTop: 4 },
    row: { flexDirection: 'row', gap: spacing.md },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
    },
    toggleTxt: { fontSize: 15, color: colors.text },
    toggle: {
      width: 28,
      height: 28,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    toggleOn: { backgroundColor: colors.primary, borderColor: colors.primary },
    toggleCheck: { color: colors.white, fontWeight: '900' },
    friend: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.sm,
    },
    friendSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.surfaceVariant,
    },
    friendName: { fontSize: 15, fontWeight: '700', color: colors.text },
    friendEmail: { fontSize: 12, color: colors.textSecondary },
    error: { color: colors.danger, marginBottom: spacing.md, textAlign: 'center' },
    loadMoreBtn: {
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginVertical: spacing.sm,
      backgroundColor: colors.surfaceVariant,
      borderRadius: radius.md,
    },
    loadMoreTxt: { fontSize: 13, fontWeight: '700', color: colors.primary },
    totalTxt: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'center',
      marginVertical: spacing.sm,
    },
  });

  if (!event) {
    return (
      <Screen maxWidth={720}>
        <Header title="Carregando..." onBack={() => nav.goBack()} />
      </Screen>
    );
  }

  return (
    <Screen maxWidth={720}>
      <Header title="Editar evento" onBack={() => nav.goBack()} subtitle={event.title} />

      <Text style={styles.label}>Esporte</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
        {SPORTS.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => setSport(s.id)}
            style={[styles.sport, sport === s.id && styles.sportSelected]}
          >
            <Text style={styles.sportEmoji}>{s.emoji}</Text>
            <Text style={[styles.sportLabel, sport === s.id && { color: colors.white }]}>
              {s.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Input label="Título do evento" value={title} onChangeText={setTitle} />
      <Input label="Local" value={location} onChangeText={setLocation} />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <DateInput label="Data" value={dateStr} onChangeText={setDateStr} mode="event" />
        </View>
        <View style={{ flex: 1 }}>
          <TimeInput label="Horário" value={timeStr} onChangeText={setTimeStr} />
        </View>
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Input label="Jog./time" value={playersPerTeam} onChangeText={setPlayersPerTeam} keyboardType="numeric" />
        </View>
        <View style={{ flex: 1 }}>
          <Input label="Qtd. times" value={teamsCount} onChangeText={setTeamsCount} keyboardType="numeric" />
        </View>
      </View>

      <Card style={{ marginBottom: spacing.md }}>
        <Text style={styles.label}>Equilibrar também por:</Text>
        <Pressable onPress={() => setBalanceByAge((v) => !v)} style={[styles.toggleRow, { marginTop: spacing.sm }]}>
          <Text style={styles.toggleTxt}>👶  Idade</Text>
          <View style={[styles.toggle, balanceByAge && styles.toggleOn]}>
            {balanceByAge ? <Text style={styles.toggleCheck}>✓</Text> : null}
          </View>
        </Pressable>
        <Pressable onPress={() => setBalanceByHeight((v) => !v)} style={styles.toggleRow}>
          <Text style={styles.toggleTxt}>📏  Altura</Text>
          <View style={[styles.toggle, balanceByHeight && styles.toggleOn]}>
            {balanceByHeight ? <Text style={styles.toggleCheck}>✓</Text> : null}
          </View>
        </Pressable>
        <Pressable onPress={() => setBalanceByWeight((v) => !v)} style={styles.toggleRow}>
          <Text style={styles.toggleTxt}>⚖️  Peso (privado)</Text>
          <View style={[styles.toggle, balanceByWeight && styles.toggleOn]}>
            {balanceByWeight ? <Text style={styles.toggleCheck}>✓</Text> : null}
          </View>
        </Pressable>
      </Card>

      <Text style={styles.label}>Convidados ({selected.size} selecionados)</Text>
      {friends.length === 0 ? (
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
            Você ainda não tem amigos cadastrados.
          </Text>
        </Card>
      ) : (
        <>
          <Input
            value={friendQuery}
            onChangeText={(t) => {
              setFriendQuery(t);
              setFriendsPage(1);
            }}
            placeholder="Buscar amigo por nome ou email"
          />
          {visibleFriends.map((f) => {
            const isSel = selected.has(f.id);
            return (
              <Pressable
                key={f.id}
                onPress={() => toggleFriend(f.id)}
                style={[styles.friend, isSel && styles.friendSelected]}
              >
                <Avatar name={f.name} photoURL={f.photoURL} size={40} />
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.friendName}>{f.name}</Text>
                  <Text style={styles.friendEmail}>{f.email}</Text>
                </View>
                <View style={[styles.toggle, isSel && styles.toggleOn]}>
                  {isSel ? <Text style={styles.toggleCheck}>✓</Text> : null}
                </View>
              </Pressable>
            );
          })}
          {hasMoreFriends ? (
            <Pressable onPress={() => setFriendsPage((p) => p + 1)} style={styles.loadMoreBtn}>
              <Text style={styles.loadMoreTxt}>
                Carregar mais ({filteredFriends.length - visibleFriends.length} restantes)
              </Text>
            </Pressable>
          ) : (
            <Text style={styles.totalTxt}>
              {filteredFriends.length} {filteredFriends.length === 1 ? 'amigo' : 'amigos'}
            </Text>
          )}
        </>
      )}

      <Input label="Observações" value={notes} onChangeText={setNotes} multiline numberOfLines={3} />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Salvar alterações" onPress={onSave} loading={loading} />
      <View style={{ height: spacing.xxl }} />
    </Screen>
  );
};
