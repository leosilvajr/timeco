import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Input, Button, Card } from '../../components';
import { colors, spacing, radius } from '../../constants/theme';
import { useThemedColors } from '../../store';
import { useScoreboardStore } from '../../store/scoreboardStore';
import { ScoreboardConfig } from '../../services/scoreboardLogic';
import type { ScoreboardStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<ScoreboardStackParamList, 'ScoreboardSetup'>;

interface Preset {
  id: string;
  emoji: string;
  label: string;
  desc: string;
  config: Omit<ScoreboardConfig, 'teamAName' | 'teamBName'>;
}

const PRESETS: Preset[] = [
  {
    id: 'volley_official',
    emoji: '🏐',
    label: 'Vôlei oficial',
    desc: 'Melhor de 5 sets · 25 pts (15 no decisivo) · vantagem 2',
    config: { pointsToWin: 25, winByTwo: true, bestOfSets: 5, finalSetPointsToWin: 15 },
  },
  {
    id: 'volley_amateur',
    emoji: '🏐',
    label: 'Vôlei amador',
    desc: 'Melhor de 3 sets · 25 pts · vantagem 2',
    config: { pointsToWin: 25, winByTwo: true, bestOfSets: 3, finalSetPointsToWin: 15 },
  },
  {
    id: 'tabletennis',
    emoji: '🏓',
    label: 'Tênis de mesa',
    desc: 'Melhor de 5 sets · 11 pts · vantagem 2',
    config: { pointsToWin: 11, winByTwo: true, bestOfSets: 5 },
  },
  {
    id: 'casual',
    emoji: '⚽',
    label: 'Pelada / Futebol',
    desc: '1 set · 10 pts · sem vantagem',
    config: { pointsToWin: 10, winByTwo: false, bestOfSets: 1 },
  },
  {
    id: 'beach',
    emoji: '🏖️',
    label: 'Vôlei de praia',
    desc: 'Melhor de 3 sets · 21 pts (15 no decisivo) · vantagem 2',
    config: { pointsToWin: 21, winByTwo: true, bestOfSets: 3, finalSetPointsToWin: 15 },
  },
  {
    id: 'truco',
    emoji: '🃏',
    label: 'Truco',
    desc: '1 partida · 12 pontos · sem vantagem',
    config: { pointsToWin: 12, winByTwo: false, bestOfSets: 1 },
  },
];

export const ScoreboardSetupScreen: React.FC = () => {
  useThemedColors();
  const nav = useNavigation<Nav>();
  const init = useScoreboardStore((s) => s.init);

  const [teamAName, setTeamAName] = useState('Time 1');
  const [teamBName, setTeamBName] = useState('Time 2');
  const [presetId, setPresetId] = useState<string>('volley_amateur');
  const [pointsToWin, setPointsToWin] = useState('25');
  const [winByTwo, setWinByTwo] = useState(true);
  const [bestOfSets, setBestOfSets] = useState('3');
  const [finalSetPointsToWin, setFinalSetPointsToWin] = useState('15');

  const isCustom = presetId === 'custom';

  const onSelectPreset = (p: Preset) => {
    setPresetId(p.id);
    setPointsToWin(String(p.config.pointsToWin));
    setWinByTwo(p.config.winByTwo);
    setBestOfSets(String(p.config.bestOfSets));
    setFinalSetPointsToWin(String(p.config.finalSetPointsToWin ?? p.config.pointsToWin));
  };

  const onStart = () => {
    const selectedPreset = PRESETS.find((p) => p.id === presetId);
    const modalityLabel = isCustom ? 'Personalizado' : selectedPreset?.label;
    const config: ScoreboardConfig = {
      teamAName: teamAName.trim() || 'Time 1',
      teamBName: teamBName.trim() || 'Time 2',
      pointsToWin: parseInt(pointsToWin, 10) || 25,
      winByTwo,
      bestOfSets: parseInt(bestOfSets, 10) || 1,
      finalSetPointsToWin: finalSetPointsToWin
        ? parseInt(finalSetPointsToWin, 10)
        : undefined,
      modalityLabel,
    };
    init(config);
    nav.replace('ScoreboardLive');
  };

  const styles = StyleSheet.create({
    intro: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    introTxt: { fontSize: 14, color: colors.text, lineHeight: 20 },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    presetCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    presetCardActive: {
      borderColor: colors.primary,
      backgroundColor: colors.surfaceVariant,
    },
    presetEmoji: { fontSize: 28 },
    presetLabel: { fontSize: 15, fontWeight: '800', color: colors.text },
    presetDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    customCardActive: { borderColor: colors.primary },
    row: { flexDirection: 'row', gap: spacing.md },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
    },
    toggleLabel: { fontSize: 15, color: colors.text, fontWeight: '600' },
    toggleHint: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    toggle: {
      width: 44,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.border,
      padding: 3,
    },
    toggleActive: { backgroundColor: colors.primary },
    toggleHandle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.surface,
    },
    toggleHandleActive: { transform: [{ translateX: 18 }] },
  });

  return (
    <Screen maxWidth={680}>
      <Header title="Placar eletrônico" subtitle="Configure a partida" onBack={() => nav.goBack()} />

      <View style={styles.intro}>
        <Text style={styles.introTxt}>
          🏆 Marque pontos durante o jogo. Os números ficam grandes e dá pra deixar o celular fixo
          no banco do reserva.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Times</Text>
      <Input label="Time 1 (esquerda)" value={teamAName} onChangeText={setTeamAName} />
      <Input label="Time 2 (direita)" value={teamBName} onChangeText={setTeamBName} />

      <Text style={styles.sectionTitle}>Modalidade</Text>
      {PRESETS.map((p) => (
        <Pressable
          key={p.id}
          onPress={() => onSelectPreset(p)}
          style={[styles.presetCard, presetId === p.id && styles.presetCardActive]}
        >
          <Text style={styles.presetEmoji}>{p.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.presetLabel}>{p.label}</Text>
            <Text style={styles.presetDesc}>{p.desc}</Text>
          </View>
        </Pressable>
      ))}
      <Pressable
        onPress={() => setPresetId('custom')}
        style={[styles.presetCard, isCustom && styles.customCardActive]}
      >
        <Text style={styles.presetEmoji}>⚙️</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.presetLabel}>Personalizado</Text>
          <Text style={styles.presetDesc}>Configure manualmente abaixo</Text>
        </View>
      </Pressable>

      {isCustom ? (
        <Card style={{ marginTop: spacing.md, gap: spacing.sm }}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input
                label="Pontos por set"
                value={pointsToWin}
                onChangeText={setPointsToWin}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Melhor de N sets"
                value={bestOfSets}
                onChangeText={setBestOfSets}
                keyboardType="numeric"
                hint="1, 3 ou 5"
              />
            </View>
          </View>
          <Input
            label="Pontos no set decisivo"
            value={finalSetPointsToWin}
            onChangeText={setFinalSetPointsToWin}
            keyboardType="numeric"
            hint="Ex: 15 no vôlei. Deixe igual aos demais se não quiser diferente."
          />
          <Pressable onPress={() => setWinByTwo((v) => !v)} style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Vencer por 2 pontos</Text>
              <Text style={styles.toggleHint}>
                Se 24x24, joga até alguém abrir 2pt (regra clássica do vôlei)
              </Text>
            </View>
            <View style={[styles.toggle, winByTwo && styles.toggleActive]}>
              <View style={[styles.toggleHandle, winByTwo && styles.toggleHandleActive]} />
            </View>
          </Pressable>
        </Card>
      ) : null}

      <View style={{ marginTop: spacing.xl, marginBottom: spacing.xxl, gap: spacing.sm }}>
        <Button title="🏁  Iniciar partida" onPress={onStart} />
        <Button title="Cancelar" variant="ghost" onPress={() => nav.goBack()} />
      </View>
    </Screen>
  );
};
