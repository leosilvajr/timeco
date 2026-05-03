import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator } from 'react-native';
import { colors, spacing, radius } from '../constants/theme';
import { useThemedColors } from '../store';
import { PhotoLightbox } from './PhotoLightbox';
import { pickImage } from '../utils/imagePicker';
import { ProfilePhoto } from '../types';
import { PROFILE_PHOTOS_LIMIT } from '../services/profileGalleryService';
import { formatError } from '../utils/errorMessages';

interface Props {
  photos: ProfilePhoto[];
  /**
   * Quando true, mostra botões de adicionar/remover. Usado na ProfileHome
   * (perfil próprio). Em PlayerProfileScreen passa false (read-only).
   */
  editable: boolean;
  /** Chamado quando o usuário escolhe um arquivo. Faz upload + retorna a foto criada. */
  onAdd?: (file: Blob) => Promise<void>;
  /** Chamado pra remover uma foto específica. */
  onRemove?: (photo: ProfilePhoto) => Promise<void>;
}

export const ProfileGallery: React.FC<Props> = ({ photos, editable, onAdd, onRemove }) => {
  useThemedColors();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<ProfilePhoto | null>(null);

  const limitReached = photos.length >= PROFILE_PHOTOS_LIMIT;

  const handlePick = async () => {
    if (!onAdd || busy || limitReached) return;
    setError(null);
    try {
      const file = await pickImage();
      if (!file) return;
      setBusy(true);
      await onAdd(file);
    } catch (e: unknown) {
      setError(formatError(e, 'Não conseguimos enviar a foto. Tente de novo em instantes.'));
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (photo: ProfilePhoto) => {
    if (!onRemove) return;
    const ok =
      typeof window !== 'undefined' ? window.confirm('Apagar esta foto do seu perfil?') : true;
    if (!ok) return;
    setError(null);
    setBusy(true);
    try {
      await onRemove(photo);
    } catch (e: unknown) {
      setError(formatError(e, 'Não conseguimos remover a foto agora. Tente de novo.'));
    } finally {
      setBusy(false);
    }
  };

  const styles = StyleSheet.create({
    title: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    thumb: {
      width: 90,
      height: 90,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceVariant,
    },
    thumbWrap: { position: 'relative' },
    removeBtn: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: 'rgba(0,0,0,0.6)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeTxt: { color: colors.white, fontWeight: '900', fontSize: 13, lineHeight: 14 },
    addBtn: {
      width: 90,
      height: 90,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceVariant,
      borderWidth: 2,
      borderColor: colors.primary,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    addEmoji: { fontSize: 26 },
    addTxt: { fontSize: 11, fontWeight: '700', color: colors.primary },
    empty: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingVertical: spacing.md,
      lineHeight: 19,
    },
    emptyHint: { fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 4 },
    error: { fontSize: 12, color: colors.danger, textAlign: 'center', marginTop: 6 },
    counter: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  });

  return (
    <View>
      <View style={styles.row}>
        <Text style={styles.title}>📸 Minhas fotos</Text>
        {editable ? (
          <Text style={styles.counter}>
            {photos.length}/{PROFILE_PHOTOS_LIMIT}
          </Text>
        ) : (
          <Text style={styles.counter}>{photos.length}</Text>
        )}
      </View>

      {photos.length === 0 && !editable ? (
        <Text style={styles.empty}>Sem fotos no perfil ainda.</Text>
      ) : (
        <View style={styles.grid}>
          {photos.map((p) => (
            <View key={p.id} style={styles.thumbWrap}>
              <Pressable onPress={() => setLightbox(p)}>
                <Image source={{ uri: p.url }} style={styles.thumb} />
              </Pressable>
              {editable && onRemove ? (
                <Pressable
                  style={styles.removeBtn}
                  onPress={() => handleRemove(p)}
                  hitSlop={6}
                  disabled={busy}
                >
                  <Text style={styles.removeTxt}>×</Text>
                </Pressable>
              ) : null}
            </View>
          ))}

          {editable && !limitReached ? (
            <Pressable style={styles.addBtn} onPress={handlePick} disabled={busy}>
              {busy ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <>
                  <Text style={styles.addEmoji}>+</Text>
                  <Text style={styles.addTxt}>Adicionar</Text>
                </>
              )}
            </Pressable>
          ) : null}
        </View>
      )}

      {editable && photos.length === 0 ? (
        <Text style={styles.emptyHint}>
          Adicione até {PROFILE_PHOTOS_LIMIT} fotos pro seu perfil ficar mais completo.
        </Text>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {lightbox ? (
        <PhotoLightbox
          visible={!!lightbox}
          url={lightbox.url}
          caption={lightbox.caption || undefined}
          onClose={() => setLightbox(null)}
        />
      ) : null}
    </View>
  );
};
