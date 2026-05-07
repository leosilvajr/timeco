import React, { useCallback, useEffect, useState } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HtmlScreen, HtmlHeader, HtmlButton, HtmlAvatar } from '../../components/web';
import { getEventById, listEventRatings } from '../../services/eventService';
import { getUsersByIds } from '../../services/userService';
import { shareText } from '../../services/shareService';
import { formatEventTeams } from '../../utils/teamShareText';
import { useAuthStore, useThemedColors } from '../../store';
import { DrawnTeam, Event, User } from '../../types';
import type { EventsStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<EventsStackParamList, 'DrawResult'>;
type Rt = RouteProp<EventsStackParamList, 'DrawResult'>;

const StarsView: React.FC<{ value: number }> = ({ value }) => {
  const c = useThemedColors();
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} style={{ color: n <= value ? c.star : c.starEmpty, fontSize: 14 }}>
          ★
        </span>
      ))}
    </span>
  );
};

const TeamCard: React.FC<{
  team: DrawnTeam;
  users: Record<string, User>;
  ratings: Record<string, number>;
  showStars: boolean;
}> = ({ team, users, ratings, showStars }) => {
  const c = useThemedColors();
  const avg = team.playerIds.length ? team.totalStars / team.playerIds.length : 0;
  return (
    <div
      style={{
        marginBottom: 16,
        border: `2px solid ${team.color}`,
        borderRadius: 16,
        overflow: 'hidden',
        background: c.surface,
      }}
    >
      <div style={{ background: team.color, padding: '12px 16px' }}>
        <div style={{ color: c.white, fontSize: 18, fontWeight: 900 }}>{team.name}</div>
        {showStars ? (
          <div style={{ color: c.white, opacity: 0.95, fontSize: 13, marginTop: 2 }}>
            ⭐ {team.totalStars.toFixed(1)} • média {avg.toFixed(1)}
          </div>
        ) : (
          <div style={{ color: c.white, opacity: 0.95, fontSize: 13, marginTop: 2 }}>
            {team.playerIds.length} jogadores
          </div>
        )}
      </div>
      <div style={{ paddingTop: 8, paddingBottom: 8 }}>
        {team.playerIds.map((id) => {
          const u = users[id];
          if (!u) return null;
          return (
            <div
              key={id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 16px',
              }}
            >
              <HtmlAvatar name={u.name} photoURL={u.photoURL} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: c.text }}>{u.name}</div>
                {showStars ? (
                  <div style={{ marginTop: 2 }}>
                    <StarsView value={ratings[id] ?? 0} />
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const DrawResultScreen: React.FC = () => {
  useThemedColors();
  const route = useRoute<Rt>();
  const nav = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const [event, setEvent] = useState<Event | null>(null);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [ratings, setRatings] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    const e = await getEventById(route.params.eventId);
    setEvent(e);
    if (e?.teams) {
      const ids = e.teams.flatMap((t) => t.playerIds);
      const us = await getUsersByIds(ids);
      const map: Record<string, User> = {};
      for (const u of us) map[u.id] = u;
      setUsers(map);
      if (e.organizerId === user?.id) {
        const r = await listEventRatings(e.id);
        const rmap: Record<string, number> = {};
        for (const x of r) rmap[x.playerUserId] = x.stars;
        setRatings(rmap);
      }
    }
  }, [route.params.eventId, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!event || !event.teams) {
    return (
      <HtmlScreen>
        <HtmlHeader title="Carregando..." onBack={() => nav.goBack()} />
      </HtmlScreen>
    );
  }

  const isOrganizer = event.organizerId === user?.id;

  return (
    <HtmlScreen maxWidth={840}>
      <HtmlHeader title="Times sorteados" onBack={() => nav.goBack()} subtitle={event.title} />

      {event.teams.map((t, idx) => (
        <TeamCard key={idx} team={t} users={users} ratings={ratings} showStars={isOrganizer} />
      ))}

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <HtmlButton
          title="📲 Compartilhar times"
          variant="secondary"
          onClick={() => shareText(formatEventTeams(event, users, isOrganizer), event.title)}
        />
        {isOrganizer ? (
          <HtmlButton
            title="🎲 Sortear novamente"
            onClick={() => nav.navigate('RatePlayers', { eventId: event.id })}
          />
        ) : null}
      </div>
      <div style={{ height: 32 }} />
    </HtmlScreen>
  );
};
