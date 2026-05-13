/**
 * Gera HTML imprimivel pra exportar como PDF.
 *
 * Estrategia:
 * - Web: gera o HTML e abre `window.print()` em iframe. O browser oferece
 *   "Save as PDF" no dialog. Funciona em mobile (Chrome/Safari) tambem.
 * - Native (APK): expo-print.printToFileAsync recebe o mesmo HTML e
 *   retorna URI de PDF; passa pra expo-sharing.shareAsync que abre o
 *   share sheet nativo (WhatsApp/Telegram/email/etc).
 */

import { VolleyMatch, VolleyPlayer, PlayerVolleyStats } from '../types';
import {
  accumulateAcrossSets,
  attackPercentage,
  blockPercentage,
  directPoints,
  emptyPlayerStats,
  passPercentage,
  servePercentage,
  totalActions,
  totalAttacks,
  totalBlocks,
  totalErrors,
  totalPasses,
  totalServes,
  teamSummary,
  sumPlayerStats,
} from './volleyStats';

const formatDateBR = (iso: string): string => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
};

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const pct = (n: number): string => `${n.toFixed(1).replace('.0', '')}%`;

const playerStatsRow = (player: VolleyPlayer, stats: PlayerVolleyStats): string => {
  const t = totalActions(stats);
  if (t === 0) {
    return `<tr><td>#${player.number}</td><td>${escapeHtml(player.name)}</td><td>${escapeHtml(player.position)}</td><td colspan="9" style="color:#999;text-align:center">Sem ações registradas</td></tr>`;
  }
  return `<tr>
    <td>#${player.number}</td>
    <td>${escapeHtml(player.name)}</td>
    <td>${escapeHtml(player.position)}</td>
    <td>${directPoints(stats)}</td>
    <td>${stats.serves.ace}</td>
    <td>${stats.attacks.success}</td>
    <td>${stats.blocks.success}</td>
    <td>${pct(attackPercentage(stats))}</td>
    <td>${pct(servePercentage(stats))}</td>
    <td>${pct(passPercentage(stats))}</td>
    <td>${pct(blockPercentage(stats))}</td>
    <td>${totalErrors(stats)}</td>
  </tr>`;
};

