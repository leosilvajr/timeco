import React, { useState } from 'react';
import { View, Text, Modal, Pressable, TextInput, ScrollView } from 'react-native';
import { Button } from './Button';
import { useThemedColors } from '../store';
import {
  REPORT_REASONS,
  createReport,
  CreateReportInput,
} from '../services/reportService';
import { ReportReason } from '../types';
import { toast } from '../store/toastStore';

interface Props {
  visible: boolean;
  onClose: () => void;
  reporterId: string;
  target: Omit<CreateReportInput, 'reporterId' | 'reason' | 'details'>;
  targetLabel: string;
}

/** Modal de denuncia pro APK. Usa RN Modal + Pressable + TextInput. */
export const ReportModal: React.FC<Props> = ({
  visible,
  onClose,
  reporterId,
  target,
  targetLabel,
}) => {
  const c = useThemedColors();
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Selecione um motivo.');
      return;
    }
    setSubmitting(true);
    try {
      await createReport({
        ...target,
        reporterId,
        reason,
        details: details.trim() || undefined,
      });
      toast.success('Denúncia recebida. Vamos analisar em até 48h.');
      setReason('');
      setDetails('');
      onClose();
    } catch (e) {
      console.error('createReport', e);
      toast.error('Não conseguimos enviar a denúncia. Tente de novo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={{
            backgroundColor: c.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
            maxHeight: '90%',
          }}
        >
          <ScrollView>
            <Text style={{ fontSize: 18, fontWeight: '800', color: c.text, marginBottom: 4 }}>
              🚩 Denunciar conteúdo
            </Text>
            <Text style={{ fontSize: 13, color: c.textSecondary, marginBottom: 16 }}>
              Você está denunciando {targetLabel}. Sua denúncia é anônima — apenas
              a equipe de moderação vê.
            </Text>

            <Text style={{ fontSize: 13, fontWeight: '700', color: c.text, marginBottom: 8 }}>
              Motivo da denúncia
            </Text>
            {REPORT_REASONS.map((r) => {
              const selected = reason === r.value;
              return (
                <Pressable
                  key={r.value}
                  onPress={() => setReason(r.value)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    borderWidth: 1.5,
                    borderColor: selected ? c.primary : c.border,
                    backgroundColor: selected ? c.surfaceVariant : c.surface,
                    marginBottom: 6,
                  }}
                >
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      borderWidth: 2,
                      borderColor: selected ? c.primary : c.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {selected ? (
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: c.primary,
                        }}
                      />
                    ) : null}
                  </View>
                  <Text style={{ fontSize: 14, color: c.text, flex: 1 }}>
                    {r.emoji} {r.label}
                  </Text>
                </Pressable>
              );
            })}

            <Text
              style={{
                fontSize: 13,
                fontWeight: '700',
                color: c.text,
                marginTop: 12,
                marginBottom: 6,
              }}
            >
              Detalhes (opcional)
            </Text>
            <TextInput
              value={details}
              onChangeText={(t) => setDetails(t.slice(0, 500))}
              placeholder="Descreva o que aconteceu, se quiser. Máx 500 caracteres."
              placeholderTextColor={c.textMuted}
              multiline
              numberOfLines={3}
              style={{
                borderWidth: 1,
                borderColor: c.border,
                borderRadius: 8,
                padding: 10,
                color: c.text,
                fontSize: 14,
                minHeight: 60,
                textAlignVertical: 'top',
              }}
            />

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
              <View style={{ flex: 1 }}>
                <Button title="Cancelar" variant="ghost" onPress={onClose} />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="🚩 Enviar"
                  variant="danger"
                  onPress={handleSubmit}
                  loading={submitting}
                  disabled={!reason}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
