import { loadEnv } from "vite";
import { createClient } from "@supabase/supabase-js";
import { readFile, writeFile, rename, open, unlink } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import { buildReminderImport } from "./lib/reminderImport.mjs";

// This tool can only read/write the Supabase outbox. It cannot contact Resend.
const env = { ...loadEnv("development", process.cwd(), ""), ...process.env };
if (!env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Falta a credencial de servidor do Supabase.");
const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const file = ".email-campaigns.local/reminder-2026-09-19.json";
const lock = await open(`${file}.lock`, "wx", 0o600);
try {
  const campaign = JSON.parse(await readFile(file, "utf8"));
  const rows = buildReminderImport(campaign);
  const db = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async (input, init) => {
      const request = new Request(input, init);
      const target = new URL(request.url);
      if (target.origin !== new URL(url).origin || target.pathname !== "/rest/v1/table_email_jobs" || !["GET", "POST"].includes(request.method)) throw new Error("Pedido de rede fora do âmbito da importação.");
      return fetch(request);
    } },
  });
  const matching = async () => {
    const { data, error } = await db.from("table_email_jobs").select("*").in("resend_id", rows.map(row => row.resend_id));
    if (error) throw new Error(error.message);
    for (const saved of data) {
      const original = rows.find(row => row.resend_id === saved.resend_id);
      if (saved.kind !== original.kind || saved.email !== original.email || Date.parse(saved.scheduled_at) !== Date.parse(original.scheduled_at) || !isDeepStrictEqual(saved.payload, original.payload)) throw new Error("Existe um registo incompatível com o mesmo identificador Resend.");
    }
    return data;
  };
  const before = await matching();
  const { error } = await db.from("table_email_jobs").upsert(rows, { onConflict: "resend_id", ignoreDuplicates: true });
  if (error) throw new Error(error.message);
  const saved = await matching();
  if (saved.length !== rows.length) throw new Error("A importação ainda não está completa.");
  campaign.centralizedAt ||= new Date().toISOString();
  campaign.centralCampaignId = rows[0].campaign_id;
  await writeFile(`${file}.tmp`, JSON.stringify(campaign, null, 2), { mode: 0o600 });
  await rename(`${file}.tmp`, file);
  console.log(JSON.stringify({ imported: saved.length, alreadyPresent: before.length, newRecords: saved.length - before.length, resendRequests: 0 }, null, 2));
} finally {
  await lock.close();
  await unlink(`${file}.lock`);
}
