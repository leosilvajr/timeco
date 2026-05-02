import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../constants/theme';
import { useThemedColors } from '../store';
import { Avatar } from './Avatar';
import { Input } from './Input';
import { Card } from './Card';
import { User } from '../types';
import { usePagination } from '../hooks/usePagination';

interface Props {
  friends: User[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  /** Quando vazio, mostra mensagem em Card. */
  emptyMessage?: string;
}

const PAGE_SIZE = 30;

/**
 * Seletor de amigos com busca textual e paginação client-side.
 * Reutilizado em CreateEvent e EditEvent.
 */
export const FriendPicker: React.FC<Props> = ({
  friends,
  selected,
  onToggle,
  emptyMessage = 'Você ainda não tem amigos. Adicione amigos na aba Social.',
}) => {
  useThemedColors();

  const { visible, filtered, hasMore, loadMore, query, setQuery } = usePagination(
    friends,
    (f) => [f.name, f.email],
    PAGE_SIZE,
  );

  const styles = StyleSheet.create({
    friend: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.sm,
    },
    friendSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.surfaceVariant,
    },
    name: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    email: { fontSize: 12, color: colors.textSecondary },
    toggle: {
      width: 28,
      height: 28,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    toggleOn: { backgroundColor: colors.primary, borderColor: colors.primary },
    toggleCheck: { color: colors.white, fontWeight: '900' },
    loadMoreBtn: {
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginVertical: spacing.sm,
      backgroundColor: colors.surfaceVariant,
      borderRadius: radius.md,
    },
    loadMoreTxt: { fontSize: 13, fontWeight: '700', color: colors.primary },
    totalTxt: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'center',
      marginVertical: spacing.sm,
    },
    notFound: {
      color: colors.textSecondary,
      textAlign: 'center',
      marginVertical: spacing.md,
    },
  });

  if (friends.length === 0) {
    return (
      <Card style={{ marginBottom: spacing.md }}>
        <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>{emptyMessage}</Text>
      </Card>
    );
  }

  return (
    <>
      <Input value={query} onChangeText={setQuery} placeholder="Buscar amigo por nome ou email" />
      {filtered.length === 0 ? (
        <Text style={styles.notFound}>Nenhum amigo encontrado.</Text>
      ) : (
        <>
          {visible.map((f) => {
            const isSel = selected.has(f.id);
            return (
              <Pressable
                key={f.id}
                onPress={() => onToggle(f.id)}
                style={[styles.friend, isSel && styles.friendSelected]}
              >
                <Avatar name={f.name} photoURL={f.photoURL} size={40} />
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.name}>{f.name}</Text>
                  <Text style={styles.email}>{f.email}</Text>
                </View>
                <View style={[styles.toggle, isSel && styles.toggleOn]}>
                  {isSel ? <Text style={styles.toggleCheck}>✓</Text> : null}
                </View>
              </Pressable>
            );
          })}
          {hasMore ? (
            <Pressable onPress={loadMore} style={styles.loadMoreBtn}>
              <Text style={styles.loadMoreTxt}>
                Carregar mais ({filtered.length - visible.length} restantes)
              </Text>
            </Pressable>
          ) : (
            <Text style={styles.totalTxt}>
              {filtered.length} {filtered.length === 1 ? 'amigo' : 'amigos'}
            </Text>
          )}
        </>
      )}
    </>
  );
};
