import { loadEnv } from "vite";
import { readFile, writeFile, rename, open, unlink } from "node:fs/promises";
import { createHash } from "node:crypto";

// One-off local function trigger. No Resend scheduled_at is submitted.
const mode = process.argv[2];
const triggerAt = process.argv[3];
if (!["--prepare", "--run", "--verify"].includes(mode) || !Number.isFinite(Date.parse(triggerAt))) throw new Error("Indica --prepare, --run ou --verify e uma data ISO.");
const env = loadEnv("development", process.cwd(), "");
const target = "maildodani@gmail.com";
const file = `.email-campaigns.local/function-test-${new Date(triggerAt).toISOString().replace(/[:.]/g, "-")}.json`;
const lock = await open(`${file}.lock`, "wx", 0o600);
try {
  let job;
  try { job = JSON.parse(await readFile(file, "utf8")); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  async function save() {
    await writeFile(`${file}.tmp`, JSON.stringify(job, null, 2), { mode: 0o600 });
    await rename(`${file}.tmp`, file);
  }
  if (mode === "--prepare" && !job) {
    if (Date.parse(triggerAt) <= Date.now()) throw new Error("A hora do trigger já passou.");
    const source = JSON.parse(await readFile(".email-campaigns.local/private-reminder-2026-09-15.json", "utf8"));
    const original = source.jobs.find(item => item.email === target)?.payload;
    if (!original) throw new Error("Não foi encontrado o email original para comparação.");
    const payload = { ...original };
    delete payload.scheduled_at;
    const digest = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
    job = { triggerAt, payload, digest, key: `function-test-${triggerAt}-${digest}`, status: "waiting" };
    await save();
  }
  if (!job || job.triggerAt !== triggerAt || JSON.stringify(job.payload.to) !== JSON.stringify([target]) || job.payload.cc || job.payload.bcc || "scheduled_at" in job.payload
    || job.digest !== createHash("sha256").update(JSON.stringify(job.payload)).digest("hex")) throw new Error("Destinatário ou conteúdo fora do âmbito autorizado.");
  async function sendReminderNow() {
    if (job.id) return;
    if (Date.now() < Date.parse(job.triggerAt) || Date.now() - Date.parse(job.triggerAt) > 120000) throw new Error("Fora da janela autorizada do trigger. Não foi enviado nada.");
    if (!env.RESEND_API_KEY) throw new Error("Falta configurar a chave de envio.");
    job.firstAttemptAt ||= new Date().toISOString();
    job.status = "processing";
    await save();
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": job.key },
      body: JSON.stringify(job.payload), signal: AbortSignal.timeout(15000),
    });
    const data = await response.json();
    if (!response.ok || !data.id) {
      job.error = data.message || `HTTP ${response.status}`;
      await save();
      throw new Error(job.error);
    }
    job.id = data.id;
    job.status = "accepted";
    job.acceptedAt = new Date().toISOString();
    await save();
    console.log(JSON.stringify({ recipient: target, triggeredAt: job.firstAttemptAt, acceptedAt: job.acceptedAt, id: job.id, usedResendScheduling: false }));
  }
  if (mode === "--run") {
    console.log(JSON.stringify({ waitingFor: job.triggerAt, recipient: target, function: "sendReminderNow" }));
    while (Date.now() < Date.parse(job.triggerAt)) await new Promise(resolve => setTimeout(resolve, Math.min(10000, Date.parse(job.triggerAt) - Date.now())));
    await sendReminderNow();
  }
  if (mode === "--verify") {
    if (!job.id || !env.RESEND_MANAGEMENT_API_KEY) throw new Error("Falta o identificador ou a chave de consulta.");
    const response = await fetch(`https://api.resend.com/emails/${encodeURIComponent(job.id)}`, { headers: { Authorization: `Bearer ${env.RESEND_MANAGEMENT_API_KEY}` }, signal: AbortSignal.timeout(15000) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    if (JSON.stringify(data.to) !== JSON.stringify([target]) || data.scheduled_at) throw new Error("O resultado não corresponde ao teste autorizado.");
    job.providerStatus = data.last_event;
    job.checkedAt = new Date().toISOString();
    await save();
    console.log(JSON.stringify({ recipient: target, status: data.last_event, scheduledAt: data.scheduled_at, id: job.id }));
  }
  if (mode === "--prepare") console.log(JSON.stringify({ recipient: target, triggerAt, sameContentAsPreviousTest: true, usedResendScheduling: false }));
} finally { await lock.close(); await unlink(`${file}.lock`); }
