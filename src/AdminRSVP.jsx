import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const adminStyles = `
@import url("https://fonts.googleapis.com/css2?family=Urbanist:wght@300;400;500;600;700;800&display=swap");

* {
  font-family: "Urbanist", Arial, Helvetica, sans-serif;
}

@keyframes goldShine {
  0%, 100% {
    background-position: 0% 50%;
    filter: drop-shadow(0 0 2px rgba(205, 184, 146, 0.2));
  }

  50% {
    background-position: 100% 50%;
    filter:
      drop-shadow(0 0 7px rgba(255, 236, 190, 0.5))
      drop-shadow(0 0 18px rgba(205, 184, 146, 0.35));
  }
}

.admin-bg {
  background:
    radial-gradient(circle at 18% 8%, rgba(183,196,176,.22), transparent 28%),
    radial-gradient(circle at 84% 34%, rgba(205,184,146,.13), transparent 26%),
    #fbfaf5;
}

.gold-accent {
  display: inline-block;
  background: linear-gradient(
    105deg,
    #b7975b 0%,
    #cdb892 28%,
    #f4e3bd 48%,
    #cdb892 68%,
    #a9874f 100%
  );
  background-size: 230% 230%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: goldShine 4.8s ease-in-out infinite;
}

.gold-line {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(205, 184, 146, 0.35),
    rgba(244, 227, 189, 0.95),
    rgba(205, 184, 146, 0.35),
    transparent
  );
  background-size: 220% 100%;
  animation: goldShine 5.2s ease-in-out infinite;
}

.admin-field {
  width: 100%;
  border: 1px solid rgba(183, 196, 176, 0.5);
  border-radius: 1.25rem;
  background: rgba(255, 255, 255, 0.48);
  padding: 1rem 1.1rem;
  outline: none;
  color: #7f8f78;
  font-size: 16px;
  transition:
    border-color 220ms ease,
    background 220ms ease,
    box-shadow 220ms ease;
}

.admin-field:focus {
  border-color: #cdb892;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 0 0 4px rgba(205, 184, 146, 0.13);
}
`;

function formatAdminDate(dateValue) {
  if (!dateValue) return "";

  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Lisbon",
  }).format(new Date(dateValue));
}

