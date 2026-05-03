import { useState, useEffect } from "react";
import casalLineImg from "./assets/casal-line.png";
import Envelope from "./assets/envelope.jpeg";
import { useParams } from "react-router-dom";
import { supabase } from "./lib/supabase";

const customStyles = `
@import url("https://fonts.googleapis.com/css2?family=Urbanist:wght@300;400;500;600;700;800&display=swap");

:root {
  --bg: #fbfaf5;
  --green: #b7c4b0;
  --green-dark: #8f9f8a;
  --gold: #cdb892;
  --gold-soft: rgba(205, 184, 146, 0.42);
}

* {
  font-family: "Urbanist", Arial, Helvetica, sans-serif;
}

@keyframes contentFocusIn {
  0% {
    opacity: 0;
    filter: blur(28px);
    transform: scale(1.04);
  }

  55% {
    opacity: 0.45;
    filter: blur(18px);
    transform: scale(1.025);
  }

  100% {
    opacity: 1;
    filter: blur(0);
    transform: scale(1);
  }
}

@keyframes softEnter {
  from {
    opacity: 0;
    transform: translateY(18px);
    filter: blur(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
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

.content-focus-in {
  animation: contentFocusIn 1200ms cubic-bezier(.22,1,.36,1) both;
}

.page-enter {
  animation: softEnter 900ms ease both;
}

.envelope-hint {
  animation: tapHint 2.4s ease-in-out infinite;
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
  transform: translateY(28px);
  transition:
    opacity 900ms ease,
    transform 900ms cubic-bezier(.22,1,.36,1);
}

.reveal-on-scroll.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.page-bg {
  background:
    radial-gradient(circle at 20% 8%, rgba(183,196,176,.18), transparent 28%),
    radial-gradient(circle at 86% 38%, rgba(183,196,176,.12), transparent 26%),
    #fbfaf5;
}

.section-hero {
  background:
    radial-gradient(circle at 22% 8%, rgba(183,196,176,.24), transparent 30%),
    radial-gradient(circle at 82% 70%, rgba(205,184,146,.13), transparent 28%),
    #fbfaf5;
}

.section-light {
  background:
    radial-gradient(circle at 12% 20%, rgba(183,196,176,.16), transparent 28%),
    #fbfaf5;
}

.section-cream {
  background:
    radial-gradient(circle at 82% 18%, rgba(205,184,146,.16), transparent 28%),
    #f8f5ee;
}

.section-green {
  background:
    radial-gradient(circle at 20% 20%, rgba(255,255,255,.32), transparent 30%),
    #eef3ea;
}

.section-soft {
  background:
    radial-gradient(circle at 80% 26%, rgba(183,196,176,.24), transparent 30%),
    #f4f7f1;
}

.section-light {
  color: #8f9f8a;
}

.section-light h1,
.section-light h2,
.section-light h3 {
  color: #b7c4b0;
}

.section-green {
  color: #7f8f78;
}

.section-green h1,
.section-green h2,
.section-green h3 {
  color: #6f7f69;
}

.section-cream {
  color: #8f9f8a;
}

.section-cream h1,
.section-cream h2,
.section-cream h3 {
  color: #a99672;
}

.section-soft {
  color: #8f9f8a;
}

.section-soft h1,
.section-soft h2,
.section-soft h3 {
  color: #8f9f8a;
}

.section-green .gold-dot {
  background: #cdb892;
}

.section-green .gold-line {
  opacity: .8;
}

.section-green .minimal-field {
  border-bottom: 1px solid rgba(143,159,138,.45);
}

.section-green .minimal-field:focus {
  border-bottom-color: #cdb892;
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

.gold-dot {
  background: #cdb892;
  box-shadow:
    0 0 8px rgba(244, 227, 189, 0.65),
    0 0 18px rgba(205, 184, 146, 0.45);
}

.minimal-field {
  width: 100%;
  border: 0;
  border-bottom: 1px solid rgba(183,196,176,.55);
  background: transparent;
  padding: 1rem 0;
  outline: none;
  color: #8f9f8a;
}

.minimal-field::placeholder {
  color: rgba(143,159,138,.62);
}

.minimal-field:focus {
  border-bottom-color: #cdb892;
}

.minimal-select {
  appearance: none;
}

.soft-line {
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(183,196,176,.55), transparent);
}
`;

const guests = {
  "tia-elsa": "Tia Elsa",
  "avo-maria": "Avó Maria",
  "joao-e-ana": "João e Ana",
};

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

