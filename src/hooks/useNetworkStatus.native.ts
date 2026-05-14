/**
 * Versao nativa do useNetworkStatus — usa @react-native-community/netinfo.
 *
 * Diferenca vs web: detecta tipo de conexao (Wi-Fi vs celular vs nenhuma)
 * e tem ping real pra confirmar 'isInternetReachable' (Wi-Fi sem internet
 * captiva — Starbucks etc).
 */

import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export interface NetworkStatus {
  isConnected: boolean;
  isReachable: boolean;
}

export const useNetworkStatus = (): NetworkStatus => {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isReachable: true,
  });

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setStatus({
        isConnected: state.isConnected ?? false,
        isReachable: state.isInternetReachable ?? state.isConnected ?? false,
      });
    });
    // Pega o estado inicial uma vez
    NetInfo.fetch().then((state) => {
      setStatus({
        isConnected: state.isConnected ?? false,
        isReachable: state.isInternetReachable ?? state.isConnected ?? false,
      });
    });
    return () => unsub();
  }, []);

  return status;
};
