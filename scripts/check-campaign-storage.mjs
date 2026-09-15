import { loadEnv } from "vite";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const env = loadEnv("development", process.cwd(), "");
const headers = { "x-admin-password": env.TABLE_EMAIL_ADMIN_PASSWORD || env.ADMIN_PASSWORD || env.VITE_ADMIN_PASSWORD, "Content-Type": "application/json" };
const local = JSON.parse(await readFile(".email-campaigns.local/reminder-2026-09-19.json", "utf8"));
for (const kind of ["reminder", "table"]) {
  const url = `http://127.0.0.1:5173/api/${kind}-email-campaign`;
  const response = await fetch(url, { headers });
  assert.equal(response.status, 200);
  const { jobs } = await response.json();
  assert.ok(jobs.every(job => job.kind === (kind === "reminder" ? "wedding_reminder" : "table_assignment")));
  if (kind === "reminder") {
    assert.equal(jobs.length, local.jobs.length);
    assert.deepEqual(jobs.map(job => job.resend_id).sort(), local.jobs.map(job => job.id).sort());
    assert.ok(jobs.every(job => job.imported && job.resend_id));
    // Preview only reads the frozen payload from Supabase. No delivery action.
    const previewResponse = await fetch(url, { method: "POST", headers, body: JSON.stringify({ action: "preview", id: jobs[0].id }) });
    assert.equal(previewResponse.status, 200);
    const preview = await previewResponse.json();
    assert.equal(preview.html, local.jobs.find(job => job.id === jobs[0].resend_id).payload.html);
  }
  console.log(`${kind}: ${jobs.length} registos; isolamento e conteúdo verificados.`);
}
