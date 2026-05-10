import React from 'react';
import { modals } from '@mantine/modals';
import { Text } from '@mantine/core';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Vermelho pra acoes destrutivas (delete, cancel evento). */
  danger?: boolean;
}

/**
 * Modal de confirmacao baseado em @mantine/modals (substitui window.confirm).
 * Returns Promise<boolean> que resolve com true se confirmou, false se cancelou.
 *
 * Uso:
 *   if (await webConfirm({ message: 'Apagar foto?' })) {
 *     await delete();
 *   }
 *
 * Vantagens vs window.confirm:
 * - Visual integrado ao tema do app
 * - Suporta botao destacado em vermelho pra acoes destrutivas
 * - Fecha com ESC, click fora, ou botoes
 * - Acessivel (focus trap)
 */
export const webConfirm = (opts: ConfirmOptions): Promise<boolean> => {
  return new Promise((resolve) => {
    modals.openConfirmModal({
      title: opts.title ?? 'Confirmar',
      centered: true,
      children: <Text size="sm">{opts.message}</Text>,
      labels: {
        confirm: opts.confirmLabel ?? 'Sim',
        cancel: opts.cancelLabel ?? 'Cancelar',
      },
      confirmProps: opts.danger ? { color: 'red' } : { color: 'timeco' },
      onConfirm: () => resolve(true),
      onCancel: () => resolve(false),
      onClose: () => resolve(false),
    });
  });
};
