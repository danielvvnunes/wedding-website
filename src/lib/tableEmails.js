export const DEFAULT_TABLE_EMAIL_DATE = "2026-09-26T14:30";
export const TABLE_EMAIL_TIME_ZONE = "Europe/Lisbon";

export function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

export function collectTableRecipients(responses) {
  const groups = new Map();
  const missingEmail = [];
  const invalidEmail = [];
  for (const response of responses) {
    for (const [index, person] of (response.people || []).entries()) {
      const guest = {
        id: `${response.id}:${index}`,
        responseId: response.id,
        index,
        name: String(person.name || ""),
        email: normalizeEmail(person.email),
        table: String(person.table || ""),
        tableName: String(person.tableName || ""),
        attending: person.attending,
      };
      if (!guest.email) { missingEmail.push(guest); continue; }
      if (!isValidEmail(guest.email)) invalidEmail.push(guest);
      if (!groups.has(guest.email)) groups.set(guest.email, { email: guest.email, people: [] });
      groups.get(guest.email).people.push(guest);
    }
  }
  const recipients = [...groups.values()].sort((a, b) => a.email.localeCompare(b.email));
  recipients.forEach((group) => group.people.sort((a, b) => a.id.localeCompare(b.id)));
  return {
    recipients,
    missingEmail,
    invalidEmail,
    missingTable: recipients.flatMap((group) => group.people).filter((guest) => !guest.table.trim()),
    missingName: recipients.flatMap((group) => group.people).filter((guest) => !guest.name.trim()),
    peopleCount: recipients.reduce((sum, group) => sum + group.people.length, 0),
  };
}

// Interpret the chosen wall-clock time in Lisbon, regardless of the admin's timezone.
export function lisbonDateToISO(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error("Escolhe uma data e hora válidas.");
  const target = Date.parse(`${value}:00Z`);
  if (!Number.isFinite(target)) throw new Error("Data inválida.");
  if (new Date(target).toISOString().slice(0, 16) !== value) throw new Error("Data inválida.");
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: TABLE_EMAIL_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  });
  let timestamp = target;
  for (let pass = 0; pass < 3; pass++) {
    const local = formatter.format(new Date(timestamp)).replace(" ", "T");
    const difference = target - Date.parse(`${local}Z`);
    if (!difference) return new Date(timestamp).toISOString();
    timestamp += difference;
  }
  throw new Error("Esta hora não existe em Lisboa devido à mudança de hora.");
}

export function validateSchedule(iso, now = Date.now()) {
  const date = Date.parse(iso);
  if (!Number.isFinite(date) || date <= now + 5 * 60_000) throw new Error("Agenda com pelo menos 5 minutos de antecedência.");
  if (date > now + 30 * 86400_000) throw new Error("Só é possível agendar até 30 dias antes.");
  return new Date(date).toISOString();
}

const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
})[char]);

