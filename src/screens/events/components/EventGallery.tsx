import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { PhotoLightbox } from '../../../components';
import { colors, spacing, radius } from '../../../constants/theme';
import { useThemedColors } from '../../../store';
import { EventPhoto, Event, User } from '../../../types';
import {
  addPhotoToEvent,
  listEventPhotos,
  removeEventPhoto,
} from '../../../services/eventGalleryService';
import { pickImage } from '../../../utils/imagePicker';

interface Props {
  event: Event;
  user: User;
  isOrganizer: boolean;
}

const canParticipate = (event: Event, user: User): boolean =>
  event.organizerId === user.id ||
  event.invitedUserIds.includes(user.id) ||
  event.confirmations?.[user.id] === 'confirmed';

/**
 * Seção de galeria de fotos de um evento. Lista thumbs em grid, abre
 * lightbox ao tocar, permite upload pra participantes e remoção pelo
 * uploader ou pelo organizador.
 */
export const EventGallery: React.FC<Props> = ({ event, user, isOrganizer }) => {
  useThemedColors();
  const [photos, setPhotos] = useState<EventPhoto[]>([]);
  const [lightboxPhoto, setLightboxPhoto] = useState<EventPhoto | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    listEventPhotos(event.id)
      .then(setPhotos)
      .catch((e) => console.warn('listEventPhotos', e));
  }, [event.id]);

  const styles = StyleSheet.create({
    section: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.text,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 6,
    },
    thumbWrap: { position: 'relative' },
    thumb: {
      width: 92,
      height: 92,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceVariant,
    },
    remove: {
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
    removeTxt: { color: colors.white, fontSize: 14, fontWeight: '900' },
    addBtn: {
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
    addTxt: { fontSize: 26, color: colors.primary, fontWeight: '900', lineHeight: 28 },
    addLabel: { fontSize: 10, fontWeight: '700', color: colors.primary },
    empty: { color: colors.textSecondary, fontSize: 13, paddingVertical: 4 },
  });

  const handlePick = async () => {
    if (!user) return;
    try {
      const file = await pickImage();
      if (!file) return;
      setUploading(true);
      const photo = await addPhotoToEvent(event.id, user.id, user.name, file);
      setPhotos((prev) => [photo, ...prev]);
    } catch (err) {
      console.error('upload photo', err);
    } finally {
      setUploading(false);
    }
  };

  const onRemove = async (photo: EventPhoto) => {
    if (photo.uploaderId !== user.id && !isOrganizer) return;
    const ok = typeof window !== 'undefined' ? window.confirm('Apagar esta foto?') : true;
    if (!ok) return;
    await removeEventPhoto(event.id, photo.id, photo.storagePath);
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
  };

  const userCanParticipate = canParticipate(event, user);

  return (
    <>
      <Text style={styles.section}>📸 Galeria ({photos.length})</Text>
      {photos.length === 0 && !userCanParticipate ? (
        <Text style={styles.empty}>Nenhuma foto ainda.</Text>
      ) : null}
      <View style={styles.grid}>
        {photos.map((p) => (
          <View key={p.id} style={styles.thumbWrap}>
            <Pressable onPress={() => setLightboxPhoto(p)}>
              <Image source={{ uri: p.url }} style={styles.thumb} />
            </Pressable>
            {p.uploaderId === user.id || isOrganizer ? (
              <Pressable style={styles.remove} onPress={() => onRemove(p)}>
                <Text style={styles.removeTxt}>×</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
        {userCanParticipate ? (
          <Pressable style={styles.addBtn} onPress={handlePick} disabled={uploading}>
            <Text style={styles.addTxt}>+</Text>
            <Text style={styles.addLabel}>{uploading ? 'Enviando...' : 'Foto'}</Text>
          </Pressable>
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
    </>
  );
};
