import { loadEnv } from "vite";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, rename, open, unlink } from "node:fs/promises";
import { collectTableRecipients, lisbonDateToISO, validateSchedule } from "../src/lib/tableEmails.js";
import { REMINDER_DATE, renderReminderEmail } from "../src/lib/reminderEmail.js";

// Preparation is read-only remotely. Only --schedule submits scheduled messages.
const mode = process.argv[2] || "--prepare";
if (!["--prepare", "--schedule", "--status"].includes(mode)) throw new Error("Usar --prepare, --schedule ou --status.");
const env = { ...loadEnv("development", process.cwd(), ""), ...process.env };
const directory = ".email-campaigns.local";
const file = `${directory}/reminder-2026-09-19.json`;
const scheduledAt = lisbonDateToISO(REMINDER_DATE);
const hash = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");
await mkdir(directory, { recursive: true, mode: 0o700 });
const lock = await open(`${file}.lock`, "wx", 0o600);
try {
  let campaign;
  try { campaign = JSON.parse(await readFile(file, "utf8")); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  async function save() {
    await writeFile(`${file}.tmp`, JSON.stringify(campaign, null, 2), { mode: 0o600 });
    await rename(`${file}.tmp`, file);
  }
  if (mode === "--prepare" && !campaign) {
    validateSchedule(scheduledAt);
    if (!env.RESEND_FROM_EMAIL || !env.RESEND_API_KEY) throw new Error("Falta configurar o Resend.");
    const db = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    const rows = [];
    for (let start = 0; ; start += 1000) {
      const { data, error } = await db.from("rsvp").select("id,people").order("id").range(start, start + 999);
      if (error) throw new Error(error.message);
      rows.push(...data);
      if (data.length < 1000) break;
    }
    const summary = collectTableRecipients(rows);
    if (!summary.recipients.length || summary.invalidEmail.length || summary.missingName.length) throw new Error("Rever destinatários: não há emails ou existem emails/nomes inválidos.");
    campaign = {
      kind: "wedding_reminder", scheduledAt, createdAt: new Date().toISOString(),
      people: summary.peopleCount, withoutEmail: summary.missingEmail.length,
      jobs: summary.recipients.map(recipient => {
        const payload = {
          from: env.RESEND_FROM_EMAIL, to: [recipient.email], ...renderReminderEmail(recipient),
          reply_to: env.RESEND_REPLY_TO || "casamento.franciscadaniel@gmail.com",
          tags: [{ name: "kind", value: "wedding_reminder" }], scheduled_at: scheduledAt,
        };
        return { key: `wedding-reminder-${hash(payload)}`, payload, status: "ready" };
      }),
    };
    await save();
    await writeFile(`${directory}/reminder-preview.html`, renderReminderEmail({ people: [{ name: "Maria" }, { name: "Tiago" }, { name: "Tomás" }] }).html, { mode: 0o600 });
  }
  if (!campaign) throw new Error("Executar --prepare primeiro.");
  if (mode === "--schedule") {
    if (campaign.centralizedAt) throw new Error("Esta campanha foi migrada para o admin. O script local já não pode agendar emails.");
    validateSchedule(campaign.scheduledAt);
    if (campaign.scheduledAt !== scheduledAt || campaign.kind !== "wedding_reminder") throw new Error("Data ou campanha inesperada.");
    if (!env.RESEND_API_KEY) throw new Error("Falta configurar RESEND_API_KEY.");
    for (const [index, job] of campaign.jobs.entries()) {
      if (job.id) continue;
      validateSchedule(job.payload.scheduled_at);
      if (job.payload.scheduled_at !== scheduledAt || job.key !== `wedding-reminder-${hash(job.payload)}` || job.payload.to.length !== 1) throw new Error("O conteúdo preparado foi alterado.");
      if (job.firstAttemptAt && Date.now() - Date.parse(job.firstAttemptAt) > 23 * 3600_000) throw new Error("Tentativa antiga: reconciliar no Resend antes de repetir.");
      job.firstAttemptAt ||= new Date().toISOString();
      job.status = "processing";
      await save();
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST", headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": job.key },
          body: JSON.stringify(job.payload), signal: AbortSignal.timeout(15000),
        });
        const data = await response.json();
        if (!response.ok || typeof data.id !== "string" || !data.id) throw new Error(data.message || `Resend: HTTP ${response.status}, sem confirmação.`);
        job.id = data.id;
        job.status = "scheduled";
        job.error = null;
        await save();
      } catch (error) {
        job.error = error.message;
        await save();
        throw error;
      }
      if ((index + 1) % 10 === 0) console.log(`${index + 1}/${campaign.jobs.length} aceites para agendamento.`);
      await new Promise(resolve => setTimeout(resolve, 650));
    }
  }
  console.log(JSON.stringify({ file, scheduledAt: campaign.scheduledAt, lisbon: REMINDER_DATE, emails: campaign.jobs.length, people: campaign.people, withoutEmail: campaign.withoutEmail, accepted: campaign.jobs.filter(job => job.id).length, pending: campaign.jobs.filter(job => !job.id).length }, null, 2));
} finally {
  await lock.close();
  await unlink(`${file}.lock`);
}
