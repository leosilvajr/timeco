jest.mock('./firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  serverTimestamp: jest.fn(),
  onSnapshot: jest.fn(),
}));

import { chatId } from './chatService';

describe('chatId', () => {
  it('ordena uids alfabeticamente', () => {
    expect(chatId('zzz', 'aaa')).toBe('aaa_zzz');
    expect(chatId('aaa', 'zzz')).toBe('aaa_zzz');
  });

  it('é determinístico — mesmo par sempre gera mesmo id', () => {
    const a = 'userA';
    const b = 'userB';
    expect(chatId(a, b)).toBe(chatId(b, a));
  });

  it('lida com uids reais de Firebase Auth', () => {
    const a = 'Q0Mo4Fi8wNWFFzrOeWjDOHTxbWo1';
    const b = 'FgIPCTHlU5YewCG3U2Teb2hyGFm1';
    // F < Q em ASCII
    expect(chatId(a, b)).toBe(`${b}_${a}`);
  });
});
