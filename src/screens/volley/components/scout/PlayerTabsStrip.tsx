import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useThemedColors } from '../../../../store';
import { spacing, radius } from '../../../../constants/theme';
import { VolleyPlayer } from '../../../../types';

interface Props {
  players: VolleyPlayer[];
  selectedPlayer: number | null;
  onSelect: (playerNumber: number) => void;
}

/** Strip horizontal de chips de jogador no Scout nativo. */
export const PlayerTabsStrip: React.FC<Props> = ({ players, selectedPlayer, onSelect }) => {
  const c = useThemedColors();
  const styles = StyleSheet.create({
    label: {
      fontSize: 11,
      fontWeight: '800',
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 6,
    },
    strip: { paddingBottom: spacing.sm },
    tab: {
      paddingHorizontal: 16,
      height: 40,
      borderRadius: radius.pill,
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderColor: c.border,
      marginRight: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    tabSelected: { backgroundColor: c.primary, borderColor: c.primary },
    tabNum: { fontSize: 11, fontWeight: '900', color: c.text, opacity: 0.55 },
    tabNumSelected: { color: c.onPrimary, opacity: 0.85 },
    tabName: { fontSize: 14, fontWeight: '700', color: c.text },
    tabNameSelected: { color: c.onPrimary },
  });
  return (
    <>
      <Text style={styles.label}>Jogador</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
      >
        {players.map((p) => {
          const isSel = p.number === selectedPlayer;
          return (
            <Pressable
              key={p.number}
              style={[styles.tab, isSel && styles.tabSelected]}
              onPress={() => onSelect(p.number)}
            >
              <Text style={[styles.tabNum, isSel && styles.tabNumSelected]}>
                #{p.number}
              </Text>
              <Text style={[styles.tabName, isSel && styles.tabNameSelected]}>
                {p.name.split(' ')[0]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </>
  );
};