function formatWeighted(value) {
  if (Number.isInteger(value)) return String(value);

  return value.toLocaleString("pt-PT", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function getAttendingPeople(people = []) {
  return people.filter((person) => person.attending === "yes");
}

function getPersonWeight(person) {
  if (person.attending !== "yes") return 0;

  switch (person.ageGroup) {
    case "child_under_3":
      return 0;
    case "child_under_9":
      return 0.5;
    default:
      return 1;
  }
}

function getPeopleCounts(people = []) {
  const attendingPeople = getAttendingPeople(people);

  return {
    raw: attendingPeople.length,
    weighted: attendingPeople.reduce(
      (total, person) => total + getPersonWeight(person),
      0,
    ),
  };
}

function normalizePersonName(name) {
  return (name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("pt-PT");
}

function getFirstName(name) {
  return normalizePersonName(name).split(/\s+/)[0];
}

function isCoupleResponse(response) {
  const firstNames = (response.people || []).map((person) =>
    getFirstName(person.name),
  );

  return firstNames.includes("daniel") && firstNames.includes("francisca");
}

function getPersonSide(person, response) {
  if (isCoupleResponse(response)) {
    const firstName = getFirstName(person.name);
    if (firstName === "daniel") return "noivo";
    if (firstName === "francisca") return "noiva";
  }

  if (response.side === "noivo") return "noivo";
  if (response.side === "noiva") return "noiva";

  return null;
}

function responseMatchesSideFilter(response, sideFilter) {
  if (sideFilter === "all") return true;

  if (sideFilter === "unassigned") {
    if (isCoupleResponse(response)) return false;
    return response.side !== "noivo" && response.side !== "noiva";
  }

  if (isCoupleResponse(response)) {
    return (response.people || []).some(
      (person) => getPersonSide(person, response) === sideFilter,
    );
  }

  return response.side === sideFilter;
}

function computeAdminStats(responses) {
  const allPeople = responses.flatMap((response) => response.people || []);
  const attendingPeople = getAttendingPeople(allPeople);
  const declinedPeople = allPeople.filter(
    (person) => person.attending === "no",
  );

  const totals = getPeopleCounts(allPeople);
  const noivo = { raw: 0, weighted: 0 };
  const noiva = { raw: 0, weighted: 0 };
  const unassigned = { raw: 0, weighted: 0 };

  responses.forEach((response) => {
    if (isCoupleResponse(response)) {
      getAttendingPeople(response.people || []).forEach((person) => {
        const side = getPersonSide(person, response);
        const weight = getPersonWeight(person);

        if (side === "noivo") {
          noivo.raw += 1;
          noivo.weighted += weight;
        } else if (side === "noiva") {
          noiva.raw += 1;
          noiva.weighted += weight;
        } else {
          unassigned.raw += 1;
          unassigned.weighted += weight;
        }
      });
      return;
    }

    const counts = getPeopleCounts(response.people || []);
    const bucket =
      response.side === "noivo"
        ? noivo
        : response.side === "noiva"
          ? noiva
          : unassigned;

    bucket.raw += counts.raw;
    bucket.weighted += counts.weighted;
  });

  return {
    confirmed: totals.raw,
    weighted: totals.weighted,
    declined: declinedPeople.length,
    adults: attendingPeople.filter((person) => person.ageGroup === "adult")
      .length,
    childrenUnder3: attendingPeople.filter(
      (person) => person.ageGroup === "child_under_3",
    ).length,
    childrenUnder9: attendingPeople.filter(
      (person) => person.ageGroup === "child_under_9",
    ).length,
    noivo,
    noiva,
    unassigned,
  };
}

function formatAgeGroup(ageGroup) {
  switch (ageGroup) {
    case "child_under_3":
      return "Bebé (0–2 anos)";
    case "child_under_9":
      return "Criança (3–9 anos)";
    default:
      return "Adulto";
  }
}

function formatSideLabel(side) {
  switch (side) {
    case "noivo":
      return "Daniel";
    case "noiva":
      return "Francisca";
    default:
      return "Por atribuir";
  }
}

const TEST_TABLE_EMAIL_RECIPIENTS = [
  {
    email: "franciscab97@gmail.com",
    firstName: "Francisca",
    table: "25",
    tableName: "Paris",
  },
  {
    email: "danielvvnunes@gmail.com",
    firstName: "Daniel",
    table: "25",
    tableName: "Paris",
  },
];
const TEST_TABLE_EMAIL_SCHEDULED_AT = "2026-08-15T11:50:00.000Z";
const TABLE_EMAIL_PREVIEW_LIMIT = 6;

export default function AdminRSVP() {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sideFilter, setSideFilter] = useState("all");
  const [deletingIds, setDeletingIds] = useState([]);
  const [updatingIds, setUpdatingIds] = useState([]);
  const [pendingDeleteResponse, setPendingDeleteResponse] = useState(null);
  const [pendingDeletePerson, setPendingDeletePerson] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [updateError, setUpdateError] = useState("");
  const [tableEmailAction, setTableEmailAction] = useState("");
  const [tableEmailError, setTableEmailError] = useState("");
  const [tableEmailResult, setTableEmailResult] = useState("");

  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(
    sessionStorage.getItem("admin-authenticated") === "true",
  );

  const fetchResponses = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("rsvp")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("Erro ao carregar respostas");
    } else {
      setResponses(data ?? []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const timer = window.setTimeout(() => {
      fetchResponses();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isAuthenticated, fetchResponses]);

  useEffect(() => {
    if (!isAuthenticated) return;

    function syncVisiblePage() {
      if (document.visibilityState === "visible") {
        fetchResponses();
      }
    }

    document.addEventListener("visibilitychange", syncVisiblePage);
    window.addEventListener("focus", fetchResponses);

    return () => {
      document.removeEventListener("visibilitychange", syncVisiblePage);
      window.removeEventListener("focus", fetchResponses);
    };
  }, [isAuthenticated, fetchResponses]);

  const stats = useMemo(() => computeAdminStats(responses), [responses]);

  const attendanceData = [
    { name: "Confirmados", value: stats.confirmed },
    { name: "Não vão", value: stats.declined },
  ];

  const COLORS = ["#b7c4b0", "#d9a6a6"];
  const tableEmailPreview = TEST_TABLE_EMAIL_RECIPIENTS.slice(
    0,
    TABLE_EMAIL_PREVIEW_LIMIT,
  );
  const tableEmailHiddenCount =
    TEST_TABLE_EMAIL_RECIPIENTS.length - tableEmailPreview.length;

  const filteredResponses = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase("pt-PT");

    return responses.filter((response) => {
      if (!responseMatchesSideFilter(response, sideFilter)) return false;

      if (!normalizedSearch) return true;

      return (response.people || []).some((person) =>
        (person.name || "")
          .toLocaleLowerCase("pt-PT")
          .includes(normalizedSearch),
      );
    });
  }, [responses, searchTerm, sideFilter]);

  async function updatePersonAgeGroup(responseId, personIndex, ageGroup) {
    const response = responses.find((entry) => entry.id === responseId);
    if (!response) return;

    setUpdateError("");
    setUpdatingIds((currentIds) => [...currentIds, responseId]);

    const people = [...(response.people || [])];
    people[personIndex] = { ...people[personIndex], ageGroup };

    const { data, error } = await supabase
      .from("rsvp")
      .update({ people })
      .eq("id", responseId)
      .select("id");

    if (error) {
      console.error(error);
      setUpdateError("Erro ao atualizar a faixa etária. Tenta novamente.");
    } else if (!data?.length) {
      setUpdateError(
        "A faixa etária não foi guardada. Confirma a policy UPDATE da tabela rsvp no Supabase.",
      );
    } else {
      await fetchResponses();
    }

    setUpdatingIds((currentIds) =>
      currentIds.filter((currentId) => currentId !== responseId),
    );
  }

  async function removePersonFromResponse(responseId, personIndex) {
    const response = responses.find((entry) => entry.id === responseId);
    if (!response) return;

    setDeleteError("");
    setUpdatingIds((currentIds) => [...currentIds, responseId]);

    const people = [...(response.people || [])];
    people.splice(personIndex, 1);

    if (people.length === 0) {
      setUpdatingIds((currentIds) =>
        currentIds.filter((currentId) => currentId !== responseId),
      );
      await deleteResponse(responseId);
      setPendingDeletePerson(null);
      return;
    }

    const attendingCount = people.filter(
      (person) => person.attending === "yes",
    ).length;

    const { data, error } = await supabase
      .from("rsvp")
      .update({
        people,
        attending_count: attendingCount,
        not_attending_count: people.length - attendingCount,
      })
      .eq("id", responseId)
      .select("id");

    if (error) {
      console.error(error);
      setDeleteError("Erro ao remover pessoa. Tenta novamente.");
    } else if (!data?.length) {
      setDeleteError(
        "A pessoa não foi removida na base de dados. Confirma a policy UPDATE da tabela rsvp no Supabase.",
      );
    } else {
      await fetchResponses();
      setPendingDeletePerson(null);
    }

    setUpdatingIds((currentIds) =>
      currentIds.filter((currentId) => currentId !== responseId),
    );
  }

  async function updateResponseSide(responseId, side) {
    setUpdateError("");
    setUpdatingIds((currentIds) => [...currentIds, responseId]);

    const { data, error } = await supabase
      .from("rsvp")
      .update({ side: side || null })
      .eq("id", responseId)
      .select("id");

    if (error) {
      console.error(error);
      setUpdateError(
        error.message?.includes("side")
          ? "Falta a coluna side na tabela rsvp. Corre o SQL em supabase/add_rsvp_side.sql."
          : "Erro ao atualizar a atribuição. Tenta novamente.",
      );
    } else if (!data?.length) {
      setUpdateError(
        "A atribuição não foi guardada. Confirma a policy UPDATE da tabela rsvp no Supabase.",
      );
    } else {
      await fetchResponses();
    }

    setUpdatingIds((currentIds) =>
      currentIds.filter((currentId) => currentId !== responseId),
    );
  }

  async function deleteResponse(responseId) {
    setDeleteError("");
    setDeletingIds((currentIds) => [...currentIds, responseId]);

    const { data, error } = await supabase
      .from("rsvp")
      .delete()
      .eq("id", responseId)
      .select("id");

    if (error) {
      console.error(error);
      setDeleteError("Erro ao apagar resposta. Tenta novamente.");
    } else if (!data?.length) {
      setDeleteError(
        "A resposta não foi apagada na base de dados. Confirma a policy DELETE da tabela rsvp no Supabase.",
      );
    } else {
      await fetchResponses();
      setPendingDeleteResponse(null);
    }

    setDeletingIds((currentIds) =>
      currentIds.filter((currentId) => currentId !== responseId),
    );
  }

  function exportCSV() {
    const rows = responses.flatMap((response) =>
      (response.people || []).map((person) => ({
        Nome: person.name ?? "",
        Email: person.email ?? "",
        Contacto: person.phone ?? "",
        Presenca: person.attending === "yes" ? "Sim" : "Não",
        Tipo: person.ageGroup ?? "",
        RestricoesAlimentares: person.dietary ?? "",
        NotasGerais: response.notes ?? "",
        Atribuicao: formatSideLabel(getPersonSide(person, response)),
        Data: formatAdminDate(response.created_at),
      })),
    );

    const headers = Object.keys(
      rows[0] ?? {
        Nome: "",
        Email: "",
        Contacto: "",
        Presenca: "",
        Tipo: "",
        RestricoesAlimentares: "",
        NotasGerais: "",
        Atribuicao: "",
        Data: "",
      },
    );

    const csv = [
      headers.join(";"),
      ...rows.map((row) =>
        headers
          .map((header) => `"${String(row[header]).replaceAll('"', '""')}"`)
          .join(";"),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "rsvp-francisca-daniel.csv";
    a.click();

    URL.revokeObjectURL(url);
  }

  function handleLogin(e) {
    e.preventDefault();

    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("admin-authenticated", "true");
      setIsAuthenticated(true);
    } else {
      alert("Password incorreta");
    }
  }

  async function sendTableEmails({ scheduledAt = "" } = {}) {
    setTableEmailError("");
    setTableEmailResult("");

    const actionLabel = scheduledAt ? "agendar" : "enviar agora";
    const confirmMessage = scheduledAt
      ? `Confirmas que queres agendar ${TEST_TABLE_EMAIL_RECIPIENTS.length} email(s) para hoje às 12:50?`
      : `Confirmas que queres enviar agora ${TEST_TABLE_EMAIL_RECIPIENTS.length} email(s)?`;
    const confirmed = window.confirm(
      `${confirmMessage}\n\nEsta ação vai chamar o Resend.`,
    );

    if (!confirmed) return;

    setTableEmailAction(actionLabel);

    try {
      const response = await fetch("/api/send-table-emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password || ADMIN_PASSWORD,
        },
        body: JSON.stringify({
          recipients: TEST_TABLE_EMAIL_RECIPIENTS,
          ...(scheduledAt ? { scheduledAt } : {}),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível enviar os emails.");
      }

      setTableEmailResult(
        data.scheduledAt
          ? `${data.sent} email(s) agendados para hoje às 12:50.`
          : `${data.sent} email(s) enviados em ${data.batches} lote(s).`,
      );
    } catch (error) {
      console.error(error);
      setTableEmailError(error.message || "Não foi possível enviar os emails.");
    } finally {
      setTableEmailAction("");
    }
  }

  if (!isAuthenticated) {
    return (
      <main className="admin-bg flex min-h-screen items-center justify-center px-5 text-[#7f8f78]">
        <style>{adminStyles}</style>

        <form
          onSubmit={handleLogin}
          className="w-full max-w-md rounded-[2rem] border border-[#b7c4b0]/35 bg-white/45 p-8 text-center shadow-[0_20px_60px_rgba(143,159,138,0.16)] backdrop-blur"
        >
          <p className="gold-accent text-xs font-bold uppercase tracking-[0.45em]">
            Painel privado
          </p>

          <div className="gold-line mx-auto mt-6 max-w-[160px]" />

          <h1 className="mt-8 text-5xl font-extrabold leading-[0.9] tracking-[-0.06em] text-[#b7c4b0]">
            Acesso RSVP
          </h1>

          <p className="mt-6 text-sm leading-6 text-[#8f9f8a]">
            Introduz a password para consultar as respostas ao convite.
          </p>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="admin-field mt-8"
          />

          <button
            type="submit"
            className="mt-5 w-full cursor-pointer rounded-full border border-[#cdb892] px-8 py-4 text-xs font-bold uppercase tracking-[0.3em] text-[#cdb892] transition-all duration-300 hover:-translate-y-[2px] hover:bg-[#cdb892] hover:text-white hover:shadow-[0_8px_30px_rgba(205,184,146,0.35)]"
          >
            Entrar
          </button>
        </form>
      </main>
    );
  }

  return (
    <>
      <main className="admin-bg min-h-screen px-5 py-10 text-[#7f8f78]">
        <style>{adminStyles}</style>

        <div className="mx-auto max-w-6xl">
          <header className="mb-12 text-center">
            <p className="gold-accent text-xs font-bold uppercase tracking-[0.45em]">
              Painel privado
            </p>

            <div className="gold-line mx-auto mt-6 max-w-[180px]" />

            <h1 className="mt-8 text-6xl font-extrabold leading-[0.9] tracking-[-0.07em] text-[#b7c4b0] md:text-7xl">
              RSVP
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-lg font-light leading-8 text-[#8f9f8a]">
              Respostas ao convite de Francisca & Daniel
            </p>
          </header>

          <div className="mb-8 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Confirmados" value={stats.confirmed} />
            <StatCard
              label="Confirmados (pond.)"
              value={formatWeighted(stats.weighted)}
            />
            <StatCard label="Não vão" value={stats.declined} />
            <StatCard label="Adultos" value={stats.adults} />
            <StatCard label="Crianças ≤3" value={stats.childrenUnder3} />
            <StatCard label="Crianças ≤9" value={stats.childrenUnder9} />
          </div>

          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <SideStatCard
              label="Daniel"
              raw={stats.noivo.raw}
              weighted={stats.noivo.weighted}
            />
            <SideStatCard
              label="Francisca"
              raw={stats.noiva.raw}
              weighted={stats.noiva.weighted}
            />
            <SideStatCard
              label="Por atribuir"
              raw={stats.unassigned.raw}
              weighted={stats.unassigned.weighted}
            />
          </div>

          {updateError && (
            <p className="mb-8 rounded-[1.3rem] border border-[#d9a6a6]/45 bg-[#d9a6a6]/15 px-4 py-3 text-sm leading-6 text-[#b76f6f]">
              {updateError}
            </p>
          )}

          <section className="mb-8 rounded-[2rem] border border-[#b7c4b0]/35 bg-white/38 p-6 shadow-[0_16px_50px_rgba(143,159,138,0.12)] backdrop-blur">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-3xl font-extrabold tracking-[-0.04em] text-[#b7c4b0]">
                  Emails das mesas
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#8f9f8a]">
                  Agenda com margem para absorver atrasos, ou envia agora em
                  batch para submeter todos de uma vez.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() =>
                    sendTableEmails({
                      scheduledAt: TEST_TABLE_EMAIL_SCHEDULED_AT,
                    })
                  }
                  disabled={!!tableEmailAction}
                  className="cursor-pointer rounded-full border border-[#cdb892] bg-[#cdb892] px-6 py-3 text-xs font-bold uppercase tracking-[0.25em] text-white shadow-[0_8px_28px_rgba(205,184,146,0.28)] transition hover:-translate-y-[1px] hover:bg-[#b7975b] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {tableEmailAction === "agendar"
                    ? "A agendar..."
                    : "Agendar 12:50"}
                </button>

                <button
                  type="button"
                  onClick={() => sendTableEmails()}
                  disabled={!!tableEmailAction}
                  className="cursor-pointer rounded-full border border-[#cdb892]/60 bg-white/45 px-6 py-3 text-xs font-bold uppercase tracking-[0.25em] text-[#cdb892] shadow-sm backdrop-blur transition hover:-translate-y-[1px] hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {tableEmailAction === "enviar agora"
                    ? "A enviar..."
                    : "Enviar agora"}
                </button>
              </div>
            </div>

            <div className="rounded-[1.3rem] border border-[#b7c4b0]/25 bg-[#fbfaf5]/50 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#cdb892]">
                    Lista preparada
                  </p>
                  <p className="mt-2 text-2xl font-extrabold text-[#b7c4b0]">
                    {TEST_TABLE_EMAIL_RECIPIENTS.length} emails
                  </p>
                </div>

                <p className="text-sm text-[#8f9f8a]">
                  Preview dos primeiros {tableEmailPreview.length}
                  {tableEmailHiddenCount > 0
                    ? ` · +${tableEmailHiddenCount} restantes`
                    : ""}
                </p>
              </div>

              <div className="mt-4 overflow-hidden rounded-[1rem] border border-[#b7c4b0]/20">
                <div className="grid grid-cols-[1fr_auto] bg-white/45 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#cdb892] sm:grid-cols-[1fr_1fr_auto]">
                  <span>Nome</span>
                  <span className="hidden sm:block">Email</span>
                  <span>Mesa</span>
                </div>

                <div className="max-h-64 overflow-auto">
                  {tableEmailPreview.map((recipient) => (
                    <div
                      key={recipient.email}
                      className="grid grid-cols-[1fr_auto] gap-3 border-t border-[#b7c4b0]/15 px-4 py-3 text-sm sm:grid-cols-[1fr_1fr_auto]"
                    >
                      <span className="font-bold text-[#7f8f78]">
                        {recipient.firstName}
                      </span>
                      <span className="hidden truncate text-[#8f9f8a] sm:block">
                        {recipient.email}
                      </span>
                      <span className="font-bold text-[#cdb892]">
                        {recipient.table} · {recipient.tableName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {tableEmailError && (
              <p className="mt-4 rounded-[1.3rem] border border-[#d9a6a6]/45 bg-[#d9a6a6]/15 px-4 py-3 text-sm leading-6 text-[#b76f6f]">
                {tableEmailError}
              </p>
            )}

            {tableEmailResult && (
              <p className="mt-4 rounded-[1.3rem] border border-[#b7c4b0]/45 bg-[#b7c4b0]/15 px-4 py-3 text-sm leading-6 text-[#7f8f78]">
                {tableEmailResult}
              </p>
            )}
          </section>

          <section className="mb-8 rounded-[2rem] border border-[#b7c4b0]/35 bg-white/38 p-6 shadow-[0_16px_50px_rgba(143,159,138,0.12)] backdrop-blur">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-3xl font-extrabold tracking-[-0.04em] text-[#b7c4b0]">
                Presenças
              </h2>

              <p className="text-sm text-[#8f9f8a]">
                Total respostas: {responses.length}
              </p>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendanceData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={5}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {attendanceData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index]} />
                    ))}
                  </Pie>

                  <Tooltip formatter={(value, name) => [`${value}`, name]} />

                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(value) => (
                      <span className="text-[#7f8f78]">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid gap-4 text-center md:grid-cols-5">
              <MiniStat label="Brutos" value={stats.confirmed} />
              <MiniStat
                label="Ponderados"
                value={formatWeighted(stats.weighted)}
              />
              <MiniStat label="Adultos" value={stats.adults} />
              <MiniStat label="Crianças ≤3" value={stats.childrenUnder3} />
              <MiniStat label="Crianças ≤9" value={stats.childrenUnder9} />
            </div>
          </section>

          <div className="mb-6 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="space-y-3">
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar por nome"
                className="admin-field"
              />

              <SideFilter value={sideFilter} onChange={setSideFilter} />

              {(searchTerm.trim() || sideFilter !== "all") && (
                <p className="text-sm text-[#8f9f8a]">
                  {filteredResponses.length} de {responses.length} respostas
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={fetchResponses}
                className="cursor-pointer rounded-full border border-[#cdb892]/60 bg-white/45 px-6 py-3 text-xs font-bold uppercase tracking-[0.25em] text-[#cdb892] shadow-sm backdrop-blur transition hover:-translate-y-[1px] hover:bg-white"
              >
                Atualizar
              </button>

              <button
                onClick={exportCSV}
                className="cursor-pointer rounded-full border border-[#cdb892] bg-[#cdb892] px-6 py-3 text-xs font-bold uppercase tracking-[0.25em] text-white shadow-[0_8px_28px_rgba(205,184,146,0.28)] transition hover:-translate-y-[1px] hover:bg-[#b7975b]"
              >
                Exportar CSV
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-center text-[#8f9f8a]">
              A carregar respostas...
            </p>
          ) : filteredResponses.length === 0 ? (
            <p className="text-center text-[#8f9f8a]">
              Nenhuma resposta encontrada.
            </p>
          ) : (
            <div className="grid gap-4">
              {filteredResponses.map((response) => (
                <RSVPCard
                  key={response.id}
                  response={response}
                  onDelete={() => {
                    setDeleteError("");
                    setPendingDeleteResponse(response);
                  }}
                  onRemovePerson={(personIndex) => {
                    setDeleteError("");
                    setPendingDeletePerson({ response, personIndex });
                  }}
                  onSideChange={(side) => updateResponseSide(response.id, side)}
                  onAgeGroupChange={(personIndex, ageGroup) =>
                    updatePersonAgeGroup(response.id, personIndex, ageGroup)
                  }
                  isDeleting={deletingIds.includes(response.id)}
                  isUpdating={updatingIds.includes(response.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {pendingDeletePerson && (
        <DeletePersonModal
          response={pendingDeletePerson.response}
          personIndex={pendingDeletePerson.personIndex}
          isDeleting={updatingIds.includes(pendingDeletePerson.response.id)}
          error={deleteError}
          onCancel={() => {
            setDeleteError("");
            setPendingDeletePerson(null);
          }}
          onConfirm={() =>
            removePersonFromResponse(
              pendingDeletePerson.response.id,
              pendingDeletePerson.personIndex,
            )
          }
        />
      )}

      {pendingDeleteResponse && (
        <DeleteConfirmModal
          response={pendingDeleteResponse}
          isDeleting={deletingIds.includes(pendingDeleteResponse.id)}
          error={deleteError}
          onCancel={() => {
            setDeleteError("");
            setPendingDeleteResponse(null);
          }}
          onConfirm={() => deleteResponse(pendingDeleteResponse.id)}
        />
      )}
    </>
  );
}

function SideStatCard({ label, raw, weighted }) {
  return (
    <div className="rounded-[1.6rem] border border-[#b7c4b0]/35 bg-white/40 p-5 text-center shadow-[0_10px_30px_rgba(143,159,138,0.10)] backdrop-blur">
      <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#8f9f8a]">
        {label}
      </div>

      <div className="mt-4 text-3xl font-extrabold tracking-[-0.06em] text-[#b7c4b0]">
        {raw}
      </div>

      <div className="mt-2 text-sm text-[#8f9f8a]">
        {formatWeighted(weighted)} ponderados
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-[1.6rem] border border-[#b7c4b0]/35 bg-white/40 p-5 text-center shadow-[0_10px_30px_rgba(143,159,138,0.10)] backdrop-blur">
      <div className="text-4xl font-extrabold tracking-[-0.06em]">{value}</div>

      <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#8f9f8a]">
        {label}
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-[1.3rem] border border-[#b7c4b0]/25 bg-[#fbfaf5]/50 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8f9f8a]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-extrabold text-[#b7c4b0]">{value}</p>
    </div>
  );
}

function RSVPCard({
  response,
  onDelete,
  onRemovePerson,
  onSideChange,
  onAgeGroupChange,
  isDeleting,
  isUpdating,
}) {
  const date = formatAdminDate(response.created_at);

  const people = response.people || [];
  const attendingCount = people.filter(
    (person) => person.attending === "yes",
  ).length;
  const declinedCount = people.filter(
    (person) => person.attending === "no",
  ).length;
  const entryCounts = getPeopleCounts(people);

  return (
    <article className="rounded-[2rem] border border-[#b7c4b0]/35 bg-white/45 p-6 shadow-[0_12px_40px_rgba(143,159,138,0.10)] backdrop-blur">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <span className="inline-flex rounded-full bg-[#b7c4b0]/18 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#7f8f78]">
            {attendingCount} confirmados · {declinedCount} não vão ·{" "}
            {formatWeighted(entryCounts.weighted)} pond.
          </span>

          <h2 className="mt-4 text-3xl font-extrabold leading-none tracking-[-0.04em] text-[#b7c4b0]">
            {people
              .map((person) => person.name)
              .filter(Boolean)
              .join(", ") || "Sem nome"}
          </h2>
        </div>

        <div className="flex flex-col items-start gap-3 md:items-end">
          <p className="text-sm text-[#cdb892]">{date}</p>

          <SideSelector
            response={response}
            value={response.side}
            disabled={isDeleting || isUpdating}
            onChange={onSideChange}
          />

          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting || isUpdating}
            className="cursor-pointer rounded-full border border-[#d9a6a6] px-5 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#b76f6f] transition hover:-translate-y-[1px] hover:bg-[#d9a6a6] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? "A apagar..." : "Apagar entrada"}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {people.map((person, index) => (
          <div
            key={`${person.name}-${index}`}
            className="rounded-[1.3rem] border border-[#b7c4b0]/20 bg-[#fbfaf5]/55 p-4"
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-lg font-bold text-[#7f8f78]">
                  {person.name || `Pessoa ${index + 1}`}
                </p>

                <p className="mt-1 text-sm text-[#8f9f8a]">
                  {person.email || "Sem email"} ·{" "}
                  {person.phone || "Sem contacto"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${
                    person.attending === "yes"
                      ? "bg-[#b7c4b0]/18 text-[#7f8f78]"
                      : "bg-[#d9a6a6]/25 text-[#b76f6f]"
                  }`}
                >
                  {person.attending === "yes" ? "Vai" : "Não vai"}
                </span>

                {people.length >= 2 && (
                  <button
                    type="button"
                    onClick={() => onRemovePerson(index)}
                    disabled={isDeleting || isUpdating}
                    className="cursor-pointer rounded-full border border-[#d9a6a6]/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b76f6f] transition hover:bg-[#d9a6a6] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#cdb892]">
                  Tipo
                </p>
                {person.attending === "yes" ? (
                  <select
                    value={person.ageGroup || "adult"}
                    disabled={isDeleting || isUpdating}
                    onChange={(e) => onAgeGroupChange(index, e.target.value)}
                    className="admin-field py-3 text-sm"
                  >
                    <option value="adult">Adulto (1)</option>
                    <option value="child_under_9">
                      Criança 3-9 anos (0,5)
                    </option>
                    <option value="child_under_3">Bebé 0-2 anos (0)</option>
                  </select>
                ) : (
                  <p className="text-[#8f9f8a]">
                    {formatAgeGroup(person.ageGroup)}
                  </p>
                )}
              </div>
              <Info
                label="Peso"
                value={
                  person.attending === "yes"
                    ? formatWeighted(getPersonWeight(person))
                    : "—"
                }
              />
              <Info
                label="Restrições alimentares"
                value={person.dietary || "Sem restrições"}
              />
            </div>
          </div>
        ))}
      </div>

      {response.notes && (
        <div className="mt-5 rounded-[1.4rem] border border-[#cdb892]/20 bg-[#fbfaf5]/55 p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#cdb892]">
            Notas
          </p>
          <p className="leading-7 text-[#7f8f78]">{response.notes}</p>
        </div>
      )}
    </article>
  );
}

function SideFilter({ value, onChange }) {
  const options = [
    { id: "all", label: "Todos" },
    { id: "noivo", label: "Daniel" },
    { id: "noiva", label: "Francisca" },
    { id: "unassigned", label: "Por atribuir" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = value === option.id;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`cursor-pointer rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] transition ${
              isActive
                ? "border border-[#cdb892] bg-[#cdb892] text-white"
                : "border border-[#cdb892]/45 bg-white/55 text-[#cdb892] hover:bg-[#cdb892]/10"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function SideSelector({ response, value, onChange, disabled }) {
  if (isCoupleResponse(response)) {
    return (
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full border border-[#cdb892] bg-[#cdb892] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
          Daniel
        </span>
        <span className="rounded-full border border-[#cdb892] bg-[#cdb892] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
          Francisca
        </span>
      </div>
    );
  }

  const options = [
    { id: "", label: "Por atribuir" },
    { id: "noivo", label: "Daniel" },
    { id: "noiva", label: "Francisca" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = (value || "") === option.id;

        return (
          <button
            key={option.id || "unset"}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.id || null)}
            className={`cursor-pointer rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isActive
                ? "border border-[#cdb892] bg-[#cdb892] text-white"
                : "border border-[#cdb892]/45 bg-white/55 text-[#cdb892] hover:bg-[#cdb892]/10"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function DeletePersonModal({
  response,
  personIndex,
  isDeleting,
  error,
  onCancel,
  onConfirm,
}) {
  const person = (response.people || [])[personIndex];
  const personName = person?.name || `Pessoa ${personIndex + 1}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#4f5b49]/35 px-5 py-8 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-person-title"
    >
      <div className="w-full max-w-lg rounded-[2rem] border border-[#d9a6a6]/45 bg-[#fbfaf5] p-7 text-center text-[#7f8f78] shadow-[0_24px_80px_rgba(79,91,73,0.22)]">
        <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#b76f6f]">
          Remover pessoa
        </p>

        <div className="gold-line mx-auto mt-5 max-w-[140px]" />

        <h2
          id="delete-person-title"
          className="mt-7 text-4xl font-extrabold leading-none tracking-[-0.05em] text-[#b7c4b0]"
        >
          Remover {personName}?
        </h2>

        <p className="mx-auto mt-5 max-w-sm text-sm leading-6 text-[#8f9f8a]">
          Esta pessoa será retirada desta resposta. As restantes mantêm-se.
        </p>

        {error && (
          <p className="mt-5 rounded-[1.2rem] border border-[#d9a6a6]/45 bg-[#d9a6a6]/15 px-4 py-3 text-sm leading-6 text-[#b76f6f]">
            {error}
          </p>
        )}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="cursor-pointer rounded-full border border-[#cdb892]/60 bg-white/55 px-6 py-3 text-xs font-bold uppercase tracking-[0.24em] text-[#cdb892] transition hover:-translate-y-[1px] hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="cursor-pointer rounded-full border border-[#d9a6a6] bg-[#d9a6a6] px-6 py-3 text-xs font-bold uppercase tracking-[0.24em] text-white shadow-[0_10px_30px_rgba(217,166,166,0.35)] transition hover:-translate-y-[1px] hover:bg-[#b76f6f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? "A remover..." : "Remover pessoa"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  response,
  isDeleting,
  error,
  onCancel,
  onConfirm,
}) {
  const peopleNames =
    (response.people || [])
      .map((person) => person.name)
      .filter(Boolean)
      .join(", ") || "esta resposta";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#4f5b49]/35 px-5 py-8 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-rsvp-title"
    >
      <div className="w-full max-w-lg rounded-[2rem] border border-[#d9a6a6]/45 bg-[#fbfaf5] p-7 text-center text-[#7f8f78] shadow-[0_24px_80px_rgba(79,91,73,0.22)]">
        <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#b76f6f]">
          Confirmar remoção
        </p>

        <div className="gold-line mx-auto mt-5 max-w-[140px]" />

        <h2
          id="delete-rsvp-title"
          className="mt-7 text-4xl font-extrabold leading-none tracking-[-0.05em] text-[#b7c4b0]"
        >
          Apagar RSVP?
        </h2>

        <p className="mx-auto mt-5 max-w-sm text-sm leading-6 text-[#8f9f8a]">
          Vais apagar a resposta de{" "}
          <span className="font-bold text-[#7f8f78]">{peopleNames}</span>. Esta
          ação não pode ser desfeita.
        </p>

        {error && (
          <p className="mt-5 rounded-[1.2rem] border border-[#d9a6a6]/45 bg-[#d9a6a6]/15 px-4 py-3 text-sm leading-6 text-[#b76f6f]">
            {error}
          </p>
        )}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="cursor-pointer rounded-full border border-[#cdb892]/60 bg-white/55 px-6 py-3 text-xs font-bold uppercase tracking-[0.24em] text-[#cdb892] transition hover:-translate-y-[1px] hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="cursor-pointer rounded-full border border-[#d9a6a6] bg-[#d9a6a6] px-6 py-3 text-xs font-bold uppercase tracking-[0.24em] text-white shadow-[0_10px_30px_rgba(217,166,166,0.35)] transition hover:-translate-y-[1px] hover:bg-[#b76f6f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? "A apagar..." : "Apagar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-[1.3rem] border border-[#b7c4b0]/20 bg-[#fbfaf5]/55 p-4">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#cdb892]">
        {label}
      </p>
      <p className="text-[#7f8f78]">{value}</p>
    </div>
  );
}
