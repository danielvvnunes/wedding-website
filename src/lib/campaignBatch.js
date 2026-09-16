import { collectTableRecipients, renderTableEmail } from './tableEmails.js';
import { renderReminderEmail } from './reminderEmail.js';

export function buildCampaignBatch(rows, kind, from, replyTo) {
  if (!['wedding_reminder', 'table_assignment'].includes(kind)) throw new Error('Campanha inválida.');
  if (!from) throw new Error('Remetente não configurado.');
  const summary = collectTableRecipients(rows);
  if (!summary.recipients.length || summary.recipients.length > 100) throw new Error('O lote deve conter entre 1 e 100 endereços.');
  if (summary.invalidEmail.length || summary.missingName.length || (kind === 'table_assignment' && summary.missingTable.length)) throw new Error('Existem emails, nomes ou mesas por corrigir. Nenhum email foi enviado.');
  return summary.recipients.map(recipient => ({
    from, to: [recipient.email], reply_to: replyTo,
    ...(kind === 'wedding_reminder' ? renderReminderEmail(recipient) : renderTableEmail(recipient)),
    tags: [{ name: 'kind', value: kind }],
  }));
}
