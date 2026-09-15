import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, writeFile } from "node:fs/promises";
import { loadEnv } from "vite";

const env = loadEnv("development", process.cwd(), "");
const ref = new URL(env.VITE_SUPABASE_URL).hostname.split(".")[0];
const linked = (await readFile("supabase/.temp/project-ref", "utf8")).trim();
if (ref !== linked) throw new Error("O projeto ligado não corresponde ao site.");
const { stdout } = await promisify(execFile)("supabase", ["projects", "api-keys", "--project-ref", ref, "--output", "json"], { maxBuffer: 1024 * 1024 });
const keys = JSON.parse(stdout);
const key = keys.find(item => item.name === "service_role")?.api_key;
if (!key) throw new Error("A sessão não devolveu a chave de servidor do projeto.");
const file = ".env.local";
const content = await readFile(file, "utf8");
const line = `SUPABASE_SERVICE_ROLE_KEY=${key}`;
await writeFile(file, /^SUPABASE_SERVICE_ROLE_KEY=.*$/m.test(content)
  ? content.replace(/^SUPABASE_SERVICE_ROLE_KEY=.*$/m, line)
  : `${content.trimEnd()}\n${line}\n`, { mode: 0o600 });
console.log("Credencial de servidor guardada em .env.local, sem a expor ao navegador. Reiniciar o Vite para a carregar.");
