import { defineConfig, loadEnv } from "vite";
import process from "node:process";
import { Buffer } from "node:buffer";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function localEmailApi() {
  return {
    name: "local-email-api",
    apply: "serve",
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.envDir, "");
      for (const key of ["GALLERY_ADMIN_PASSWORD", "RESEND_API_KEY", "RESEND_MANAGEMENT_API_KEY", "RESEND_FROM_EMAIL", "RESEND_REPLY_TO", "TABLE_EMAIL_ADMIN_PASSWORD", "ADMIN_PASSWORD", "VITE_ADMIN_PASSWORD", "SUPABASE_URL", "VITE_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]) {
        if (process.env[key] === undefined && env[key] !== undefined) process.env[key] = env[key];
      }
      server.middlewares.use(async (req, res, next) => {
        const path = req.url?.split("?")[0];
        if (!["/api/admin-gallery", "/api/table-email-campaign", "/api/send-table-emails", "/api/reminder-email-campaign"].includes(path)) return next();
        res.status = (code) => { res.statusCode = code; return res; };
        res.json = (data) => { res.setHeader("Content-Type", "application/json; charset=utf-8"); res.end(JSON.stringify(data)); return res; };
        res.setHeader("Cache-Control", "no-store");
        try {
          const chunks = [];
          let size = 0;
          for await (const chunk of req) {
            size += chunk.length;
            if (size > 1024 * 1024) { res.status(413).json({ error: "O pedido é demasiado grande." }); return; }
            chunks.push(chunk);
          }
          req.body = Buffer.concat(chunks).toString("utf8") || undefined;
          const { default: handler } = await server.ssrLoadModule(path === "/api/admin-gallery" ? "/api/admin-gallery.js" : path === "/api/reminder-email-campaign" ? "/api/reminder-email-campaign.js" : "/api/table-email-campaign.js");
          await handler(req, res);
        } catch {
          if (!res.writableEnded) res.status(500).json({ error: "Não foi possível executar o serviço local de emails. Verifica o terminal do Vite." });
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), localEmailApi()],
});
