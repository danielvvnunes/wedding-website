import { randomUUID, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { isValidEmail, renderTableEmail, validateSchedule } from "../src/lib/tableEmails.js";
import { renderReminderEmail } from "../src/lib/reminderEmail.js";

const clean = (value) => String(value || "").trim().replace(/^['"]|['"]$/g, "");
const fail = (message, status = 400) => Object.assign(new Error(message), { status });

function authorize(req) {
  const expected = clean(process.env.TABLE_EMAIL_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD);
  const supplied = String(req.headers["x-admin-password"] || "");
  if (!expected) throw fail("Falta configurar a password de administração dos emails.", 503);
  const a = Buffer.from(expected), b = Buffer.from(supplied);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw fail("Password inválida.", 401);
}

function database() {
  const url = clean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
  const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!url || !key) throw fail("Para ativar o agendamento, configura SUPABASE_SERVICE_ROLE_KEY no servidor e aplica supabase/table_email_jobs.sql.", 503);
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function check(query) {
  const { data, error } = await query;
  if (error) throw fail(error.code === "42P01" || error.code === "PGRST205"
    ? "Falta aplicar supabase/table_email_jobs.sql na base de dados."
    : error.code === "23505" ? "Já existem emails preparados para estes endereços. Cancela os pendentes antes de preparar outra versão."
      : error.message, 409);
  return data;
}

async function resend(path, { method = "GET", body, key } = {}) {
  const apiKey = method === "GET" || path.endsWith("/cancel")
    ? process.env.RESEND_MANAGEMENT_API_KEY || process.env.RESEND_API_KEY
    : process.env.RESEND_API_KEY;
  if (!apiKey) throw fail("Falta configurar a chave do Resend no servidor.", 503);
  const response = await fetch(`https://api.resend.com${path}`, {
    method,
    headers: { Authorization: `Bearer ${clean(apiKey)}`, "Content-Type": "application/json", ...(key ? { "Idempotency-Key": key } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(12000),
  });
  const result = await response.json();
  if (!response.ok) throw fail(/restricted to only send/i.test(result.message || "")
    ? "A chave atual do Resend só permite enviar. Para consultar ou cancelar pelo painel, configura RESEND_MANAGEMENT_API_KEY com acesso completo no servidor. Este pedido não foi executado."
    : result.message || "Não foi possível contactar o serviço de emails.", response.status);
  return result;
}

function mailPayload(recipient, scheduledAt, kind = "table_assignment") {
  const from = clean(process.env.RESEND_FROM_EMAIL);
  if (!from) throw fail("Falta configurar RESEND_FROM_EMAIL.", 503);
  return {
    from, to: [recipient.email], ...(kind === "wedding_reminder" ? renderReminderEmail(recipient) : renderTableEmail(recipient)),
    reply_to: clean(process.env.RESEND_REPLY_TO) || "casamento.franciscadaniel@gmail.com",
    tags: [{ name: "kind", value: kind }],
    ...(scheduledAt ? { scheduled_at: scheduledAt } : {}),
  };
}

export function createCampaignHandler(kind) {
  if (!["table_assignment", "wedding_reminder"].includes(kind)) throw new Error("Tipo de campanha inválido.");
  return async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Método não permitido." });
  }
  try {
    authorize(req);
    let body = {};
    try { body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {}; }
    catch { throw fail("JSON inválido."); }
    // A preview test needs only Resend, not the production scheduling outbox.
    if (req.method === "POST" && body.action === "test") {
      if (!isValidEmail(body.testEmail)) throw fail("Indica um email de teste válido.");
      if (!Array.isArray(body.people) || !body.people.length || body.people.length > 100) throw fail("Escolhe pessoas para a pré-visualização.");
      const people = body.people.map((person) => {
        if (!person || typeof person.name !== "string" || !person.name.trim() || person.name.length > 200
          || typeof person.table !== "string" || person.table.length > 100
          || typeof person.tableName !== "string" || person.tableName.length > 200) throw fail("Os dados da pré-visualização são inválidos.");
        return { name: person.name.trim(), table: person.table.trim(), tableName: person.tableName.trim() };
      });
      const payload = mailPayload({ email: body.testEmail.trim().toLowerCase(), people }, undefined, kind);
      const testId = randomUUID();
      payload.subject = `[TESTE ${testId.slice(0, 8)}] ${payload.subject}`;
      const result = await resend("/emails", { method: "POST", body: payload, key: `table-test-${testId}` });
      return res.status(200).json({ id: result.id });
    }
    const db = database();
    if (req.method === "GET") {
      const jobs = await check(db.from("table_email_jobs").select("id,campaign_id,kind,email,scheduled_at,status,resend_id,error,first_attempt_at,imported,last_checked_at").eq("kind", kind).order("created_at"));
      const campaign = await check(db.from("function_email_campaigns").select("id,kind,scheduled_at,status,error,sent_at").eq("kind", kind).maybeSingle());
      return res.status(200).json({ jobs, campaign, managementConfigured: Boolean(clean(process.env.RESEND_MANAGEMENT_API_KEY)) });
    }

    if (body.action === "schedule-function") {
      const scheduledAt = validateSchedule(body.scheduledAt);
      const existing = await check(db.from("function_email_campaigns").select("*").eq("kind", kind).maybeSingle());
      if (existing && !["pending", "canceled"].includes(existing.status)) throw fail("Esta campanha já começou. Não é possível reagendar.", 409);
      const values = { scheduled_at: scheduledAt, status: "pending", error: null };
      if (existing) {
        const changed = await check(db.from("function_email_campaigns").update(values).eq("id", existing.id).in("status", ["pending", "canceled"]).select("id"));
        if (!changed.length) throw fail("O envio já começou.", 409);
      } else await check(db.from("function_email_campaigns").insert({ kind, ...values }));
      return res.status(200).json({ ok: true });
    }
    if (body.action === "cancel-function") {
      const changed = await check(db.from("function_email_campaigns").update({ status: "canceled" }).eq("kind", kind).eq("status", "pending").select("id"));
      if (!changed.length) throw fail("A campanha já começou ou não está pendente.", 409);
      return res.status(200).json({ ok: true });
    }
    if (["prepare", "process"].includes(body.action)) throw fail("O envio passou a ser feito por função, num lote à hora marcada. Atualiza o painel.", 409);

    if (!["process", "cancel", "refresh", "preview"].includes(body.action) || !body.id) throw fail("Ação inválida.");
    const job = await check(db.from("table_email_jobs").select("*").eq("kind", kind).eq("id", body.id).single());
    if (!job) throw fail("Email não encontrado nesta campanha.", 404);
    if (body.action === "preview") {
      const { subject, html, text } = job.payload;
      return res.status(200).json({ email: job.email, subject, html, text });
    }
    if (body.action === "cancel") {
      if (job.status === "canceled") return res.status(200).json({ status: "canceled" });
      if (job.first_attempt_at && !job.resend_id) throw fail("Retoma este envio para confirmar o estado no Resend antes de o cancelar.", 409);
      if (job.resend_id) {
        if (Date.parse(job.scheduled_at) <= Date.now() || !["scheduled", "processing"].includes(job.status)) throw fail("Este email já não pode ser cancelado pelo painel.", 409);
        const current = await resend(`/emails/${job.resend_id}`);
        if (current.last_event !== "canceled") await resend(`/emails/${job.resend_id}/cancel`, { method: "POST" });
        await check(db.from("table_email_jobs").update({ status: "canceled", error: null }).eq("id", job.id));
      } else {
        // Race with scheduling: only cancel an unclaimed job.
        const canceled = await check(db.from("table_email_jobs").update({ status: "canceled", error: null }).eq("id", job.id).is("first_attempt_at", null).select("id"));
        if (!canceled.length) throw fail("O agendamento já começou. Atualiza o estado antes de cancelar.", 409);
      }
      return res.status(200).json({ status: "canceled" });
    }
    if (job.resend_id) {
      const result = await resend(`/emails/${job.resend_id}`);
      const statuses = ["scheduled", "sent", "delivered", "bounced", "failed", "canceled", "delivery_delayed", "complained", "suppressed"];
      if (statuses.includes(result.last_event)) await check(db.from("table_email_jobs").update({ status: result.last_event, last_checked_at: new Date().toISOString() }).eq("id", job.id));
    }
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message || "Erro ao processar os emails." });
  }
  };
}

export default createCampaignHandler("table_assignment");
