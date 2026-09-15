import { loadEnv } from "vite";
import { readFile } from "node:fs/promises";
const env = { ...loadEnv("development", process.cwd(), ""), ...process.env };
const clean = value => String(value || "").trim().replace(/^['"]|['"]$/g, "");
const key = clean(env.RESEND_MANAGEMENT_API_KEY);
if (!key) throw new Error("Falta RESEND_MANAGEMENT_API_KEY.");
const campaign = JSON.parse(await readFile(".email-campaigns.local/reminder-2026-09-19.json", "utf8"));
const ids = new Set(campaign.jobs.map(job => job.id));
const found = [];
let after;
for (let page = 0; page < 20; page++) {
  const response = await fetch(`https://api.resend.com/emails?limit=100${after ? `&after=${encodeURIComponent(after)}` : ""}`, { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(15000) });
  const data = await response.json();
  if (!response.ok) { console.log(JSON.stringify({ status: response.status, error: data.message })); break; }
  found.push(...data.data);
  if (!data.has_more) break;
  after = data.data.at(-1)?.id;
  if (!after) throw new Error("Paginação inesperada.");
  await new Promise(resolve => setTimeout(resolve, 600));
}
const matching = found.filter(job => ids.has(job.id));
const reminders = found.filter(job => job.subject === campaign.jobs[0].payload.subject);
console.log(JSON.stringify({ listed: found.length, originalIdsFound: matching.length, reminderSubjectsFound: reminders.length, originalStatuses: matching.reduce((counts, job) => ({ ...counts, [job.last_event]: (counts[job.last_event] || 0) + 1 }), {}), reminderDates: [...new Set(reminders.map(job => job.scheduled_at))], sampleSubjects: [...new Set(found.map(job => job.subject))].slice(0, 8), missingOriginalIds: campaign.jobs.filter(job => !found.some(item => item.id === job.id)).slice(0, 3).map(job => job.id) }, null, 2));
const toVerify = campaign.jobs.filter(job => !matching.some(item => item.id === job.id && item.last_event === "canceled"));
for (const job of (toVerify.length ? toVerify : campaign.jobs.slice(0, 2))) {
  await new Promise(resolve => setTimeout(resolve, 650));
  const response = await fetch(`https://api.resend.com/emails/${encodeURIComponent(job.id)}`, { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(15000) });
  const data = await response.json();
  console.log(JSON.stringify({ lookup: job.id, status: response.status, state: data.last_event, scheduledAt: data.scheduled_at, error: data.message }));
}
