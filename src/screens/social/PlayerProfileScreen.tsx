import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Card, Avatar, Button, PhotoLightbox } from '../../components';
import { colors, spacing, radius } from '../../constants/theme';
import { getUserById } from '../../services/userService';
import { removeFriend, areFriends } from '../../services/friendsService';
import { listPhotosByUser } from '../../services/eventGalleryService';
import { canViewFullProfile, canViewGallery } from '../../services/privacyLogic';
import { useAuthStore, useThemedColors } from '../../store';
import { EventPhoto, User } from '../../types';
import { getSport } from '../../constants/sports';
import type { SocialStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<SocialStackParamList, 'PlayerProfile'>;
type Rt = RouteProp<SocialStackParamList, 'PlayerProfile'>;

const calcAge = (birthDate?: string): number | null => {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
};

export const PlayerProfileScreen: React.FC = () => {
  useThemedColors();
  const route = useRoute<Rt>();
  const nav = useNavigation<Nav>();
  const current = useAuthStore((s) => s.user);
  const [target, setTarget] = useState<User | null>(null);
  const [isFriend, setIsFriend] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [photos, setPhotos] = useState<EventPhoto[]>([]);
  const [galleryPhoto, setGalleryPhoto] = useState<EventPhoto | null>(null);

  useEffect(() => {
    getUserById(route.params.userId).then(setTarget);
    if (current) areFriends(current.id, route.params.userId).then(setIsFriend);
    listPhotosByUser(route.params.userId)
      .then(setPhotos)
      .catch((e) => console.warn('listPhotosByUser', e));
  }, [route.params.userId, current]);

  const onRemove = async () => {
    if (!current || !target) return;
    const ok = typeof window !== 'undefined' ? window.confirm(`Remover ${target.name}?`) : true;
    if (!ok) return;
    await removeFriend(current.id, target.id);
    nav.goBack();
  };

  const styles = StyleSheet.create({
    hero: {
      alignItems: 'center',
      gap: 6,
    },
    name: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
      marginTop: 6,
    },
    email: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    bio: {
      fontSize: 14,
      color: colors.text,
      textAlign: 'center',
      marginTop: 8,
      lineHeight: 20,
      fontStyle: 'italic',
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
    },
    info: {
      fontSize: 15,
      color: colors.text,
      paddingVertical: 6,
    },
    sportsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    sportChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceVariant,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sportChipTxt: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },
    actions: {
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    empty: {
      color: colors.textSecondary,
      textAlign: 'center',
    },
    galleryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    galleryThumb: {
      width: 90,
      height: 90,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceVariant,
    },
  });

  if (!target) {
    return (
      <Screen>
        <Header title="Carregando..." onBack={() => nav.goBack()} />
      </Screen>
    );
  }

  const age = calcAge(target.birthDate);
  const hasInfo = !!(target.heightCm || age !== null || target.phone);
  const hasFavSports = (target.favoriteSports?.length ?? 0) > 0;
  const isSelf = current?.id === target.id;
  const canSeeFullProfile = canViewFullProfile(current, target, isFriend);
  const canSeeGallery = canViewGallery(current, target, isFriend);

  return (
    <Screen maxWidth={600}>
      <Header title="Perfil" onBack={() => nav.goBack()} />

      <Card style={styles.hero}>
        <Pressable
          onPress={() => target.photoURL && setLightboxOpen(true)}
          disabled={!target.photoURL}
        >
          <Avatar name={target.name} photoURL={target.photoURL} size={88} />
        </Pressable>
        <Text style={styles.name}>{target.name}</Text>
        <Text style={styles.email}>{target.email}</Text>
        {target.bio ? <Text style={styles.bio}>"{target.bio}"</Text> : null}
      </Card>

      {target.photoURL ? (
        <PhotoLightbox
          visible={lightboxOpen}
          url={target.photoURL}
          caption={target.name}
          onClose={() => setLightboxOpen(false)}
        />
      ) : null}

      {canSeeFullProfile || isSelf ? (
        <>
          <Card style={{ marginTop: spacing.md }}>
            <Text style={styles.sectionTitle}>Dados</Text>
            {age !== null ? <Text style={styles.info}>🎂 {age} anos</Text> : null}
            {target.heightCm ? <Text style={styles.info}>📏 {target.heightCm} cm</Text> : null}
            {target.phone ? <Text style={styles.info}>📱 {target.phone}</Text> : null}
            {!hasInfo ? <Text style={styles.empty}>Sem informações adicionais</Text> : null}
          </Card>

          {hasFavSports ? (
            <Card style={{ marginTop: spacing.md }}>
              <Text style={styles.sectionTitle}>Esportes favoritos</Text>
              <View style={styles.sportsRow}>
                {target.favoriteSports!.map((sid) => {
                  const cfg = getSport(sid);
                  return (
                    <View key={sid} style={styles.sportChip}>
                      <Text style={{ fontSize: 14 }}>{cfg.emoji}</Text>
                      <Text style={styles.sportChipTxt}>{cfg.label}</Text>
                    </View>
                  );
                })}
              </View>
            </Card>
          ) : null}
        </>
      ) : (
        <Card style={{ marginTop: spacing.md, alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 26 }}>🔒</Text>
          <Text style={[styles.sectionTitle, { textAlign: 'center', marginBottom: 0 }]}>
            Perfil privado
          </Text>
          <Text style={styles.empty}>
            Este usuário só compartilha os detalhes com amigos. Envie uma solicitação pra ver mais.
          </Text>
        </Card>
      )}

      <View style={styles.actions}>
        {isFriend && current ? (
          <Button
            title="💬  Conversar"
            onPress={() =>
              nav.navigate('Chat', { friendId: target.id, friendName: target.name })
            }
          />
        ) : null}
        {isFriend ? (
          <Button title="Remover amizade" variant="outline" onPress={onRemove} />
        ) : null}
      </View>

      {canSeeGallery && photos.length > 0 ? (
        <Card style={{ marginTop: spacing.lg }}>
          <Text style={styles.sectionTitle}>📸 Galeria ({photos.length})</Text>
          <View style={styles.galleryGrid}>
            {photos.map((p) => (
              <Pressable key={p.id} onPress={() => setGalleryPhoto(p)}>
                <Image source={{ uri: p.url }} style={styles.galleryThumb} />
              </Pressable>
            ))}
          </View>
        </Card>
      ) : null}

      {galleryPhoto ? (
        <PhotoLightbox
          visible={!!galleryPhoto}
          url={galleryPhoto.url}
          caption={`Foto de ${galleryPhoto.uploaderName}`}
          onClose={() => setGalleryPhoto(null)}
        />
      ) : null}
    </Screen>
  );
};
