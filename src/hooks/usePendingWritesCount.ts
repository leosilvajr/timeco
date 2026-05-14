/**
 * Hook que conta quantos writes do Firestore estao em fila localmente
 * (aguardando sync online). Util pra mostrar "X acoes pendentes" no
 * Scout/Header e dar tranquilidade ao usuario.
 *
 * Implementacao: intercepta o ciclo de vida do writeQueueRef do screen
 * que chama. Como nao temos acesso direto ao PENDING_WRITES interno do
 * SDK, contamos manualmente via increment/decrement.
 *
 * Uso:
 *   const { pending, trackWrite } = usePendingWritesCount();
 *   // ao disparar um write:
 *   const promise = performScoutAction(...);
 *   trackWrite(promise);
 *   // hook decrementa quando promise resolve/rejeita
 */

import { useCallback, useState } from 'react';

interface PendingWritesApi {
  pending: number;
  trackWrite: (promise: Promise<unknown>) => Promise<unknown>;
}

export const usePendingWritesCount = (): PendingWritesApi => {
  const [pending, setPending] = useState(0);

  const trackWrite = useCallback((promise: Promise<unknown>) => {
    setPending((p) => p + 1);
    const wrapped = promise.finally(() => {
      setPending((p) => Math.max(0, p - 1));
    });
    return wrapped;
  }, []);

  return { pending, trackWrite };
};
