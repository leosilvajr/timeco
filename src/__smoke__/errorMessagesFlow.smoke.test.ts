/**
 * SMOKE TEST · Pipeline de tratamento de erros
 *
 * Garante que NENHUMA mensagem que chegaria ao usuário final
 * está em inglês ou expõe stacktrace técnico.
 */
import { formatError } from '../utils/errorMessages';

describe('SMOKE · Mensagens de erro NUNCA em inglês', () => {
  const FALLBACK = 'Não conseguimos completar a operação agora.';

  const ENGLISH_HINT = /\b(error|failed|invalid|forbidden|denied|missing|exception)\b/i;

  it.each([
    'auth/invalid-credential',
    'auth/email-already-in-use',
    'auth/weak-password',
    'auth/network-request-failed',
    'auth/too-many-requests',
    'auth/user-not-found',
    'auth/user-disabled',
    'permission-denied',
    'not-found',
    'unavailable',
    'storage/unauthorized',
    'storage/quota-exceeded',
  ])('código %s gera mensagem sem inglês técnico', (code) => {
    const e = new Error(`Firebase: Error (${code}).`);
    (e as Error & { code: string }).code = code;

    const msg = formatError(e, FALLBACK);
    if (!msg) return; // cancelamento silencioso é OK

    expect(msg).not.toMatch(ENGLISH_HINT);
    expect(msg).not.toMatch(/firebase|firestore|auth\//i);
    expect(msg.length).toBeGreaterThan(0);
    expect(msg.length).toBeLessThan(200);
  });

  it('erros desconhecidos caem no fallback contextual', () => {
    const e = new Error('Some random English error');
    expect(formatError(e, FALLBACK)).toBe(FALLBACK);
  });

  it('erros que não são Error caem no fallback', () => {
    expect(formatError(null, FALLBACK)).toBe(FALLBACK);
    expect(formatError(undefined, FALLBACK)).toBe(FALLBACK);
    expect(formatError('string error', FALLBACK)).toBe(FALLBACK);
    expect(formatError({ random: 1 }, FALLBACK)).toBe(FALLBACK);
  });

  it('mensagem em pt-BR é preservada', () => {
    const e = new Error('Não foi possível conectar ao servidor agora');
    expect(formatError(e, FALLBACK)).toBe('Não foi possível conectar ao servidor agora');
  });

  it('cancelamentos silenciosos retornam string vazia', () => {
    const codes = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'storage/canceled'];
    for (const code of codes) {
      const e = new Error(`Firebase: Error (${code}).`);
      (e as Error & { code: string }).code = code;
      expect(formatError(e, FALLBACK)).toBe('');
    }
  });
});
