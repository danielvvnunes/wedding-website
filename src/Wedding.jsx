import { useState } from "react";

const customStyles = `
  @keyframes invitationFadeOut {
    0% { opacity: 1; transform: scale(1); }
    100% { opacity: 0; transform: scale(1.03); }
  }

  @keyframes cardReveal {
    0% { transform: translate(-50%, 40px) scale(0.96); opacity: 0; }
    60% { opacity: 1; }
    100% { transform: translate(-50%, -26px) scale(1); opacity: 1; }
  }

  @keyframes sealPulse {
    0%, 100% { transform: translate(-50%, -50%) scale(1); }
    50% { transform: translate(-50%, -50%) scale(1.045); }
  }

  @keyframes waxShine {
    0% { transform: translateX(-120%) rotate(25deg); opacity: 0; }
    35% { opacity: 0.45; }
    100% { transform: translateX(120%) rotate(25deg); opacity: 0; }
  }

  .invitation-opening {
    animation: invitationFadeOut 900ms ease forwards;
    animation-delay: 1050ms;
  }

  .envelope-card {
    transform: translate(-50%, 40px) scale(0.96);
    opacity: 0;
  }

  .invitation-opening .envelope-card {
    animation: cardReveal 1050ms cubic-bezier(.22,1,.36,1) forwards;
  }

  .envelope-flap {
    transform-origin: top center;
    transition: transform 1050ms cubic-bezier(.22,1,.36,1), opacity 1050ms ease;
  }

  .invitation-opening .envelope-flap {
    transform: rotateX(180deg);
    opacity: 0.22;
  }

  .seal {
    animation: sealPulse 2.2s ease-in-out infinite;
    clip-path: polygon(
      50% 0%, 58% 6%, 68% 3%, 76% 11%, 88% 13%, 91% 25%,
      100% 33%, 95% 45%, 100% 55%, 93% 65%, 95% 77%, 84% 84%,
      78% 96%, 65% 93%, 55% 100%, 45% 94%, 33% 98%, 25% 89%,
      13% 86%, 10% 73%, 0% 65%, 6% 53%, 1% 42%, 8% 31%,
      6% 20%, 18% 14%, 25% 4%, 38% 7%
    );
  }

  .seal::before {
    content: "";
    position: absolute;
    inset: 13px;
    border-radius: 999px;
    border: 2px solid rgba(255, 232, 176, .42);
    box-shadow:
      inset 0 5px 12px rgba(255, 255, 255, .28),
      inset 0 -8px 14px rgba(86, 55, 18, .25),
      0 2px 5px rgba(71, 45, 18, .22);
  }

  .seal::after {
    content: "";
    position: absolute;
    inset: -25%;
    border-radius: 999px;
    background:
      radial-gradient(circle at 34% 24%, rgba(255,255,255,.55), transparent 18%),
      linear-gradient(105deg, transparent 35%, rgba(255,255,255,.42) 48%, transparent 62%);
    animation: waxShine 3.4s ease-in-out infinite;
    pointer-events: none;
  }

  .wax-ridge {
    clip-path: polygon(
      50% 0%, 58% 6%, 68% 3%, 76% 11%, 88% 13%, 91% 25%,
      100% 33%, 95% 45%, 100% 55%, 93% 65%, 95% 77%, 84% 84%,
      78% 96%, 65% 93%, 55% 100%, 45% 94%, 33% 98%, 25% 89%,
      13% 86%, 10% 73%, 0% 65%, 6% 53%, 1% 42%, 8% 31%,
      6% 20%, 18% 14%, 25% 4%, 38% 7%
    );
  }

  .wax-monogram {
    text-shadow:
      0 1px 0 rgba(255,255,255,.18),
      0 -2px 5px rgba(75,45,12,.45);
    filter: drop-shadow(0 2px 1px rgba(90,55,18,.22));
  }

  .invitation-opening .seal {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.72);
    transition: all 520ms ease;
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

  .botanical-corner {
    position: absolute;
    width: 180px;
    height: 230px;
    opacity: .28;
    background-image:
      radial-gradient(ellipse at 50% 86%, rgba(138,151,132,.34) 0 9px, transparent 10px),
      radial-gradient(ellipse at 37% 70%, rgba(138,151,132,.28) 0 7px, transparent 8px),
      radial-gradient(ellipse at 62% 64%, rgba(138,151,132,.28) 0 7px, transparent 8px),
      radial-gradient(ellipse at 30% 48%, rgba(138,151,132,.24) 0 6px, transparent 7px),
      radial-gradient(ellipse at 70% 42%, rgba(138,151,132,.24) 0 6px, transparent 7px),
      linear-gradient(72deg, transparent 48%, rgba(138,151,132,.42) 49%, rgba(138,151,132,.42) 50%, transparent 51%);
    background-repeat: no-repeat;
  }

  .gold-fold-left {
    background: linear-gradient(145deg, transparent 49.65%, rgba(194,164,95,.85) 50%, rgba(194,164,95,.85) 50.35%, transparent 51%);
  }

  .gold-fold-right {
    background: linear-gradient(35deg, transparent 49.65%, rgba(194,164,95,.85) 50%, rgba(194,164,95,.85) 50.35%, transparent 51%);
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
`;