export const generateMatchReportHtml = (match: VolleyMatch): string => {
  // Agrega stats acumulados por jogador atraves de todos os sets da partida
  const aggregated: Record<number, PlayerVolleyStats> = {};
  for (const p of match.players) {
    aggregated[p.number] = accumulateAcrossSets(match.sets, p.number);
  }

  // Resumo do time inteiro
  const totalTeam = Object.values(aggregated).reduce(
    (acc, s) => sumPlayerStats(acc, s),
    emptyPlayerStats(),
  );
  const summary = teamSummary(aggregated);

  // Sets ganhos
  let setsA = 0;
  let setsB = 0;
  for (const s of match.sets) {
    if (!s.finished) continue;
    if (s.scoreA > s.scoreB) setsA += 1;
    else if (s.scoreB > s.scoreA) setsB += 1;
  }

  // HTML por set (tabela compacta)
  const setSections = match.sets
    .map((s) => {
      const setRows = match.players
        .map((p) => {
          const ps = s.playerStats[p.number];
          if (!ps || totalActions(ps) === 0) return '';
          return `<tr>
            <td>#${p.number}</td>
            <td>${escapeHtml(p.name)}</td>
            <td>${directPoints(ps)}</td>
            <td>${ps.serves.ace}</td>
            <td>${ps.attacks.success}/${totalAttacks(ps)}</td>
            <td>${ps.blocks.success}</td>
            <td>${totalErrors(ps)}</td>
          </tr>`;
        })
        .filter(Boolean)
        .join('');
      if (!setRows) return '';
      return `
        <h3>Set ${s.number} — ${escapeHtml(match.teamAName)} ${s.scoreA} x ${s.scoreB} ${escapeHtml(match.teamBName)} ${s.finished ? '✓' : '(em andamento)'}</h3>
        <table class="set-table">
          <thead>
            <tr><th>#</th><th>Jogador</th><th>Pts</th><th>Aces</th><th>Atq P/T</th><th>Blocks</th><th>Erros</th></tr>
          </thead>
          <tbody>${setRows}</tbody>
        </table>
      `;
    })
    .join('');

  // Tabela acumulada do match inteiro
  const playerRows = match.players
    .map((p) => playerStatsRow(p, aggregated[p.number] ?? emptyPlayerStats()))
    .join('');

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Relatório — ${escapeHtml(match.teamAName)} x ${escapeHtml(match.teamBName)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #1a1a1a; padding: 24px; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 22px; margin: 0 0 4px; color: #0F9D58; }
    h2 { font-size: 16px; margin: 24px 0 8px; color: #333; border-bottom: 2px solid #0F9D58; padding-bottom: 4px; }
    h3 { font-size: 13px; margin: 18px 0 6px; color: #555; }
    .subtitle { color: #666; margin-bottom: 16px; font-size: 13px; }
    .score-box { display: flex; gap: 16px; margin: 16px 0; }
    .team-card { flex: 1; padding: 12px; border: 2px solid #0F9D58; border-radius: 8px; text-align: center; }
    .team-card.lost { border-color: #ddd; }
    .team-name { font-size: 11px; color: #666; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px; }
    .team-score { font-size: 32px; font-weight: 900; margin-top: 4px; }
    .team-sets { font-size: 12px; color: #888; margin-top: 4px; }
    .kpi-row { display: flex; gap: 8px; margin: 12px 0; }
    .kpi { flex: 1; background: #f5f5f5; border-radius: 6px; padding: 8px; text-align: center; }
    .kpi-label { font-size: 10px; color: #777; text-transform: uppercase; font-weight: 700; }
    .kpi-value { font-size: 18px; font-weight: 900; color: #0F9D58; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 12px; }
    th { background: #0F9D58; color: white; padding: 6px 4px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.3px; }
    td { padding: 5px 4px; border-bottom: 1px solid #eee; }
    tr:nth-child(even) td { background: #fafafa; }
    .set-table th { background: #555; }
    .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #eee; font-size: 10px; color: #999; text-align: center; }
    @media print {
      body { padding: 16px; }
      table { page-break-inside: avoid; }
      h2, h3 { page-break-after: avoid; }
    }
  </style>
</head>
<body>
  <h1>🏐 Relatório da partida</h1>
  <div class="subtitle">
    <strong>${escapeHtml(match.teamAName)}</strong> vs <strong>${escapeHtml(match.teamBName)}</strong><br>
    ${formatDateBR(match.date)} · ${escapeHtml(match.location)} · Melhor de ${match.format} · Sistema ${match.rotationSystem}
  </div>

  <div class="score-box">
    <div class="team-card ${setsA < setsB ? 'lost' : ''}">
      <div class="team-name">${escapeHtml(match.teamAName)}</div>
      <div class="team-score">${setsA}</div>
      <div class="team-sets">sets</div>
    </div>
    <div class="team-card ${setsB < setsA ? 'lost' : ''}">
      <div class="team-name">${escapeHtml(match.teamBName)}</div>
      <div class="team-score">${setsB}</div>
      <div class="team-sets">sets</div>
    </div>
  </div>

  <h2>Resumo do time</h2>
  <div class="kpi-row">
    <div class="kpi"><div class="kpi-label">Pontos diretos</div><div class="kpi-value">${summary.totalPoints}</div></div>
    <div class="kpi"><div class="kpi-label">Aces</div><div class="kpi-value">${summary.totalAces}</div></div>
    <div class="kpi"><div class="kpi-label">Bloqueios</div><div class="kpi-value">${summary.totalBlocks}</div></div>
    <div class="kpi"><div class="kpi-label">Erros</div><div class="kpi-value">${summary.totalErrors}</div></div>
  </div>
  <div class="kpi-row">
    <div class="kpi"><div class="kpi-label">Ataque %</div><div class="kpi-value">${pct(attackPercentage(totalTeam))}</div></div>
    <div class="kpi"><div class="kpi-label">Saque %</div><div class="kpi-value">${pct(servePercentage(totalTeam))}</div></div>
    <div class="kpi"><div class="kpi-label">Passe %</div><div class="kpi-value">${pct(passPercentage(totalTeam))}</div></div>
    <div class="kpi"><div class="kpi-label">Bloqueio %</div><div class="kpi-value">${pct(blockPercentage(totalTeam))}</div></div>
  </div>

  <h2>Estatísticas por jogador (acumulado)</h2>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Jogador</th>
        <th>Pos</th>
        <th>Pts</th>
        <th>Aces</th>
        <th>Atq pt</th>
        <th>Blk</th>
        <th>Atq %</th>
        <th>Sqe %</th>
        <th>Pas %</th>
        <th>Blq %</th>
        <th>Erros</th>
      </tr>
    </thead>
    <tbody>${playerRows}</tbody>
  </table>

  <h2>Detalhes por set</h2>
  ${setSections}

  <div class="footer">
    Gerado pelo Timeco · ${new Date().toLocaleString('pt-BR')}
  </div>
</body>
</html>`;
};
