import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Card, Avatar, Button, StarRating } from '../../components';
import { colors, spacing, radius } from '../../constants/theme';
import { getEventById, listEventRatings } from '../../services/eventService';
import { getUsersByIds } from '../../services/userService';
import { useAuthStore } from '../../store';
import { DrawnTeam, Event, User } from '../../types';
import type { EventsStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<EventsStackParamList, 'DrawResult'>;
type Rt = RouteProp<EventsStackParamList, 'DrawResult'>;

export const DrawResultScreen: React.FC = () => {
  const route = useRoute<Rt>();
  const nav = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const [event, setEvent] = useState<Event | null>(null);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [ratings, setRatings] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    const e = await getEventById(route.params.eventId);
    setEvent(e);
    if (e?.teams) {
      const ids = e.teams.flatMap((t) => t.playerIds);
      const us = await getUsersByIds(ids);
      const map: Record<string, User> = {};
      for (const u of us) map[u.id] = u;
      setUsers(map);
      const r = await listEventRatings(e.id);
      const rmap: Record<string, number> = {};
      for (const x of r) rmap[x.playerUserId] = x.stars;
      setRatings(rmap);
    }
  }, [route.params.eventId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!event || !event.teams) {
    return (
      <Screen>
        <Header title="Carregando..." onBack={() => nav.goBack()} />
      </Screen>
    );
  }

  const isOrganizer = event.organizerId === user?.id;

  return (
    <Screen maxWidth={840}>
      <Header title="Times sorteados" onBack={() => nav.goBack()} subtitle={event.title} />

      {event.teams.map((t, idx) => (
        <TeamCard key={idx} team={t} users={users} ratings={ratings} />
      ))}

      {isOrganizer ? (
        <View style={{ marginTop: spacing.lg }}>
          <Button title="🎲 Sortear novamente" onPress={() => nav.navigate('RatePlayers', { eventId: event.id })} />
        </View>
      ) : null}
      <View style={{ height: spacing.xxl }} />
    </Screen>
  );
};

const TeamCard: React.FC<{ team: DrawnTeam; users: Record<string, User>; ratings: Record<string, number> }> = ({
  team,
  users,
  ratings,
}) => {
  const avg = team.playerIds.length ? team.totalStars / team.playerIds.length : 0;
  return (
    <Card style={[styles.card, { borderColor: team.color }]}>
      <View style={[styles.headerStrip, { backgroundColor: team.color }]}>
        <Text style={styles.headerTxt}>{team.name}</Text>
        <Text style={styles.headerStars}>⭐ {team.totalStars.toFixed(1)} • média {avg.toFixed(1)}</Text>
      </View>
      <View style={{ paddingTop: spacing.sm }}>
        {team.playerIds.map((id) => {
          const u = users[id];
          if (!u) return null;
          return (
            <View key={id} style={styles.row}>
              <Avatar name={u.name} photoURL={u.photoURL} size={36} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{u.name}</Text>
                <StarRating value={ratings[id] ?? 0} size={14} />
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
    borderWidth: 2,
    overflow: 'hidden',
    paddingTop: 0,
    paddingHorizontal: 0,
  },
  headerStrip: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  headerTxt: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '900',
  },
  headerStars: {
    color: colors.white,
    opacity: 0.95,
    fontSize: 13,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
});
