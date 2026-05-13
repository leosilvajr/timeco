import React, { useCallback, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Timestamp } from 'firebase/firestore';
import { HtmlScreen, HtmlNotificationBell } from '../../components/web';
import { useAuthStore, useThemedColors, useUnreadCount } from '../../store';
import { computeProfileCompletion } from '../../hooks/useProfileCompletion';
import { listEventsForUser } from '../../services/eventService';
import { Event } from '../../types';
import { HomeAlertBanner } from './components/HomeAlertBanner.web';
import { UpcomingEventItem } from './components/UpcomingEventItem.web';
import { UtilityLink } from './components/UtilityLink.web';
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

  // initial: false faz o React Navigation EMPILHAR a tela em cima da raiz
  // do stack (em vez de resetar). Resolve o bug de "voltar pra Jogos
  // mostra EventDetail em vez da lista" — agora a stack sempre tem
  // [EventsList, ...] como raiz.
  const goEditProfile = () =>
    nav.navigate('Perfil', { screen: 'EditProfile', initial: false } as never);
  const goCreate = () =>
    nav.navigate('Jogos', { screen: 'CreateEvent', initial: false } as never);
  const goEvents = () => nav.navigate('Jogos', { screen: 'EventsList' } as never);
  const goEventDetail = (eventId: string) =>
    nav.navigate('Jogos', {
      screen: 'EventDetail',
      params: { eventId },
      initial: false,
    } as never);
  const goAddFriend = () =>
    nav.navigate('Social', { screen: 'AddFriend', initial: false } as never);
  const goRequests = () =>
    nav.navigate('Social', { screen: 'FriendRequests', initial: false } as never);
  const goNotifications = () =>
    nav.navigate('Perfil', { screen: 'Notifications', initial: false } as never);
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

      {!completion.isComplete ? (
        <HomeAlertBanner
          emoji="📝"
          title={`Perfil ${completion.percent}% completo`}
          subtitle={`Faltam ${completion.missing.length} info${
            completion.missing.length === 1 ? '' : 's'
          } (${
            completion.missingCritical.length > 0 ? 'criticas pra sorteio' : 'extras'
          })`}
          onClick={goEditProfile}
        />
      ) : null}

      {unread > 0 ? (
        <HomeAlertBanner
          emoji="🔔"
          title={`${unread} notificação${unread === 1 ? '' : 'ões'} não lida${
            unread === 1 ? '' : 's'
          }`}
          subtitle="Convites, mensagens e atualizações"
          onClick={goNotifications}
        />
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
          {events.map((ev) => (
            <UpcomingEventItem
              key={ev.id}
              event={ev}
              onClick={() => goEventDetail(ev.id)}
            />
          ))}
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
        <UtilityLink
          emoji="🏆"
          title="Placar eletrônico"
          subtitle="Marcador digital pra usar durante o jogo."
          onClick={goScoreboard}
        />
        <UtilityLink
          emoji="🏐"
          title="Vôlei avançado · Scout"
          badge="EXTRA"
          subtitle="Estatísticas profissionais por jogador e set."
          onClick={goVolley}
        />
      </div>
    </HtmlScreen>
  );
};
