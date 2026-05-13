/**
 * Seed de historico fake de partidas pro time Tanabeach.
 *
 * Como rodar:
 *   1. No Firebase Console -> Project Settings -> Service Accounts ->
 *      "Generate new private key". Salva o JSON como
 *      ./service-account.json (gitignored).
 *   2. Pega o UID do dono do Tanabeach em Authentication -> Users.
 *      (No caso do projeto: leosilvatanabi@gmail.com)
 *   3. Roda:
 *        SERVICE_ACCOUNT=./service-account.json \
 *        OWNER_UID=<o-uid-aqui> \
 *        TEAM_NAME=Tanabeach \
 *        npx tsx scripts/seed-tanabeach-history.ts
 *
 * O script:
 *   - Acha o time pelo nome (TEAM_NAME) entre os volleyTeams do owner
 *   - Gera 15 partidas espalhadas em 2026 com placares realistas e
 *     estatisticas distribuidas por posicao (levantador puxa sets,
 *     oposto/ponteiro puxam ataques, central puxa bloqueios, libero
 *     puxa passes)
 *   - Cria todas como `status: 'finished'`
 *
 * NAO sobrescreve partidas existentes. Cria novas a cada execucao
 * (apaga manualmente se rodar 2x).
 */

import * as admin from 'firebase-admin';
import { readFileSync } from 'node:fs';

interface SeedPlayer {
  name: string;
  number: number;
  position: 'Oposto' | 'Ponteiro' | 'Central' | 'Levantador' | 'Líbero';
}

interface PlayerStats {
  attacks: { success: number; error: number; normal: number };
  serves: { success: number; error: number; ace: number };
  blocks: { success: number; error: number; normal: number };
  passes: { a: number; b: number; c: number; error: number };
  sets: {
    success: number;
    error: number;
    ponta: number;
    saida: number;
    meio: number;
    fundo_meio: number;
    fundo_saida: number;
  };
}

const SERVICE_ACCOUNT = process.env.SERVICE_ACCOUNT || './service-account.json';
const OWNER_UID = process.env.OWNER_UID;
const TEAM_NAME = process.env.TEAM_NAME || 'Tanabeach';
const NUM_MATCHES = Number(process.env.NUM_MATCHES || 15);

