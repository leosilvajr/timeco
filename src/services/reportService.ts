/**
 * Sistema de denuncia de conteudo gerado pelo usuario (UGC).
 *
 * Compliance obrigatorio Play Store + App Store quando o app permite
 * usuarios interagirem entre si (perfis, chat, fotos compartilhadas).
 *
 * Fluxo:
 * 1. User clica em "Denunciar" em algum conteudo
 * 2. Modal coleta motivo + detalhes opcional
 * 3. createReport() grava em reports/{auto} (qualquer user autenticado escreve)
 * 4. Apenas superadmin pode listar/atualizar via listReports / updateReportStatus
 * 5. Admin marca como reviewed/actioned/dismissed
 */

import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit as fbLimit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Report,
  ReportContentType,
  ReportReason,
  ReportStatus,
} from '../types';

export interface CreateReportInput {
  reporterId: string;
  reportedUserId: string;
  contentType: ReportContentType;
  contentId: string;
  contentRef?: string;
  reason: ReportReason;
  details?: string;
  contentSnapshot?: Record<string, unknown>;
}

/**
 * Cria uma denuncia. Qualquer usuario autenticado pode chamar.
 * Returns: ID do report criado.
 */
export const createReport = async (input: CreateReportInput): Promise<string> => {
  // Sanitiza details — limita a 500 chars
  const details = input.details?.trim().slice(0, 500) || undefined;

  const ref = await addDoc(collection(db, 'reports'), {
    reporterId: input.reporterId,
    reportedUserId: input.reportedUserId,
    contentType: input.contentType,
    contentId: input.contentId,
    contentRef: input.contentRef || null,
    reason: input.reason,
    details: details || null,
    status: 'open' as ReportStatus,
    contentSnapshot: input.contentSnapshot || null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

/** Lista denuncias (apenas superadmin). Filtra por status opcional. */
export const listReports = async (
  status?: ReportStatus,
  limit = 50,
): Promise<Report[]> => {
  const constraints = [];
  if (status) constraints.push(where('status', '==', status));
  constraints.push(orderBy('createdAt', 'desc'));
  constraints.push(fbLimit(limit));

  const snap = await getDocs(query(collection(db, 'reports'), ...constraints));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Report));
};

/** Apenas superadmin pode atualizar status de uma denuncia. */
export const updateReportStatus = async (
  reportId: string,
  status: ReportStatus,
  reviewedBy: string,
  reviewNotes?: string,
): Promise<void> => {
  await updateDoc(doc(db, 'reports', reportId), {
    status,
    reviewedBy,
    reviewedAt: serverTimestamp(),
    reviewNotes: reviewNotes?.trim().slice(0, 500) || null,
  });
};

/** Conta denuncias abertas (pra badge no SuperAdmin). */
export const countOpenReports = async (): Promise<number> => {
  const snap = await getDocs(
    query(collection(db, 'reports'), where('status', '==', 'open'), fbLimit(100)),
  );
  return snap.size;
};

// ============ Helpers de motivos pra UI ============

export const REPORT_REASONS: { value: ReportReason; label: string; emoji: string }[] = [
  { value: 'spam', label: 'Spam ou propaganda', emoji: '📢' },
  { value: 'inadequado', label: 'Conteúdo inadequado', emoji: '🚫' },
  { value: 'assedio', label: 'Assédio ou bullying', emoji: '😠' },
  { value: 'violencia', label: 'Violência ou ódio', emoji: '⚠️' },
  { value: 'fake', label: 'Perfil falso ou impersonator', emoji: '🎭' },
  { value: 'outro', label: 'Outro motivo', emoji: '❓' },
];

export const reasonLabel = (reason: ReportReason): string =>
  REPORT_REASONS.find((r) => r.value === reason)?.label || reason;

export const contentTypeLabel = (type: ReportContentType): string => {
  const map: Record<ReportContentType, string> = {
    user: 'Perfil de usuário',
    event: 'Evento',
    photo: 'Foto',
    message: 'Mensagem',
  };
  return map[type] || type;
};
