import { useState, useEffect } from "react";
import igrejaImg from "./assets/igreja.png";
import casalLineImg from "./assets/casal-line.png";
import EnvelopeLeft from "./assets/envelope-left.png";
import EnvelopeRight from "./assets/envelope-right.png";
import { useParams } from "react-router-dom";
import { supabase } from "./lib/supabase";

const customStyles = `
@keyframes goldLineGlow {
  0%, 100% {
    box-shadow:
      0 0 4px rgba(194,164,95,.25),
      0 0 10px rgba(194,164,95,.10);
  }
  50% {
    box-shadow:
      0 0 8px rgba(247,223,157,.55),
      0 0 18px rgba(194,164,95,.28);
  }
}

  @keyframes goldShimmer {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }

  .gold-text {
    background: linear-gradient(105deg, #8f7036, #c2a45f, #f7df9d, #c2a45f, #8f7036);
    background-size: 240% 240%;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    animation: goldShimmer 5.5s ease-in-out infinite;
  }

  .gold-surface {
    background: linear-gradient(135deg, rgba(143,112,54,.95), rgba(194,164,95,.95), rgba(247,223,157,.88), rgba(194,164,95,.95));
    background-size: 220% 220%;
    animation: goldShimmer 6s ease-in-out infinite;
  }

.gold-timeline-line {
  background: linear-gradient(
    to bottom,
    rgba(155,127,66,.35),
    rgba(194,164,95,.95),
    rgba(247,223,157,.85),
    rgba(194,164,95,.95),
    rgba(155,127,66,.35)
  );
  animation: goldLineGlow 4.8s ease-in-out infinite;
}

@keyframes goldShine {
  0% {
    background-position: 0% 50%;
    filter: drop-shadow(0 0 2px rgba(194,164,95,.18));
  }
  50% {
    background-position: 100% 50%;
    filter:
      drop-shadow(0 0 7px rgba(255,226,150,.42))
      drop-shadow(0 0 16px rgba(194,164,95,.22));
  }
  100% {
    background-position: 0% 50%;
    filter: drop-shadow(0 0 2px rgba(194,164,95,.18));
  }
}

.gold-shine {
  background: linear-gradient(
    105deg,
    #9b7f42 0%,
    #c2a45f 28%,
    #f7df9d 48%,
    #c2a45f 65%,
    #8f7036 100%
  );
  background-size: 220% 220%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: goldShine 4.8s ease-in-out infinite;
}

  .paper-texture {
    background-image:
      radial-gradient(circle at 18% 20%, rgba(255,255,255,.72) 0 1px, transparent 1px),
      radial-gradient(circle at 70% 35%, rgba(138,151,132,.18) 0 1px, transparent 1px),
      linear-gradient(135deg, rgba(255,255,255,.38), transparent 42%);
    background-size: 18px 18px, 26px 26px, 100% 100%;
  }

  .floral-pattern {
    background-image:
      radial-gradient(ellipse at center, transparent 42%, rgba(138,151,132,.18) 43%, transparent 46%),
      radial-gradient(ellipse at center, transparent 42%, rgba(138,151,132,.15) 43%, transparent 46%);
    background-size: 84px 58px, 72px 52px;
    background-position: 0 0, 36px 26px;
  }

  .ornament-line {
    background: linear-gradient(90deg, transparent, rgba(194,164,95,.85), transparent);
  }

  .luxury-card {
    background:
      radial-gradient(circle at top left, rgba(255,255,255,.78), transparent 34%),
      linear-gradient(145deg, rgba(255,255,255,.66), rgba(248,244,236,.92));
  }

  .subtle-grid {
    background-image:
      linear-gradient(rgba(194,164,95,.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(194,164,95,.08) 1px, transparent 1px);
    background-size: 54px 54px;
  }

  .script-shadow {
    text-shadow: 0 18px 40px rgba(138,151,132,.18);
  }

  .leaf-stem {
    background:
      radial-gradient(ellipse at 45% 18%, rgba(138,151,132,.26) 0 9px, transparent 10px),
      radial-gradient(ellipse at 58% 34%, rgba(138,151,132,.22) 0 8px, transparent 9px),
      radial-gradient(ellipse at 40% 52%, rgba(138,151,132,.18) 0 7px, transparent 8px),
      linear-gradient(105deg, transparent 49%, rgba(138,151,132,.34) 50%, transparent 51%);
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
    
  @keyframes pageEnter {
    from {
      opacity: 0;
      transform: translateY(18px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .page-enter {
    animation: pageEnter 900ms ease both;
  }

  @keyframes titleReveal {
    from {
      opacity: 0;
      transform: translateY(24px);
      letter-spacing: -0.08em;
    }
    to {
      opacity: 1;
      transform: translateY(0);
      letter-spacing: -0.05em;
    }
  }

  .title-reveal {
    animation: titleReveal 1100ms cubic-bezier(.22,1,.36,1) both;
  }

  @keyframes goldGlow {
    0%, 100% {
      filter:
        drop-shadow(0 0 0px rgba(194,164,95,0))
        drop-shadow(0 6px 18px rgba(194,164,95,.12));
    }

    50% {
      filter:
        drop-shadow(0 0 4px rgba(194,164,95,.18))
        drop-shadow(0 8px 22px rgba(194,164,95,.18));
    }
  }

  .gold-glow {
    display: block;
    color: #c2a45f;
    animation: goldGlow 4.8s ease-in-out infinite;
  }

  @keyframes softUp {
    from {
      opacity: 0;
      transform: translateY(26px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .soft-up {
    animation: softUp 900ms ease both;
  }

  @keyframes countdownFlip {
    from {
      transform: translateY(8px);
      opacity: .4;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .countdown-number {
    animation: countdownFlip .4s ease;
  }

  .ornament-divider {
    height: 1px;
    background: linear-gradient(
      to right,
      transparent,
      rgba(194,164,95,0.35),
      transparent
    );
  }

  @keyframes floatCard {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-8px);
    }
  }

  .float-card {
    animation: floatCard 7s ease-in-out infinite;
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

  .reveal-delay-1 {
    transition-delay: 120ms;
  }

  .reveal-delay-2 {
    transition-delay: 220ms;
  }

  .reveal-delay-3 {
    transition-delay: 320ms;
  }

  .reveal-delay-4 {
    transition-delay: 420ms;
  }

  .reveal-delay-5 {
    transition-delay: 520ms;
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

function CountdownDivider() {
  return (
    <span className="hidden h-12 w-px bg-gradient-to-b from-transparent via-[#f0dfb6]/50 to-transparent sm:block" />
  );
}

function SectionNav() {
  return (
    <header className="relative z-40 border-y border-[#cfc6b6]/70 bg-[#f8f4ec]/85 px-4 py-3 backdrop-blur-md">
      <nav className="mx-auto grid max-w-6xl grid-cols-2 gap-2 text-center text-[10px] uppercase tracking-[0.16em] text-[#6c5b4a] sm:flex sm:items-center sm:justify-center sm:gap-3 sm:text-[11px] sm:tracking-[0.24em]">
        <a
          href="#detalhes"
          className="rounded-full px-3 py-2 transition hover:bg-[#d9dfcf] hover:text-[#3b3228]"
        >
          Detalhes
        </a>

        <a
          href="#programa"
          className="rounded-full px-3 py-2 transition hover:bg-[#d9dfcf] hover:text-[#3b3228]"
        >
          Programa
        </a>

        <a
          href="#locais"
          className="rounded-full px-3 py-2 transition hover:bg-[#d9dfcf] hover:text-[#3b3228]"
        >
          Locais
        </a>

        <a
          href="#rsvp"
          className="rounded-full bg-[#8a9784] px-3 py-2 text-white transition hover:bg-[#c2a45f]"
        >
          Confirmações
        </a>
      </nav>
    </header>
  );
}

export default function WeddingWebsite() {
  const [isOpen, setIsOpen] = useState(true);
  const [isOpening, setIsOpening] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hasGuests, setHasGuests] = useState(false);

  const [submitStatus, setSubmitStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const weddingDateTime = new Date("2026-09-26T11:30:00");
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining());

  const { guestSlug } = useParams();

  const guestName = guestSlug ? guests[guestSlug] : null;

  const [name, setName] = useState(guestName ?? "");
  const [contact, setContact] = useState("");
  const [attending, setAttending] = useState("yes");
  const [guestsCount, setGuestsCount] = useState("");
  const [guestsNames, setGuestsNames] = useState("");
  const [notes, setNotes] = useState("");

  async function submitRSVP(data) {
    const { error } = await supabase.from("rsvp").insert([data]);

    if (error) {
      console.error(error);
      return false;
    }

    return true;
  }

  useEffect(() => {
    if (guestName) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(guestName);
    }
  }, [guestName]);

  function getTimeRemaining() {
    const total = weddingDateTime - new Date();

    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((total / (1000 * 60)) % 60);
    const seconds = Math.floor((total / 1000) % 60);

    return { days, hours, minutes, seconds };
  }

  const weddingDate = "26 de setembro de 2026";

  useRevealOnScroll();

  useEffect(() => {
    const shouldLockScroll = isMobile && !isOpen;

    if (shouldLockScroll) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }

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

  function openInvitation() {
    setIsOpening(true);
    window.setTimeout(() => {
      setIsOpen(true);
    }, 900);
  }

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  }, [isMobile]);

  return (
    <main className="min-h-screen bg-[#e8e4de] text-[#3b3228]">
      <style>{customStyles}</style>
      {isMobile && !isOpen && (
        <section
          // }`}
          className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-transparent ${
            isOpening ? "pointer-events-none" : ""
          }`}
        >
          <div className="absolute inset-0 perspective-[1600px]">
            <div
              className="relative h-screen w-full cursor-pointer overflow-hidden"
              onClick={openInvitation}
            >
              {/* LEFT */}
              <img
                src={EnvelopeLeft}
                alt=""
                className={`absolute left-0 top-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(.22,1,.36,1)]
      ${isOpening ? "-translate-x-full" : "translate-x-0"}
    `}
              />

              {/* RIGHT */}
              <img
                src={EnvelopeRight}
                alt=""
                className={`absolute left-0 top-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(.22,1,.36,1)]
      ${isOpening ? "translate-x-full" : "translate-x-0"}
    `}
              />

              {!isOpening && (
                <div className="envelope-hint pointer-events-none absolute bottom-[84vh] left-1/2 z-20 -translate-x-1/2 text-center">
                  <div className="rounded-full border border-[#d6b98c]/40 bg-[#f8f4ec]/65 px-5 py-2.5 shadow-md backdrop-blur-sm">
                    <p className="text-[12px] uppercase tracking-[0.32em] text-[#9b7f42]">
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
        <div className="ornament-divider" />
        <section className="relative min-h-screen overflow-hidden px-6 py-16 md:py-20">
          <div className="absolute inset-0 bg-[#e8e4de]" />
          <div className="absolute inset-0 subtle-grid opacity-60" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,.95),transparent_28%),radial-gradient(circle_at_85%_75%,rgba(217,223,207,.9),transparent_30%)]" />
          <div className="leaf-stem absolute left-8 top-24 h-72 w-40 -rotate-12 opacity-35" />
          <div className="leaf-stem absolute bottom-16 right-10 h-72 w-40 rotate-[155deg] opacity-30" />

          <div className="relative z-10 mx-auto flex min-h-[calc(100vh-8rem)] max-w-7xl flex-col justify-center">
            <div className="grid items-center gap-14 lg:grid-cols-[1fr_0.9fr]">
              <div className="relative text-center lg:text-left">
                <div className="mb-8 flex items-center justify-center gap-4 lg:justify-start">
                  <span className="h-px w-14 bg-[#c2a45f]" />
                  <p className="gold-shine text-xs uppercase tracking-[0.42em] text-[#9b7f42]">
                    Wedding celebration
                  </p>
                  <span className="h-px w-14 bg-[#c2a45f] lg:hidden" />
                </div>

                <h1 className="handwritten text-7xl leading-none text-[#3b3228] md:text-9xl lg:text-[10rem]">
                  <span className="script-shadow block">Francisca</span>
                  <span className="gold-glow mt-3 block">& Daniel</span>
                </h1>

                <div className="mx-auto mt-8 h-px w-40 ornament-line lg:mx-0" />

                <p className="mx-auto mt-8 max-w-xl text-lg leading-8 text-[#6c5b4a] lg:mx-0">
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

                <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-[#6c5b4a] lg:justify-start">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-[#9b7f42]">
                      Data
                    </p>
                    <p className="mt-1 text-lg font-medium text-[#3b3228]">
                      26.09.2026
                    </p>
                  </div>

                  <span className="hidden h-10 w-px bg-[#c2a45f]/40 sm:block" />

                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-[#9b7f42]">
                      Cerimónia
                    </p>
                    <p className="mt-1 text-lg font-medium text-[#3b3228]">
                      11h30
                    </p>
                  </div>

                  <span className="hidden h-10 w-px bg-[#c2a45f]/40 sm:block" />

                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-[#9b7f42]">
                      Local
                    </p>
                    <p className="mt-1 text-lg font-medium text-[#3b3228]">
                      Santa Iria da Azóia
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative mx-auto flex w-full max-w-[520px] justify-center">
                <div className="absolute inset-0 rounded-full bg-white/40 blur-3xl" />

                <div className="relative text-center">
                  <img
                    src={casalLineImg}
                    alt="Desenho de linha de Francisca e Daniel"
                    className="mx-auto w-[260px] max-w-full opacity-80 mix-blend-multiply md:w-[340px]"
                  />

                  <div className="mx-auto mt-8 max-w-xs">
                    <p className="text-xs uppercase tracking-[0.42em] text-[#8a9784]">
                      Save the date
                    </p>

                    <p className="gold-shine not-even:handwritten mt-3 text-5xl leading-none text-[#c2a45f] md:text-6xl">
                      26 de setembro
                    </p>

                    <p className="mt-3 text-sm uppercase tracking-[0.35em] text-[#9b7f42]">
                      sábado · 2026
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <SectionNav />

        <div className="ornament-divider" />
        <section id="detalhes" className="relative overflow-hidden px-6 py-24">
          <div className="absolute inset-0 bg-[#f8f4ec]" />
          <img
            src={igrejaImg}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-[0.12] mix-blend-multiply"
          />
          <div className="absolute inset-x-0 top-0 h-px ornament-line" />
          <div className="relative mx-auto max-w-6xl ">
            <div className="relative mx-auto mb-16 max-w-3xl text-center">
              <div className="relative z-10">
                <p className="mb-4 text-xs uppercase tracking-[0.45em] text-[#c2a45f]">
                  O nosso dia
                </p>

                <h2 className="handwritten text-5xl leading-tight md:text-7xl">
                  Uma celebração feita de detalhes.
                </h2>

                <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#6c5b4a]">
                  Queremos que este seja um dia leve, bonito e cheio de momentos
                  para guardar. Aqui ficam os principais detalhes da celebração.
                </p>
              </div>
            </div>
            <div className="grid items-stretch gap-6 md:grid-cols-3">
              <div className="reveal-on-scroll reveal-delay-1">
                <FeatureCard
                  number="01"
                  icon="⛪"
                  title="Cerimónia"
                  text="Às 11h30, na Paróquia de Santa Iria da Azóia, onde vamos trocar os nossos votos rodeados por quem mais amamos."
                />
              </div>
              <div className="reveal-on-scroll reveal-delay-2">
                <FeatureCard
                  number="02"
                  icon="🥂"
                  title="Cocktail"
                  text="Às 14h00, um momento para brindar, conversar e começar a celebrar em conjunto."
                />
              </div>
              <div className="reveal-on-scroll reveal-delay-3">
                <FeatureCard
                  number="03"
                  icon="✦"
                  title="Festa"
                  text="Música, dança e uma noite inesquecível com todos vocês."
                />
              </div>
            </div>
          </div>
        </section>

        <div className="ornament-divider" />
        <section
          id="countdown"
          className="relative isolate overflow-hidden bg-[#8a9784] px-6 py-28 text-white"
        >
          <div className="absolute inset-0 floral-pattern opacity-[0.1]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_25%,rgba(255,255,255,.18),transparent_30%),radial-gradient(circle_at_85%_75%,rgba(194,164,95,.25),transparent_32%)]" />

          <div className="relative z-10 mx-auto max-w-6xl reveal-on-scroll">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-5 text-xs uppercase tracking-[0.5em] text-[#f0dfb6]">
                Countdown
              </p>

              <h2 className="handwritten text-5xl leading-tight md:text-7xl">
                Estamos quase a dizer “sim”.
              </h2>

              <div className="mx-auto my-8 h-px w-32 bg-gradient-to-r from-transparent via-[#f0dfb6] to-transparent" />

              <p className="mx-auto max-w-xl leading-7 text-white/75">
                Até lá, guardem esta data com carinho. Queremos muito partilhar
                este momento convosco.
              </p>
            </div>
            <div className="mx-auto mt-14 flex max-w-4xl flex-wrap items-center justify-center gap-x-8 gap-y-8 md:gap-x-14">
              <CountdownBox number={timeLeft.days} label="Dias" />
              <CountdownDivider />
              <CountdownBox number={timeLeft.hours} label="Horas" />
              <CountdownDivider />
              <CountdownBox number={timeLeft.minutes} label="Minutos" />
              <CountdownDivider />
              <CountdownBox number={timeLeft.seconds} label="Segundos" />
            </div>
            <div className="mx-auto mt-14 flex max-w-xl items-center justify-center gap-4 text-center">
              <span className="h-px flex-1 bg-white/20" />
              <p className="font-serif text-3xl text-[#f0dfb6]">26.09.2026</p>
              <span className="h-px flex-1 bg-white/20" />
            </div>
          </div>
        </section>

        <div className="ornament-divider" />
        <section
          id="programa"
          className="relative isolate overflow-hidden px-6 py-28"
        >
          <div className="absolute inset-0 bg-[#f3eee5]" />

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(255,255,255,.95),transparent_36%),radial-gradient(circle_at_12%_78%,rgba(138,151,132,.22),transparent_30%),radial-gradient(circle_at_88%_72%,rgba(194,164,95,.20),transparent_28%)]" />

          <div className="absolute inset-0 floral-pattern opacity-[0.16]" />

          <div className="absolute left-[-80px] top-[80px] h-[520px] w-[300px] -rotate-12 opacity-[0.24] leaf-stem" />

          <div className="absolute right-[-90px] bottom-[20px] h-[520px] w-[300px] rotate-[168deg] opacity-[0.20] leaf-stem" />

          <div className="absolute inset-x-0 top-0 h-px ornament-line opacity-70" />
          <div className="absolute inset-x-0 bottom-0 h-px ornament-line opacity-50" />

          <div className="leaf-stem absolute right-[-60px] top-[120px] h-[420px] w-[240px] rotate-[168deg] opacity-[0.12]" />

          <div className="relative z-10 mx-auto max-w-5xl ">
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <p className="mb-4 text-xs uppercase tracking-[0.45em] text-[#c2a45f]">
                Programa
              </p>

              <h2 className="handwritten text-5xl leading-tight md:text-7xl">
                O ritmo do dia
              </h2>

              <div className="mx-auto my-7 h-px w-32 ornament-line" />

              <p className="mx-auto max-w-xl text-[#6c5b4a]">
                Os principais momentos da celebração, para viverem connosco cada
                detalhe deste dia especial.
              </p>
            </div>
            <div className="relative mx-auto max-w-3xl px-2 md:px-8">
              <div className="gold-timeline-line absolute left-3 top-0 h-full w-px md:left-1/2 md:-translate-x-1/2" />
              <div className="space-y-12 md:space-y-16">
                <Timeline
                  side="left"
                  time="11:00"
                  icon="✦"
                  title="Chegada dos convidados"
                  text="Receção junto à cerimónia."
                />

                <Timeline
                  side="right"
                  time="11:30"
                  icon="⛪"
                  title="Cerimónia"
                  text="O momento em que dizemos sim."
                />

                <Timeline
                  side="left"
                  time="14:00"
                  icon="🥂"
                  title="Cocktail"
                  text="Brindes, conversas e primeiros abraços."
                />

                <Timeline
                  side="right"
                  time="20:00"
                  icon="🍽️"
                  title="Jantar"
                  text="À mesa, com todos os que fazem parte da nossa história."
                />

                <Timeline
                  side="left"
                  time="22:30"
                  icon="✨"
                  title="Festa"
                  text="Música, dança e memórias para guardar."
                />
              </div>
            </div>
          </div>
        </section>

        <div className="ornament-divider" />
        <section
          id="locais"
          className="relative isolate overflow-hidden bg-[#8a9784] px-6 py-28 text-white"
        >
          <div className="absolute inset-0 floral-pattern opacity-[0.1]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_25%,rgba(255,255,255,.18),transparent_30%),radial-gradient(circle_at_85%_75%,rgba(194,164,95,.25),transparent_32%)]" />

          <div className="relative z-10 mx-auto grid max-w-6xl gap-12 md:grid-cols-[0.75fr_1.25fr] md:items-center reveal-on-scroll">
            {" "}
            <div>
              <p className="mb-4 text-xs uppercase tracking-[0.45em] text-[#f0dfb6]">
                Locais
              </p>

              <h2 className="handwritten text-5xl leading-tight md:text-7xl">
                Onde tudo acontece
              </h2>

              <div className="my-7 h-px w-32 bg-gradient-to-r from-[#d6b98c] to-transparent" />

              <p className="max-w-lg leading-7 text-white/75">
                Dois momentos, o mesmo dia especial. Primeiro a cerimónia,
                depois a celebração.
              </p>
            </div>
            <div className="grid gap-5">
              <VenueCard
                eyebrow="Cerimónia"
                icon="⛪"
                title={
                  <>
                    Paróquia de Santa Iria
                    <br />
                    da Azóia
                  </>
                }
                text="O lugar onde vamos dar início a este novo capítulo, rodeados pela nossa família e amigos."
                cta="Ver localização"
              />

              <VenueCard
                eyebrow="Celebração"
                icon="🥂"
                title={
                  <>
                    <span className="md:hidden">
                      Cocktail,
                      <br />
                      jantar,
                      <br />e festa!
                    </span>

                    <span className="hidden md:inline">
                      Cocktail, jantar e festa!
                    </span>
                  </>
                }
                text="Depois da cerimónia, continuamos o dia com brindes, comida, música e muitas memórias para guardar."
                cta="Mais detalhes em breve"
              />
            </div>
          </div>
        </section>

        <div className="ornament-divider" />
        <section id="rsvp" className="px-6 py-28">
          <div className="luxury-card paper-texture reveal-on-scroll mx-auto max-w-6xl overflow-hidden rounded-[3.2rem] border border-[#cfc6b6] shadow-2xl md:grid md:grid-cols-[0.92fr_1.08fr]">
            <div className="relative flex min-h-[460px] items-center justify-center overflow-hidden bg-[#8a9784] p-10 text-center text-white">
              <div className="absolute inset-0 floral-pattern opacity-20" />
              <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
              <div className="relative">
                <p className="mb-4 text-xs uppercase tracking-[0.45em] text-[#d6b98c]">
                  RSVP
                </p>
                <h2 className="handwritten text-5xl leading-tight md:text-7xl">
                  Confirmem a vossa presença
                </h2>
                <div className="mx-auto my-8 h-px w-28 bg-[#d6b98c]" />
                <p className="mx-auto max-w-sm text-white/75">
                  A vossa presença é o nosso melhor presente.
                </p>
              </div>
            </div>
            <div className="bg-white/88 p-8 md:p-12">
              <div className="mb-8 flex items-center justify-center gap-4 text-center">
                <span className="h-px flex-1 bg-[#c2a45f]/30" />
                <p className="font-serif text-lg text-[#9b7f42]">
                  Confirmar até 15.08.2026
                </p>
                <span className="h-px flex-1 bg-[#c2a45f]/30" />
              </div>

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

                  if (success) {
                    setSubmitStatus(
                      attending === "yes" ? "attending" : "not-attending",
                    );
                  } else {
                    setSubmitStatus("error");
                  }
                }}
              >
                {/* Nome */}
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  readOnly={!!guestName}
                  placeholder="Nome"
                  className="w-full rounded-2xl border border-[#cfc6b6] bg-[#f8f4ec]/50 px-5 py-4 outline-none focus:border-[#c2a45f]"
                />

                {/* Contacto */}
                <input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full rounded-2xl border border-[#cfc6b6] bg-[#f8f4ec]/50 px-5 py-4 outline-none focus:border-[#c2a45f]"
                  placeholder="Email ou contacto"
                  required
                />

                {/* Presença */}
                <select
                  value={attending}
                  onChange={(e) => setAttending(e.target.value)}
                  className="w-full rounded-2xl border border-[#cfc6b6] bg-[#f8f4ec]/50 px-5 py-4 outline-none focus:border-[#c2a45f]"
                >
                  <option value="yes">Vou estar presente</option>
                  <option value="no">Infelizmente não poderei ir</option>
                </select>

                {/* Acompanhantes */}
                {attending === "yes" && (
                  <>
                    <select
                      onChange={(e) =>
                        setHasGuests(e.target.value === "acompanha")
                      }
                      className="w-full rounded-2xl border border-[#cfc6b6] bg-[#f8f4ec]/50 px-5 py-4 outline-none focus:border-[#c2a45f]"
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
                          className="w-full rounded-2xl border border-[#cfc6b6] bg-[#f8f4ec]/50 px-5 py-4 outline-none focus:border-[#c2a45f]"
                        />

                        <textarea
                          value={guestsNames}
                          onChange={(e) => setGuestsNames(e.target.value)}
                          placeholder="Nome dos acompanhantes"
                          className="min-h-20 w-full rounded-2xl border border-[#cfc6b6] bg-[#f8f4ec]/50 px-5 py-4 outline-none focus:border-[#c2a45f]"
                        />
                      </>
                    )}
                  </>
                )}

                {/* Notas */}
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-28 w-full rounded-2xl border border-[#cfc6b6] bg-[#f8f4ec]/50 px-5 py-4 outline-none focus:border-[#c2a45f]"
                  placeholder="Mensagem, alergias ou notas importantes"
                />

                {submitStatus && (
                  <div className="rounded-[1.6rem] border border-[#cfc6b6] bg-[#f8f4ec]/70 px-5 py-4 text-center shadow-sm">
                    {submitStatus === "attending" && (
                      <>
                        <p className="font-serif text-2xl text-[#8a9784]">
                          Que alegria! 💛
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[#6c5b4a]">
                          A vossa presença ficou confirmada. Estamos muito
                          felizes por partilhar este dia convosco.
                        </p>
                      </>
                    )}

                    {submitStatus === "not-attending" && (
                      <>
                        <p className="font-serif text-2xl text-[#9b7f42]">
                          Vamos sentir a vossa falta 🤍
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[#6c5b4a]">
                          Obrigado por nos avisarem. Mesmo não estando
                          presentes, estarão connosco neste dia especial.
                        </p>
                      </>
                    )}

                    {submitStatus === "missing-contact" && (
                      <p className="text-sm text-[#9b4a3f]">
                        Por favor indica um contacto antes de enviar.
                      </p>
                    )}

                    {submitStatus === "error" && (
                      <p className="text-sm text-[#9b4a3f]">
                        Não foi possível enviar a confirmação. Tenta novamente.
                      </p>
                    )}
                  </div>
                )}

                {/* Botão */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="gold-surface w-full rounded-full px-8 py-4 text-sm uppercase tracking-[0.25em] text-white shadow-lg transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "A enviar..." : "Enviar confirmação"}
                </button>
              </form>
            </div>
          </div>
        </section>

        <footer className="border-t border-[#cfc6b6] px-6 pb-28 pt-14 text-center md:pb-14">
          {" "}
          <p className="glow-shine font-serif text-3xl text-[#c2a45f]">F · D</p>
          <p className="mt-3 text-sm text-[#6c5b4a]">
            Francisca & Daniel · {weddingDate}
          </p>
          <p className="mt-4 inline-flex items-center gap-2 text-sm text-[#6c5b4a]">
            ✉ casamento.franciscadaniel@gmail.com
          </p>
        </footer>
      </div>
    </main>
  );
}

function FeatureCard({ number, icon, title, text }) {
  return (
    <div className="group relative flex h-full min-h-[300px] flex-col overflow-hidden rounded-[2.4rem] border border-[#cfc6b6] bg-white/60 p-8 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-xl">
      <div className="absolute right-6 top-5 text-6xl font-semibold text-[#c2a45f]/10">
        {number}
      </div>

      <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-full bg-[#d9dfcf] text-2xl text-[#c2a45f] shadow-inner">
        {icon}
      </div>

      <h3 className="handwritten text-4xl md:text-5xl">{title}</h3>

      <p className="mt-5 flex-1 leading-7 text-[#6c5b4a]">{text}</p>

      <div className="mt-8 h-px w-20 bg-[#c2a45f]/45 transition group-hover:w-32" />
    </div>
  );
}
function VenueCard({ eyebrow, icon, title, text, cta }) {
  return (
    <div className="group relative overflow-hidden rounded-[2.4rem] border border-white/15 bg-white/[0.11] p-8 pr-24 shadow-2xl backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/[0.16] md:p-10 md:pr-28">
      <div className="pointer-events-none absolute right-9 top-8 font-serif text-7xl text-[#f0dfb6]/20">
        {icon}
      </div>

      <p className="mb-5 text-xs uppercase tracking-[0.42em] text-[#f0dfb6]">
        {eyebrow}
      </p>

      <h3 className="relative max-w-[430px] font-serif text-3xl leading-tight text-white md:text-4xl">
        {title}
      </h3>

      <p className="relative mt-5 max-w-md leading-7 text-white/75">{text}</p>

      <div className="relative mt-8 flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-[#f0dfb6]">
        <span className="h-px w-12 bg-[#d6b98c]/70 transition group-hover:w-20" />
        {cta}
      </div>
    </div>
  );
}

function CountdownBox({ number, label }) {
  return (
    <div className="min-w-[96px] text-center">
      <div className="countdown-number  text-6xl leading-none text-[#f8ead0] drop-shadow-[0_2px_10px_rgba(0,0,0,0.20)] md:text-7xl">
        {String(number).padStart(2, "0")}
      </div>

      <div className="mt-3 text-[10px] uppercase tracking-[0.35em] text-white/75">
        {label}
      </div>
    </div>
  );
}

function Timeline({ time, icon, title, text, side = "left" }) {
  const isLeft = side === "left";

  return (
    <div className="reveal-on-scroll relative">
      {/* Mobile */}
      <div className="relative pl-10 md:hidden">
        <div className="absolute left-0 top-1 h-full w-px bg-[#3b3228]/35" />
        <span className="absolute left-[-7px] top-1 h-4 w-4 rounded-full bg-[#c2a45f] shadow-[0_0_12px_rgba(194,164,95,.55)]" />
        <div className="flex items-center gap-3">
          <span className="text-xl text-[#3b3228]">{icon}</span>
          <span className="text-sm uppercase tracking-[0.35em] text-[#9b7f42]">
            {time}
          </span>
        </div>

        <h3 className="handwritten mt-2 text-4xl leading-none text-[#3b3228]">
          {title}
        </h3>

        <div className="mt-3 h-px w-28 border-t border-dotted border-[#3b3228]/50" />

        <p className="mt-3 text-sm leading-6 text-[#6c5b4a]">{text}</p>
      </div>

      {/* Desktop */}
      <div className="hidden items-center gap-5 md:grid md:grid-cols-[1fr_72px_1fr]">
        <div className={`text-right ${isLeft ? "block" : "invisible"}`}>
          <TimelineContent
            align="right"
            time={time}
            icon={icon}
            title={title}
            text={text}
          />
        </div>

        <div className="relative flex justify-center">
          <span className="relative z-10 h-4 w-4 rounded-full bg-[#c2a45f] shadow-[0_0_12px_rgba(194,164,95,.55)]" />{" "}
        </div>

        <div className={`text-left ${!isLeft ? "block" : "invisible"}`}>
          <TimelineContent
            align="left"
            time={time}
            icon={icon}
            title={title}
            text={text}
          />
        </div>
      </div>
    </div>
  );
}

function TimelineContent({ align, time, icon, title, text }) {
  const isRight = align === "right";

  return (
    <>
      <div
        className={`flex items-center gap-3 ${
          isRight ? "justify-end" : "justify-start"
        }`}
      >
        <span className="text-xl text-[#3b3228]">{icon}</span>
        <span className="text-sm uppercase tracking-[0.35em] text-[#9b7f42]">
          {time}
        </span>
      </div>

      <h3 className="handwritten mt-2 text-5xl leading-none text-[#3b3228]">
        {title}
      </h3>

      <div
        className={`mt-3 h-px w-36 border-t border-dotted border-[#3b3228]/60 ${
          isRight ? "ml-auto" : ""
        }`}
      />

      <p className="mt-3 text-sm leading-6 text-[#6c5b4a]">{text}</p>
    </>
  );
}
