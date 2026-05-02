import { useEffect, useState } from 'react';
import { Dimensions, Platform } from 'react-native';
import {
  ResponsiveSnapshot,
  buildSnapshot,
  breakpoints,
  maxContentWidth,
  layoutFor,
  DeviceLayout,
} from './responsive';

export { breakpoints, maxContentWidth, layoutFor };
export type { DeviceLayout };

export interface Responsive extends ResponsiveSnapshot {
  isWeb: boolean;
}

const buildState = (): Responsive => {
  const dim = Dimensions.get('window');
  return {
    ...buildSnapshot({ width: dim.width, height: dim.height }),
    isWeb: Platform.OS === 'web',
  };
};

/**
 * Hook reativo de viewport. No web, atualiza ao redimensionar o navegador.
 * No mobile nativo, valor fica praticamente fixo (responde a rotação).
 */
export const useResponsive = (): Responsive => {
  const [state, setState] = useState<Responsive>(() => buildState());

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setState({
        ...buildSnapshot({ width: window.width, height: window.height }),
        isWeb: Platform.OS === 'web',
      });
    });
    return () => sub.remove();
  }, []);

  return state;
};
