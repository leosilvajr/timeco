import React from 'react';
import { View, Text } from 'react-native';
import { useThemedColors } from '../../../../store';

interface Props {
  emoji: string;
  title: string;
  playerNumber: number;
  playerName: string;
  playerPosition?: string;
  value: number | string;
}

/** Card de destaque (Maior pontuador, etc) no Dashboard nativo. */
export const HighlightRow: React.FC<Props> = React.memo(
  ({ emoji, title, playerNumber, playerName, playerPosition, value }) => {
    const c = useThemedColors();
    return (
      <View
        style={{
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: 10,
          padding: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          marginBottom: 6,
        }}
      >
        <Text style={{ fontSize: 22 }}>{emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 11,
              color: c.textSecondary,
              fontWeight: '700',
              textTransform: 'uppercase',
            }}
          >
            {title}
          </Text>
          <Text style={{ fontSize: 15, fontWeight: '800', color: c.text }}>
            #{playerNumber} {playerName}
            {playerPosition ? (
              <Text style={{ color: c.textMuted, fontWeight: '600' }}>
                {' '}
                · {playerPosition}
              </Text>
            ) : null}
          </Text>
        </View>
        <Text style={{ fontSize: 20, fontWeight: '900', color: c.primary }}>{value}</Text>
      </View>
    );
  },
);
HighlightRow.displayName = 'HighlightRow';
