import NotFoundPage from "./pages/NotFoundPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import CookieBanner from "./components/CookieBanner";
import ChatLauncher from "./components/ChatLauncher";
import TrackingListener from "./components/TrackingListener";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import ProjectsPage from "./pages/ProjectsPage";
import CaseStudyPage from "./pages/CaseStudyPage";
import ManufacturingPage from "./pages/ManufacturingPage";
import ChannelLettersPage from "./pages/ChannelLettersPage";
import UltraSlimPage from "./pages/UltraSlimPage";
import CustomFabricationPage from "./pages/CustomFabricationPage";
import ContactPage from "./pages/ContactPage";
import ConfigurationPage from "./pages/ConfigurationPage";
import { LEGACY_PAGE_REDIRECTS } from "./lib/routes";

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
          <Route path="/services/channel-letters" element={<ChannelLettersPage />} />
          <Route path="/services/ultra-slim-trimless-channel-letters" element={<UltraSlimPage />} />
          <Route path="/services/custom-sign-fabrication" element={<CustomFabricationPage />} />
          <Route path="/light-effects/:id" element={<ConfigurationPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/manufacturing" element={<ManufacturingPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          {/* Case studies come from data/caseStudies.ts (none yet); an unknown slug goes back to /projects. */}
          <Route path="/projects/:slug" element={<CaseStudyPage />} />
          {Object.entries(LEGACY_PAGE_REDIRECTS).map(([from, to]) => (
            <Route key={from} path={from} element={<Navigate to={to} replace />} />
          ))}
          {/* Any other /services/... URL (retired or mistyped) goes home. */}
          <Route path="/services/*" element={<NotFoundPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route
            path="/configurator"
            element={
              <Suspense fallback={<div className="pt-28 pb-24 text-center text-muted-foreground">Loading…</div>}>
                <ConfiguratorPage />
              </Suspense>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
      <CookieBanner />
      <ChatLauncher />
      <TrackingListener />
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
