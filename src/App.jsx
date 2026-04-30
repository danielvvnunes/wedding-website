import { Routes, Route } from "react-router-dom";
import WeddingWebsite from "./Wedding";
import AdminRSVP from "./AdminRSVP";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<WeddingWebsite />} />
      <Route path="/:guestSlug" element={<WeddingWebsite />} />
      <Route path="/admin" element={<AdminRSVP />} />
    </Routes>
  );
}
