import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import ServicePage from "./pages/ServicePage";
import GalleryPage from "./pages/GalleryPage";
import ContactPage from "./pages/ContactPage";
import ConfigurationPage from "./pages/ConfigurationPage";

// WebGL page: only ever rendered in the browser (never prerendered).
const ConfiguratorPage = lazy(() => import("./pages/ConfiguratorPage"));

/**
 * Layout + routes, shared by the browser entry (inside BrowserRouter) and the server entry
 * (inside StaticRouter, see entry-server.tsx).
 */
export function AppRoutes() {
  return (
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
          <Route
            path="/configurator"
            element={
              <Suspense fallback={<div className="pt-28 pb-24 text-center text-muted-foreground">Loading…</div>}>
                <ConfiguratorPage />
              </Suspense>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
