import { useState, useEffect } from "react";
import casalLineImg from "./assets/casal-line.png";
import Envelope from "./assets/envelope.png";
import EnvelopeDesktop from "./assets/envelope-desktop.png";
import AlmoçoImg from "./assets/icons/almoço.png";
import CocktailImg from "./assets/icons/cocktail.png";
import FestaImg from "./assets/icons/festa.png";
import BuffetImg from "./assets/icons/buffet.png";
import CerimoniaImg from "./assets/icons/cerimonia.png";
import BoloImg from "./assets/icons/bolo.png";
import IgrejaImg from "./assets/icons/igreja.png";
import { Link } from "react-router-dom";

import { useParams } from "react-router-dom";
import { supabase } from "./lib/supabase";
import {
  guestInvitationQuery,
  saveGuestInvitationSlug,
} from "./lib/guestInvitation";
import igrejaImg from "./assets/igreja.png";
import quintaImg from "./assets/quinta.png";

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

.fullscreen-envelope {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;

  background-image: url("/envelope-desktop.png");
  background-size: cover;       /* cobre todo o ecrã */
  background-position: center;  /* mantém centrado */
  background-repeat: no-repeat;

  image-rendering: auto;
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
  border: 1px solid rgba(183, 196, 176, 0.5);
  border-radius: 1.25rem;
  background: rgba(255, 255, 255, 0.42);
  padding: 1rem 1.1rem;
  outline: none;
  color: #7f8f78;
  font-size: 16px;
  transition:
    border-color 220ms ease,
    background 220ms ease,
    box-shadow 220ms ease;
}

.minimal-field::placeholder {
  color: rgba(127, 143, 120, 0.6);
}

.minimal-field:focus {
  border-color: #cdb892;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 0 0 4px rgba(205, 184, 146, 0.13);
}

.minimal-field[readonly] {
  background: rgba(183, 196, 176, 0.12);
  color: #8f9f8a;
}

.minimal-field,
.minimal-select {
  min-height: 52px;
}

.form-submitted .minimal-field:invalid,
.form-submitted .minimal-select:invalid {
  border-color: #e87c7c;
  background-color: rgba(232, 124, 124, 0.05);
}

.form-submitted .minimal-field:invalid:focus,
.form-submitted .minimal-select:invalid:focus {
  box-shadow: 0 0 0 4px rgba(232, 124, 124, 0.15);
}
.minimal-field:invalid:focus,
.minimal-select:invalid:focus {
  box-shadow: 0 0 0 4px rgba(232, 124, 124, 0.15);
}

.minimal-select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;

  background-image:
    linear-gradient(45deg, transparent 50%, #8f9f8a 50%),
    linear-gradient(135deg, #8f9f8a 50%, transparent 50%);
  background-position:
    calc(100% - 20px) 50%,
    calc(100% - 14px) 50%;
  background-size: 6px 6px, 6px 6px;
  background-repeat: no-repeat;
  padding-right: 2.75rem;
}

.soft-line {
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(183,196,176,.55), transparent);
}

.form-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.24em;
  color: #8f9f8a;
}

.choice-button {
  width: 100%;
  min-height: 52px;
  border: 1px solid rgba(183, 196, 176, 0.5);
  border-radius: 1.25rem;
  background: rgba(255, 255, 255, 0.42);
  padding: 1rem 1.1rem;
  color: #7f8f78;
  font-size: 16px;
  text-align: center;
}

