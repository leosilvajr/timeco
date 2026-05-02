import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, EventForm, EventFormValues } from '../../components';
import { listFriends } from '../../services/friendsService';
import { createEvent } from '../../services/eventService';
import { useAuthStore, useThemedColors } from '../../store';
import { User } from '../../types';
import type { EventsStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<EventsStackParamList, 'CreateEvent'>;

export const CreateEventScreen: React.FC = () => {
  useThemedColors();
  const nav = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);

  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    listFriends(user.id).then(setFriends).catch(console.error);
  }, [user]);

  const handleSubmit = async (values: EventFormValues) => {
    if (!user) return;
    if (values.invitedUserIds.length < 1) {
      setError('Convide pelo menos 1 jogador');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const eventId = await createEvent({
        organizer: user,
        title: values.title,
        sport: values.sport,
        location: values.location.name,
        locationDetails:
          values.location.lat !== 0 && values.location.lng !== 0
            ? {
                address: values.location.address,
                lat: values.location.lat,
                lng: values.location.lng,
              }
            : undefined,
        scheduledAt: new Date(`${values.dateStr}T${values.timeStr}:00`),
        playersPerTeam: values.playersPerTeam,
        teamsCount: values.teamsCount,
        balanceByAge: values.balanceByAge,
        balanceByHeight: values.balanceByHeight,
        balanceByWeight: values.balanceByWeight,
        invitedUserIds: values.invitedUserIds,
        notes: values.notes,
      });
      nav.replace('EventDetail', { eventId });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao criar evento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen maxWidth={720}>
      <Header title="Novo evento" onBack={() => nav.goBack()} />
      <EventForm
        submitLabel="Criar evento"
        syncSportDefaults
        friends={friends}
        submitting={loading}
        error={error}
        onSubmit={handleSubmit}
      />
    </Screen>
  );
};
