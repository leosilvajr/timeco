import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Input, Button, Card, Avatar, DateInput, TimeInput, LocationPicker, SelectedLocation } from '../../components';
import { SPORTS, getSport } from '../../constants/sports';
import { colors, radius, spacing } from '../../constants/theme';
import { listFriends } from '../../services/friendsService';
import { createEvent } from '../../services/eventService';
import { useAuthStore, useThemedColors } from '../../store';
import { SportId, User } from '../../types';
import type { EventsStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<EventsStackParamList, 'CreateEvent'>;

const pad = (n: number) => String(n).padStart(2, '0');

export const CreateEventScreen: React.FC = () => {
  useThemedColors();
  const nav = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);

  const [title, setTitle] = useState('');
  const [sport, setSport] = useState<SportId>('soccer');
  const [location, setLocation] = useState<SelectedLocation | null>(null);
  const now = new Date();
  const defaultDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 19, 0, 0);
  const [dateStr, setDateStr] = useState(
    `${defaultDate.getFullYear()}-${pad(defaultDate.getMonth() + 1)}-${pad(defaultDate.getDate())}`
  );
  const [timeStr, setTimeStr] = useState(`${pad(defaultDate.getHours())}:${pad(defaultDate.getMinutes())}`);
  const [playersPerTeam, setPlayersPerTeam] = useState('5');
  const [teamsCount, setTeamsCount] = useState('2');
  const [balanceByAge, setBalanceByAge] = useState(false);
  const [balanceByHeight, setBalanceByHeight] = useState(false);
  const [balanceByWeight, setBalanceByWeight] = useState(false);
  const [notes, setNotes] = useState('');
  const [friends, setFriends] = useState<User[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [friendQuery, setFriendQuery] = useState('');
  const [friendsPage, setFriendsPage] = useState(1);

  const FRIENDS_PAGE_SIZE = 30;

  const filteredFriends = useMemo(() => {
    const q = friendQuery.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter(
      (f) =>
        f.name.toLowerCase().includes(q) || f.email.toLowerCase().includes(q),
    );
  }, [friends, friendQuery]);

  const visibleFriends = useMemo(
    () => filteredFriends.slice(0, friendsPage * FRIENDS_PAGE_SIZE),
    [filteredFriends, friendsPage],
  );

  const hasMoreFriends = visibleFriends.length < filteredFriends.length;

  useEffect(() => {
    const cfg = getSport(sport);
    setPlayersPerTeam(String(cfg.defaultPlayersPerTeam));
    setTeamsCount(String(cfg.defaultTeamsCount));
    setBalanceByAge(cfg.usesAgeBalance);
    setBalanceByHeight(cfg.usesHeightBalance);
    setBalanceByWeight(cfg.usesWeightBalance ?? false);
  }, [sport]);

  useEffect(() => {
    if (!user) return;
    listFriends(user.id).then(setFriends).catch(console.error);
  }, [user]);

  const toggleFriend = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const onSubmit = async () => {
    setError(null);
    if (!user) return;
    if (!title.trim()) return setError('Informe um título');
    if (!location || !location.name.trim()) return setError('Informe o local');
    if (!dateStr || !timeStr) return setError('Informe data e horário');
    // Mínimo 1 amigo convidado: organizador + 1 oponente = evento 1v1.
    if (selected.size < 1) return setError('Convide pelo menos 1 jogador');

    const scheduledAt = new Date(`${dateStr}T${timeStr}:00`);
    if (Number.isNaN(scheduledAt.getTime())) return setError('Data/horário inválidos');

    setLoading(true);
    try {
      const eventId = await createEvent({
        organizer: user,
        title: title.trim(),
        sport,
        location: location.name.trim(),
        locationDetails:
          location.lat !== 0 && location.lng !== 0
            ? { address: location.address, lat: location.lat, lng: location.lng }
            : undefined,
        scheduledAt,
        playersPerTeam: parseInt(playersPerTeam, 10) || 5,
        teamsCount: parseInt(teamsCount, 10) || 2,
        balanceByAge,
        balanceByHeight,
        balanceByWeight,
        invitedUserIds: Array.from(selected),
        notes: notes.trim() || undefined,
      });
      nav.replace('EventDetail', { eventId });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao criar evento');
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
    sportSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    sportEmoji: {
      fontSize: 24,
    },
    sportLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
      marginTop: 4,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
    },
    toggleTxt: {
      fontSize: 15,
      color: colors.text,
    },
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
    toggleOn: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    toggleCheck: {
      color: colors.white,
      fontWeight: '900',
    },
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
    friendName: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    friendEmail: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    error: {
      color: colors.danger,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    loadMoreBtn: {
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginVertical: spacing.sm,
      backgroundColor: colors.surfaceVariant,
      borderRadius: radius.md,
    },
    loadMoreTxt: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.primary,
    },
    totalTxt: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'center',
      marginVertical: spacing.sm,
    },
  });

  return (
    <Screen maxWidth={720}>
      <Header title="Novo evento" onBack={() => nav.goBack()} />

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

      <Input label="Título do evento" value={title} onChangeText={setTitle} placeholder="Pelada de quarta" />
      <LocationPicker
        label="Local"
        value={location}
        onChange={setLocation}
        placeholder="Quadra do bairro, arena, estabelecimento..."
        hint="Digite o nome ou endereço — selecione no mapa pra abrir no Google Maps depois"
      />

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
        <Pressable
          onPress={() => setBalanceByAge((v) => !v)}
          style={[styles.toggleRow, { marginTop: spacing.sm }]}
        >
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

      <Text style={styles.label}>Convidar amigos ({selected.size} selecionados)</Text>
      {friends.length === 0 ? (
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
            Você ainda não tem amigos. Adicione amigos na aba Social para poder convidá-los.
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
          {filteredFriends.length === 0 ? (
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginVertical: spacing.md }}>
              Nenhum amigo encontrado.
            </Text>
          ) : (
            <>
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
                <Pressable
                  onPress={() => setFriendsPage((p) => p + 1)}
                  style={styles.loadMoreBtn}
                >
                  <Text style={styles.loadMoreTxt}>
                    Carregar mais ({filteredFriends.length - visibleFriends.length} restantes)
                  </Text>
                </Pressable>
              ) : (
                <Text style={styles.totalTxt}>
                  {filteredFriends.length} {filteredFriends.length === 1 ? 'amigo' : 'amigos'}
                  {friendQuery ? ' encontrado' + (filteredFriends.length === 1 ? '' : 's') : ''}
                </Text>
              )}
            </>
          )}
        </>
      )}

      <Input label="Observações (opcional)" value={notes} onChangeText={setNotes} multiline numberOfLines={3} />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Criar evento" onPress={onSubmit} loading={loading} />
      <View style={{ height: spacing.xxl }} />
    </Screen>
  );
};
