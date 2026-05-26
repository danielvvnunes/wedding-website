import { useState, useEffect } from "react";
import igrejaImg from "./assets/igreja.png";
import casalLineImg from "./assets/casal-line.png";
import EnvelopeLeft from "./assets/envelope-left.png";
import EnvelopeRight from "./assets/envelope-right.png";
import { useParams } from "react-router-dom";
import { supabase } from "./lib/supabase";

const customStyles = `
@import url("https://fonts.googleapis.com/css2?family=Urbanist:wght@300;400;500;600;700;800&display=swap");

:root {
  --cream: #f4efe7;
  --paper: #fbf7f0;
--ink: #3f4a3f;
--olive: #a9b7a3;
--olive-light: #d7e1d2;
--paper: #fbf7f0;
--cream: #f4efe7;
--accent: #cdb892;
}

* {
  font-family: "Urbanist", Arial, Helvetica, sans-serif;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(22px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes tapHint {
  0%, 100% {
    transform: translateY(0);
    opacity: .82;
  }
  50% {
    transform: translateY(-6px);
    opacity: 1;
  }
}

.envelope-hint {
  animation: tapHint 2.4s ease-in-out infinite;
}

.page-enter {
  animation: fadeUp 900ms ease both;
}

.invitation-content {
  opacity: 0;
  filter: blur(18px);
  transform: scale(1.03);
  transition:
    opacity 500ms ease,
    filter 650ms ease,
    transform 650ms ease;
}

.invitation-content-visible {
  opacity: 1;
  filter: blur(0);
  transform: scale(1);
}

.reveal-on-scroll {
  opacity: 0;
  transform: translateY(34px);
  transition:
    opacity 900ms ease,
    transform 900ms cubic-bezier(.22,1,.36,1);
}

.reveal-on-scroll.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.editorial-number {
  font-feature-settings: "tnum";
}

.fine-grid {
  background-image:
    linear-gradient(rgba(31,38,31,.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(31,38,31,.05) 1px, transparent 1px);
  background-size: 42px 42px;
}

.noise {
  background-image:
    radial-gradient(circle at 20% 20%, rgba(255,255,255,.7) 0 1px, transparent 1px),
    radial-gradient(circle at 70% 60%, rgba(143,159,138,.15) 0 1px, transparent 1px);
  background-size: 22px 22px, 30px 30px;
}
`;

function useRevealOnScroll() {
  useEffect(() => {
    const elements = document.querySelectorAll(".reveal-on-scroll");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16 },
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);
}

const guests = {
  "tia-elsa": "Tia Elsa",
  "avo-maria": "Avó Maria",
  "joao-e-ana": "João e Ana",
};

function SectionNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#1f261f]/10 bg-[#f4efe7]/85 px-4 py-3 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#1f261f]">
        <span className="hidden sm:block">F · D</span>

        <div className="grid w-full grid-cols-4 gap-2 sm:w-auto sm:flex sm:gap-2">
          {["detalhes", "programa", "locais", "rsvp"].map((item) => (
            <a
              key={item}
              href={`#${item}`}
              className="rounded-full border border-[#1f261f]/10 px-3 py-2 text-center transition hover:border-[#1f261f] hover:bg-[#a9b7a3] hover:text-white"
            >
              {item === "rsvp" ? "RSVP" : item}
            </a>
          ))}
        </div>
      </nav>
    </header>
  );
}

