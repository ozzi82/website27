import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import * as THREE from "three";
import ConfiguratorPage from "../ConfiguratorPage";
import { parseArtwork } from "../../components/configurator/parseArtwork";

vi.mock("../../components/configurator/parseArtwork", () => ({
  parseArtwork: vi.fn(),
}));

vi.mock("../../components/configurator/SignPreview", () => ({
  default: () => <div data-testid="sign-preview-stub" />,
}));

// jsdom has no real WebGL, so the real isWebglSupported() genuinely returns
// false in this test environment (confirmed by Task 1's own test file) —
// without this mock, ConfiguratorPage renders its WebGL-unavailable fallback
// instead of the chooser/upload/config flow these tests exercise. This mock
// and the SignPreview mock above are solving opposite problems that happen to
// look similar: SignPreview is mocked because real WebGL rendering doesn't
// work here; webglSupport is mocked because jsdom's FAKE "no WebGL" would
// otherwise make the page behave as if a real user's browser can't render 3D
// at all, which isn't what these tests are checking.
vi.mock("../../components/configurator/webglSupport", () => ({
  useWebglSupported: () => true,
  isWebglSupported: () => true,
}));

function renderPage(initialPath: string) {
  render(
    // ConfiguratorPage renders <Seo>, which needs a <HelmetProvider> ancestor
    // (react-helmet-async throws otherwise) — in the real app this is
    // supplied once, globally, by src/main.tsx. Tests that render
    // ConfiguratorPage standalone need to provide it themselves, the same
    // kind of test-harness-vs-real-root gap the webglSupport mock above
    // addresses.
    <HelmetProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/configurator" element={<ConfiguratorPage />} />
          <Route path="/contact" element={<div>Contact Page</div>} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  );
}

describe("ConfiguratorPage end-to-end smoke tests", () => {
  it("Trimless path: choose product, upload, change illumination, toggle day/night, reach Get a Quote", async () => {
    const user = userEvent.setup();
    vi.mocked(parseArtwork).mockResolvedValue([new THREE.Shape()]);

    renderPage("/configurator");

    await user.click(screen.getByText(/trimless letters/i));

    const file = new File(["<svg></svg>"], "logo.svg", { type: "image/svg+xml" });
    await user.upload(screen.getByLabelText(/upload your logo/i), file);

    expect(await screen.findByTestId("sign-preview-stub")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/illumination/i), "halo-lit");
    await user.click(screen.getByLabelText(/day.*night|night.*day/i));

    expect(screen.getByRole("link", { name: /get a quote/i })).toHaveAttribute("href", "/contact");
  });

  it("Cast Block Acrylic path: pre-selected via query param, upload, change acrylic color, toggle day/night, reach Get a Quote", async () => {
    const user = userEvent.setup();
    vi.mocked(parseArtwork).mockResolvedValue([new THREE.Shape()]);

    renderPage("/configurator?product=cast-block-acrylic");

    expect(screen.queryByText(/trimless letters/i)).not.toBeInTheDocument();

    const file = new File(["<svg></svg>"], "logo.svg", { type: "image/svg+xml" });
    await user.upload(screen.getByLabelText(/upload your logo/i), file);

    expect(await screen.findByTestId("sign-preview-stub")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/acrylic color/i), "opal");
    await user.click(screen.getByLabelText(/day.*night|night.*day/i));

    expect(screen.getByRole("link", { name: /get a quote/i })).toHaveAttribute("href", "/contact");
  });
});
