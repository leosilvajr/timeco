import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Card, Avatar, Button, PhotoLightbox } from '../../components';
import { colors, spacing, radius } from '../../constants/theme';
import { useAuthStore, useThemedColors, useUnreadCount } from '../../store';
import { computeProfileCompletion } from '../../hooks/useProfileCompletion';
import { logout } from '../../services/authService';
import { listPhotosByUser } from '../../services/eventGalleryService';
import { EventPhoto } from '../../types';
import type { ProfileStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'ProfileHome'>;

export const ProfileHomeScreen: React.FC = () => {
  useThemedColors();
  const user = useAuthStore((s) => s.user);
  const unread = useUnreadCount();
  const completion = computeProfileCompletion(user);
  const nav = useNavigation<Nav>();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [photos, setPhotos] = useState<EventPhoto[]>([]);
  const [galleryPhoto, setGalleryPhoto] = useState<EventPhoto | null>(null);

  useEffect(() => {
    if (!user) return;
    listPhotosByUser(user.id).then(setPhotos).catch(() => undefined);
  }, [user]);

  if (!user) return null;

  const styles = StyleSheet.create({
    hero: {
      alignItems: 'center',
      gap: 4,
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
    badge: {
      marginTop: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      backgroundColor: colors.secondary,
      color: colors.black,
      fontWeight: '800',
      borderRadius: radius.pill,
      fontSize: 12,
    },
    menuItem: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    menuTxt: {
      fontSize: 15,
      color: colors.text,
      fontWeight: '600',
    },
    menuRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    menuValue: {
      fontSize: 13,
      color: colors.textMuted,
    },
    menuBadge: {
      minWidth: 22,
      height: 22,
      paddingHorizontal: 6,
      borderRadius: 11,
      backgroundColor: colors.danger,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuBadgeTxt: {
      color: colors.white,
      fontSize: 12,
      fontWeight: '800',
    },
    menuChev: {
      fontSize: 22,
      color: colors.textMuted,
    },
    footer: {
      marginTop: spacing.xxl,
      textAlign: 'center',
      color: colors.textMuted,
      fontSize: 12,
    },
    completionBox: {
      width: '100%',
      marginTop: spacing.md,
    },
    completionLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
      marginBottom: 6,
      textAlign: 'center',
    },
    completionTrack: {
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      overflow: 'hidden',
    },
    completionFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 3,
    },
    galleryTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
    },
    galleryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    galleryThumb: {
      width: 88,
      height: 88,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceVariant,
    },
    galleryEmpty: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingVertical: spacing.md,
    },
  });

  const MenuItem: React.FC<{
    label: string;
    value?: string;
    badge?: number;
    onPress: () => void;
  }> = ({ label, value, badge, onPress }) => (
    <Pressable onPress={onPress} style={styles.menuItem}>
      <Text style={styles.menuTxt}>{label}</Text>
      <View style={styles.menuRight}>
        {badge && badge > 0 ? (
          <View style={styles.menuBadge}>
            <Text style={styles.menuBadgeTxt}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        ) : value ? (
          <Text style={styles.menuValue}>{value}</Text>
        ) : null}
        <Text style={styles.menuChev}>›</Text>
      </View>
    </Pressable>
  );

  return (
    <Screen maxWidth={600}>
      <Header title="Perfil" />

      <Card style={styles.hero}>
        <Pressable
          onPress={() => user.photoURL && setLightboxOpen(true)}
          disabled={!user.photoURL}
        >
          <Avatar name={user.name} photoURL={user.photoURL} size={88} />
        </Pressable>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        {user.role === 'superadmin' ? <Text style={styles.badge}>👑 Super admin</Text> : null}
        <View style={styles.completionBox}>
          <Text style={styles.completionLabel}>
            Cadastro {completion.percent}% completo
            {completion.isComplete ? ' ✅' : ''}
          </Text>
          <View style={styles.completionTrack}>
            <View style={[styles.completionFill, { width: `${completion.percent}%` }]} />
          </View>
        </View>
      </Card>

      <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
        <MenuItem
          label="🔔  Notificações"
          badge={unread}
          onPress={() => nav.navigate('Notifications')}
        />
        <MenuItem label="✏️  Editar meus dados" onPress={() => nav.navigate('EditProfile')} />
        <MenuItem label="⚙️  Configurações" onPress={() => nav.navigate('SettingsHome')} />
        <MenuItem label="❓  Ajuda" onPress={() => nav.navigate('HelpHome')} />
        {user.role === 'superadmin' ? (
          <MenuItem label="🛡️  Painel super admin" onPress={() => nav.navigate('SuperAdmin')} />
        ) : null}
      </View>

      <View style={{ marginTop: spacing.xl }}>
        <Button title="Sair" variant="outline" onPress={() => logout()} />
      </View>

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={styles.galleryTitle}>📸 Sua galeria ({photos.length})</Text>
        {photos.length === 0 ? (
          <Text style={styles.galleryEmpty}>
            Suas fotos enviadas em eventos aparecem aqui.
          </Text>
        ) : (
          <View style={styles.galleryGrid}>
            {photos.map((p) => (
              <Pressable key={p.id} onPress={() => setGalleryPhoto(p)}>
                <Image source={{ uri: p.url }} style={styles.galleryThumb} />
              </Pressable>
            ))}
          </View>
        )}
      </Card>

      <Text style={styles.footer}>Timeco v1.0.0</Text>

      {user.photoURL ? (
        <PhotoLightbox
          visible={lightboxOpen}
          url={user.photoURL}
          caption={user.name}
          onClose={() => setLightboxOpen(false)}
        />
      ) : null}

      {galleryPhoto ? (
        <PhotoLightbox
          visible={!!galleryPhoto}
          url={galleryPhoto.url}
          caption={galleryPhoto.uploaderName}
          onClose={() => setGalleryPhoto(null)}
        />
      ) : null}
    </Screen>
  );
};
