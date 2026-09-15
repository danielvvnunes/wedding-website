import { loadEnv } from "vite";
import { createClient } from "@supabase/supabase-js";
import { mkdir, readFile, writeFile, open, unlink } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import { createHash } from "node:crypto";
import { renderReminderEmail } from "../src/lib/reminderEmail.js";
import { lisbonDateToISO, validateSchedule } from "../src/lib/tableEmails.js";
import handler from "../api/reminder-email-campaign.js";

const mode = process.argv[2] || "--prepare";
if (!["--prepare", "--schedule", "--verify"].includes(mode)) throw new Error("Modo inválido.");
const env = loadEnv("development", process.cwd(), "");
for (const [key, value] of Object.entries(env)) if (process.env[key] === undefined) process.env[key] = value;
const recipients = ["maildodani@gmail.com", "danielvvnunes@gmail.com", "franciscab97@gmail.com"].sort();
const scheduledAt = lisbonDateToISO("2026-09-15T19:04");
const campaignId = "private-reminder-2026-09-15-1904";
const file = ".email-campaigns.local/private-reminder-2026-09-15.json";
await mkdir(".email-campaigns.local", { recursive: true, mode: 0o700 });
const lock = await open(`${file}.lock`, "wx", 0o600);
try {
  let snapshot;
  try { snapshot = JSON.parse(await readFile(file, "utf8")); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  if (mode === "--prepare" && !snapshot) {
    validateSchedule(scheduledAt);
    if (!env.RESEND_FROM_EMAIL) throw new Error("Falta o remetente.");
    const content = renderReminderEmail({ people: [] }, { oneWeekAway: false });
    snapshot = { campaignId, scheduledAt, jobs: recipients.map(email => ({
      kind: "wedding_reminder", campaign_id: campaignId, email, scheduled_at: scheduledAt,
      payload: { from: env.RESEND_FROM_EMAIL, to: [email], ...content, reply_to: env.RESEND_REPLY_TO || "casamento.franciscadaniel@gmail.com", scheduled_at: scheduledAt, tags: [{ name: "kind", value: "wedding_reminder" }] },
    })) };
    snapshot.digest = createHash("sha256").update(JSON.stringify(snapshot.jobs)).digest("hex");
    await writeFile(file, JSON.stringify(snapshot, null, 2), { mode: 0o600, flag: "wx" });
    await writeFile(".email-campaigns.local/private-reminder-preview.html", content.html, { mode: 0o600 });
  }
  if (!snapshot || snapshot.campaignId !== campaignId || snapshot.scheduledAt !== scheduledAt
    || snapshot.digest !== createHash("sha256").update(JSON.stringify(snapshot.jobs)).digest("hex")
    || !isDeepStrictEqual(snapshot.jobs.map(job => job.email).sort(), recipients)
    || snapshot.jobs.some(job => job.kind !== "wedding_reminder" || job.campaign_id !== campaignId || job.scheduled_at !== scheduledAt || job.payload.scheduled_at !== scheduledAt || !isDeepStrictEqual(job.payload.to, [job.email]) || job.payload.cc || job.payload.bcc)) throw new Error("A lista ou data não corresponde ao envio autorizado.");
  if (mode !== "--prepare") {
    const origin = new URL(env.SUPABASE_URL || env.VITE_SUPABASE_URL).origin;
    const fetchOriginal = globalThis.fetch;
    const providerIds = new Set();
    globalThis.fetch = async (input, init) => {
      const req = new Request(input, init), url = new URL(req.url);
      if (url.origin === origin && url.pathname === "/rest/v1/table_email_jobs" && ["GET", "POST", "PATCH"].includes(req.method)) return fetchOriginal(req);
      if (url.origin === "https://api.resend.com") {
        if (req.method === "GET" && providerIds.has(url.pathname.slice("/emails/".length)) && url.pathname.startsWith("/emails/")) return fetchOriginal(req);
        if (mode === "--schedule" && req.method === "POST" && url.pathname === "/emails") {
          const body = await req.clone().json();
          if (snapshot.jobs.some(job => isDeepStrictEqual(job.payload, body))) return fetchOriginal(req);
        }
      }
      throw new Error("Pedido bloqueado: só estão autorizados os três destinatários e a data indicada.");
    };
    const db = createClient(origin, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    const readJobs = async () => {
      const { data, error } = await db.from("table_email_jobs").select("*").eq("kind", "wedding_reminder").eq("campaign_id", campaignId);
      if (error) throw new Error(error.message);
      return data;
    };
    let jobs = await readJobs();
    if (mode === "--schedule" && !jobs.length) {
      validateSchedule(scheduledAt);
      const { error } = await db.from("table_email_jobs").insert(snapshot.jobs);
      if (error) throw new Error(error.message);
      jobs = await readJobs();
    }
    if (jobs.length !== 3 || !isDeepStrictEqual(jobs.map(job => job.email).sort(), recipients)) throw new Error("A campanha central não tem exatamente os três emails autorizados.");
    for (const job of jobs) {
      if (!isDeepStrictEqual(job.payload, snapshot.jobs.find(item => item.email === job.email).payload)) throw new Error("O conteúdo central foi alterado.");
      if (mode === "--schedule") {
        if (job.status === "canceled") throw new Error("Este envio foi cancelado; não será reagendado.");
        const res = { statusCode: 200, setHeader() {}, status(code) { this.statusCode = code; return this; }, json(data) { this.data = data; return this; } };
        await handler({ method: "POST", headers: { "x-admin-password": env.TABLE_EMAIL_ADMIN_PASSWORD || env.ADMIN_PASSWORD || env.VITE_ADMIN_PASSWORD }, body: { action: "process", id: job.id } }, res);
        if (res.statusCode !== 200) throw new Error(res.data?.error || "Falha no agendamento.");
        console.log(`Agendamento aceite: ${job.email}`);
      } else {
        if (!job.resend_id) throw new Error("Falta confirmação de um agendamento.");
        providerIds.add(job.resend_id);
        const response = await fetch(`https://api.resend.com/emails/${job.resend_id}`, { headers: { Authorization: `Bearer ${env.RESEND_MANAGEMENT_API_KEY}` }, signal: AbortSignal.timeout(15000) });
        const data = await response.json();
        if (!response.ok || data.last_event !== "scheduled" || Date.parse(data.scheduled_at) !== Date.parse(scheduledAt) || !isDeepStrictEqual(data.to, [job.email])) throw new Error(`Não foi possível confirmar o agendamento de ${job.email}: ${data.message || data.last_event}`);
        console.log(`Confirmado no Resend: ${job.email} — ${data.last_event}`);
      }
      await new Promise(resolve => setTimeout(resolve, 700));
    }
  }
  console.log(JSON.stringify({ mode, recipients, scheduledAt, lisbon: "15/09/2026 19:04", subject: snapshot.jobs[0].payload.subject }, null, 2));
} finally { await lock.close(); await unlink(`${file}.lock`); }
