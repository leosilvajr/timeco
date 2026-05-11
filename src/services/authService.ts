import { Platform } from 'react-native';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  signOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, deleteField } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User, UserRole } from '../types';

export interface SignUpInput {
  email: string;
  password: string;
  name: string;
  birthDate?: string;
  heightCm?: number;
  phone?: string;
}

export const onAuthStateChanged = (cb: (user: FirebaseUser | null) => void) =>
  firebaseOnAuthStateChanged(auth, cb);

export const signUp = async (input: SignUpInput): Promise<User> => {
  const cred = await createUserWithEmailAndPassword(auth, input.email, input.password);
  await updateProfile(cred.user, { displayName: input.name });

  const user: User = {
    id: cred.user.uid,
    email: input.email,
    name: input.name,
    displayName: input.name,
    role: 'user',
    birthDate: input.birthDate,
    heightCm: input.heightCm,
    phone: input.phone,
    createdAt: serverTimestamp() as unknown as null,
  };

  await setDoc(doc(db, 'users', cred.user.uid), user);
  return user;
};

export const signIn = async (email: string, password: string) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
};

/**
 * Login com Google.
 * - Web: signInWithPopup do Firebase
 * - Native: redireciona pra signInWithGoogleNative() que usa expo-auth-session.
 *   O hook que chama deve passar o idToken obtido. (Implementação no
 *   hook useGoogleAuth — separa porque expo-auth-session é hook-based.)
 */
export const signInWithGoogle = async (): Promise<FirebaseUser> => {
  if (Platform.OS !== 'web') {
    throw new Error(
      'Login Google no mobile usa o hook useGoogleAuth() (não esta função).',
    );
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  await ensureUserDocument(cred.user);
  return cred.user;
};

/**
 * Para mobile: completa o login no Firebase usando o idToken obtido
 * via expo-auth-session (Google OAuth).
 */
export const signInWithGoogleIdToken = async (idToken: string): Promise<FirebaseUser> => {
  const credential = GoogleAuthProvider.credential(idToken);
  const cred = await signInWithCredential(auth, credential);
  await ensureUserDocument(cred.user);
  return cred.user;
};

/**
 * Para iOS: completa o login no Firebase usando o identityToken (JWT) obtido
 * via expo-apple-authentication. O `rawNonce` precisa ser o MESMO usado pra
 * gerar o `nonce` (SHA-256) passado pro AppleAuthentication.signInAsync.
 *
 * Obrigatorio pra Apple aprovar app na App Store quando ja existe outro
 * login social (Google). Veja docs/APPLE_STORE_GUIDE.md.
 *
 * @param identityToken JWT retornado por AppleAuthentication.signInAsync
 * @param rawNonce String aleatoria gerada antes do signIn (NAO o SHA-256)
 * @param fullName Nome completo retornado por Apple — so vem na PRIMEIRA
 *   autenticacao do user; depois vem null. Por isso salvamos no Firestore
 *   logo de cara.
 */
export const signInWithAppleIdToken = async (
  identityToken: string,
  rawNonce: string,
  fullName?: { givenName?: string | null; familyName?: string | null } | null,
): Promise<FirebaseUser> => {
  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({
    idToken: identityToken,
    rawNonce,
  });
  const cred = await signInWithCredential(auth, credential);

  // Apple so retorna fullName na PRIMEIRA autenticacao. Se for o caso,
  // monta displayName e salva no Firebase Auth + Firestore antes do
  // ensureUserDocument criar com fallback.
  if (fullName && (fullName.givenName || fullName.familyName)) {
    const composedName = [fullName.givenName, fullName.familyName]
      .filter(Boolean)
      .join(' ')
      .trim();
    if (composedName && !cred.user.displayName) {
      try {
        await updateProfile(cred.user, { displayName: composedName });
      } catch (e) {
        console.warn('updateProfile (Apple) falhou:', e);
      }
    }
  }

  await ensureUserDocument(cred.user);
  return cred.user;
};

export const logout = () => signOut(auth);

export const getUserDocument = async (uid: string): Promise<User | null> => {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as User;
};

/**
 * Garante que existe doc users/{uid}. Se não existir, cria com defaults
 * extraídos do FirebaseUser (Google, email/senha, etc.).
 */
export const ensureUserDocument = async (firebaseUser: FirebaseUser): Promise<User> => {
  const ref = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as User;
  }

  const fallbackName =
    firebaseUser.displayName ||
    firebaseUser.email?.split('@')[0] ||
    'Usuário';

  const newUser: User = {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: fallbackName,
    displayName: fallbackName,
    role: 'user',
    createdAt: serverTimestamp() as unknown as null,
  };
  if (firebaseUser.photoURL) newUser.photoURL = firebaseUser.photoURL;

  await setDoc(ref, newUser);
  return newUser;
};

export const updateUserProfile = async (uid: string, patch: Partial<User>) => {
  // Firestore rejeita undefined em updateDoc; null é aceito (remove o campo).
  // Por convenção: undefined = ignora; null = remove.
  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    cleaned[k] = v === null ? deleteField() : v;
  }
  cleaned.updatedAt = serverTimestamp();
  await updateDoc(doc(db, 'users', uid), cleaned);
};

export const setUserRole = async (uid: string, role: UserRole) => {
  await updateDoc(doc(db, 'users', uid), {
    role,
    updatedAt: serverTimestamp(),
  });
};
