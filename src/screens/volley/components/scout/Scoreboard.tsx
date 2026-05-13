import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemedColors } from '../../../../store';
import { VolleyMatch, VolleySetData } from '../../../../types';

interface Props {
  match: VolleyMatch;
  currentSet: VolleySetData | undefined;
  setsWonA: number;
  setsWonB: number;
}

interface TeamBoxProps {
  name: string;
  score: number;
  sets: number;
  serving: boolean;
  highlight: boolean;
}

const TeamBox: React.FC<TeamBoxProps> = ({ name, score, sets, serving, highlight }) => {
  const c = useThemedColors();
  const styles = StyleSheet.create({
    box: {
      flex: 1,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 10,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 2,
      gap: 10,
      backgroundColor: highlight ? c.surfaceVariant : c.surface,
      borderColor: highlight ? c.primary : c.border,
    },
    info: { flex: 1, minWidth: 0 },
    name: {
      fontSize: 10,
      fontWeight: '800',
      color: c.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    sets: { fontSize: 10, color: c.textMuted, marginTop: 1 },
    score: {
      fontSize: 24,
      fontWeight: '900',
      color: c.text,
      lineHeight: 26,
      minWidth: 30,
      textAlign: 'right',
    },
  });
  return (
    <View style={styles.box}>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.sets}>
          Sets {sets}
          {serving ? ' · 🎾' : ''}
        </Text>
      </View>
      <Text style={styles.score}>{score}</Text>
    </View>
  );
};

/** Scoreboard compacto do Scout nativo. */
export const Scoreboard: React.FC<Props> = ({ match, currentSet, setsWonA, setsWonB }) => {
  const isLive = !currentSet?.finished;
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
      <TeamBox
        name={match.teamAName}
        score={currentSet?.scoreA ?? 0}
        sets={setsWonA}
        serving={isLive && match.serveTeam === 'A'}
        highlight
      />
      <TeamBox
        name={match.teamBName}
        score={currentSet?.scoreB ?? 0}
        sets={setsWonB}
        serving={isLive && match.serveTeam === 'B'}
        highlight={false}
      />
    </View>
  );
};
