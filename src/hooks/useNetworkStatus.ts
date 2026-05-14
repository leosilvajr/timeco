/**
 * Hook universal pra detectar status de conexao.
 *
 * - Web: usa `navigator.onLine` + eventos online/offline (sem dependencias).
 * - Native (.native.ts): usa @react-native-community/netinfo (Wi-Fi/celular).
 *
 * Metro escolhe automaticamente .native.ts no APK e este arquivo no web.
 */

import { useEffect, useState } from 'react';

export interface NetworkStatus {
  isConnected: boolean;
  /** True se tem certeza que esta online (vs apenas "navigator says so"). */
  isReachable: boolean;
}

export const useNetworkStatus = (): NetworkStatus => {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isReachable: typeof navigator !== 'undefined' ? navigator.onLine : true,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () =>
      setStatus({
        isConnected: navigator.onLine,
        isReachable: navigator.onLine,
      });
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return status;
};
