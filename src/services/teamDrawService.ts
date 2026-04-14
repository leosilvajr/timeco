import { DrawnTeam, User } from '../types';
import { teamColors } from '../constants/theme';

export interface PlayerWithRating {
  user: User;
  stars: number;
}

export interface DrawOptions {
  players: PlayerWithRating[];
  teamsCount: number;
  balanceByAge?: boolean;
  balanceByHeight?: boolean;
}

const calcAge = (birthDate?: string): number | null => {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
};

/**
 * Calcula o "peso" do jogador. Estrelas são sempre o fator dominante.
 * Altura e idade ajustam o peso com fatores suaves (~±0.5 estrela).
 */
const playerWeight = (p: PlayerWithRating, opts: DrawOptions): number => {
  let weight = p.stars;
  if (opts.balanceByHeight && p.user.heightCm) {
    // Altura 170 = neutro; +/- 0.025 por cm (cada 20cm = 0.5 estrela)
    weight += (p.user.heightCm - 170) * 0.025;
  }
  if (opts.balanceByAge) {
    const age = calcAge(p.user.birthDate);
    if (age != null) {
      // Idade 30 = neutro; penaliza extremos (< 15 e > 45) em até 0.5 estrela
      const penalty = Math.min(0.5, Math.abs(age - 30) * 0.02);
      weight -= penalty;
    }
  }
  return Number(weight.toFixed(3));
};

/**
 * Sorteia times balanceados por estrelas (snake draft após shuffle ponderado).
 * - Embaralha mantendo agrupamento por nível (jogadores de mesma estrela permutam)
 * - Distribui em serpentina entre times para balancear
 */
export const drawTeams = (opts: DrawOptions): DrawnTeam[] => {
  const { teamsCount } = opts;
  if (teamsCount < 2) throw new Error('Mínimo 2 times');
  if (opts.players.length < teamsCount) throw new Error('Jogadores insuficientes');

  // 1. Calcula peso e embaralha dentro de cada faixa de estrela
  const withWeight = opts.players.map((p) => ({ ...p, weight: playerWeight(p, opts) }));

  // Sort desc por peso
  withWeight.sort((a, b) => b.weight - a.weight);

  // Embaralhamento dentro do mesmo peso para variar resultado entre sorteios
  const grouped = new Map<number, typeof withWeight>();
  for (const p of withWeight) {
    const key = Math.round(p.weight * 2) / 2; // bucket de 0.5
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(p);
  }
  for (const [, list] of grouped) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
  }
  const ordered: typeof withWeight = [];
  const keys = Array.from(grouped.keys()).sort((a, b) => b - a);
  for (const k of keys) ordered.push(...grouped.get(k)!);

  // 2. Distribui em serpentina: 1,2,3...T,T,T-1...1,1,2,3...
  const teams: DrawnTeam[] = [];
  for (let i = 0; i < teamsCount; i++) {
    const tc = teamColors[i % teamColors.length];
    teams.push({ name: `Time ${tc.name}`, color: tc.color, playerIds: [], totalStars: 0 });
  }

  let dir = 1;
  let idx = 0;
  for (let i = 0; i < ordered.length; i++) {
    const p = ordered[i];
    teams[idx].playerIds.push(p.user.id);
    teams[idx].totalStars = Number((teams[idx].totalStars + p.stars).toFixed(2));
    idx += dir;
    if (idx === teamsCount) {
      idx = teamsCount - 1;
      dir = -1;
    } else if (idx === -1) {
      idx = 0;
      dir = 1;
    }
  }

  return teams;
};
