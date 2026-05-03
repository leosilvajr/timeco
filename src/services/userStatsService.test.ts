import { computeUserStats } from './userStatsService';
import { Event, SportId } from '../types';

const baseEvent = (overrides: Partial<Event>): Event =>
  ({
    id: overrides.id ?? 'e1',
    organizerId: 'someone',
    organizerName: 'Org',
    title: 'Pelada',
    sport: 'soccer',
    location: 'Quadra',
    scheduledAt: null,
    playersPerTeam: 5,
    teamsCount: 2,
    balanceByAge: false,
    balanceByHeight: false,
    invitedUserIds: [],
    confirmations: {},
    status: 'open',
    notes: '',
    createdAt: null,
    ...overrides,
  } as unknown as Event);

const makeEvents = (specs: Array<{ organizerId: string; sport?: SportId; status?: Event['status'] }>): Event[] =>
  specs.map((s, i) =>
    baseEvent({
      id: `e${i}`,
      organizerId: s.organizerId,
      sport: s.sport ?? 'soccer',
      status: s.status ?? 'open',
    }),
  );

describe('computeUserStats', () => {
  const ME = 'user_me';

  it('lista vazia → totalEvents 0 e zero badges', () => {
    const stats = computeUserStats([], ME);
    expect(stats.totalEvents).toBe(0);
    expect(stats.badges).toEqual([]);
  });

  it('separa organizador vs jogador', () => {
    const events = makeEvents([
      { organizerId: ME, sport: 'soccer' },
      { organizerId: ME, sport: 'volleyball' },
      { organizerId: 'outra', sport: 'soccer' },
      { organizerId: 'outra', sport: 'soccer' },
    ]);
    const stats = computeUserStats(events, ME);
    expect(stats.totalEvents).toBe(4);
    expect(stats.asOrganizer).toBe(2);
    expect(stats.asPlayer).toBe(2);
  });

  it('detecta esporte top corretamente', () => {
    const events = makeEvents([
      { organizerId: ME, sport: 'soccer' },
      { organizerId: ME, sport: 'soccer' },
      { organizerId: 'x', sport: 'soccer' },
      { organizerId: ME, sport: 'volleyball' },
    ]);
    const stats = computeUserStats(events, ME);
    expect(stats.topSport).toEqual({ id: 'soccer', count: 3 });
  });

  it('conta esportes únicos (não duplicado)', () => {
    const events = makeEvents([
      { organizerId: ME, sport: 'soccer' },
      { organizerId: ME, sport: 'volleyball' },
      { organizerId: ME, sport: 'basketball' },
      { organizerId: ME, sport: 'soccer' },
    ]);
    const stats = computeUserStats(events, ME);
    expect(stats.uniqueSports).toBe(3);
  });

  it('badge "Primeiro passo" desbloqueia com 1 evento', () => {
    const events = makeEvents([{ organizerId: ME }]);
    const stats = computeUserStats(events, ME);
    expect(stats.badges.map((b) => b.id)).toContain('first_step');
  });

  it('badge "Veterano" desbloqueia com 5 eventos', () => {
    const events = makeEvents(Array(5).fill({ organizerId: ME }));
    const stats = computeUserStats(events, ME);
    const ids = stats.badges.map((b) => b.id);
    expect(ids).toContain('veteran');
    expect(ids).not.toContain('champion');
  });

  it('badge "Atleta" desbloqueia com 20 eventos', () => {
    const events = makeEvents(Array(20).fill({ organizerId: ME }));
    const stats = computeUserStats(events, ME);
    const ids = stats.badges.map((b) => b.id);
    expect(ids).toContain('champion');
    expect(ids).toContain('veteran');
    expect(ids).toContain('first_step');
  });

  it('badge "Líder" desbloqueia com 3 eventos organizados', () => {
    const events = makeEvents([
      { organizerId: ME },
      { organizerId: ME },
      { organizerId: ME },
      { organizerId: 'x' },
    ]);
    const stats = computeUserStats(events, ME);
    expect(stats.badges.map((b) => b.id)).toContain('leader');
  });

  it('badge "Multimodal" desbloqueia com 3 esportes diferentes', () => {
    const events = makeEvents([
      { organizerId: ME, sport: 'soccer' },
      { organizerId: ME, sport: 'volleyball' },
      { organizerId: ME, sport: 'basketball' },
    ]);
    const stats = computeUserStats(events, ME);
    expect(stats.badges.map((b) => b.id)).toContain('multisport');
  });

  it('badge "Conclusor" desbloqueia com 5 eventos finalizados', () => {
    const events = makeEvents(
      Array(5).fill({ organizerId: ME, status: 'finished' as const }),
    );
    const stats = computeUserStats(events, ME);
    expect(stats.badges.map((b) => b.id)).toContain('completer');
  });

  it('drawnEvents conta teams_drawn + finished', () => {
    const events = makeEvents([
      { organizerId: ME, status: 'open' },
      { organizerId: ME, status: 'teams_drawn' },
      { organizerId: ME, status: 'finished' },
      { organizerId: ME, status: 'cancelled' },
    ]);
    const stats = computeUserStats(events, ME);
    expect(stats.drawnEvents).toBe(2);
    expect(stats.finishedEvents).toBe(1);
  });
});