.choice-button-active {
  border-color: #cdb892;
  background: rgba(205, 184, 146, 0.15);
  color: #a99672;
  box-shadow: 0 0 0 4px rgba(205, 184, 146, 0.12);
}
`;

const guestList = [
  [["Pais"], "Queridos", "plural"],
  [["Maria", "Tiago", "Matilde", "Manuel", "Tomás"], "Queridos", "plural"],
  [["Irmã Margarida"], "Querida", "singular"],
  [["Tia Ada"], "Querida", "singular"],
  [["Padrinho Manuel", "Maria"], "Queridos", "plural"],
  [["Prima Carolina", "Phil", "Matilde", "Vicente"], "Queridos", "plural"],
  [["Prima Margarida"], "Querida", "singular"],
  [["Tia Dina"], "Querida", "singular"],
  [["Prima Catarina"], "Querida", "singular"],
  [["Primo Rafael"], "Querido", "singular"],

  [["Beatriz"], "Querida Amiga", "singular"],
  [["Clara"], "Querida Amiga", "singular"],
  [["Quecas"], "Querida Amiga", "singular"],
  [["Carlos", "Inês"], "Queridos Amigos", "plural"],
  [["Hugo"], "Querido Amigo", "singular"],
  [["Daniela"], "Querida Amiga", "singular"],
  [["Catarina Laginhas", "Família"], "Querida Amiga", "plural"],
  [["João Fernandes"], "Querido Amigo", "singular"],
  [["Bruno Vidal"], "Querido Amigo", "singular"],
  [["João Azenha"], "Querido Amigo", "singular"],
  [["Mariana Martins"], "Querida Amiga", "singular"],
  [["Miguel"], "Querido Amigo", "singular"],
  [["Raquel"], "Querida", "singular"],
  [["Mafalda"], "Querida Amiga", "singular"],
  [["Catarina Neto"], "Querida Amiga", "singular"],
  [["Mariana Cardoso"], "Querida Amiga", "singular"],
  [["Inês Marques"], "Querida Amiga", "singular"],
  [["Chaliça"], "Querida Amiga", "singular"],
  [["Popóxia"], "Querida Amiga", "singular"],
  [["Pilay"], "Querida Amiga", "singular"],
  [["Gina"], "Querida Amiga", "singular"],
  [["Camões"], "Querido Afilhado", "singular"],
  [["Célia"], "Querido Amigo", "singular"],
  [["Lenka"], "Querida Amiga", "singular"],
  [["Pombinhas"], "Querido Amigo", "singular"],

  [["Pais"], "Queridos", "plural"],
  [["Avós Alice e Alberto"], "Queridos", "plural"],
  [["Avô Albano"], "Querido", "singular"],
  [["Tio Zé", "Gina", "Vicente"], "Queridos", "plural"],
  [["Padrinho Jorge", "Tia Sandra", "Primo Duarte"], "Queridos", "plural"],
  [["Prima Maria Luís", "Vítor", "Primo Martim"], "Queridos", "plural"],
  [["Prima Leonor", "Samuel"], "Queridos", "plural"],
  [["Duarte"], "Primo", "singular"],
  [["Tia Elsa", "Primo João", "Carlos"], "Queridos", "plural"],
  [["Paulo"], "Caro", "singular"],
  [["Luís e Cristina"], "Queridos Primos", "plural"],
  [["Primo André", "Catarina", "Ana Luísa"], "Queridos", "plural"],
  [["Prima Sofia"], "Querida", "singular"],
  [["Madrinha", "Martins"], "Queridos", "plural"],
  [["Prima Olívia", "Mário"], "Queridos", "plural"],
  [["Primo Gonçalo"], "Querido", "singular"],
  [["Tia Deolinda e primo João"], "Queridos", "plural"],
  [["Dra Joana e Dr Rui"], "Queridos", "plural"],
  [["Aylton"], "Amigo", "singular"],
  [["Nuno", "Quica"], "Amigos", "plural"],
  [["Bruno", "Família"], "Amigo", "plural"],
  [["Rodrigo"], "Amigo", "singular"],
  [["Almeirante"], "Amigo", "singular"],
  [["Tiago"], "Amigo", "singular"],
  [["Zé"], "Amigo", "singular"],
  [["Patrícia e Marisa"], "Queridas", "plural"],
  [["Ana Margarida", "António"], "Caros", "plural"],
  [["Zé"], "Amigo", "singular"],
  [["João"], "Amigo", "singular"],
  [["Soraya", "David"], "Amigos", "plural"],
  [["Tiago"], "Amigo", "singular"],
  [["Luís", "Família"], "Amigo", "plural"],
  [["Pina"], "Afilhado", "singular"],
  [["Cristina", "Jorge"], "Queridos", "plural"],
  [["Sil"], "Amigo", "singular"],
  [["Vera", "Carlos", "Inês", "Matilde"], "Queridos primos", "plural"],
  [["Stéphane"], "Amigo", "singular"],
  [["João Pedro"], "Querido", "singular"],
  [["António", "Amélia"], "Queridos primos", "plural"],
  [["Madalena"], "Querida", "singular"],
  [["Zé Miguel"], "Querido", "singular"],
  [["Glória", "Carlos"], "Queridos", "plural"],
  [["Rui"], "Amigo", "singular"],
  [["António Simões"], "Sr.", "singular"],
];

function slugify(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const guests = Object.fromEntries(
  guestList.map(([names, greeting, type]) => {
    const firstName = names[0]; // 👈 só o primeiro
    const slug = slugify(firstName);

    return [
      slug,
      {
        names: names.filter(Boolean),
        greeting,
        type,
      },
    ];
  }),
);

const specialRsvpDeadlineSlugs = new Set([
  "cristina",
  "sil",
  "vera",
  "stephane",
  "antonio",
  "joao-pedro",
  "madalena",
  "ze-miguel",
  "gloria",
  "rui",
  "antonio-simoes",
]);

const VOCE_TREATMENT_SLUGS = new Set(["antonio-simoes"]);

function usesVoceTreatment(guestSlug) {
  return VOCE_TREATMENT_SLUGS.has(guestSlug);
}

function getGuestCopy(guest, guestSlug) {
  const isVoce = usesVoceTreatment(guestSlug);
  const isPlural = guest?.type === "plural";

  if (isVoce) {
    return {
      countdownText:
        "O grande dia aproxima-se. Estamos ansiosos por partilhá-lo consigo.",
      celebrationText:
        "Os principais momentos da celebração, para viver connosco cada detalhe deste dia especial.",
      rsvpTitle: "Confirme a sua presença",
      rsvpSubtitle: "A sua presença é o nosso melhor presente.",
      nameRequired: "Por favor preencha o nome",
      memoryLabel: "Deixe-nos uma memória que viveu connosco!",
      attendingConfirmed: "A sua presença ficou confirmada. 🤍",
      notAttending: "Vamos sentir a sua falta. Obrigado por nos avisar.",
      missingContact: "Por favor indique um contacto antes de enviar.",
      submitError: "Não foi possível enviar a confirmação. Tente novamente.",
      saveDateTitle: (multiple) => (multiple ? "Guardem a data" : "Guarde a data"),
      saveDateText: (multiple) =>
        multiple
          ? "A sua presença ficou confirmada. Podem agora adicionar o casamento ao calendário para terem o dia sempre à mão."
          : "A sua presença ficou confirmada. Pode agora adicionar o casamento ao calendário para ter o dia sempre à mão.",
      confirmModalPrefix: "Vai enviar a confirmação de presença para",
    };
  }

  if (isPlural || !guest) {
    return {
      countdownText:
        "O grande dia aproxima-se. Estamos ansiosos por partilhá-lo convosco.",
      celebrationText:
        "Os principais momentos da celebração, para viverem connosco cada detalhe deste dia especial.",
      rsvpTitle: "Confirmem a vossa presença",
      rsvpSubtitle: "A vossa presença é o nosso melhor presente.",
      nameRequired: "Por favor preenche o nome",
      memoryLabel: "Deixa-nos uma memória que viveste connosco!",
      attendingConfirmed: "A vossa presença ficou confirmada. 🤍",
      notAttending: "Vamos sentir a vossa falta. Obrigado por nos avisarem.",
      missingContact: "Por favor indica um contacto antes de enviar.",
      submitError: "Não foi possível enviar a confirmação. Tenta novamente.",
      saveDateTitle: (multiple) => (multiple ? "Guardem a data" : "Guarda a data"),
      saveDateText: (multiple) =>
        multiple
          ? "A vossa presença ficou confirmada. Podem agora adicionar o casamento ao calendário para terem o dia sempre à mão."
          : "A tua presença ficou confirmada. Podes agora adicionar o casamento ao calendário para teres o dia sempre à mão.",
      confirmModalPrefix: "Vais enviar a confirmação de presença para",
    };
  }

  return {
    countdownText:
      "O grande dia aproxima-se. Estamos ansiosos por partilhá-lo contigo.",
    celebrationText:
      "Os principais momentos da celebração, para viveres connosco cada detalhe deste dia especial.",
    rsvpTitle: "Confirma a tua presença",
    rsvpSubtitle: "A tua presença é o nosso melhor presente.",
    nameRequired: "Por favor preenche o nome",
    memoryLabel: "Deixa-nos uma memória que viveste connosco!",
    attendingConfirmed: "A tua presença ficou confirmada. 🤍",
    notAttending: "Vamos sentir a tua falta. Obrigado por nos avisares.",
    missingContact: "Por favor indica um contacto antes de enviar.",
    submitError: "Não foi possível enviar a confirmação. Tenta novamente.",
    saveDateTitle: (multiple) => (multiple ? "Guardem a data" : "Guarda a data"),
    saveDateText: (multiple) =>
      multiple
        ? "A vossa presença ficou confirmada. Podem agora adicionar o casamento ao calendário para terem o dia sempre à mão."
        : "A tua presença ficou confirmada. Podes agora adicionar o casamento ao calendário para teres o dia sempre à mão.",
    confirmModalPrefix: "Vais enviar a confirmação de presença para",
  };
}

function formatNames(names) {
  if (names.length === 1) return names[0];

  if (names.length === 2) {
    return `${names[0]} e ${names[1]}`;
  }

  return `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}`;
}

function getGuestMessage(guest, guestSlug) {
  if (!guest) {
    return (
      <>
        Depois de tantas memórias, aventuras e sonhos partilhados, chegou o
        momento de celebrar o nosso amor com as pessoas que mais importam.
      </>
    );
  }

  const isVoce = usesVoceTreatment(guestSlug);
  const singularForm = isVoce ? "estivesse presente" : "estivesses presente";

  return (
    <>
      <span className="gold-accent font-semibold text-[1.1em]">
        {guest.greeting} {formatNames(guest.names)},
      </span>{" "}
      gostaríamos muito que{" "}
      {guest.type === "singular"
        ? singularForm
        : "estivessem presentes"}{" "}
      para celebrar este dia connosco.
    </>
  );
}

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

function SectionNav({ guestSlug }) {
  const conviteQuery = guestInvitationQuery(guestSlug);

  return (
    <header className="sticky top-0 z-40 border-b border-[#cdb892]/25 bg-[#eef3ea]/92 px-3 py-3 shadow-[0_8px_26px_rgba(143,159,138,0.12)] backdrop-blur-xl">
      <nav className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#7f8f78] sm:gap-3 sm:text-[11px] sm:tracking-[0.22em]">
          <a
            href="#programa"
            className="rounded-full px-3 py-2 transition hover:bg-[#cdb892]/15 hover:text-[#cdb892]"
          >
            Programa
          </a>

          <Link
            to={`/convemsaber${conviteQuery}`}
            className="rounded-full px-3 py-2 transition hover:bg-[#cdb892]/15 hover:text-[#cdb892]"
          >
            Localização
          </Link>

          <Link
            to={`/galeria${conviteQuery}`}
            className="rounded-full px-3 py-2 transition hover:bg-[#cdb892]/15 hover:text-[#cdb892]"
          >
            Galeria
          </Link>

          <a
            href="#rsvp"
            className="rounded-full border border-[#cdb892]/45 px-3 py-2 text-[#cdb892] transition hover:bg-[#cdb892] hover:text-white"
          >
            Confirmações
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
    if (typeof window === "undefined") return false;
    return false;
  });

  const [isOpening, setIsOpening] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);

  const weddingDateTime = new Date("2026-09-26T11:30:00");
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining);

  const { guestSlug } = useParams();
  const guest = guestSlug ? guests[guestSlug] : null;
  const copy = getGuestCopy(guest, guestSlug);
  const hasSpecialRsvpDeadline = guestSlug
    ? specialRsvpDeadlineSlugs.has(guestSlug)
    : false;

  const storageKey = `rsvp-form-${guestSlug || "default"}`;
  const conviteQuery = guestInvitationQuery(guestSlug);

  useEffect(() => {
    saveGuestInvitationSlug(guestSlug);
  }, [guestSlug]);

  const savedForm = (() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  const [notes, setNotes] = useState(savedForm?.notes || "");

  const [people, setPeople] = useState(
    savedForm?.people ||
      (guest
        ? guest.names.map(() => ({
            name: "",
            email: "",
            phone: "",
            attending: "yes",
            dietary: "",
            ageGroup: "adult",
          }))
        : [
            {
              name: "",
              email: "",
              phone: "",
              attending: "yes",
              dietary: "",
              ageGroup: "adult",
            },
          ]),
  );

  const weddingDate = "26 de setembro de 2026";

  useEffect(() => {
    const formState = {
      people,
      notes,
    };

    localStorage.setItem(storageKey, JSON.stringify(formState));
  }, [people, notes, storageKey]);

  function updatePerson(index, field, value) {
    setPeople((current) =>
      current.map((person, personIndex) =>
        personIndex === index ? { ...person, [field]: value } : person,
      ),
    );
  }

  function addPerson() {
    setPeople((current) => [
      ...current,
      {
        name: "",
        email: "",
        phone: "",
        attending: "yes",
        dietary: "",
        ageGroup: "adult",
      },
    ]);
  }

  function removePerson(index) {
    setPeople((current) =>
      current.filter((_, personIndex) => personIndex !== index),
    );
  }

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

  function downloadCalendarInvite() {
    const event = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "SUMMARY:Casamento Francisca e Daniel",
      "DTSTART:20260926T103000Z",
      "DTEND:20260927T000000Z",
      "LOCATION:Igreja Matriz de Santa Iria de Azóia e Quinta do Coração",
      "DESCRIPTION:Casamento da Francisca e do Daniel",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\n");

    const blob = new Blob([event], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "casamento-francisca-daniel.ics";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  async function submitRSVP(data) {
    const { error } = await supabase.from("rsvp").insert([data]);

    if (error) {
      console.error(error);
      alert(error.message);
      return false;
    }

    return true;
  }

  function openInvitation() {
    setIsOpening(true);

    window.setTimeout(() => {
      setIsOpen(true);
    }, 4200);
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
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [hasSubmittedSuccessfully, setHasSubmittedSuccessfully] =
    useState(false);

  async function handleConfirmedSubmit() {
    if (isSubmitting || hasSubmittedSuccessfully) return;

    setIsSubmitting(true);
    setSubmitStatus(null);

    const attendingPeople = people.filter(
      (person) => person.attending === "yes",
    );

    const success = await submitRSVP({
      guest_slug: guestSlug,
      people,
      attending_count: attendingPeople.length,
      not_attending_count: people.length - attendingPeople.length,
      notes,
    });

    setIsSubmitting(false);
    setIsConfirmModalOpen(false);

    setSubmitStatus(
      success
        ? attendingPeople.length > 0
          ? "attending"
          : "not-attending"
        : "error",
    );

    if (success) {
      setHasSubmittedSuccessfully(true);
      localStorage.removeItem(storageKey);
    }
  }

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
              className={`absolute inset-0 h-full w-full object-cover transition-all duration-[4200ms] ease-[cubic-bezier(.22,1,.36,1)] ${
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

      {!isMobile && !isOpen && (
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
              src={EnvelopeDesktop}
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
            <div className="mb-8 flex items-center justify-center gap-3 lg:justify-start">
              <span className="h-px w-8 shrink-0 bg-[#c2a45f] sm:w-14" />

              <p className="gold-accent whitespace-nowrap text-[10px] uppercase tracking-[0.26em] text-[#9b7f42] sm:text-xs sm:tracking-[0.42em]">
                Wedding invitation
              </p>

              <span className="h-px w-8 shrink-0 bg-[#c2a45f] sm:w-14 lg:hidden" />
            </div>

            <h1 className="text-[4.8rem] font-extrabold  leading-[0.82] tracking-[0.02em] text-[#b7c4b0] md:text-[9rem] lg:text-[11rem]">
              Francisca
              <br />
              <h1 className="text-[#d1b676]">&</h1>
              Daniel
            </h1>

            <p className="mx-auto mt-10 max-w-2xl text-lg font-light leading-8 text-[#8f9f8a]">
              {getGuestMessage(guest, guestSlug)}
            </p>

            <div className="mx-auto mt-16 grid max-w-3xl gap-8 text-center text-xs font-semibold uppercase tracking-[0.34em] text-[#b7c4b0] sm:grid-cols-3">
              <HeroInfo label="Data" value="26.09.2026" />
              <HeroInfo label="Cerimónia" value="11h30" />
              <HeroInfo label="Local" value="Santa Iria da Azóia" />
            </div>

            <div className="mx-auto mt-20 text-center">
              <img
                src={casalLineImg}
                alt="Desenho de linha de Francisca e Daniel"
                className="mx-auto w-[230px] opacity-35 mix-blend-multiply md:w-[300px]"
              />

              <div className="mx-auto  flex items-center justify-center">
                <p className="whitespace-nowrap text-3xl font-extrabold tracking-[0.28em] md:text-5xl">
                  26.09.2026
                </p>
              </div>
            </div>
          </div>
        </section>

        <SectionNav guestSlug={guestSlug} />

        <section id="countdown" className="section-green px-6 py-24 md:py-32">
          <div className="mx-auto max-w-6xl">
            <MinimalHeader
              eyebrow="Countdown"
              title="Estamos quase a dizer sim."
              text={copy.countdownText}
            />

            <div className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-x-8 gap-y-12 text-center sm:grid-cols-4">
              <CountdownBox number={timeLeft.days} label="Dias" />
              <CountdownBox number={timeLeft.hours} label="Horas" />
              <CountdownBox number={timeLeft.minutes} label="Minutos" />
              <CountdownBox number={timeLeft.seconds} label="Segundos" />
            </div>
          </div>
        </section>

        <section
          id="programa"
          className="section-cream relative overflow-hidden px-6 py-24 md:py-32"
        >
          <img
            src={igrejaImg}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-20 w-[420px] max-w-[115%] -translate-x-1/2 opacity-[0.13] mix-blend-multiply md:right-10 md:left-auto md:top-16 md:w-[520px] md:translate-x-0 md:opacity-[0.07]"
          />
          <div className="relative z-10 mx-auto max-w-6xl">
            <MinimalHeader
              eyebrow="Timeline"
              title="O ritmo do dia"
              text={copy.celebrationText}
            />
            <div className="mt-20 space-y-12">
              <Timeline
                time="11:00"
                title="Chegada"
                image={IgrejaImg}
                text="Receção aos convidados junto à Igreja."
              />
              <Timeline
                time="11:30"
                title="Cerimónia"
                image={CerimoniaImg}
                text="O momento em que dizemos sim."
              />
              <Timeline
                time="14:00"
                title="Cocktail"
                image={CocktailImg}
                text="Brindes, conversas e primeiros abraços."
              />
              <Timeline
                time="16:00"
                title="Almoço"
                image={AlmoçoImg}
                text="À mesa, com todos os que fazem parte da nossa história."
              />
              <Timeline
                time="20:30"
                title="Bolo dos noivos"
                image={BoloImg}
                text="Um momento doce para celebrar juntos.."
              />
              <Timeline
                time="21:30"
                title="Festa"
                image={FestaImg}
                text="Música, dança e memórias para guardar."
              />
              <Timeline
                time="23:00"
                title="Buffet"
                image={BuffetImg}
                text="Repor as energias para continuar a festa."
              />
            </div>
          </div>
        </section>

        <section
          id="locais"
          className="section-soft relative overflow-hidden px-6 py-24 md:py-32"
        >
          <img
            src={quintaImg}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-20 w-[420px] max-w-[115%] -translate-x-1/2 opacity-[0.30] mix-blend-multiply md:right-10 md:left-auto md:top-16 md:w-[520px] md:translate-x-0 md:opacity-[0.07]"
            style={{
              maskImage:
                "linear-gradient(to bottom, transparent 0%, black 32%, black 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0%, black 32%, black 100%)",
            }}
          />

          <div className="relative z-10 mx-auto max-w-6xl">
            <MinimalHeader
              eyebrow="Locais"
              title="Onde tudo acontece"
              text="Dois momentos, o mesmo dia especial. Primeiro a cerimónia, depois a celebração."
            />

            <div className="mt-20 grid gap-16 md:grid-cols-2">
              <VenueText
                label="Cerimónia"
                title="Igreja Matriz de Santa Iria de Azóia"
                text="O lugar onde vamos dar início a este novo capítulo, rodeados de família e amigos."
                cta="Ver localização"
                href={`/convemsaber${conviteQuery}#igreja`}
              />

              <VenueText
                label="Celebração"
                title="Quinta do Coração"
                text="Continuamos o dia com brindes, comida, música e muitas memórias para guardar."
                cta="Ver localização"
                href={`/convemsaber${conviteQuery}#quinta`}
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

              <h2 className="mt-8 text-5xl font-extrabold  leading-[0.9] tracking-[-0.07em] text-[#b7c4b0] md:text-7xl">
                {copy.rsvpTitle}{" "}
              </h2>

              <p className="mx-auto mt-8 max-w-xl text-lg font-light leading-8 text-[#8f9f8a]">
                {copy.rsvpSubtitle}
                {hasSpecialRsvpDeadline && (
                  <>
                    {" "}
                    Confirmar até <span className="font-black">10.08.2026</span>
                    .
                  </>
                )}
              </p>
            </div>

            <form
              className={`mt-10 space-y-6 md:mt-20 ${
                hasTriedSubmit ? "form-submitted" : ""
              }`}
              onSubmit={(e) => {
                setHasTriedSubmit(true);
                e.preventDefault();

                if (isSubmitting || hasSubmittedSuccessfully) return;

                setSubmitStatus(null);
                setIsConfirmModalOpen(true);
              }}
            >
              <div className="space-y-5">
                <div className="text-center">
                  {/* <p className="form-label">Pessoas incluídas neste convite</p> */}
                  <p className="mt-2 text-sm font-light leading-6 text-[#8f9f8a]">
                    Preencher cada pessoa individualmente, para sabermos
                    exatamente quem estará presente.
                  </p>
                </div>

                {people.map((person, index) => (
                  <div
                    key={index}
                    className="rounded-[1.6rem] border border-[#b7c4b0]/35 bg-white/35 p-5"
                  >
                    <div className="mb-5 flex items-center justify-between gap-4">
                      <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#cdb892]">
                        Pessoa {index + 1}
                      </p>

                      {people.length > 1 && (
                        <button
                          type="button"
                          disabled={isSubmitting || hasSubmittedSuccessfully}
                          onClick={() => removePerson(index)}
                          className="
    text-[10px] font-bold uppercase tracking-[0.2em]
    text-[#8f9f8a]
    transition

    hover:text-[#cdb892]

    disabled:opacity-40
    disabled:cursor-not-allowed
    disabled:hover:text-[#8f9f8a]
  "
                        >
                          Remover
                        </button>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <label className="form-label">
                          Nome <span className="text-[#cdb892]">*</span>
                        </label>{" "}
                        <input
                          required
                          value={person.name}
                          onInvalid={(e) =>
                            e.target.setCustomValidity(copy.nameRequired)
                          }
                          onInput={(e) => e.target.setCustomValidity("")}
                          disabled={isSubmitting || hasSubmittedSuccessfully}
                          onChange={(e) =>
                            updatePerson(index, "name", e.target.value)
                          }
                          className="
  minimal-field

  disabled:opacity-50
  disabled:cursor-not-allowed
  disabled:bg-[#f5f5f5]
  disabled:text-[#8f9f8a]


"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="form-label">Email</label>
                        <input
                          value={person.email}
                          disabled={isSubmitting || hasSubmittedSuccessfully}
                          onChange={(e) =>
                            updatePerson(index, "email", e.target.value)
                          }
                          className="
    minimal-field
    disabled:opacity-50
    disabled:cursor-not-allowed
    disabled:bg-[#f5f5f5]
    disabled:text-[#8f9f8a]
  "
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="form-label">
                          Contacto <span className="text-[#cdb892]">*</span>
                        </label>{" "}
                        <input
                          required
                          value={person.phone}
                          disabled={isSubmitting || hasSubmittedSuccessfully}
                          onChange={(e) =>
                            updatePerson(index, "phone", e.target.value)
                          }
                          className="
    minimal-field
    disabled:opacity-50
    disabled:cursor-not-allowed
    disabled:bg-[#f5f5f5]
    disabled:text-[#8f9f8a]
  "
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="form-label">Presença</label>
                        <select
                          value={person.attending}
                          disabled={isSubmitting || hasSubmittedSuccessfully}
                          onChange={(e) =>
                            updatePerson(index, "attending", e.target.value)
                          }
                          className="
    minimal-field minimal-select

    disabled:opacity-50
    disabled:cursor-not-allowed
    disabled:bg-[#f5f5f5]
    disabled:text-[#8f9f8a]
    disabled:border-[#8f9f8a]/20
  "
                        >
                          <option value="yes">Vai estar presente</option>
                          <option value="no">Não poderá ir</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="form-label">Tipo</label>
                        <select
                          value={person.ageGroup}
                          disabled={isSubmitting || hasSubmittedSuccessfully}
                          onChange={(e) =>
                            updatePerson(index, "ageGroup", e.target.value)
                          }
                          className="
    minimal-field minimal-select

    disabled:opacity-50
    disabled:cursor-not-allowed
    disabled:bg-[#f5f5f5]
    disabled:text-[#8f9f8a]
    disabled:border-[#8f9f8a]/20
  "
                        >
                          <option value="adult">Adulto</option>
                          <option value="child_under_3">Bebé (0-3 anos)</option>
                          <option value="child_under_9">
                            Criança (4-9 anos)
                          </option>
                        </select>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className="form-label">
                          Restrições alimentares
                        </label>
                        <input
                          disabled={isSubmitting || hasSubmittedSuccessfully}
                          value={person.dietary}
                          onChange={(e) =>
                            updatePerson(index, "dietary", e.target.value)
                          }
                          placeholder="Ex: vegetariano, alergias, sem glúten..."
                          className="
    minimal-field
    disabled:opacity-50
    disabled:cursor-not-allowed
    disabled:bg-[#f5f5f5]
    disabled:text-[#8f9f8a]
  "
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="text-center">
                  <button
                    type="button"
                    disabled={isSubmitting || hasSubmittedSuccessfully}
                    onClick={addPerson}
                    className="
    rounded-full border border-[#8f9f8a]/55 
    px-6 py-3 
    text-xs font-bold uppercase tracking-[0.24em] 
    text-[#8f9f8a] 
    transition 
    hover:bg-[#8f9f8a] hover:text-white

    disabled:cursor-not-allowed
    disabled:opacity-40
    disabled:hover:bg-transparent
    disabled:hover:text-[#8f9f8a]
  "
                  >
                    + Adicionar pessoa
                  </button>
                </div>
              </div>

              {/* Notas */}
              <div className="space-y-2">
                <label className="form-label">
                  {copy.memoryLabel}
                </label>
                <textarea
                  value={notes}
                  disabled={isSubmitting || hasSubmittedSuccessfully}
                  onChange={(e) => setNotes(e.target.value)}
                  className="
    minimal-field min-h-28

    disabled:opacity-50
    disabled:cursor-not-allowed
    disabled:bg-[#f5f5f5]
    disabled:text-[#8f9f8a]
    disabled:border-[#8f9f8a]/20
  "
                />
              </div>

              {/* Feedback */}
              {submitStatus && (
                <p className="pt-4 text-center text-sm font-semibold text-[#8f9f8a]">
                  {submitStatus === "attending" &&
                    `Que alegria! ${copy.attendingConfirmed}`}
                  {submitStatus === "not-attending" && copy.notAttending}
                  {submitStatus === "missing-contact" && copy.missingContact}
                  {submitStatus === "error" && copy.submitError}
                </p>
              )}

              {/* Botão */}
              <div className="pt-6 text-center">
                <button
                  type="submit"
                  disabled={isSubmitting || hasSubmittedSuccessfully}
                  className="
    relative overflow-hidden
    rounded-full
    border border-[#cdb892]
    px-10 py-4
    text-xs font-bold uppercase tracking-[0.3em]
    text-[#cdb892]

    transition-all duration-300 ease-[cubic-bezier(.22,1,.36,1)]

    hover:bg-[#cdb892]
    hover:text-white
    hover:shadow-[0_8px_30px_rgba(205,184,146,0.35)]
    hover:-translate-y-[2px]

    active:translate-y-[0px]
    active:shadow-[0_4px_12px_rgba(205,184,146,0.25)]

    focus:outline-none
    focus:ring-2
    focus:ring-[#cdb892]/40
    focus:ring-offset-2
    focus:ring-offset-[#fbfaf5]

    disabled:cursor-not-allowed
    disabled:opacity-60
    disabled:hover:bg-transparent
    disabled:hover:text-[#cdb892]
    disabled:hover:shadow-none
    disabled:hover:translate-y-0
  "
                >
                  <span className="relative z-10">
                    {isSubmitting
                      ? "A enviar..."
                      : hasSubmittedSuccessfully
                        ? "Confirmação enviada"
                        : "Enviar confirmação"}
                  </span>

                  {/* brilho */}
                  <span
                    className={`
      pointer-events-none
      absolute inset-0
      opacity-0
      transition-opacity duration-500
      bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.4),transparent)]
      ${isSubmitting || hasSubmittedSuccessfully ? "" : "hover:opacity-100"}
    `}
                  />
                </button>
              </div>
            </form>

            {submitStatus === "attending" && (
              <div className="mt-10 rounded-[2rem] border border-[#cdb892]/35 bg-white/45 p-6 text-center shadow-[0_18px_55px_rgba(143,159,138,0.12)] backdrop-blur-sm">
                <p className="gold-accent text-xs font-semibold uppercase tracking-[0.35em]">
                  Próximo passo
                </p>

                <h3 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-[#b7c4b0]">
                  {copy.saveDateTitle(people.length > 1)}
                </h3>

                <p className="mx-auto mt-4 max-w-xl text-base font-light leading-7 text-[#8f9f8a]">
                  {copy.saveDateText(people.length > 1)}
                </p>

                <button
                  type="button"
                  onClick={downloadCalendarInvite}
                  className="mt-7 inline-flex rounded-full border border-[#cdb892] px-8 py-3 text-xs font-bold uppercase tracking-[0.28em] text-[#cdb892] transition hover:-translate-y-[2px] hover:bg-[#cdb892] hover:text-white hover:shadow-[0_8px_30px_rgba(205,184,146,0.35)]"
                >
                  Adicionar ao calendário
                </button>
              </div>
            )}
          </div>
        </section>

        {/* <section className="text-center py-20">
          <p className="gold-accent text-xs uppercase tracking-[0.4em]">
            Memórias
          </p>

          <h2 className="mt-6 text-4xl font-extrabold text-[#b7c4b0]">
            Partilhem as vossas fotografias
          </h2>

          <Link
            to="/galeria"
            className="
      mt-8 inline-flex
      rounded-full
      border border-[#cdb892]
      px-8 py-3
      text-xs font-bold uppercase tracking-[0.3em]
      text-[#cdb892]
      transition hover:bg-[#cdb892] hover:text-white
    "
          >
            Ir para galeria
          </Link>
        </section> */}

        <footer className="section-cream px-6 py-16 text-center text-[#b7c4b0]">
          <div className="soft-line mx-auto mb-12 max-w-4xl" />

          <p className="text-3xl font-extrabold tracking-[-0.06em]">F · D</p>

          <p className="mt-4 text-sm text-[#8f9f8a]">
            Francisca & Daniel · {weddingDate}
          </p>

          <p className="mt-4 text-sm text-[#8f9f8a]">
            ✉ casamento.franciscadaniel@gmail.com
          </p>

          {/* Telefones */}
          <div className="mt-6 flex justify-center gap-6 text-sm text-[#8f9f8a] tracking-[0.18em]">
            <span className="flex flex-col md:inline">
              <span>Daniel: </span>
              <span className="md:inline">918 947 632</span>
            </span>
            <span className="opacity-40">|</span>
            <span className="flex flex-col md:inline">
              <span>Francisca: </span>
              <span className="md:inline">965 518 462</span>
            </span>
          </div>
        </footer>
      </div>

      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-start justify-center overflow-y-auto bg-[#2f352d]/45 px-5 py-8 backdrop-blur-sm sm:items-center sm:py-10">
          <div className="my-auto w-full max-w-lg rounded-[2rem] border border-[#cdb892]/40 bg-[#fbfaf5] p-7 text-center shadow-[0_24px_80px_rgba(47,53,45,0.22)]">
            <p className="gold-accent text-xs font-bold uppercase tracking-[0.35em]">
              Confirmar envio
            </p>

            <h3 className="mt-5 text-3xl font-extrabold tracking-[-0.04em] text-[#b7c4b0]">
              Está tudo correto?
            </h3>

            <p className="mx-auto mt-4 max-w-md text-sm font-light leading-7 text-[#8f9f8a]">
              {copy.confirmModalPrefix}{" "}
              <strong className="font-bold text-[#cdb892]">
                {people.length} {people.length === 1 ? "pessoa" : "pessoas"}
              </strong>
              . Depois de enviado, o formulário ficará bloqueado para evitar
              envios duplicados.
            </p>

            <div className="mt-6 rounded-[1.5rem] border border-[#b7c4b0]/30 bg-white/45 p-4 text-left">
              {people.map((person, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-4 border-b border-[#b7c4b0]/20 py-2 last:border-b-0"
                >
                  <span className="text-sm font-semibold text-[#7f8f78]">
                    {person.name || `Pessoa ${index + 1}`}
                  </span>

                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#cdb892]">
                    {person.attending === "yes" ? "Presente" : "Não vai"}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsConfirmModalOpen(false)}
                className="
            rounded-full border border-[#8f9f8a]/45 px-7 py-3
            text-xs font-bold uppercase tracking-[0.24em] text-[#8f9f8a]
            transition hover:bg-[#8f9f8a] hover:text-white
            disabled:cursor-not-allowed disabled:opacity-40
          "
              >
                Rever
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmedSubmit}
                className="
            rounded-full border border-[#cdb892] bg-[#cdb892] px-7 py-3
            text-xs font-bold uppercase tracking-[0.24em] text-white
            transition hover:-translate-y-[2px]
            hover:shadow-[0_8px_30px_rgba(205,184,146,0.35)]
            disabled:cursor-not-allowed disabled:opacity-60
            disabled:hover:translate-y-0 disabled:hover:shadow-none
          "
              >
                {isSubmitting ? "A enviar..." : "Sim, enviar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function HeroInfo({ label, value }) {
  return (
    <div>
      <p className="text-[#d1b676] text-xs font-semibold uppercase tracking-[0.34em]">
        {label}
      </p>
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

      <h2 className="mt-8 text-5xl font-extrabold leading-[0.9] tracking-[-0.02em] text-[#b7c4b0] md:text-7xl">
        {title}
      </h2>

      <p className="mx-auto mt-8 max-w-2xl text-lg font-light leading-8 text-[#8f9f8a]">
        {text}
      </p>
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

function Timeline({ time, image, title, text }) {
  return (
    <div className="reveal-on-scroll mx-auto grid max-w-4xl gap-6 border-t border-[#b7c4b0]/25 pt-10 md:grid-cols-[140px_1fr]">
      {/* Tempo + imagem */}
      <div className="flex items-center gap-4">
        <img
          src={image}
          alt=""
          aria-hidden="true"
          className="h-6 w-6 object-contain opacity-80"
        />

        <p className="text-xl font-extrabold tracking-[-0.04em] text-[#b7c4b0]">
          {time}
        </p>
      </div>

      {/* Conteúdo */}
      <div>
        <span className="text-xl font-semibold uppercase tracking-[0.5em] text-[#cdb892]">
          {title}
        </span>

        <p className="mt-4 max-w-2xl text-lg font-light leading-8 text-[#8f9f8a]">
          {text}
        </p>
      </div>
    </div>
  );
}

function VenueText({ label, title, text, cta, href }) {
  return (
    <div className="reveal-on-scroll">
      <p className="text-xs font-semibold uppercase tracking-[0.45em] text-[#b7c4b0]/70">
        {label}
      </p>

      <h3 className="mt-6 text-4xl font-extrabold leading-none tracking-[-0.06em] text-[#b7c4b0] md:text-5xl">
        {title}
      </h3>

      <p className="mt-6 text-lg font-light leading-8 text-[#8f9f8a]">{text}</p>

      <Link
        to={href}
        className="mt-8 inline-block cursor-pointer text-xs font-bold uppercase tracking-[0.35em] text-[#cdb892] transition hover:opacity-70"
      >
        {cta}
      </Link>
    </div>
  );
}
