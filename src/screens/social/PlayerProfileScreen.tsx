import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Card, Avatar, Button } from '../../components';
import { colors, spacing } from '../../constants/theme';
import { getUserById } from '../../services/userService';
import { removeFriend, areFriends } from '../../services/friendsService';
import { useAuthStore } from '../../store';
import { User } from '../../types';
import type { SocialStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<SocialStackParamList, 'PlayerProfile'>;
type Rt = RouteProp<SocialStackParamList, 'PlayerProfile'>;

export const PlayerProfileScreen: React.FC = () => {
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

  if (!target) {
    return (
      <Screen>
        <Header title="Carregando..." onBack={() => nav.goBack()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Perfil" onBack={() => nav.goBack()} />
      <Card style={styles.hero}>
        <Avatar name={target.name} photoURL={target.photoURL} size={88} />
        <Text style={styles.name}>{target.name}</Text>
        <Text style={styles.email}>{target.email}</Text>
      </Card>

      <Card style={{ marginTop: spacing.md }}>
        {target.birthDate ? <Text style={styles.info}>🎂 {target.birthDate}</Text> : null}
        {target.heightCm ? <Text style={styles.info}>📏 {target.heightCm} cm</Text> : null}
        {target.phone ? <Text style={styles.info}>📱 {target.phone}</Text> : null}
        {!target.birthDate && !target.heightCm && !target.phone ? (
          <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
            Sem informações adicionais
          </Text>
        ) : null}
      </Card>

      {isFriend ? (
        <View style={{ marginTop: spacing.lg }}>
          <Button title="Remover amizade" variant="outline" onPress={onRemove} />
        </View>
      ) : null}
    </Screen>
  );
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
  info: {
    fontSize: 15,
    color: colors.text,
    paddingVertical: 6,
  },
});
