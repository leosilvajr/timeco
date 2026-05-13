import React from 'react';
import { View, Text } from 'react-native';
import { Button } from '../../../../components';
import { useThemedColors } from '../../../../store';
import { VolleyMatch } from '../../../../types';

interface Props {
  match: VolleyMatch;
  busy: boolean;
  onStartMatch: () => void;
}

/** Banners 'scheduled' / 'finished' do Scout nativo. */
export const MatchStatusBanners: React.FC<Props> = ({ match, busy, onStartMatch }) => {
  const c = useThemedColors();

  if (match.status === 'scheduled') {
    return (
      <View
        style={{
          backgroundColor: c.warning + '22',
          borderWidth: 2,
          borderColor: c.warning,
          borderRadius: 10,
          padding: 14,
          marginBottom: 12,
        }}
      >
        <Text
          style={{
            fontSize: 13,
            fontWeight: '800',
            color: c.warning,
            marginBottom: 6,
            textAlign: 'center',
          }}
        >
          ⏳ PARTIDA AGENDADA
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: c.text,
            marginBottom: 10,
            textAlign: 'center',
          }}
        >
          Essa partida está marcada pra{' '}
          <Text style={{ fontWeight: '800' }}>
            {match.date.split('-').reverse().join('/')}
          </Text>
          . Inicie agora pra começar a registrar.
        </Text>
        <Button title="🏐 Iniciar partida agora" onPress={onStartMatch} loading={busy} />
      </View>
    );
  }

  if (match.status === 'finished') {
    return (
      <View
        style={{
          backgroundColor: c.success + '22',
          borderWidth: 2,
          borderColor: c.success,
          borderRadius: 10,
          padding: 12,
          marginBottom: 12,
        }}
      >
        <Text
          style={{
            fontSize: 13,
            fontWeight: '800',
            color: c.success,
            marginBottom: 4,
            textAlign: 'center',
          }}
        >
          🏁 PARTIDA FINALIZADA
        </Text>
        <Text style={{ fontSize: 12, color: c.textSecondary, textAlign: 'center' }}>
          Modo somente leitura. Os contadores não podem mais ser alterados.
        </Text>
      </View>
    );
  }

  return null;
};
