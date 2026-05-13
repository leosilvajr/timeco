/**
 * Cache em memoria com TTL pras listas de partidas e times de volei.
 *
 * Motivacao: VolleyHome e Dashboard sao recarregados toda vez que ganham
 * foco (useFocusEffect). Sem cache, cada navegacao gera 1+ reads do
 * Firestore — custo de latencia (200-500ms em 4G) e custo monetario
 * (Spark plan tem limite).
 *
 * Com TTL de 30s: navegar entre Home → Dashboard → Home reaproveita o
 * fetch anterior. Quando o usuario cria/apaga partida, chamamos
 * invalidate() pra forcar o proximo fetch.
 *
 * Nao usamos Zustand aqui porque:
 * - State global vira foot-gun rapido (multiplas usuarios na mesma sessao?)
 * - Modulo-level cache e mais simples e suficiente
 * - Invalidate explicito > stale-while-revalidate pra cargas pequenas
 */

import {
  listUserVolleyMatches as _listUserVolleyMatches,
} from './volleyScoutService';
import { listUserVolleyTeams as _listUserVolleyTeams } from './volleyTeamService';
import { VolleyMatch, VolleyTeam } from '../types';

const TTL_MS = 30_000;

interface CacheEntry<T> {
  data: T;
  ts: number;
}

const matchListCache = new Map<string, CacheEntry<VolleyMatch[]>>();
const teamListCache = new Map<string, CacheEntry<VolleyTeam[]>>();
const inflight = new Map<string, Promise<unknown>>();

const isStale = (entry: CacheEntry<unknown> | undefined): boolean => {
  if (!entry) return true;
  return Date.now() - entry.ts > TTL_MS;
};

export const listUserVolleyMatchesCached = async (
  ownerId: string,
): Promise<VolleyMatch[]> => {
  const cached = matchListCache.get(ownerId);
  if (!isStale(cached)) return cached!.data;

  // Dedupe in-flight: se ja tem um fetch pendente pro mesmo owner, reusa
  const inflightKey = `matches:${ownerId}`;
  const existing = inflight.get(inflightKey);
  if (existing) return existing as Promise<VolleyMatch[]>;

  const promise = _listUserVolleyMatches(ownerId)
    .then((data) => {
      matchListCache.set(ownerId, { data, ts: Date.now() });
      return data;
    })
    .finally(() => {
      inflight.delete(inflightKey);
    });
  inflight.set(inflightKey, promise);
  return promise;
};

export const listUserVolleyTeamsCached = async (
  ownerId: string,
): Promise<VolleyTeam[]> => {
  const cached = teamListCache.get(ownerId);
  if (!isStale(cached)) return cached!.data;

  const inflightKey = `teams:${ownerId}`;
  const existing = inflight.get(inflightKey);
  if (existing) return existing as Promise<VolleyTeam[]>;

  const promise = _listUserVolleyTeams(ownerId)
    .then((data) => {
      teamListCache.set(ownerId, { data, ts: Date.now() });
      return data;
    })
    .finally(() => {
      inflight.delete(inflightKey);
    });
  inflight.set(inflightKey, promise);
  return promise;
};

/** Invalida cache de partidas — chamar apos criar/apagar/finalizar. */
export const invalidateVolleyMatchesCache = (ownerId: string): void => {
  matchListCache.delete(ownerId);
};

/** Invalida cache de times — chamar apos criar/editar/apagar time. */
export const invalidateVolleyTeamsCache = (ownerId: string): void => {
  teamListCache.delete(ownerId);
};

/** Limpa todos os caches — util em logout. */
export const clearVolleyCaches = (): void => {
  matchListCache.clear();
  teamListCache.clear();
  inflight.clear();
};

/**
 * Aplica patch otimista numa partida especifica do cache da lista.
 * Util quando o user finaliza/edita uma partida — a lista cacheada
 * continua valida, so precisa atualizar 1 item.
 */
export const updateMatchInCache = (
  ownerId: string,
  matchId: string,
  patch: Partial<VolleyMatch>,
): void => {
  const cached = matchListCache.get(ownerId);
  if (!cached) return;
  const idx = cached.data.findIndex((m) => m.id === matchId);
  if (idx < 0) return;
  cached.data[idx] = { ...cached.data[idx], ...patch };
};

/** Remove uma partida do cache (em vez de invalidar tudo). */
export const removeMatchFromCache = (
  ownerId: string,
  matchId: string,
): void => {
  const cached = matchListCache.get(ownerId);
  if (!cached) return;
  cached.data = cached.data.filter((m) => m.id !== matchId);
};
