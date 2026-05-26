import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useThemedColors } from '../../../../store';
import { VolleyPlayer } from '../../../../types';

interface Props {
  players: VolleyPlayer[];
  inCourtNumbers?: number[];
  selectedPlayer: number | null;
  onSelect: (playerNumber: number) => void;
}

interface RowProps {
  player: VolleyPlayer;
  isSelected: boolean;
  onPress: () => void;
  compact?: boolean;
}

const PlayerRow: React.FC<RowProps> = ({ player, isSelected, onPress, compact = false }) => {
  const c = useThemedColors();
  const styles = StyleSheet.create({
    row: {
      width: '100%',
      paddingHorizontal: compact ? 10 : 12,
      paddingVertical: compact ? 4 : 6,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: isSelected ? c.primary : c.border,
      backgroundColor: isSelected ? c.primary : c.surface,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 4,
    },
    number: {
      minWidth: 28,
      textAlign: 'center',
      fontSize: 12,
      fontWeight: '900',
      color: isSelected ? c.onPrimary : c.text,
      opacity: isSelected ? 0.85 : 0.55,
    },
    name: {
      flex: 1,
      fontSize: compact ? 13 : 14,
      fontWeight: '700',
      color: isSelected ? c.onPrimary : c.text,
    },
    position: {
      fontSize: 11,
      fontWeight: '600',
      color: isSelected ? c.onPrimary : c.text,
      opacity: isSelected ? 0.85 : 0.6,
    },
  });
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Text style={styles.number}>#{player.number}</Text>
      <Text style={styles.name} numberOfLines={1}>
        {player.name}
      </Text>
      <Text style={styles.position}>{player.position}</Text>
    </Pressable>
  );
};

/**
 * Lista vertical de jogadores no Scout nativo: 'Em quadra' (6) + 'Banco'.
 */
export const PlayerTabsStrip: React.FC<Props> = ({
  players,
  inCourtNumbers,
  selectedPlayer,
  onSelect,
}) => {
  const c = useThemedColors();
  const inCourtSet = new Set(inCourtNumbers ?? []);
  const inCourt = inCourtNumbers
    ? players.filter((p) => inCourtSet.has(p.number))
    : [];
  const bench = inCourtNumbers
    ? players.filter((p) => !inCourtSet.has(p.number))
    : players;
  const sortByNumber = (a: VolleyPlayer, b: VolleyPlayer) => a.number - b.number;
  inCourt.sort(sortByNumber);
  bench.sort(sortByNumber);

  const sectionLabelStyle = {
    fontSize: 10,
    fontWeight: '800' as const,
    color: c.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
    marginTop: 8,
    marginBottom: 4,
  };

  return (
    <View>
      {inCourt.length > 0 ? (
        <>
          <Text style={sectionLabelStyle}>
            🏐 Em quadra ({inCourt.length})
          </Text>
          {inCourt.map((p) => (
            <PlayerRow
              key={p.number}
              player={p}
              isSelected={p.number === selectedPlayer}
              onPress={() => onSelect(p.number)}
            />
          ))}
        </>
      ) : null}

      {bench.length > 0 ? (
        <>
          <Text style={sectionLabelStyle}>
            🪑 Banco ({bench.length})
          </Text>
          {bench.map((p) => (
            <PlayerRow
              key={p.number}
              player={p}
              isSelected={p.number === selectedPlayer}
              onPress={() => onSelect(p.number)}
              compact
            />
          ))}
        </>
      ) : null}
    </View>
  );
};
