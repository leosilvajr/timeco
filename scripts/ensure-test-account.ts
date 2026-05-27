/**
 * Garante que o usuario de teste pra revisor do Google Play existe no
 * Firebase Auth Production.
 *
 * Sem essa conta, o revisor da Play Store nao consegue logar e rejeita
 * a submissao. Credenciais devem ser as declaradas no Play Console:
 *   email: teste@timeco.com.br
 *   senha: teste123
 *
 * Rodar:
 *   SERVICE_ACCOUNT=./service-account.json npx tsx scripts/ensure-test-account.ts
 *
 * Idempotente: se ja existe, soh confirma. Se nao existe, cria.
 */

import * as admin from 'firebase-admin';
import { readFileSync } from 'node:fs';

const SERVICE_ACCOUNT = process.env.SERVICE_ACCOUNT || './service-account.json';
const TEST_EMAIL = 'teste@timeco.com.br';
const TEST_PASSWORD = 'teste123';
const TEST_NAME = 'Tester Google Play';

const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT, 'utf-8'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();
const db = admin.firestore();

const ensureUserDoc = async (uid: string): Promise<void> => {
  const ref = db.collection('users').doc(uid);
  const snap = await ref.get();
  if (snap.exists) {
    console.log('  -> doc users/' + uid + ' ja existe.');
    return;
  }
  await ref.set({
    id: uid,
    name: TEST_NAME,
    email: TEST_EMAIL,
    role: 'user',
    isProfilePublic: false,
    isGalleryPublic: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log('  -> doc users/' + uid + ' criado.');
};

const main = async (): Promise<void> => {
  console.log('Verificando ' + TEST_EMAIL + ' no Firebase Auth...');

  try {
    const existing = await auth.getUserByEmail(TEST_EMAIL);
    console.log('+ Ja existe: uid=' + existing.uid);
    console.log('  emailVerified=' + existing.emailVerified);
    console.log('  disabled=' + existing.disabled);
    if (existing.disabled) {
      console.log('  ATENCAO: conta esta DESABILITADA. Reabilita pelo Console.');
    }
    await ensureUserDoc(existing.uid);

    // Reset da senha pra garantir que esta no padrao declarado no Play Console
    await auth.updateUser(existing.uid, { password: TEST_PASSWORD });
    console.log('  -> senha redefinida pra "' + TEST_PASSWORD + '"');
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === 'auth/user-not-found') {
      console.log('- Nao existe. Criando...');
      const created = await auth.createUser({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        displayName: TEST_NAME,
        emailVerified: true,
      });
      console.log('+ Criado: uid=' + created.uid);
      await ensureUserDoc(created.uid);
    } else {
      throw err;
    }
  }

  console.log('\nOK. Credenciais ativas:');
  console.log('  email: ' + TEST_EMAIL);
  console.log('  senha: ' + TEST_PASSWORD);
  process.exit(0);
};

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