export default function WeddingWebsite() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768;
  });

  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth >= 768;
  });

  const [isOpening, setIsOpening] = useState(false);
  const [hasGuests, setHasGuests] = useState(false);

  const [submitStatus, setSubmitStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const weddingDateTime = new Date("2026-09-26T11:30:00");
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining());

  const { guestSlug } = useParams();
  const guestName = guestSlug ? guests[guestSlug] : null;

  const [name, setName] = useState(() => guestName ?? "");
  const [contact, setContact] = useState("");
  const [attending, setAttending] = useState("yes");
  const [guestsCount, setGuestsCount] = useState("");
  const [guestsNames, setGuestsNames] = useState("");
  const [notes, setNotes] = useState("");

  const weddingDate = "26 de setembro de 2026";

  useRevealOnScroll();

  async function submitRSVP(data) {
    const { error } = await supabase.from("rsvp").insert([data]);

    if (error) {
      console.error(error);
      return false;
    }

    return true;
  }

  function getTimeRemaining() {
    const total = weddingDateTime - new Date();

    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((total / (1000 * 60)) % 60);
    const seconds = Math.floor((total / 1000) % 60);

    return { days, hours, minutes, seconds };
  }

  function openInvitation() {
    setIsOpening(true);
    window.setTimeout(() => {
      setIsOpen(true);
    }, 900);
  }

  useEffect(() => {
    const shouldLockScroll = isMobile && !isOpen;

    document.body.style.overflow = shouldLockScroll ? "hidden" : "";
    document.documentElement.style.overflow = shouldLockScroll ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isMobile, isOpen]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeRemaining());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;

      setIsMobile(mobile);

      if (!mobile) {
        setIsOpen(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <main className="min-h-screen bg-[#f4efe7] text-[#1f261f]">
      <style>{customStyles}</style>

      {isMobile && !isOpen && (
        <section
          className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-transparent ${
            isOpening ? "pointer-events-none" : ""
          }`}
        >
          <div className="absolute inset-0 perspective-[1600px]">
            <div
              className="relative h-screen w-full cursor-pointer overflow-hidden"
              onClick={openInvitation}
            >
              <img
                src={EnvelopeLeft}
                alt=""
                className={`absolute left-0 top-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(.22,1,.36,1)] ${
                  isOpening ? "-translate-x-full" : "translate-x-0"
                }`}
              />

              <img
                src={EnvelopeRight}
                alt=""
                className={`absolute left-0 top-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(.22,1,.36,1)] ${
                  isOpening ? "translate-x-full" : "translate-x-0"
                }`}
              />

              {!isOpening && (
                <div className="envelope-hint pointer-events-none absolute bottom-[84vh] left-1/2 z-20 -translate-x-1/2 text-center">
                  <div className="rounded-full border border-[#1f261f]/10 bg-[#fbf7f0]/80 px-5 py-2.5 shadow-md backdrop-blur-sm">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.32em] text-[#1f261f]">
                      Toca para abrir
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <div
        className={`page-enter invitation-content ${
          isOpen
            ? "invitation-content-visible"
            : "pointer-events-none opacity-0"
        }`}
      >
        <section className="relative isolate min-h-screen overflow-hidden px-5 py-6 md:px-10 md:py-10">
          <div className="absolute inset-0 fine-grid opacity-80" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(183,196,176,.65),transparent_28%),radial-gradient(circle_at_90%_70%,rgba(216,200,178,.55),transparent_32%)]" />

          <div className="relative mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl overflow-hidden rounded-[2.4rem] border border-[#1f261f]/10 bg-[#fbf7f0]/80 shadow-2xl backdrop-blur md:grid-cols-[1.1fr_0.9fr]">
            <div className="flex flex-col justify-between p-7 md:p-12">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.28em] text-[#1f261f]/60">
                <span>Wedding celebration</span>
                <span>26.09.2026</span>
              </div>

              <div className="my-16 md:my-0">
                <p className="mb-6 max-w-md text-sm font-semibold uppercase tracking-[0.35em] text-[#8f9f8a]">
                  Francisca & Daniel
                </p>

                <h1 className="max-w-4xl text-[4.7rem] font-extrabold uppercase leading-[0.82] tracking-[-0.08em] text-[#1f261f] md:text-[8.8rem] lg:text-[10.5rem]">
                  Save
                  <br />
                  the
                  <br />
                  date
                </h1>

                <p className="mt-8 max-w-xl text-lg leading-8 text-[#1f261f]/70">
                  {guestName ? (
                    <>
                      Querida/o {guestName}, queremos muito celebrar este dia
                      convosco.
                    </>
                  ) : (
                    <>
                      Depois de tantas memórias, aventuras e sonhos partilhados,
                      chegou o momento de celebrar o nosso amor com as pessoas
                      que mais importam.
                    </>
                  )}
                </p>
              </div>

              <div className="grid gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#1f261f] sm:grid-cols-3">
                <HeroInfo label="Data" value="26.09.2026" />
                <HeroInfo label="Cerimónia" value="11h30" />
                <HeroInfo label="Local" value="Santa Iria da Azóia" />
              </div>
            </div>

            <div className="relative min-h-[520px] overflow-hidden bg-[#3f4a3f] p-8 text-white">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(183,196,176,.42),transparent_34%)]" />

              <img
                src={casalLineImg}
                alt="Desenho de linha de Francisca e Daniel"
                className="absolute left-1/2 top-1/2 w-[76%] max-w-[420px] -translate-x-1/2 -translate-y-1/2 invert opacity-80"
              />

              <div className="relative z-10 flex h-full flex-col justify-between">
                <div className="ml-auto rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-white/75">
                  Sábado
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-[#b7c4b0]">
                    26 de setembro
                  </p>
                  <p className="mt-3 text-6xl font-extrabold leading-none tracking-[-0.07em]">
                    2026
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <SectionNav />

        <section id="detalhes" className="relative overflow-hidden px-6 py-24">
          <div className="absolute inset-0 noise bg-[#f4efe7]" />

          <div className="relative mx-auto max-w-6xl">
            <SectionHeader
              eyebrow="O nosso dia"
              title="Uma celebração feita de detalhes."
              text="Queremos que este seja um dia leve, bonito e cheio de momentos para guardar. Aqui ficam os principais detalhes da celebração."
            />

            <div className="mt-14 grid gap-5 md:grid-cols-3">
              <FeatureCard
                number="01"
                title="Cerimónia"
                text="Às 11h30, na Igreja Matriz de Santa Iria de Azóia, onde vamos trocar os nossos votos rodeados por quem mais amamos."
              />
              <FeatureCard
                number="02"
                title="Cocktail"
                text="Às 14h00, um momento para brindar, conversar e começar a celebrar em conjunto."
              />
              <FeatureCard
                number="03"
                title="Festa"
                text="Música, dança e uma noite inesquecível com todos vocês."
              />
            </div>
          </div>
        </section>

        <section className="relative isolate overflow-hidden bg-[#3f4a3f] px-6 py-24 text-white">
          <div className="absolute inset-0 fine-grid opacity-10" />

          <div className="relative mx-auto max-w-6xl reveal-on-scroll">
            <div className="grid gap-12 md:grid-cols-[0.8fr_1.2fr] md:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.4em] text-[#b7c4b0]">
                  Countdown
                </p>
                <h2 className="mt-5 text-5xl font-extrabold uppercase leading-[0.9] tracking-[-0.06em] md:text-7xl">
                  Estamos quase a dizer sim.
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <CountdownBox number={timeLeft.days} label="Dias" />
                <CountdownBox number={timeLeft.hours} label="Horas" />
                <CountdownBox number={timeLeft.minutes} label="Minutos" />
                <CountdownBox number={timeLeft.seconds} label="Segundos" />
              </div>
            </div>
          </div>
        </section>

        <section id="programa" className="relative overflow-hidden px-6 py-24">
          <div className="absolute inset-0 bg-[#fbf7f0]" />

          <div className="relative mx-auto max-w-5xl">
            <SectionHeader
              eyebrow="Programa"
              title="O ritmo do dia"
              text="Os principais momentos da celebração, para viverem connosco cada detalhe deste dia especial."
            />

            <div className="mt-14 overflow-hidden rounded-[2rem] border border-[#1f261f]/10">
              <Timeline
                time="11:00"
                title="Chegada dos convidados"
                text="Receção junto à cerimónia."
              />
              <Timeline
                time="11:30"
                title="Cerimónia"
                text="O momento em que dizemos sim."
              />
              <Timeline
                time="14:00"
                title="Cocktail"
                text="Brindes, conversas e primeiros abraços."
              />
              <Timeline
                time="20:00"
                title="Jantar"
                text="À mesa, com todos os que fazem parte da nossa história."
              />
              <Timeline
                time="22:30"
                title="Festa"
                text="Música, dança e memórias para guardar."
              />
            </div>
          </div>
        </section>

        <section
          id="locais"
          className="relative overflow-hidden bg-[#8f9f8a] px-6 py-24"
        >
          <div className="absolute inset-0 fine-grid opacity-20" />

          <div className="relative mx-auto grid max-w-6xl gap-10 md:grid-cols-[0.85fr_1.15fr] md:items-center">
            <div className="reveal-on-scroll">
              <p className="text-xs font-bold uppercase tracking-[0.4em] text-white/70">
                Locais
              </p>
              <h2 className="mt-5 text-5xl font-extrabold uppercase leading-[0.9] tracking-[-0.06em] text-white md:text-7xl">
                Onde tudo acontece
              </h2>
              <p className="mt-6 max-w-md leading-7 text-white/75">
                Dois momentos, o mesmo dia especial. Primeiro a cerimónia,
                depois a celebração.
              </p>
            </div>

            <div className="grid gap-4">
              <VenueCard
                label="Cerimónia"
                title="Igreja Matriz de Santa Iria de Azóia"
                text="O lugar onde vamos dar início a este novo capítulo, rodeados pela nossa família e amigos."
                cta="Ver localização"
              />
              <VenueCard
                label="Celebração"
                title="Quinta do coração"
                text="Depois da cerimónia, continuamos o dia com brindes, comida, música e muitas memórias para guardar."
                cta="Mais detalhes em breve"
              />
            </div>
          </div>
        </section>

        <section id="rsvp" className="relative overflow-hidden px-6 py-24">
          <div className="absolute inset-0 noise bg-[#f4efe7]" />

          <div className="relative mx-auto grid max-w-6xl overflow-hidden rounded-[2.4rem] border border-[#1f261f]/10 bg-[#fbf7f0] shadow-xl md:grid-cols-[0.9fr_1.1fr]">
            <div className="relative min-h-[420px] overflow-hidden bg-[#3f4a3f] p-10 text-white">
              <img
                src={igrejaImg}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover opacity-20"
              />

              <div className="relative z-10 flex h-full flex-col justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.4em] text-[#b7c4b0]">
                  RSVP
                </p>

                <div>
                  <h2 className="text-5xl font-extrabold uppercase leading-[0.9] tracking-[-0.06em] md:text-7xl">
                    Confirmem a vossa presença
                  </h2>
                  <p className="mt-6 max-w-sm text-white/70">
                    A vossa presença é o nosso melhor presente.
                  </p>
                </div>

                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/60">
                  Até 15.08.2026
                </p>
              </div>
            </div>

            <div className="p-7 md:p-10">
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();

                  if (!contact) {
                    setSubmitStatus("missing-contact");
                    return;
                  }

                  setIsSubmitting(true);
                  setSubmitStatus(null);

                  const success = await submitRSVP({
                    guest_slug: guestSlug,
                    guest_name: name,
                    contact,
                    attending: attending === "yes",
                    has_guests: hasGuests,
                    guests_count: hasGuests ? guestsCount : null,
                    guests_names: hasGuests ? guestsNames : null,
                    notes,
                  });

                  setIsSubmitting(false);

                  setSubmitStatus(
                    success
                      ? attending === "yes"
                        ? "attending"
                        : "not-attending"
                      : "error",
                  );
                }}
              >
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  readOnly={!!guestName}
                  placeholder="Nome"
                  className="field"
                />

                <input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Email ou contacto"
                  required
                  className="field"
                />

                <select
                  value={attending}
                  onChange={(e) => setAttending(e.target.value)}
                  className="field"
                >
                  <option value="yes">Vou estar presente</option>
                  <option value="no">Infelizmente não poderei ir</option>
                </select>

                {attending === "yes" && (
                  <>
                    <select
                      onChange={(e) =>
                        setHasGuests(e.target.value === "acompanha")
                      }
                      className="field"
                    >
                      <option value="solo">Vou sozinho/a</option>
                      <option value="acompanha">Vou levar acompanhantes</option>
                    </select>

                    {hasGuests && (
                      <>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={guestsCount}
                          onChange={(e) => setGuestsCount(e.target.value)}
                          placeholder="Número de acompanhantes"
                          className="field"
                        />

                        <textarea
                          value={guestsNames}
                          onChange={(e) => setGuestsNames(e.target.value)}
                          placeholder="Nome dos acompanhantes"
                          className="field min-h-24"
                        />
                      </>
                    )}
                  </>
                )}

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Mensagem, alergias ou notas importantes"
                  className="field min-h-28"
                />

                {submitStatus && (
                  <div className="rounded-3xl border border-[#1f261f]/10 bg-[#f4efe7] px-5 py-4 text-center">
                    {submitStatus === "attending" && (
                      <p className="text-sm font-semibold text-[#1f261f]">
                        Que alegria! A vossa presença ficou confirmada. 🤍
                      </p>
                    )}

                    {submitStatus === "not-attending" && (
                      <p className="text-sm font-semibold text-[#1f261f]">
                        Vamos sentir a vossa falta. Obrigado por nos avisarem.
                      </p>
                    )}

                    {submitStatus === "missing-contact" && (
                      <p className="text-sm font-semibold text-[#9b4a3f]">
                        Por favor indica um contacto antes de enviar.
                      </p>
                    )}

                    {submitStatus === "error" && (
                      <p className="text-sm font-semibold text-[#9b4a3f]">
                        Não foi possível enviar a confirmação. Tenta novamente.
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-full bg-[#3f4a3f] px-8 py-4 text-sm font-bold uppercase tracking-[0.24em] text-white transition hover:bg-[#8f9f8a] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "A enviar..." : "Enviar confirmação"}
                </button>
              </form>
            </div>
          </div>
        </section>

        <footer className="border-t border-[#1f261f]/10 px-6 py-12 text-center">
          <p className="text-3xl font-extrabold tracking-[-0.06em]">F · D</p>
          <p className="mt-3 text-sm text-[#1f261f]/60">
            Francisca & Daniel · {weddingDate}
          </p>
          <p className="mt-4 text-sm text-[#1f261f]/60">
            ✉ casamento.franciscadaniel@gmail.com
          </p>
        </footer>
      </div>
    </main>
  );
}

function HeroInfo({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#1f261f]/10 bg-white/45 p-4">
      <p className="text-[10px] text-[#1f261f]/45">{label}</p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}

function SectionHeader({ eyebrow, title, text }) {
  return (
    <div className="mx-auto max-w-3xl text-center reveal-on-scroll">
      <p className="text-xs font-bold uppercase tracking-[0.4em] text-[#8f9f8a]">
        {eyebrow}
      </p>

      <h2 className="mt-5 text-5xl font-extrabold uppercase leading-[0.9] tracking-[-0.06em] text-[#1f261f] md:text-7xl">
        {title}
      </h2>

      <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#1f261f]/65">
        {text}
      </p>
    </div>
  );
}

function FeatureCard({ number, title, text }) {
  return (
    <div className="reveal-on-scroll group min-h-[300px] rounded-[2rem] border border-[#1f261f]/10 bg-[#fbf7f0] p-7 transition hover:-translate-y-1 hover:bg-white hover:shadow-xl">
      <p className="editorial-number text-6xl font-extrabold tracking-[-0.08em] text-[#8f9f8a]/50">
        {number}
      </p>

      <h3 className="mt-10 text-3xl font-extrabold uppercase leading-none tracking-[-0.05em]">
        {title}
      </h3>

      <p className="mt-5 leading-7 text-[#1f261f]/65">{text}</p>
    </div>
  );
}

function CountdownBox({ number, label }) {
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.06] p-5 text-center">
      <p className="editorial-number text-5xl font-extrabold tracking-[-0.07em] text-[#f4efe7]">
        {String(number).padStart(2, "0")}
      </p>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white/50">
        {label}
      </p>
    </div>
  );
}

function Timeline({ time, title, text }) {
  return (
    <div className="reveal-on-scroll grid gap-4 border-b border-[#1f261f]/10 bg-[#f4efe7]/50 p-6 last:border-b-0 md:grid-cols-[140px_1fr] md:p-8">
      <p className="editorial-number text-3xl font-extrabold tracking-[-0.06em] text-[#8f9f8a]">
        {time}
      </p>

      <div>
        <h3 className="text-3xl font-extrabold uppercase leading-none tracking-[-0.05em]">
          {title}
        </h3>
        <p className="mt-3 leading-7 text-[#1f261f]/65">{text}</p>
      </div>
    </div>
  );
}

function VenueCard({ label, title, text, cta }) {
  return (
    <div className="reveal-on-scroll rounded-[2rem] border border-white/20 bg-white/15 p-7 text-white backdrop-blur transition hover:-translate-y-1 hover:bg-white/20">
      <p className="text-xs font-bold uppercase tracking-[0.35em] text-white/60">
        {label}
      </p>

      <h3 className="mt-5 text-3xl font-extrabold uppercase leading-none tracking-[-0.05em]">
        {title}
      </h3>

      <p className="mt-5 leading-7 text-white/75">{text}</p>

      <p className="mt-8 text-xs font-bold uppercase tracking-[0.3em] text-white">
        {cta}
      </p>
    </div>
  );
}
