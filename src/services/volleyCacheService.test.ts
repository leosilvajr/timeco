/**
 * Testes caixa-branca do cache TTL — usa jest.mock pras dependencias
 * (volleyScoutService.listUserVolleyMatches, volleyTeamService.
 * listUserVolleyTeams) e valida:
 *
 * - TTL: cache hit dentro da janela, cache miss apos expirar
 * - Dedupe in-flight: 2 chamadas paralelas viram 1 fetch real
 * - Invalidate: forca proximo fetch
 * - clearVolleyCaches: zera estado entre testes
 */

import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import type { VolleyMatch, VolleyTeam } from '../types';

// Mock antes de importar o cache (que importa as dependencias)
const mockListMatches = jest.fn<(ownerId: string) => Promise<VolleyMatch[]>>();
const mockListTeams = jest.fn<(ownerId: string) => Promise<VolleyTeam[]>>();

jest.mock('./volleyScoutService', () => ({
  listUserVolleyMatches: (ownerId: string) => mockListMatches(ownerId),
}));

jest.mock('./volleyTeamService', () => ({
  listUserVolleyTeams: (ownerId: string) => mockListTeams(ownerId),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const cache = require('./volleyCacheService');

const fakeMatch = (id: string, status: VolleyMatch['status'] = 'in_progress'): VolleyMatch => ({
  id,
  ownerId: 'u1',
  date: '2026-01-01',
  location: 'x',
  teamAName: 'A',
  teamBName: 'B',
  format: 3,
  rotationSystem: '5x1',
  status,
  currentSet: 1,
  players: [],
  sets: [],
  initialRotation: [],
  currentRotation: [],
  rotationCount: 0,
  pointsCount: 0,
  serveTeam: 'A',
  pointHistory: [],
  createdAt: null,
  updatedAt: null,
});

const fakeTeam = (id: string): VolleyTeam => ({
  id,
  ownerId: 'u1',
  name: `time-${id}`,
  players: [],
  createdAt: null,
  updatedAt: null,
});

beforeEach(() => {
  mockListMatches.mockReset();
  mockListTeams.mockReset();
  cache.clearVolleyCaches();
});

describe('listUserVolleyMatchesCached', () => {
  it('faz fetch real na primeira chamada', async () => {
    mockListMatches.mockResolvedValue([fakeMatch('m1')]);
    const result = await cache.listUserVolleyMatchesCached('u1');
    expect(mockListMatches).toHaveBeenCalledTimes(1);
    expect(mockListMatches).toHaveBeenCalledWith('u1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('m1');
  });

  it('cache hit na 2a chamada dentro da janela TTL', async () => {
    mockListMatches.mockResolvedValue([fakeMatch('m1')]);
    await cache.listUserVolleyMatchesCached('u1');
    await cache.listUserVolleyMatchesCached('u1');
    expect(mockListMatches).toHaveBeenCalledTimes(1);
  });

  it('cache separado por ownerId — fetches diferentes pra users diferentes', async () => {
    mockListMatches.mockImplementation(async (ownerId: string) => [
      fakeMatch(`${ownerId}-m1`),
    ]);
    const a = await cache.listUserVolleyMatchesCached('u1');
    const b = await cache.listUserVolleyMatchesCached('u2');
    expect(mockListMatches).toHaveBeenCalledTimes(2);
    expect(a[0].id).toBe('u1-m1');
    expect(b[0].id).toBe('u2-m1');
  });

  it('invalidateVolleyMatchesCache forca refetch', async () => {
    mockListMatches.mockResolvedValue([fakeMatch('m1')]);
    await cache.listUserVolleyMatchesCached('u1');
    cache.invalidateVolleyMatchesCache('u1');
    await cache.listUserVolleyMatchesCached('u1');
    expect(mockListMatches).toHaveBeenCalledTimes(2);
  });

  it('dedupe in-flight: 2 chamadas paralelas viram 1 fetch', async () => {
    let resolveFn: (v: VolleyMatch[]) => void = () => undefined;
    mockListMatches.mockImplementation(
      () =>
        new Promise<VolleyMatch[]>((res) => {
          resolveFn = res;
        }),
    );

    const p1 = cache.listUserVolleyMatchesCached('u1');
    const p2 = cache.listUserVolleyMatchesCached('u1');

    // Resolve depois das 2 ja terem disparado
    resolveFn([fakeMatch('m1')]);
    const [r1, r2] = await Promise.all([p1, p2]);

    expect(mockListMatches).toHaveBeenCalledTimes(1);
    expect(r1).toBe(r2); // mesma referencia
  });

  it('clearVolleyCaches zera ambos os caches', async () => {
    mockListMatches.mockResolvedValue([fakeMatch('m1')]);
    mockListTeams.mockResolvedValue([fakeTeam('t1')]);
    await cache.listUserVolleyMatchesCached('u1');
    await cache.listUserVolleyTeamsCached('u1');
    cache.clearVolleyCaches();

    await cache.listUserVolleyMatchesCached('u1');
    await cache.listUserVolleyTeamsCached('u1');
    expect(mockListMatches).toHaveBeenCalledTimes(2);
    expect(mockListTeams).toHaveBeenCalledTimes(2);
  });
});

describe('listUserVolleyTeamsCached', () => {
  it('mesma logica de TTL', async () => {
    mockListTeams.mockResolvedValue([fakeTeam('t1')]);
    await cache.listUserVolleyTeamsCached('u1');
    await cache.listUserVolleyTeamsCached('u1');
    expect(mockListTeams).toHaveBeenCalledTimes(1);
  });

  it('invalidateVolleyTeamsCache forca refetch', async () => {
    mockListTeams.mockResolvedValue([fakeTeam('t1')]);
    await cache.listUserVolleyTeamsCached('u1');
    cache.invalidateVolleyTeamsCache('u1');
    await cache.listUserVolleyTeamsCached('u1');
    expect(mockListTeams).toHaveBeenCalledTimes(2);
  });
});

describe('updateMatchInCache (otimista)', () => {
  it('atualiza match dentro do cache sem refetch', async () => {
    mockListMatches.mockResolvedValue([
      fakeMatch('m1', 'in_progress'),
      fakeMatch('m2', 'in_progress'),
    ]);
    await cache.listUserVolleyMatchesCached('u1');

    cache.updateMatchInCache('u1', 'm1', { status: 'finished' });

    const result = await cache.listUserVolleyMatchesCached('u1');
    expect(mockListMatches).toHaveBeenCalledTimes(1); // sem refetch
    expect(result.find((m: VolleyMatch) => m.id === 'm1')?.status).toBe('finished');
    expect(result.find((m: VolleyMatch) => m.id === 'm2')?.status).toBe('in_progress');
  });

  it('no-op se cache nao existe pra esse owner', () => {
    expect(() => cache.updateMatchInCache('u-vazio', 'm1', { status: 'finished' })).not.toThrow();
  });

  it('no-op se matchId nao esta no cache', async () => {
    mockListMatches.mockResolvedValue([fakeMatch('m1')]);
    await cache.listUserVolleyMatchesCached('u1');
    cache.updateMatchInCache('u1', 'inexistente', { status: 'finished' });
    const result = await cache.listUserVolleyMatchesCached('u1');
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('in_progress');
  });
});

describe('removeMatchFromCache (delete otimista)', () => {
  it('remove match do cache sem refetch', async () => {
    mockListMatches.mockResolvedValue([fakeMatch('m1'), fakeMatch('m2'), fakeMatch('m3')]);
    await cache.listUserVolleyMatchesCached('u1');

    cache.removeMatchFromCache('u1', 'm2');

    const result = await cache.listUserVolleyMatchesCached('u1');
    expect(mockListMatches).toHaveBeenCalledTimes(1);
    expect(result.map((m: VolleyMatch) => m.id)).toEqual(['m1', 'm3']);
  });

  it('no-op se matchId nao esta no cache', async () => {
    mockListMatches.mockResolvedValue([fakeMatch('m1')]);
    await cache.listUserVolleyMatchesCached('u1');
    cache.removeMatchFromCache('u1', 'inexistente');
    const result = await cache.listUserVolleyMatchesCached('u1');
    expect(result).toHaveLength(1);
  });
});
