import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Timestamp } from 'firebase/firestore';
import { getSport } from '../../constants/sports';
import { Event, EventPhoto, User, ConfirmationStatus } from '../../types';
import {
  getEventById,
  setConfirmation,
  deleteEvent,
  setEventStatus,
} from '../../services/eventService';
import { getUsersByIds } from '../../services/userService';
import {
  addPhotoToEvent,
  listEventPhotos,
  removeEventPhoto,
} from '../../services/eventGalleryService';
import { googleMapsUrl } from '../../services/locationService';
import { pickImage } from '../../utils/imagePicker';
import { useAuthStore, useThemedColors } from '../../store';
import type { EventsStackParamList } from '../../navigation/types';

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

const initials = (name?: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

interface AvatarProps {
  name?: string;
  photoURL?: string;
  size?: number;
  primary: string;
  surfaceVariant: string;
  white: string;
}

const HtmlAvatar: React.FC<AvatarProps> = ({
  name,
  photoURL,
  size = 44,
  primary,
  surfaceVariant,
  white,
}) => {
  const style: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: size / 2,
    objectFit: 'cover',
    flexShrink: 0,
  };
  if (photoURL) {
    return <img src={photoURL} alt={name ?? ''} style={{ ...style, background: surfaceVariant }} />;
  }
  return (
    <div
      style={{
        ...style,
        background: primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: white,
        fontWeight: 800,
        fontSize: size * 0.4,
      }}
    >
      {initials(name)}
    </div>
  );
};

