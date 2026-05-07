import React, { useCallback, useEffect, useState } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  HtmlScreen,
  HtmlHeader,
  HtmlCard,
  HtmlButton,
  HtmlAvatar,
} from '../../components/web';
import { useAuthStore, useThemedColors } from '../../store';
import {
  getEventById,
  listEventRatings,
  setPlayerRating,
  saveDrawnTeams,
} from '../../services/eventService';
import { getUsersByIds } from '../../services/userService';
import { drawTeams } from '../../services/teamDrawService';
import { formatError } from '../../utils/errorMessages';
import { Event, User } from '../../types';
import type { EventsStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<EventsStackParamList, 'RatePlayers'>;
type Rt = RouteProp<EventsStackParamList, 'RatePlayers'>;

const StarPicker: React.FC<{ value: number; onChange: (v: number) => void }> = ({
  value,
  onChange,
}) => {
  const c = useThemedColors();
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            fontSize: 28,
            color: n <= value ? c.star : c.starEmpty,
            lineHeight: 1,
            fontFamily: 'inherit',
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
};

export const RatePlayersScreen: React.FC = () => {
  const c = useThemedColors();
  const route = useRoute<Rt>();
  const nav = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const [event, setEvent] = useState<Event | null>(null);
  const [players, setPlayers] = useState<User[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const e = await getEventById(route.params.eventId);
    if (!e) return;
    setEvent(e);
    const allCandidateIds = [
      e.organizerId,
      ...e.invitedUserIds.filter((id) => id !== e.organizerId),
    ];
    const confirmedIds = allCandidateIds.filter((id) => e.confirmations?.[id] === 'confirmed');
    const candidateIds = confirmedIds.length > 0 ? confirmedIds : allCandidateIds;
    const us = await getUsersByIds(candidateIds);
    setPlayers(us);
    const existing = await listEventRatings(e.id);
    const map: Record<string, number> = {};
    for (const r of existing) map[r.playerUserId] = r.stars;
    for (const u of us) if (map[u.id] == null) map[u.id] = 3;
    setRatings(map);
    setLoading(false);
  }, [route.params.eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const setStars = async (uid: string, stars: number) => {
    setRatings((prev) => ({ ...prev, [uid]: stars }));
    if (event && user) {
      try {
        await setPlayerRating(event.id, uid, stars, user.id);
      } catch (e) {
        console.warn('rate save', e);
      }
    }
  };

  const onDraw = async () => {
    setError(null);
    if (!event) return;
    if (players.length < event.teamsCount) {
      setError(`Precisamos de pelo menos ${event.teamsCount} jogadores pra montar os times.`);
      return;
    }
    setDrawing(true);
    try {
      const teams = drawTeams({
        players: players.map((u) => ({ user: u, stars: ratings[u.id] ?? 3 })),
        teamsCount: event.teamsCount,
        balanceByAge: event.balanceByAge,
        balanceByHeight: event.balanceByHeight,
        balanceByWeight: event.balanceByWeight ?? false,
      });
      await saveDrawnTeams(event.id, teams);
      nav.replace('DrawResult', { eventId: event.id });
    } catch (e: unknown) {
      setError(formatError(e, 'Não conseguimos sortear os times agora. Tente de novo.'));
    } finally {
      setDrawing(false);
    }
  };

  if (loading || !event) {
    return (
      <HtmlScreen>
        <HtmlHeader title="Carregando..." onBack={() => nav.goBack()} />
      </HtmlScreen>
    );
  }

  return (
    <HtmlScreen maxWidth={720}>
      <HtmlHeader title="Definir estrelas" onBack={() => nav.goBack()} subtitle={event.title} />

      <HtmlCard style={{ background: c.surfaceVariant }}>
        <p style={{ fontSize: 13, color: c.text, lineHeight: 1.5, margin: 0 }}>
          Como organizador, você define o nível de cada jogador (1 a 5 estrelas). Use isso como
          base pro sorteio equilibrado.
        </p>
      </HtmlCard>

      {players.length === 0 ? (
        <HtmlCard>
          <p style={{ color: c.textSecondary, textAlign: 'center', margin: 0 }}>
            Ninguém confirmou e o evento não tem convidados pra avaliar.
          </p>
        </HtmlCard>
      ) : (
        players.map((p) => (
          <HtmlCard key={p.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <HtmlAvatar name={p.name} photoURL={p.photoURL} size={42} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: c.text }}>{p.name}</div>
                <div style={{ marginTop: 4 }}>
                  <StarPicker value={ratings[p.id] ?? 3} onChange={(v) => setStars(p.id, v)} />
                </div>
              </div>
            </div>
          </HtmlCard>
        ))
      )}

      {error ? (
        <p style={{ color: c.danger, margin: '12px 0', textAlign: 'center' }}>{error}</p>
      ) : null}

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <HtmlButton title="🎲 Sortear times" onClick={onDraw} loading={drawing} />
        <HtmlButton
          title="Cancelar"
          variant="ghost"
          onClick={() => nav.popToTop()}
          disabled={drawing}
        />
      </div>
      <div style={{ height: 32 }} />
    </HtmlScreen>
  );
};
