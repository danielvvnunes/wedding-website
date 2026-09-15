import { createHash } from "node:crypto";
import { isValidEmail, normalizeEmail } from "../../src/lib/tableEmails.js";

export function buildReminderImport(campaign) {
  if (campaign?.kind !== "wedding_reminder" || !Array.isArray(campaign.jobs) || !campaign.jobs.length || !Number.isFinite(Date.parse(campaign.scheduledAt))) throw new Error("Registo de lembrete inválido.");
  const ids = new Set(), emails = new Set();
  const campaignId = `imported-reminder-${createHash("sha256").update(JSON.stringify([campaign.scheduledAt, campaign.jobs.map(job => job.id).sort()])).digest("hex")}`;
  return campaign.jobs.map(job => {
    const payload = job.payload;
    const email = payload?.to?.[0];
    if (typeof job.id !== "string" || !job.id || ids.has(job.id) || job.status !== "scheduled"
      || !Array.isArray(payload?.to) || payload.to.length !== 1 || !isValidEmail(email) || normalizeEmail(email) !== email || emails.has(email)
      || payload.scheduled_at !== campaign.scheduledAt || !payload.tags?.some(tag => tag.name === "kind" && tag.value === "wedding_reminder")
      || ![payload.subject, payload.html, payload.text].every(value => typeof value === "string" && value.length > 0)
      || !Number.isFinite(Date.parse(job.firstAttemptAt))) throw new Error("Registo incompleto ou duplicado; a importação foi interrompida sem enviar emails.");
    ids.add(job.id); emails.add(email);
    return {
      campaign_id: campaignId, kind: "wedding_reminder", email, payload,
      scheduled_at: campaign.scheduledAt, status: "scheduled", resend_id: job.id,
      first_attempt_at: job.firstAttemptAt, imported: true, last_checked_at: null,
    };
  });
}