export const EventDetailScreen: React.FC = () => {
  const c = useThemedColors();
  const route = useRoute<Rt>();
  const nav = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const [event, setEvent] = useState<Event | null>(null);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [photos, setPhotos] = useState<EventPhoto[]>([]);
  const [lightbox, setLightbox] = useState<EventPhoto | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    const e = await getEventById(route.params.eventId);
    setEvent(e);
    if (e) {
      const all = await getUsersByIds([e.organizerId, ...e.invitedUserIds]);
      const map: Record<string, User> = {};
      for (const u of all) map[u.id] = u;
      setUsers(map);
    }
  }, [route.params.eventId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    if (!event) return;
    listEventPhotos(event.id)
      .then(setPhotos)
      .catch((err) => console.warn('listEventPhotos', err));
  }, [event?.id]);

  const sport = useMemo(() => (event ? getSport(event.sport) : null), [event?.sport]);

  if (!event || !user || !sport) {
    return (
      <div
        style={{
          padding: 16,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          color: c.text,
          background: c.background,
          minHeight: '100vh',
        }}
      >
        <p>Carregando...</p>
      </div>
    );
  }

  const isOrganizer = event.organizerId === user.id;
  const myStatus: ConfirmationStatus = event.confirmations?.[user.id] ?? 'pending';
  const allParticipantIds = [
    event.organizerId,
    ...event.invitedUserIds.filter((id) => id !== event.organizerId),
  ];
  const confirmed = allParticipantIds.filter((id) => event.confirmations?.[id] === 'confirmed');
  const declined = allParticipantIds.filter((id) => event.confirmations?.[id] === 'declined');
  const pending = allParticipantIds.filter(
    (id) => (event.confirmations?.[id] ?? 'pending') === 'pending',
  );

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
    const proceed = window.confirm('Apagar este evento?');
    if (!proceed) return;
    await deleteEvent(event.id);
    nav.goBack();
  };

  const onCancel = async () => {
    await setEventStatus(event.id, 'cancelled');
    await load();
  };

  const handlePick = async () => {
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

  const onRemovePhoto = async (photo: EventPhoto) => {
    if (photo.uploaderId !== user.id && !isOrganizer) return;
    if (!window.confirm('Apagar esta foto?')) return;
    await removeEventPhoto(event.id, photo.id, photo.storagePath);
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
  };

  const userCanParticipate =
    event.organizerId === user.id ||
    event.invitedUserIds.includes(user.id) ||
    event.confirmations?.[user.id] === 'confirmed';

  const isOpenOrDrawn = event.status === 'open' || event.status === 'teams_drawn';

  // Estilos compartilhados
  const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const card: React.CSSProperties = {
    background: c.surface,
    borderRadius: 16,
    padding: 16,
    border: `1px solid ${c.border}`,
    marginBottom: 16,
  };
  const sectionTitle: React.CSSProperties = {
    fontSize: 15,
    fontWeight: 800,
    color: c.text,
    marginTop: 16,
    marginBottom: 8,
  };
  const baseBtn: React.CSSProperties = {
    minHeight: 50,
    borderRadius: 10,
    padding: '12px 16px',
    border: 'none',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  };
  const primaryBtn: React.CSSProperties = {
    ...baseBtn,
    background: c.primary,
    color: c.white,
  };
  const outlineBtn: React.CSSProperties = {
    ...baseBtn,
    background: 'transparent',
    color: c.primary,
    border: `2px solid ${c.primary}`,
  };

  return (
    <div
      style={{
        fontFamily,
        background: c.background,
        color: c.text,
        minHeight: '100vh',
        padding: 16,
        boxSizing: 'border-box',
        maxWidth: 840,
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => nav.goBack()}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            background: c.surfaceVariant,
            border: 'none',
            color: c.text,
            fontSize: 28,
            lineHeight: '28px',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          ‹
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: c.text, margin: 0 }}>
            {event.title}
          </h1>
          <p style={{ fontSize: 14, color: c.textSecondary, margin: '2px 0 0' }}>
            {sport.emoji} {sport.label}
          </p>
        </div>
      </div>

      {/* EventHero */}
      <div style={{ ...card, background: c.primary, borderColor: c.primary, color: c.white }}>
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: c.white,
            textTransform: 'capitalize',
          }}
        >
          {formatDate(event.scheduledAt)}
        </div>
        <div style={{ fontSize: 15, color: c.white, marginTop: 6 }}>📍 {event.location}</div>
        {event.locationDetails ? (
          <button
            onClick={() =>
              window.open(
                googleMapsUrl({
                  lat: event.locationDetails!.lat,
                  lng: event.locationDetails!.lng,
                  name: event.location,
                }),
                '_blank',
              )
            }
            style={{
              marginTop: 8,
              padding: '6px 12px',
              background: 'rgba(255,255,255,0.18)',
              color: c.white,
              border: 'none',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            🗺️ Abrir no Google Maps
          </button>
        ) : null}
        <div style={{ fontSize: 13, color: c.white, opacity: 0.9, marginTop: 8 }}>
          👑 Organizador: {event.organizerName}
        </div>
        {event.notes ? (
          <div style={{ fontSize: 13, color: c.white, opacity: 0.9, marginTop: 6 }}>
            📝 {event.notes}
          </div>
        ) : null}
      </div>

      {/* Confirmados em miniatura */}
      {confirmed.length > 0 ? (
        <>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: c.textSecondary,
              marginTop: 16,
              marginBottom: 2,
            }}
          >
            ✅ Confirmados ({confirmed.length})
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              padding: '8px 0',
            }}
          >
            {confirmed.map((id) => {
              const u = users[id];
              if (!u) return null;
              const firstName = u.name.split(' ')[0];
              return (
                <div
                  key={id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    width: 64,
                  }}
                >
                  <HtmlAvatar
                    name={u.name}
                    photoURL={u.photoURL}
                    size={48}
                    primary={c.primary}
                    surfaceVariant={c.surfaceVariant}
                    white={c.white}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      color: c.text,
                      fontWeight: 600,
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: 64,
                    }}
                  >
                    {firstName}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      ) : null}

      {/* Confirmação: card completo se pendente, pill se já decidiu */}
      {isOpenOrDrawn && myStatus === 'pending' ? (
        <div style={card}>
          <div style={{ fontSize: 16, fontWeight: 700, color: c.text }}>
            {isOrganizer ? 'Você vai jogar?' : 'Você vai?'}
          </div>
          {isOrganizer ? (
            <div style={{ fontSize: 12, color: c.textSecondary, marginTop: 4, lineHeight: 1.4 }}>
              Como organizador, confirme se você também vai entrar nos times sorteados.
            </div>
          ) : null}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              onClick={() => setMyStatus('confirmed')}
              disabled={busy}
              style={{ ...outlineBtn, flex: 1 }}
            >
              {busy ? '...' : 'Vou'}
            </button>
            <button
              onClick={() => setMyStatus('declined')}
              disabled={busy}
              style={{ ...outlineBtn, flex: 1 }}
            >
              {busy ? '...' : 'Não vou'}
            </button>
          </div>
        </div>
      ) : isOpenOrDrawn ? (
        <button
          onClick={() => setMyStatus(myStatus === 'confirmed' ? 'declined' : 'confirmed')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: c.surfaceVariant,
            borderRadius: 999,
            padding: '8px 12px',
            marginBottom: 16,
            border: 'none',
            cursor: 'pointer',
            color: c.text,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {myStatus === 'confirmed' ? '✅ Você confirmou' : '❌ Você não vai'}
          <span style={{ fontSize: 12, color: c.primary }}>· trocar</span>
        </button>
      ) : null}

      {/* Botão primário do organizador */}
      {isOrganizer && event.status !== 'cancelled' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
          <button
            onClick={() => nav.navigate('RatePlayers', { eventId: event.id })}
            style={primaryBtn}
          >
            {event.status === 'teams_drawn'
              ? '🎲 Refazer sorteio'
              : '⭐ Definir estrelas e sortear times'}
          </button>
          {event.status === 'teams_drawn' ? (
            <button
              onClick={() => nav.navigate('DrawResult', { eventId: event.id })}
              style={outlineBtn}
            >
              Ver times sorteados
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Ações secundárias do organizador */}
      {isOrganizer && event.status !== 'cancelled' ? (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            padding: '8px 0',
            marginBottom: 16,
          }}
        >
          <button
            onClick={() => nav.navigate('EditEvent', { eventId: event.id })}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: c.primary,
              fontSize: 13,
              fontWeight: 700,
              padding: 0,
            }}
          >
            ✏️ Editar
          </button>
          <button
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: c.primary,
              fontSize: 13,
              fontWeight: 700,
              padding: 0,
            }}
          >
            ⛔ Cancelar evento
          </button>
          <button
            onClick={onDelete}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: c.danger,
              fontSize: 13,
              fontWeight: 700,
              padding: 0,
            }}
          >
            🗑️ Excluir
          </button>
        </div>
      ) : null}

      {/* Não-organizador com sorteio pronto: ver times */}
      {!isOrganizer && event.status === 'teams_drawn' ? (
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => nav.navigate('DrawResult', { eventId: event.id })}
            style={primaryBtn}
          >
            🎲 Ver times sorteados
          </button>
        </div>
      ) : null}

      {/* Pendentes */}
      <div style={sectionTitle}>⏳ Pendentes ({pending.length})</div>
      {pending.length === 0 ? (
        <div style={{ color: c.textSecondary, fontSize: 13, padding: '4px 0' }}>
          Ninguém pendente.
        </div>
      ) : (
        pending.map((id) => {
          const u = users[id];
          if (!u) return null;
          return (
            <div
              key={id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: c.surface,
                borderRadius: 10,
                padding: 12,
                border: `1px solid ${c.border}`,
                marginBottom: 6,
              }}
            >
              <HtmlAvatar
                name={u.name}
                photoURL={u.photoURL}
                size={36}
                primary={c.primary}
                surfaceVariant={c.surfaceVariant}
                white={c.white}
              />
              <span style={{ fontSize: 15, color: c.text, fontWeight: 600 }}>{u.name}</span>
            </div>
          );
        })
      )}

      {/* Não vão */}
      {declined.length > 0 ? (
        <>
          <div style={sectionTitle}>❌ Não vão ({declined.length})</div>
          {declined.map((id) => {
            const u = users[id];
            if (!u) return null;
            return (
              <div
                key={id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: c.surface,
                  borderRadius: 10,
                  padding: 12,
                  border: `1px solid ${c.border}`,
                  marginBottom: 6,
                }}
              >
                <HtmlAvatar
                  name={u.name}
                  photoURL={u.photoURL}
                  size={36}
                  primary={c.primary}
                  surfaceVariant={c.surfaceVariant}
                  white={c.white}
                />
                <span style={{ fontSize: 15, color: c.text, fontWeight: 600 }}>{u.name}</span>
              </div>
            );
          })}
        </>
      ) : null}

      {/* Galeria */}
      <div style={sectionTitle}>📸 Galeria ({photos.length})</div>
      {photos.length === 0 && !userCanParticipate ? (
        <div style={{ color: c.textSecondary, fontSize: 13, padding: '4px 0' }}>
          Nenhuma foto ainda.
        </div>
      ) : null}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          marginTop: 6,
        }}
      >
        {photos.map((p) => (
          <div key={p.id} style={{ position: 'relative' }}>
            <button
              onClick={() => setLightbox(p)}
              style={{ padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
            >
              <img
                src={p.url}
                alt=""
                style={{
                  width: 92,
                  height: 92,
                  borderRadius: 10,
                  objectFit: 'cover',
                  background: c.surfaceVariant,
                  display: 'block',
                }}
              />
            </button>
            {p.uploaderId === user.id || isOrganizer ? (
              <button
                onClick={() => onRemovePhoto(p)}
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
            ) : null}
          </div>
        ))}
        {userCanParticipate ? (
          <button
            onClick={handlePick}
            disabled={uploading}
            style={{
              width: 92,
              height: 92,
              borderRadius: 10,
              background: c.surfaceVariant,
              border: `2px dashed ${c.primary}`,
              cursor: uploading ? 'wait' : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <span style={{ fontSize: 26, color: c.primary, fontWeight: 900, lineHeight: '28px' }}>
              +
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, color: c.primary }}>
              {uploading ? 'Enviando...' : 'Foto'}
            </span>
          </button>
        ) : null}
      </div>

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
            style={{
              maxWidth: '95vw',
              maxHeight: '85vh',
              objectFit: 'contain',
            }}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(null);
            }}
            style={{
              position: 'absolute',
              top: 24,
              right: 24,
              width: 44,
              height: 44,
              borderRadius: 22,
              background: 'rgba(255,255,255,0.18)',
              color: c.white,
              border: 'none',
              fontSize: 22,
              fontWeight: 900,
              cursor: 'pointer',
            }}
          >
            ×
          </button>
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
            Foto de {lightbox.uploaderName}
          </div>
        </div>
      ) : null}

      <div style={{ height: 32 }} />
    </div>
  );
};
