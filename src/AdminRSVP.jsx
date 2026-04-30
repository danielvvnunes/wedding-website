import { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";

export default function AdminRSVP() {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);

  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(
    sessionStorage.getItem("admin-authenticated") === "true",
  );

  function exportCSV() {
    const rows = responses.map((r) => ({
      Nome: r.guest_name,
      Contacto: r.contact,
      Presença: r.attending ? "Sim" : "Não",
      Acompanhantes: r.guests_count ?? 0,
      Nomes: r.guests_names ?? "",
      Notas: r.notes ?? "",
    }));

    const csv =
      "Nome,Contacto,Presença,Acompanhantes,Nomes,Notas\n" +
      rows.map((r) => Object.values(r).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "rsvp.csv";
    a.click();
  }

  async function fetchResponses() {
    const { data, error, count } = await supabase
      .from("rsvp")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    console.log("URL:", import.meta.env.VITE_SUPABASE_URL);
    console.log("COUNT:", count);
    console.log("DATA:", data);
    console.log("ERROR:", error);
    setLoading(true);

    console.log("RSVP DATA:", data);
    console.log("RSVP ERROR:", error);

    if (error) {
      console.error(error);
      alert("Erro ao carregar respostas");
    } else {
      setResponses(data ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchResponses();
    }
  }, [isAuthenticated]);

  const stats = useMemo(() => {
    const attending = responses.filter((r) => r.attending);
    const notAttending = responses.filter((r) => !r.attending);

    const guestsTotal = attending.reduce(
      (total, r) => total + Number(r.guests_count || 0),
      0,
    );

    return {
      confirmed: attending.length,
      declined: notAttending.length,
      guests: guestsTotal,
      totalPeople: attending.length + guestsTotal,
    };
  }, [responses]);

  function handleLogin(e) {
    e.preventDefault();

    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("admin-authenticated", "true");
      setIsAuthenticated(true);
    } else {
      alert("Password incorreta");
    }
  }

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3eee5] px-5 text-[#3b3228]">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md rounded-[2.4rem] border border-[#cfc6b6] bg-white/70 p-8 text-center shadow-2xl"
        >
          <p className="mb-4 text-xs uppercase tracking-[0.45em] text-[#9b7f42]">
            Painel privado
          </p>

          <h1 className="font-serif text-4xl">Acesso RSVP</h1>

          <p className="mt-4 text-sm leading-6 text-[#6c5b4a]">
            Introduz a password para consultar as respostas ao convite.
          </p>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="mt-8 w-full rounded-2xl border border-[#cfc6b6] bg-[#f8f4ec]/70 px-5 py-4 text-base outline-none focus:border-[#c2a45f]"
          />

          <button
            type="submit"
            className="mt-5 w-full rounded-full bg-[#8a9784] px-8 py-4 text-sm uppercase tracking-[0.25em] text-white shadow-lg transition hover:bg-[#c2a45f]"
          >
            Entrar
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3eee5] px-5 py-10 text-[#3b3228]">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.45em] text-[#9b7f42]">
            Painel privado
          </p>
          <h1 className="font-serif text-5xl">RSVP</h1>
          <p className="mt-3 text-[#6c5b4a]">
            Respostas ao convite de Francisca & Daniel
          </p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <StatCard label="Confirmados" value={stats.confirmed} />
          <StatCard label="Não vão" value={stats.declined} />
          <StatCard label="Acompanhantes" value={stats.guests} />
          <StatCard label="Total pessoas" value={stats.totalPeople} />
        </div>

        <div className="mb-6 flex justify-end">
          <button
            onClick={fetchResponses}
            className="rounded-full bg-[#8a9784] px-6 py-3 text-xs uppercase tracking-[0.25em] text-white transition hover:bg-[#c2a45f]"
          >
            Atualizar
          </button>

          <button onClick={exportCSV}>Exportar CSV</button>
        </div>

        {loading ? (
          <p className="text-center text-[#6c5b4a]">A carregar respostas...</p>
        ) : (
          <div className="grid gap-4">
            {responses.map((response) => (
              <RSVPCard key={response.id} response={response} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-[2rem] border border-[#cfc6b6] bg-white/60 p-6 text-center shadow-sm">
      <div className="font-serif text-4xl text-[#9b7f42]">{value}</div>
      <div className="mt-2 text-xs uppercase tracking-[0.28em] text-[#6c5b4a]">
        {label}
      </div>
    </div>
  );
}

function RSVPCard({ response }) {
  return (
    <div className="rounded-[2rem] border border-[#cfc6b6] bg-white/70 p-6 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em] ${
                response.attending
                  ? "bg-[#8a9784]/15 text-[#5f6f59]"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {response.attending ? "Vai estar presente" : "Não pode ir"}
            </span>
          </div>

          <h2 className="font-serif text-3xl">
            {response.guest_name || "Sem nome"}
          </h2>

          <p className="mt-2 text-[#6c5b4a]">{response.contact}</p>
        </div>

        <p className="text-sm text-[#9b7f42]">
          {response.created_at
            ? new Date(response.created_at).toLocaleString("pt-PT")
            : ""}
        </p>
      </div>

      {response.attending && (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <Info label="Acompanhantes" value={response.guests_count || "0"} />
          <Info
            label="Nomes"
            value={response.guests_names || "Sem acompanhantes"}
          />
        </div>
      )}

      {response.notes && (
        <div className="mt-5 rounded-2xl bg-[#f8f4ec]/80 p-4">
          <p className="mb-1 text-xs uppercase tracking-[0.25em] text-[#9b7f42]">
            Notas
          </p>
          <p className="text-[#6c5b4a]">{response.notes}</p>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#f8f4ec]/80 p-4">
      <p className="mb-1 text-xs uppercase tracking-[0.25em] text-[#9b7f42]">
        {label}
      </p>
      <p className="text-[#3b3228]">{value}</p>
    </div>
  );
}
