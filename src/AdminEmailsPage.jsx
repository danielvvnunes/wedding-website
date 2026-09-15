import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "./lib/supabase";
import TableEmailPanel from "./TableEmailPanel";
import "./AdminEmailsPage.css";

export default function AdminEmailsPage() {
  const [authenticated, setAuthenticated] = useState(() => {
    try { return sessionStorage.getItem("admin-authenticated") === "true"; }
    catch { return false; }
  });
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [campaignKind, setCampaignKind] = useState("wedding_reminder");

  const loadResponses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows = [];
      for (let start = 0; ; start += 1000) {
        const { data, error: queryError } = await supabase.from("rsvp").select("id,people")
          .order("id").range(start, start + 999);
        if (queryError) throw new Error("Não foi possível carregar os convidados. Tenta novamente.");
        rows.push(...data);
        if (data.length < 1000) break;
      }
      setResponses(rows);
    } catch (cause) {
      setError(cause.message);
      throw cause;
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    const timer = window.setTimeout(() => { loadResponses().catch(() => {}); }, 0);
    return () => window.clearTimeout(timer);
  }, [authenticated, loadResponses]);

  function login(event) {
    event.preventDefault();
    const expected = import.meta.env.VITE_ADMIN_PASSWORD;
    if (!expected || password !== expected) { setLoginError("Password incorreta."); return; }
    try { sessionStorage.setItem("admin-authenticated", "true"); } catch { /* Keep this session in memory. */ }
    setAuthenticated(true);
  }

  return <main className="admin-emails min-h-screen bg-[#fbfaf5] px-4 py-8 text-[#64715f] sm:px-6">
    <div className="mx-auto max-w-5xl">
      <Link to="/admin" className="text-sm font-semibold text-[#8f9f8a]">← Voltar ao admin</Link>
      <header className="mb-7 mt-7">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b7975b]">Francisca & Daniel · Painel privado</p>
        <h1 className="mt-3 text-3xl font-extrabold text-[#8f9f8a] sm:text-4xl">Emails dos convidados</h1>
        <p className="mt-3 text-sm leading-6">Consulta o lembrete e prepara os emails das mesas.</p>
      </header>
      {!authenticated ? <form onSubmit={login} className="max-w-md rounded-2xl border border-[#b7c4b0]/40 bg-white p-6">
        <h2 className="text-xl font-bold">Entrar na gestão de emails</h2>
        <label className="mt-5 block text-sm">Password do admin<input className="admin-field mt-2" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        <button type="submit" className="mt-4 rounded-full border border-[#cdb892] px-5 py-3 text-sm font-bold">Entrar</button>
        {loginError && <p role="alert" className="mt-3 text-sm text-[#b76f6f]">{loginError}</p>}
      </form> : <>
        <div className="mb-5 flex flex-wrap gap-3" role="group" aria-label="Campanha de emails">
          {[["wedding_reminder", "Lembrete"], ["table_assignment", "Mesas"]].map(([kind, label]) => <button type="button" key={kind} aria-pressed={campaignKind === kind} onClick={() => setCampaignKind(kind)} className={`rounded-full border px-5 py-2 text-sm font-bold ${campaignKind === kind ? "border-[#8f9f8a] bg-[#8f9f8a] text-white" : "border-[#cdb892] text-[#64715f]"}`}>{label}</button>)}
        </div>
        {error && <p role="alert" className="mb-4 rounded-xl bg-[#f8f5ee] p-4 text-sm">{error} <button type="button" className="underline" onClick={() => loadResponses().catch(() => {})}>Tentar novamente</button></p>}
        {loading && <p role="status" className="mb-4 text-sm">A carregar convidados…</p>}
        <TableEmailPanel key={campaignKind} kind={campaignKind} responses={responses} password={password || import.meta.env.VITE_ADMIN_PASSWORD} onSaved={loadResponses} loading={loading || !!error} />
      </>}
    </div>
  </main>;
}
