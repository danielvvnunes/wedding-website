// import hotel1Img from "./assets/hotel1.jpg";
// import hotel2Img from "./assets/hotel2.jpg";
// import hotel3Img from "./assets/hotel3.jpg";
import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  getGuestInvitationPath,
  saveGuestInvitationSlug,
} from "./lib/guestInvitation";

const styles = `
@import url("https://fonts.googleapis.com/css2?family=Urbanist:wght@300;400;500;600;700;800&display=swap");

* {
  font-family: "Urbanist", Arial, Helvetica, sans-serif;
}

.page-bg {
  background:
    radial-gradient(circle at 20% 8%, rgba(183,196,176,.18), transparent 28%),
    radial-gradient(circle at 86% 38%, rgba(183,196,176,.12), transparent 26%),
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
}

.gold-accent {
  color: #cdb892;
}
`;

// const accommodations = [
//   {
//     name: "Hotel sugerido 1",
//     area: "Lisboa / Loures",
//     description:
//       "Boa opção para quem quer ficar relativamente perto da igreja e com acesso fácil à quinta.",
//     link: "#",
//     image: hotel3Img,
//   },
//   {
//     name: "Hotel sugerido 2",
//     area: "Sacavém / Parque das Nações",
//     description:
//       "Zona prática para quem vem de fora, com transportes, restaurantes e ligação rápida ao aeroporto.",
//     link: "#",
//     image: hotel3Img,
//   },
//   {
//     name: "Hotel sugerido 3",
//     area: "Santa Iria da Azóia / Alverca",
//     description:
//       "Opção mais próxima da cerimónia, ideal para quem prefere evitar deslocações longas no próprio dia.",
//     link: "#",
//     image: hotel3Img,
//   },
// ];

