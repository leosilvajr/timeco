import { formatEventTeams, formatQuickTeams } from './teamShareText';
import { Event, User } from '../types';

const baseUser = (id: string, name: string): User =>
  ({ id, name, email: `${id}@x.com` } as User);

const baseEvent = (overrides: Partial<Event> = {}): Event =>
  ({
    id: 'ev1',
    organizerId: 'u1',
    organizerName: 'Org',
    title: 'Pelada de Quarta',
    sport: 'soccer',
    location: 'Quadra do bairro',
    scheduledAt: new Date('2026-05-13T19:00:00-03:00'),
    playersPerTeam: 5,
    teamsCount: 2,
    balanceByAge: false,
    balanceByHeight: false,
    invitedUserIds: ['u2', 'u3'],
    confirmations: {},
    status: 'teams_drawn',
    notes: '',
    teams: [
      { name: 'Time Verde', color: '#0F9D58', playerIds: ['u1', 'u2'], totalStars: 7 },
      { name: 'Time Azul', color: '#4285F4', playerIds: ['u3'], totalStars: 4 },
    ],
    ...overrides,
  } as unknown as Event);

describe('formatEventTeams', () => {
  const users: Record<string, User> = {
    u1: baseUser('u1', 'João'),
    u2: baseUser('u2', 'Carlos'),
    u3: baseUser('u3', 'Pedro'),
  };

  it('inclui título, esporte, data e local', () => {
    const txt = formatEventTeams(baseEvent(), users, true);
    expect(txt).toContain('Pelada de Quarta');
    expect(txt).toContain('⚽'); // emoji de futebol
    expect(txt).toContain('Quadra do bairro');
  });

  it('mostra estrelas agregadas quando organizador', () => {
    const txt = formatEventTeams(baseEvent(), users, true);
    expect(txt).toContain('7.0⭐'); // total
    expect(txt).toContain('média 3.5'); // 7/2
    expect(txt).toContain('média 4.0'); // 4/1
  });

  it('NÃO mostra estrelas quando não é organizador', () => {
    const txt = formatEventTeams(baseEvent(), users, false);
    expect(txt).not.toContain('⭐');
    expect(txt).not.toContain('média');
    expect(txt).toContain('2 jogadores');
    expect(txt).toContain('1 jogadores');
  });

  it('inclui branding do Timeco no rodapé', () => {
    const txt = formatEventTeams(baseEvent(), users, false);
    expect(txt).toContain('Timeco');
    expect(txt).toContain('https://timeco.com.br');
  });

  it('lista todos os jogadores de cada time pelo nome', () => {
    const txt = formatEventTeams(baseEvent(), users, true);
    expect(txt).toContain('João');
    expect(txt).toContain('Carlos');
    expect(txt).toContain('Pedro');
  });

  it('aceita scheduledAt nulo sem quebrar', () => {
    const ev = baseEvent({ scheduledAt: null });
    expect(() => formatEventTeams(ev, users, false)).not.toThrow();
  });
});

describe('formatQuickTeams', () => {
  const teams = [
    {
      name: 'Time Verde',
      players: [
        { name: 'João', stars: 4 },
        { name: 'Carlos', stars: 3 },
      ],
      totalStars: 7,
    },
    {
      name: 'Time Azul',
      players: [{ name: 'Pedro', stars: 4 }],
      totalStars: 4,
    },
  ];

  it('inclui label e emoji do esporte se passados', () => {
    const txt = formatQuickTeams(teams, { sportEmoji: '⚽', sportLabel: 'Futebol' });
    expect(txt).toContain('Sorteio rápido');
    expect(txt).toContain('Futebol');
    expect(txt).toContain('⚽');
  });

  it('lista jogadores de cada time', () => {
    const txt = formatQuickTeams(teams, {});
    expect(txt).toContain('João');
    expect(txt).toContain('Carlos');
    expect(txt).toContain('Pedro');
  });

  it('mostra estrelas agregadas quando totalStars passado', () => {
    const txt = formatQuickTeams(teams, {});
    expect(txt).toContain('7.0⭐');
    expect(txt).toContain('média 3.5');
  });

  it('inclui branding do Timeco', () => {
    const txt = formatQuickTeams(teams, {});
    expect(txt).toContain('Timeco');
    expect(txt).toContain('https://timeco.com.br');
  });
});
