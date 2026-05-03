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

export default function AdminRSVP() {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const stats = useMemo(() => {
    const attending = responses.filter((r) => r.attending);
    const declined = responses.filter((r) => !r.attending);

    const guests = attending.reduce(
      (total, r) => total + Number(r.guests_count || 0),
      0,
    );

    const childrenUnder3 = attending.reduce(
      (total, r) => total + Number(r.children_under_3 || 0),
      0,
    );

    const childrenUnder5 = attending.reduce(
      (total, r) => total + Number(r.children_under_5 || 0),
      0,
    );

    const totalPeople = attending.length + guests;
    const adults = totalPeople - childrenUnder3 - childrenUnder5;

    return {
      confirmed: attending.length,
      declined: declined.length,
      guests,
      childrenUnder3,
      childrenUnder5,
      totalPeople,
      adults,
    };
  }, [responses]);
  const attendanceData = [
    { name: "Confirmados", value: stats.confirmed },
    { name: "Não vão", value: stats.declined },
  ];

  const COLORS = ["#b7c4b0", "#d9a6a6"];

  function exportCSV() {
    const rows = responses.map((r) => ({
      Nome: r.guest_name ?? "",
      Contacto: r.contact ?? "",
      Presenca: r.attending ? "Sim" : "Não",
      Acompanhantes: r.guests_count ?? 0,
      Nomes: r.guests_names ?? "",
      CriancasAte3: r.children_under_3 ?? 0,
      CriancasAte5: r.children_under_5 ?? 0,
      Notas: r.notes ?? "",
      Data: r.created_at ? new Date(r.created_at).toLocaleString("pt-PT") : "",
    }));

    const headers = Object.keys(
      rows[0] ?? {
        Nome: "",
        Contacto: "",
        Presenca: "",
        Acompanhantes: "",
        Nomes: "",
        CriancasAte3: "",
        CriancasAte5: "",
        Notas: "",
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

        <div className="mb-8 grid gap-4 md:grid-cols-5">
          <StatCard label="Confirmados" value={stats.totalPeople} />
          <StatCard label="Não vão" value={stats.declined} />
          <StatCard label="Adultos" value={stats.adults} />
          <StatCard label="Crianças ≤3" value={stats.childrenUnder3} />
          <StatCard label="Crianças ≤5" value={stats.childrenUnder5} />
        </div>

        <section className="mb-8 rounded-[2rem] border border-[#b7c4b0]/35 bg-white/38 p-6 shadow-[0_16px_50px_rgba(143,159,138,0.12)] backdrop-blur">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-3xl font-extrabold tracking-[-0.04em] text-[#b7c4b0]">
              Presenças!
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

          <div className="mt-4 grid gap-4 text-center md:grid-cols-4">
            <MiniStat label="Total" value={stats.totalPeople} />
            <MiniStat label="Adultos" value={stats.adults} />
            <MiniStat label="Crianças ≤3" value={stats.childrenUnder3} />
            <MiniStat label="Crianças ≤5" value={stats.childrenUnder5} />
          </div>
        </section>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
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

        {loading ? (
          <p className="text-center text-[#8f9f8a]">A carregar respostas...</p>
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

function RSVPCard({ response }) {
  const date = response.created_at
    ? new Date(response.created_at).toLocaleString("pt-PT")
    : "";

  return (
    <article className="rounded-[2rem] border border-[#b7c4b0]/35 bg-white/45 p-6 shadow-[0_12px_40px_rgba(143,159,138,0.10)] backdrop-blur">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] ${
              response.attending
                ? "bg-[#b7c4b0]/18 text-[#7f8f78]"
                : "bg-[#d9a6a6]/25 text-[#b76f6f]"
            }`}
          >
            {response.attending ? "Vai estar presente" : "Não pode ir"}
          </span>

          <h2 className="mt-4 text-3xl font-extrabold leading-none tracking-[-0.04em] text-[#b7c4b0]">
            {response.guest_name || "Sem nome"}
          </h2>

          <p className="mt-3 text-[#8f9f8a]">{response.contact}</p>
        </div>

        <p className="text-sm text-[#cdb892]">{date}</p>
      </div>

      {response.attending && (
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <Info label="Acompanhantes" value={response.guests_count || "0"} />

          {Number(response.guests_count) > 0 && (
            <Info label="Nomes" value={response.guests_names || "Sem nomes"} />
          )}

          <Info
            label="Crianças até 3 anos"
            value={response.children_under_3 || "0"}
          />
          <Info
            label="Crianças até 5 anos"
            value={response.children_under_5 || "0"}
          />
        </div>
      )}

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
