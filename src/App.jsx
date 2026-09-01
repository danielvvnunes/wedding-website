import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import WeddingWebsiteV1 from "./WeddingWebsiteV1";
import WeddingWebsiteV2 from "./WeddingWebsiteV2";
import WeddingWebsiteV3 from "./WeddingWebsiteV3";
import ConvemSaber from "./convemSaber";
import GalleryPage from "./GalleryPage";
import LiveWallPage from "./LiveWallPage";
import ScrollToTop from "./ScrollToTop";

import AdminRSVP from "./AdminRSVP";

const GalleryAppPage = lazy(() => import("./GalleryAppPage"));

export default function App() {
  return (
    <>
      <ScrollToTop />

      <Routes>
        <Route path="/" element={<WeddingWebsiteV3 />} />
        <Route path="/v1" element={<WeddingWebsiteV1 />} />
        <Route path="/v2" element={<WeddingWebsiteV2 />} />
        <Route path="/v3" element={<WeddingWebsiteV3 />} />

        <Route path="/convemsaber" element={<ConvemSaber />} />
        <Route path="/admin" element={<AdminRSVP />} />
        <Route path="/galeria" element={<GalleryPage />} />
        <Route
          path="/app"
          element={
            <Suspense
              fallback={
                <main className="min-h-screen bg-[#fbfaf5] px-4 py-8 text-[#8f9f8a]">
                  <div className="mx-auto max-w-3xl text-sm font-semibold">
                    A abrir a galeria...
                  </div>
                </main>
              }
            >
              <GalleryAppPage />
            </Suspense>
          }
        />
        <Route path="/wall" element={<LiveWallPage />} />

        <Route path="/:guestSlug" element={<WeddingWebsiteV3 />} />
      </Routes>
    </>
  );
}
