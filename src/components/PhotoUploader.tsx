import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ActivityIndicator } from 'react-native';
import { colors, spacing, radius } from '../constants/theme';
import { useThemedColors } from '../store';
import { Avatar } from './Avatar';

interface Props {
  /** URL atual da foto (se houver) */
  currentUrl?: string;
  /** Nome para fallback do Avatar quando não há foto */
  name: string;
  /** Tamanho do preview (default 96) */
  size?: number;
  /** Chamado com o File selecionado pelo usuário */
  onPick: (file: File) => Promise<void>;
  /** Botão de remover foto (opcional) */
  onRemove?: () => Promise<void>;
  label?: string;
}

/**
 * Componente de upload de foto. No web, usa <input type="file"> para seleção.
 * No native, mostra apenas um aviso (futuro: integrar expo-image-picker).
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
  const inputRef = useRef<HTMLInputElement | null>(null);

  const styles = StyleSheet.create({
    wrap: {
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
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
    btnTxt: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: '700',
    },
    danger: {
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
    },
    dangerTxt: {
      fontSize: 12,
      color: colors.danger,
      fontWeight: '700',
    },
    error: {
      fontSize: 12,
      color: colors.danger,
      textAlign: 'center',
    },
    btnRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      alignItems: 'center',
    },
  });

  const triggerPicker = () => {
    if (Platform.OS === 'web' && inputRef.current) {
      inputRef.current.click();
    } else {
      setError('Upload de foto disponível apenas no web por enquanto.');
    }
  };

  const handleWebChange = async (e: { target: { files: FileList | null } }) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      await onPick(file);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar foto');
    } finally {
      setBusy(false);
      // Reset pra permitir selecionar o mesmo arquivo de novo
      if (inputRef.current) inputRef.current.value = '';
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

      {Platform.OS === 'web'
        ? React.createElement('input', {
            ref: inputRef,
            type: 'file',
            accept: 'image/*',
            onChange: handleWebChange,
            style: { display: 'none' },
          })
        : null}

      <View style={styles.btnRow}>
        <Pressable style={styles.btn} onPress={triggerPicker} disabled={busy}>
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
