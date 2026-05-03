import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { colors, spacing, radius } from '../constants/theme';
import { useThemedColors } from '../store';
import { Avatar } from './Avatar';
import { pickImage } from '../utils/imagePicker';

interface Props {
  /** URL atual da foto (se houver) */
  currentUrl?: string;
  /** Nome para fallback do Avatar quando não há foto */
  name: string;
  /** Tamanho do preview (default 96) */
  size?: number;
  /** Chamado com o Blob/File selecionado pelo usuário */
  onPick: (file: Blob) => Promise<void>;
  /** Botão de remover foto (opcional) */
  onRemove?: () => Promise<void>;
  label?: string;
}

/**
 * Componente de upload de foto cross-platform.
 * - Web: <input type="file"> invisível via pickImage()
 * - Native: expo-image-picker (galeria do sistema)
 */
export const PhotoUploader: React.FC<Props> = ({
  currentUrl,
  name,
  size = 96,
  onPick,
  onRemove,
  label,
}) => {
  useThemedColors();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const styles = StyleSheet.create({
    wrap: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      alignSelf: 'flex-start',
      marginBottom: 4,
    },
    btn: {
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceVariant,
      borderWidth: 1,
      borderColor: colors.border,
    },
    btnTxt: { fontSize: 13, color: colors.primary, fontWeight: '700' },
    danger: { paddingHorizontal: spacing.md, paddingVertical: 6 },
    dangerTxt: { fontSize: 12, color: colors.danger, fontWeight: '700' },
    error: { fontSize: 12, color: colors.danger, textAlign: 'center' },
    btnRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  });

  const handlePick = async () => {
    setError(null);
    try {
      const file = await pickImage();
      if (!file) return;
      setBusy(true);
      await onPick(file);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar foto');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (!onRemove) return;
    setError(null);
    setBusy(true);
    try {
      await onRemove();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao remover');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <Avatar name={name} photoURL={currentUrl} size={size} />

      <View style={styles.btnRow}>
        <Pressable style={styles.btn} onPress={handlePick} disabled={busy}>
          <Text style={styles.btnTxt}>
            {busy ? 'Enviando...' : currentUrl ? 'Trocar foto' : 'Adicionar foto'}
          </Text>
        </Pressable>
        {currentUrl && onRemove ? (
          <Pressable style={styles.danger} onPress={handleRemove} disabled={busy}>
            <Text style={styles.dangerTxt}>Remover</Text>
          </Pressable>
        ) : null}
        {busy ? <ActivityIndicator color={colors.primary} /> : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};
