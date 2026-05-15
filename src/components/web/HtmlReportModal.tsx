import React from 'react';
import { modals } from '@mantine/modals';
import { Stack, Text, Textarea, Radio } from '@mantine/core';
import { useState } from 'react';
import { REPORT_REASONS, createReport, CreateReportInput } from '../../services/reportService';
import { ReportReason } from '../../types';
import { toast } from '../../store/toastStore';

interface OpenReportModalArgs {
  /** UID de quem ta denunciando. */
  reporterId: string;
  /** Dados do conteudo a ser denunciado (sem reason/details — coletados no modal). */
  target: Omit<CreateReportInput, 'reporterId' | 'reason' | 'details'>;
  /** Label do que esta sendo denunciado (ex.: 'esse perfil', 'essa foto'). */
  targetLabel: string;
}

const ReportFormBody: React.FC<{
  reporterId: string;
  target: Omit<CreateReportInput, 'reporterId' | 'reason' | 'details'>;
  targetLabel: string;
  onDone: () => void;
}> = ({ reporterId, target, targetLabel, onDone }) => {
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
      onDone();
    } catch (e) {
      console.error('createReport', e);
      toast.error('Não conseguimos enviar a denúncia. Tente de novo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        Você está denunciando {targetLabel}. Sua denúncia é anônima — apenas a
        equipe de moderação vê.
      </Text>

      <Radio.Group
        label="Motivo da denúncia"
        value={reason}
        onChange={(v) => setReason(v as ReportReason)}
      >
        <Stack gap="xs" mt="xs">
          {REPORT_REASONS.map((r) => (
            <Radio
              key={r.value}
              value={r.value}
              label={`${r.emoji} ${r.label}`}
            />
          ))}
        </Stack>
      </Radio.Group>

      <Textarea
        label="Detalhes (opcional)"
        placeholder="Descreva o que aconteceu, se quiser. Máx 500 caracteres."
        value={details}
        onChange={(e) => setDetails(e.target.value.slice(0, 500))}
        autosize
        minRows={2}
        maxRows={5}
      />

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button
          onClick={() => modals.closeAll()}
          disabled={submitting}
          style={{
            padding: '8px 16px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 14,
          }}
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || !reason}
          style={{
            padding: '8px 16px',
            background: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: submitting || !reason ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            fontSize: 14,
            fontWeight: 700,
            opacity: submitting || !reason ? 0.6 : 1,
          }}
        >
          {submitting ? 'Enviando...' : '🚩 Enviar denúncia'}
        </button>
      </div>
    </Stack>
  );
};

/** Abre modal de denuncia (web). */
export const openReportModal = (args: OpenReportModalArgs): void => {
  const modalId = modals.open({
    title: '🚩 Denunciar conteúdo',
    centered: true,
    size: 'md',
    children: (
      <ReportFormBody
        reporterId={args.reporterId}
        target={args.target}
        targetLabel={args.targetLabel}
        onDone={() => modals.close(modalId)}
      />
    ),
  });
};
