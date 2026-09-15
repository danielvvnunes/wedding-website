import { loadEnv } from "vite";
import { createClient } from "@supabase/supabase-js";
import { collectTableRecipients, isValidEmail } from "../src/lib/tableEmails.js";

const env = loadEnv("development", process.cwd(), "");
const db = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const rows = [];
for (let start = 0; ; start += 1000) {
  const { data, error } = await db.from("rsvp").select("id,people").order("id").range(start, start + 999);
  if (error) throw new Error(error.message);
  rows.push(...data);
  if (data.length < 1000) break;
}
const summary = collectTableRecipients(rows);
console.log(JSON.stringify({ validEmails: summary.recipients.filter(g => isValidEmail(g.email)).length, people: summary.peopleCount, withoutEmail: summary.missingEmail.length, invalid: summary.invalidEmail.map(p => ({ name: p.name, email: p.email })), withoutName: summary.missingName.length }, null, 2));
const response = await fetch("https://api.resend.com/emails?limit=100", { headers: { Authorization: `Bearer ${env.RESEND_API_KEY}` } });
const result = await response.json();
console.log(JSON.stringify({ resendReadStatus: response.status, message: result.message, hasMore: result.has_more, recent: result.data?.map(item => ({ id: item.id, subject: item.subject, status: item.last_event, scheduledAt: item.scheduled_at })) }, null, 2));
