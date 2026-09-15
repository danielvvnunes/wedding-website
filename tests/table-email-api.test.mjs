import test from "node:test";
import assert from "node:assert/strict";
import { readTableEmailResponse } from "../src/lib/tableEmailApi.js";

const read = (body, status = 200) => readTableEmailResponse(new Response(JSON.stringify(body), { status }), { expectJobs: true });

test("HTTP 200 HTML fallback is rejected rather than becoming undefined jobs", async () => {
  await assert.rejects(readTableEmailResponse(new Response("<!doctype html><html></html>"), { expectJobs: true }), /não está disponível/);
});

test("missing, null, malformed jobs and invalid dates are rejected before rendering", async () => {
  for (const body of [null, [], {}, { jobs: null }, { jobs: {} }, { jobs: [null] },
    { jobs: [{ id: "1", email: "ana@example.com", status: "scheduled", scheduled_at: "invalid" }] },
    { jobs: [{ id: "1", email: "ana@example.com", status: "scheduled", scheduled_at: "2026-09-26T13:30Z", error: {} }] },
  ]) await assert.rejects(read(body));
});

test("configuration failures preserve the server message", async () => {
  await assert.rejects(read({ error: "Falta configurar o serviço." }, 503), /Falta configurar o serviço/);
  await assert.rejects(read({ error: "Serviço indisponível" }), /Serviço indisponível/);
});

test("valid empty and populated lists still load", async () => {
  assert.deepEqual(await read({ jobs: [] }), { jobs: [] });
  const data = { jobs: [{ id: "1", email: "ana@example.com", status: "scheduled", scheduled_at: "2026-09-26T13:30Z", error: null }] };
  assert.deepEqual(await read(data), data);
});

test("action responses are not required to contain a jobs list", async () => {
  assert.deepEqual(await readTableEmailResponse(new Response('{"ok":true}')), { ok: true });
});