function SectionNav() {
  return (
    <header className="sticky top-0 z-40 bg-[#fbfaf5]/80 px-6 py-5 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between text-[10px] font-semibold uppercase tracking-[0.3em] text-[#b7c4b0]">
        <span>F · D</span>

        <div className="flex gap-4 sm:gap-8">
          <a href="#detalhes" className="transition hover:text-[#cdb892]">
            Detalhes
          </a>
          <a href="#programa" className="transition hover:text-[#cdb892]">
            Programa
          </a>
          <a href="#locais" className="transition hover:text-[#cdb892]">
            Locais
          </a>
          <a href="#rsvp" className="transition hover:text-[#cdb892]">
            RSVP
          </a>
        </div>
      </nav>
    </header>
  );
}

export default function WeddingWebsiteV3() {
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
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining);

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

  function getTimeRemaining() {
    const total = weddingDateTime - new Date();

    return {
      days: Math.max(0, Math.floor(total / (1000 * 60 * 60 * 24))),
      hours: Math.max(0, Math.floor((total / (1000 * 60 * 60)) % 24)),
      minutes: Math.max(0, Math.floor((total / (1000 * 60)) % 60)),
      seconds: Math.max(0, Math.floor((total / 1000) % 60)),
    };
  }

  async function submitRSVP(data) {
    const { error } = await supabase.from("rsvp").insert([data]);

    if (error) {
      console.error(error);
      return false;
    }

    return true;
  }

  function openInvitation() {
    setIsOpening(true);

    window.setTimeout(() => {
      setIsOpen(true);
    }, 2000);
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
    <main className="page-bg min-h-screen text-[#b7c4b0]">
      <style>{customStyles}</style>

      {isMobile && !isOpen && (
        <section
          className={`fixed inset-0 z-50 overflow-hidden ${
            isOpening ? "pointer-events-none bg-transparent" : "bg-[#fbfaf5]"
          }`}
        >
          <div
            className="relative h-screen w-full cursor-pointer overflow-hidden"
            onClick={openInvitation}
          >
            <img
              src={Envelope}
              alt=""
              className={`absolute inset-0 h-full w-full object-cover transition-all duration-[1400ms] ease-[cubic-bezier(.22,1,.36,1)] ${
                isOpening
                  ? "scale-[1.08] opacity-0 blur-2xl"
                  : "scale-100 opacity-100 blur-0"
              }`}
            />

            {!isOpening && (
              <div className="envelope-hint pointer-events-none absolute bottom-[84vh] left-1/2 z-20 -translate-x-1/2 text-center">
                <div className="rounded-full bg-[#fbfaf5]/75 px-5 py-2.5 backdrop-blur-sm">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.32em] text-[#8f9f8a]">
                    Toca para abrir
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <div
        className={`page-enter invitation-content ${
          isOpen || isOpening
            ? "invitation-content-visible"
            : "pointer-events-none opacity-0"
        } ${isOpening ? "content-focus-in" : ""}`}
      >
        <section className="section-hero flex min-h-screen flex-col justify-center px-6 py-24 text-center">
          <div className="mx-auto max-w-6xl">
            <p className="mb-8 text-xs font-semibold uppercase tracking-[0.5em] text-[#b7c4b0]">
              Wedding celebration
            </p>

            <h1 className="text-[4.8rem] font-extrabold uppercase leading-[0.82] tracking-[-0.09em] text-[#b7c4b0] md:text-[9rem] lg:text-[11rem]">
              Francisca
              <br />
              <span className="gold-accent">&</span>
              <br />
              Daniel
            </h1>

            <p className="mx-auto mt-10 max-w-2xl text-lg font-light leading-8 text-[#8f9f8a]">
              {guestName ? (
                <>
                  Querida/o {guestName}, queremos muito celebrar este dia
                  convosco.
                </>
              ) : (
                <>
                  Depois de tantas memórias, aventuras e sonhos partilhados,
                  chegou o momento de celebrar o nosso amor com as pessoas que
                  mais importam.
                </>
              )}
            </p>

            <div className="mx-auto mt-16 grid max-w-3xl gap-8 text-center text-xs font-semibold uppercase tracking-[0.34em] text-[#b7c4b0] sm:grid-cols-3">
              <HeroInfo label="Data" value="26.09.2026" />
              <HeroInfo label="Cerimónia" value="11h30" />
              <HeroInfo label="Local" value="Santa Iria da Azóia" />
            </div>

            <img
              src={casalLineImg}
              alt="Desenho de linha de Francisca e Daniel"
              className="mx-auto mt-20 w-[230px] opacity-35 mix-blend-multiply md:w-[300px]"
            />
          </div>
        </section>

        <SectionNav />

        <section id="detalhes" className="section-light px-6 py-24 md:py-32">
          <div className="mx-auto max-w-6xl">
            <MinimalHeader
              eyebrow="O nosso dia"
              title="Uma celebração feita de detalhes."
              text="Queremos que este seja um dia leve, bonito e cheio de momentos para guardar. Aqui ficam os principais detalhes da celebração."
            />

            <div className="mt-20 space-y-16">
              <MinimalDetail
                number="01"
                title="Cerimónia"
                text="Às 11h30, na Paróquia de Santa Iria da Azóia, onde vamos trocar os nossos votos rodeados por quem mais amamos."
              />

              <MinimalDetail
                number="02"
                title="Cocktail"
                text="Às 14h00, um momento para brindar, conversar e começar a celebrar em conjunto."
              />

              <MinimalDetail
                number="03"
                title="Festa"
                text="Música, dança e uma noite inesquecível com todos vocês."
              />
            </div>
          </div>
        </section>

        <section id="countdown" className="section-green px-6 py-24 md:py-32">
          <div className="mx-auto max-w-6xl">
            <MinimalHeader
              eyebrow="Countdown"
              title="Estamos quase a dizer sim."
              text="Até lá, guardem esta data com carinho. Queremos muito partilhar este momento convosco."
            />

            <div className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-x-8 gap-y-12 text-center sm:grid-cols-4">
              <CountdownBox number={timeLeft.days} label="Dias" />
              <CountdownBox number={timeLeft.hours} label="Horas" />
              <CountdownBox number={timeLeft.minutes} label="Minutos" />
              <CountdownBox number={timeLeft.seconds} label="Segundos" />
            </div>
          </div>
        </section>

        <section id="programa" className="section-cream px-6 py-24 md:py-32">
          <div className="mx-auto max-w-6xl">
            <MinimalHeader
              eyebrow="Programa"
              title="O ritmo do dia"
              text="Os principais momentos da celebração, para viverem connosco cada detalhe deste dia especial."
            />

            <div className="mt-20 space-y-12">
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

        <section id="locais" className="section-soft px-6 py-24 md:py-32">
          <div className="mx-auto max-w-6xl">
            <MinimalHeader
              eyebrow="Locais"
              title="Onde tudo acontece"
              text="Dois momentos, o mesmo dia especial. Primeiro a cerimónia, depois a celebração."
            />

            <div className="mt-20 grid gap-16 md:grid-cols-2">
              <VenueText
                label="Cerimónia"
                title="Paróquia de Santa Iria da Azóia"
                text="O lugar onde vamos dar início a este novo capítulo, rodeados pela nossa família e amigos."
                cta="Ver localização"
              />

              <VenueText
                label="Celebração"
                title="Cocktail, jantar e festa"
                text="Depois da cerimónia, continuamos o dia com brindes, comida, música e muitas memórias para guardar."
                cta="Mais detalhes em breve"
              />
            </div>
          </div>
        </section>

        <section id="rsvp" className="section-light px-6 py-24 md:py-32">
          <div className="mx-auto max-w-4xl">
            <div className="reveal-on-scroll text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.5em] text-[#b7c4b0]">
                RSVP
              </p>

              <div className="gold-line mx-auto mt-6 max-w-[180px]" />

              <h2 className="mt-8 text-5xl font-extrabold uppercase leading-[0.9] tracking-[-0.07em] text-[#b7c4b0] md:text-7xl">
                Confirmem a vossa presença
              </h2>

              <p className="mx-auto mt-8 max-w-xl text-lg font-light leading-8 text-[#8f9f8a]">
                A vossa presença é o nosso melhor presente. Confirmar até
                15.08.2026.
              </p>
            </div>

            <form
              className="mt-20 space-y-5"
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
                className="minimal-field"
              />

              <input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Email ou contacto"
                required
                className="minimal-field"
              />

              <select
                value={attending}
                onChange={(e) => setAttending(e.target.value)}
                className="minimal-field minimal-select"
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
                    className="minimal-field minimal-select"
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
                        className="minimal-field"
                      />

                      <textarea
                        value={guestsNames}
                        onChange={(e) => setGuestsNames(e.target.value)}
                        placeholder="Nome dos acompanhantes"
                        className="minimal-field min-h-24"
                      />
                    </>
                  )}
                </>
              )}

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Mensagem, alergias ou notas importantes"
                className="minimal-field min-h-28"
              />

              {submitStatus && (
                <p className="pt-6 text-center text-sm font-semibold text-[#8f9f8a]">
                  {submitStatus === "attending" &&
                    "Que alegria! A vossa presença ficou confirmada. 💛"}
                  {submitStatus === "not-attending" &&
                    "Vamos sentir a vossa falta. Obrigado por nos avisarem."}
                  {submitStatus === "missing-contact" &&
                    "Por favor indica um contacto antes de enviar."}
                  {submitStatus === "error" &&
                    "Não foi possível enviar a confirmação. Tenta novamente."}
                </p>
              )}

              <div className="pt-10 text-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-full border border-[#cdb892] px-10 py-4 text-xs font-bold uppercase tracking-[0.3em] text-[#cdb892] transition hover:bg-[#cdb892] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "A enviar..." : "Enviar confirmação"}
                </button>
              </div>
            </form>
          </div>
        </section>

        <footer className="section-cream px-6 py-16 text-center text-[#b7c4b0]">
          <div className="soft-line mx-auto mb-12 max-w-4xl" />

          <p className="text-3xl font-extrabold tracking-[-0.06em]">F · D</p>

          <p className="mt-4 text-sm text-[#8f9f8a]">
            Francisca & Daniel · {weddingDate}
          </p>

          <p className="mt-4 text-sm text-[#8f9f8a]">
            ✉ casamento.franciscadaniel@gmail.com
          </p>
        </footer>
      </div>
    </main>
  );
}

