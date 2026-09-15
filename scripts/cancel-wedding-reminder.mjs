import { loadEnv } from "vite";
import { readFile, writeFile, rename, open, unlink } from "node:fs/promises";
import handler from "../api/reminder-email-campaign.js";

// Only the original reminder IDs may be read/canceled. Sending is blocked here.
const env = loadEnv("development", process.cwd(), "");
for (const [key, value] of Object.entries(env)) if (process.env[key] === undefined) process.env[key] = value;
const file = ".email-campaigns.local/reminder-2026-09-19.json";
const lock = await open(`${file}.lock`, "wx", 0o600);
try {
  const campaign = JSON.parse(await readFile(file, "utf8"));
  if (campaign.kind !== "wedding_reminder" || !campaign.centralizedAt || !campaign.centralCampaignId) throw new Error("Falta o registo central dos lembretes.");
  const ids = new Set(campaign.jobs.map(job => job.id));
  if (ids.size !== campaign.jobs.length || ids.has(undefined) || ids.has(null)) throw new Error("Identificadores de lembrete inválidos.");
  const originalFetch = globalThis.fetch;
  const origin = new URL(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL).origin;
  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    const parts = url.pathname.split("/");
    const storage = url.origin === origin && url.pathname === "/rest/v1/table_email_jobs" && ["GET", "PATCH"].includes(request.method);
    const provider = url.origin === "https://api.resend.com" && parts[1] === "emails" && ids.has(parts[2])
      && ((request.method === "GET" && parts.length === 3) || (request.method === "POST" && parts.length === 4 && parts[3] === "cancel"));
    if (!storage && !provider) throw new Error("Pedido bloqueado: este script apenas pode consultar e cancelar os lembretes existentes.");
    return originalFetch(request);
  };
  async function call(body) {
    const res = { statusCode: 200, setHeader() {}, status(code) { this.statusCode = code; return this; }, json(data) { this.data = data; return this; } };
    await handler({ method: body ? "POST" : "GET", headers: { "x-admin-password": process.env.TABLE_EMAIL_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD }, body }, res);
    if (res.statusCode !== 200) throw new Error(res.data?.error || `HTTP ${res.statusCode}`);
    return res.data;
  }
  const { jobs } = await call();
  const targets = jobs.filter(job => ids.has(job.resend_id) && job.campaign_id === campaign.centralCampaignId);
  if (targets.length !== ids.size) throw new Error("A lista central não corresponde aos lembretes originais. Nenhuma ação foi executada.");
  let completed = 0;
  for (const job of targets) {
    if (job.status !== "canceled") await call({ action: "cancel", id: job.id });
    completed++;
    if (completed % 10 === 0) console.log(`${completed}/${targets.length} cancelamentos confirmados.`);
    await new Promise(resolve => setTimeout(resolve, 700));
  }
  const final = await call();
  const canceled = final.jobs.filter(job => ids.has(job.resend_id) && job.status === "canceled");
  if (canceled.length !== ids.size) throw new Error("Há lembretes cujo cancelamento ainda não foi confirmado.");
  campaign.cancellationConfirmedAt = new Date().toISOString();
  await writeFile(`${file}.tmp`, JSON.stringify(campaign, null, 2), { mode: 0o600 });
  await rename(`${file}.tmp`, file);
  console.log(JSON.stringify({ canceled: canceled.length, sendRequests: 0, scheduleRequests: 0 }, null, 2));
} finally {
  await lock.close();
  await unlink(`${file}.lock`);
}