export default function WeddingWebsite() {
  const [isOpen, setIsOpen] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  const weddingDate = "26 de setembro de 2026";

  function openInvitation() {
    setIsOpening(true);
    window.setTimeout(() => {
      setIsOpen(true);
    }, 1800);
  }

  return (
    <main className="min-h-screen bg-[#e8e4de] text-[#3b3228]">
      <style>{customStyles}</style>
      {!isOpen && (
        <section
          className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#d9dfcf] px-6 ${
            isOpening ? "invitation-opening" : ""
          }`}
        >
          <div className="absolute left-[-8rem] top-[-8rem] h-80 w-80 rounded-full bg-[#f1ebe2]/60 blur-3xl" />
          <div className="absolute bottom-[-10rem] right-[-8rem] h-96 w-96 rounded-full bg-[#8a9784]/30 blur-3xl" />

          <div className="relative flex h-screen w-full items-center justify-center perspective-[1600px]">
            <div className="relative h-[92vh] max-h-[880px] w-[92vw] max-w-[430px] overflow-hidden rounded-[2.2rem] border border-[#cfc6b6] bg-[#f1ebe2] shadow-2xl paper-texture">
              <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-[#f1ebe2] to-[#e8e4de]" />
              <div className="botanical-corner bottom-[-34px] left-[-42px] z-10 rotate-[-18deg]" />
              <div className="botanical-corner bottom-[-10px] right-[-58px] z-10 rotate-[18deg] scale-x-[-1]" />
              <div className="botanical-corner top-[72px] left-1/2 z-10 h-32 w-32 -translate-x-1/2 rotate-[42deg] opacity-20" />

              <div className="envelope-card absolute left-1/2 top-[8%] z-10 w-[82%] rounded-[1.8rem] border border-[#cfc6b6]/80 bg-[#f1ebe2]/95 px-7 py-9 text-center shadow-xl backdrop-blur-sm">
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-[#c2a45f] font-serif text-3xl text-[#c2a45f]">
                  F · D
                </div>
                <p className="mb-3 text-[10px] uppercase tracking-[0.42em] text-[#c2a45f]">
                  Wedding Invitation
                </p>
                <h1 className="font-serif text-5xl leading-tight text-[#3b3228]">
                  Francisca
                  <span className="block text-3xl italic text-[#c2a45f]">
                    &
                  </span>
                  Daniel
                </h1>
                <p className="mx-auto mt-5 max-w-xs text-sm leading-6 text-[#6c5b4a]">
                  Temos o maior gosto em convidar-vos para celebrar connosco
                  este dia tão especial.
                </p>
              </div>

              <div className="absolute left-1/2 top-[17%] z-20 -translate-x-1/2 text-center">
                <p className="text-xs text-[#8a9784]">❦</p>
                <p className="mt-5 font-serif text-5xl tracking-[0.18em] text-[#c2a45f]">
                  F | D
                </p>
                <p className="mt-5 text-xs text-[#8a9784]">❦</p>
              </div>

              <div className="envelope-flap absolute inset-x-0 top-0 z-30 h-[56%] origin-top rounded-t-[2.2rem] bg-[#f1ebe2]/95 paper-texture [clip-path:polygon(0_0,100%_0,50%_100%)]" />
              <div className="absolute inset-x-0 top-0 z-31 h-[56%] gold-fold-left [clip-path:polygon(0_0,100%_0,50%_100%)]" />
              <div className="absolute inset-x-0 top-0 z-31 h-[56%] gold-fold-right [clip-path:polygon(0_0,100%_0,50%_100%)]" />

              <div className="absolute inset-y-0 left-0 z-40 w-[58%] bg-[#f1ebe2]/90 paper-texture [clip-path:polygon(0_0,100%_50%,0_100%)]" />
              <div className="absolute inset-y-0 right-0 z-40 w-[58%] bg-[#f8f4ec]/94 paper-texture [clip-path:polygon(100%_0,0_50%,100%_100%)]" />
              <div className="absolute inset-x-0 bottom-0 z-40 h-[54%] bg-[#eee6d8]/96 paper-texture [clip-path:polygon(0_100%,50%_0,100%_100%)]" />

              <div className="absolute inset-0 z-41 gold-fold-left opacity-70" />
              <div className="absolute inset-0 z-41 gold-fold-right opacity-70" />

              <div className="wax-ridge absolute left-1/2 top-1/2 z-50 h-[150px] w-[150px] -translate-x-1/2 -translate-y-1/2 bg-[#9f7c34] shadow-[0_28px_50px_rgba(60,45,22,.42),inset_0_12px_22px_rgba(255,242,190,.35),inset_0_-18px_28px_rgba(84,55,18,.4)]" />
              <button
                type="button"
                onClick={openInvitation}
                disabled={isOpening}
                className="seal absolute left-1/2 top-1/2 z-[60] flex h-[124px] w-[124px] items-center justify-center overflow-hidden bg-[#c2a45f] font-serif text-[#fff2d2] shadow-[0_18px_34px_rgba(60,45,22,.38),inset_0_9px_18px_rgba(255,244,204,.5),inset_0_-16px_26px_rgba(95,67,22,.38)] transition disabled:cursor-default"
                aria-label="Abrir convite"
              >
                <span className="wax-monogram relative z-10 flex h-[76px] w-[76px] items-center justify-center rounded-full border border-[#f7df9d]/55 text-3xl tracking-[0.08em] shadow-[inset_0_6px_14px_rgba(75,45,15,.28)]">
                  FD
                </span>
              </button>

              <div className="absolute bottom-[13%] left-1/2 z-50 w-full -translate-x-1/2 px-8 text-center">
                <p className="text-xs uppercase tracking-[0.42em] text-[#9b7f42]">
                  Abre o convite
                </p>
                <p className="mt-5 text-xl text-[#c2a45f]">♥</p>
                <p className="mt-4 text-[10px] uppercase tracking-[0.35em] text-[#8a9784]">
                  toca no selo para abrir
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="relative min-h-screen overflow-hidden px-6 py-16 md:py-20">
        <div className="absolute inset-0 bg-[#e8e4de]" />
        <div className="absolute inset-0 subtle-grid opacity-70" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,.95),transparent_28%),radial-gradient(circle_at_85%_75%,rgba(217,223,207,.9),transparent_30%)]" />
        <div className="leaf-stem absolute left-8 top-24 h-72 w-40 -rotate-12 opacity-40" />
        <div className="leaf-stem absolute bottom-16 right-10 h-72 w-40 rotate-[155deg] opacity-35" />

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-8rem)] max-w-7xl flex-col justify-center">
          <div className="grid items-center gap-12 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="relative order-2 lg:order-1">
              <div className="mb-8 flex items-center gap-4">
                <span className="h-px w-16 bg-[#c2a45f]" />
                <p className="text-xs uppercase tracking-[0.5em] text-[#9b7f42]">
                  Wedding celebration
                </p>
              </div>

              <h1 className="script-shadow font-serif text-7xl leading-[0.9] tracking-[-0.05em] text-[#3b3228] md:text-9xl lg:text-[9.5rem]">
                Francisca
                <span
                  className="mt-4 block tracking-[-0.05em] text-[#c2a45f]"
                  style={{ color: "#c2a45f" }}
                >
                  & Daniel
                </span>
              </h1>

              <p className="mt-9 max-w-xl text-lg leading-8 text-[#6c5b4a]">
                Depois de tantas memórias, aventuras e sonhos partilhados,
                chegou o momento de celebrar o nosso amor com as pessoas que
                mais importam.
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#programa"
                  className="rounded-full bg-[#8a9784] px-8 py-4 text-center text-xs uppercase tracking-[0.28em] text-white shadow-lg transition hover:bg-[#c2a45f]"
                >
                  Ver programa
                </a>
                <a
                  href="#rsvp"
                  className="rounded-full border border-[#c2a45f]/70 bg-white/45 px-8 py-4 text-center text-xs uppercase tracking-[0.28em] text-[#9b7f42] backdrop-blur transition hover:bg-white"
                >
                  Confirmar presença
                </a>
              </div>
            </div>

            <div className="relative order-1 mx-auto w-full max-w-[520px] lg:order-2">
              <div className="absolute -inset-6 rounded-[3.5rem] bg-white/45 blur-2xl" />
              <div className="luxury-card paper-texture relative overflow-hidden rounded-[3rem] border border-[#cfc6b6] p-7 shadow-2xl md:p-9">
                <div className="absolute left-0 top-0 h-32 w-32 rounded-br-full bg-[#d9dfcf]/55" />
                <div className="absolute bottom-0 right-0 h-36 w-36 rounded-tl-full bg-[#c2a45f]/10" />
                <div className="relative rounded-[2.3rem] border border-[#c2a45f]/35 bg-[#f8f4ec]/75 px-7 py-10 text-center backdrop-blur">
                  <p className="text-[11px] uppercase tracking-[0.52em] text-[#8a9784]">
                    Save the date
                  </p>
                  <div className="mx-auto my-8 h-px w-32 ornament-line" />
                  <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full border border-[#c2a45f]/70 bg-white/55 font-serif text-5xl text-[#c2a45f] shadow-inner">
                    FD
                  </div>
                  <h2 className="mt-8 font-serif text-5xl text-[#3b3228] md:text-6xl">
                    26.09.2026
                  </h2>
                  <p className="mt-4 text-sm uppercase tracking-[0.35em] text-[#9b7f42]">
                    sábado
                  </p>

                  <div className="mt-9 grid gap-3 text-left">
                    <MiniDetail label="Cerimónia" value="11h30" />
                    <MiniDetail label="Cocktail" value="14h00" />
                    <MiniDetail label="Local" value="Santa Iria da Azóia" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden px-6 py-24">
        {/* Illustration placeholder (casal desenho) */}
        <div className="pointer-events-none absolute left-8 top-12 hidden lg:block opacity-40">
          <IllustrationSlot label="Desenho do casal" />
        </div>

        {/* Illustration placeholder (quinta desenho) */}
        <div className="pointer-events-none absolute right-10 bottom-10 hidden lg:block opacity-35">
          <IllustrationSlot label="Desenho da quinta" />
        </div>
        <div className="absolute inset-0 bg-[#f8f4ec]" />
        <div className="absolute inset-x-0 top-0 h-px ornament-line" />
        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <p className="mb-4 text-xs uppercase tracking-[0.45em] text-[#c2a45f]">
              O nosso dia
            </p>
            <h2 className="font-serif text-5xl leading-tight md:text-7xl">
              Uma celebração feita de detalhes.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#6c5b4a]">
              Queremos que este seja um dia leve, bonito e cheio de momentos
              para guardar. Aqui ficam os principais detalhes da celebração.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <FeatureCard
              number="01"
              icon="⛪"
              title="Cerimónia"
              text="Às 11h30, na Paróquia de Santa Iria da Azóia, onde vamos trocar os nossos votos rodeados por quem mais amamos."
            />
            <FeatureCard
              number="02"
              icon="🥂"
              title="Cocktail"
              text="Às 14h00, um momento para brindar, conversar e começar a celebrar em conjunto."
            />
            <FeatureCard
              number="03"
              icon="✦"
              title="Festa"
              text="Música, dança e uma noite inesquecível com todos vocês."
            />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#8a9784] px-6 py-28 text-white">
        <div className="absolute inset-0 floral-pattern opacity-10" />
        <div className="absolute left-[-8rem] top-[-8rem] h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-[-10rem] right-[-10rem] h-96 w-96 rounded-full bg-[#c2a45f]/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl gap-14 md:grid-cols-[0.8fr_1.2fr] md:items-center">
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.45em] text-[#d6b98c]">
              Countdown
            </p>
            <h2 className="font-serif text-5xl leading-tight md:text-7xl">
              Estamos quase a dizer “sim”.
            </h2>
            <p className="mt-6 max-w-md leading-7 text-white/75">
              Até lá, guardem esta data com carinho. Queremos muito partilhar
              este momento convosco.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <CountdownBox number="26" label="Dia" />
            <CountdownBox number="09" label="Mês" />
            <CountdownBox number="2026" label="Ano" />
            <CountdownBox number="∞" label="Memórias" />
          </div>
        </div>
      </section>

      <section id="programa" className="relative overflow-hidden px-6 py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-[#f8f4ec] via-[#e8e4de] to-[#f8f4ec]" />
        <div className="leaf-stem absolute left-10 top-24 h-80 w-44 -rotate-12 opacity-30" />
        <div className="relative mx-auto max-w-5xl">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <p className="mb-4 text-xs uppercase tracking-[0.45em] text-[#c2a45f]">
              Programa
            </p>
            <h2 className="font-serif text-5xl leading-tight md:text-7xl">
              O ritmo do dia
            </h2>
            <p className="mt-5 text-[#6c5b4a]">
              Os horários principais para se orientarem ao longo da celebração.
            </p>
          </div>

          <div className="relative mx-auto max-w-3xl rounded-[2.5rem] border border-[#cfc6b6] bg-white/45 p-5 shadow-xl backdrop-blur md:p-8">
            <div className="absolute left-10 top-12 hidden h-[calc(100%-6rem)] w-px bg-[#c2a45f]/35 sm:block" />
            <div className="space-y-4">
              <Timeline time="11:00" title="Chegada dos convidados" />
              <Timeline time="11:30" title="Cerimónia" />
              <Timeline time="14:00" title="Cocktail" />
              <Timeline time="20:00" title="Jantar" />
              <Timeline time="22:30" title="Festa" />
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
          <VenueCard
            eyebrow="Cerimónia"
            title="Paróquia de Santa Iria da Azóia"
            text="O lugar onde vamos dar início a este novo capítulo, rodeados pela nossa família e amigos."
          />
          <VenueCard
            eyebrow="Celebração"
            title="Cocktail, jantar e festa"
            text="Depois da cerimónia, continuamos o dia com brindes, comida, música e muitas memórias para guardar."
          />
        </div>
      </section>

      <section id="rsvp" className="px-6 py-28">
        <div className="luxury-card paper-texture mx-auto max-w-6xl overflow-hidden rounded-[3.2rem] border border-[#cfc6b6] shadow-2xl md:grid md:grid-cols-[0.92fr_1.08fr]">
          <div className="relative flex min-h-[460px] items-center justify-center overflow-hidden bg-[#8a9784] p-10 text-center text-white">
            <div className="absolute inset-0 floral-pattern opacity-20" />
            <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="relative">
              <p className="mb-4 text-xs uppercase tracking-[0.45em] text-[#d6b98c]">
                RSVP
              </p>
              <h2 className="font-serif text-5xl leading-tight md:text-7xl">
                Confirmem a vossa presença
              </h2>
              <div className="mx-auto my-8 h-px w-28 bg-[#d6b98c]" />
              <p className="mx-auto max-w-sm text-white/75">
                A vossa presença é o nosso melhor presente.
              </p>
            </div>
          </div>

          <div className="bg-white/88 p-8 md:p-12">
            <p className="mb-8 leading-7 text-[#6c5b4a]">
              Para nos ajudarem a organizar tudo da melhor forma, agradecemos
              confirmação até à data indicada no convite final.
            </p>

            <form className="space-y-4">
              <input
                className="w-full rounded-2xl border border-[#cfc6b6] bg-[#f8f4ec]/50 px-5 py-4 outline-none transition focus:border-[#c2a45f]"
                placeholder="Nome"
              />
              <input
                className="w-full rounded-2xl border border-[#cfc6b6] bg-[#f8f4ec]/50 px-5 py-4 outline-none transition focus:border-[#c2a45f]"
                placeholder="Email ou contacto"
              />
              <select className="w-full rounded-2xl border border-[#cfc6b6] bg-[#f8f4ec]/50 px-5 py-4 outline-none transition focus:border-[#c2a45f]">
                <option>Vou estar presente</option>
                <option>Infelizmente não poderei ir</option>
              </select>
              <textarea
                className="min-h-28 w-full rounded-2xl border border-[#cfc6b6] bg-[#f8f4ec]/50 px-5 py-4 outline-none transition focus:border-[#c2a45f]"
                placeholder="Mensagem, alergias ou notas importantes"
              />
              <button
                type="button"
                className="w-full rounded-full bg-[#8a9784] px-8 py-4 text-sm uppercase tracking-[0.25em] text-white shadow-lg transition hover:bg-[#c2a45f]"
              >
                Enviar confirmação
              </button>
            </form>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#cfc6b6] px-6 py-14 text-center">
        <p className="font-serif text-3xl text-[#c2a45f]">F · D</p>
        <p className="mt-3 text-sm text-[#6c5b4a]">
          Francisca & Daniel · {weddingDate}
        </p>
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-[#6c5b4a]">
          ✉ contacto@exemplo.pt
        </p>
      </footer>
    </main>
  );
}

function FeatureCard({ number, icon, title, text }) {
  return (
    <div className="group relative overflow-hidden rounded-[2.4rem] border border-[#cfc6b6] bg-white/60 p-8 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-xl">
      <div className="absolute right-6 top-5 font-serif text-6xl text-[#c2a45f]/10">
        {number}
      </div>
      <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-full bg-[#d9dfcf] text-2xl text-[#c2a45f] shadow-inner">
        {icon}
      </div>
      <h3 className="font-serif text-3xl">{title}</h3>
      <p className="mt-5 leading-7 text-[#6c5b4a]">{text}</p>
      <div className="mt-8 h-px w-20 bg-[#c2a45f]/45 transition group-hover:w-32" />
    </div>
  );
}

function VenueCard({ eyebrow, title, text }) {
  return (
    <div className="luxury-card paper-texture rounded-[2.6rem] border border-[#cfc6b6] p-8 shadow-xl md:p-10">
      <p className="mb-5 text-xs uppercase tracking-[0.42em] text-[#c2a45f]">
        {eyebrow}
      </p>
      <h3 className="font-serif text-4xl leading-tight text-[#3b3228]">
        {title}
      </h3>
      <p className="mt-5 leading-7 text-[#6c5b4a]">{text}</p>
    </div>
  );
}

function MiniDetail({ label, value }) {
  const isLocation = true;

  return (
    <div
      className={`rounded-2xl border border-[#cfc6b6] bg-white/55 px-5 py-4 ${
        isLocation
          ? "flex flex-col items-center gap-2 text-center"
          : "flex items-center justify-between gap-4"
      }`}
    >
      <span className="shrink-0 text-xs uppercase tracking-[0.28em] text-[#8a9784]">
        {label}
      </span>
      <span
        className={`font-serif leading-tight text-[#3b3228] ${
          isLocation ? "text-2xl md:text-xl" : "text-xl md:text-2xl"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function CountdownBox({ number, label }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 backdrop-blur">
      <div className="font-serif text-4xl text-[#d6b98c]">{number}</div>
      <div className="mt-2 text-xs uppercase tracking-[0.3em] text-white/60">
        {label}
      </div>
    </div>
  );
}

function IllustrationSlot({ label }) {
  return (
    <div className="flex h-[220px] w-[180px] items-center justify-center rounded-[2rem] border border-[#cfc6b6] bg-white/40 backdrop-blur text-center">
      <span className="px-6 text-xs uppercase tracking-[0.35em] text-[#8a9784]">
        {label}
      </span>
    </div>
  );
}

function Timeline({ time, title }) {
  return (
    <div className="flex items-center gap-5 rounded-3xl border border-[#cfc6b6] bg-white/60 p-5 shadow-sm">
      <div className="rounded-full bg-[#8a9784] px-5 py-3 font-serif text-xl text-white">
        {time}
      </div>
      <div className="font-serif text-2xl">{title}</div>
    </div>
  );
}
