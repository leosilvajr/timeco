import React, { useCallback, useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HtmlScreen, HtmlHeader, HtmlCard, HtmlButton } from '../../components/web';
import { useAuthStore, useThemedColors } from '../../store';
import { toast } from '../../store/toastStore';
import {
  listReports,
  updateReportStatus,
  reasonLabel,
  contentTypeLabel,
} from '../../services/reportService';
import { Timestamp } from 'firebase/firestore';
import { Report, ReportStatus } from '../../types';
import type { ProfileStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'ReportsAdmin'>;

const STATUS_TABS: { value: ReportStatus | 'all'; label: string }[] = [
  { value: 'open', label: '🔴 Abertas' },
  { value: 'reviewed', label: '🟡 Revisadas' },
  { value: 'actioned', label: '🟢 Com ação' },
  { value: 'dismissed', label: '⚫ Descartadas' },
  { value: 'all', label: '📋 Todas' },
];

const formatDate = (ts: Timestamp | Date | null | undefined): string => {
  if (!ts) return '';
  const d = (ts as Timestamp)?.toDate?.() ?? (ts as Date);
  return d?.toLocaleString?.('pt-BR') ?? '';
};

export const ReportsAdminScreen: React.FC = () => {
  const c = useThemedColors();
  const nav = useNavigation<Nav>();
  const current = useAuthStore((s) => s.user);
  const [filter, setFilter] = useState<ReportStatus | 'all'>('open');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listReports(filter === 'all' ? undefined : filter, 100);
      setReports(list);
    } catch (e) {
      console.error('listReports', e);
      toast.error('Erro ao carregar denúncias.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const onAction = async (r: Report, newStatus: ReportStatus) => {
    if (!current) return;
    setActingId(r.id);
    try {
      await updateReportStatus(r.id, newStatus, current.id);
      toast.success('Denúncia atualizada.');
      await load();
    } catch (e) {
      console.error('updateReport', e);
      toast.error('Não conseguimos atualizar.');
    } finally {
      setActingId(null);
    }
  };

  if (current?.role !== 'superadmin') {
    return (
      <HtmlScreen>
        <HtmlHeader title="Acesso negado" onBack={() => nav.goBack()} />
        <p style={{ color: c.textSecondary }}>Só superadmin acessa essa tela.</p>
      </HtmlScreen>
    );
  }

  return (
    <HtmlScreen maxWidth={900}>
      <HtmlHeader
        title="🚩 Denúncias"
        subtitle={`${reports.length} ${filter === 'all' ? 'totais' : 'em ' + (STATUS_TABS.find((s) => s.value === filter)?.label ?? '')}`}
        onBack={() => nav.goBack()}
      />

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {STATUS_TABS.map((tab) => {
          const active = filter === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 999,
                border: `1.5px solid ${active ? c.primary : c.border}`,
                background: active ? c.primary : c.surface,
                color: active ? c.onPrimary : c.text,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p style={{ color: c.textMuted, textAlign: 'center' }}>Carregando...</p>
      ) : reports.length === 0 ? (
        <p style={{ color: c.textMuted, textAlign: 'center', padding: 24 }}>
          🎉 Nenhuma denúncia nesse filtro.
        </p>
      ) : (
        reports.map((r) => (
          <HtmlCard key={r.id} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: c.text }}>
                  {contentTypeLabel(r.contentType)} · {reasonLabel(r.reason)}
                </div>
                <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>
                  {formatDate(r.createdAt)} · reporter: {r.reporterId.slice(0, 8)}
                  ... · reported: {r.reportedUserId.slice(0, 8)}...
                </div>
                {r.details ? (
                  <div
                    style={{
                      fontSize: 13,
                      color: c.text,
                      background: c.surfaceVariant,
                      padding: 8,
                      borderRadius: 6,
                      marginTop: 8,
                    }}
                  >
                    "{r.details}"
                  </div>
                ) : null}
                {r.contentRef ? (
                  <div style={{ fontSize: 11, color: c.textMuted, marginTop: 4 }}>
                    📂 <code>{r.contentRef}</code>
                  </div>
                ) : null}
                {r.contentSnapshot ? (
                  <details style={{ marginTop: 6 }}>
                    <summary
                      style={{ fontSize: 11, color: c.textSecondary, cursor: 'pointer' }}
                    >
                      Ver snapshot
                    </summary>
                    <pre
                      style={{
                        fontSize: 10,
                        background: c.surfaceVariant,
                        padding: 6,
                        borderRadius: 4,
                        overflow: 'auto',
                        maxHeight: 200,
                      }}
                    >
                      {JSON.stringify(r.contentSnapshot, null, 2)}
                    </pre>
                  </details>
                ) : null}
                <div style={{ fontSize: 11, color: c.textMuted, marginTop: 8 }}>
                  Status: <strong>{r.status}</strong>
                  {r.reviewedBy ? ` · revisado por ${r.reviewedBy.slice(0, 8)}...` : ''}
                </div>
              </div>
            </div>

            {r.status === 'open' ? (
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  marginTop: 10,
                  flexWrap: 'wrap',
                }}
              >
                <HtmlButton
                  title="✅ Marcar revisada"
                  variant="outline"
                  onClick={() => onAction(r, 'reviewed')}
                  loading={actingId === r.id}
                  fullWidth={false}
                  style={{ minHeight: 32, padding: '0 10px', fontSize: 12 }}
                />
                <HtmlButton
                  title="⚠️ Tomei ação"
                  variant="secondary"
                  onClick={() => onAction(r, 'actioned')}
                  loading={actingId === r.id}
                  fullWidth={false}
                  style={{ minHeight: 32, padding: '0 10px', fontSize: 12 }}
                />
                <HtmlButton
                  title="🚫 Descartar"
                  variant="ghost"
                  onClick={() => onAction(r, 'dismissed')}
                  loading={actingId === r.id}
                  fullWidth={false}
                  style={{ minHeight: 32, padding: '0 10px', fontSize: 12 }}
                />
              </div>
            ) : null}
          </HtmlCard>
        ))
      )}
    </HtmlScreen>
  );
};
