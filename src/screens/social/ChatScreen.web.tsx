import React, { useEffect, useRef, useState } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HtmlHeader, WEB_FONT_FAMILY, openReportModal, webConfirm } from '../../components/web';
import { useAuthStore, useThemedColors } from '../../store';
import { chatId, sendMessage, subscribeMessages } from '../../services/chatService';
import { blockUser, listBlockedUsers } from '../../services/blockService';
import { toast } from '../../store/toastStore';
import { ChatMessage } from '../../types';
import type { SocialStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<SocialStackParamList, 'Chat'>;
type Rt = RouteProp<SocialStackParamList, 'Chat'>;

const formatTime = (ts: ChatMessage['createdAt']): string => {
  if (!ts) return '';
  const d =
    (ts as { toDate?: () => Date }).toDate?.() ?? (ts instanceof Date ? ts : null);
  if (!d) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export const ChatScreen: React.FC = () => {
  const c = useThemedColors();
  const route = useRoute<Rt>();
  const nav = useNavigation<Nav>();
  const me = useAuthStore((s) => s.user);
  const { friendId, friendName } = route.params;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  const cid = me ? chatId(me.id, friendId) : '';

  // Carrega lista de bloqueados pra filtrar mensagens client-side
  useEffect(() => {
    if (!me) return;
    listBlockedUsers(me.id)
      .then((list) => setBlockedIds(new Set(list.map((b) => b.blockedUserId))))
      .catch(() => undefined);
  }, [me?.id]);

  useEffect(() => {
    if (!cid) return;
    const unsub = subscribeMessages(cid, (msgs) => {
      setMessages(msgs);
      setLoaded(true);
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 50);
    });
    return () => unsub();
  }, [cid]);

  // Filtra mensagens de usuarios bloqueados (cliente-side)
  const visibleMessages = messages.filter((m) => !blockedIds.has(m.senderId));

  const onBlockContact = async () => {
    if (!me) return;
    const ok = await webConfirm({
      title: 'Bloquear contato',
      message: `Bloquear ${friendName}? Você não verá mais mensagens dele e ele não saberá.`,
      confirmLabel: 'Bloquear',
      danger: true,
    });
    if (!ok) return;
    try {
      await blockUser(me.id, friendId, friendName);
      toast.success(`${friendName} bloqueado.`);
      nav.goBack();
    } catch (e) {
      console.error('blockUser', e);
      toast.error('Não conseguimos bloquear agora.');
    }
  };

  const onSend = async () => {
    if (!me || !text.trim() || sending) return;
    setSending(true);
    const t = text;
    setText('');
    try {
      await sendMessage(me.id, friendId, t);
    } catch (e) {
      setText(t);
      console.error('sendMessage', e);
    } finally {
      setSending(false);
    }
  };

  const canSend = !!text.trim() && !sending;

  return (
    <div
      style={{
        fontFamily: WEB_FONT_FAMILY,
        background: c.background,
        color: c.text,
        minHeight: '100vh',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 720,
          margin: '0 auto',
          padding: '0 12px',
          flexShrink: 0,
        }}
      >
        <HtmlHeader
          title={friendName}
          subtitle="Conversa"
          onBack={() => nav.goBack()}
          right={
            <button
              onClick={onBlockContact}
              title="Bloquear contato"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: 18,
                padding: 6,
                color: c.danger,
              }}
            >
              🚫
            </button>
          }
        />
      </div>

      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          width: '100%',
          maxWidth: 720,
          margin: '0 auto',
          padding: '0 12px',
          boxSizing: 'border-box',
        }}
      >
        {!loaded ? (
          <div style={{ textAlign: 'center', padding: 32, color: c.textSecondary }}>
            Carregando...
          </div>
        ) : messages.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 48,
              color: c.textSecondary,
            }}
          >
            <div style={{ fontSize: 50, marginBottom: 8 }}>💬</div>
            <div style={{ fontSize: 14 }}>
              Nenhuma mensagem ainda.
              <br />
              Mande um "oi" pra começar.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 0' }}>
            {visibleMessages.map((item) => {
              const mine = item.senderId === me?.id;
              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignSelf: mine ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-end',
                    gap: 6,
                    maxWidth: '85%',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '100%',
                      padding: '10px 12px',
                      borderRadius: 16,
                      background: mine ? c.primary : c.surface,
                      border: mine ? 'none' : `1px solid ${c.border}`,
                      color: mine ? c.white : c.text,
                      fontSize: 15,
                      lineHeight: 1.35,
                      borderBottomRightRadius: mine ? 4 : 16,
                      borderBottomLeftRadius: mine ? 16 : 4,
                    }}
                  >
                    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {item.text}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        marginTop: 4,
                        textAlign: 'right',
                        color: mine ? 'rgba(255,255,255,0.75)' : c.textMuted,
                      }}
                    >
                      {formatTime(item.createdAt)}
                    </div>
                  </div>
                  {!mine && me ? (
                    <button
                      onClick={() =>
                        openReportModal({
                          reporterId: me.id,
                          target: {
                            reportedUserId: item.senderId,
                            contentType: 'message',
                            contentId: item.id,
                            contentRef: `chats/${cid}/messages/${item.id}`,
                            contentSnapshot: {
                              text: item.text,
                              senderId: item.senderId,
                            },
                          },
                          targetLabel: 'essa mensagem',
                        })
                      }
                      title="Denunciar mensagem"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 14,
                        opacity: 0.5,
                        padding: 2,
                      }}
                    >
                      🚩
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: 720,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'flex-end',
          gap: 8,
          padding: '8px 12px 16px',
          borderTop: `1px solid ${c.border}`,
          background: c.surface,
          flexShrink: 0,
          boxSizing: 'border-box',
        }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Mensagem..."
          rows={1}
          style={{
            flex: 1,
            minHeight: 44,
            maxHeight: 120,
            background: c.surfaceVariant,
            borderRadius: 16,
            padding: '10px 12px',
            color: c.text,
            fontSize: 15,
            border: 'none',
            outline: 'none',
            fontFamily: 'inherit',
            resize: 'none',
            boxSizing: 'border-box',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
        />
        <button
          onClick={onSend}
          disabled={!canSend}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            background: c.primary,
            color: c.white,
            border: 'none',
            cursor: canSend ? 'pointer' : 'not-allowed',
            opacity: canSend ? 1 : 0.4,
            fontSize: 20,
            lineHeight: '22px',
            fontFamily: 'inherit',
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
};
