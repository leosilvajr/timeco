/**
 * Fila de uploads de foto pra retry automatico quando voltar a conexao.
 *
 * Por que: Firebase Storage NAO tem persistencia offline nativa (diferente
 * do Firestore). Sem essa fila, upar foto sem internet falha com erro de
 * rede e o usuario perde a tentativa.
 *
 * Como funciona:
 * 1. Chama `enqueueUpload(uploadFn)` em vez de `await uploadFn()`.
 * 2. Tenta executar imediatamente. Se sucesso: resolve normalmente.
 * 3. Se erro de rede (offline): adiciona na fila in-memory, NAO rejeita
 *    (caller ve "uploadando", nao "falhou").
 * 4. Quando o NetInfo dispara isReachable=true, drena a fila em sequencia.
 *
 * Limitacoes (assumidas pra simplicidade):
 * - In-memory only: fechar o app perde a fila. Pra persistir entre
 *   sessoes precisaria salvar o Blob/URI no storage local (IndexedDB no
 *   web, expo-file-system no native) — fica como follow-up.
 * - Sem cap de tamanho: se enfileirar 100 fotos pesadas, drena tudo em
 *   sequencia (1 por vez) quando voltar online.
 */

import { useEffect, useState } from 'react';

export interface QueueEntry<T = unknown> {
  id: string;
  label: string;
  uploadFn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (err: unknown) => void;
  attempts: number;
}

const queue: QueueEntry[] = [];
const listeners = new Set<() => void>();
let draining = false;

const notify = (): void => {
  for (const l of listeners) l();
};

const isNetworkError = (err: unknown): boolean => {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: string; message?: string };
  // Codigos de erro do Firebase Storage que indicam problema de rede
  return (
    e.code === 'storage/retry-limit-exceeded' ||
    e.code === 'storage/network-request-failed' ||
    /network|offline|fetch/i.test(e.message || '')
  );
};

const drainQueue = async (): Promise<void> => {
  if (draining) return;
  draining = true;
  while (queue.length > 0) {
    const entry = queue[0];
    try {
      const value = await entry.uploadFn();
      queue.shift();
      entry.resolve(value);
    } catch (err) {
      if (isNetworkError(err) && entry.attempts < 5) {
        entry.attempts += 1;
        // Para o drain — vai retentar quando o proximo trigger acontecer
        break;
      }
      // Erro nao recuperavel — descarta e rejeita pro caller saber
      queue.shift();
      entry.reject(err);
    }
    notify();
  }
  draining = false;
  notify();
};

/**
 * Tenta executar uploadFn imediatamente. Se falhar com erro de rede,
 * enfileira pra retry quando voltar online. Resolve quando o upload
 * realmente terminar (pode demorar minutos se offline).
 */
export const enqueueUpload = <T>(
  label: string,
  uploadFn: () => Promise<T>,
): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const entry: QueueEntry<T> = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      label,
      uploadFn,
      resolve: resolve as (v: unknown) => void as (v: T) => void,
      reject,
      attempts: 0,
    };
    queue.push(entry as unknown as QueueEntry);
    notify();
    void drainQueue();
  });
};

/** Trigger manual de drain — chamar quando NetInfo virar online. */
export const tryDrainQueue = (): void => {
  void drainQueue();
};

export const getPendingUploadsCount = (): number => queue.length;
export const getPendingUploadsLabels = (): string[] => queue.map((e) => e.label);

const subscribePendingChanges = (cb: () => void): (() => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

/** Hook React pra contar/listar uploads pendentes na UI. */
export const usePendingUploads = (): { count: number; labels: string[] } => {
  const [state, setState] = useState({
    count: getPendingUploadsCount(),
    labels: getPendingUploadsLabels(),
  });
  useEffect(() => {
    return subscribePendingChanges(() => {
      setState({
        count: getPendingUploadsCount(),
        labels: getPendingUploadsLabels(),
      });
    });
  }, []);
  return state;
};
