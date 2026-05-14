/**
 * Pre-fetch das listas que o usuario costuma usar offline. Roda apos login
 * e quando volta online (best-effort, silencioso se falhar).
 *
 * Por que: Firestore offline persistence so devolve docs/queries que
 * passaram pelo cache em algum momento. Sem pre-fetch, a primeira
 * navegacao offline (ex.: abre VolleyHome no ginasio sem wifi) falha
 * porque a query nunca rodou antes.
 *
 * Roda em paralelo, ignora erros, nao bloqueia a UI.
 */

import {
  listUserVolleyMatchesCached,
  listUserVolleyTeamsCached,
} from './volleyCacheService';
import { listEventsForUser } from './eventService';

export const prefetchOfflineData = async (userId: string): Promise<void> => {
  // Promise.allSettled pra nao deixar uma falha cancelar as outras.
  await Promise.allSettled([
    listUserVolleyMatchesCached(userId),
    listUserVolleyTeamsCached(userId),
    listEventsForUser(userId),
  ]);
};
