/**
 * Helpers internos compartilhados pelos services do scout de volei.
 * Nao exportar nada que nao seja realmente reusado fora do pacote
 * src/services/volley/ pra manter o escopo enxuto.
 */

import { emptyPlayerStats } from '../volleyStats';
import {
  PlayerVolleyStats,
  VolleyPlayer,
  VolleySetData,
} from '../../types';

export const buildEmptySet = (
  setNumber: number,
  players: VolleyPlayer[],
): VolleySetData => {
  const playerStats: Record<number, PlayerVolleyStats> = {};
  for (const p of players) playerStats[p.number] = emptyPlayerStats();
  return {
    number: setNumber,
    scoreA: 0,
    scoreB: 0,
    finished: false,
    playerStats,
  };
};

export const todayISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Deep clone do array de sets pra que mutacoes nao vazem pro state da UI.
 * Usado antes de patches que precisam mexer em campos aninhados.
 */
export const cloneSets = (sets: VolleySetData[]): VolleySetData[] =>
  sets.map((s) => ({
    ...s,
    playerStats: Object.fromEntries(
      Object.entries(s.playerStats).map(([k, v]) => [
        k,
        {
          ...v,
          attacks: { ...v.attacks },
          serves: { ...v.serves },
          blocks: { ...v.blocks },
          passes: { ...v.passes },
          sets: { ...v.sets },
        },
      ]),
    ),
  }));
