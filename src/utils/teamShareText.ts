import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Event, User } from '../types';
import { getSport } from '../constants/sports';

const formatDate = (raw: Event['scheduledAt']): string | null => {
  if (!raw) return null;
  const date =
    raw instanceof Date ? raw : (raw as Timestamp)?.toDate ? (raw as Timestamp).toDate() : null;
  if (!date) return null;
  return format(date, "EEEE, dd/MM 'às' HH'h'mm", { locale: ptBR });
};

export interface QuickPlayer {
  name: string;
  stars?: number;
}

export interface QuickTeamForShare {
  name: string;
  players: QuickPlayer[];
  totalStars?: number;
}

/**
 * Texto pronto pra compartilhar via WhatsApp os times de um evento real.
 * Inclui branding do Timeco no rodapé.
 *
 * @param showAggregateStars Quando true (organizador), exibe ⭐ total e média.
 *                            Participantes não-organizadores recebem só o
 *                            agregado de número de jogadores, nunca estrelas.
 */
export const formatEventTeams = (
  event: Event,
  users: Record<string, User>,
  showAggregateStars: boolean,
): string => {
  const lines: string[] = [];
  const sport = getSport(event.sport);
  lines.push(`${sport.emoji}  ${event.title}`);
  const dateTxt = formatDate(event.scheduledAt);
  if (dateTxt) lines.push(`📅 ${dateTxt}`);
  if (event.location) lines.push(`📍 ${event.location}`);
  lines.push('');

  for (const team of event.teams ?? []) {
    if (showAggregateStars && team.playerIds.length > 0) {
      const avg = team.totalStars / team.playerIds.length;
      lines.push(`▶ ${team.name} (${team.totalStars.toFixed(1)}⭐ · média ${avg.toFixed(1)})`);
    } else {
      lines.push(`▶ ${team.name} (${team.playerIds.length} jogadores)`);
    }
    for (const id of team.playerIds) {
      const u = users[id];
      lines.push(`   • ${u?.name ?? '—'}`);
    }
    lines.push('');
  }

  lines.push('───────────────');
  lines.push('🎲 Times sorteados pelo Timeco');
  lines.push('https://timeco.com.br');
  return lines.join('\n');
};

/**
 * Texto pronto pra compartilhar times do Sorteio Rápido
 * (nomes temporários, sem evento persistido).
 */
export const formatQuickTeams = (
  teams: QuickTeamForShare[],
  options: { sportEmoji?: string; sportLabel?: string },
): string => {
  const lines: string[] = [];
  const heading = options.sportLabel
    ? `${options.sportEmoji ?? '🎲'}  Sorteio rápido · ${options.sportLabel}`
    : '🎲  Sorteio rápido';
  lines.push(heading);
  lines.push('');

  for (const team of teams) {
    if (team.totalStars != null && team.players.length > 0) {
      const avg = team.totalStars / team.players.length;
      lines.push(`▶ ${team.name} (${team.totalStars.toFixed(1)}⭐ · média ${avg.toFixed(1)})`);
    } else {
      lines.push(`▶ ${team.name} (${team.players.length} jogadores)`);
    }
    for (const p of team.players) lines.push(`   • ${p.name}`);
    lines.push('');
  }

  lines.push('───────────────');
  lines.push('🎲 Times sorteados pelo Timeco');
  lines.push('https://timeco.com.br');
  return lines.join('\n');
};
