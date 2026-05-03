import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Input,
  Button,
  Card,
  DateInput,
  TimeInput,
  LocationPicker,
  SelectedLocation,
  ToggleSwitch,
  SportPicker,
  SectionTitle,
  FriendPicker,
} from '../components';
import { colors, spacing } from '../constants/theme';
import { useThemedColors } from '../store';
import { getSport } from '../constants/sports';
import { SportId, User } from '../types';

const pad = (n: number): string => String(n).padStart(2, '0');

const tomorrow19h = (): { date: string; time: string } => {
  const now = new Date();
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 19, 0, 0);
  return {
    date: `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`,
    time: `${pad(t.getHours())}:${pad(t.getMinutes())}`,
  };
};

export interface EventFormValues {
  title: string;
  sport: SportId;
  location: SelectedLocation;
  dateStr: string;
  timeStr: string;
  playersPerTeam: number;
  teamsCount: number;
  balanceByAge: boolean;
  balanceByHeight: boolean;
  balanceByWeight: boolean;
  invitedUserIds: string[];
  notes?: string;
}

export interface EventFormInitial {
  title?: string;
  sport?: SportId;
  location?: SelectedLocation | null;
  dateStr?: string;
  timeStr?: string;
  playersPerTeam?: number;
  teamsCount?: number;
  balanceByAge?: boolean;
  balanceByHeight?: boolean;
  balanceByWeight?: boolean;
  invitedUserIds?: string[];
  notes?: string;
}

interface Props {
  /** Texto do botão de submit (ex: "Criar evento" ou "Salvar alterações"). */
  submitLabel: string;
  /** Quando true, atualiza defaults de jog./time, balance flags ao mudar o esporte. */
  syncSportDefaults?: boolean;
  initial?: EventFormInitial;
  friends: User[];
  submitting?: boolean;
  error?: string | null;
  onSubmit: (values: EventFormValues) => void | Promise<void>;
  /** Quando passado, renderiza um botão "Cancelar" abaixo do submit. */
  onCancel?: () => void;
  /** Conteúdo opcional renderizado entre os campos e o botão de submit. */
  extraFooter?: React.ReactNode;
}

/**
 * Formulário compartilhado entre CreateEvent e EditEvent. Encapsula
 * todo o state e validação. Caller só fornece initial + onSubmit.
 */
