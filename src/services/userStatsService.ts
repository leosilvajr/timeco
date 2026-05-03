import { Event, SportId } from '../types';

export interface Badge {
  id: string;
  emoji: string;
  label: string;
  description: string;
}

export interface UserStats {
  totalEvents: number;
  asOrganizer: number;
  asPlayer: number;
  topSport: { id: SportId; count: number } | null;
  uniqueSports: number;
  drawnEvents: number;
  finishedEvents: number;
  badges: Badge[];
}

const BADGE_DEFS: Array<{
  id: string;
  emoji: string;
  label: string;
  description: string;
  test: (s: Omit<UserStats, 'badges'>) => boolean;
}> = [
  {
    id: 'first_step',
    emoji: '🌱',
    label: 'Primeiro passo',
    description: 'Participou do primeiro evento',
    test: (s) => s.totalEvents >= 1,
  },
  {
    id: 'veteran',
    emoji: '🏅',
    label: 'Veterano',
    description: 'Participou de 5 ou mais eventos',
    test: (s) => s.totalEvents >= 5,
  },
  {
    id: 'champion',
    emoji: '🏆',
    label: 'Atleta',
    description: 'Participou de 20 ou mais eventos',
    test: (s) => s.totalEvents >= 20,
  },
  {
    id: 'leader',
    emoji: '👑',
    label: 'Líder',
    description: 'Organizou 3 ou mais eventos',
    test: (s) => s.asOrganizer >= 3,
  },
  {
    id: 'commander',
    emoji: '⚔️',
    label: 'Comandante',
    description: 'Organizou 10 ou mais eventos',
    test: (s) => s.asOrganizer >= 10,
  },
  {
    id: 'multisport',
    emoji: '🌟',
    label: 'Multimodal',
    description: 'Já participou em 3 ou mais esportes diferentes',
    test: (s) => s.uniqueSports >= 3,
  },
  {
    id: 'completer',
    emoji: '✅',
    label: 'Conclusor',
    description: 'Já finalizou 5 ou mais eventos',
    test: (s) => s.finishedEvents >= 5,
  },
];

/**
 * Calcula estatísticas e conquistas de um usuário a partir da lista de
 * eventos relacionados a ele (organizados + convidados).
 *
 * Função pura — sem chamadas a banco. Recebe events já carregados.
 */
export const computeUserStats = (events: Event[], userId: string): UserStats => {
  let asOrganizer = 0;
  let asPlayer = 0;
  let drawnEvents = 0;
  let finishedEvents = 0;
  const sportCounts = new Map<SportId, number>();

  for (const ev of events) {
    if (ev.organizerId === userId) asOrganizer += 1;
    else asPlayer += 1;
    if (ev.status === 'teams_drawn' || ev.status === 'finished') drawnEvents += 1;
    if (ev.status === 'finished') finishedEvents += 1;
    sportCounts.set(ev.sport, (sportCounts.get(ev.sport) ?? 0) + 1);
  }

  const totalEvents = asOrganizer + asPlayer;
  let topSport: UserStats['topSport'] = null;
  for (const [sport, count] of sportCounts.entries()) {
    if (!topSport || count > topSport.count) topSport = { id: sport, count };
  }

  const baseStats: Omit<UserStats, 'badges'> = {
    totalEvents,
    asOrganizer,
    asPlayer,
    topSport,
    uniqueSports: sportCounts.size,
    drawnEvents,
    finishedEvents,
  };

  const badges: Badge[] = BADGE_DEFS.filter((b) => b.test(baseStats)).map(
    ({ id, emoji, label, description }) => ({ id, emoji, label, description }),
  );

  return { ...baseStats, badges };
};