export function renderTableEmail(recipient) {
  const joinNames = (names) => new Intl.ListFormat("pt-PT", { style: "long", type: "conjunction" }).format(names);
  const plural = recipient.people.length > 1;
  const tables = new Map();
  for (const person of recipient.people) {
    const number = person.table.trim();
    const name = (person.tableName || "").trim();
    const key = JSON.stringify([number, name]);
    if (!tables.has(key)) tables.set(key, { number, name, people: [] });
    tables.get(key).people.push(person.name.trim());
  }
  const title = plural ? (tables.size > 1 ? "As vossas mesas" : "A vossa mesa") : "A tua mesa";
  const names = joinNames(recipient.people.map((person) => person.name.trim()));
  const intro = plural
    ? `Entre brindes, abraços e boas conversas, há um lugar à vossa espera. ${tables.size === 1 ? "Aqui fica a vossa mesa" : "Aqui ficam as mesas"} para continuarmos a celebrar juntos.`
    : "Entre brindes, abraços e boas conversas, há um lugar à tua espera. Aqui fica a tua mesa para continuarmos a celebrar juntos.";
  const thanks = plural ? "O nosso dia é mais bonito convosco." : "O nosso dia é mais bonito contigo.";
  const subject = plural || !recipient.people[0].table.trim() ? `${title} · Francisca & Daniel` : `A tua mesa: ${recipient.people[0].table.trim()} · Francisca & Daniel`;
  const preheader = recipient.people.map((person) => `${person.name.trim()}: mesa ${person.table.trim()}${person.tableName ? ` · ${person.tableName.trim()}` : ""}`).join(" · ");
  const text = [
    `Olá ${names},`, "", intro, "",
    ...(tables.size === 1
      ? [...tables.values()].map((table) => `Mesa ${table.number || "Por atribuir"}${table.name ? ` · ${table.name}` : ""}`)
      : recipient.people.map((person) => `${person.name} — Mesa ${person.table.trim() || "Por atribuir"}${person.tableName ? ` · ${person.tableName}` : ""}`)),
    "", "Quando chegar a hora de entrar na sala, a equipa da quinta estará por perto para ajudar.",
    "", thanks, "", "Com carinho,", "Francisca & Daniel", "26 de setembro de 2026",
  ].join("\n");
  const cards = [...tables.values()].map((table) => `
    <tr><td style="padding:0 0 16px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border:1px solid #d8c9ac;border-radius:12px;background-color:#f8f5ee;">
        <tr><td style="padding:6px 6px 0;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td height="3" bgcolor="#b7c4b0" style="height:3px;font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>
        <tr><td align="center" class="seat-padding" style="padding:25px 24px 28px;">
          ${tables.size > 1 ? `<p style="margin:0 0 17px;color:#64715f;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:23px;font-weight:bold;overflow-wrap:anywhere;">${escape(joinNames(table.people))}</p>` : ""}
          <p style="margin:0;color:#897448;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:18px;letter-spacing:3px;text-transform:uppercase;">Mesa</p>
          <p class="table-number" style="margin:3px 0 0;color:#64715f;font-family:Georgia,'Times New Roman',serif;font-size:${!table.number || table.number.length > 5 ? "36" : "68"}px;line-height:1.15;font-weight:normal;overflow-wrap:anywhere;">${escape(table.number || "Por atribuir")}</p>
          ${table.name ? `<p style="margin:8px 0 0;color:#897448;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:25px;line-height:32px;overflow-wrap:anywhere;">${escape(table.name)}</p>` : ""}
          <table role="presentation" width="38" cellspacing="0" cellpadding="0" border="0" style="width:38px;margin-top:20px;"><tr><td height="1" bgcolor="#cdb892" style="height:1px;line-height:1px;font-size:1px;">&nbsp;</td></tr></table>
        </td></tr>
      </table>
    </td></tr>`).join("");
  const html = `<!doctype html>
<html lang="pt">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>${title} · Francisca &amp; Daniel</title>
  <style>
    body, table, td, p, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
    @media only screen and (max-width:480px) {
      .outer-padding { padding:16px 8px !important; }
      .email-padding { padding-left:22px !important; padding-right:22px !important; }
      .email-title { font-size:34px !important; line-height:42px !important; }
      .seat-padding { padding-left:16px !important; padding-right:16px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f2efe7;color:#64715f;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${escape(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f2efe7" style="width:100%;">
    <tr><td align="center" class="outer-padding" style="padding:32px 16px;">
      <!--[if mso]><table role="presentation" width="600" align="center" cellspacing="0" cellpadding="0" border="0"><tr><td><![endif]-->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background-color:#fffefa;border:1px solid #e3ddce;border-radius:16px;">
        <tr><td height="6" bgcolor="#b7c4b0" style="height:6px;font-size:0;line-height:0;border-radius:16px 16px 0 0;">&nbsp;</td></tr>
        <tr><td align="center" class="email-padding" style="padding:35px 44px 28px;background-color:#eef1e8;">
          <p style="margin:0 0 21px;font-size:10px;line-height:17px;letter-spacing:3px;color:#64715f;text-transform:uppercase;">26 setembro 2026</p>
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:60px;line-height:70px;color:#8f9f8a;font-weight:normal;">F<span style="font-size:36px;color:#b39b6f;font-style:italic;">&amp;</span>D</p>
          <p style="margin:14px 0 0;font-size:10px;line-height:19px;letter-spacing:2.5px;color:#64715f;text-transform:uppercase;">Francisca &amp; Daniel</p>
        </td></tr>
        <tr><td align="center" class="email-padding" style="padding:32px 44px 0;">
          <p style="margin:0 0 11px;font-size:10px;line-height:18px;letter-spacing:2.5px;text-transform:uppercase;color:#897448;">À mesa, juntos</p>
          <h1 class="email-title" style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:40px;line-height:48px;font-weight:normal;color:#64715f;">${title}</h1>
          <table role="presentation" width="52" cellspacing="0" cellpadding="0" border="0" style="width:52px;margin-top:22px;"><tr><td height="1" bgcolor="#cdb892" style="height:1px;font-size:1px;line-height:1px;">&nbsp;</td></tr></table>
        </td></tr>
        <tr><td class="email-padding" style="padding:25px 44px 23px;text-align:center;">
          <p style="margin:0 0 12px;font-size:15px;line-height:25px;color:#64715f;overflow-wrap:anywhere;">Olá ${escape(names)},</p>
          <p style="margin:0;font-size:14px;line-height:25px;color:#64715f;">${intro}</p>
        </td></tr>
        <tr><td class="email-padding" style="padding:0 44px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;table-layout:fixed;">${cards}</table></td></tr>
        <tr><td align="center" class="email-padding" style="padding:5px 44px 28px;">
          <p style="margin:0;font-size:12px;line-height:21px;color:#64715f;">Quando chegar a hora de entrar na sala,<br>a equipa da quinta estará por perto para ajudar.</p>
        </td></tr>
        <tr><td align="center" class="email-padding" style="padding:27px 44px 30px;border-top:1px solid #e3ddce;background-color:#f8f5ee;border-radius:0 0 16px 16px;">
          <p style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:21px;line-height:29px;font-style:italic;color:#64715f;">${thanks}</p>
          <p style="margin:0 0 5px;font-size:11px;line-height:18px;color:#64715f;">Com carinho,</p>
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:25px;line-height:34px;color:#897448;">Francisca &amp; Daniel</p>
        </td></tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
      <p style="margin:19px 0 0;font-size:10px;line-height:18px;color:#64715f;letter-spacing:1px;">Um dia nosso. Uma memória de todos.</p>
    </td></tr>
  </table>
</body>
</html>`;
  return { subject, html, text };
}
