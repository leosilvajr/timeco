import { create } from 'zustand';
import {
  ScoreboardConfig,
  ScoreboardState,
  addPoint,
  createScoreboard,
  resetMatch,
  undoLastPoint,
} from '../services/scoreboardLogic';

interface ScoreboardStore {
  state: ScoreboardState | null;
  init: (config: ScoreboardConfig) => void;
  point: (team: 'A' | 'B') => void;
  undo: () => void;
  reset: () => void;
  swap: () => void;
  clear: () => void;
}

export const useScoreboardStore = create<ScoreboardStore>((set, get) => ({
  state: null,
  init: (config) => set({ state: createScoreboard(config) }),
  point: (team) => {
    const cur = get().state;
    if (!cur) return;
    set({ state: addPoint(cur, team) });
  },
  undo: () => {
    const cur = get().state;
    if (!cur) return;
    set({ state: undoLastPoint(cur) });
  },
  reset: () => {
    const cur = get().state;
    if (!cur) return;
    set({ state: resetMatch(cur) });
  },
  swap: () => {
    const cur = get().state;
    if (!cur) return;
    // Troca apenas a ordem visual: invertemos os nomes E os scores acumulados.
    // Mais simples: troca os nomes na config e inverte cada set.
    const newConfig: ScoreboardConfig = {
      ...cur.config,
      teamAName: cur.config.teamBName,
      teamBName: cur.config.teamAName,
    };
    const newSets = cur.sets.map((s) => ({
      ...s,
      a: s.b,
      b: s.a,
      winner: s.winner === 'A' ? ('B' as const) : s.winner === 'B' ? ('A' as const) : undefined,
    }));
    const newHistory = cur.history.map((h) => ({
      ...h,
      team: h.team === 'A' ? ('B' as const) : ('A' as const),
    }));
    set({
      state: {
        ...cur,
        config: newConfig,
        sets: newSets,
        history: newHistory,
        winner: cur.winner === 'A' ? 'B' : cur.winner === 'B' ? 'A' : undefined,
      },
    });
  },
  clear: () => set({ state: null }),
}));
