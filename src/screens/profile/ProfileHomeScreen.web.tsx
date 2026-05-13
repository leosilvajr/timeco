import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  HtmlScreen,
  HtmlHeader,
  HtmlCard,
  HtmlButton,
  HtmlNotificationBell,
} from '../../components/web';
import { useAuthStore, useThemedColors, useUnreadCount } from '../../store';
import { computeProfileCompletion } from '../../hooks/useProfileCompletion';
import { logout } from '../../services/authService';
import { listPhotosByUser } from '../../services/eventGalleryService';
import { listEventsForUser } from '../../services/eventService';
import {
  addProfilePhoto,
  listProfilePhotos,
  removeProfilePhoto,
} from '../../services/profileGalleryService';
import { computeUserStats, UserStats } from '../../services/userStatsService';
import { shareText } from '../../services/shareService';
import { formatProfileShare } from '../../utils/profileShareText';
import { pickImage } from '../../utils/imagePicker';
import { EventPhoto, ProfilePhoto } from '../../types';
import { ProfileHeaderCard } from './components/ProfileHeaderCard.web';
import { ProfileMenuItem } from './components/ProfileMenuItem.web';
import { PhotoGallerySection } from './components/PhotoGallerySection.web';
import { Lightbox } from './components/Lightbox.web';
import type { ProfileStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'ProfileHome'>;

export const ProfileHomeScreen: React.FC = () => {
  const c = useThemedColors();
  const user = useAuthStore((s) => s.user);
  const unread = useUnreadCount();
  const completion = computeProfileCompletion(user);
  const nav = useNavigation<Nav>();
  const [lightbox, setLightbox] = useState<{ url: string; caption?: string } | null>(null);
  const [eventPhotos, setEventPhotos] = useState<EventPhoto[]>([]);
  const [profilePhotos, setProfilePhotos] = useState<ProfilePhoto[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);

  useEffect(() => {
    if (!user) return;
    listPhotosByUser(user.id).then(setEventPhotos).catch(() => undefined);
    listProfilePhotos(user.id).then(setProfilePhotos).catch(() => undefined);
    listEventsForUser(user.id)
      .then((events) => setStats(computeUserStats(events, user.id)))
      .catch(() => undefined);
  }, [user?.id]);

  const onAddProfilePhoto = async () => {
    if (!user) return;
    try {
      const file = await pickImage();
      if (!file) return;
      setUploadingProfile(true);
      const created = await addProfilePhoto(user.id, file);
      setProfilePhotos((prev) => [created, ...prev]);
    } catch (err) {
      console.error('addProfilePhoto', err);
    } finally {
      setUploadingProfile(false);
    }
  };

  const onRemoveProfilePhoto = async (photo: ProfilePhoto) => {
    if (!user) return;
    if (!window.confirm('Apagar esta foto?')) return;
    await removeProfilePhoto(user.id, photo.id, photo.storagePath);
    setProfilePhotos((prev) => prev.filter((p) => p.id !== photo.id));
  };

  if (!user) return null;

  return (
    <HtmlScreen maxWidth={600}>
      <HtmlHeader title="Perfil" right={<HtmlNotificationBell />} />

      <ProfileHeaderCard
        user={user}
        completion={completion}
        onAvatarClick={() =>
          user.photoURL && setLightbox({ url: user.photoURL, caption: user.name })
        }
      />

      {stats ? (
        <HtmlCard>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
              textAlign: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: c.primary }}>
                {stats.totalEvents}
              </div>
              <div style={{ fontSize: 11, color: c.textSecondary }}>Eventos</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: c.primary }}>
                {stats.asOrganizer}
              </div>
              <div style={{ fontSize: 11, color: c.textSecondary }}>Organizados</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: c.primary }}>
                {stats.asPlayer}
              </div>
              <div style={{ fontSize: 11, color: c.textSecondary }}>Jogados</div>
            </div>
          </div>
        </HtmlCard>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
        <ProfileMenuItem
          label="🔔  Notificações"
          onClick={() => nav.navigate('Notifications')}
          badge={unread}
        />
        <ProfileMenuItem
          label="✏️  Editar meus dados"
          onClick={() => nav.navigate('EditProfile')}
        />
        <ProfileMenuItem
          label="⚙️  Configurações"
          onClick={() => nav.navigate('SettingsHome')}
        />
        <ProfileMenuItem label="❓  Ajuda" onClick={() => nav.navigate('HelpHome')} />
        {user.role === 'superadmin' ? (
          <ProfileMenuItem
            label="🛡️  Painel super admin"
            onClick={() => nav.navigate('SuperAdmin')}
          />
        ) : null}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 24 }}>
        <HtmlButton
          title="📲  Compartilhar meu perfil"
          variant="secondary"
          onClick={() => shareText(formatProfileShare(user, true), `Perfil de ${user.name}`)}
        />
        <HtmlButton title="Sair" variant="outline" onClick={() => logout()} />
      </div>

      <PhotoGallerySection
        title="📸 Minhas fotos"
        photos={profilePhotos}
        onPhotoClick={(p) => setLightbox({ url: p.url })}
        manage={{
          onAdd: onAddProfilePhoto,
          onRemove: (p) => {
            const full = profilePhotos.find((x) => x.id === p.id);
            if (full) onRemoveProfilePhoto(full);
          },
          uploading: uploadingProfile,
        }}
        cardStyle={{ marginTop: 16 }}
      />

      <PhotoGallerySection
        title="🏟️ Em eventos"
        photos={eventPhotos.map((p) => ({ id: p.id, url: p.url, caption: p.uploaderName }))}
        emptyText="Fotos que você envia em eventos aparecem aqui."
        onPhotoClick={(p) => setLightbox({ url: p.url, caption: p.caption })}
      />

      <p style={{ marginTop: 32, textAlign: 'center', color: c.textMuted, fontSize: 12 }}>
        Timeco v1.1.1
      </p>

      {lightbox ? (
        <Lightbox
          url={lightbox.url}
          caption={lightbox.caption}
          onClose={() => setLightbox(null)}
        />
      ) : null}
    </HtmlScreen>
  );
};
