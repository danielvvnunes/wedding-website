import { Routes, Route } from "react-router-dom";
import WeddingWebsite from "./Wedding";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<WeddingWebsite />} />
      <Route path="/c/:guestSlug" element={<WeddingWebsite />} />
    </Routes>
  );
}
