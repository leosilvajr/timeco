import React from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { EventsStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<EventsStackParamList, 'EventDetail'>;
type Rt = RouteProp<EventsStackParamList, 'EventDetail'>;

/**
 * VERSAO MINIMAL — POC pra testar se renderizar sem react-native-web
 * (sem Screen/Header/Card etc) faz o crash STATUS_ILLEGAL_INSTRUCTION
 * sumir em mobile. Se sim, reconstrumos a tela inteira com HTML puro
 * neste arquivo .web.tsx. Se nao, o crash e mais fundo (algo no bundle).
 */
export const EventDetailScreen: React.FC = () => {
  const route = useRoute<Rt>();
  const nav = useNavigation<Nav>();

  return (
    <div
      style={{
        padding: 24,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#1B2B20',
        background: '#F7FAF8',
        minHeight: '100vh',
      }}
    >
      <button
        onClick={() => nav.goBack()}
        style={{
          background: 'transparent',
          border: 'none',
          fontSize: 28,
          color: '#1B2B20',
          padding: 8,
          cursor: 'pointer',
        }}
      >
        ‹ Voltar
      </button>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginTop: 16 }}>
        EventDetail (web minimal)
      </h1>
      <p style={{ fontSize: 14, color: '#5C6D63', marginTop: 8 }}>
        Event ID: {route.params.eventId}
      </p>
      <p style={{ fontSize: 13, color: '#5C6D63', marginTop: 24, lineHeight: 1.6 }}>
        Esta versao usa HTML puro, sem react-native-web. Se essa pagina abrir
        no celular sem crash, o problema do app na web esta nas primitivas
        do react-native-web (View/Text/Pressable/Image/Modal). Vamos
        reconstruir cada tela em HTML neste padrao.
      </p>
    </div>
  );
};
