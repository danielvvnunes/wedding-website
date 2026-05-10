import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import { Link } from "react-router-dom";

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
}

.upload-box {
  border: 1px dashed rgba(205,184,146,.65);
  background: rgba(255,255,255,.42);
}
`;

export default function GalleryPage() {
  const [name, setName] = useState("");
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState(null);
  const [uploadedItems, setUploadedItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [sortOrder, setSortOrder] = useState("recent");

  useEffect(() => {
    async function loadGallery() {
      const { data, error } = await supabase
        .from("wedding_gallery")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      setUploadedItems(
        data.map((item) => ({
          url: item.file_url,
          type: item.file_type,
          uploadedBy: item.uploaded_by,
          createdAt: item.created_at,
        })),
      );
    }

    loadGallery();
  }, []);

  function handleFiles(event) {
    const selectedFiles = Array.from(event.target.files || []);

    setFiles(selectedFiles);
    setStatus(null);

    const previews = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(previews);
  }

  async function uploadPhotos(event) {
    event.preventDefault();

    if (!name.trim()) {
      setStatus("missing-name");
      return;
    }

    if (!files.length) {
      setStatus("missing-files");
      return;
    }

    setIsUploading(true);
    setStatus(null);

    try {
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split(".").pop();

        const safeName = name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

        const filePath = `${safeName}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

        const { error } = await supabase.storage
          .from("wedding-gallery")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) throw error;

        const { data } = supabase.storage
          .from("wedding-gallery")
          .getPublicUrl(filePath);

        const publicUrl = data.publicUrl;

        const { error: dbError } = await supabase
          .from("wedding_gallery")
          .insert({
            uploaded_by: name,
            file_path: filePath,
            file_url: publicUrl,
            file_type: file.type,
          });

        if (dbError) throw dbError;

        return {
          url: publicUrl,
          type: file.type,
          uploadedBy: name,
          createdAt: new Date().toISOString(),
        };
      });

      const uploaded = await Promise.all(uploadPromises);

      setUploadedItems((current) => [...uploaded, ...current]);

      setFiles([]);
      setPreviewUrls([]);
      setName("");
      setStatus("success");
    } catch (error) {
      console.error(error);
      setStatus("error");
    } finally {
      setIsUploading(false);
    }
  }

  const sortedItems = [...uploadedItems].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();

    return sortOrder === "recent" ? dateB - dateA : dateA - dateB;
  });

  function downloadImage(url, index) {
    const link = document.createElement("a");
    link.href = url;
    link.download = `memoria-francisca-daniel-${index + 1}`;
    link.target = "_blank";
    link.rel = "noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <main className="page-bg min-h-screen text-[#8f9f8a]">
      <style>{styles}</style>

      <section className="px-6 py-20 text-center md:py-28">
        <div className="absolute right-6 top-6 z-20 md:right-10 md:top-10">
          <Link
            to="/"
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
            Galeria
          </p>

          <div className="gold-line mx-auto mt-6 max-w-[180px]" />

          <h1 className="mt-8 text-5xl font-extrabold leading-[0.9] tracking-[-0.03em] text-[#b7c4b0] md:text-7xl">
            Partilhem as vossas fotografias
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-lg font-light leading-8">
            Durante e depois do casamento, podem deixar aqui as fotografias que
            guardaram do nosso dia. Vamos adorar ver o dia pelos vossos olhos.
            Também podem ir adicionando fotos connosco até lá!
          </p>
        </div>
      </section>

      <section className="section-cream px-6 py-20 md:py-28">
        <div className="mx-auto max-w-3xl">
          <form
            onSubmit={uploadPhotos}
            className="rounded-[2rem] border border-[#b7c4b0]/35 bg-white/45 p-6 shadow-[0_18px_55px_rgba(143,159,138,0.14)] backdrop-blur-sm md:p-10"
          >
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#8f9f8a]">
                O vosso nome
              </label>

              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex: Ana e João"
                className="w-full rounded-[1.25rem] border border-[#b7c4b0]/50 bg-white/50 px-5 py-4 text-base text-[#7f8f78] outline-none transition focus:border-[#cdb892] focus:bg-white/80 focus:ring-4 focus:ring-[#cdb892]/15"
              />
            </div>

            <label className="upload-box mt-8 flex cursor-pointer flex-col items-center justify-center rounded-[1.8rem] px-6 py-12 text-center transition hover:bg-white/60">
              <span className="text-5xl">📷</span>

              <span className="mt-5 text-sm font-bold uppercase tracking-[0.28em] text-[#cdb892]">
                Escolher fotografias
              </span>

              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFiles}
                className="hidden"
              />
            </label>

            {!!previewUrls.length && (
              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {previewUrls.map((url, index) => (
                  <div
                    key={url}
                    className="overflow-hidden rounded-[1.2rem] border border-[#b7c4b0]/30 bg-white/50"
                  >
                    {files[index]?.type?.startsWith("video/") ? (
                      <video
                        src={url}
                        className="h-36 w-full object-cover"
                        muted
                        playsInline
                      />
                    ) : (
                      <img
                        src={url}
                        alt=""
                        className="h-36 w-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {status && (
              <p className="mt-8 text-center text-sm font-semibold text-[#8f9f8a]">
                {status === "success" &&
                  "Obrigada! As fotografias foram enviadas com sucesso. 🤍"}
                {status === "missing-name" &&
                  "Indica o teu nome antes de enviar."}
                {status === "missing-files" &&
                  "Escolhe pelo menos uma fotografia ou vídeo."}
                {status === "error" &&
                  "Não foi possível enviar. Tenta novamente."}
              </p>
            )}

            <div className="mt-10 text-center">
              <button
                type="submit"
                disabled={isUploading}
                className="cursor-pointer rounded-full border border-[#cdb892] px-10 py-4 text-xs font-bold uppercase tracking-[0.3em] text-[#cdb892] transition hover:-translate-y-[2px] hover:bg-[#cdb892] hover:text-white hover:shadow-[0_8px_30px_rgba(205,184,146,0.35)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUploading ? "A enviar..." : "Enviar fotografias"}
              </button>
            </div>
          </form>

          {!!uploadedItems.length && (
            <section className="mt-16">
              <div className="text-center">
                <p className="gold-accent text-xs font-semibold uppercase tracking-[0.45em]">
                  Memórias partilhadas
                </p>

                <div className="gold-line mx-auto mt-6 max-w-[180px]" />

                <h2 className="mt-5 text-4xl font-extrabold leading-[0.95] tracking-[-0.03em] text-[#b7c4b0] md:text-5xl">
                  As fotografias dos convidados
                </h2>

                <p className="mx-auto mt-6 max-w-xl text-base font-light leading-7 text-[#8f9f8a]">
                  {uploadedItems.length}{" "}
                  {uploadedItems.length === 1
                    ? "memória partilhada"
                    : "memórias partilhadas"}
                </p>

                <div className="mt-8 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSortOrder("recent")}
                    className={`rounded-full border px-5 py-2 text-[10px] font-bold uppercase tracking-[0.22em] transition ${
                      sortOrder === "recent"
                        ? "border-[#cdb892] bg-[#cdb892] text-white"
                        : "border-[#cdb892] text-[#cdb892] hover:bg-[#cdb892] hover:text-white"
                    }`}
                  >
                    Mais recentes
                  </button>

                  <button
                    type="button"
                    onClick={() => setSortOrder("oldest")}
                    className={`rounded-full border px-5 py-2 text-[10px] font-bold uppercase tracking-[0.22em] transition ${
                      sortOrder === "oldest"
                        ? "border-[#cdb892] bg-[#cdb892] text-white"
                        : "border-[#cdb892] text-[#cdb892] hover:bg-[#cdb892] hover:text-white"
                    }`}
                  >
                    Mais antigas
                  </button>
                </div>
              </div>

              <div className="mt-12 columns-1 gap-5 sm:columns-2 lg:columns-3">
                {sortedItems.map((item, index) => (
                  <article
                    key={`${item.url}-${index}`}
                    className="mb-5 break-inside-avoid overflow-hidden rounded-[1.6rem] border border-[#b7c4b0]/30 bg-white/55 shadow-[0_14px_40px_rgba(143,159,138,0.13)]"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedItem(item)}
                      className="block w-full cursor-zoom-in"
                    >
                      {item.type?.startsWith("video/") ? (
                        <video
                          src={item.url}
                          className="w-full object-cover"
                          muted
                        />
                      ) : (
                        <img
                          src={item.url}
                          alt=""
                          className="w-full object-cover transition duration-700 hover:scale-[1.03]"
                          loading="lazy"
                        />
                      )}
                    </button>

                    <div className="flex items-center justify-between gap-4 px-5 py-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#cdb892]">
                          Partilhado por
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[#8f9f8a]">
                          {item.uploadedBy}
                        </p>
                      </div>

                      {!item.type?.startsWith("video/") && (
                        <button
                          type="button"
                          onClick={() => downloadImage(item.url, index)}
                          className="rounded-full border border-[#cdb892]/70 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#cdb892] transition hover:bg-[#cdb892] hover:text-white"
                        >
                          Download
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
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

      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[2rem] bg-[#fbfaf5] p-3"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              className="absolute right-5 top-5 z-10 rounded-full bg-[#fbfaf5]/85 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#8f9f8a] backdrop-blur-sm"
            >
              Fechar
            </button>

            {selectedItem.type?.startsWith("video/") ? (
              <video
                src={selectedItem.url}
                controls
                autoPlay
                className="max-h-[82vh] w-full rounded-[1.5rem] object-contain"
              />
            ) : (
              <img
                src={selectedItem.url}
                alt=""
                className="max-h-[82vh] w-full rounded-[1.5rem] object-contain"
              />
            )}
          </div>
        </div>
      )}
    </main>
  );
}
