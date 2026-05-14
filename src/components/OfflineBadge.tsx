import React from 'react';
import { View, Text, Platform } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useThemedColors } from '../store';

/**
 * Badge fixo no topo da tela mostrando '📴 OFFLINE' quando o usuario perde
 * conexao. Some sozinho quando volta online. Discreto mas visivel.
 *
 * Renderiza no web e native — Platform.OS so muda padding pra acomodar
 * status bar do APK.
 */
export const OfflineBadge: React.FC = () => {
  const { isReachable } = useNetworkStatus();
  const c = useThemedColors();
  if (isReachable) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: Platform.OS === 'web' ? 0 : 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: c.warning,
        paddingVertical: 6,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
      pointerEvents="none"
    >
      <Text
        style={{
          color: c.black,
          fontSize: 12,
          fontWeight: '800',
          letterSpacing: 0.5,
        }}
      >
        📴 OFFLINE — suas ações serão sincronizadas quando voltar a conexão
      </Text>
    </View>
  );
};
