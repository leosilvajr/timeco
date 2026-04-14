/* eslint-disable */
// Script simples para popular os emuladores com usuários de teste.
// Usa as APIs REST dos emuladores (não requer instalar firebase-admin).
//
// Rodar:  node scripts/seed-emulators.js
//
// Certifique-se que os emuladores estão rodando (docker compose up -d).

const AUTH_HOST = process.env.AUTH_HOST || 'http://127.0.0.1:9098';
const FS_HOST = process.env.FS_HOST || 'http://127.0.0.1:8081';
const PROJECT = process.env.PROJECT || 'timeco-dev';

const USERS = [
  { email: 'admin@timeco.com', password: 'admin123', name: 'Admin Timeco', role: 'superadmin', heightCm: 180, birthDate: '1990-01-01' },
  { email: 'leo@timeco.com', password: 'leo12345', name: 'Leonardo Silva', role: 'user', heightCm: 178, birthDate: '1992-05-12' },
  { email: 'ana@timeco.com', password: 'ana12345', name: 'Ana Souza', role: 'user', heightCm: 168, birthDate: '1995-07-22' },
  { email: 'bruno@timeco.com', password: 'bruno123', name: 'Bruno Costa', role: 'user', heightCm: 185, birthDate: '1988-03-14' },
  { email: 'carla@timeco.com', password: 'carla123', name: 'Carla Lima', role: 'user', heightCm: 172, birthDate: '1993-11-30' },
  { email: 'diego@timeco.com', password: 'diego123', name: 'Diego Alves', role: 'user', heightCm: 175, birthDate: '2001-02-08' },
  { email: 'eva@timeco.com', password: 'eva12345', name: 'Eva Martins', role: 'user', heightCm: 164, birthDate: '2010-09-05' },
  { email: 'felipe@timeco.com', password: 'felipe12', name: 'Felipe Rocha', role: 'user', heightCm: 190, birthDate: '1985-12-20' },
  { email: 'gabi@timeco.com', password: 'gabi1234', name: 'Gabriela Nunes', role: 'user', heightCm: 170, birthDate: '1998-06-18' },
  { email: 'hugo@timeco.com', password: 'hugo1234', name: 'Hugo Pereira', role: 'user', heightCm: 176, birthDate: '2005-04-10' },
];

const encFirestoreValue = (val) => {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(encFirestoreValue) } };
  if (val instanceof Date) return { timestampValue: val.toISOString() };
  if (typeof val === 'object') {
    const fields = {};
    for (const k of Object.keys(val)) fields[k] = encFirestoreValue(val[k]);
    return { mapValue: { fields } };
  }
  throw new Error('unsupported: ' + typeof val);
};

async function createAuthUser(email, password, displayName) {
  const url = `${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=dev-api-key-timeco`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName, returnSecureToken: true }),
  });
  const data = await res.json();
  if (!res.ok) {
    if (data?.error?.message === 'EMAIL_EXISTS') {
      // fetch the uid via sign in
      const r2 = await fetch(
        `${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=dev-api-key-timeco`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, returnSecureToken: true }),
        }
      );
      const d2 = await r2.json();
      return d2.localId;
    }
    console.error('auth error', email, data);
    throw new Error(data?.error?.message || 'auth failed');
  }
  return data.localId;
}

async function writeDoc(path, data) {
  const url = `${FS_HOST}/v1/projects/${PROJECT}/databases/(default)/documents/${path}`;
  const fields = {};
  for (const k of Object.keys(data)) fields[k] = encFirestoreValue(data[k]);
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`write ${path} failed`, body);
  }
}

async function main() {
  console.log('=== Timeco Seed ===');
  console.log('Auth :', AUTH_HOST);
  console.log('FS   :', FS_HOST);
  console.log('Projeto:', PROJECT);
  console.log('');

  const created = [];
  for (const u of USERS) {
    try {
      const uid = await createAuthUser(u.email, u.password, u.name);
      await writeDoc(`users/${uid}`, {
        email: u.email,
        name: u.name,
        displayName: u.name,
        role: u.role,
        birthDate: u.birthDate,
        heightCm: u.heightCm,
        createdAt: new Date(),
      });
      created.push({ ...u, uid });
      console.log(`  ✓ ${u.email} (${uid})`);
    } catch (e) {
      console.error(`  ✗ ${u.email}:`, e.message);
    }
  }

  // Cria amizades: leo amigo de todos os outros usuários
  const leo = created.find((u) => u.email === 'leo@timeco.com');
  if (leo) {
    for (const other of created) {
      if (other.uid === leo.uid) continue;
      const [a, b] = [leo.uid, other.uid].sort();
      await writeDoc(`friendships/${a}_${b}`, {
        members: [a, b],
        createdAt: new Date(),
      });
    }
    console.log(`\n✓ Leonardo é amigo de ${created.length - 1} usuários`);
  }

  console.log('\n=== Login de teste ===');
  console.log('  admin@timeco.com / admin123   (super admin)');
  console.log('  leo@timeco.com   / leo12345   (user com muitos amigos)');
  console.log('');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
