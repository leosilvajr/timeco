import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Card, Avatar, Button } from '../../components';
import { colors, spacing, radius } from '../../constants/theme';
import { getUserById } from '../../services/userService';
import { removeFriend, areFriends } from '../../services/friendsService';
import { useAuthStore, useThemedColors } from '../../store';
import { User } from '../../types';
import { getSport } from '../../constants/sports';
import type { SocialStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<SocialStackParamList, 'PlayerProfile'>;
type Rt = RouteProp<SocialStackParamList, 'PlayerProfile'>;

const calcAge = (birthDate?: string): number | null => {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
};

export const PlayerProfileScreen: React.FC = () => {
  useThemedColors();
  const route = useRoute<Rt>();
  const nav = useNavigation<Nav>();
  const current = useAuthStore((s) => s.user);
  const [target, setTarget] = useState<User | null>(null);
  const [isFriend, setIsFriend] = useState(false);

  useEffect(() => {
    getUserById(route.params.userId).then(setTarget);
    if (current) areFriends(current.id, route.params.userId).then(setIsFriend);
  }, [route.params.userId, current]);

  const onRemove = async () => {
    if (!current || !target) return;
    const ok = typeof window !== 'undefined' ? window.confirm(`Remover ${target.name}?`) : true;
    if (!ok) return;
    await removeFriend(current.id, target.id);
    nav.goBack();
  };

  const styles = StyleSheet.create({
    hero: {
      alignItems: 'center',
      gap: 6,
    },
    name: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
      marginTop: 6,
    },
    email: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    bio: {
      fontSize: 14,
      color: colors.text,
      textAlign: 'center',
      marginTop: 8,
      lineHeight: 20,
      fontStyle: 'italic',
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
    },
    info: {
      fontSize: 15,
      color: colors.text,
      paddingVertical: 6,
    },
    sportsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    sportChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceVariant,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sportChipTxt: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },
    actions: {
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    empty: {
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  if (!target) {
    return (
      <Screen>
        <Header title="Carregando..." onBack={() => nav.goBack()} />
      </Screen>
    );
  }

  const age = calcAge(target.birthDate);
  const hasInfo = !!(target.heightCm || age !== null || target.phone);
  const hasFavSports = (target.favoriteSports?.length ?? 0) > 0;

  return (
    <Screen>
      <Header title="Perfil" onBack={() => nav.goBack()} />

      <Card style={styles.hero}>
        <Avatar name={target.name} photoURL={target.photoURL} size={88} />
        <Text style={styles.name}>{target.name}</Text>
        <Text style={styles.email}>{target.email}</Text>
        {target.bio ? <Text style={styles.bio}>"{target.bio}"</Text> : null}
      </Card>

      <Card style={{ marginTop: spacing.md }}>
        <Text style={styles.sectionTitle}>Dados</Text>
        {age !== null ? <Text style={styles.info}>🎂 {age} anos</Text> : null}
        {target.heightCm ? <Text style={styles.info}>📏 {target.heightCm} cm</Text> : null}
        {target.phone ? <Text style={styles.info}>📱 {target.phone}</Text> : null}
        {!hasInfo ? <Text style={styles.empty}>Sem informações adicionais</Text> : null}
      </Card>

      {hasFavSports ? (
        <Card style={{ marginTop: spacing.md }}>
          <Text style={styles.sectionTitle}>Esportes favoritos</Text>
          <View style={styles.sportsRow}>
            {target.favoriteSports!.map((sid) => {
              const cfg = getSport(sid);
              return (
                <View key={sid} style={styles.sportChip}>
                  <Text style={{ fontSize: 14 }}>{cfg.emoji}</Text>
                  <Text style={styles.sportChipTxt}>{cfg.label}</Text>
                </View>
              );
            })}
          </View>
        </Card>
      ) : null}

      <View style={styles.actions}>
        {isFriend && current ? (
          <Button
            title="💬  Conversar"
            onPress={() =>
              nav.navigate('Chat', { friendId: target.id, friendName: target.name })
            }
          />
        ) : null}
        {isFriend ? (
          <Button title="Remover amizade" variant="outline" onPress={onRemove} />
        ) : null}
      </View>
    </Screen>
  );
};
