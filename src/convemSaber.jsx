// import hotel1Img from "./assets/hotel1.jpg";
// import hotel2Img from "./assets/hotel2.jpg";
import hotel3Img from "./assets/hotel3.jpg";

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

const accommodations = [
  {
    name: "Hotel sugerido 1",
    area: "Lisboa / Loures",
    description:
      "Boa opção para quem quer ficar relativamente perto da igreja e com acesso fácil à quinta.",
    link: "#",
    image: hotel3Img,
  },
  {
    name: "Hotel sugerido 2",
    area: "Sacavém / Parque das Nações",
    description:
      "Zona prática para quem vem de fora, com transportes, restaurantes e ligação rápida ao aeroporto.",
    link: "#",
    image: hotel3Img,
  },
  {
    name: "Hotel sugerido 3",
    area: "Santa Iria da Azóia / Alverca",
    description:
      "Opção mais próxima da cerimónia, ideal para quem prefere evitar deslocações longas no próprio dia.",
    link: "#",
    image: hotel3Img,
  },
];

export default function AccommodationAndLocations() {
  return (
    <main className="page-bg min-h-screen text-[#8f9f8a]">
      <style>{styles}</style>

      <section className="px-6 py-20 text-center md:py-28">
        <div className="mx-auto max-w-5xl">
          <p className="gold-accent text-xs font-semibold uppercase tracking-[0.45em]">
            Informações úteis
          </p>

          <div className="gold-line mx-auto mt-6 max-w-[180px]" />

          <h1 className="mt-8 text-5xl font-extrabold leading-[0.9] tracking-[-0.03em] text-[#b7c4b0] md:text-7xl">
            Alojamento e localizações
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-lg font-light leading-8">
            Para vos ajudar a organizar a viagem, reunimos algumas sugestões de
            alojamento e informações sobre os locais principais do nosso dia.
          </p>
        </div>
      </section>

      <section className="section-green px-6 py-20 md:py-28">
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
      </section>

      <section className="section-cream px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <SectionTitle
            eyebrow="Cerimónia"
            title="Paróquia de Santa Iria da Azóia"
            text="A cerimónia será na igreja, em Santa Iria da Azóia. Sugerimos chegarem com alguma antecedência para estacionar com calma e entrar sem pressas."
          />

          <LocationBlock
            label="Igreja"
            title="Paróquia de Santa Iria da Azóia"
            address="Santa Iria da Azóia"
            mapSrc="https://www.google.com/maps?q=Paróquia%20de%20Santa%20Iria%20da%20Azóia&output=embed"
            mapsLink="https://www.google.com/maps/search/?api=1&query=Paróquia%20de%20Santa%20Iria%20da%20Azóia"
          />
        </div>
      </section>

      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <SectionTitle
            eyebrow="Celebração"
            title="A quinta"
            text="Depois da cerimónia, seguimos para a quinta, onde decorrerá o cocktail, a refeição e a festa. Mais perto da data partilharemos detalhes adicionais, caso seja necessário."
          />

          <LocationBlock
            label="Quinta"
            title="Nome da quinta"
            address="Morada da quinta"
            mapSrc="https://www.google.com/maps?q=Quinta%20casamento%20Lisboa&output=embed"
            mapsLink="https://www.google.com/maps/search/?api=1&query=Quinta%20casamento%20Lisboa"
          />
        </div>
      </section>

      <footer className="section-cream px-6 py-14 text-center">
        <p className="text-3xl font-extrabold tracking-[-0.06em] text-[#b7c4b0]">
          F · D
        </p>

        <p className="mt-4 text-sm text-[#8f9f8a]">
          Francisca & Daniel · 26.09.2026
        </p>
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

function AccommodationItem({ name, area, description, link, image }) {
  return (
    <article className="text-center">
      {/* Imagem */}
      <div className="overflow-hidden rounded-[1.8rem] border border-[#b7c4b0]/35 shadow-[0_14px_45px_rgba(143,159,138,0.12)]">
        <img
          src={image}
          alt={name}
          className="h-[200px] w-full object-cover transition duration-700 hover:scale-105"
        />
      </div>

      <p className="gold-accent mt-6 text-xs font-semibold uppercase tracking-[0.35em]">
        {area}
      </p>

      <h3 className="mt-4 text-3xl font-extrabold leading-none tracking-[-0.03em] text-[#6f7f69]">
        {name}
      </h3>

      <p className="mt-4 text-base font-light leading-7 text-[#7f8f78]">
        {description}
      </p>

      <a
        href={link}
        target="_blank"
        rel="noreferrer"
        className="mt-6 inline-flex rounded-full border border-[#cdb892] px-6 py-3 text-xs font-bold uppercase tracking-[0.26em] text-[#cdb892] transition hover:bg-[#cdb892] hover:text-white"
      >
        Ver alojamento
      </a>
    </article>
  );
}
function LocationBlock({ label, title, address, mapSrc, mapsLink }) {
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

        <a
          href={mapsLink}
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-flex rounded-full border border-[#cdb892] px-6 py-3 text-xs font-bold uppercase tracking-[0.26em] text-[#cdb892] transition hover:bg-[#cdb892] hover:text-white"
        >
          Abrir no Google Maps
        </a>
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
