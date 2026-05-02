import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Card, Button, Avatar, StarRating } from '../../components';
import { colors, spacing } from '../../constants/theme';
import { useAuthStore, useThemedColors } from '../../store';
import {
  getEventById,
  listEventRatings,
  setPlayerRating,
  saveDrawnTeams,
} from '../../services/eventService';
import { getUsersByIds } from '../../services/userService';
import { drawTeams } from '../../services/teamDrawService';
import { Event, User } from '../../types';
import type { EventsStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<EventsStackParamList, 'RatePlayers'>;
type Rt = RouteProp<EventsStackParamList, 'RatePlayers'>;

export const RatePlayersScreen: React.FC = () => {
  useThemedColors();
  const route = useRoute<Rt>();
  const nav = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const [event, setEvent] = useState<Event | null>(null);
  const [players, setPlayers] = useState<User[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const e = await getEventById(route.params.eventId);
    if (!e) return;
    setEvent(e);
    // Inclui organizador na lista de candidatos (sem duplicar caso já esteja em invitedUserIds)
    const allCandidateIds = [e.organizerId, ...e.invitedUserIds.filter((id) => id !== e.organizerId)];
    const confirmedIds = allCandidateIds.filter((id) => e.confirmations?.[id] === 'confirmed');
    // Se ninguém confirmou, fallback: todos os convidados + organizador (pra estimar antes)
    const candidateIds = confirmedIds.length > 0 ? confirmedIds : allCandidateIds;
    const us = await getUsersByIds(candidateIds);
    setPlayers(us);
    const existingRatings = await listEventRatings(e.id);
    const map: Record<string, number> = {};
    for (const r of existingRatings) map[r.playerUserId] = r.stars;
    // default 3 stars se nada salvo
    for (const u of us) if (map[u.id] == null) map[u.id] = 3;
    setRatings(map);
    setLoading(false);
  }, [route.params.eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const setStars = async (uid: string, stars: number) => {
    setRatings((prev) => ({ ...prev, [uid]: stars }));
    if (event && user) {
      try {
        await setPlayerRating(event.id, uid, stars, user.id);
      } catch (e) {
        console.warn('rate save', e);
      }
    }
  };

  const onDraw = async () => {
    setError(null);
    if (!event) return;
    if (players.length < event.teamsCount) {
      setError(`Precisa de pelo menos ${event.teamsCount} jogadores`);
      return;
    }
    setDrawing(true);
    try {
      const teams = drawTeams({
        players: players.map((u) => ({ user: u, stars: ratings[u.id] ?? 3 })),
        teamsCount: event.teamsCount,
        balanceByAge: event.balanceByAge,
        balanceByHeight: event.balanceByHeight,
        balanceByWeight: event.balanceByWeight ?? false,
      });
      await saveDrawnTeams(event.id, teams);
      nav.replace('DrawResult', { eventId: event.id });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao sortear');
    } finally {
      setDrawing(false);
    }
  };

  const styles = StyleSheet.create({
    info: {
      backgroundColor: colors.surfaceVariant,
      marginBottom: spacing.md,
    },
    infoTxt: {
      fontSize: 13,
      color: colors.text,
      lineHeight: 19,
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
    error: {
      color: colors.danger,
      marginVertical: spacing.md,
      textAlign: 'center',
    },
  });

  if (loading || !event) {
    return (
      <Screen>
        <Header title="Carregando..." onBack={() => nav.goBack()} />
      </Screen>
    );
  }

  return (
    <Screen maxWidth={720}>
      <Header title="Definir estrelas" onBack={() => nav.goBack()} subtitle={event.title} />

      <Card style={styles.info}>
        <Text style={styles.infoTxt}>
          Como organizador, você define o nível de cada jogador (1 a 5 estrelas). Use isso como base
          pro sorteio equilibrado.
        </Text>
      </Card>

      {players.length === 0 ? (
        <Card>
          <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
            Ninguém confirmou e o evento não tem convidados pra avaliar.
          </Text>
        </Card>
      ) : (
        players.map((p) => (
          <Card key={p.id} style={styles.row}>
            <Avatar name={p.name} photoURL={p.photoURL} size={42} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{p.name}</Text>
              <View style={{ marginTop: 4 }}>
                <StarRating value={ratings[p.id] ?? 3} editable size={28} onChange={(v) => setStars(p.id, v)} />
              </View>
            </View>
          </Card>
        ))
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={{ marginTop: spacing.lg }}>
        <Button title="🎲 Sortear times" onPress={onDraw} loading={drawing} />
      </View>
      <View style={{ height: spacing.xxl }} />
    </Screen>
  );
};
