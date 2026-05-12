import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Screen,
  Header,
  Input,
  Button,
  Card,
  DatePickerField,
  EmptyState,
} from '../../components';
import { ColorPalette, spacing, radius } from '../../constants/theme';
import { useAuthStore, useThemedColors } from '../../store';
import { createVolleyMatch } from '../../services/volleyScoutService';
import { listUserVolleyTeams } from '../../services/volleyTeamService';
import { formatError } from '../../utils/errorMessages';
import { VolleyFormat, VolleyRotationSystem, VolleyTeam } from '../../types';
import { toast } from '../../store/toastStore';
import type { VolleyStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<VolleyStackParamList, 'VolleyMatchSetup'>;

const todayISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    sectionTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: c.text,
      marginBottom: spacing.sm,
      marginTop: spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: radius.pill,
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderColor: c.border,
    },
    chipSelected: { backgroundColor: c.primary, borderColor: c.primary },
    chipTxt: { fontSize: 13, fontWeight: '600', color: c.text },
    chipTxtSelected: { color: c.onPrimary },
    teamCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 2,
      borderColor: c.border,
      backgroundColor: c.surface,
      marginBottom: spacing.sm,
    },
    teamCardSelected: {
      borderColor: c.primary,
      backgroundColor: c.surfaceVariant,
    },
    teamCardName: { fontSize: 15, fontWeight: '800', color: c.text },
    teamCardMeta: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioActive: { borderColor: c.primary },
    radioDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: c.primary,
    },
    error: { color: c.danger, marginVertical: spacing.sm, textAlign: 'center' },
  });

/**
 * Cria uma partida de Volei Avancado.
 *
 * Novo fluxo (vs versao antiga):
 * 1. Seleciona um TIME cadastrado (em vez de adicionar jogadores manualmente)
 * 2. Adversario + local (texto livre)
 * 3. Data via DatePickerField (calendario visual)
 * 4. Formato + sistema de rodizio (radios)
 */
export const VolleyMatchSetupScreen: React.FC = () => {
  const c = useThemedColors();
  const nav = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const styles = useMemo(() => makeStyles(c), [c]);

  const [date, setDate] = useState<string>(todayISO());
  const [location, setLocation] = useState('');
  const [teamBName, setTeamBName] = useState('');
  const [format, setFormat] = useState<VolleyFormat>(3);
  const [rotationSystem, setRotationSystem] = useState<VolleyRotationSystem>('5x1');

  const [myTeams, setMyTeams] = useState<VolleyTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [loadingTeams, setLoadingTeams] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const loadTeams = useCallback(async () => {
    if (!user) return;
    setLoadingTeams(true);
    try {
      const list = await listUserVolleyTeams(user.id);
      setMyTeams(list);
      // Auto-seleciona o primeiro time se nao houver selecao previa
      if (list.length > 0 && !selectedTeamId) {
        setSelectedTeamId(list[0].id);
      }
    } catch (e) {
      console.warn('listUserVolleyTeams', e);
    } finally {
      setLoadingTeams(false);
    }
  }, [user, selectedTeamId]);

  useFocusEffect(
    useCallback(() => {
      loadTeams();
    }, [loadTeams]),
  );

  // Se o time selecionado nao existe mais (foi excluido), zera selecao
  useEffect(() => {
    if (selectedTeamId && !myTeams.find((t) => t.id === selectedTeamId)) {
      setSelectedTeamId(null);
    }
  }, [myTeams, selectedTeamId]);

  const onCreate = async () => {
    setError(null);
    if (!user) return;
    if (!selectedTeamId) return setError('Selecione um time pra começar.');
    const team = myTeams.find((t) => t.id === selectedTeamId);
    if (!team) return setError('Time não encontrado. Tente recarregar.');
    if (!teamBName.trim()) return setError('Informe o nome do adversário.');
    if (!location.trim()) return setError('Informe o local da partida.');
    if (team.players.length === 0)
      return setError('O time selecionado não tem jogadores cadastrados.');

    setCreating(true);
    try {
      const id = await createVolleyMatch({
        ownerId: user.id,
        date,
        location: location.trim(),
        teamAName: team.name,
        teamBName: teamBName.trim(),
        format,
        rotationSystem,
        players: [...team.players].sort((a, b) => a.number - b.number),
      });
      toast.success('Partida criada!');
      nav.replace('VolleyScout', { matchId: id });
    } catch (e: unknown) {
      setError(formatError(e, 'Não conseguimos criar a partida agora. Tente de novo.'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <Screen maxWidth={840}>
      <Header title="Nova partida" onBack={() => nav.goBack()} />

      {/* Time do user (saved teams) */}
      <Text style={styles.sectionTitle}>🏐 Seu time</Text>
      {loadingTeams ? null : myTeams.length === 0 ? (
        <Card>
          <EmptyState
            emoji="👥"
            title="Você não tem times cadastrados"
            description="Cadastre seu time uma vez e reaproveite em todas as partidas."
            action={
              <Button
                title="+ Criar meu primeiro time"
                onPress={() => nav.navigate('VolleyTeamEdit')}
              />
            }
          />
        </Card>
      ) : (
        <>
          {myTeams.map((team) => {
            const isSelected = selectedTeamId === team.id;
            return (
              <Pressable
                key={team.id}
                style={[styles.teamCard, isSelected && styles.teamCardSelected]}
                onPress={() => setSelectedTeamId(team.id)}
              >
                <View style={[styles.radio, isSelected && styles.radioActive]}>
                  {isSelected ? <View style={styles.radioDot} /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.teamCardName}>{team.name}</Text>
                  <Text style={styles.teamCardMeta}>
                    {team.players.length} jogador{team.players.length === 1 ? '' : 'es'}
                  </Text>
                </View>
              </Pressable>
            );
          })}
          <View style={{ marginTop: spacing.xs, marginBottom: spacing.md }}>
            <Button
              title="+ Adicionar novo time"
              variant="ghost"
              onPress={() => nav.navigate('VolleyTeamEdit')}
            />
          </View>
        </>
      )}

      {/* Adversario */}
      <Text style={styles.sectionTitle}>🆚 Adversário</Text>
      <Input
        label="Nome da equipe adversária"
        value={teamBName}
        onChangeText={setTeamBName}
        placeholder="Ex: Time do João"
      />

      {/* Local */}
      <Text style={styles.sectionTitle}>📍 Local</Text>
      <Input label="Local da partida" value={location} onChangeText={setLocation} placeholder="Ginásio ou quadra" />

      {/* Data */}
      <Text style={styles.sectionTitle}>📅 Data</Text>
      <DatePickerField label="Quando vai ser?" value={date} onChange={setDate} />

      {/* Formato */}
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

      {/* Rotacao */}
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
