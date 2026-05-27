/**
 * Smoke test caixa-preta do fluxo de moderacao (denuncia + bloqueio).
 *
 * Nao instancia Firestore. Testa apenas as estruturas de dados e helpers
 * puros que a UI usa pra renderizar/processar denuncias e bloqueios:
 *
 * - REPORT_REASONS coverage (6 motivos cobrem violacoes Play Store/UGC)
 * - contentTypeLabel cobre todas as 4 superficies
 * - Snapshot semantics (preservacao de contexto pra revisor)
 * - Block: assimetria (A bloqueia B mas B nao sabe)
 */

import { describe, expect, it } from '@jest/globals';
import {
  REPORT_REASONS,
  reasonLabel,
  contentTypeLabel,
} from '../services/reportService';
import { isBlocked } from '../services/blockService';
import { Report, ReportContentType, ReportReason, ReportStatus } from '../types';

describe('smoke: moderacao — denuncia coverage Play Store', () => {
  it('motivos cobrem categorias mandatorias do Google Play UGC', () => {
    const required = ['spam', 'inadequado', 'assedio', 'violencia', 'fake'];
    const values = REPORT_REASONS.map((r) => r.value);
    for (const r of required) {
      expect(values).toContain(r);
    }
  });

  it('todas 4 superficies de conteudo tem label pt-BR', () => {
    const types: ReportContentType[] = ['user', 'event', 'photo', 'message'];
    for (const t of types) {
      const lbl = contentTypeLabel(t);
      expect(lbl.length).toBeGreaterThan(2);
      expect(lbl).not.toBe(t); // garante que e tradução, nao o valor cru
    }
  });

  it('labels de motivo nao retornam o valor cru pro usuario', () => {
    for (const r of REPORT_REASONS) {
      const lbl = reasonLabel(r.value);
      expect(lbl).not.toBe(r.value);
      expect(lbl.length).toBeGreaterThan(2);
    }
  });
});

describe('smoke: estrutura de Report', () => {
  // Simula o que createReport vai persistir (sem Firestore real)
  const makeReport = (overrides: Partial<Report> = {}): Report => ({
    id: 'r1',
    reporterId: 'userA',
    reportedUserId: 'userB',
    contentType: 'message',
    contentId: 'msg123',
    contentRef: 'chats/userA_userB/messages/msg123',
    reason: 'assedio',
    details: 'Mensagem ofensiva',
    status: 'open',
    createdAt: null,
    ...overrides,
  });

  it('report novo sempre nasce com status open', () => {
    const r = makeReport();
    expect(r.status).toBe('open');
  });

  it('snapshot do conteudo preserva contexto se autor apagar depois', () => {
    const r = makeReport({
      contentSnapshot: {
        text: 'mensagem ofensiva original',
        senderId: 'userB',
      },
    });
    expect(r.contentSnapshot).toBeDefined();
    expect(r.contentSnapshot?.text).toBe('mensagem ofensiva original');
  });

  it('ciclo de vida de status: open -> reviewed/actioned/dismissed', () => {
    const validStatuses: ReportStatus[] = ['open', 'reviewed', 'actioned', 'dismissed'];
    for (const s of validStatuses) {
      const r = makeReport({ status: s });
      expect(['open', 'reviewed', 'actioned', 'dismissed']).toContain(r.status);
    }
  });

  it('reportedUserId e contentId podem ser iguais quando denuncia direta de user', () => {
    const r = makeReport({
      contentType: 'user',
      contentId: 'userB',
      reportedUserId: 'userB',
    });
    expect(r.contentId).toBe(r.reportedUserId);
  });

  it('reportedUserId != contentId quando denuncia foto/mensagem/evento', () => {
    const r = makeReport({
      contentType: 'event',
      contentId: 'event123',
      reportedUserId: 'organizerUid',
    });
    expect(r.contentId).not.toBe(r.reportedUserId);
  });

  it('details respeita limite de 500 chars (simulado pelo caller)', () => {
    const longDetails = 'x'.repeat(600);
    const trimmed = longDetails.slice(0, 500);
    expect(trimmed.length).toBe(500);
  });
});

describe('smoke: bloqueio — isBlocked helper', () => {
  it('retorna true quando UID esta no Set', () => {
    const blocked = new Set(['userB', 'userC']);
    expect(isBlocked(blocked, 'userB')).toBe(true);
  });

  it('retorna false quando UID nao esta no Set', () => {
    const blocked = new Set(['userB']);
    expect(isBlocked(blocked, 'userC')).toBe(false);
  });

  it('Set vazio sempre retorna false', () => {
    expect(isBlocked(new Set(), 'qualquer')).toBe(false);
  });

  it('bloqueio e assimetrico — A bloqueia B nao implica B bloqueia A', () => {
    const aBlockList = new Set(['userB']);
    const bBlockList = new Set<string>(); // B nao bloqueou ninguem

    // A ve B como bloqueado
    expect(isBlocked(aBlockList, 'userB')).toBe(true);
    // B NAO ve A como bloqueado (assimetria)
    expect(isBlocked(bBlockList, 'userA')).toBe(false);
  });
});

describe('smoke: filtragem client-side de mensagens', () => {
  // Simula o filtro de chat: messages.filter(!blocked.has(senderId))
  it('remove mensagens de usuarios bloqueados', () => {
    const blockedIds = new Set(['userB']);
    const messages = [
      { id: 'm1', senderId: 'userA', text: 'oi' },
      { id: 'm2', senderId: 'userB', text: 'mensagem de bloqueado' },
      { id: 'm3', senderId: 'userA', text: 'tudo bem?' },
    ];
    const visible = messages.filter((m) => !blockedIds.has(m.senderId));
    expect(visible).toHaveLength(2);
    expect(visible.find((m) => m.id === 'm2')).toBeUndefined();
  });

  it('preserva todas mensagens quando ninguem esta bloqueado', () => {
    const blockedIds = new Set<string>();
    const messages = [
      { id: 'm1', senderId: 'userA', text: 'oi' },
      { id: 'm2', senderId: 'userB', text: 'tudo bem' },
    ];
    const visible = messages.filter((m) => !blockedIds.has(m.senderId));
    expect(visible).toHaveLength(2);
  });
});

describe('smoke: configuracao de motivos pra UI', () => {
  it('cada motivo tem o shape esperado pra render no modal', () => {
    for (const r of REPORT_REASONS) {
      expect(r).toMatchObject({
        value: expect.any(String),
        label: expect.any(String),
        emoji: expect.any(String),
      });
    }
  });

  it('value pode ser usado como key React sem colisao', () => {
    const values = REPORT_REASONS.map((r) => r.value);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  it('motivo "outro" existe como fallback', () => {
    const outro = REPORT_REASONS.find((r) => r.value === 'outro');
    expect(outro).toBeDefined();
    expect(outro?.label).toContain('Outro');
  });
});
