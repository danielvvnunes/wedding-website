import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import { renderReminderEmail, REMINDER_DATE, WEDDING_SITE } from "../src/lib/reminderEmail.js";
import { lisbonDateToISO } from "../src/lib/tableEmails.js";
import { buildReminderImport } from "../scripts/lib/reminderImport.mjs";

test("import preserves existing Resend IDs and payloads and rejects incomplete or duplicate records", () => {
  const campaign = { kind: "wedding_reminder", scheduledAt: "2026-09-19T18:04:00.000Z", jobs: [{
    id: "existing-provider-id", status: "scheduled", firstAttemptAt: "2026-09-15T14:00:00.000Z",
    payload: { to: ["guest@example.com"], scheduled_at: "2026-09-19T18:04:00.000Z", tags: [{ name: "kind", value: "wedding_reminder" }], ...renderReminderEmail({ people: [{ name: "Ana" }] }) },
  }] };
  const rows = buildReminderImport(campaign);
  assert.equal(rows[0].resend_id, campaign.jobs[0].id);
  assert.deepEqual(rows[0].payload, campaign.jobs[0].payload);
  assert.equal(rows[0].imported, true);
  assert.equal(rows[0].last_checked_at, null);
  assert.deepEqual(buildReminderImport(campaign), rows);
  assert.throws(() => buildReminderImport({ ...campaign, jobs: [campaign.jobs[0], campaign.jobs[0]] }));
  assert.throws(() => buildReminderImport({ ...campaign, jobs: [{ ...campaign.jobs[0], id: null }] }));
});

test("reminder personalizes names, escapes HTML, links to the site and uses Lisbon time", () => {
  const message = renderReminderEmail({ people: ["Maria", "Tiago", "Tomás"].map(name => ({ name })) });
  assert.ok(message.html.includes("Olá Maria, Tiago e Tomás,"));
  assert.ok(message.text.includes("celebrar convosco"));
  assert.ok(message.html.includes(`href="${WEDDING_SITE}"`));
  const single = renderReminderEmail({ people: [{ name: "<Maria>" }] });
  assert.ok(single.html.includes("&lt;Maria&gt;"));
  assert.ok(single.text.includes("celebrar contigo"));
  assert.equal(lisbonDateToISO(REMINDER_DATE), "2026-09-19T18:04:00.000Z");
});

test("scheduler persists progress, retries the same key and never falls back to immediate sending", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "reminder-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const { mkdir } = await import("node:fs/promises");
  const directory = join(root, ".email-campaigns.local");
  await mkdir(directory);
  const file = join(directory, "reminder-2026-09-19.json");
  const scheduledAt = lisbonDateToISO(REMINDER_DATE);
  const campaign = { kind: "wedding_reminder", scheduledAt, people: 3, withoutEmail: 0, jobs: [1, 2, 3].map(i => {
    const payload = { from: "mock@example.com", to: [`person${i}@example.com`], scheduled_at: scheduledAt, ...renderReminderEmail({ people: [{ name: `Pessoa ${i}` }] }) };
    return { payload, key: `wedding-reminder-${createHash("sha256").update(JSON.stringify(payload)).digest("hex")}`, status: "ready" };
  }) };
  await writeFile(file, JSON.stringify(campaign));
  const preload = join(root, "mock.mjs");
  await writeFile(preload, `import { appendFileSync } from 'node:fs';
Date.now = () => Date.parse('2026-09-15T12:00:00Z');
let count = 0;
globalThis.fetch = async (url, init) => {
  if (url !== 'https://api.resend.com/emails') throw new Error('Unexpected network request');
  appendFileSync('calls.jsonl', JSON.stringify({ key: init.headers['Idempotency-Key'], payload: JSON.parse(init.body) }) + '\\n');
  count++;
  return new Response(JSON.stringify(process.env.FAIL_SECOND && count === 2 ? { message: 'Simulated failure' } : { id: 'mock-' + JSON.parse(init.body).to[0] }), { status: process.env.FAIL_SECOND && count === 2 ? 503 : 200 });
};`);
  const execute = promisify(execFile);
  const script = resolve("scripts/schedule-wedding-reminder.mjs");
  const run = (mode, extra = {}) => execute(process.execPath, ["--import", pathToFileURL(preload).href, script, mode], { cwd: root, env: { ...process.env, RESEND_API_KEY: "mock-only", ...extra } });
  await assert.rejects(run("--schedule", { FAIL_SECOND: "1" }), /Simulated failure/);
  let saved = JSON.parse(await readFile(file, "utf8"));
  assert.equal(saved.jobs.filter(job => job.id).length, 1);
  await run("--schedule");
  saved = JSON.parse(await readFile(file, "utf8"));
  assert.equal(saved.jobs.filter(job => job.id).length, 3);
  await run("--schedule");
  await run("--prepare");
  const calls = (await readFile(join(root, "calls.jsonl"), "utf8")).trim().split("\n").map(JSON.parse);
  assert.equal(calls.length, 4);
  assert.equal(calls[1].key, calls[2].key);
  assert.deepEqual(calls[1].payload, calls[2].payload);
  assert.ok(calls.every(call => call.payload.scheduled_at === scheduledAt && call.payload.to.length === 1));
  saved.jobs[2].id = null;
  saved.jobs[2].payload.scheduled_at = undefined;
  await writeFile(file, JSON.stringify(saved));
  await assert.rejects(run("--schedule"));
  assert.equal((await readFile(join(root, "calls.jsonl"), "utf8")).trim().split("\n").length, 4);
  saved.centralizedAt = "2026-09-15T12:00:00Z";
  await writeFile(file, JSON.stringify(saved));
  await assert.rejects(run("--schedule"), /migrada para o admin/);
});
