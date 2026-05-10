import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  /** Duracao em ms. Default 3500ms (4s pra error). 0 = nao some sozinho. */
  duration?: number;
  /** Acao opcional clicavel no toast. */
  action?: { label: string; onPress: () => void };
}

interface ToastStore {
  toasts: Toast[];
  show: (toast: Omit<Toast, 'id'>) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

let nextId = 0;
const genId = () => `toast_${Date.now().toString(36)}_${nextId++}`;

const DEFAULT_DURATION: Record<ToastType, number> = {
  success: 3000,
  info: 3000,
  warning: 4000,
  error: 5000,
};

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  show: (toast) => {
    const id = genId();
    const duration = toast.duration ?? DEFAULT_DURATION[toast.type];
    set((s) => ({ toasts: [...s.toasts, { id, ...toast }] }));
    if (duration > 0) {
      setTimeout(() => {
        get().dismiss(id);
      }, duration);
    }
    return id;
  },
  dismiss: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
  clear: () => set({ toasts: [] }),
}));

/**
 * Helpers shorthand pra disparar toasts de qualquer lugar (services, screens).
 *
 * Uso:
 *   toast.success('Evento criado!');
 *   toast.error('Falha ao salvar', 5000);
 *   toast.info('Foto adicionada à galeria');
 */
export const toast = {
  success: (message: string, duration?: number) =>
    useToastStore.getState().show({ type: 'success', message, duration }),
  error: (message: string, duration?: number) =>
    useToastStore.getState().show({ type: 'error', message, duration }),
  info: (message: string, duration?: number) =>
    useToastStore.getState().show({ type: 'info', message, duration }),
  warning: (message: string, duration?: number) =>
    useToastStore.getState().show({ type: 'warning', message, duration }),
};
