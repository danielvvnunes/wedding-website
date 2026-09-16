import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./lib/supabase";
import { readTableEmailResponse } from "./lib/tableEmailApi";
import { collectTableRecipients, DEFAULT_TABLE_EMAIL_DATE, isValidEmail, lisbonDateToISO, renderTableEmail, validateSchedule } from "./lib/tableEmails";
import { REMINDER_DATE, renderReminderEmail } from "./lib/reminderEmail";

const labels = { ready: "Por agendar", processing: "A confirmar / retomar", scheduled: "Agendado", sent: "Enviado", delivered: "Entregue ao servidor", bounced: "Devolvido", failed: "Falhou", canceled: "Cancelado", delivery_delayed: "Entrega atrasada", complained: "Marcado como spam", suppressed: "Suprimido" };
const buttonClass = "rounded-full border border-[#cdb892] px-4 py-2 text-sm font-bold text-[#8f9f8a] disabled:cursor-not-allowed disabled:opacity-40";
const formatDate = (value) => new Intl.DateTimeFormat("pt-PT", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Lisbon" }).format(new Date(value));

export default function TableEmailPanel({ responses, password, onSaved, loading, kind = "table_assignment" }) {
  const reminder = kind === "wedding_reminder";
  const dateKey = reminder ? "fd-reminder-email-date" : "fd-table-email-date";
  const defaultDate = reminder ? REMINDER_DATE : DEFAULT_TABLE_EMAIL_DATE;
  const [edits, setEdits] = useState({});
  const [scheduledLocal, setScheduledLocal] = useState(() => {
    try { return localStorage.getItem(dateKey) || defaultDate; }
    catch { return defaultDate; }
  });
  const [jobs, setJobs] = useState([]);
  const [campaign, setCampaign] = useState(null);
  const [configured, setConfigured] = useState(false);
  const [managementConfigured, setManagementConfigured] = useState(false);
  const [setupError, setSetupError] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [previewEmail, setPreviewEmail] = useState("");
  const [savedPreview, setSavedPreview] = useState(null);
  const [testEmail, setTestEmail] = useState("");
  const [search, setSearch] = useState("");
  const running = useRef(false);
  const stop = useRef(false);
  const previewDialog = useRef(null);

  const effectiveResponses = useMemo(() => responses.map((response) => ({ ...response, people: edits[response.id]?.people || response.people })), [responses, edits]);
  const summary = useMemo(() => collectTableRecipients(effectiveResponses), [effectiveResponses]);
  const dirty = Object.keys(edits).length > 0;
  const activeJobs = jobs.filter((job) => job.status !== "canceled");
  const locked = campaign && ["processing", "sent"].includes(campaign.status);
  const preview = summary.recipients.find((group) => group.email === previewEmail);
  const previewContent = savedPreview || (preview ? (reminder ? renderReminderEmail(preview) : renderTableEmail(preview)) : null);
  const hasPreview = Boolean(previewContent);
  const blocked = loading || dirty || !configured || !summary.recipients.length || summary.recipients.length > 100;
  const testBlockReason = busy ? "Aguarda a conclusão da operação atual."
    : loading ? "Aguarda o carregamento dos convidados."
      : !testEmail.trim() ? "Indica abaixo o endereço que deve receber o teste."
        : !isValidEmail(testEmail) ? "Corrige o endereço de teste: o formato não é válido."
          : preview?.people.some((person) => !person.name.trim()) ? "Preenche os nomes para testar este email."
            : "";

  const api = useCallback(async (body) => {
    const response = await fetch(reminder ? "/api/reminder-email-campaign" : "/api/table-email-campaign", {
      method: body ? "POST" : "GET",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return readTableEmailResponse(response, { expectJobs: !body });
  }, [password, reminder]);

  const loadJobs = useCallback(async () => {
    try {
      const data = await api();
      setJobs(data.jobs);
      setCampaign(data.campaign || null);
      if (data.campaign) setScheduledLocal(new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Lisbon", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(data.campaign.scheduled_at)).replace(" ", "T"));
      setConfigured(true);
      setManagementConfigured(data.managementConfigured === true);
      setSetupError("");
      return data.jobs;
    } catch (cause) {
      setConfigured(false);
      setSetupError(cause.message);
      throw cause;
    }
  }, [api]);

  useEffect(() => {
    const timer = window.setTimeout(() => { loadJobs().catch(() => {}); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadJobs]);

  useEffect(() => () => { stop.current = true; }, []);

  useEffect(() => {
    if (!hasPreview) return;
    const dialog = previewDialog.current;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [hasPreview]);

  function editGuest(guest, field, value) {
    const response = responses.find((row) => row.id === guest.responseId);
    setEdits((current) => {
      const draft = current[response.id] || { basePeople: response.people, people: response.people };
      return { ...current, [response.id]: { ...draft, people: draft.people.map((person, index) => index === guest.index ? { ...person, [field]: value } : person) } };
    });
  }

  async function run(task) {
    if (running.current) return;
    running.current = true;
    stop.current = false;
    setBusy(true); setError(""); setMessage("");
    try { await task(); }
    catch (cause) { setError(cause.message); }
    finally { running.current = false; setBusy(false); }
  }

  function closePreview() { setPreviewEmail(""); setSavedPreview(null); }

  async function previewJob(job) {
    await run(async () => {
      const content = await api({ action: "preview", id: job.id });
      if (typeof content.html !== "string" || typeof content.subject !== "string" || content.email !== job.email) throw new Error("Não foi possível carregar o conteúdo guardado.");
      setPreviewEmail("");
      setSavedPreview(content);
    });
  }

  async function saveAssignments() {
    await run(async () => {
      for (const [id, draft] of Object.entries(edits)) {
        if (stop.current) break;
        const { data, error: saveError } = await supabase.from("rsvp")
          .update({ people: draft.people }).eq("id", id)
          .eq("people", JSON.stringify(draft.basePeople)).select("id");
        if (saveError) throw new Error(saveError.message);
        if (!data.length) throw new Error("Uma resposta mudou entretanto ou não tens permissão para guardar. Atualiza as respostas e revê esta alteração.");
        setEdits((current) => { const next = { ...current }; delete next[id]; return next; });
      }
      await onSaved();
      setMessage(stop.current ? "Gravação interrompida; as alterações restantes continuam por guardar." : "Nomes, emails e mesas guardados. Podes rever a pré-visualização.");
    });
  }

  async function processJobs(list, action) {
    let completed = 0;
    for (const job of list) {
      if (stop.current) break;
      setMessage(`${action === "process" ? "A agendar" : action === "cancel" ? "A cancelar" : "A atualizar"} ${completed + 1} de ${list.length}…`);
      await api({ action, id: job.id });
      completed++;
      // The cancel endpoint does up to two provider calls per job.
      await new Promise((resolve) => window.setTimeout(resolve, action === "cancel" ? 1200 : 650));
    }
    setMessage(stop.current
      ? "Operação interrompida. O progresso ficou guardado; os emails já agendados mantêm-se ativos."
      : `${completed} email(s) ${action === "process" ? "agendado(s)" : action === "cancel" ? "cancelado(s)" : "atualizado(s)"}.`);
  }

  async function schedule() {
    let scheduledAt;
    try { scheduledAt = validateSchedule(lisbonDateToISO(scheduledLocal)); }
    catch (cause) { setError(cause.message); return; }
    if (!window.confirm(`Agendar ${summary.recipients.length} emails para ${formatDate(scheduledAt)} (Lisboa), abrangendo ${summary.peopleCount} pessoas?`)) return;
    await run(async () => {
      try {
        await api({ action: "schedule-function", scheduledAt });
        setMessage("Envio por função agendado. Os dados dos convidados serão lidos à hora marcada.");
      } finally { await loadJobs(); }
    });
  }

  async function operate(action) {
    if (action === "cancel" && !window.confirm(`Cancelar todos os emails pendentes de ${reminder ? "lembrete" : "mesas"}? Os emails da outra campanha não serão alterados.`)) return;
    if (action === "process" && !window.confirm(`Retomar o agendamento dos emails pendentes de ${reminder ? "lembrete" : "mesas"}?`)) return;
    await run(async () => {
      try {
        const current = await loadJobs();
        const targets = current.filter((job) => action === "process" ? !job.resend_id && job.status !== "canceled"
          : action === "cancel" ? ["ready", "processing", "scheduled"].includes(job.status)
            : !!job.resend_id && job.status !== "canceled");
        await processJobs(targets, action);
      } finally { await loadJobs(); }
    });
  }

  return <section className="mb-8 rounded-[2rem] border border-[#b7c4b0]/35 bg-white/40 p-6 text-[#64715f]">
    <h2 className="text-xl font-extrabold">{reminder ? "Lembrete do casamento" : "Destinatários e mesas"}</h2>
    <p className="mt-2 text-sm">{locked ? `${activeJobs.length} emails na campanha guardada` : `${summary.recipients.length} emails distintos · ${summary.peopleCount} pessoas com email`}</p>
    {reminder && <button type="button" className={`${buttonClass} mt-4`} disabled={busy || (!jobs.length && !summary.recipients.length)} onClick={() => {
      if (!locked && summary.recipients.length) { setSavedPreview(null); setPreviewEmail(summary.recipients[0].email); }
      else if (jobs.length) previewJob(activeJobs[0] || jobs[0]);
    }}>Pré-visualizar lembrete</button>}
    <div className="mt-5 space-y-5">
      <p className="text-sm">{reminder ? "Um lembrete por endereço, com saudação personalizada e ligação para o site." : "Um email por endereço, com os nomes e as mesas de todas as pessoas associadas."} Inclui todas as pessoas com email, independentemente da confirmação de presença.</p>
      {jobs.some(job => job.imported && !job.last_checked_at) && <p className="rounded-xl bg-[#f8f5ee] p-4 text-sm">Os agendamentos existentes foram associados pelos identificadores do Resend, sem reenviar emails. O estado importado regista a aceitação do agendamento; ainda não foi consultado novamente no Resend.</p>}
      {!locked && <div className="rounded-xl bg-[#f8f5ee] p-4 text-sm" role="status">
        <p>{summary.recipients.length > 100 ? "Ultrapassa o limite diário de 100 emails do plano gratuito." : `${Math.max(0, 100 - summary.recipients.length)} emails de margem face ao limite diário de 100 do plano gratuito.`} Os testes e outros envios do mesmo dia também contam; confirma a quota da conta antes de agendar.</p>
        {!reminder && summary.missingTable.length > 0 && <p className="mt-2 font-bold">Preenche todas as mesas antes da hora marcada. Se faltar alguma, o lote não será enviado.</p>}
        <p className="mt-2">{summary.missingEmail.length} pessoas sem email · {summary.invalidEmail.length} emails com formato inválido{!reminder && ` · ${summary.missingTable.length} pessoas sem mesa`} · {summary.missingName.length} sem nome</p>
      </div>}
      {campaign && <div className="rounded-xl bg-[#b7c4b0]/20 p-4 text-sm" role="status">
        <p className="font-bold">Envio por função · {formatDate(campaign.scheduled_at)} · Lisboa</p>
        <p>{campaign.status === "pending" ? "Agendado: um único lote, com os dados dos convidados e mesas existentes à hora do envio." : campaign.status === "sent" ? "Lote enviado." : campaign.status === "canceled" ? "Agendamento cancelado." : "A processar o lote."}</p>
        {campaign.error && <p role="alert">{campaign.error}</p>}
        {campaign.status === "pending" && <button className={`${buttonClass} mt-3`} disabled={busy} onClick={() => { if (window.confirm("Cancelar este envio por função?")) run(async () => { await api({ action: "cancel-function" }); await loadJobs(); }); }}>Cancelar envio por função</button>}
      </div>}
      {setupError && <p className="rounded-xl bg-[#f8f5ee] p-4 text-sm" role="status">{setupError} <button type="button" className="underline" onClick={() => run(loadJobs)}>Verificar configuração</button></p>}
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm font-bold">Data e hora de envio — Lisboa
          <input type="datetime-local" className="admin-field mt-2" value={locked ? new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Lisbon", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(campaign.scheduled_at)).replace(" ", "T") : scheduledLocal} disabled={busy || locked} onChange={(event) => {
            setScheduledLocal(event.target.value);
            try { localStorage.setItem(dateKey, event.target.value); } catch { /* State remains editable when browser storage is unavailable. */ }
          }} />
        </label>
        {!locked && <><button type="button" className={buttonClass} disabled={busy || !dirty || loading} onClick={saveAssignments}>Guardar alterações</button>
        <button type="button" className={buttonClass} disabled={busy || blocked} onClick={schedule}>{campaign?.status === "pending" ? "Atualizar horário" : "Agendar envio por função"}</button></>}
      </div>
      {dirty && <p className="text-sm">Há alterações por guardar. <button type="button" disabled={busy} className="underline" onClick={() => { setEdits({}); setError(""); }}>Descartar alterações locais</button></p>}
      {locked && <p className="text-sm">O envio desta campanha já começou. As pré-visualizações dos emails enviados mostram o conteúdo guardado.</p>}
      {!locked && <>
      <label className="block text-sm">Procurar por nome ou email<input className="admin-field mt-2" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      <div className="max-h-[560px] space-y-3 overflow-y-auto">
        {summary.recipients.filter((group) => `${group.email} ${group.people.map((p) => p.name).join(" ")}`.toLocaleLowerCase("pt-PT").includes(search.toLocaleLowerCase("pt-PT"))).map((group) => <article key={group.email} className="rounded-xl border border-[#b7c4b0]/40 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><p className="break-all font-bold">{group.email} <span className="font-normal">· {group.people.length} pessoa(s)</span></p><button type="button" className={buttonClass} onClick={() => { setError(""); setMessage(""); setPreviewEmail(group.email); }}>Pré-visualizar</button></div>
          {!isValidEmail(group.email) && <p className="mb-2 text-sm text-[#b76f6f]">Corrige o endereço antes de agendar.</p>}
          {group.people.map((guest) => <fieldset key={guest.id} disabled={busy || locked || loading} className="mb-3 grid gap-2 sm:grid-cols-2">
            <label className="text-xs">Nome<input aria-label={`Nome de ${guest.name}`} className="admin-field" value={guest.name} onChange={(event) => editGuest(guest, "name", event.target.value)} /></label>
            <label className="text-xs">Email<input aria-label={`Email de ${guest.name}`} type="email" className="admin-field" defaultValue={guest.email} key={`${guest.id}-${guest.email}`} onBlur={(event) => { if (event.target.value.trim().toLowerCase() !== guest.email) editGuest(guest, "email", event.target.value); }} /></label>
            {!reminder && <><label className="text-xs">Mesa<input aria-label={`Mesa de ${guest.name}`} className="admin-field" value={guest.table} onChange={(event) => editGuest(guest, "table", event.target.value)} /></label>
            <label className="text-xs">Nome da mesa (opcional)<input aria-label={`Nome da mesa de ${guest.name}`} className="admin-field" value={guest.tableName} onChange={(event) => editGuest(guest, "tableName", event.target.value)} /></label></>}
            {guest.attending === "no" && <p className="text-xs">Esta pessoa indicou que não vai, mas está incluída por ter email.</p>}
          </fieldset>)}
        </article>)}
      </div>
      {summary.missingEmail.length > 0 && <details><summary className="cursor-pointer text-sm">Pessoas sem email ({summary.missingEmail.length})</summary>{summary.missingEmail.map((guest) => <label key={guest.id} className="mt-3 block text-sm">{guest.name}<input type="email" disabled={busy || locked} className="admin-field" placeholder="Adicionar email" onBlur={(event) => { if (event.target.value.trim()) editGuest(guest, "email", event.target.value); }} /></label>)}</details>}
      </>}
      {previewContent && <dialog ref={previewDialog} aria-labelledby="table-email-preview-title" onCancel={closePreview} className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl overflow-hidden rounded-2xl border border-[#cdb892] bg-[#fbfaf5] p-0 text-[#64715f] shadow-2xl backdrop:bg-black/45 backdrop:backdrop-blur-sm">
        <div className="flex max-h-[90dvh] flex-col">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#ddd4c0] p-4"><div className="min-w-0"><h3 id="table-email-preview-title" className="font-bold">{reminder ? "Pré-visualização do lembrete" : "Pré-visualização do email"}</h3><p className="mt-1 break-all text-sm">Para: {savedPreview?.email || preview?.email}</p></div><button type="button" className={`${buttonClass} shrink-0`} onClick={closePreview}>Fechar<span className="sr-only"> pré-visualização</span></button></div>
        <div className="min-h-0 overflow-y-auto p-4">
        <p className="my-3 text-sm">Assunto: {previewContent.subject}</p>
        {savedPreview && <p className="mb-3 text-sm">Conteúdo guardado desta mensagem. Esta consulta não envia nem altera emails.</p>}
        <iframe title={reminder ? "Email de lembrete do casamento" : "Pré-visualização do email das mesas"} sandbox="" srcDoc={previewContent.html} className="h-[500px] w-full rounded-xl border-0" />
        {!savedPreview && <><p className="mt-4 text-sm">O teste usa esta pré-visualização, mesmo com alterações por guardar.{!reminder && " Mesas em falta aparecem como ‘Por atribuir’."}</p>
        <div className="mt-3 flex flex-wrap items-end gap-3"><label className="text-sm">Enviar cópia de teste apenas para<input type="email" className="admin-field mt-2" placeholder="O teu email" value={testEmail} onChange={(event) => setTestEmail(event.target.value)} /></label>
          <button type="button" className={buttonClass} disabled={!!testBlockReason} aria-describedby="table-email-test-help" onClick={() => {
            if (window.confirm(`Enviar um email de teste apenas para ${testEmail}?`)) run(async () => { await api({ action: "test", testEmail, people: preview.people.map(({ name, table, tableName }) => ({ name, table, tableName })) }); setMessage(`Teste enviado apenas para ${testEmail}.`); });
          }}>{busy ? "A processar…" : "Enviar teste"}</button></div>
        <p id="table-email-test-help" className="mt-2 text-sm" role="status">{testBlockReason || "Só será enviado para o endereço de teste indicado, após confirmação."}</p>
        </>}
        {message && <p role="status" className="mt-3 rounded-xl bg-[#b7c4b0]/20 p-3 text-sm">{message}</p>}
        {error && <p role="alert" className="mt-3 rounded-xl bg-[#d9a6a6]/20 p-3 text-sm">{error}</p>}
        </div>
        </div>
      </dialog>}
      {jobs.length > 0 && <div className="space-y-3">
        <h3 className="font-bold">Estado dos emails</h3>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={buttonClass} disabled={busy || !configured || !managementConfigured} onClick={() => operate("refresh")}>Atualizar entregas</button>
          <button type="button" className={buttonClass} disabled={busy || !configured || !activeJobs.length || (!managementConfigured && activeJobs.some(job => job.resend_id))} onClick={() => operate("cancel")}>Cancelar pendentes</button>
        </div>
        {!managementConfigured && <p className="text-sm">A consulta de entregas e o cancelamento no Resend precisam de uma chave com acesso de gestão no servidor. Até estar configurada, podes gerir os emails no <a href="https://resend.com/emails" target="_blank" rel="noreferrer" className="underline">painel do Resend</a>. <button type="button" disabled={busy} className="underline" onClick={() => run(loadJobs)}>Verificar configuração</button></p>}
        <div className="max-h-96 overflow-auto text-sm">{jobs.map((job) => <div key={job.id} className="border-b border-[#ddd4c0] py-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="break-all">{job.email} — {labels[job.status] || job.status}</p><button type="button" className={buttonClass} disabled={busy} onClick={() => previewJob(job)}>Ver email guardado</button></div><p>{formatDate(job.scheduled_at)} · Lisboa</p>{job.resend_id && <p className="mt-1 break-all text-xs">Identificador Resend: {job.resend_id}</p>}{job.last_checked_at && <p className="text-xs">Estado consultado: {formatDate(job.last_checked_at)}</p>}{job.error && <p className="text-[#b76f6f]">{job.error}</p>}</div>)}</div>
        <p className="text-xs">“Entregue ao servidor” não confirma leitura nem chegada à caixa principal. Usa “Atualizar entregas” para consultar o estado mais recente.</p>
      </div>}
      {busy && <button type="button" className={buttonClass} onClick={() => { stop.current = true; }}>Parar após o email atual</button>}
      {!hasPreview && message && <p role="status" className="rounded-xl bg-[#b7c4b0]/20 p-3 text-sm">{message}</p>}
      {!hasPreview && error && <p role="alert" className="rounded-xl bg-[#d9a6a6]/20 p-3 text-sm">{error}</p>}
    </div>
  </section>;
}
