import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Card, Input, Button, StarRating, SportPicker } from '../../components';
import { colors, spacing, radius } from '../../constants/theme';
import { useThemedColors } from '../../store';
import { drawQuickTeams, QuickDrawnTeam, QuickPlayer } from '../../services/teamDrawService';
import { shareText } from '../../services/shareService';
import { formatQuickTeams } from '../../utils/teamShareText';
import { getSport } from '../../constants/sports';
import { SportId } from '../../types';
import type { EventsStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<EventsStackParamList, 'QuickDraw'>;

const tempId = (() => {
  let n = 0;
  return () => {
    n += 1;
    return `q${Date.now().toString(36)}_${n}`;
  };
})();

export const QuickDrawScreen: React.FC = () => {
  useThemedColors();
  const nav = useNavigation<Nav>();

  const [sport, setSport] = useState<SportId>('soccer');
  const [players, setPlayers] = useState<QuickPlayer[]>([]);
  const [pendingName, setPendingName] = useState('');
  const [pendingStars, setPendingStars] = useState(3);
  const [teamsCount, setTeamsCount] = useState(2);
  const [result, setResult] = useState<QuickDrawnTeam[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addPlayer = () => {
    setError(null);
    const name = pendingName.trim();
    if (!name) return setError('Digita um nome antes de adicionar');
    setPlayers((prev) => [...prev, { id: tempId(), name, stars: pendingStars }]);
    setPendingName('');
    setPendingStars(3);
  };

  const removePlayer = (id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    setResult(null);
  };

  const updateStars = (id: string, stars: number) => {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, stars } : p)));
    setResult(null);
  };

  const onDraw = () => {
    setError(null);
    if (teamsCount < 2) return setError('Mínimo 2 times');
    if (players.length < teamsCount) {
      return setError(`Adicione pelo menos ${teamsCount} jogadores`);
    }
    try {
      setResult(drawQuickTeams(players, teamsCount));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao sortear');
    }
  };

  const onClear = () => {
    if (typeof window !== 'undefined' && !window.confirm('Limpar tudo e começar de novo?')) {
      return;
    }
    setPlayers([]);
    setResult(null);
    setError(null);
  };

  const onShare = () => {
    if (!result) return;
    const sportCfg = getSport(sport);
    const txt = formatQuickTeams(
      result.map((t) => ({
        name: t.name,
        players: t.players.map((p) => ({ name: p.name, stars: p.stars })),
        totalStars: t.totalStars,
      })),
      { sportEmoji: sportCfg.emoji, sportLabel: sportCfg.label },
    );
    shareText(txt, 'Sorteio rápido · Timeco');
  };

  const styles = StyleSheet.create({
    intro: {
      backgroundColor: colors.surfaceVariant,
      marginBottom: spacing.md,
    },
    introTxt: { fontSize: 13, color: colors.text, lineHeight: 19 },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    addRow: { gap: spacing.sm },
    starsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    starsLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
    playerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    playerName: { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1 },
    removeBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeTxt: { color: colors.danger, fontWeight: '900', fontSize: 14 },
    teamsCounter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
    },
    counterBtns: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    counterBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    counterTxt: { fontSize: 18, fontWeight: '900', color: colors.primary },
    counterValue: { fontSize: 22, fontWeight: '900', color: colors.text, minWidth: 28, textAlign: 'center' },
    teamCard: {
      marginBottom: spacing.md,
      borderWidth: 2,
      overflow: 'hidden',
      paddingTop: 0,
      paddingHorizontal: 0,
    },
    teamHeader: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    teamHeaderTxt: { color: colors.white, fontSize: 17, fontWeight: '900' },
    teamHeaderSub: { color: colors.white, opacity: 0.9, fontSize: 12, marginTop: 2 },
    teamPlayer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xs,
    },
    teamPlayerName: { fontSize: 14, fontWeight: '600', color: colors.text, flex: 1 },
    error: { color: colors.danger, marginVertical: spacing.sm, textAlign: 'center', fontWeight: '600' },
  });

  return (
    <Screen maxWidth={720}>
      <Header
        title="Sorteio rápido"
        subtitle="Sem cadastro · só para esta vez"
        onBack={() => nav.goBack()}
      />

      <Card style={styles.intro}>
        <Text style={styles.introTxt}>
          🎲 Adicione os jogadores que estão na pelada agora, dê estrelas para cada um e sorteie os
          times. Nada é salvo — quando sair da tela, some.
        </Text>
      </Card>

      <Text style={styles.sectionTitle}>Esporte</Text>
      <SportPicker value={sport} onChange={setSport} />

      <Text style={styles.sectionTitle}>Adicionar jogador</Text>
      <Card style={styles.addRow}>
        <Input
          label="Nome"
          value={pendingName}
          onChangeText={setPendingName}
          placeholder="Ex: João"
          onSubmitEditing={addPlayer}
        />
        <View style={styles.starsRow}>
          <Text style={styles.starsLabel}>Estrelas (1 a 5)</Text>
          <StarRating value={pendingStars} editable size={26} onChange={setPendingStars} />
        </View>
        <Button title="+ Adicionar jogador" variant="secondary" onPress={addPlayer} />
      </Card>

      {players.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Jogadores ({players.length})</Text>
          <Card>
            {players.map((p) => (
              <View key={p.id} style={styles.playerRow}>
                <Text style={styles.playerName}>{p.name}</Text>
                <StarRating value={p.stars} editable size={18} onChange={(v) => updateStars(p.id, v)} />
                <Pressable style={styles.removeBtn} onPress={() => removePlayer(p.id)} hitSlop={6}>
                  <Text style={styles.removeTxt}>×</Text>
                </Pressable>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      <Text style={styles.sectionTitle}>Quantidade de times</Text>
      <Card>
        <View style={styles.teamsCounter}>
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: '600' }}>Times</Text>
          <View style={styles.counterBtns}>
            <Pressable
              style={styles.counterBtn}
              onPress={() => setTeamsCount((n) => Math.max(2, n - 1))}
              hitSlop={6}
            >
              <Text style={styles.counterTxt}>−</Text>
            </Pressable>
            <Text style={styles.counterValue}>{teamsCount}</Text>
            <Pressable
              style={styles.counterBtn}
              onPress={() => setTeamsCount((n) => Math.min(8, n + 1))}
              hitSlop={6}
            >
              <Text style={styles.counterTxt}>+</Text>
            </Pressable>
          </View>
        </View>
      </Card>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
        <Button title="🎲 Sortear times" onPress={onDraw} />
        <Button title="Cancelar" variant="ghost" onPress={() => nav.popToTop()} />
      </View>

      {result ? (
        <>
          <Text style={styles.sectionTitle}>Resultado</Text>
          {result.map((t, idx) => (
            <Card key={idx} style={[styles.teamCard, { borderColor: t.color, borderRadius: radius.lg }]}>
              <View style={[styles.teamHeader, { backgroundColor: t.color }]}>
                <Text style={styles.teamHeaderTxt}>{t.name}</Text>
                <Text style={styles.teamHeaderSub}>
                  ⭐ {t.totalStars.toFixed(1)} • média{' '}
                  {(t.totalStars / Math.max(1, t.players.length)).toFixed(1)}
                </Text>
              </View>
              <View style={{ paddingTop: spacing.sm, paddingBottom: spacing.sm }}>
                {t.players.map((p) => (
                  <View key={p.id} style={styles.teamPlayer}>
                    <Text style={styles.teamPlayerName}>{p.name}</Text>
                    <StarRating value={p.stars} size={14} />
                  </View>
                ))}
              </View>
            </Card>
          ))}

          <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
            <Button title="📲 Compartilhar times" variant="secondary" onPress={onShare} />
            <Button title="🎲 Sortear de novo" variant="outline" onPress={onDraw} />
            <Button title="🗑️ Limpar tudo" variant="ghost" onPress={onClear} />
          </View>
        </>
      ) : null}

      <View style={{ height: spacing.xxl }} />
    </Screen>
  );
};