function HeroInfo({ label, value }) {
  return (
    <div>
      <p className="text-[#8f9f8a]/60">{label}</p>
      <p className="mt-3 text-base tracking-[0.18em] text-[#8f9f8a]">{value}</p>
    </div>
  );
}

function MinimalHeader({ eyebrow, title, text }) {
  return (
    <div className="reveal-on-scroll mx-auto max-w-3xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.5em] text-[#b7c4b0]">
        {eyebrow}
      </p>

      <div className="gold-line mx-auto mt-6 max-w-[180px]" />

      <h2 className="mt-8 text-5xl font-extrabold uppercase leading-[0.9] tracking-[-0.07em] text-[#b7c4b0] md:text-7xl">
        {title}
      </h2>

      <p className="mx-auto mt-8 max-w-2xl text-lg font-light leading-8 text-[#8f9f8a]">
        {text}
      </p>
    </div>
  );
}

function MinimalDetail({ number, title, text }) {
  return (
    <div className="reveal-on-scroll mx-auto grid max-w-4xl gap-6 md:grid-cols-[120px_1fr]">
      <p className="text-sm font-semibold uppercase tracking-[0.45em] text-[#b7c4b0]/70">
        {number}
      </p>

      <div>
        <h3 className="text-4xl font-extrabold uppercase leading-none tracking-[-0.06em] text-[#b7c4b0] md:text-5xl">
          {title}
        </h3>

        <p className="mt-5 max-w-2xl text-lg font-light leading-8 text-[#8f9f8a]">
          {text}
        </p>
      </div>
    </div>
  );
}

