// Mock do firebase porque friendsService importa em cascata
jest.mock('./firebase', () => ({ db: {}, auth: {}, storage: {} }));
jest.mock('./notificationService', () => ({ createNotification: jest.fn() }));
jest.mock('./userService', () => ({
  getUserById: jest.fn(),
  getUsersByIds: jest.fn(),
}));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  serverTimestamp: jest.fn(),
  updateDoc: jest.fn(),
  onSnapshot: jest.fn(),
}));

import { friendshipId } from './friendsService';

describe('friendshipId', () => {
  it('ordena os uids alfabeticamente', () => {
    expect(friendshipId('zzz', 'aaa')).toBe('aaa_zzz');
    expect(friendshipId('aaa', 'zzz')).toBe('aaa_zzz');
  });

  it('é determinístico — mesmo par sempre gera mesmo id', () => {
    const id1 = friendshipId('userA', 'userB');
    const id2 = friendshipId('userB', 'userA');
    expect(id1).toBe(id2);
  });

  it('lida com uids reais do Firebase Auth', () => {
    const a = 'Q0Mo4Fi8wNWFFzrOeWjDOHTxbWo1';
    const b = 'kUIDdF3TaiasPHZJ3708RcPcfqL2';
    const id = friendshipId(a, b);
    // Q < k em ASCII (uppercase < lowercase), mantém ordem alfabética por charcode
    expect(id).toBe(`${a}_${b}`);
  });
});
