import {
  validateFile,
  MAX_AVATAR_BYTES,
  MAX_PHOTO_BYTES,
  MAX_PROFILE_PHOTO_BYTES,
} from './photoService';

const makeFile = (size: number, type: string): Blob => {
  // Cria um Blob com o tamanho aproximado pra teste
  const data = new Uint8Array(size);
  return new Blob([data], { type });
};

describe('validateFile', () => {
  describe('limite de tamanho', () => {
    it('aceita arquivo dentro do limite', () => {
      const file = makeFile(1000, 'image/jpeg');
      expect(() => validateFile(file, MAX_AVATAR_BYTES)).not.toThrow();
    });

    it('aceita arquivo no limite exato', () => {
      const file = makeFile(MAX_AVATAR_BYTES, 'image/png');
      expect(() => validateFile(file, MAX_AVATAR_BYTES)).not.toThrow();
    });

    it('rejeita arquivo >limite com mensagem em pt-BR', () => {
      const file = makeFile(MAX_AVATAR_BYTES + 1, 'image/jpeg');
      expect(() => validateFile(file, MAX_AVATAR_BYTES)).toThrow(/grande demais/);
    });

    it('mensagem informa o limite em MB', () => {
      const file = makeFile(MAX_PHOTO_BYTES + 1, 'image/jpeg');
      expect(() => validateFile(file, MAX_PHOTO_BYTES)).toThrow(/10MB/);
    });
  });

  describe('tipo MIME', () => {
    it('aceita image/jpeg', () => {
      expect(() => validateFile(makeFile(100, 'image/jpeg'), MAX_AVATAR_BYTES)).not.toThrow();
    });

    it('aceita image/png', () => {
      expect(() => validateFile(makeFile(100, 'image/png'), MAX_AVATAR_BYTES)).not.toThrow();
    });

    it('aceita image/webp', () => {
      expect(() => validateFile(makeFile(100, 'image/webp'), MAX_AVATAR_BYTES)).not.toThrow();
    });

    it('aceita image/heic (iOS)', () => {
      expect(() => validateFile(makeFile(100, 'image/heic'), MAX_AVATAR_BYTES)).not.toThrow();
    });

    it('rejeita application/pdf', () => {
      expect(() =>
        validateFile(makeFile(100, 'application/pdf'), MAX_AVATAR_BYTES),
      ).toThrow(/Apenas imagens/);
    });

    it('rejeita video/mp4', () => {
      expect(() => validateFile(makeFile(100, 'video/mp4'), MAX_AVATAR_BYTES)).toThrow(
        /Apenas imagens/,
      );
    });

    it('rejeita arquivo sem type', () => {
      expect(() => validateFile(makeFile(100, ''), MAX_AVATAR_BYTES)).toThrow(/Apenas imagens/);
    });
  });

  describe('mensagens em pt-BR', () => {
    it('mensagem de tamanho não tem palavras técnicas em inglês', () => {
      const file = makeFile(MAX_AVATAR_BYTES + 1, 'image/jpeg');
      try {
        validateFile(file, MAX_AVATAR_BYTES);
      } catch (e) {
        const msg = (e as Error).message;
        expect(msg).not.toMatch(/error|failed|invalid|exception/i);
      }
    });

    it('mensagem de tipo não tem palavras técnicas em inglês', () => {
      try {
        validateFile(makeFile(100, 'application/pdf'), MAX_AVATAR_BYTES);
      } catch (e) {
        const msg = (e as Error).message;
        expect(msg).not.toMatch(/error|failed|invalid|MIME/i);
      }
    });
  });
});

describe('limites exportados', () => {
  it('avatar é 5MB', () => {
    expect(MAX_AVATAR_BYTES).toBe(5 * 1024 * 1024);
  });

  it('foto de evento é 10MB', () => {
    expect(MAX_PHOTO_BYTES).toBe(10 * 1024 * 1024);
  });

  it('foto de perfil é 5MB', () => {
    expect(MAX_PROFILE_PHOTO_BYTES).toBe(5 * 1024 * 1024);
  });
});
