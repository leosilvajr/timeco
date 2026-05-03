import { ScoreboardState } from '../services/scoreboardLogic';
import { setsWonByTeams } from '../services/scoreboardLogic';

/**
 * Texto pronto pra compartilhar o resultado de uma partida do placar
 * eletrônico. Inclui sets jogados, vencedor e branding do Timeco.
 *
 * Formato exemplo:
 *   🏆 Time Verde 3 × 1 Time Azul
 *   Vôlei amador · finalizado
 *
 *   Sets jogados:
 *     1) 25 × 22
 *     2) 23 × 25
 *     3) 25 × 19
 *     4) 25 × 17
 *
 *   ───────────────
 *   🏆 Placar feito no Timeco
 *   https://timeco.com.br
 */
export const formatScoreboardResult = (state: ScoreboardState): string => {
  const { config, sets, status, winner } = state;
  const sw = setsWonByTeams(state);
  const lines: string[] = [];

  const aWon = winner === 'A';
  const bWon = winner === 'B';
  const trophy = (won: boolean) => (won ? '🏆 ' : '');

  if (status === 'finished' && winner) {
    lines.push(
      `${trophy(aWon)}${config.teamAName}  ${sw.a} × ${sw.b}  ${config.teamBName}${bWon ? ' 🏆' : ''}`,
    );
  } else {
    lines.push(`${config.teamAName}  ${sw.a} × ${sw.b}  ${config.teamBName}`);
  }

  const headerBits: string[] = [];
  if (config.modalityLabel) headerBits.push(config.modalityLabel);
  headerBits.push(status === 'finished' ? 'finalizado' : 'em andamento');
  lines.push(headerBits.join(' · '));
  lines.push('');

  if (sets.length > 0) {
    lines.push('Sets jogados:');
    sets.forEach((s, i) => {
      const tag = s.finished ? '' : ' (em andamento)';
      lines.push(`  ${i + 1}) ${s.a} × ${s.b}${tag}`);
    });
    lines.push('');
  }

  lines.push('───────────────');
  lines.push('🏆 Placar feito no Timeco');
  lines.push('https://timeco.com.br');
  return lines.join('\n');
};
