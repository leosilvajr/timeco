import { buildInitialConfirmations, reconcileConfirmations } from './eventService';

describe('buildInitialConfirmations', () => {
  it('cria mapa vazio quando não há convidados', () => {
    expect(buildInitialConfirmations([])).toEqual({});
  });

  it('todos os convidados começam como pending', () => {
    expect(buildInitialConfirmations(['a', 'b', 'c'])).toEqual({
      a: 'pending',
      b: 'pending',
      c: 'pending',
    });
  });

  it('lida com IDs duplicados (Map dedupa)', () => {
    expect(buildInitialConfirmations(['a', 'a', 'b'])).toEqual({
      a: 'pending',
      b: 'pending',
    });
  });
});

describe('reconcileConfirmations', () => {
  const ORG = 'organizer';

  it('mantém status existente quando user permanece convidado', () => {
    const result = reconcileConfirmations(
      { user1: 'confirmed', user2: 'declined' },
      ['user1', 'user2'],
      ORG,
    );
    expect(result).toEqual({ user1: 'confirmed', user2: 'declined' });
  });

  it('adiciona pending pra novos convidados', () => {
    const result = reconcileConfirmations(
      { user1: 'confirmed' },
      ['user1', 'user2', 'user3'],
      ORG,
    );
    expect(result).toEqual({
      user1: 'confirmed',
      user2: 'pending',
      user3: 'pending',
    });
  });

  it('remove confirmação de user desconvidado', () => {
    const result = reconcileConfirmations(
      { user1: 'confirmed', user2: 'declined' },
      ['user1'],
      ORG,
    );
    expect(result).toEqual({ user1: 'confirmed' });
  });

  it('preserva o organizador mesmo se ele não está em invitedUserIds', () => {
    const result = reconcileConfirmations(
      { [ORG]: 'confirmed', user1: 'confirmed' },
      ['user1'], // organizador não vai em invitedUserIds normalmente
      ORG,
    );
    expect(result).toEqual({ [ORG]: 'confirmed', user1: 'confirmed' });
  });

  it('combina adicionar + remover + manter no mesmo update', () => {
    const result = reconcileConfirmations(
      { [ORG]: 'confirmed', userA: 'confirmed', userB: 'declined', userC: 'pending' },
      ['userA', 'userD'], // mantém A, remove B e C, adiciona D
      ORG,
    );
    expect(result).toEqual({
      [ORG]: 'confirmed',
      userA: 'confirmed',
      userD: 'pending',
    });
    expect(result.userB).toBeUndefined();
    expect(result.userC).toBeUndefined();
  });

  it('não muta o objeto original', () => {
    const original = { user1: 'confirmed' as const };
    reconcileConfirmations(original, ['user1', 'user2'], ORG);
    expect(original).toEqual({ user1: 'confirmed' });
  });

  it('vazio + sem convidados retorna vazio', () => {
    expect(reconcileConfirmations({}, [], ORG)).toEqual({});
  });
});
