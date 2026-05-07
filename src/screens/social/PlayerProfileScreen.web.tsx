import React, { useEffect, useState } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  HtmlScreen,
  HtmlHeader,
  HtmlCard,
  HtmlAvatar,
  HtmlButton,
} from '../../components/web';
import { useThemedColors, useAuthStore } from '../../store';
import { getUserById } from '../../services/userService';
import { removeFriend, areFriends } from '../../services/friendsService';
import { listPhotosByUser } from '../../services/eventGalleryService';
import { listProfilePhotos } from '../../services/profileGalleryService';
import { shareText } from '../../services/shareService';
import { formatProfileShare } from '../../utils/profileShareText';
import { canViewFullProfile, canViewGallery } from '../../services/privacyLogic';
import { EventPhoto, ProfilePhoto, User } from '../../types';
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
  const c = useThemedColors();
  const route = useRoute<Rt>();
  const nav = useNavigation<Nav>();
  const current = useAuthStore((s) => s.user);
  const [target, setTarget] = useState<User | null>(null);
  const [isFriend, setIsFriend] = useState(false);
  const [lightbox, setLightbox] = useState<{ url: string; caption?: string } | null>(null);
  const [photos, setPhotos] = useState<EventPhoto[]>([]);
  const [profilePhotos, setProfilePhotos] = useState<ProfilePhoto[]>([]);

  useEffect(() => {
    getUserById(route.params.userId).then(setTarget);
    if (current) areFriends(current.id, route.params.userId).then(setIsFriend);
    listPhotosByUser(route.params.userId)
      .then(setPhotos)
      .catch((e) => console.warn('listPhotosByUser', e));
    listProfilePhotos(route.params.userId)
      .then(setProfilePhotos)
      .catch((e) => console.warn('listProfilePhotos', e));
  }, [route.params.userId, current?.id]);

  const onRemove = async () => {
    if (!current || !target) return;
    if (!window.confirm(`Remover ${target.name}?`)) return;
    await removeFriend(current.id, target.id);
    nav.goBack();
  };

  if (!target) {
    return (
      <HtmlScreen>
        <HtmlHeader title="Carregando..." onBack={() => nav.goBack()} />
      </HtmlScreen>
    );
  }

  const age = calcAge(target.birthDate);
  const hasInfo = !!(target.heightCm || age !== null || target.phone);
  const hasFavSports = (target.favoriteSports?.length ?? 0) > 0;
  const isSelf = current?.id === target.id;
  const canSeeFullProfile = canViewFullProfile(current, target, isFriend);
  const canSeeGallery = canViewGallery(current, target, isFriend);

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 700,
    color: c.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  };

  return (
    <HtmlScreen maxWidth={600}>
      <HtmlHeader title="Perfil" onBack={() => nav.goBack()} />

      <HtmlCard style={{ textAlign: 'center' }}>
        <button
          onClick={() => target.photoURL && setLightbox({ url: target.photoURL, caption: target.name })}
          disabled={!target.photoURL}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: target.photoURL ? 'pointer' : 'default',
            padding: 0,
          }}
        >
          <HtmlAvatar name={target.name} photoURL={target.photoURL} size={88} />
        </button>
        <div style={{ fontSize: 22, fontWeight: 800, color: c.text, marginTop: 6 }}>
          {target.name}
        </div>
        <div style={{ fontSize: 14, color: c.textSecondary }}>{target.email}</div>
        {target.bio ? (
          <p
            style={{
              fontSize: 14,
              color: c.text,
              textAlign: 'center',
              marginTop: 8,
              lineHeight: 1.4,
              fontStyle: 'italic',
            }}
          >
            "{target.bio}"
          </p>
        ) : null}
      </HtmlCard>

      {canSeeFullProfile || isSelf ? (
        <>
          <HtmlCard>
            <div style={sectionTitleStyle}>Dados</div>
            {age !== null ? (
              <div style={{ fontSize: 15, color: c.text, padding: '6px 0' }}>🎂 {age} anos</div>
            ) : null}
            {target.heightCm ? (
              <div style={{ fontSize: 15, color: c.text, padding: '6px 0' }}>
                📏 {target.heightCm} cm
              </div>
            ) : null}
            {target.phone ? (
              <div style={{ fontSize: 15, color: c.text, padding: '6px 0' }}>📱 {target.phone}</div>
            ) : null}
            {!hasInfo ? (
              <div style={{ color: c.textSecondary, textAlign: 'center', padding: '6px 0' }}>
                Sem informações adicionais
              </div>
            ) : null}
          </HtmlCard>

          {hasFavSports ? (
            <HtmlCard>
              <div style={sectionTitleStyle}>Esportes favoritos</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {target.favoriteSports!.map((sid) => {
                  const cfg = getSport(sid);
                  return (
                    <span
                      key={sid}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '6px 10px',
                        borderRadius: 999,
                        background: c.surfaceVariant,
                        border: `1px solid ${c.border}`,
                        fontSize: 12,
                        fontWeight: 600,
                        color: c.text,
                      }}
                    >
                      <span style={{ fontSize: 14 }}>{cfg.emoji}</span>
                      {cfg.label}
                    </span>
                  );
                })}
              </div>
            </HtmlCard>
          ) : null}
        </>
      ) : (
        <HtmlCard style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 26 }}>🔒</div>
          <div style={{ ...sectionTitleStyle, textAlign: 'center', marginBottom: 0 }}>
            Perfil privado
          </div>
          <p style={{ color: c.textSecondary, fontSize: 13 }}>
            Este usuário só compartilha os detalhes com amigos. Envie uma solicitação pra ver mais.
          </p>
        </HtmlCard>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
        {isFriend && current ? (
          <HtmlButton
            title="💬  Conversar"
            onClick={() => nav.navigate('Chat', { friendId: target.id, friendName: target.name })}
          />
        ) : null}
        <HtmlButton
          title="📲  Compartilhar perfil"
          variant="secondary"
          onClick={() => shareText(formatProfileShare(target, isSelf), `Perfil de ${target.name}`)}
        />
        {isFriend ? (
          <HtmlButton title="Remover amizade" variant="outline" onClick={onRemove} />
        ) : null}
      </div>

      {canSeeGallery && profilePhotos.length > 0 ? (
        <HtmlCard>
          <div style={sectionTitleStyle}>📸 Fotos pessoais ({profilePhotos.length})</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {profilePhotos.map((p) => (
              <button
                key={p.id}
                onClick={() => setLightbox({ url: p.url })}
                style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
              >
                <img
                  src={p.url}
                  alt=""
                  style={{
                    width: 90,
                    height: 90,
                    borderRadius: 10,
                    objectFit: 'cover',
                    background: c.surfaceVariant,
                    display: 'block',
                  }}
                />
              </button>
            ))}
          </div>
        </HtmlCard>
      ) : null}

      {canSeeGallery && photos.length > 0 ? (
        <HtmlCard>
          <div style={sectionTitleStyle}>🏟️ Em eventos ({photos.length})</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {photos.map((p) => (
              <button
                key={p.id}
                onClick={() => setLightbox({ url: p.url, caption: `Foto de ${p.uploaderName}` })}
                style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
              >
                <img
                  src={p.url}
                  alt=""
                  style={{
                    width: 90,
                    height: 90,
                    borderRadius: 10,
                    objectFit: 'cover',
                    background: c.surfaceVariant,
                    display: 'block',
                  }}
                />
              </button>
            ))}
          </div>
        </HtmlCard>
      ) : null}

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
