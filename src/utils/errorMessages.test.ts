import { formatError } from './errorMessages';

const fbError = (code: string, message?: string): Error & { code: string } => {
  const e = new Error(message ?? `Firebase: Error (${code}).`);
  (e as Error & { code: string }).code = code;
  return e as Error & { code: string };
};

describe('formatError', () => {
  describe('mapeamento de códigos Firebase Auth', () => {
    it('traduz auth/invalid-credential', () => {
      expect(formatError(fbError('auth/invalid-credential'), 'fb')).toBe('Email ou senha inválidos.');
    });

    it('traduz auth/email-already-in-use', () => {
      expect(formatError(fbError('auth/email-already-in-use'), 'fb')).toBe(
        'Este email já está cadastrado. Tente fazer login.',
      );
    });

    it('traduz auth/weak-password', () => {
      expect(formatError(fbError('auth/weak-password'), 'fb')).toBe(
        'A senha precisa ter pelo menos 6 caracteres.',
      );
    });

    it('traduz auth/network-request-failed', () => {
      expect(formatError(fbError('auth/network-request-failed'), 'fb')).toContain('conexão');
    });

    it('traduz auth/too-many-requests', () => {
      expect(formatError(fbError('auth/too-many-requests'), 'fb')).toContain('tentativas');
    });
  });

  describe('cancelamentos silenciosos', () => {
    it('retorna string vazia pra auth/popup-closed-by-user', () => {
      expect(formatError(fbError('auth/popup-closed-by-user'), 'fb')).toBe('');
    });

    it('retorna string vazia pra auth/cancelled-popup-request', () => {
      expect(formatError(fbError('auth/cancelled-popup-request'), 'fb')).toBe('');
    });

    it('retorna string vazia pra storage/canceled', () => {
      expect(formatError(fbError('storage/canceled'), 'fb')).toBe('');
    });
  });

  describe('códigos do Firestore', () => {
    it('traduz permission-denied', () => {
      expect(formatError(fbError('permission-denied'), 'fb')).toBe(
        'Você não tem permissão pra fazer isso.',
      );
    });

    it('traduz not-found', () => {
      expect(formatError(fbError('not-found'), 'fb')).toContain('não encontrado');
    });

    it('traduz unavailable', () => {
      expect(formatError(fbError('unavailable'), 'fb')).toContain('indisponível');
    });

    it('traduz unauthenticated', () => {
      expect(formatError(fbError('unauthenticated'), 'fb')).toContain('logado');
    });
  });

  describe('códigos do Storage', () => {
    it('traduz storage/unauthorized', () => {
      expect(formatError(fbError('storage/unauthorized'), 'fb')).toContain('permissão');
    });

    it('traduz storage/quota-exceeded', () => {
      expect(formatError(fbError('storage/quota-exceeded'), 'fb')).toContain('armazenamento');
    });
  });

  describe('extração de código embarcado na message', () => {
    it('extrai código entre parênteses na message quando code não está disponível', () => {
      const e = new Error('Firebase: Error (auth/invalid-credential).');
      expect(formatError(e, 'fb')).toBe('Email ou senha inválidos.');
    });

    it('detecta quando o código aparece como substring sem parênteses', () => {
      const e = new Error('Some text with permission-denied somewhere');
      expect(formatError(e, 'fb')).toBe('Você não tem permissão pra fazer isso.');
    });
  });

  describe('mensagens já em pt-BR', () => {
    it('preserva mensagem que já tem acentos pt-BR', () => {
      const e = new Error('Localização indisponível agora');
      expect(formatError(e, 'fb')).toBe('Localização indisponível agora');
    });

    it('preserva mensagem que começa com "Não"', () => {
      const e = new Error('Não foi possível conectar ao servidor');
      expect(formatError(e, 'fb')).toContain('Não foi possível');
    });

    it('preserva mensagem com palavras pt-BR comuns', () => {
      const e = new Error('Por favor, verifique seu email');
      expect(formatError(e, 'fb')).toBe('Por favor, verifique seu email');
    });

    it('NÃO preserva mensagens longas (>200 chars) mesmo que tenham acentos', () => {
      const long = 'Não ' + 'A'.repeat(250);
      expect(formatError(new Error(long), 'fb-msg')).toBe('fb-msg');
    });
  });

  describe('fallback', () => {
    it('usa fallback quando o erro não é Error', () => {
      expect(formatError('string error', 'meu fallback')).toBe('meu fallback');
      expect(formatError(null, 'meu fallback')).toBe('meu fallback');
      expect(formatError(undefined, 'meu fallback')).toBe('meu fallback');
      expect(formatError({ random: 'object' }, 'meu fallback')).toBe('meu fallback');
    });

    it('usa fallback quando a mensagem do Error está em inglês', () => {
      const e = new Error('Something went wrong');
      expect(formatError(e, 'meu fallback')).toBe('meu fallback');
    });

    it('usa fallback quando o código Firebase é desconhecido', () => {
      expect(formatError(fbError('auth/unknown-bizarre-code'), 'meu fallback')).toBe(
        'meu fallback',
      );
    });
  });

  describe('priorização: code prevalece sobre mensagem em pt-BR', () => {
    it('quando há code Firebase válido + message em pt-BR, usa o mapeamento', () => {
      const e = new Error('Algum texto em português aleatório aqui') as Error & {
        code: string;
      };
      e.code = 'auth/invalid-credential';
      expect(formatError(e, 'fb')).toBe('Email ou senha inválidos.');
    });
  });
});
