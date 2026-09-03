import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import ScrollToTop from "./ScrollToTop";

const WeddingWebsiteV1 = lazy(() => import("./WeddingWebsiteV1"));
const WeddingWebsiteV2 = lazy(() => import("./WeddingWebsiteV2"));
const WeddingWebsiteV3 = lazy(() => import("./WeddingWebsiteV3"));
const ConvemSaber = lazy(() => import("./convemSaber"));
const GalleryPage = lazy(() => import("./GalleryPage"));
const GalleryAppPage = lazy(() => import("./GalleryAppPage"));
const LiveWallPage = lazy(() => import("./LiveWallPage"));
const AdminRSVP = lazy(() => import("./AdminRSVP"));

function PageLoader() {
  return (
    <main className="min-h-screen bg-[#fbfaf5] px-4 py-8 text-[#8f9f8a]">
      <div className="mx-auto max-w-3xl text-sm font-semibold">
        A abrir...
      </div>
    </main>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<WeddingWebsiteV3 />} />
          <Route path="/v1" element={<WeddingWebsiteV1 />} />
          <Route path="/v2" element={<WeddingWebsiteV2 />} />
          <Route path="/v3" element={<WeddingWebsiteV3 />} />

          <Route path="/convemsaber" element={<ConvemSaber />} />
          <Route path="/admin" element={<AdminRSVP />} />
          <Route path="/galeria" element={<GalleryPage />} />
          <Route path="/app" element={<GalleryAppPage />} />
          <Route path="/wall" element={<LiveWallPage />} />

          <Route path="/:guestSlug" element={<WeddingWebsiteV3 />} />
        </Routes>
      </Suspense>
    </>
  );
}
