import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  HtmlScreen,
  HtmlHeader,
  HtmlEventForm,
  HtmlEventFormValues,
} from '../../components/web';
import { listFriends } from '../../services/friendsService';
import { createEvent } from '../../services/eventService';
import { formatError } from '../../utils/errorMessages';
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
  }, [user?.id]);

  const handleSubmit = async (values: HtmlEventFormValues) => {
    if (!user) return;
    if (values.invitedUserIds.length < 1) {
      setError('Convide pelo menos 1 jogador.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const eventId = await createEvent({
        organizer: user,
        title: values.title,
        sport: values.sport,
        location: values.locationName,
        locationDetails:
          values.locationLat !== 0 && values.locationLng !== 0
            ? {
                address: values.locationAddress,
                lat: values.locationLat,
                lng: values.locationLng,
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
      setError(formatError(e, 'Não conseguimos criar o evento agora. Tente de novo.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <HtmlScreen maxWidth={720}>
      <HtmlHeader title="Novo evento" onBack={() => nav.goBack()} />
      <HtmlEventForm
        submitLabel="Criar evento"
        syncSportDefaults
        friends={friends}
        submitting={loading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={() => nav.popToTop()}
      />
    </HtmlScreen>
  );
};
