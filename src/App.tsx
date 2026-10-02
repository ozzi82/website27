import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import ServicePage from "./pages/ServicePage";
import GalleryPage from "./pages/GalleryPage";
import ContactPage from "./pages/ContactPage";
import ConfigurationPage from "./pages/ConfigurationPage";

// The embedded HubSpot form triggers this harmless browser warning; keep it from surfacing as an error.
if (typeof window !== "undefined" && window.ResizeObserver && !(window as any).__roPatched) {
  // Defer observer callbacks a frame so layout changes inside them can't trigger the loop warning.
  const NativeRO = window.ResizeObserver;
  window.ResizeObserver = class extends NativeRO {
    constructor(cb: ResizeObserverCallback) {
      super((entries, obs) => {
        requestAnimationFrame(() => cb(entries, obs));
      });
    }
  };
  (window as any).__roPatched = true;
}

if (typeof window !== "undefined") {
  window.addEventListener("error", (e) => {
    if (e.message?.includes("ResizeObserver loop")) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  }, true);
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/services/:id" element={<ServicePage />} />
            <Route path="/light-effects/:id" element={<ConfigurationPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
