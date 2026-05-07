import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Timestamp } from 'firebase/firestore';
import { HtmlScreen, HtmlHeader, HtmlNotificationBell, HtmlEmpty, HtmlButton } from '../../components/web';
import { listEventsForUser } from '../../services/eventService';
import { useAuthStore, useThemedColors } from '../../store';
import { Event } from '../../types';
import { getSport } from '../../constants/sports';
import type { EventsStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<EventsStackParamList, 'EventsList'>;
type Rt = RouteProp<EventsStackParamList, 'EventsList'>;

type Filter = 'upcoming' | 'history' | 'all';

const isHistory = (e: Event): boolean =>
  e.status === 'finished' || e.status === 'cancelled';

const eventDate = (e: Event): Date | null => {
  const ts = e.scheduledAt as Timestamp | Date | null;
  if (!ts) return null;
  const d = (ts as Timestamp)?.toDate?.() ?? (ts as Date);
  return d && !Number.isNaN(d.getTime()) ? d : null;
};

const formatDate = (date: Date | Timestamp | null): string => {
  if (!date) return 'Sem data';
  const d = (date as Timestamp)?.toDate?.() ?? (date as Date);
  if (!d || Number.isNaN(d.getTime())) return 'Sem data';
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const statusLabel: Record<Event['status'], string> = {
  open: 'Aberto',
  teams_drawn: 'Times sorteados',
  finished: 'Finalizado',
  cancelled: 'Cancelado',
};

export const EventsListScreen: React.FC = () => {
  const c = useThemedColors();
  const user = useAuthStore((s) => s.user);
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>(route.params?.initialFilter ?? 'upcoming');

  useEffect(() => {
    if (route.params?.initialFilter) setFilter(route.params.initialFilter);
  }, [route.params?.initialFilter]);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = await listEventsForUser(user.id);
      setEvents(data);
    } catch (e) {
      console.error('listEvents', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const filteredEvents = useMemo(() => {
    const now = Date.now();
    const sorted = [...events];
    if (filter === 'upcoming') {
      return sorted
        .filter((e) => !isHistory(e))
        .sort((a, b) => {
          const da = eventDate(a)?.getTime() ?? Infinity;
          const db = eventDate(b)?.getTime() ?? Infinity;
          return da - db;
        });
    }
    if (filter === 'history') {
      return sorted
        .filter((e) => isHistory(e) || (eventDate(e)?.getTime() ?? Infinity) < now)
        .sort((a, b) => {
          const da = eventDate(a)?.getTime() ?? 0;
          const db = eventDate(b)?.getTime() ?? 0;
          return db - da;
        });
    }
    return sorted.sort((a, b) => {
      const da = eventDate(a)?.getTime() ?? 0;
      const db = eventDate(b)?.getTime() ?? 0;
      return db - da;
    });
  }, [events, filter]);

  const counts = useMemo(() => {
    const now = Date.now();
    let upcoming = 0;
    let history = 0;
    for (const e of events) {
      if (isHistory(e) || (eventDate(e)?.getTime() ?? Infinity) < now) history += 1;
      else upcoming += 1;
    }
    return { upcoming, history, all: events.length };
  }, [events]);

  const statusColor = (s: Event['status']) =>
    ({
      open: c.info,
      teams_drawn: c.primary,
      finished: c.textMuted,
      cancelled: c.danger,
    }[s]);

  const chip = (active: boolean): React.CSSProperties => ({
    padding: '8px 14px',
    borderRadius: 999,
    border: `1.5px solid ${active ? c.primary : c.border}`,
    background: active ? c.primary : c.surface,
    color: active ? c.white : c.text,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  });

  return (
    <HtmlScreen>
      <HtmlHeader
        title="Jogos"
        subtitle="Eventos seus e dos seus amigos"
        right={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => nav.navigate('QuickDraw')}
              style={{
                padding: '0 12px',
                height: 40,
                borderRadius: 20,
                background: c.surfaceVariant,
                border: `1.5px solid ${c.primary}`,
                cursor: 'pointer',
                color: c.primary,
                fontSize: 13,
                fontWeight: 800,
                whiteSpace: 'nowrap',
                fontFamily: 'inherit',
              }}
            >
              🎲 Sorteio rápido
            </button>
            <button
              onClick={() => nav.navigate('CreateEvent')}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                background: c.primary,
                border: 'none',
                cursor: 'pointer',
                color: c.white,
                fontSize: 28,
                lineHeight: '30px',
              }}
            >
              +
            </button>
            <HtmlNotificationBell />
          </div>
        }
      />

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => setFilter('upcoming')} style={chip(filter === 'upcoming')}>
          Próximos ({counts.upcoming})
        </button>
        <button onClick={() => setFilter('history')} style={chip(filter === 'history')}>
          Histórico ({counts.history})
        </button>
        <button onClick={() => setFilter('all')} style={chip(filter === 'all')}>
          Todos ({counts.all})
        </button>
      </div>

      {/* Empty state */}
      {!loading && filteredEvents.length === 0 ? (
        filter === 'history' ? (
          <HtmlEmpty
            emoji="📜"
            title="Sem histórico"
            subtitle="Quando seus eventos forem finalizados, eles aparecem aqui."
          />
        ) : (
          <>
            <HtmlEmpty
              emoji="🏟️"
              title="Nenhum jogo ainda"
              subtitle="Crie seu primeiro evento ou peça pra um amigo te convidar."
            />
            <div style={{ marginTop: 12 }}>
              <HtmlButton
                title="Criar evento"
                onClick={() => nav.navigate('CreateEvent')}
              />
            </div>
          </>
        )
      ) : null}

      {/* List */}
      {filteredEvents.map((item) => {
        const sport = getSport(item.sport);
        const isOrganizer = item.organizerId === user?.id;
        const confirmedCount = Object.values(item.confirmations || {}).filter(
          (s) => s === 'confirmed',
        ).length;
        const sColor = statusColor(item.status);
        return (
          <button
            key={item.id}
            onClick={() => nav.navigate('EventDetail', { eventId: item.id })}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              background: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              cursor: 'pointer',
              fontFamily: 'inherit',
              color: 'inherit',
            }}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 38 }}>{sport.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: c.text }}>{item.title}</div>
                <div style={{ fontSize: 13, color: c.textSecondary, marginTop: 2 }}>
                  {sport.label} • {formatDate(item.scheduledAt)}
                </div>
                <div style={{ fontSize: 13, color: c.textSecondary, marginTop: 2 }}>
                  📍 {item.location || 'Sem local'}
                </div>
              </div>
            </div>
            <div
              style={{
                marginTop: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: `${sColor}22`,
                  color: sColor,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {statusLabel[item.status]}
              </span>
              <span style={{ fontSize: 13, color: c.textSecondary }}>
                ✅ {confirmedCount} / {item.invitedUserIds.length} confirmados
              </span>
              {isOrganizer ? (
                <span style={{ fontSize: 12, color: c.secondary, fontWeight: 700 }}>
                  👑 Você organiza
                </span>
              ) : null}
            </div>
          </button>
        );
      })}
    </HtmlScreen>
  );
};
