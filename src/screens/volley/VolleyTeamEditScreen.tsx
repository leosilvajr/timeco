import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Input, Button, Card } from '../../components';
import { ColorPalette, spacing, radius } from '../../constants/theme';
import { useAuthStore, useThemedColors } from '../../store';
import {
  createVolleyTeam,
  updateVolleyTeam,
  getVolleyTeam,
} from '../../services/volleyTeamService';
import { invalidateVolleyTeamsCache } from '../../services/volleyCacheService';
import { isValidJerseyNumber } from '../../utils/validators';
import { formatError } from '../../utils/errorMessages';
import { VolleyPlayer, VolleyPosition } from '../../types';
import { toast } from '../../store/toastStore';
import type { VolleyStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<VolleyStackParamList, 'VolleyTeamEdit'>;
type Rt = RouteProp<VolleyStackParamList, 'VolleyTeamEdit'>;

const POSITIONS: VolleyPosition[] = ['Oposto', 'Ponteiro', 'Central', 'Levantador', 'Líbero'];

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
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    posBtnSelected: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    posBtnTxt: { fontSize: 13, fontWeight: '700', color: c.text },
    posBtnTxtSelected: { color: c.onPrimary },
    playerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    playerNum: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    playerNumTxt: { color: c.onPrimary, fontWeight: '900' },
    playerName: { fontSize: 14, fontWeight: '700', color: c.text },
    playerPos: { fontSize: 12, color: c.textSecondary },
    removeTxt: { color: c.danger, fontWeight: '700' },
    error: { color: c.danger, marginVertical: spacing.sm, textAlign: 'center' },
  });

/** Cria ou edita um time de volei + sua lista de jogadores. */
export const VolleyTeamEditScreen: React.FC = () => {
  const c = useThemedColors();
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const user = useAuthStore((s) => s.user);
  const teamId = route.params?.teamId;
  const isEdit = !!teamId;
  const styles = makeStyles(c);

  const [name, setName] = useState('');
  const [players, setPlayers] = useState<VolleyPlayer[]>([]);
  const [pName, setPName] = useState('');
  const [pNumber, setPNumber] = useState('');
  const [pPosition, setPPosition] = useState<VolleyPosition>('Ponteiro');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Carrega dados do time existente em modo edit
  useEffect(() => {
    if (!teamId) return;
    setLoading(true);
    getVolleyTeam(teamId)
      .then((team) => {
        if (team) {
          setName(team.name);
          setPlayers(team.players);
        }
      })
      .catch((e) => {
        console.warn('getVolleyTeam', e);
      })
      .finally(() => setLoading(false));
  }, [teamId]);

  const addPlayer = () => {
    setError(null);
    const pn = pName.trim();
    const num = parseInt(pNumber, 10);
    if (!pn) return setError('Digite o nome do jogador.');
    if (!isValidJerseyNumber(num))
      return setError('O número precisa ser inteiro entre 1 e 99.');
    if (players.some((p) => p.number === num))
      return setError(`Já existe um jogador com o número ${num}.`);
    setPlayers((prev) => [...prev, { name: pn, number: num, position: pPosition }]);
    setPName('');
    setPNumber('');
  };

  const removePlayer = (n: number) => setPlayers((prev) => prev.filter((p) => p.number !== n));

  const onSave = async () => {
    setError(null);
    if (!user) return;
    if (!name.trim()) return setError('Informe o nome do time.');
    if (players.length === 0) return setError('Cadastre pelo menos 1 jogador.');

    setSaving(true);
    try {
      const sortedPlayers = [...players].sort((a, b) => a.number - b.number);
      if (isEdit && teamId) {
        await updateVolleyTeam(teamId, { name: name.trim(), players: sortedPlayers });
        toast.success('Time atualizado!');
      } else {
        await createVolleyTeam({
          ownerId: user.id,
          name: name.trim(),
          players: sortedPlayers,
        });
        toast.success('Time criado!');
      }
      invalidateVolleyTeamsCache(user.id);
      nav.goBack();
    } catch (e: unknown) {
      setError(formatError(e, 'Não conseguimos salvar o time agora. Tente de novo.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <Header title="Carregando..." onBack={() => nav.goBack()} />
      </Screen>
    );
  }

  return (
    <Screen maxWidth={760}>
      <Header
        title={isEdit ? 'Editar time' : 'Novo time'}
        subtitle="Cadastre os jogadores fixos da sua equipe"
        onBack={() => nav.goBack()}
      />

      <Input
        label="Nome do time"
        value={name}
        onChangeText={setName}
        placeholder="Ex: Vôlei do Lucas"
      />

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
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: c.text,
            marginBottom: 6,
            marginTop: 4,
          }}
        >
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
                <Pressable onPress={() => removePlayer(p.number)} hitSlop={8}>
                  <Text style={styles.removeTxt}>Remover</Text>
                </Pressable>
              </View>
            ))}
        </Card>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={{ marginTop: spacing.lg, marginBottom: spacing.xxl, gap: spacing.sm }}>
        <Button
          title={isEdit ? 'Salvar alterações' : 'Criar time'}
          onPress={onSave}
          loading={saving}
        />
        <Button
          title="Cancelar"
          variant="ghost"
          onPress={() => nav.goBack()}
          disabled={saving}
        />
      </View>
    </Screen>
  );
};
