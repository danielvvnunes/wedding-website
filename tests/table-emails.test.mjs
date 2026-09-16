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

test("function schedules require auth, isolate kinds, cancel safely and never call Resend", async (t) => {
  const env = { SUPABASE_URL: "https://db.example.test", SUPABASE_SERVICE_ROLE_KEY: "service-test", TABLE_EMAIL_ADMIN_PASSWORD: "test-password" };
  const before = Object.fromEntries(Object.keys(env).map(key => [key, process.env[key]]));
  Object.assign(process.env, env);
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; for (const [key, value] of Object.entries(before)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } });
  const campaigns = [];
  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init), url = new URL(request.url);
    assert.equal(url.host, "db.example.test", "Scheduling must never contact Resend");
    const body = request.method === "GET" ? null : await request.json();
    const selected = campaigns.filter(c => [...url.searchParams].every(([key, value]) => {
      if (value.startsWith("eq.")) return c[key] === value.slice(3);
      if (value.startsWith("in.")) return value.slice(4,-1).split(",").includes(c[key]);
      return true;
    }));
    if (request.method === "POST") campaigns.push({id: String(campaigns.length), ...body});
    if (request.method === "PATCH") selected.forEach(c => Object.assign(c,body));
    const object = request.headers.get("Accept")?.includes("vnd.pgrst.object");
    return new Response(JSON.stringify(object ? selected[0] || null : selected), {headers:{"Content-Type":"application/json"}});
  };
  async function call(body, endpoint=handler, password="test-password") {
    const res={statusCode:200,setHeader(){},status(code){this.statusCode=code;return this;},json(data){this.data=data;return this;}};
    await endpoint({method:"POST",headers:{"x-admin-password":password},body},res); return res;
  }
  const scheduledAt = new Date(Date.now()+2*86400_000).toISOString();
  assert.equal((await call({action:"schedule-function",scheduledAt},handler,"bad")).statusCode,401);
  assert.equal((await call({action:"prepare",scheduledAt})).statusCode,409);
  assert.equal((await call({action:"process",id:"old"})).statusCode,409);
  assert.equal((await call({action:"schedule-function",scheduledAt})).statusCode,200);
  assert.equal((await call({action:"schedule-function",scheduledAt},reminderHandler)).statusCode,200);
  assert.equal(campaigns.length,2);
  assert.equal((await call({action:"cancel-function"})).statusCode,200);
  assert.equal(campaigns[0].status,"canceled"); assert.equal(campaigns[1].status,"pending");
  campaigns[1].status="processing";
  assert.equal((await call({action:"cancel-function"},reminderHandler)).statusCode,409);
  assert.equal((await call({action:"schedule-function",scheduledAt},reminderHandler)).statusCode,409);
});
