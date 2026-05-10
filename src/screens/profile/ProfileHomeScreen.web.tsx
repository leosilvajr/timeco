import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  HtmlScreen,
  HtmlHeader,
  HtmlCard,
  HtmlAvatar,
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

  const menuItem = (
    label: string,
    onClick: () => void,
    badge?: number,
    value?: string,
  ) => (
    <button
      onClick={onClick}
      style={{
        background: c.surface,
        border: `1px solid ${c.border}`,
        borderRadius: 10,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        fontFamily: 'inherit',
        color: 'inherit',
      }}
    >
      <span style={{ fontSize: 15, color: c.text, fontWeight: 600 }}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {badge && badge > 0 ? (
          <span
            style={{
              minWidth: 22,
              height: 22,
              padding: '0 6px',
              borderRadius: 11,
              background: c.danger,
              color: c.white,
              fontSize: 12,
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {badge > 99 ? '99+' : badge}
          </span>
        ) : value ? (
          <span style={{ fontSize: 13, color: c.textMuted }}>{value}</span>
        ) : null}
        <span style={{ fontSize: 22, color: c.textMuted }}>›</span>
      </span>
    </button>
  );

  return (
    <HtmlScreen maxWidth={600}>
      <HtmlHeader title="Perfil" right={<HtmlNotificationBell />} />

      <HtmlCard style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => user.photoURL && setLightbox({ url: user.photoURL, caption: user.name })}
            disabled={!user.photoURL}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: user.photoURL ? 'pointer' : 'default',
              padding: 0,
              display: 'inline-flex',
            }}
          >
            <HtmlAvatar name={user.name} photoURL={user.photoURL} size={88} />
          </button>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: c.text, marginTop: 6 }}>
          {user.name}
        </div>
        <div style={{ fontSize: 14, color: c.textSecondary }}>{user.email}</div>
        {user.role === 'superadmin' ? (
          <span
            style={{
              display: 'inline-block',
              marginTop: 6,
              padding: '4px 10px',
              background: c.secondary,
              color: c.black,
              fontWeight: 800,
              borderRadius: 999,
              fontSize: 12,
            }}
          >
            👑 Super admin
          </span>
        ) : null}
        <div style={{ width: '100%', marginTop: 12 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: c.textSecondary,
              marginBottom: 6,
              textAlign: 'center',
            }}
          >
            Cadastro {completion.percent}% completo
            {completion.isComplete ? ' ✅' : ''}
          </div>
          <div
            style={{
              height: 6,
              background: c.border,
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${completion.percent}%`,
                background: c.primary,
                borderRadius: 3,
              }}
            />
          </div>
        </div>
      </HtmlCard>

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
        {menuItem('🔔  Notificações', () => nav.navigate('Notifications'), unread)}
        {menuItem('✏️  Editar meus dados', () => nav.navigate('EditProfile'))}
        {menuItem('⚙️  Configurações', () => nav.navigate('SettingsHome'))}
        {menuItem('❓  Ajuda', () => nav.navigate('HelpHome'))}
        {user.role === 'superadmin'
          ? menuItem('🛡️  Painel super admin', () => nav.navigate('SuperAdmin'))
          : null}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 24 }}>
        <HtmlButton
          title="📲  Compartilhar meu perfil"
          variant="secondary"
          onClick={() => shareText(formatProfileShare(user, true), `Perfil de ${user.name}`)}
        />
        <HtmlButton title="Sair" variant="outline" onClick={() => logout()} />
      </div>

      {/* Galeria pessoal */}
      <HtmlCard style={{ marginTop: 16 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: c.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 8,
          }}
        >
          📸 Minhas fotos ({profilePhotos.length})
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {profilePhotos.map((p) => (
            <div key={p.id} style={{ position: 'relative' }}>
              <button
                onClick={() => setLightbox({ url: p.url })}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                }}
              >
                <img
                  src={p.url}
                  alt=""
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: 10,
                    objectFit: 'cover',
                    background: c.surfaceVariant,
                    display: 'block',
                  }}
                />
              </button>
              <button
                onClick={() => onRemoveProfilePhoto(p)}
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  background: 'rgba(0,0,0,0.6)',
                  color: c.white,
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 900,
                  cursor: 'pointer',
                  padding: 0,
                  lineHeight: '22px',
                }}
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={onAddProfilePhoto}
            disabled={uploadingProfile}
            style={{
              width: 88,
              height: 88,
              borderRadius: 10,
              background: c.surfaceVariant,
              border: `2px dashed ${c.primary}`,
              cursor: uploadingProfile ? 'wait' : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              color: c.primary,
            }}
          >
            <span style={{ fontSize: 26, fontWeight: 900, lineHeight: '28px' }}>+</span>
            <span style={{ fontSize: 10, fontWeight: 700 }}>
              {uploadingProfile ? 'Enviando...' : 'Foto'}
            </span>
          </button>
        </div>
      </HtmlCard>

      {/* Galeria em eventos */}
      <HtmlCard>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: c.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 8,
          }}
        >
          🏟️ Em eventos ({eventPhotos.length})
        </div>
        {eventPhotos.length === 0 ? (
          <div
            style={{
              fontSize: 12,
              color: c.textSecondary,
              textAlign: 'center',
              padding: '12px 0',
            }}
          >
            Fotos que você envia em eventos aparecem aqui.
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {eventPhotos.map((p) => (
              <button
                key={p.id}
                onClick={() => setLightbox({ url: p.url, caption: p.uploaderName })}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                }}
              >
                <img
                  src={p.url}
                  alt=""
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: 10,
                    objectFit: 'cover',
                    background: c.surfaceVariant,
                    display: 'block',
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </HtmlCard>

      <p style={{ marginTop: 32, textAlign: 'center', color: c.textMuted, fontSize: 12 }}>
        Timeco v1.1.1
      </p>

      {/* Lightbox */}
      {lightbox ? (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            cursor: 'pointer',
          }}
        >
          <img
            src={lightbox.url}
            alt=""
            style={{ maxWidth: '95vw', maxHeight: '85vh', objectFit: 'contain' }}
          />
          {lightbox.caption ? (
            <div
              style={{
                position: 'absolute',
                bottom: 24,
                left: 16,
                right: 16,
                color: c.white,
                fontSize: 14,
                textAlign: 'center',
              }}
            >
              {lightbox.caption}
            </div>
          ) : null}
        </div>
      ) : null}
    </HtmlScreen>
  );
};
