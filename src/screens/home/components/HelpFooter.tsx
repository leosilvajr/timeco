import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { Card } from '../../../components';
import { colors, spacing, radius } from '../../../constants/theme';
import { useThemedColors } from '../../../store';

interface Props {
  onAddFriend: () => void;
}

/**
 * Seção "Ajuda e suporte" da Home com botão WhatsApp da Incrivia
 * + atalho pra convidar amigos.
 */
export const HelpFooter: React.FC<Props> = ({ onAddFriend }) => {
  useThemedColors();

  const openWhatsApp = () =>
    Linking.openURL(
      'https://wa.me/5517992850093?text=' +
        encodeURIComponent('Olá! Preciso de ajuda com o Timeco.'),
    );

  const styles = StyleSheet.create({
    helpCard: { gap: 6 },
    title: { fontSize: 14, fontWeight: '800', color: colors.text },
    desc: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
    whatsBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: '#25D366',
      marginTop: spacing.sm,
    },
    whatsEmoji: { fontSize: 22 },
    whatsTitle: { flex: 1, fontSize: 14, fontWeight: '800', color: colors.white },
    whatsChev: { fontSize: 22, color: colors.white },
    helpLinks: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    helpLink: {
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceVariant,
    },
    helpLinkTxt: { fontSize: 12, fontWeight: '700', color: colors.primary },
  });

  return (
    <Card style={styles.helpCard}>
      <Text style={styles.title}>Precisa de ajuda?</Text>
      <Text style={styles.desc}>
        Suporte, dúvidas, reclamações e sugestões: fale direto com a Incrivia pelo WhatsApp.
        Apenas o organizador define as estrelas dos jogadores e o sorteio mistura atletas fortes
        e iniciantes em cada time.
      </Text>

      <Pressable style={styles.whatsBtn} onPress={openWhatsApp}>
        <Text style={styles.whatsEmoji}>💬</Text>
        <Text style={styles.whatsTitle}>Falar com o suporte Incrivia</Text>
        <Text style={styles.whatsChev}>›</Text>
      </Pressable>

      <View style={styles.helpLinks}>
        <Pressable style={styles.helpLink} onPress={onAddFriend}>
          <Text style={styles.helpLinkTxt}>👥 Convidar um amigo</Text>
        </Pressable>
      </View>
    </Card>
  );
};
