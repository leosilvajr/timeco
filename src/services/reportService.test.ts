import { describe, expect, it } from '@jest/globals';
import {
  REPORT_REASONS,
  reasonLabel,
  contentTypeLabel,
} from './reportService';

describe('REPORT_REASONS', () => {
  it('tem todos os 6 motivos esperados', () => {
    const values = REPORT_REASONS.map((r) => r.value);
    expect(values).toEqual(
      expect.arrayContaining(['spam', 'inadequado', 'assedio', 'violencia', 'fake', 'outro']),
    );
    expect(values).toHaveLength(6);
  });

  it('todos os motivos tem label e emoji nao vazio', () => {
    for (const r of REPORT_REASONS) {
      expect(r.label.length).toBeGreaterThan(0);
      expect(r.emoji.length).toBeGreaterThan(0);
    }
  });

  it("'spam' tem emoji de megafone", () => {
    const spam = REPORT_REASONS.find((r) => r.value === 'spam');
    expect(spam?.emoji).toBe('📢');
  });

  it("'violencia' tem emoji de alerta", () => {
    const violencia = REPORT_REASONS.find((r) => r.value === 'violencia');
    expect(violencia?.emoji).toBe('⚠️');
  });
});

describe('reasonLabel', () => {
  it('retorna label correto pra cada motivo', () => {
    expect(reasonLabel('spam')).toBe('Spam ou propaganda');
    expect(reasonLabel('inadequado')).toBe('Conteúdo inadequado');
    expect(reasonLabel('assedio')).toBe('Assédio ou bullying');
    expect(reasonLabel('violencia')).toBe('Violência ou ódio');
    expect(reasonLabel('fake')).toBe('Perfil falso ou impersonator');
    expect(reasonLabel('outro')).toBe('Outro motivo');
  });
});

describe('contentTypeLabel', () => {
  it("'user' -> 'Perfil de usuário'", () => {
    expect(contentTypeLabel('user')).toBe('Perfil de usuário');
  });
  it("'event' -> 'Evento'", () => {
    expect(contentTypeLabel('event')).toBe('Evento');
  });
  it("'photo' -> 'Foto'", () => {
    expect(contentTypeLabel('photo')).toBe('Foto');
  });
  it("'message' -> 'Mensagem'", () => {
    expect(contentTypeLabel('message')).toBe('Mensagem');
  });
});
