import React, { useMemo } from 'react';
import { Text, StyleSheet, Pressable, Linking } from 'react-native';
import { Card } from '../../../components';
import { ColorPalette, spacing, radius } from '../../../constants/theme';
import { useThemedColors } from '../../../store';
import { Event } from '../../../types';
import { googleMapsUrl } from '../../../services/locationService';
import { Timestamp } from 'firebase/firestore';

interface Props {
  event: Event;
}

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

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.primary,
      borderColor: c.primary,
      marginBottom: spacing.lg,
    },
    dateBig: {
      fontSize: 18,
      fontWeight: '800',
      color: c.white,
      textTransform: 'capitalize',
    },
    location: { fontSize: 15, color: c.white, marginTop: 6 },
    organizer: { fontSize: 13, color: c.white, opacity: 0.9, marginTop: 8 },
    notes: { fontSize: 13, color: c.white, opacity: 0.9, marginTop: 6 },
    mapsBtn: {
      alignSelf: 'flex-start',
      marginTop: 8,
      paddingVertical: 6,
      paddingHorizontal: 12,
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderRadius: radius.md,
    },
    mapsTxt: { color: c.white, fontSize: 13, fontWeight: '700' },
  });

/**
 * Card hero do evento com data, local (com link Google Maps), organizador
 * e notas. Cores fixas (primary background) por design.
 */
export const EventHero: React.FC<Props> = ({ event }) => {
  const c = useThemedColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <Card style={styles.card}>
      <Text style={styles.dateBig}>{formatDate(event.scheduledAt)}</Text>
      <Text style={styles.location}>📍 {event.location}</Text>
      {event.locationDetails ? (
        <Pressable
          onPress={() =>
            Linking.openURL(
              googleMapsUrl({
                lat: event.locationDetails!.lat,
                lng: event.locationDetails!.lng,
                name: event.location,
              }),
            )
          }
          style={styles.mapsBtn}
        >
          <Text style={styles.mapsTxt}>🗺️  Abrir no Google Maps</Text>
        </Pressable>
      ) : null}
      <Text style={styles.organizer}>👑 Organizador: {event.organizerName}</Text>
      {event.notes ? <Text style={styles.notes}>📝 {event.notes}</Text> : null}
    </Card>
  );
};