if (!OWNER_UID) {
  console.error('ERROR: OWNER_UID env var requerida (UID do usuario dono do time)');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT, 'utf-8'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

const empty = (): PlayerStats => ({
  attacks: { success: 0, error: 0, normal: 0 },
  serves: { success: 0, error: 0, ace: 0 },
  blocks: { success: 0, error: 0, normal: 0 },
  passes: { a: 0, b: 0, c: 0, error: 0 },
  sets: {
    success: 0,
    error: 0,
    ponta: 0,
    saida: 0,
    meio: 0,
    fundo_meio: 0,
    fundo_saida: 0,
  },
});

const rand = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Gera stats de um set por jogador, escalando por posicao.
 * Como o set vai de 0 a ~25 pts, distribuimos:
 * - Os "pontos" (ataque ponto + ace + bloqueio sucesso) somados batem
 *   no scoreA do set (ou perto disso, porque alguns vem de erros do
 *   adversario que nao contamos como ponto nominal do nosso jogador).
 */
const generateSetStatsForPlayer = (
  player: SeedPlayer,
  intensity: number, // 0.5 (suplente) a 1.2 (titular destaque)
): PlayerStats => {
  const s = empty();
  const k = intensity;

  if (player.position === 'Levantador') {
    s.sets.success = rand(8, 16) * k | 0;
    s.sets.error = rand(0, 2);
    s.sets.ponta = rand(3, 8);
    s.sets.saida = rand(2, 6);
    s.sets.meio = rand(2, 5);
    s.sets.fundo_meio = rand(1, 3);
    s.sets.fundo_saida = rand(0, 2);
    s.serves.success = rand(3, 6);
    s.serves.error = rand(0, 2);
    s.serves.ace = rand(0, 1);
    s.passes.a = rand(0, 2);
    s.passes.b = rand(0, 3);
    s.passes.c = rand(0, 2);
    s.passes.error = rand(0, 1);
    s.blocks.success = rand(0, 2);
    s.blocks.normal = rand(1, 3);
    s.blocks.error = rand(0, 1);
    s.attacks.success = rand(0, 1); // levantador raramente ataca
    s.attacks.error = rand(0, 1);
    s.attacks.normal = rand(0, 1);
  } else if (player.position === 'Líbero') {
    s.passes.a = rand(8, 14) * k | 0;
    s.passes.b = rand(4, 8);
    s.passes.c = rand(1, 4);
    s.passes.error = rand(0, 2);
    s.serves.success = 0;
    s.serves.error = 0;
    s.serves.ace = 0;
    s.attacks.success = 0;
    s.attacks.error = 0;
    s.attacks.normal = 0;
    s.blocks.success = 0; // libero nao bloqueia
    s.blocks.normal = 0;
    s.blocks.error = 0;
    s.sets.success = rand(0, 2); // emergencia
    s.sets.error = rand(0, 1);
  } else if (player.position === 'Central') {
    s.attacks.success = rand(3, 6) * k | 0;
    s.attacks.error = rand(0, 2);
    s.attacks.normal = rand(2, 4);
    s.blocks.success = rand(3, 6) * k | 0;
    s.blocks.normal = rand(2, 5);
    s.blocks.error = rand(0, 2);
    s.serves.success = rand(2, 5);
    s.serves.error = rand(0, 1);
    s.serves.ace = rand(0, 2);
    s.passes.a = rand(0, 2);
    s.passes.b = rand(1, 3);
    s.passes.c = rand(0, 2);
    s.passes.error = rand(0, 1);
    s.sets.success = rand(0, 1);
    s.sets.error = rand(0, 1);
  } else if (player.position === 'Ponteiro') {
    s.attacks.success = rand(4, 8) * k | 0;
    s.attacks.error = rand(1, 3);
    s.attacks.normal = rand(2, 5);
    s.passes.a = rand(3, 7) * k | 0;
    s.passes.b = rand(2, 5);
    s.passes.c = rand(1, 3);
    s.passes.error = rand(0, 2);
    s.serves.success = rand(3, 6);
    s.serves.error = rand(0, 2);
    s.serves.ace = rand(0, 2);
    s.blocks.success = rand(1, 3);
    s.blocks.normal = rand(1, 3);
    s.blocks.error = rand(0, 1);
  } else {
    // Oposto
    s.attacks.success = rand(6, 12) * k | 0;
    s.attacks.error = rand(1, 4);
    s.attacks.normal = rand(2, 5);
    s.serves.success = rand(3, 6);
    s.serves.error = rand(0, 2);
    s.serves.ace = rand(0, 2);
    s.blocks.success = rand(1, 3);
    s.blocks.normal = rand(1, 3);
    s.blocks.error = rand(0, 1);
    s.passes.a = rand(0, 2);
    s.passes.b = rand(0, 2);
    s.passes.c = rand(0, 1);
    s.passes.error = rand(0, 1);
  }
  return s;
};

const generateMatch = (
  players: SeedPlayer[],
  ownerId: string,
  matchIndex: number,
): admin.firestore.DocumentData => {
  // Espalha em 2026 (a cada ~3 semanas, comecando em fev)
  const monthStart = 2 + Math.floor(matchIndex * 0.6);
  const day = rand(1, 27);
  const date = `2026-${String(Math.min(monthStart, 12)).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const opponents = [
    'Mirassol Team',
    'Praia Grande VC',
    'Sao Vicente FC',
    'Santos Volei',
    'Litoral Sul',
    'Vila Maua',
    'Boqueirao Beach',
    'Itanhaem VC',
    'Guaruja Sports',
    'Bertioga Volei',
  ];
  const teamBName = opponents[matchIndex % opponents.length];

  const locations = ['Maiao', 'Ginasio Central', 'Praia da Enseada', 'Quadra do Clube'];
  const location = locations[matchIndex % locations.length];

  const format: 3 | 5 = Math.random() < 0.7 ? 3 : 5;

  // 60% Tanabeach ganha, 40% perde
  const tanabeachWins = Math.random() < 0.6;

  // Decide quantos sets jogados (entre setsToWin e format)
  const setsToWin = Math.ceil(format / 2);
  const winnerSetsNeeded = setsToWin;
  const loserSets = rand(0, setsToWin - 1);
  const totalSets = winnerSetsNeeded + loserSets;

  // Marca quais sets cada time ganhou (sequencia plausivel)
  const setOrder: Array<'A' | 'B'> = [];
  let winnerCount = 0;
  let loserCount = 0;
  while (winnerCount < winnerSetsNeeded || setOrder.length < totalSets) {
    if (winnerCount === winnerSetsNeeded) {
      setOrder.push(tanabeachWins ? 'B' : 'A');
      loserCount += 1;
    } else if (loserCount === loserSets) {
      setOrder.push(tanabeachWins ? 'A' : 'B');
      winnerCount += 1;
    } else if (Math.random() < 0.55) {
      setOrder.push(tanabeachWins ? 'A' : 'B');
      winnerCount += 1;
    } else {
      setOrder.push(tanabeachWins ? 'B' : 'A');
      loserCount += 1;
    }
  }

  const sets: admin.firestore.DocumentData[] = setOrder.map((winner, i) => {
    const setNumber = i + 1;
    const isDecisive = setNumber === format;
    const target = isDecisive ? 15 : 25;

    // Vencedor do set: target+rand(0,2), perdedor: rand(target-7, target-2)
    let scoreA: number;
    let scoreB: number;
    if (winner === 'A') {
      scoreA = target + rand(0, 2);
      scoreB = rand(Math.max(0, target - 7), target - 2);
    } else {
      scoreB = target + rand(0, 2);
      scoreA = rand(Math.max(0, target - 7), target - 2);
    }

    // Stats por jogador
    const playerStats: Record<number, PlayerStats> = {};
    for (const p of players) {
      // Intensidade: titular (1.0) ou suplente (0.55)
      const isStarter = ['Oposto', 'Levantador', 'Central', 'Líbero'].includes(p.position) ||
        players.filter((x) => x.position === 'Ponteiro').indexOf(p) < 2;
      const intensity = isStarter ? 1.0 : 0.55;
      playerStats[p.number] = generateSetStatsForPlayer(p, intensity);
    }

    return {
      number: setNumber,
      scoreA,
      scoreB,
      finished: true,
      playerStats,
    };
  });

  const initialRotation = players.slice(0, 6).map((p) => p.number);

  return {
    ownerId,
    date,
    location,
    teamAName: 'Tanabeach',
    teamBName,
    format,
    rotationSystem: '5x1',
    status: 'finished',
    currentSet: sets.length,
    players,
    sets,
    initialRotation,
    currentRotation: initialRotation,
    rotationCount: 0,
    pointsCount: sets.reduce(
      (acc, s) => acc + (s.scoreA as number) + (s.scoreB as number),
      0,
    ),
    serveTeam: 'A',
    pointHistory: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
};

const main = async () => {
  console.log(`Seeding ${NUM_MATCHES} partidas pro time "${TEAM_NAME}" (owner=${OWNER_UID})...`);

  // Acha o time
  const teamsSnap = await db
    .collection('volleyTeams')
    .where('ownerId', '==', OWNER_UID)
    .where('name', '==', TEAM_NAME)
    .limit(1)
    .get();

  if (teamsSnap.empty) {
    console.error(`Time "${TEAM_NAME}" nao encontrado pro owner ${OWNER_UID}.`);
    process.exit(1);
  }

  const team = teamsSnap.docs[0].data();
  const players = team.players as SeedPlayer[];
  console.log(`Time encontrado: ${players.length} jogadores`);

  for (let i = 0; i < NUM_MATCHES; i++) {
    const match = generateMatch(players, OWNER_UID, i);
    const ref = await db.collection('volleyMatches').add(match);
    console.log(
      `  [${i + 1}/${NUM_MATCHES}] ${match.date} vs ${match.teamBName} (${match.format}) -> ${ref.id}`,
    );
  }

  console.log('\nDone.');
  process.exit(0);
};

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
