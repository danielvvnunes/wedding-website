import test from "node:test";
import assert from "node:assert/strict";
import { collectTableRecipients, lisbonDateToISO, renderTableEmail, validateSchedule } from "../src/lib/tableEmails.js";
import handler from "../api/table-email-campaign.js";
import reminderHandler from "../api/reminder-email-campaign.js";

const rows = [
  { id: "b", people: [{ name: "Ana", email: " FAMILIA@example.com ", table: "1", attending: "yes" }] },
  { id: "a", people: [{ name: "Bruno", email: "familia@example.com", table: "2", attending: "no" }, { name: "Carla", email: "familia@example.com", table: "2" }, { name: "Sem email", email: "" }] },
];

test("one email for three people, including a declined person, retaining different tables", () => {
  const summary = collectTableRecipients(rows);
  assert.equal(summary.recipients.length, 1);
  assert.equal(summary.peopleCount, 3);
  assert.equal(summary.missingEmail.length, 1);
  assert.deepEqual(summary.recipients[0].people.map((person) => person.table), ["2", "2", "1"]);
  assert.deepEqual(summary, collectTableRecipients([...rows].reverse()));
});

test("invalid emails and blank tables remain visible and block preparation", () => {
  const summary = collectTableRecipients([{ id: 1, people: [{ name: " ", email: "bad-email", table: " " }] }]);
  assert.equal(summary.invalidEmail.length, 1);
  assert.equal(summary.missingTable.length, 1);
  assert.equal(summary.missingName.length, 1);
});

test("14:30 Lisbon in September means 13:30 UTC; winter and invalid dates", () => {
  assert.equal(lisbonDateToISO("2026-09-26T14:30"), "2026-09-26T13:30:00.000Z");
  assert.equal(lisbonDateToISO("2026-12-26T14:30"), "2026-12-26T14:30:00.000Z");
  assert.throws(() => lisbonDateToISO("2026-02-30T14:30"));
  assert.throws(() => lisbonDateToISO("2026-03-29T01:30"));
  assert.throws(() => validateSchedule("2026-09-26T13:30Z", Date.parse("2026-09-27")));
  assert.throws(() => validateSchedule("2026-09-26T13:30Z", Date.parse("2026-08-01")));
});

test("HTML and text include every guest and table and escape user content", () => {
  const group = collectTableRecipients(rows).recipients[0];
  const message = renderTableEmail(group);
  for (const person of group.people) {
    assert.ok(message.html.includes(person.name));
    assert.ok(message.text.includes(`${person.name} — Mesa ${person.table}`));
  }
  const unsafe = renderTableEmail({ people: [{ name: '<img src=x onerror="x">', table: "<script>", tableName: "&" }] });
  assert.ok(!unsafe.html.includes("<script>"));
  assert.ok(unsafe.html.includes("&lt;img"));
});

test("test emails use draft people and only the test address without scheduling or database configuration", async (t) => {
  const env = { TABLE_EMAIL_ADMIN_PASSWORD: "test-password", RESEND_API_KEY: "mock-key", RESEND_FROM_EMAIL: "Wedding <test@example.com>", SUPABASE_SERVICE_ROLE_KEY: "" };
  const before = Object.fromEntries(Object.keys(env).map((key) => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  Object.assign(process.env, env);
  t.after(() => {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(before)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  });
  const calls = [];
  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), "https://api.resend.com/emails");
    calls.push(JSON.parse(init.body));
    return new Response(JSON.stringify({ id: "mock-only" }), { headers: { "Content-Type": "application/json" } });
  };
  async function call(body, password = "test-password") {
    const res = { statusCode: 200, setHeader() {}, status(code) { this.statusCode = code; return this; }, json(data) { this.data = data; return this; } };
    await handler({ method: "POST", headers: { "x-admin-password": password }, body: { action: "test", ...body } }, res);
    return res;
  }
  const people = ["Ana", "Bruno", "Carla"].map((name) => ({ name, table: "", tableName: "" }));
  assert.equal((await call({ testEmail: "bad", people })).statusCode, 400);
  assert.equal((await call({ testEmail: "test@example.com", people: [{ name: "" }] })).statusCode, 400);
  assert.equal((await call({ testEmail: "test@example.com", people }, "wrong")).statusCode, 401);
  assert.equal(calls.length, 0);
  assert.equal((await call({ testEmail: " TEST@example.com ", people, scheduledAt: "2026-09-26T13:30:00Z" })).statusCode, 200);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].to, ["test@example.com"]);
  assert.equal(calls[0].scheduled_at, undefined);
  assert.match(calls[0].subject, /^\[TESTE\]/);
  for (const { name } of people) assert.ok(calls[0].html.includes(name));
  assert.ok(calls[0].text.includes("Por atribuir"));
});