export default function AccommodationAndLocations() {
  const [searchParams] = useSearchParams();
  const invitationPath = getGuestInvitationPath(searchParams);

  useEffect(() => {
    const convite = searchParams.get("convite");
    if (convite) saveGuestInvitationSlug(convite);
  }, [searchParams]);

  return (
    <main className="page-bg min-h-screen text-[#8f9f8a]">
      <style>{styles}</style>
      <section className="relative px-6 py-20 text-center md:py-28">
        <div className="absolute right-6 top-6 z-20 md:right-10 md:top-10">
          <Link
            to={invitationPath}
            className="
      inline-flex items-center gap-2
      rounded-full
      border border-[#cdb892]
      bg-[#fbfaf5]/75
      px-5 py-3
      text-[10px] font-bold uppercase tracking-[0.22em]
      text-[#cdb892]
      backdrop-blur-sm
      transition-all duration-300
      hover:-translate-y-[2px]
      hover:bg-[#cdb892]
      hover:text-white
      hover:shadow-[0_8px_30px_rgba(205,184,146,0.35)]
      md:px-6
      md:text-xs
    "
          >
            ← Voltar ao convite
          </Link>
        </div>
        <div className="mx-auto max-w-5xl">
          <p className="gold-accent text-xs font-semibold uppercase tracking-[0.45em]">
            Informações úteis
          </p>

          <div className="gold-line mx-auto mt-6 max-w-[180px]" />

          <h1 className="mt-8 text-5xl font-extrabold leading-[0.9] tracking-[-0.03em] text-[#b7c4b0] md:text-7xl">
            Localizações
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-lg font-light leading-8">
            Para vos ajudar a organizar a viagem, reunimos algumas informações
            sobre os locais principais do nosso dia.
          </p>
        </div>
      </section>
      {/* <section className="section-green px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <SectionTitle
            eyebrow="Alojamento"
            title="Sugestões para ficar perto"
            text="Estas opções são apenas sugestões para facilitar a vossa escolha. Recomendamos confirmarem disponibilidade, preços e condições diretamente com cada alojamento."
          />

          <div className="mt-16 grid gap-10 md:grid-cols-3">
            {accommodations.map((item) => (
              <AccommodationItem key={item.name} {...item} />
            ))}
          </div>
        </div>
      </section> */}
      <section id="igreja" className="section-cream px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <SectionTitle
            eyebrow="Cerimónia"
            title="A Igreja"
            text="A cerimónia terá lugar na igreja Matriz de Santa Iria de Azóia. Sugerimos que cheguem com alguma antecedência, para estacionarem com tranquilidade e poderem entrar sem pressas."
          />

          <LocationBlock
            label="Igreja"
            title="Igreja Matriz de Santa Iria de Azóia"
            address="Rua de Angola, 2690-344 Santa Iria de Azóia"
            mapSrc="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3107.4179527991105!2d-9.089307422493851!3d38.84578887173518!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd192e89465d51d7%3A0x443515f5b1f840ae!2sIgreja%20Matriz%20de%20Santa%20Iria%20de%20Az%C3%B3ia!5e0!3m2!1spt-PT!2spt!4v1777837111002!5m2!1spt-PT!2spt"
            mapsLink="https://maps.app.goo.gl/YzoaNzKpyaUGtN9r5"
            wazeLink="https://waze.com/ul/heycscpxjh"
          />
        </div>
      </section>

      <section id="quinta" className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <SectionTitle
            eyebrow="Celebração"
            title="A Quinta"
            text="Após a cerimónia, seguiremos juntos para a quinta, onde partilharemos momentos especiais."
          />

          <LocationBlock
            label="Quinta"
            title="Quinta do Coração"
            address="Estrada da Arruda, Quinta do Coração, A-dos-Bispos, 2600-011 Vila Franca de Xira"
            mapSrc="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d49638.49983203811!2d-8.98999735!3d38.960391!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd1927e169ab253d%3A0xbb3a6b144f0b0c1c!2sQuinta%20do%20Cora%C3%A7%C3%A3o%20-%20Grupo%20MS!5e0!3m2!1spt-PT!2spt!4v1777837219637!5m2!1spt-PT!2spt"
            mapsLink="https://maps.app.goo.gl/5WhycQxLRoJb59EfA"
            wazeLink="https://waze.com/ul/heyctdgxz2"
          />
        </div>
      </section>
      <footer className="section-cream px-6 py-16 text-center text-[#b7c4b0]">
        <div className="soft-line mx-auto mb-12 max-w-4xl" />

        <p className="text-3xl font-extrabold tracking-[-0.06em]">F · D</p>

        <p className="mt-4 text-sm text-[#8f9f8a]">
          Francisca & Daniel · 26 de setembro de 2026
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
    </main>
  );
}

function SectionTitle({ eyebrow, title, text }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="gold-accent text-xs font-semibold uppercase tracking-[0.45em]">
        {eyebrow}
      </p>

      <div className="gold-line mx-auto mt-6 max-w-[180px]" />

      <h2 className="mt-8 text-4xl font-extrabold leading-[0.95] tracking-[-0.03em] text-[#b7c4b0] md:text-6xl">
        {title}
      </h2>

      <p className="mx-auto mt-8 max-w-2xl text-lg font-light leading-8 text-[#8f9f8a]">
        {text}
      </p>
    </div>
  );
}

// function AccommodationItem({ name, area, description, link, image }) {
//   return (
//     <article className="text-center">
//       {/* Imagem */}
//       <div className="overflow-hidden rounded-[1.8rem] border border-[#b7c4b0]/35 shadow-[0_14px_45px_rgba(143,159,138,0.12)]">
//         <img
//           src={image}
//           alt={name}
//           className="h-[200px] w-full object-cover transition duration-700 hover:scale-105"
//         />
//       </div>

//       <p className="gold-accent mt-6 text-xs font-semibold uppercase tracking-[0.35em]">
//         {area}
//       </p>

//       <h3 className="mt-4 text-3xl font-extrabold leading-none tracking-[-0.03em] text-[#6f7f69]">
//         {name}
//       </h3>

//       <p className="mt-4 text-base font-light leading-7 text-[#7f8f78]">
//         {description}
//       </p>

//       <a
//         href={link}
//         target="_blank"
//         rel="noreferrer"
//         className="mt-6 inline-flex rounded-full border border-[#cdb892] px-6 py-3 text-xs font-bold uppercase tracking-[0.26em] text-[#cdb892] transition hover:bg-[#cdb892] hover:text-white"
//       >
//         Ver alojamento
//       </a>
//     </article>
//   );
// }
function LocationBlock({ label, title, address, mapSrc, mapsLink, wazeLink }) {
  return (
    <div className="mt-16 grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:items-center">
      <div>
        <p className="gold-accent text-xs font-semibold uppercase tracking-[0.4em]">
          {label}
        </p>

        <h3 className="mt-5 text-4xl font-extrabold leading-none tracking-[-0.03em] text-[#b7c4b0] md:text-5xl">
          {title}
        </h3>

        <p className="mt-6 text-lg font-light leading-8 text-[#8f9f8a]">
          {address}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href={mapsLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex justify-center rounded-full border border-[#cdb892] px-6 py-3 text-xs font-bold uppercase tracking-[0.26em] text-[#cdb892] transition hover:bg-[#cdb892] hover:text-white"
          >
            Google Maps
          </a>

          <a
            href={wazeLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex justify-center rounded-full border border-[#8f9f8a] px-6 py-3 text-xs font-bold uppercase tracking-[0.26em] text-[#8f9f8a] transition hover:bg-[#8f9f8a] hover:text-white"
          >
            Waze
          </a>
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.8rem] border border-[#b7c4b0]/35 bg-white/40 shadow-[0_14px_45px_rgba(143,159,138,0.12)]">
        <iframe
          src={mapSrc}
          title={title}
          className="h-[320px] w-full md:h-[420px]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}
