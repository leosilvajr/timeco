import {
  applyPoint,
  defaultRotation,
  isValidRotation,
  positionZone,
  rotateBackward,
  rotateForward,
} from './volleyRotation';

describe('rotateForward', () => {
  it('rotaciona uma posição: posição 2 vai pra 1, 3 vai pra 2, ..., 1 vai pra 6', () => {
    const r = [10, 20, 30, 40, 50, 60];
    expect(rotateForward(r)).toEqual([20, 30, 40, 50, 60, 10]);
  });

  it('seis rotações voltam ao original', () => {
    const r = [10, 20, 30, 40, 50, 60];
    let cur = r;
    for (let i = 0; i < 6; i++) cur = rotateForward(cur);
    expect(cur).toEqual(r);
  });

  it('lança quando array tem tamanho inválido', () => {
    expect(() => rotateForward([1, 2, 3])).toThrow();
  });
});

describe('rotateBackward', () => {
  it('é inverso de rotateForward', () => {
    const r = [10, 20, 30, 40, 50, 60];
    expect(rotateBackward(rotateForward(r))).toEqual(r);
    expect(rotateForward(rotateBackward(r))).toEqual(r);
  });
});

describe('isValidRotation', () => {
  it('rejeita arrays diferentes de 6', () => {
    expect(isValidRotation([1, 2, 3, 4, 5])).toBe(false);
    expect(isValidRotation([1, 2, 3, 4, 5, 6, 7])).toBe(false);
  });

  it('rejeita números duplicados (jogador na mesma posição duas vezes)', () => {
    expect(isValidRotation([1, 2, 3, 1, 5, 6])).toBe(false);
  });

  it('aceita array com 6 valores únicos', () => {
    expect(isValidRotation([10, 20, 30, 40, 50, 60])).toBe(true);
  });

  it('aceita zeros como vazios (sem ferir unicidade)', () => {
    expect(isValidRotation([1, 2, 0, 0, 5, 6])).toBe(true);
  });
});

describe('defaultRotation', () => {
  it('mapeia jogadores em sequência nas 6 posições', () => {
    expect(defaultRotation([10, 20, 30, 40, 50, 60])).toEqual([10, 20, 30, 40, 50, 60]);
  });

  it('preenche com 0 quando há menos de 6 jogadores', () => {
    expect(defaultRotation([10, 20])).toEqual([10, 20, 0, 0, 0, 0]);
  });

  it('ignora jogadores extras (apenas os 6 primeiros vão pra quadra)', () => {
    expect(defaultRotation([1, 2, 3, 4, 5, 6, 7, 8])).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe('positionZone', () => {
  it('posição 1 é o sacador', () => {
    expect(positionZone(1)).toBe('serve');
  });
  it('posições 2, 3, 4 são da rede', () => {
    expect(positionZone(2)).toBe('net');
    expect(positionZone(3)).toBe('net');
    expect(positionZone(4)).toBe('net');
  });
  it('posições 5 e 6 são do fundo', () => {
    expect(positionZone(5)).toBe('back');
    expect(positionZone(6)).toBe('back');
  });
});

describe('applyPoint (sideout + rotação automática)', () => {
  const initial = [10, 20, 30, 40, 50, 60];

  it('mantém saque e rotação quando quem pontuou já estava sacando', () => {
    const r = applyPoint(initial, 'A', 'A', true);
    expect(r.rotation).toEqual(initial);
    expect(r.serveTeam).toBe('A');
    expect(r.rotated).toBe(false);
  });

  it('vira saque sem rotacionar quando autoRotation está desligado', () => {
    const r = applyPoint(initial, 'B', 'A', false);
    expect(r.rotation).toEqual(initial); // sem rotação
    expect(r.serveTeam).toBe('A');
    expect(r.rotated).toBe(false);
  });

  it('rotaciona quando A receba o sideout e autoRotation está ligado', () => {
    const r = applyPoint(initial, 'B', 'A', true);
    expect(r.rotation).toEqual([20, 30, 40, 50, 60, 10]);
    expect(r.serveTeam).toBe('A');
    expect(r.rotated).toBe(true);
  });

  it('quando B vira o saque (de A pra B), nunca rotaciona a equipe local', () => {
    const r = applyPoint(initial, 'A', 'B', true);
    expect(r.rotation).toEqual(initial);
    expect(r.serveTeam).toBe('B');
    expect(r.rotated).toBe(false);
  });
});
