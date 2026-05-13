/**
 * Exporta o relatorio da partida como PDF na web.
 *
 * Usa o print dialog nativo do browser. Funciona em desktop e mobile.
 * Em mobile (Chrome/Safari), o usuario pode escolher "Salvar como PDF"
 * que depois entra na bandeja de Downloads — daí compartilha pelo OS.
 */

import { VolleyMatch } from '../types';
import { generateMatchReportHtml } from './volleyReportHtml';

export const exportMatchReportPdf = async (
  match: VolleyMatch,
): Promise<void> => {
  const html = generateMatchReportHtml(match);

  // Abre em iframe oculto pra triggerar print sem perder a tela atual
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    throw new Error('Nao foi possivel criar o documento de impressao');
  }

  doc.open();
  doc.write(html);
  doc.close();

  // Espera o conteudo carregar antes de imprimir
  await new Promise<void>((resolve) => {
    if (iframe.contentWindow?.document.readyState === 'complete') {
      resolve();
    } else {
      iframe.addEventListener('load', () => resolve(), { once: true });
    }
  });

  iframe.contentWindow?.focus();
  iframe.contentWindow?.print();

  // Remove o iframe depois que o usuario fechar o dialog
  setTimeout(() => {
    if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
  }, 1000);
};
