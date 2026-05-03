import {
  clamp,
  isValidEmail,
  isValidHeight,
  isValidWeight,
  isValidJerseyNumber,
  isValidTeamsCount,
  isValidPlayersPerTeam,
  isFutureDateTime,
  isValidBirthDate,
  isWithinLength,
} from './validators';

describe('isValidEmail', () => {
  it.each([
    'user@example.com',
    'a.b@c.co',
    'first+tag@gmail.com',
    'USER@EXAMPLE.COM',
    'user@host.io',
  ])('aceita %s', (email) => {
    expect(isValidEmail(email)).toBe(true);
  });

  it.each([
    '',
    'plainstring',
    '@example.com',
    'user@',
    'user @example.com',
    'user@example',
    'user@.com',
  ])('rejeita %s', (email) => {
    expect(isValidEmail(email)).toBe(false);
  });

  it('faz trim antes de validar', () => {
    expect(isValidEmail('  a@b.co  ')).toBe(true);
  });
});

describe('clamp', () => {
  it('mantém valor dentro do range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('limita ao mínimo', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('limita ao máximo', () => {
    expect(clamp(99, 0, 10)).toBe(10);
  });
});

describe('isValidHeight', () => {
  it.each([100, 150, 175, 200, 250])('aceita %icm', (h) => {
    expect(isValidHeight(h)).toBe(true);
  });

  it.each([0, 50, 99, 251, 1000, -100, NaN, Infinity])('rejeita %i', (h) => {
    expect(isValidHeight(h)).toBe(false);
  });

  it('rejeita null e undefined', () => {
    expect(isValidHeight(null)).toBe(false);
    expect(isValidHeight(undefined)).toBe(false);
  });
});

describe('isValidWeight', () => {
  it.each([30, 50, 75, 100, 250])('aceita %ikg', (w) => {
    expect(isValidWeight(w)).toBe(true);
  });

  it.each([0, 10, 29, 251, 1000, -50, NaN])('rejeita %i', (w) => {
    expect(isValidWeight(w)).toBe(false);
  });
});

describe('isValidJerseyNumber', () => {
  it.each([1, 7, 10, 50, 99])('aceita %i', (n) => {
    expect(isValidJerseyNumber(n)).toBe(true);
  });

  it.each([0, -1, 100, 999, 1.5, NaN])('rejeita %i', (n) => {
    expect(isValidJerseyNumber(n)).toBe(false);
  });
});

describe('isValidTeamsCount', () => {
  it.each([2, 3, 4, 8])('aceita %i times', (n) => {
    expect(isValidTeamsCount(n)).toBe(true);
  });

  it.each([0, 1, 9, 100, -1, 2.5])('rejeita %i times', (n) => {
    expect(isValidTeamsCount(n)).toBe(false);
  });
});

describe('isValidPlayersPerTeam', () => {
  it.each([1, 5, 11, 20, 30])('aceita %i jogadores/time', (n) => {
    expect(isValidPlayersPerTeam(n)).toBe(true);
  });

  it.each([0, -1, 31, 100])('rejeita %i jogadores/time', (n) => {
    expect(isValidPlayersPerTeam(n)).toBe(false);
  });
});

describe('isFutureDateTime', () => {
  // Usa data fixa pra não falhar em CI
  const tomorrow = (): { date: string; time: string } => {
    const d = new Date(Date.now() + 24 * 3600 * 1000);
    return {
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      time: '12:00',
    };
  };
  const yesterday = (): { date: string; time: string } => {
    const d = new Date(Date.now() - 24 * 3600 * 1000);
    return {
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      time: '12:00',
    };
  };

  it('aceita data futura', () => {
    const { date, time } = tomorrow();
    expect(isFutureDateTime(date, time)).toBe(true);
  });

  it('rejeita data passada', () => {
    const { date, time } = yesterday();
    expect(isFutureDateTime(date, time)).toBe(false);
  });

  it('rejeita formato inválido', () => {
    expect(isFutureDateTime('not-a-date', '12:00')).toBe(false);
    expect(isFutureDateTime('2026-01-01', 'not-a-time')).toBe(false);
  });
});

describe('isValidBirthDate', () => {
  it('aceita data passada plausível', () => {
    expect(isValidBirthDate('1990-05-15')).toBe(true);
    expect(isValidBirthDate('2010-01-01')).toBe(true);
  });

  it('rejeita data futura', () => {
    expect(isValidBirthDate('2099-01-01')).toBe(false);
  });

  it('rejeita data >120 anos atrás', () => {
    expect(isValidBirthDate('1700-01-01')).toBe(false);
  });

  it('rejeita string vazia', () => {
    expect(isValidBirthDate('')).toBe(false);
  });

  it('rejeita formato inválido', () => {
    expect(isValidBirthDate('not-a-date')).toBe(false);
  });
});

describe('isWithinLength', () => {
  it('aceita string dentro do range', () => {
    expect(isWithinLength('hello', 1, 10)).toBe(true);
  });

  it('rejeita string menor que min', () => {
    expect(isWithinLength('a', 5, 10)).toBe(false);
  });

  it('rejeita string maior que max', () => {
    expect(isWithinLength('a'.repeat(50), 1, 10)).toBe(false);
  });

  it('faz trim antes de medir', () => {
    expect(isWithinLength('   hi   ', 1, 5)).toBe(true);
    expect(isWithinLength('   ', 1, 5)).toBe(false);
  });
});
