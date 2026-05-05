import { Routes, Route } from "react-router-dom";
import WeddingWebsiteV1 from "./WeddingWebsiteV1";
import WeddingWebsiteV2 from "./WeddingWebsiteV2";
import WeddingWebsiteV3 from "./WeddingWebsiteV3";
import ConvemSaber from "./convemSaber";
import GalleryPage from "./GalleryPage";
import ScrollToTop from "./ScrollToTop";

import AdminRSVP from "./AdminRSVP";

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

        <Route path="/:guestSlug" element={<WeddingWebsiteV3 />} />
      </Routes>
    </>
  );
}
