import { describe, expect, it } from '@jest/globals';
import { generateMatchReportHtml } from './volleyReportHtml';
import { applyAction, emptyPlayerStats } from './volleyStats';
import { VolleyMatch } from '../types';

const buildMatch = (overrides: Partial<VolleyMatch> = {}): VolleyMatch => ({
  id: 'm1',
  ownerId: 'u1',
  date: '2026-05-15',
  location: 'Arena Teste',
  teamAName: 'Tanabeach',
  teamBName: 'Mirassol Team',
  format: 3,
  rotationSystem: '5x1',
  status: 'finished',
  currentSet: 2,
  players: [
    { number: 1, name: 'Lucas', position: 'Oposto' },
    { number: 5, name: 'Marina', position: 'Ponteiro' },
  ],
  sets: [
    {
      number: 1,
      scoreA: 25,
      scoreB: 22,
      finished: true,
      playerStats: {
        1: applyAction(applyAction(emptyPlayerStats(), 'attack_point'), 'attack_point'),
        5: applyAction(emptyPlayerStats(), 'ace'),
      },
    },
    {
      number: 2,
      scoreA: 25,
      scoreB: 20,
      finished: true,
      playerStats: {
        1: applyAction(emptyPlayerStats(), 'attack_point'),
        5: emptyPlayerStats(),
      },
    },
  ],
  initialRotation: [1, 2, 3, 4, 5, 6],
  currentRotation: [1, 2, 3, 4, 5, 6],
  rotationCount: 0,
  pointsCount: 92,
  serveTeam: 'A',
  pointHistory: [],
  createdAt: null,
  updatedAt: null,
  ...overrides,
});

describe('generateMatchReportHtml', () => {
  it('gera HTML valido com doctype e closing tags', () => {
    const html = generateMatchReportHtml(buildMatch());
    expect(html).toMatch(/^<!doctype html>/i);
    expect(html).toMatch(/<\/html>\s*$/);
    expect(html).toContain('<head>');
    expect(html).toContain('</head>');
    expect(html).toContain('<body>');
    expect(html).toContain('</body>');
  });

  it('inclui nomes dos times no titulo e header', () => {
    const html = generateMatchReportHtml(buildMatch());
    expect(html).toContain('Tanabeach');
    expect(html).toContain('Mirassol Team');
  });

  it('escapa caracteres HTML perigosos em nomes', () => {
    const html = generateMatchReportHtml(
      buildMatch({
        teamAName: '<script>alert("xss")</script>',
        teamBName: 'A & B',
      }),
    );
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('A &amp; B');
  });

  it('formata data em DD/MM/YYYY', () => {
    const html = generateMatchReportHtml(buildMatch({ date: '2026-05-15' }));
    expect(html).toContain('15/05/2026');
  });

  it('mostra placar final em sets (X x Y sets)', () => {
    const html = generateMatchReportHtml(buildMatch());
    // 2 sets vencidos por A, 0 por B
    expect(html).toContain('>2</div>');
    expect(html).toContain('>0</div>');
    expect(html).toContain('sets');
  });

  it('inclui linha pra cada jogador da partida', () => {
    const html = generateMatchReportHtml(buildMatch());
    expect(html).toContain('Lucas');
    expect(html).toContain('Marina');
    expect(html).toContain('#1');
    expect(html).toContain('#5');
  });

  it('mostra secao de cada set com placares', () => {
    const html = generateMatchReportHtml(buildMatch());
    expect(html).toMatch(/Set 1.*Tanabeach.*25.*x.*22.*Mirassol Team/);
    expect(html).toMatch(/Set 2.*Tanabeach.*25.*x.*20.*Mirassol Team/);
  });

  it('inclui melhor de N e sistema de rodizio na intro', () => {
    const html = generateMatchReportHtml(buildMatch({ format: 5, rotationSystem: '4x2' }));
    expect(html).toContain('Melhor de 5');
    expect(html).toContain('4x2');
  });

  it('soma totais de KPIs do time (pontos/aces/blocks/erros)', () => {
    // p1 tem 3 attack_points, p5 tem 1 ace -> totalPoints=4, totalAces=1
    const html = generateMatchReportHtml(buildMatch());
    // 3 attack_points + 1 ace = 4 pontos diretos
    expect(html).toMatch(/Pontos diretos[^<]*<\/div>\s*<div[^>]*>4</);
    expect(html).toMatch(/Aces[^<]*<\/div>\s*<div[^>]*>1</);
  });

  it('inclui rodape com data de geracao', () => {
    const html = generateMatchReportHtml(buildMatch());
    expect(html).toContain('Gerado pelo Timeco');
  });

  it('marca set como em andamento quando nao finalizado', () => {
    const m = buildMatch();
    m.sets[1].finished = false;
    const html = generateMatchReportHtml(m);
    expect(html).toContain('(em andamento)');
  });
});
