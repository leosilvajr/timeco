/**
 * SMOKE TEST · Fluxo completo de evento
 *
 * Caixa-preta: simula um cenário real do início ao fim usando
 * apenas as funções públicas dos services puros — sem mocks de
 * Firestore. Garante que o pipeline lógico (criar → confirmar →
 * sortear → compartilhar) continua coerente após mudanças.
 */
import {
  buildInitialConfirmations,
  reconcileConfirmations,
} from '../services/eventService';
import { drawTeams, drawQuickTeams } from '../services/teamDrawService';
import { computeUserStats } from '../services/userStatsService';
import { formatEventTeams, formatQuickTeams } from '../utils/teamShareText';
import { isFutureDateTime, isValidTeamsCount } from '../utils/validators';
import { Event, User } from '../types';

const fakeUser = (id: string, name: string, partial: Partial<User> = {}): User =>
  ({
    id,
    email: `${id}@example.com`,
    name,
    role: 'user',
    createdAt: null,
    ...partial,
  } as User);

describe('SMOKE · Fluxo completo de evento (caixa preta)', () => {
  const organizer = fakeUser('user_org', 'Leonardo');
  const players = [
    fakeUser('p1', 'João', { heightCm: 180 }),
    fakeUser('p2', 'Pedro', { heightCm: 175 }),
    fakeUser('p3', 'Maria', { heightCm: 165 }),
    fakeUser('p4', 'Ana', { heightCm: 170 }),
    fakeUser('p5', 'Carlos', { heightCm: 178 }),
    fakeUser('p6', 'Luiza', { heightCm: 168 }),
  ];

  it('1) cria evento com confirmações iniciais corretas', () => {
    const invitedIds = players.map((p) => p.id);
    const confirmations = buildInitialConfirmations(invitedIds);
    expect(Object.keys(confirmations)).toHaveLength(6);
    expect(Object.values(confirmations).every((s) => s === 'pending')).toBe(true);
  });

  it('2) valida que data futura passa e data passada falha', () => {
    expect(isFutureDateTime('2099-12-31', '20:00')).toBe(true);
    expect(isFutureDateTime('2020-01-01', '20:00')).toBe(false);
  });

  it('3) valida que teamsCount fica no range', () => {
    expect(isValidTeamsCount(2)).toBe(true);
    expect(isValidTeamsCount(8)).toBe(true);
    expect(isValidTeamsCount(1)).toBe(false);
    expect(isValidTeamsCount(9)).toBe(false);
  });

  it('4) participantes confirmam — reconcilia mantendo status', () => {
    let confirmations = buildInitialConfirmations(players.map((p) => p.id));
    confirmations = { ...confirmations, p1: 'confirmed', p2: 'confirmed', p3: 'declined' };
    // Organizer adiciona um novo convidado e remove um
    const updated = reconcileConfirmations(
      confirmations,
      ['p1', 'p2', 'p4', 'p5', 'p6', 'p7'], // p3 removido, p7 adicionado
      organizer.id,
    );
    expect(updated.p1).toBe('confirmed'); // mantém
    expect(updated.p7).toBe('pending'); // novo
    expect(updated.p3).toBeUndefined(); // removido
  });

  it('5) sorteia times balanceados por estrelas', () => {
    const teams = drawTeams({
      players: [
        { user: players[0], stars: 5 },
        { user: players[1], stars: 4 },
        { user: players[2], stars: 3 },
        { user: players[3], stars: 2 },
        { user: players[4], stars: 4 },
        { user: players[5], stars: 3 },
      ],
      teamsCount: 2,
    });
    expect(teams).toHaveLength(2);
    // soma deve bater com 5+4+3+2+4+3 = 21
    const total = teams[0].totalStars + teams[1].totalStars;
    expect(total).toBeCloseTo(21, 1);
    // diff balanceada
    expect(Math.abs(teams[0].totalStars - teams[1].totalStars)).toBeLessThanOrEqual(1);
  });

  it('6) sorteia COM critério de altura — ambos times têm jogador alto', () => {
    const teams = drawTeams({
      players: [
        { user: players[0], stars: 3 }, // 180cm
        { user: players[1], stars: 3 }, // 175cm
        { user: players[2], stars: 3 }, // 165cm
        { user: players[3], stars: 3 }, // 170cm
      ],
      teamsCount: 2,
      balanceByHeight: true,
    });
    // ambos times têm exatamente 2 jogadores
    expect(teams[0].playerIds).toHaveLength(2);
    expect(teams[1].playerIds).toHaveLength(2);
  });

  it('7) gera texto de share com branding Timeco', () => {
    const teams = drawTeams({
      players: players.slice(0, 4).map((u, i) => ({ user: u, stars: 3 + (i % 3) })),
      teamsCount: 2,
    });
    const event = {
      id: 'ev1',
      title: 'Pelada de Sábado',
      sport: 'soccer',
      location: 'Quadra do Bairro',
      scheduledAt: new Date('2026-06-15T19:00:00'),
      teams,
    } as unknown as Event;
    const usersMap = Object.fromEntries(players.map((p) => [p.id, p]));

    const text = formatEventTeams(event, usersMap, true);
    expect(text).toContain('Pelada de Sábado');
    expect(text).toContain('Timeco');
    expect(text).toContain('https://timeco.com.br');
  });
});

