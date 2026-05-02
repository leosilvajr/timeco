import { maskPhone, unmaskPhone, maskDecimal, parseDecimal } from './masks';

describe('maskPhone', () => {
  it('vazio retorna vazio', () => {
    expect(maskPhone('')).toBe('');
  });

  it('1 dígito: "(X"', () => {
    expect(maskPhone('1')).toBe('(1');
    expect(maskPhone('11')).toBe('(11');
  });

  it('3-6 dígitos: "(XX) X..."', () => {
    expect(maskPhone('113')).toBe('(11) 3');
    expect(maskPhone('1199')).toBe('(11) 99');
    expect(maskPhone('119988')).toBe('(11) 9988');
  });

  it('10 dígitos (fixo): "(XX) XXXX-XXXX"', () => {
    expect(maskPhone('1133331234')).toBe('(11) 3333-1234');
  });

  it('11 dígitos (celular): "(XX) XXXXX-XXXX"', () => {
    expect(maskPhone('11999990000')).toBe('(11) 99999-0000');
  });

  it('descarta caracteres não-numéricos', () => {
    expect(maskPhone('(11) 99999-0000')).toBe('(11) 99999-0000');
    expect(maskPhone('11 99999 0000')).toBe('(11) 99999-0000');
    expect(maskPhone('11.99999.0000')).toBe('(11) 99999-0000');
  });

  it('limita a 11 dígitos (DDD + celular)', () => {
    expect(maskPhone('1199999000099')).toBe('(11) 99999-0000');
  });
});

describe('unmaskPhone', () => {
  it('extrai apenas os dígitos', () => {
    expect(unmaskPhone('(11) 99999-0000')).toBe('11999990000');
    expect(unmaskPhone('11999990000')).toBe('11999990000');
    expect(unmaskPhone('')).toBe('');
  });
});

describe('maskDecimal', () => {
  it('vazio retorna vazio', () => {
    expect(maskDecimal('')).toBe('');
  });

  it('apenas dígitos passa direto', () => {
    expect(maskDecimal('175')).toBe('175');
    expect(maskDecimal('72')).toBe('72');
  });

  it('aceita ponto como separador', () => {
    expect(maskDecimal('175.5')).toBe('175.5');
  });

  it('converte vírgula para ponto', () => {
    expect(maskDecimal('175,5')).toBe('175.5');
  });

  it('mantém apenas o primeiro separador', () => {
    expect(maskDecimal('175.5.3')).toBe('175.53');
    expect(maskDecimal('175,5,3')).toBe('175.53');
  });

  it('limita casas decimais (default 2)', () => {
    expect(maskDecimal('175.567')).toBe('175.56');
    expect(maskDecimal('175.5678', 3)).toBe('175.567');
  });

  it('permite digitar "175." enquanto decimal está incompleto', () => {
    expect(maskDecimal('175.')).toBe('175.');
  });

  it('descarta letras e caracteres especiais', () => {
    expect(maskDecimal('abc175.5kg')).toBe('175.5');
    expect(maskDecimal('@#175$%')).toBe('175');
  });
});

describe('parseDecimal', () => {
  it('vazio retorna null', () => {
    expect(parseDecimal('')).toBeNull();
    expect(parseDecimal('   ')).toBeNull();
  });

  it('parsing com ponto', () => {
    expect(parseDecimal('175.5')).toBe(175.5);
    expect(parseDecimal('72')).toBe(72);
  });

  it('parsing com vírgula', () => {
    expect(parseDecimal('175,5')).toBe(175.5);
    expect(parseDecimal('1,75')).toBe(1.75);
  });

  it('inválido retorna null', () => {
    expect(parseDecimal('abc')).toBeNull();
  });
});
