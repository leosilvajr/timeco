/**
 * Exporta o relatorio da partida como PDF e abre share sheet nativo (APK/iOS).
 *
 * Usa expo-print pra gerar o PDF a partir do HTML, e expo-sharing pra
 * abrir o seletor nativo (WhatsApp, Telegram, email, gerenciador de
 * arquivos, etc).
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { VolleyMatch } from '../types';
import { generateMatchReportHtml } from './volleyReportHtml';

export const exportMatchReportPdf = async (
  match: VolleyMatch,
): Promise<void> => {
  const html = generateMatchReportHtml(match);
  const { uri } = await Print.printToFileAsync({ html, base64: false });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Compartilhamento nao disponivel neste dispositivo');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `Relatório — ${match.teamAName} x ${match.teamBName}`,
    UTI: 'com.adobe.pdf',
  });
};
