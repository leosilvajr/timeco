/**
 * Seed pra demo do app: cria 10 usuarios ficticios, vincula amizade com o
 * owner (leosilvatanabi@gmail.com) e cria 10 eventos com mix de sports,
 * status e participantes — pra mostrar o app pra clientes sem ter que
 * preencher tudo manualmente.
 *
 * Rodar:
 *   SERVICE_ACCOUNT=./service-account.json \
 *   OWNER_UID=kUIDdF3TaiasPHZJ3708RcPcfqL2 \
 *   npx tsx scripts/seed-demo-data.ts
 *
 * Idempotente: usuarios criados com email amigo01..amigo10@timeco.demo
 * — se ja existem, atualiza o doc. Eventos sao sempre criados novos
 * (apaga eventos demo antes pra nao acumular se rodar 2x).
 */

import * as admin from 'firebase-admin';
import { readFileSync } from 'node:fs';

const SERVICE_ACCOUNT = process.env.SERVICE_ACCOUNT || './service-account.json';
const OWNER_UID = process.env.OWNER_UID;
const PASSWORD = 'demo123';
const NUM_USERS = 10;
const NUM_EVENTS = 10;

if (!OWNER_UID) {
  console.error('ERROR: OWNER_UID env var requerida (UID do dono dos eventos)');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT, 'utf-8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const auth = admin.auth();
const db = admin.firestore();

interface DemoUser {
  email: string;
  name: string;
  birthDate: string;
  heightCm: number;
  weightKg: number;
  gender: 'male' | 'female';
  bio: string;
  favoriteSports: string[];
}

const FAKE_USERS: DemoUser[] = [
  {
    email: 'amigo01@timeco.demo',
    name: 'Lucas Oliveira',
    birthDate: '1995-03-12',
    heightCm: 178,
    weightKg: 75,
    gender: 'male',
    bio: 'Atacante apaixonado por futebol amador. Joga toda quarta no clube do bairro.',
    favoriteSports: ['soccer', 'futsal'],
  },
  {
    email: 'amigo02@timeco.demo',
    name: 'Marina Costa',
    birthDate: '1997-08-25',
    heightCm: 168,
    weightKg: 60,
    gender: 'female',
    bio: 'Ponteira de vôlei. Tô voltando depois de uma pausa, vamos com tudo!',
    favoriteSports: ['volleyball', 'beachVolley'],
  },
  {
    email: 'amigo03@timeco.demo',
    name: 'Rafael Mendes',
    birthDate: '1992-11-04',
    heightCm: 185,
    weightKg: 82,
    gender: 'male',
    bio: 'Levantador de vôlei e jogador de futsal. Sempre disponível pra um rachão.',
    favoriteSports: ['volleyball', 'futsal'],
  },
  {
    email: 'amigo04@timeco.demo',
    name: 'Ana Beatriz Silva',
    birthDate: '1999-01-18',
    heightCm: 172,
    weightKg: 62,
    gender: 'female',
    bio: 'Central de vôlei. Bloqueio é minha especialidade.',
    favoriteSports: ['volleyball'],
  },
  {
    email: 'amigo05@timeco.demo',
    name: 'Pedro Henrique Almeida',
    birthDate: '1990-06-30',
    heightCm: 180,
    weightKg: 78,
    gender: 'male',
    bio: 'Tudo que tem bola eu jogo. Especialista em futebol e tênis.',
    favoriteSports: ['soccer', 'tennis', 'padel'],
  },
  {
    email: 'amigo06@timeco.demo',
    name: 'Carolina Ferreira',
    birthDate: '1996-09-14',
    heightCm: 165,
    weightKg: 58,
    gender: 'female',
    bio: 'Líbero de vôlei e fã de beach tennis. Sempre na praia no fim de semana.',
    favoriteSports: ['volleyball', 'beachTennis'],
  },
  {
    email: 'amigo07@timeco.demo',
    name: 'Bruno Carvalho',
    birthDate: '1993-04-22',
    heightCm: 182,
    weightKg: 80,
    gender: 'male',
    bio: 'Oposto de vôlei amador há 10 anos. Saque potente é meu trunfo.',
    favoriteSports: ['volleyball', 'beachVolley'],
  },
  {
    email: 'amigo08@timeco.demo',
    name: 'Juliana Rocha',
    birthDate: '1998-12-07',
    heightCm: 170,
    weightKg: 63,
    gender: 'female',
    bio: 'Joguei volei na faculdade. Agora tô voltando aos poucos.',
    favoriteSports: ['volleyball', 'basketball'],
  },
  {
    email: 'amigo09@timeco.demo',
    name: 'Diego Martins',
    birthDate: '1991-07-19',
    heightCm: 175,
    weightKg: 73,
    gender: 'male',
    bio: 'Futsal e vôlei. Marca presença em qualquer pelada.',
    favoriteSports: ['futsal', 'volleyball'],
  },
  {
    email: 'amigo10@timeco.demo',
    name: 'Fernanda Lima',
    birthDate: '1994-02-28',
    heightCm: 169,
    weightKg: 61,
    gender: 'female',
    bio: 'Ponteira esquerda, organizo o time da minha empresa. Bora marcar!',
    favoriteSports: ['volleyball', 'beachVolley', 'beachTennis'],
  },
];

const SPORTS_POOL = [
  'volleyball',
  'beachVolley',
  'soccer',
  'futsal',
  'basketball',
  'tennis',
  'padel',
  'beachTennis',
];

const LOCATIONS = [
  'Arena Esportiva Maiao',
  'Quadra Clube Olimpico',
  'Praia da Enseada — Quadra 3',
  'Ginasio Central',
  'Sociedade Esportiva Vila Maria',
  'Arena Litoral',
  'Praia do Tombo',
  'Clube de Vela',
  'Quadra do Sesc',
  'Arena Brasil',
];

const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const choice = <T>(arr: T[]): T => arr[rand(0, arr.length - 1)];

// Avatar URL via ui-avatars (gratuito, sem precisar upload)
const avatarUrl = (name: string): string => {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('');
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=0F9D58&color=fff&size=256&bold=true`;
};

const ensureFakeUser = async (
  u: DemoUser,
): Promise<{ uid: string; name: string }> => {
  let uid: string;
  try {
    const existing = await auth.getUserByEmail(u.email);
    uid = existing.uid;
    await auth.updateUser(uid, {
      password: PASSWORD,
      displayName: u.name,
      photoURL: avatarUrl(u.name),
      emailVerified: true,
    });
    console.log(`  ~ ${u.email} ja existia (uid ${uid.slice(0, 8)}...)`);
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === 'auth/user-not-found') {
      const created = await auth.createUser({
        email: u.email,
        password: PASSWORD,
        displayName: u.name,
        photoURL: avatarUrl(u.name),
        emailVerified: true,
      });
      uid = created.uid;
      console.log(`  + ${u.email} criado (uid ${uid.slice(0, 8)}...)`);
    } else {
      throw err;
    }
  }

  // Doc users/{uid}
  await db
    .collection('users')
    .doc(uid)
    .set(
      {
        id: uid,
        email: u.email,
        name: u.name,
        photoURL: avatarUrl(u.name),
        role: 'user',
        birthDate: u.birthDate,
        heightCm: u.heightCm,
        weightKg: u.weightKg,
        gender: u.gender,
        bio: u.bio,
        favoriteSports: u.favoriteSports,
        isProfilePublic: true,
        isGalleryPublic: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

  return { uid, name: u.name };
};

const ensureFriendship = async (uidA: string, uidB: string): Promise<void> => {
  const [a, b] = [uidA, uidB].sort();
  const fid = `${a}_${b}`;
  await db
    .collection('friendships')
    .doc(fid)
    .set(
      {
        members: [a, b],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
};

const deleteExistingDemoEvents = async (ownerUid: string): Promise<void> => {
  const snap = await db
    .collection('events')
    .where('organizerId', '==', ownerUid)
    .where('isDemo', '==', true)
    .get();
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  if (!snap.empty) {
    await batch.commit();
    console.log(`  - ${snap.size} eventos demo antigos apagados.`);
  }
};

const generateEvent = (
  index: number,
  ownerUid: string,
  ownerName: string,
  friends: { uid: string; name: string }[],
) => {
  const sport = choice(SPORTS_POOL);

  // Mix de datas: passados (4), hoje (1), futuros (5)
  const dayOffset = index < 4 ? -rand(7, 60) : index === 4 ? 0 : rand(1, 30);
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(19, 0, 0, 0); // 19h padrao
  const scheduledAt = admin.firestore.Timestamp.fromDate(date);

  // Status: passados sao finished/teams_drawn, futuros open, hoje teams_drawn
  let status: 'open' | 'teams_drawn' | 'finished' | 'cancelled';
  if (dayOffset < -7) status = 'finished';
  else if (dayOffset < 0) status = Math.random() < 0.5 ? 'teams_drawn' : 'finished';
  else if (dayOffset === 0) status = 'teams_drawn';
  else status = 'open';

  // Convida 8-10 dos amigos
  const numInvited = rand(8, Math.min(10, friends.length));
  const shuffled = [...friends].sort(() => Math.random() - 0.5).slice(0, numInvited);
  const invitedUserIds = shuffled.map((f) => f.uid);

  // Confirmacoes — 60-80% confirmados, alguns pendentes/recusaram
  const confirmations: Record<string, 'pending' | 'confirmed' | 'declined'> = {};
  for (const f of shuffled) {
    const r = Math.random();
    if (status === 'open') {
      // futuro: maioria pendente, alguns confirmados
      confirmations[f.uid] = r < 0.5 ? 'pending' : r < 0.85 ? 'confirmed' : 'declined';
    } else {
      // passado: maioria confirmou
      confirmations[f.uid] = r < 0.7 ? 'confirmed' : r < 0.9 ? 'declined' : 'pending';
    }
  }

  const playersPerTeam = sport === 'volleyball' || sport === 'beachVolley' ? 6 : 5;
  const teamsCount = 2;

  const titles: Record<string, string[]> = {
    volleyball: ['Rachão de volei', 'Volei na quadra', 'Treino + jogo'],
    beachVolley: ['Volei de praia', 'Brisa + volei na areia'],
    soccer: ['Pelada de futebol', 'Futebol no campo', 'Rachão de bola'],
    futsal: ['Futsal noturno', 'Quarta de futsal'],
    basketball: ['Basquete no clube', 'Rachão de basquete'],
    tennis: ['Tenis em dupla'],
    padel: ['Padel noturno', 'Padel competitivo'],
    beachTennis: ['Beach tennis no fim de tarde'],
  };
  const title = choice(titles[sport] || ['Partida amigavel']);

  const isContact = ['soccer', 'futsal', 'basketball', 'handball'].includes(sport);

  return {
    organizerId: ownerUid,
    organizerName: ownerName,
    title,
    sport,
    location: LOCATIONS[index % LOCATIONS.length],
    scheduledAt,
    playersPerTeam,
    teamsCount,
    balanceByAge: false,
    balanceByHeight: sport === 'volleyball' || sport === 'beachVolley' || sport === 'basketball',
    balanceByWeight: isContact,
    invitedUserIds,
    confirmations,
    status,
    notes:
      status === 'finished'
        ? 'Partida realizada! Foi uma noite incrivel.'
        : status === 'open'
        ? 'Levem bola e agua. Vamos chegar 15 min antes pra esquentar.'
        : '',
    isDemo: true, // flag pra poder limpar/identificar depois
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
};

const main = async () => {
  console.log(`\nSeed demo: criando ${NUM_USERS} usuarios + amizades + ${NUM_EVENTS} eventos`);
  console.log(`Owner: ${OWNER_UID}\n`);

  // Pega nome do owner
  const ownerDoc = await db.collection('users').doc(OWNER_UID!).get();
  const ownerName = (ownerDoc.data()?.name as string) || 'Leonardo Silva';

  // 1. Cria usuarios ficticios
  console.log('1. Usuarios ficticios:');
  const friends: { uid: string; name: string }[] = [];
  for (const u of FAKE_USERS.slice(0, NUM_USERS)) {
    const f = await ensureFakeUser(u);
    friends.push(f);
  }

  // 2. Amizades
  console.log('\n2. Amizades com o owner:');
  for (const f of friends) {
    await ensureFriendship(OWNER_UID!, f.uid);
    console.log(`  + ${ownerName} <-> ${f.name}`);
  }

  // 3. Apaga eventos demo antigos
  console.log('\n3. Limpando eventos demo antigos:');
  await deleteExistingDemoEvents(OWNER_UID!);

  // 4. Cria eventos
  console.log('\n4. Eventos novos:');
  for (let i = 0; i < NUM_EVENTS; i++) {
    const ev = generateEvent(i, OWNER_UID!, ownerName, friends);
    const ref = await db.collection('events').add(ev);
    const date = (ev.scheduledAt as admin.firestore.Timestamp).toDate();
    console.log(
      `  [${i + 1}/${NUM_EVENTS}] ${ev.title} (${ev.sport}) ${date.toLocaleDateString('pt-BR')} status=${ev.status} -> ${ref.id.slice(0, 8)}...`,
    );
  }

  console.log('\nDone!');
  console.log('\nResumo de credenciais dos amigos demo:');
  console.log(`  Senha (todos): ${PASSWORD}`);
  console.log(`  Emails: amigo01@timeco.demo ... amigo10@timeco.demo`);
  process.exit(0);
};

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