export const EventForm: React.FC<Props> = ({
  submitLabel,
  syncSportDefaults = false,
  initial = {},
  friends,
  submitting = false,
  error,
  onSubmit,
  onCancel,
  extraFooter,
}) => {
  useThemedColors();
  const defaultDateTime = tomorrow19h();

  const [title, setTitle] = useState(initial.title ?? '');
  const [sport, setSport] = useState<SportId>(initial.sport ?? 'soccer');
  const [location, setLocation] = useState<SelectedLocation | null>(initial.location ?? null);
  const [dateStr, setDateStr] = useState(initial.dateStr ?? defaultDateTime.date);
  const [timeStr, setTimeStr] = useState(initial.timeStr ?? defaultDateTime.time);
  const [playersPerTeam, setPlayersPerTeam] = useState(
    initial.playersPerTeam != null ? String(initial.playersPerTeam) : '5',
  );
  const [teamsCount, setTeamsCount] = useState(
    initial.teamsCount != null ? String(initial.teamsCount) : '2',
  );
  const [balanceByAge, setBalanceByAge] = useState(initial.balanceByAge ?? false);
  const [balanceByHeight, setBalanceByHeight] = useState(initial.balanceByHeight ?? false);
  const [balanceByWeight, setBalanceByWeight] = useState(initial.balanceByWeight ?? false);
  const [notes, setNotes] = useState(initial.notes ?? '');
  const [selected, setSelected] = useState<Set<string>>(new Set(initial.invitedUserIds ?? []));
  const [validationError, setValidationError] = useState<string | null>(null);

  // Quando muda o esporte (no modo "create"), aplica defaults da modalidade.
  useEffect(() => {
    if (!syncSportDefaults) return;
    const cfg = getSport(sport);
    setPlayersPerTeam(String(cfg.defaultPlayersPerTeam));
    setTeamsCount(String(cfg.defaultTeamsCount));
    setBalanceByAge(cfg.usesAgeBalance);
    setBalanceByHeight(cfg.usesHeightBalance);
    setBalanceByWeight(cfg.usesWeightBalance ?? false);
  }, [sport, syncSportDefaults]);

  const toggleFriend = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleSubmit = async () => {
    setValidationError(null);
    if (!title.trim()) return setValidationError('Informe um título');
    if (!location || !location.name.trim()) return setValidationError('Informe o local');
    if (!dateStr || !timeStr) return setValidationError('Informe data e horário');
    const scheduledAt = new Date(`${dateStr}T${timeStr}:00`);
    if (Number.isNaN(scheduledAt.getTime())) return setValidationError('Data/horário inválidos');

    await onSubmit({
      title: title.trim(),
      sport,
      location,
      dateStr,
      timeStr,
      playersPerTeam: parseInt(playersPerTeam, 10) || 5,
      teamsCount: parseInt(teamsCount, 10) || 2,
      balanceByAge,
      balanceByHeight,
      balanceByWeight,
      invitedUserIds: Array.from(selected),
      notes: notes.trim() || undefined,
    });
  };

  const styles = StyleSheet.create({
    label: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
    row: { flexDirection: 'row', gap: spacing.md },
    error: { color: colors.danger, marginBottom: spacing.md, textAlign: 'center' },
  });

  return (
    <>
      <Text style={styles.label}>Esporte</Text>
      <SportPicker value={sport} onChange={setSport} />

      <Input label="Título do evento" value={title} onChangeText={setTitle} placeholder="Pelada de quarta" />
      <LocationPicker
        label="Local"
        value={location}
        onChange={setLocation}
        placeholder="Quadra do bairro, arena, estabelecimento..."
      />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <DateInput label="Data" value={dateStr} onChangeText={setDateStr} mode="event" />
        </View>
        <View style={{ flex: 1 }}>
          <TimeInput label="Horário" value={timeStr} onChangeText={setTimeStr} />
        </View>
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Input label="Jog./time" value={playersPerTeam} onChangeText={setPlayersPerTeam} keyboardType="numeric" />
        </View>
        <View style={{ flex: 1 }}>
          <Input label="Qtd. times" value={teamsCount} onChangeText={setTeamsCount} keyboardType="numeric" />
        </View>
      </View>

      <Card style={{ marginBottom: spacing.md }}>
        <Text style={styles.label}>Equilibrar também por:</Text>
        <ToggleSwitch value={balanceByAge} onChange={setBalanceByAge} title="👶 Idade" />
        <ToggleSwitch value={balanceByHeight} onChange={setBalanceByHeight} title="📏 Altura" />
        <ToggleSwitch
          value={balanceByWeight}
          onChange={setBalanceByWeight}
          title="⚖️ Peso (privado)"
        />
      </Card>

      <SectionTitle small>Convidados ({selected.size} selecionados)</SectionTitle>
      <FriendPicker friends={friends} selected={selected} onToggle={toggleFriend} />

      <Input label="Observações (opcional)" value={notes} onChangeText={setNotes} multiline numberOfLines={3} />

      {error || validationError ? (
        <Text style={styles.error}>{error || validationError}</Text>
      ) : null}

      {extraFooter}

      <Button title={submitLabel} onPress={handleSubmit} loading={submitting} />
      {onCancel ? (
        <View style={{ marginTop: spacing.sm }}>
          <Button title="Cancelar" variant="ghost" onPress={onCancel} disabled={submitting} />
        </View>
      ) : null}
      <View style={{ height: spacing.xxl }} />
    </>
  );
};
