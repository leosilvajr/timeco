import React, { useCallback, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Timestamp } from 'firebase/firestore';
import { HtmlScreen, HtmlNotificationBell } from '../../components/web';
import { useAuthStore, useThemedColors, useUnreadCount } from '../../store';
import { computeProfileCompletion } from '../../hooks/useProfileCompletion';
import { listEventsForUser } from '../../services/eventService';
import { Event } from '../../types';
import { getSport } from '../../constants/sports';
import type { MainTabParamList } from '../../navigation/types';

type Nav = BottomTabNavigationProp<MainTabParamList>;

const eventDate = (e: Event): Date | null => {
  const ts = e.scheduledAt as Timestamp | Date | null;
  if (!ts) return null;
  const d = (ts as Timestamp)?.toDate?.() ?? (ts as Date);
  return d && !Number.isNaN(d.getTime()) ? d : null;
};

const isUpcoming = (e: Event): boolean => {
  if (e.status === 'finished' || e.status === 'cancelled') return false;
  const d = eventDate(e);
  if (!d) return true;
  return d.getTime() >= Date.now() - 1000 * 60 * 60 * 4;
};

const formatRelative = (d: Date): string => {
  const diffMs = d.getTime() - Date.now();
  const diffHr = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays > 1) return `Em ${diffDays} dias`;
  if (diffDays === 1) return 'Amanhã';
  if (diffHr > 1) return `Em ${diffHr}h`;
  if (diffHr >= 0) return 'Hoje';
  return 'Em andamento';
};

const formatDateTime = (d: Date): string =>
  d.toLocaleString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

