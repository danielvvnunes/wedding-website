const DEFAULT_SUBJECT = "A tua mesa";
const DEFAULT_REPLY_TO = "casamento.franciscadaniel@gmail.com";
const RESEND_EMAIL_URL = "https://api.resend.com/emails";
const RESEND_BATCH_URL = "https://api.resend.com/emails/batch";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getAdminPassword() {
  return (
    process.env.TABLE_EMAIL_ADMIN_PASSWORD ||
    process.env.ADMIN_PASSWORD ||
    process.env.VITE_ADMIN_PASSWORD
  );
}

function getHeader(req, name) {
  const header = req.headers[name.toLowerCase()];
  return Array.isArray(header) ? header[0] : header;
}

function parseBody(body) {
  if (!body) return {};
  if (typeof body === "string") return JSON.parse(body);
  return body;
}

function cleanEnvValue(value) {
  return String(value || "")
    .trim()
    .replace(/^['"]|['"]$/g, "");
}

function normalizeRecipient(recipient, index) {
  const email = String(recipient.email || "").trim();
  const firstName = String(
    recipient.firstName || recipient.primeiro_nome || recipient.nome || "",
  ).trim();
  const table = String(recipient.table || recipient.mesa || "").trim();
  const tableName = String(
    recipient.tableName || recipient.nome_mesa || "",
  ).trim();

  if (!email) {
    throw new Error(`Falta o email no convidado ${index + 1}.`);
  }

  if (!firstName) {
    throw new Error(`Falta o primeiro nome no convidado ${index + 1}.`);
  }

  if (!table) {
    throw new Error(`Falta a mesa no convidado ${index + 1}.`);
  }

  return { email, firstName, table, tableName };
}

function renderHtmlEmail({ firstName, table, tableName }) {
  const safeFirstName = escapeHtml(firstName);
  const safeTable = escapeHtml(table);
  const safeTableName = escapeHtml(tableName);

  return `<!doctype html>
<html lang="pt">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <title>A tua mesa</title>
  </head>
  <body style="margin:0; padding:0; background:#fbfaf5; color:#6f7f69; font-family:Arial, Helvetica, sans-serif;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">
      Quando chegar a hora de entrar na sala, esta é a tua mesa.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fbfaf5;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%; max-width:640px; background:#ffffff; border:1px solid #e8dfcf; border-radius:8px; overflow:hidden;">
            <tr>
              <td align="center" style="background:#eef3ea; padding:34px 28px 26px; border-bottom:1px solid #dfe8d9;">
                <div style="font-size:13px; line-height:18px; letter-spacing:2px; text-transform:uppercase; color:#a99672; font-weight:bold;">Francisca &amp; Daniel</div>
                <h1 style="margin:14px 0 8px; font-family:Georgia, 'Times New Roman', serif; font-size:34px; line-height:40px; font-weight:normal; color:#6f7f69;">A tua mesa</h1>
                <div style="font-size:15px; line-height:22px; color:#8f9f8a;">Obrigado por estares connosco hoje</div>
              </td>
            </tr>
            <tr>
              <td style="padding:34px 30px 12px;">
                <p style="margin:0 0 18px; font-size:17px; line-height:28px; color:#6f7f69;">Olá ${safeFirstName},</p>
                <p style="margin:0 0 18px; font-size:17px; line-height:28px; color:#6f7f69;">Esperamos que estejas a aproveitar o cocktail. Daqui a pouco vamos entrar para a sala e, para ser mais fácil encontrares o teu lugar, aqui fica a tua mesa:</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:8px 30px 28px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%; max-width:420px; background:#f8f5ee; border:1px solid #d8c7a7; border-radius:8px;">
                  <tr>
                    <td align="center" style="padding:28px 20px;">
                      <div style="font-size:12px; line-height:18px; letter-spacing:2px; text-transform:uppercase; color:#a99672; font-weight:bold;">Mesa</div>
                      <div style="margin-top:8px; font-family:Georgia, 'Times New Roman', serif; font-size:44px; line-height:52px; color:#6f7f69;">${safeTable}</div>
                      ${
                        safeTableName
                          ? `<div style="margin-top:10px; font-size:14px; line-height:21px; color:#8f9f8a;">${safeTableName}</div>`
                          : ""
                      }
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 30px 28px;">
                <p style="margin:0 0 18px; font-size:16px; line-height:27px; color:#6f7f69;">Quando for anunciado o momento de entrada, a equipa da Quinta do Coração também estará por perto para te orientar. Até lá, continua a brindar e a aproveitar connosco.</p>
                <p style="margin:0; font-size:16px; line-height:27px; color:#6f7f69;">Obrigado por estares aqui e por fazeres parte deste dia tão especial.</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:26px 24px 30px; background:#f8f5ee; border-top:1px solid #e8dfcf;">
                <div style="font-family:Georgia, 'Times New Roman', serif; font-size:24px; line-height:30px; color:#a99672;">Com carinho,</div>
                <div style="margin-top:6px; font-size:16px; line-height:24px; color:#6f7f69;">Francisca &amp; Daniel</div>
                <div style="margin-top:14px; font-size:12px; line-height:18px; color:#8f9f8a;">${DEFAULT_REPLY_TO}</div>
              </td>
            </tr>
          </table>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%; max-width:640px;">
            <tr>
              <td align="center" style="padding:16px 20px 0; font-size:12px; line-height:18px; color:#9aa693;">Se precisares de ajuda, fala com alguém da equipa da quinta.</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderTextEmail({ firstName, table, tableName }) {
  const lines = [
    `Olá ${firstName},`,
    "",
    "Esperamos que estejas a aproveitar o cocktail.",
    "",
    "Daqui a pouco vamos entrar para a sala e, para ser mais fácil encontrares o teu lugar, aqui fica a tua mesa:",
    "",
    `Mesa: ${table}`,
  ];

  if (tableName) {
    lines.push(tableName);
  }

  lines.push(
    "",
    "Quando for anunciado o momento de entrada, a equipa da Quinta do Coração também estará por perto para te orientar.",
    "Até lá, continua a brindar e a aproveitar connosco.",
    "",
    "Obrigado por estares aqui e por fazeres parte deste dia tão especial.",
    "",
    "Com carinho,",
    "Francisca & Daniel",
    "",
    `Contacto: ${DEFAULT_REPLY_TO}`,
  );

  return lines.join("\n");
}

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido." });
  }

  const expectedPassword = getAdminPassword();
  const requestPassword = getHeader(req, "x-admin-password");

  if (!expectedPassword) {
    return res.status(500).json({
      error:
        "Falta configurar TABLE_EMAIL_ADMIN_PASSWORD, ADMIN_PASSWORD ou VITE_ADMIN_PASSWORD.",
    });
  }

  if (expectedPassword && requestPassword !== expectedPassword) {
    return res.status(401).json({ error: "Password inválida." });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: "Falta configurar RESEND_API_KEY." });
  }

  if (!process.env.RESEND_FROM_EMAIL) {
    return res
      .status(500)
      .json({ error: "Falta configurar RESEND_FROM_EMAIL." });
  }

  let body;
  try {
    body = parseBody(req.body);
  } catch {
    return res.status(400).json({ error: "JSON inválido." });
  }

  if (!Array.isArray(body.recipients) || body.recipients.length === 0) {
    return res
      .status(400)
      .json({ error: "Envia uma lista em recipients com pelo menos 1 pessoa." });
  }

  let recipients;
  try {
    recipients = body.recipients.map(normalizeRecipient);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  const subject = String(body.subject || DEFAULT_SUBJECT).trim();
  const scheduledAt = body.scheduledAt ? String(body.scheduledAt).trim() : "";
  const from = cleanEnvValue(process.env.RESEND_FROM_EMAIL);
  const replyTo = cleanEnvValue(process.env.RESEND_REPLY_TO) || DEFAULT_REPLY_TO;
  const emailPayloads = recipients.map((recipient) => ({
    from,
    to: [recipient.email],
    subject,
    html: renderHtmlEmail(recipient),
    text: renderTextEmail(recipient),
    reply_to: replyTo,
    tags: [{ name: "kind", value: "table_assignment" }],
    ...(scheduledAt ? { scheduled_at: scheduledAt } : {}),
  }));

  const results = [];

  if (scheduledAt) {
    for (const [emailIndex, payload] of emailPayloads.entries()) {
      const response = await fetch(RESEND_EMAIL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `table-email-${scheduledAt}-${emailIndex}-${payload.to[0]}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return res.status(response.status).json({
          error:
            data?.error?.message ||
            data?.message ||
            "Erro ao agendar email pelo Resend.",
          details: data,
        });
      }

      results.push(data);
    }

    return res.status(200).json({
      sent: recipients.length,
      scheduledAt,
      results,
    });
  }

  for (const [batchIndex, batch] of chunk(emailPayloads, 100).entries()) {
    const response = await fetch(RESEND_BATCH_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `table-emails-${Date.now()}-${batchIndex}`,
      },
      body: JSON.stringify(batch),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data?.error?.message ||
          data?.message ||
          "Erro ao enviar emails pelo Resend.",
        details: data,
      });
    }

    results.push(data);
  }

  return res.status(200).json({
    sent: recipients.length,
    batches: results.length,
    results,
  });
}
