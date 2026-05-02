import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'react-native';
import { Screen, Header, Card, Button, Avatar, PhotoLightbox } from '../../components';
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
import { googleMapsUrl } from '../../services/locationService';
import {
  addPhotoToEvent,
  listEventPhotos,
  removeEventPhoto,
} from '../../services/eventGalleryService';
import { useAuthStore, useThemedColors } from '../../store';
import type { EventsStackParamList } from '../../navigation/types';
import { Timestamp } from 'firebase/firestore';
import { EventPhoto } from '../../types';

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

const PlayerRow: React.FC<{ u?: User }> = ({ u }) => {
  useThemedColors();
  const styles = StyleSheet.create({
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
  if (!u) return null;
  return (
    <View style={styles.playerRow}>
      <Avatar name={u.name} photoURL={u.photoURL} size={36} />
      <Text style={styles.playerName}>{u.name}</Text>
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
  const [photos, setPhotos] = useState<EventPhoto[]>([]);
  const [lightboxPhoto, setLightboxPhoto] = useState<EventPhoto | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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
    mapsBtn: {
      alignSelf: 'flex-start',
      marginTop: 8,
      paddingVertical: 6,
      paddingHorizontal: 12,
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderRadius: radius.md,
    },
    mapsTxt: {
      color: colors.white,
      fontSize: 13,
      fontWeight: '700',
    },
    galleryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 6,
    },
    galleryThumb: {
      width: 92,
      height: 92,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceVariant,
    },
    galleryThumbWrap: {
      position: 'relative',
    },
    galleryRemove: {
      position: 'absolute',
      top: 2,
      right: 2,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: 'rgba(0,0,0,0.6)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    galleryRemoveTxt: {
      color: colors.white,
      fontSize: 14,
      fontWeight: '900',
    },
    addPhotoBtn: {
      width: 92,
      height: 92,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceVariant,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    addPhotoTxt: { fontSize: 26, color: colors.primary, fontWeight: '900', lineHeight: 28 },
    addPhotoLabel: { fontSize: 10, fontWeight: '700', color: colors.primary },
    confirmCard: {
      marginBottom: spacing.lg,
    },
    confirmTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    confirmSub: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
      lineHeight: 17,
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
  });

  const load = useCallback(async () => {
    const e = await getEventById(route.params.eventId);
    setEvent(e);
    if (e) {
      const all = await getUsersByIds([e.organizerId, ...e.invitedUserIds]);
      const map: Record<string, User> = {};
      for (const u of all) map[u.id] = u;
      setUsers(map);
      try {
        const ps = await listEventPhotos(e.id);
        setPhotos(ps);
      } catch (err) {
        console.warn('listEventPhotos', err);
      }
    }
  }, [route.params.eventId]);

  const onPickPhoto = async (file: File) => {
    if (!event || !user) return;
    setUploadingPhoto(true);
    try {
      const photo = await addPhotoToEvent(event.id, user.id, user.name, file);
      setPhotos((prev) => [photo, ...prev]);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const onRemovePhoto = async (photo: EventPhoto) => {
    if (!event || !user) return;
    if (photo.uploaderId !== user.id && event.organizerId !== user.id) return;
    const ok = typeof window !== 'undefined' ? window.confirm('Apagar esta foto?') : true;
    if (!ok) return;
    await removeEventPhoto(event.id, photo.id, photo.storagePath);
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
  };

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

  // Lista de pessoas a serem mostradas em cada status. Inclui o organizador
  // (se ele se confirmou) — assim o próprio criador aparece na escalação.
  const allParticipantIds = [event.organizerId, ...event.invitedUserIds.filter((id) => id !== event.organizerId)];
  const confirmed = allParticipantIds.filter((id) => event.confirmations?.[id] === 'confirmed');
  const declined = allParticipantIds.filter((id) => event.confirmations?.[id] === 'declined');
  const pending = allParticipantIds.filter((id) => (event.confirmations?.[id] ?? 'pending') === 'pending');

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
      <Header title={event.title} onBack={() => nav.goBack()} subtitle={`${sport.emoji} ${sport.label}`} />

      <Card style={styles.heroCard}>
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

      {event.status === 'open' || event.status === 'teams_drawn' ? (
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
          <Button
            title="✏️ Editar evento"
            variant="outline"
            onPress={() => nav.navigate('EditEvent', { eventId: event.id })}
          />
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

      <Text style={styles.section}>📸 Galeria ({photos.length})</Text>
      {photos.length === 0 && !canParticipate(event, user) ? (
        <Text style={styles.emptyTxt}>Nenhuma foto ainda.</Text>
      ) : null}
      <View style={styles.galleryGrid}>
        {photos.map((p) => (
          <View key={p.id} style={styles.galleryThumbWrap}>
            <Pressable onPress={() => setLightboxPhoto(p)}>
              <Image source={{ uri: p.url }} style={styles.galleryThumb} />
            </Pressable>
            {p.uploaderId === user.id || isOrganizer ? (
              <Pressable style={styles.galleryRemove} onPress={() => onRemovePhoto(p)}>
                <Text style={styles.galleryRemoveTxt}>×</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
        {canParticipate(event, user) ? (
          <PhotoPickerThumb
            uploading={uploadingPhoto}
            onPick={onPickPhoto}
            styles={styles}
          />
        ) : null}
      </View>

      {lightboxPhoto ? (
        <PhotoLightbox
          visible={!!lightboxPhoto}
          url={lightboxPhoto.url}
          caption={`Foto de ${lightboxPhoto.uploaderName}`}
          onClose={() => setLightboxPhoto(null)}
        />
      ) : null}

      <View style={{ height: spacing.xxl }} />
    </Screen>
  );
};

const canParticipate = (event: Event, user: User): boolean => {
  return (
    event.organizerId === user.id ||
    event.invitedUserIds.includes(user.id) ||
    event.confirmations?.[user.id] === 'confirmed'
  );
};

interface PhotoPickerThumbProps {
  uploading: boolean;
  onPick: (file: File) => Promise<void>;
  styles: ReturnType<typeof StyleSheet.create>;
}

const PhotoPickerThumb: React.FC<PhotoPickerThumbProps> = ({ uploading, onPick, styles }) => {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const trigger = () => {
    if (typeof window !== 'undefined' && inputRef.current) {
      inputRef.current.click();
    }
  };
  const onChange = async (e: { target: { files: FileList | null } }) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await onPick(file);
    } catch (err) {
      console.error('upload photo', err);
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };
  return (
    <Pressable style={styles.addPhotoBtn} onPress={trigger} disabled={uploading}>
      <Text style={styles.addPhotoTxt}>+</Text>
      <Text style={styles.addPhotoLabel}>{uploading ? 'Enviando...' : 'Foto'}</Text>
      {typeof window !== 'undefined'
        ? React.createElement('input', {
            ref: inputRef,
            type: 'file',
            accept: 'image/*',
            onChange,
            style: { display: 'none' },
          })
        : null}
    </Pressable>
  );
};
