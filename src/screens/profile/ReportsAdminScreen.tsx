import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, Card, Button } from '../../components';
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
      <Screen>
        <Header title="Acesso negado" onBack={() => nav.goBack()} />
        <Text style={{ color: c.textSecondary, padding: 16 }}>
          Só superadmin acessa essa tela.
        </Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header
        title="🚩 Denúncias"
        subtitle={`${reports.length} ${
          filter === 'all' ? 'totais' : 'no filtro'
        }`}
        onBack={() => nav.goBack()}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 6, paddingBottom: 8 }}
      >
        {STATUS_TABS.map((tab) => {
          const active = filter === tab.value;
          return (
            <Pressable
              key={tab.value}
              onPress={() => setFilter(tab.value)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                borderWidth: 1.5,
                borderColor: active ? c.primary : c.border,
                backgroundColor: active ? c.primary : c.surface,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: active ? c.onPrimary : c.text,
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading ? (
        <Text style={{ color: c.textMuted, textAlign: 'center', padding: 16 }}>
          Carregando...
        </Text>
      ) : reports.length === 0 ? (
        <Text style={{ color: c.textMuted, textAlign: 'center', padding: 32 }}>
          🎉 Nenhuma denúncia nesse filtro.
        </Text>
      ) : (
        reports.map((r) => (
          <Card key={r.id} style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: c.text }}>
              {contentTypeLabel(r.contentType)} · {reasonLabel(r.reason)}
            </Text>
            <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>
              {formatDate(r.createdAt)}
            </Text>
            <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>
              reporter: {r.reporterId.slice(0, 8)}... · reported:{' '}
              {r.reportedUserId.slice(0, 8)}...
            </Text>
            {r.details ? (
              <View
                style={{
                  backgroundColor: c.surfaceVariant,
                  padding: 8,
                  borderRadius: 6,
                  marginTop: 8,
                }}
              >
                <Text style={{ fontSize: 13, color: c.text }}>"{r.details}"</Text>
              </View>
            ) : null}
            {r.contentRef ? (
              <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 4 }}>
                📂 {r.contentRef}
              </Text>
            ) : null}
            <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 8 }}>
              Status: <Text style={{ fontWeight: '700' }}>{r.status}</Text>
            </Text>

            {r.status === 'open' ? (
              <View
                style={{
                  flexDirection: 'row',
                  gap: 6,
                  marginTop: 10,
                  flexWrap: 'wrap',
                }}
              >
                <View style={{ flex: 1, minWidth: 100 }}>
                  <Button
                    title="✅ Revisada"
                    variant="outline"
                    onPress={() => onAction(r, 'reviewed')}
                    loading={actingId === r.id}
                  />
                </View>
                <View style={{ flex: 1, minWidth: 100 }}>
                  <Button
                    title="⚠️ Ação"
                    variant="secondary"
                    onPress={() => onAction(r, 'actioned')}
                    loading={actingId === r.id}
                  />
                </View>
                <View style={{ flex: 1, minWidth: 100 }}>
                  <Button
                    title="🚫 Descartar"
                    variant="ghost"
                    onPress={() => onAction(r, 'dismissed')}
                    loading={actingId === r.id}
                  />
                </View>
              </View>
            ) : null}
          </Card>
        ))
      )}
    </Screen>
  );
};
