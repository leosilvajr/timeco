import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Header } from '../../components';
import { colors, spacing, radius } from '../../constants/theme';
import { useAuthStore, useThemedColors } from '../../store';
import { chatId, sendMessage, subscribeMessages } from '../../services/chatService';
import { ChatMessage } from '../../types';
import type { SocialStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<SocialStackParamList, 'Chat'>;
type Rt = RouteProp<SocialStackParamList, 'Chat'>;

const formatTime = (ts: ChatMessage['createdAt']): string => {
  if (!ts) return '';
  const d =
    (ts as { toDate?: () => Date }).toDate?.() ??
    (ts instanceof Date ? ts : null);
  if (!d) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export const ChatScreen: React.FC = () => {
  useThemedColors();
  const route = useRoute<Rt>();
  const nav = useNavigation<Nav>();
  const me = useAuthStore((s) => s.user);
  const { friendId, friendName } = route.params;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const cid = me ? chatId(me.id, friendId) : '';

  useEffect(() => {
    if (!cid) return;
    const unsub = subscribeMessages(cid, (msgs) => {
      setMessages(msgs);
      setLoaded(true);
      // rola para o final no próximo tick
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    });
    return () => unsub();
  }, [cid]);

  const onSend = async () => {
    if (!me || !text.trim() || sending) return;
    setSending(true);
    const t = text;
    setText('');
    try {
      await sendMessage(me.id, friendId, t);
    } catch (e) {
      // se falhar, restaura o texto pra o usuário tentar de novo
      setText(t);
      console.error('sendMessage', e);
    } finally {
      setSending(false);
    }
  };

  const styles = StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    body: {
      flex: 1,
      paddingHorizontal: spacing.lg,
    },
    list: {
      flex: 1,
    },
    listContent: {
      paddingVertical: spacing.md,
      gap: spacing.sm,
    },
    bubble: {
      maxWidth: '80%',
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      borderRadius: radius.lg,
    },
    bubbleMine: {
      backgroundColor: colors.primary,
      alignSelf: 'flex-end',
      borderBottomRightRadius: 4,
    },
    bubbleTheirs: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignSelf: 'flex-start',
      borderBottomLeftRadius: 4,
    },
    bubbleTextMine: {
      color: colors.white,
      fontSize: 15,
      lineHeight: 20,
    },
    bubbleTextTheirs: {
      color: colors.text,
      fontSize: 15,
      lineHeight: 20,
    },
    bubbleTime: {
      fontSize: 10,
      marginTop: 4,
      alignSelf: 'flex-end',
    },
    bubbleTimeMine: {
      color: 'rgba(255,255,255,0.75)',
    },
    bubbleTimeTheirs: {
      color: colors.textMuted,
    },
    composer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    input: {
      flex: 1,
      minHeight: 44,
      maxHeight: 120,
      backgroundColor: colors.surfaceVariant,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      color: colors.text,
      fontSize: 15,
    },
    sendBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendBtnDisabled: {
      opacity: 0.4,
    },
    sendIcon: {
      color: colors.white,
      fontSize: 20,
      lineHeight: 22,
      marginLeft: 2,
    },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    emptyEmoji: {
      fontSize: 50,
    },
    emptyTxt: {
      color: colors.textSecondary,
      textAlign: 'center',
      fontSize: 14,
    },
  });

  const canSend = !!text.trim() && !sending;

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const mine = item.senderId === me?.id;
    return (
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={mine ? styles.bubbleTextMine : styles.bubbleTextTheirs}>{item.text}</Text>
        <Text style={[styles.bubbleTime, mine ? styles.bubbleTimeMine : styles.bubbleTimeTheirs]}>
          {formatTime(item.createdAt)}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.body}>
          <Header title={friendName} subtitle="Conversa" onBack={() => nav.goBack()} />
          {!loaded ? (
            <View style={styles.empty}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>💬</Text>
              <Text style={styles.emptyTxt}>
                Nenhuma mensagem ainda.{'\n'}Mande um "oi" pra começar.
              </Text>
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(m) => m.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.listContent}
              style={styles.list}
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            />
          )}
        </View>

        <View style={styles.composer}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Mensagem..."
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            multiline
            onSubmitEditing={onSend}
            blurOnSubmit={false}
          />
          <Pressable
            onPress={onSend}
            disabled={!canSend}
            style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
