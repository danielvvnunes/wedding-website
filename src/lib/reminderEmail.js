export const REMINDER_DATE = "2026-09-19T19:04";
export const WEDDING_SITE = "https://franciscaedaniel.pt";

const escape = (value) => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);

export function renderReminderEmail(recipient, { oneWeekAway = true } = {}) {
  const names = new Intl.ListFormat("pt-PT", { type: "conjunction" }).format(recipient.people.map(person => person.name.trim()));
  const plural = recipient.people.length > 1;
  const greeting = names ? `Olá ${names},` : "Olá!";
  const intro = `${oneWeekAway ? "Falta uma semana para o nosso grande dia" : "O nosso grande dia está a chegar"} e estamos cada vez mais ansiosos por celebrar ${plural ? "convosco" : "contigo"}!`;
  const details = `No dia 26 de setembro, queremos partilhar ${plural ? "convosco" : "contigo"} muitos sorrisos, abraços e momentos que vamos guardar para sempre.`;
  const reminder = `${plural ? "Podem" : "Podes"} encontrar mais informações sobre o dia no nosso site. Está tudo à distância de um clique, para que ${plural ? "possam" : "possas"} chegar e aproveitar cada momento.`;
  const closing = `Mal podemos esperar por ${plural ? "vos ver" : "te ver"}!`;
  const subject = `${oneWeekAway ? "Falta uma semana para o nosso dia!" : "O nosso dia está a chegar!"} · Francisca & Daniel`;
  const text = [greeting, "", intro, "", details, "", reminder, WEDDING_SITE, "", closing, "", "Com carinho,", "Francisca & Daniel"].join("\n");
  const html = `<!doctype html>
<html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="x-apple-disable-message-reformatting"><title>${escape(subject)}</title>
<style>body,table,td,p,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}@media(max-width:480px){.email-padding{padding-left:24px!important;padding-right:24px!important}.email-title{font-size:34px!important;line-height:41px!important}}</style></head>
<body style="margin:0;padding:0;background-color:#f3f0e8;font-family:Arial,Helvetica,sans-serif;color:#64715f;">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">O dia 26 está quase a chegar. Estamos ansiosos por celebrar juntos!</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f0e8;"><tr><td align="center" style="padding:32px 12px;">
<!--[if mso]><table role="presentation" width="600"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;table-layout:fixed;border:1px solid #ddd4c0;border-radius:16px;background-color:#fbfaf5;">
<tr><td align="center" class="email-padding" style="padding:36px 44px 28px;border-bottom:1px solid #e3ddce;">
<p style="margin:0 0 21px;font-family:Georgia,'Times New Roman',serif;font-size:42px;line-height:50px;color:#897448;">F <span style="color:#8f9f8a;font-size:30px;font-style:italic;">&amp;</span> D</p>
<p style="margin:0 0 16px;font-size:10px;line-height:18px;letter-spacing:3px;text-transform:uppercase;color:#897448;">26 de setembro de 2026</p>
<h1 class="email-title" style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:42px;line-height:50px;font-weight:normal;color:#64715f;">Está quase a chegar<br>o nosso dia.</h1>
<table role="presentation" width="52" cellpadding="0" cellspacing="0" border="0" style="width:52px;margin-top:24px;"><tr><td height="1" bgcolor="#cdb892" style="height:1px;font-size:1px;line-height:1px;">&nbsp;</td></tr></table>
</td></tr>
<tr><td class="email-padding" align="center" style="padding:30px 44px 8px;">
<p style="margin:0 0 20px;font-size:16px;line-height:26px;overflow-wrap:anywhere;">${escape(greeting)}</p>
<p style="margin:0 0 18px;font-size:15px;line-height:27px;">${escape(intro)}</p>
<p style="margin:0 0 24px;font-size:14px;line-height:26px;">${escape(details)}</p>
</td></tr>
<tr><td class="email-padding" style="padding:0 44px 30px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #d8c9ac;border-radius:12px;background-color:#f8f5ee;"><tr><td align="center" style="padding:25px 22px;">
<p style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:32px;color:#64715f;">Tudo para o grande dia</p>
<p style="margin:0 0 24px;font-size:14px;line-height:25px;">${escape(reminder)}</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" bgcolor="#8f9f8a" style="border:1px solid #8f9f8a;border-radius:24px;mso-padding-alt:14px 24px;"><a href="${WEDDING_SITE}" style="display:inline-block;padding:14px 24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;font-weight:bold;text-decoration:none;color:#ffffff;">Visitar o nosso site</a></td></tr></table>
<p style="margin:17px 0 0;font-size:11px;line-height:18px;"><a href="${WEDDING_SITE}" style="color:#64715f;text-decoration:underline;">franciscaedaniel.pt</a></p>
</td></tr></table></td></tr>
<tr><td align="center" class="email-padding" style="padding:26px 44px 30px;border-top:1px solid #e3ddce;background-color:#f8f5ee;border-radius:0 0 16px 16px;">
<p style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:23px;line-height:32px;font-style:italic;">${escape(closing)}</p>
<p style="margin:0 0 5px;font-size:11px;line-height:18px;">Com carinho,</p>
<p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:25px;line-height:34px;color:#897448;">Francisca &amp; Daniel</p>
</td></tr></table>
<!--[if mso]></td></tr></table><![endif]-->
<p style="margin:19px 0 0;font-size:10px;line-height:18px;color:#64715f;letter-spacing:1px;">Um dia nosso. Uma memória de todos.</p>
</td></tr></table></body></html>`;
  return { subject, html, text };
}