test("campaign snapshots, stale previews, resumable delivery, cancellation, and authentication", async (t) => {
  const env = { SUPABASE_URL: "https://db.example.test", SUPABASE_SERVICE_ROLE_KEY: "service-test", TABLE_EMAIL_ADMIN_PASSWORD: "test-password", RESEND_API_KEY: "resend-test", RESEND_FROM_EMAIL: "Wedding <test@example.com>" };
  const before = Object.fromEntries(Object.keys(env).map((key) => [key, process.env[key]]));
  Object.assign(process.env, env);
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; for (const [key, value] of Object.entries(before)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } });
  let jobs = [], id = 0, loseReply = false;
  let currentRows = rows;
  const provider = new Map(), calls = [];
  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    const body = request.method === "GET" ? null : await request.json().catch(() => null);
    calls.push({ host: url.host, path: url.pathname, method: request.method, body });
    const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } });
    if (url.host === "db.example.test") {
      if (url.pathname.endsWith("/rsvp")) return json(currentRows);
      let selected = jobs.filter((job) => [...url.searchParams].every(([key, value]) => {
        if (["select", "order"].includes(key)) return true;
        if (value.startsWith("eq.")) return String(job[key]) === value.slice(3);
        if (value.startsWith("neq.")) return String(job[key]) !== value.slice(4);
        if (value === "is.null") return job[key] == null;
        return true;
      }));
      if (request.method === "POST") {
        const additions = Array.isArray(body) ? body : [body];
        if (additions.some((job) => jobs.some((old) => old.kind === job.kind && old.email === job.email && old.status !== "canceled"))) return json({ code: "23505", message: "duplicate" }, 409);
        jobs.push(...additions.map((job) => ({ id: String(++id), status: "ready", first_attempt_at: null, resend_id: null, ...job })));
        return json(null, 201);
      }
      if (request.method === "PATCH") selected.forEach((job) => Object.assign(job, body));
      if (request.headers.get("Accept")?.includes("vnd.pgrst.object")) return json(selected[0] || null);
      return json(selected);
    }
    assert.equal(url.host, "api.resend.com", "Never contact a real service in tests");
    if (url.pathname === "/emails") {
      const key = request.headers.get("Idempotency-Key");
      if (!provider.has(key)) provider.set(key, { id: `email-${provider.size}`, body });
      else assert.deepEqual(body, provider.get(key).body);
      if (loseReply) { loseReply = false; throw new Error("Network reply lost after acceptance"); }
      return json({ id: provider.get(key).id });
    }
    if (url.pathname.endsWith("/cancel")) return json({ id: "canceled" });
    return json({ last_event: "scheduled" });
  };
  async function call(body, password = "test-password", endpoint = handler, method = "POST") {
    const res = { statusCode: 200, setHeader() {}, status(code) { this.statusCode = code; return this; }, json(data) { this.data = data; return this; } };
    await endpoint({ method, headers: { "x-admin-password": password }, body }, res);
    return res;
  }
  const scheduledAt = new Date(Date.now() + 2 * 86400_000).toISOString();
  const recipients = collectTableRecipients(rows).recipients;
  assert.equal((await call({ action: "prepare", recipients, scheduledAt }, "wrong")).statusCode, 401);
  assert.equal(calls.length, 0);
  assert.equal((await call({ action: "prepare", recipients: [], scheduledAt })).statusCode, 409);
  assert.equal(jobs.length, 0);
  assert.equal((await call({ action: "prepare", recipients, scheduledAt })).statusCode, 200);
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].payload.to.length, 1);
  assert.ok(jobs[0].payload.html.includes("Bruno"));
  assert.equal((await call({ action: "prepare", recipients, scheduledAt })).statusCode, 200);
  assert.equal(jobs.length, 1);
  assert.equal((await call({ action: "prepare", recipients, scheduledAt: new Date(Date.now() + 3 * 86400_000).toISOString() })).statusCode, 409);
  loseReply = true;
  assert.equal((await call({ action: "process", id: jobs[0].id })).statusCode, 500);
  assert.equal(provider.size, 1);
  assert.equal(jobs[0].status, "processing");
  assert.equal((await call({ action: "cancel", id: jobs[0].id })).statusCode, 409);
  assert.equal((await call({ action: "process", id: jobs[0].id })).statusCode, 200);
  assert.equal(provider.size, 1);
  assert.equal(jobs[0].status, "scheduled");
  await call({ action: "process", id: jobs[0].id });
  assert.equal(provider.size, 1);
  assert.equal((await call({ action: "cancel", id: jobs[0].id })).statusCode, 200);
  assert.equal(jobs[0].status, "canceled");
  await call({ action: "prepare", recipients, scheduledAt });
  assert.equal(jobs.length, 2);
  jobs[1].first_attempt_at = new Date(Date.now() - 25 * 3600_000).toISOString();
  jobs[1].status = "processing";
  assert.equal((await call({ action: "process", id: jobs[1].id })).statusCode, 409);
  assert.equal(provider.size, 1);
  // A reminder campaign for the same address is independent of table emails.
  currentRows = rows.map(row => ({ ...row, people: row.people.map(person => ({ ...person, table: "" })) }));
  const reminderRecipients = collectTableRecipients(currentRows).recipients;
  const reminderCall = (body, method) => call(body, "test-password", reminderHandler, method);
  assert.equal((await reminderCall({ action: "prepare", recipients: reminderRecipients, scheduledAt })).statusCode, 200);
  const reminderJob = jobs.find(job => job.kind === "wedding_reminder");
  assert.ok(reminderJob.payload.html.includes("Falta uma semana"));
  assert.ok(!reminderJob.payload.html.includes("Por atribuir"));
  // Simulate importing an existing provider ID: process must not send it again.
  reminderJob.resend_id = "existing-reminder-id";
  reminderJob.imported = true;
  reminderJob.status = "scheduled";
  const providerCalls = () => calls.filter(item => item.host === "api.resend.com").length;
  const beforeImportChecks = providerCalls();
  assert.equal((await reminderCall({ action: "process", id: reminderJob.id })).statusCode, 200);
  const preview = await reminderCall({ action: "preview", id: reminderJob.id });
  assert.equal(preview.data.html, reminderJob.payload.html);
  assert.equal(providerCalls(), beforeImportChecks);
  assert.equal((await call({ action: "preview", id: reminderJob.id })).statusCode, 404);
  assert.equal((await call({ action: "cancel", id: reminderJob.id })).statusCode, 404);
  assert.equal((await reminderCall({ action: "cancel", id: jobs[1].id })).statusCode, 404);
  const reminderList = await reminderCall(undefined, "GET");
  assert.deepEqual(reminderList.data.jobs.map(job => job.kind), ["wedding_reminder"]);
  assert.equal((await reminderCall({ action: "prepare", recipients: reminderRecipients, scheduledAt: new Date(Date.now() + 3 * 86400_000).toISOString() })).statusCode, 409);
  assert.equal((await call({ action: "prepare", recipients: reminderRecipients, scheduledAt })).statusCode, 400);
  assert.equal(providerCalls(), beforeImportChecks);
});