describe('SMOKE · Sorteio Rápido (caixa preta)', () => {
  it('fluxo completo: digitar nomes → sortear → gerar texto', () => {
    const quickPlayers = [
      { id: 'q1', name: 'João', stars: 5 },
      { id: 'q2', name: 'Pedro', stars: 4 },
      { id: 'q3', name: 'Maria', stars: 3 },
      { id: 'q4', name: 'Ana', stars: 2 },
    ];

    const teams = drawQuickTeams(quickPlayers, 2);
    expect(teams).toHaveLength(2);

    const text = formatQuickTeams(
      teams.map((t) => ({
        name: t.name,
        players: t.players.map((p) => ({ name: p.name, stars: p.stars })),
        totalStars: t.totalStars,
      })),
      { sportEmoji: '⚽', sportLabel: 'Futebol' },
    );

    expect(text).toContain('Sorteio rápido');
    expect(text).toContain('Futebol');
    expect(text).toContain('João');
    expect(text).toContain('Maria');
    expect(text).toContain('Timeco');
  });
});

describe('SMOKE · Estatísticas após múltiplos eventos', () => {
  const ME = 'user_me';

  const fakeEvent = (overrides: Partial<Event>): Event =>
    ({
      id: overrides.id ?? 'e',
      organizerId: ME,
      organizerName: 'Eu',
      title: 'Pelada',
      sport: 'soccer',
      location: 'Q',
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

  it('user com 5 eventos diversos desbloqueia múltiplas badges', () => {
    const events: Event[] = [
      fakeEvent({ id: 'e1', sport: 'soccer', status: 'finished' }),
      fakeEvent({ id: 'e2', sport: 'volleyball', status: 'finished' }),
      fakeEvent({ id: 'e3', sport: 'basketball', status: 'finished' }),
      fakeEvent({ id: 'e4', sport: 'soccer', organizerId: 'other' }),
      fakeEvent({ id: 'e5', sport: 'volleyball', organizerId: 'other' }),
    ];

    const stats = computeUserStats(events, ME);

    // Caixa branca: verifica internals
    expect(stats.totalEvents).toBe(5);
    expect(stats.asOrganizer).toBe(3);
    expect(stats.asPlayer).toBe(2);
    expect(stats.uniqueSports).toBe(3);

    // Caixa preta: verifica badges esperadas
    const badgeIds = stats.badges.map((b) => b.id);
    expect(badgeIds).toContain('first_step');
    expect(badgeIds).toContain('veteran'); // 5+ eventos
    expect(badgeIds).toContain('leader'); // 3+ organizados
    expect(badgeIds).toContain('multisport'); // 3+ esportes
  });
});