function CountdownBox({ number, label }) {
  return (
    <div className="reveal-on-scroll">
      <p className="text-6xl font-extrabold leading-none tracking-[-0.07em] text-[#b7c4b0] md:text-7xl">
        {String(number).padStart(2, "0")}
      </p>

      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.35em] text-[#8f9f8a]">
        {label}
      </p>
    </div>
  );
}

function Timeline({ time, title, text }) {
  return (
    <div className="reveal-on-scroll mx-auto grid max-w-4xl gap-6 border-t border-[#b7c4b0]/25 pt-10 md:grid-cols-[120px_1fr]">
      <p className="flex items-center gap-3 text-xl font-extrabold tracking-[-0.04em] text-[#b7c4b0]">
        <span className="gold-dot h-2 w-2 rounded-full" />
        {time}
      </p>

      <div>
        <h3 className="text-3xl font-extrabold uppercase leading-none tracking-[-0.05em] text-[#b7c4b0] md:text-4xl">
          {title}
        </h3>

        <p className="mt-4 max-w-2xl text-lg font-light leading-8 text-[#8f9f8a]">
          {text}
        </p>
      </div>
    </div>
  );
}

function VenueText({ label, title, text, cta }) {
  return (
    <div className="reveal-on-scroll">
      <p className="text-xs font-semibold uppercase tracking-[0.45em] text-[#b7c4b0]/70">
        {label}
      </p>

      <h3 className="mt-6 text-4xl font-extrabold uppercase leading-none tracking-[-0.06em] text-[#b7c4b0] md:text-5xl">
        {title}
      </h3>

      <p className="mt-6 text-lg font-light leading-8 text-[#8f9f8a]">{text}</p>

      <p className="mt-8 text-xs font-bold uppercase tracking-[0.35em] text-[#cdb892]">
        {cta}
      </p>
    </div>
  );
}
