import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Input, Button, Card, DateInput } from '../../components';
import { colors, spacing, radius } from '../../constants/theme';
import { useAuthStore, useThemedColors } from '../../store';
import { createVolleyMatch } from '../../services/volleyScoutService';
import { formatError } from '../../utils/errorMessages';
import { isValidJerseyNumber } from '../../utils/validators';
import { VolleyFormat, VolleyPlayer, VolleyPosition, VolleyRotationSystem } from '../../types';
import type { VolleyStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<VolleyStackParamList, 'VolleyMatchSetup'>;

const POSITIONS: VolleyPosition[] = ['Oposto', 'Ponteiro', 'Central', 'Levantador', 'Líbero'];

const todayISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const VolleyMatchSetupScreen: React.FC = () => {
  useThemedColors();
  const nav = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);

  // Match info
  const [date, setDate] = useState(todayISO());
  const [location, setLocation] = useState('');
  const [teamAName, setTeamAName] = useState('');
  const [teamBName, setTeamBName] = useState('');
  const [format, setFormat] = useState<VolleyFormat>(3);
  const [rotationSystem, setRotationSystem] = useState<VolleyRotationSystem>('5x1');

  // Players
  const [players, setPlayers] = useState<VolleyPlayer[]>([]);
  const [pName, setPName] = useState('');
  const [pNumber, setPNumber] = useState('');
  const [pPosition, setPPosition] = useState<VolleyPosition>('Ponteiro');

  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const addPlayer = () => {
    setError(null);
    const name = pName.trim();
    const num = parseInt(pNumber, 10);
    if (!name) return setError('Digite o nome do jogador.');
    if (!isValidJerseyNumber(num))
      return setError('O número precisa ser inteiro entre 1 e 99.');
    if (players.some((p) => p.number === num))
      return setError(`Já existe um jogador com o número ${num}.`);
    setPlayers((prev) => [...prev, { name, number: num, position: pPosition }]);
    setPName('');
    setPNumber('');
  };

  const removePlayer = (n: number) => setPlayers((prev) => prev.filter((p) => p.number !== n));

  const onCreate = async () => {
    setError(null);
    if (!user) return;
    if (!teamAName.trim() || !teamBName.trim())
      return setError('Informe o nome das duas equipes.');
    if (!location.trim()) return setError('Informe o local da partida.');
    if (players.length === 0) return setError('Cadastre pelo menos 1 jogador antes de iniciar.');
    setCreating(true);
    try {
      const id = await createVolleyMatch({
        ownerId: user.id,
        date,
        location: location.trim(),
        teamAName: teamAName.trim(),
        teamBName: teamBName.trim(),
        format,
        rotationSystem,
        players: players.sort((a, b) => a.number - b.number),
      });
      nav.replace('VolleyScout', { matchId: id });
    } catch (e: unknown) {
      setError(formatError(e, 'Não conseguimos criar a partida agora. Tente de novo.'));
    } finally {
      setCreating(false);
    }
  };

  const styles = StyleSheet.create({
    sectionTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.text,
      marginBottom: spacing.sm,
      marginTop: spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    row: { flexDirection: 'row', gap: spacing.sm },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipTxt: { fontSize: 13, fontWeight: '600', color: colors.text },
    chipTxtSelected: { color: colors.white },
    posGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    posBtn: {
      flexBasis: '31%',
      flexGrow: 1,
      minHeight: 44,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    posBtnSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    posBtnTxt: { fontSize: 13, fontWeight: '700', color: colors.text },
    posBtnTxtSelected: { color: colors.white },
    playerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    playerNum: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    playerNumTxt: { color: colors.white, fontWeight: '900' },
    playerName: { fontSize: 14, fontWeight: '700', color: colors.text },
    playerPos: { fontSize: 12, color: colors.textSecondary },
    removeTxt: { color: colors.danger, fontWeight: '700' },
    error: { color: colors.danger, marginVertical: spacing.sm, textAlign: 'center' },
    selectorWrap: {
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      marginBottom: spacing.md,
    },
    selectorBtn: {
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
    },
    selectorBtnSelected: {
      backgroundColor: colors.surfaceVariant,
    },
    selectorBtnTxt: { color: colors.text, fontSize: 14, fontWeight: '600' },
  });

  return (
    <Screen maxWidth={840}>
      <Header title="Nova partida" onBack={() => nav.goBack()} />

      <Text style={styles.sectionTitle}>📋 Informações do jogo</Text>
      <DateInput label="Data" value={date} onChangeText={setDate} mode="event" />
      <Input label="Local" value={location} onChangeText={setLocation} placeholder="Ginásio ou quadra" />
      <Input label="Sua equipe" value={teamAName} onChangeText={setTeamAName} placeholder="Ex: Vôlei do Lucas" />
      <Input label="Equipe adversária" value={teamBName} onChangeText={setTeamBName} placeholder="Nome da equipe B" />

      <Text style={styles.sectionTitle}>🏆 Formato</Text>
      <View style={styles.chipRow}>
        {([3, 5] as VolleyFormat[]).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFormat(f)}
            style={[styles.chip, format === f && styles.chipSelected]}
          >
            <Text style={[styles.chipTxt, format === f && styles.chipTxtSelected]}>
              Melhor de {f}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>🔄 Sistema de rodízio</Text>
      <View style={styles.chipRow}>
        {(['5x1', '4x2', '6x0'] as VolleyRotationSystem[]).map((r) => (
          <Pressable
            key={r}
            onPress={() => setRotationSystem(r)}
            style={[styles.chip, rotationSystem === r && styles.chipSelected]}
          >
            <Text style={[styles.chipTxt, rotationSystem === r && styles.chipTxtSelected]}>
              {r}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>👥 Jogadores ({players.length})</Text>
      <Card>
        <Input label="Nome" value={pName} onChangeText={setPName} placeholder="Nome do jogador" />
        <Input
          label="Número"
          value={pNumber}
          onChangeText={setPNumber}
          keyboardType="numeric"
          placeholder="1-99"
        />
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6, marginTop: 4 }}>
          Posição
        </Text>
        <View style={styles.posGrid}>
          {POSITIONS.map((p) => (
            <Pressable
              key={p}
              onPress={() => setPPosition(p)}
              style={[styles.posBtn, pPosition === p && styles.posBtnSelected]}
            >
              <Text style={[styles.posBtnTxt, pPosition === p && styles.posBtnTxtSelected]}>
                {p}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={{ height: spacing.sm }} />
        <Button title="Adicionar jogador" variant="outline" onPress={addPlayer} />
      </Card>

      {players.length > 0 ? (
        <Card style={{ marginTop: spacing.sm }}>
          {players
            .slice()
            .sort((a, b) => a.number - b.number)
            .map((p) => (
              <View key={p.number} style={styles.playerRow}>
                <View style={styles.playerNum}>
                  <Text style={styles.playerNumTxt}>{p.number}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.playerName}>{p.name}</Text>
                  <Text style={styles.playerPos}>{p.position}</Text>
                </View>
                <Pressable onPress={() => removePlayer(p.number)}>
                  <Text style={styles.removeTxt}>Remover</Text>
                </Pressable>
              </View>
            ))}
        </Card>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={{ marginTop: spacing.lg, marginBottom: spacing.xxl, gap: spacing.sm }}>
        <Button title="🏐  Iniciar partida" onPress={onCreate} loading={creating} />
        <Button
          title="Cancelar"
          variant="ghost"
          onPress={() => nav.goBack()}
          disabled={creating}
        />
      </View>
    </Screen>
  );
};