export const HomeScreen: React.FC = () => {
  const c = useThemedColors();
  const user = useAuthStore((s) => s.user);
  const unread = useUnreadCount();
  const completion = computeProfileCompletion(user);
  const nav = useNavigation<Nav>();

  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let alive = true;
      listEventsForUser(user.id)
        .then((all) => {
          if (!alive) return;
          const upcoming = all
            .filter(isUpcoming)
            .sort((a, b) => {
              const da = eventDate(a)?.getTime() ?? Infinity;
              const db = eventDate(b)?.getTime() ?? Infinity;
              return da - db;
            })
            .slice(0, 3);
          setEvents(upcoming);
          setEventsLoaded(true);
        })
        .catch(() => {
          if (alive) setEventsLoaded(true);
        });
      return () => {
        alive = false;
      };
    }, [user?.id]),
  );

  const goEditProfile = () => nav.navigate('Perfil', { screen: 'EditProfile' } as never);
  const goCreate = () => nav.navigate('Jogos', { screen: 'CreateEvent' } as never);
  const goEvents = () => nav.navigate('Jogos', { screen: 'EventsList' } as never);
  const goEventDetail = (eventId: string) =>
    nav.navigate('Jogos', { screen: 'EventDetail', params: { eventId } } as never);
  const goAddFriend = () => nav.navigate('Social', { screen: 'AddFriend' } as never);
  const goRequests = () => nav.navigate('Social', { screen: 'FriendRequests' } as never);
  const goNotifications = () => nav.navigate('Perfil', { screen: 'Notifications' } as never);
  const goVolley = () =>
    (nav as unknown as { navigate: (n: string, p?: unknown) => void }).navigate('Volley', {
      screen: 'VolleyHome',
    });
  const goScoreboard = () =>
    (nav as unknown as { navigate: (n: string, p?: unknown) => void }).navigate('Scoreboard', {
      screen: 'ScoreboardSetup',
    });

  const firstName = user?.name?.split(' ')[0] ?? 'atleta';

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 800,
    color: c.textSecondary,
    margin: '16px 0 8px',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  };

  const quickBtn = (variant: 'solid' | 'outline'): React.CSSProperties => ({
    flex: 1,
    padding: 12,
    borderRadius: 10,
    background: variant === 'outline' ? c.surface : c.primary,
    border: variant === 'outline' ? `1px solid ${c.border}` : 'none',
    color: variant === 'outline' ? c.text : c.white,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    fontSize: 12,
    fontWeight: 700,
    fontFamily: 'inherit',
  });

  return (
    <HtmlScreen>
      {/* Hero greeting */}
      <div
        style={{
          marginTop: 16,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, color: c.textSecondary, fontWeight: 600 }}>
            Olá, {firstName} 👋
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: c.text,
              marginTop: 2,
              letterSpacing: -0.3,
            }}
          >
            Bora jogar?
          </div>
        </div>
        <HtmlNotificationBell />
      </div>

      {/* Profile completion banner */}
      {!completion.isComplete ? (
        <button
          onClick={goEditProfile}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: 12,
            borderRadius: 10,
            background: c.surfaceVariant,
            border: `1px solid ${c.primaryLight}`,
            marginBottom: 12,
            width: '100%',
            cursor: 'pointer',
            color: c.text,
            fontFamily: 'inherit',
            textAlign: 'left',
          }}
        >
          <span style={{ fontSize: 22 }}>📝</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: c.text }}>
              Perfil {completion.percent}% completo
            </div>
            <div style={{ fontSize: 12, color: c.textSecondary, marginTop: 2 }}>
              Faltam {completion.missing.length} info
              {completion.missing.length === 1 ? '' : 's'} (
              {completion.missingCritical.length > 0 ? 'criticas pra sorteio' : 'extras'})
            </div>
          </div>
          <span style={{ fontSize: 22, color: c.textMuted }}>›</span>
        </button>
      ) : null}

      {/* Notificações alerta */}
      {unread > 0 ? (
        <button
          onClick={goNotifications}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: 12,
            borderRadius: 10,
            background: c.surfaceVariant,
            border: `1px solid ${c.primaryLight}`,
            marginBottom: 12,
            width: '100%',
            cursor: 'pointer',
            color: c.text,
            fontFamily: 'inherit',
            textAlign: 'left',
          }}
        >
          <span style={{ fontSize: 22 }}>🔔</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: c.text }}>
              {unread} notificação{unread === 1 ? '' : 'ões'} não lida
              {unread === 1 ? '' : 's'}
            </div>
            <div style={{ fontSize: 12, color: c.textSecondary, marginTop: 2 }}>
              Convites, mensagens e atualizações
            </div>
          </div>
          <span style={{ fontSize: 22, color: c.textMuted }}>›</span>
        </button>
      ) : null}

      {/* Próximos jogos */}
      <div style={sectionTitleStyle}>Próximos jogos</div>
      {!eventsLoaded ? null : events.length === 0 ? (
        <div
          style={{
            padding: 16,
            textAlign: 'center',
            background: c.surfaceVariant,
            borderRadius: 10,
          }}
        >
          <div style={{ fontSize: 36 }}>🏟️</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: c.text, marginTop: 6 }}>
            Nenhum jogo marcado
          </div>
          <div style={{ fontSize: 12, color: c.textSecondary, marginTop: 4 }}>
            Crie um evento e chame a galera. É rápido!
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {events.map((ev) => {
            const sport = getSport(ev.sport);
            const d = eventDate(ev);
            return (
              <button
                key={ev.id}
                onClick={() => goEventDetail(ev.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  background: c.surface,
                  border: `1px solid ${c.border}`,
                  borderRadius: 16,
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  color: 'inherit',
                }}
              >
                <span style={{ fontSize: 30 }}>{sport.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: c.text,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {ev.title}
                  </div>
                  <div style={{ fontSize: 13, color: c.primary, fontWeight: 700 }}>
                    {d ? formatRelative(d) : 'Sem data'}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: c.textSecondary,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {d ? formatDateTime(d) : ''} · 📍 {ev.location}
                  </div>
                </div>
                <span style={{ fontSize: 22, color: c.textMuted }}>›</span>
              </button>
            );
          })}
          <button
            onClick={goEvents}
            style={{
              alignSelf: 'flex-end',
              padding: '6px 4px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: c.primary,
              fontSize: 12,
              fontWeight: 800,
              fontFamily: 'inherit',
            }}
          >
            Ver todos os jogos ›
          </button>
        </div>
      )}

      {/* Ações rápidas */}
      <div style={sectionTitleStyle}>Ações rápidas</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button onClick={goCreate} style={quickBtn('solid')}>
          <span style={{ fontSize: 20 }}>➕</span>
          <span>Criar evento</span>
        </button>
        <button onClick={goAddFriend} style={quickBtn('outline')}>
          <span style={{ fontSize: 20 }}>👥</span>
          <span>Adicionar amigo</span>
        </button>
        <button onClick={goRequests} style={quickBtn('outline')}>
          <span style={{ fontSize: 20 }}>📨</span>
          <span>Convites</span>
        </button>
      </div>

      {/* Utilitários */}
      <div style={sectionTitleStyle}>Utilitários</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={goScoreboard}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: 12,
            background: c.surface,
            border: `1px solid ${c.border}`,
            borderRadius: 10,
            cursor: 'pointer',
            width: '100%',
            textAlign: 'left',
            fontFamily: 'inherit',
            color: 'inherit',
          }}
        >
          <span style={{ fontSize: 24 }}>🏆</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: c.text }}>Placar eletrônico</div>
            <div style={{ fontSize: 12, color: c.textSecondary }}>
              Marcador digital pra usar durante o jogo.
            </div>
          </div>
          <span style={{ fontSize: 18, color: c.textMuted }}>›</span>
        </button>
        <button
          onClick={goVolley}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: 12,
            background: c.surface,
            border: `1px solid ${c.border}`,
            borderRadius: 10,
            cursor: 'pointer',
            width: '100%',
            textAlign: 'left',
            fontFamily: 'inherit',
            color: 'inherit',
          }}
        >
          <span style={{ fontSize: 24 }}>🏐</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: c.text }}>
              Vôlei avançado · Scout{' '}
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 900,
                  background: c.primary,
                  color: c.white,
                  borderRadius: 999,
                  padding: '2px 6px',
                  marginLeft: 4,
                  letterSpacing: 0.5,
                }}
              >
                EXTRA
              </span>
            </div>
            <div style={{ fontSize: 12, color: c.textSecondary }}>
              Estatísticas profissionais por jogador e set.
            </div>
          </div>
          <span style={{ fontSize: 18, color: c.textMuted }}>›</span>
        </button>
      </div>
    </HtmlScreen>
  );
};
