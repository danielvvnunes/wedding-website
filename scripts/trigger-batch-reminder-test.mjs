import { loadEnv } from "vite";
import { readFile, writeFile, rename, open, unlink } from "node:fs/promises";
import { createHash } from "node:crypto";
import { isValidEmail } from "../src/lib/tableEmails.js";

const mode = process.argv[2];
const triggerAt = "2026-09-15T23:37:00.000Z";
const file = ".email-campaigns.local/batch-test-2026-09-16-0037.json";
const fixed = ["maildodani@gmail.com", "franciscab97@gmail.com", "danielvvnunes@gmail.com", "dtnunes@vvmg.pt", "danielfdnunes@gmail.com"];
if (!["--prepare", "--run", "--verify"].includes(mode)) throw new Error("Modo inválido.");
const env = loadEnv("development", process.cwd(), "");
const lock = await open(`${file}.lock`, "wx", 0o600);
try {
  let job;
  try { job = JSON.parse(await readFile(file, "utf8")); } catch (error) { if (error.code !== "ENOENT") throw error; }
  const save = async () => { await writeFile(`${file}.tmp`, JSON.stringify(job, null, 2), { mode: 0o600 }); await rename(`${file}.tmp`, file); };
  if (mode === "--prepare" && !job) {
    const confirmed = process.argv[3];
    if (!isValidEmail(confirmed) || fixed.includes(confirmed)) throw new Error("É necessário confirmar o sexto endereço válido.");
    const source = JSON.parse(await readFile(".email-campaigns.local/private-reminder-2026-09-15.json", "utf8"));
    const original = source.jobs.find(item => item.email === "maildodani@gmail.com").payload;
    const payload = { ...original }; delete payload.scheduled_at;
    const recipients = [...fixed, confirmed];
    const batch = recipients.map(email => ({ ...payload, to: [email] }));
    const digest = createHash("sha256").update(JSON.stringify(batch)).digest("hex");
    job = { triggerAt, recipients, batch, digest, key: `batch-test-20260916-0037-${digest}`, status: "waiting" };
    await save();
  }
  if (!job || job.triggerAt !== triggerAt || job.recipients.length !== 6 || new Set(job.recipients).size !== 6 || !fixed.every(email => job.recipients.includes(email))
    || job.batch.length !== 6 || job.batch.some((item, i) => item.to.length !== 1 || item.to[0] !== job.recipients[i] || !isValidEmail(item.to[0]) || item.cc || item.bcc || "scheduled_at" in item)
    || job.digest !== createHash("sha256").update(JSON.stringify(job.batch)).digest("hex")) throw new Error("Lote inválido.");
  if (mode === "--run" && !job.ids) {
    console.log(JSON.stringify({ waitingFor: triggerAt, recipients: job.recipients }));
    while (Date.now() < Date.parse(triggerAt)) await new Promise(resolve => setTimeout(resolve, Math.min(5000, Date.parse(triggerAt) - Date.now())));
    if (Date.now() - Date.parse(triggerAt) > 15000) throw new Error("A hora marcada passou. Nada foi enviado.");
    job.triggeredAt = new Date().toISOString(); job.status = "processing"; await save();
    const response = await fetch("https://api.resend.com/emails/batch", {
      method: "POST", headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": job.key },
      body: JSON.stringify(job.batch), signal: AbortSignal.timeout(15000),
    });
    const result = await response.json();
    job.response = result; job.httpStatus = response.status; await save();
    if (!response.ok || result.data?.length !== 6 || !result.data.every(item => typeof item.id === "string")) throw new Error(result.message || "Resposta inesperada; confirmar antes de repetir.");
    job.ids = result.data.map(item => item.id); job.status = "accepted"; await save();
    console.log(JSON.stringify({ triggeredAt: job.triggeredAt, accepted: job.ids.length, recipients: job.recipients, usedResendScheduling: false }));
  }
  if (mode === "--verify") {
    if (!job.ids) throw new Error("O lote ainda não foi aceite.");
    for (const [i, id] of job.ids.entries()) {
      const response = await fetch(`https://api.resend.com/emails/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${env.RESEND_MANAGEMENT_API_KEY}` }, signal: AbortSignal.timeout(15000) });
      const data = await response.json();
      if (!response.ok || data.scheduled_at || JSON.stringify(data.to) !== JSON.stringify([job.recipients[i]])) throw new Error(data.message || "Email não corresponde ao lote.");
      console.log(JSON.stringify({ recipient: job.recipients[i], status: data.last_event, scheduledAt: data.scheduled_at }));
      await new Promise(resolve => setTimeout(resolve, 550));
    }
  }
  if (mode === "--prepare") console.log(JSON.stringify({ recipients: job.recipients, triggerAt }));
} finally { await lock.close(); await unlink(`${file}.lock`); }
