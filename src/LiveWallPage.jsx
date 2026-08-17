import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "./lib/supabase";

const SLIDE_DURATION = 7000;
const REFRESH_DURATION = 30000;

function formatWallDate(date) {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export default function LiveWallPage() {
  const [items, setItems] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  async function loadGallery() {
    const { data, error } = await supabase
      .from("wedding_gallery")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setIsLoading(false);
      return;
    }

    setItems(
      data.map((item) => ({
        id: String(item.file_path || item.id || item.file_url),
        url: item.file_url,
        type: item.file_type,
        uploadedBy: item.uploaded_by,
        caption: item.caption,
        createdAt: item.created_at,
      })),
    );
    setIsLoading(false);
  }

  useEffect(() => {
    const initialTimer = window.setTimeout(loadGallery, 0);
    const refreshTimer = window.setInterval(loadGallery, REFRESH_DURATION);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(refreshTimer);
    };
  }, []);

  useEffect(() => {
    if (items.length <= 1) return undefined;

    const slideTimer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, SLIDE_DURATION);

    return () => window.clearInterval(slideTimer);
  }, [items.length]);

  const safeActiveIndex = items.length ? activeIndex % items.length : 0;
  const activeItem = items[safeActiveIndex];
  const memoryText = useMemo(() => {
    if (items.length === 1) return "1 memória no mural";
    return `${items.length} memórias no mural`;
  }, [items.length]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#11130f] px-6 text-center text-white">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
          A preparar o mural...
        </p>
      </main>
    );
  }

  if (!activeItem) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#11130f] px-6 text-center text-white">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/55">
            F · D Live Wall
          </p>
          <h1 className="mt-4 text-4xl font-extrabold">
            As memórias vão aparecer aqui.
          </h1>
          <Link
            to="/app"
            className="mt-8 inline-flex rounded-full border border-white/25 px-5 py-3 text-sm font-bold text-white/80"
          >
            Abrir app dos convidados
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#11130f] text-white">
      <div className="absolute inset-0 opacity-35">
        {activeItem.type?.startsWith("video/") ? (
          <video
            key={`${activeItem.id}-background`}
            src={activeItem.url}
            className="h-full w-full scale-110 object-cover blur-2xl"
            autoPlay
            muted
            playsInline
            loop
          />
        ) : (
          <img
            key={`${activeItem.id}-background`}
            src={activeItem.url}
            alt=""
            className="h-full w-full scale-110 object-cover blur-2xl"
          />
        )}
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(205,184,146,0.22),transparent_34%),linear-gradient(180deg,rgba(17,19,15,0.55),rgba(17,19,15,0.18)_35%,rgba(17,19,15,0.8))]" />

      <header className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between gap-6 px-8 py-7">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-[#f4e3bd]">
            F · D Live Wall
          </p>
          <p className="mt-2 text-sm font-semibold text-white/70">{memoryText}</p>
        </div>

        <Link
          to="/app"
          className="rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur"
        >
          Adicionar fotos
        </Link>
      </header>

      <section className="relative z-10 flex min-h-screen items-center justify-center px-8 py-24">
        <div className="flex h-[72vh] w-full items-center justify-center">
          {activeItem.type?.startsWith("video/") ? (
            <video
              key={activeItem.id}
              src={activeItem.url}
              className="max-h-full max-w-full rounded-[1.2rem] object-contain shadow-[0_30px_90px_rgba(0,0,0,0.35)]"
              autoPlay
              muted
              playsInline
              loop
            />
          ) : (
            <img
              key={activeItem.id}
              src={activeItem.url}
              alt=""
              className="max-h-full max-w-full rounded-[1.2rem] object-contain shadow-[0_30px_90px_rgba(0,0,0,0.35)]"
            />
          )}
        </div>
      </section>

      <footer className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent px-8 pb-8 pt-24">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#f4e3bd]/85">
            {activeItem.uploadedBy || "Convidado"} ·{" "}
            {formatWallDate(activeItem.createdAt)}
          </p>
          <p className="mt-3 max-w-3xl text-3xl font-extrabold leading-tight">
            {activeItem.caption || "Uma memória do casamento pelos olhos dos convidados."}
          </p>
        </div>
      </footer>
    </main>
  );
}
