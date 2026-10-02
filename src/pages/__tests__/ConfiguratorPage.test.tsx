import { describe, it, expect, vi, afterEach } from "vitest";
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

const previewState = vi.hoisted(() => ({ shouldThrow: false }));

vi.mock("../../components/configurator/SignPreview", () => ({
  default: () => {
    if (previewState.shouldThrow) throw new Error("WebGL context lost");
    return <div data-testid="sign-preview-stub" />;
  },
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

const file = () => new File(["<svg></svg>"], "logo.svg", { type: "image/svg+xml" });

async function upload(user: ReturnType<typeof userEvent.setup>) {
  await user.upload(screen.getByLabelText(/upload your logo/i), file());
  return screen.findByTestId("sign-preview-stub");
}

describe("ConfiguratorPage end-to-end smoke tests", () => {
  it("chooser path: pick a configuration, upload, change depth, toggle day/night, reach Get a Quote", async () => {
    const user = userEvent.setup();
    vi.mocked(parseArtwork).mockResolvedValue([new THREE.Shape()]);

    renderPage("/configurator");

    expect(screen.getAllByRole("button", { name: /EdgeLuxe LP/ })).toHaveLength(12);
    await user.click(screen.getByRole("button", { name: /EdgeLuxe LP 3\.1/ }));
    expect(screen.queryByRole("button", { name: /EdgeLuxe LP 5/ })).not.toBeInTheDocument(); // chooser is gone

    await upload(user);

    await user.selectOptions(screen.getByLabelText("Depth"), "100");
    expect(screen.getByLabelText("Depth")).toHaveValue("100");
    await user.click(screen.getByLabelText(/day.*night|night.*day/i));
    expect(screen.getByLabelText(/day.*night|night.*day/i)).toBeChecked();

    expect(screen.getByRole("link", { name: /get a quote/i })).toHaveAttribute("href", "/contact");
  });

  it("preselects the configuration from ?config= and skips the chooser", async () => {
    const user = userEvent.setup();
    vi.mocked(parseArtwork).mockResolvedValue([new THREE.Shape()]);

    renderPage("/configurator?config=lp-11-b-back-lit");

    expect(screen.queryByRole("button", { name: /EdgeLuxe LP 5/ })).not.toBeInTheDocument();
    expect(screen.getByText("LP 11-B")).toBeInTheDocument();
    await upload(user);
    const depth = screen.getByLabelText("Depth") as HTMLSelectElement;
    expect([...depth.options].map((o) => o.value)).toEqual(["10", "15", "20", "30"]);
    expect(depth).toHaveValue("30");
  });

  it("falls back to the chooser for an unknown ?config= id", () => {
    renderPage("/configurator?config=lp-99-nonexistent");
    expect(screen.getAllByRole("button", { name: /EdgeLuxe LP/ })).toHaveLength(12);
    expect(screen.queryByLabelText(/upload your logo/i)).not.toBeInTheDocument();
  });

  it("lets the user swap the logo without losing the chosen configuration and its settings", async () => {
    const user = userEvent.setup();
    vi.mocked(parseArtwork).mockResolvedValue([new THREE.Shape()]);
    renderPage("/configurator?config=lp-5-trimless-face-lit");
    await upload(user);
    await user.selectOptions(screen.getByLabelText("Depth"), "75");

    await user.click(screen.getByRole("button", { name: /use a different file/i }));

    // Back to the upload step: no preview, no replace button, dropzone is shown.
    expect(screen.queryByTestId("sign-preview-stub")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /use a different file/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/upload your logo/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /EdgeLuxe LP 3\.1/ })).not.toBeInTheDocument(); // chooser not shown again

    // Uploading the same filename again works, and the configuration was kept.
    await upload(user);
    expect(screen.getByLabelText("Depth")).toHaveValue("75");
  });

  it("switching configuration keeps the uploaded artwork and resets to the new defaults", async () => {
    const user = userEvent.setup();
    vi.mocked(parseArtwork).mockResolvedValue([new THREE.Shape()]);
    renderPage("/configurator?config=lp-5-trimless-face-lit");
    await upload(user);
    await user.selectOptions(screen.getByLabelText("Depth"), "75");
    await user.click(screen.getByLabelText(/day.*night|night.*day/i));

    await user.click(screen.getByRole("button", { name: /change configuration/i }));
    expect(screen.getAllByRole("button", { name: /EdgeLuxe LP/ })).toHaveLength(12);
    await user.click(screen.getByRole("button", { name: /EdgeLuxe LP 11-F Block/ }));

    // Straight to the preview with the same artwork (no second upload) and LP 11-F's defaults.
    expect(screen.getByTestId("sign-preview-stub")).toBeInTheDocument();
    expect(screen.queryByLabelText(/upload your logo/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Depth")).toHaveValue("30");
    expect(screen.getByLabelText(/day.*night|night.*day/i)).not.toBeChecked();
    expect(parseArtwork).toHaveBeenCalledTimes(1);
  });

  it("has no letter height input; the minimum height is guidance text", async () => {
    const user = userEvent.setup();
    vi.mocked(parseArtwork).mockResolvedValue([new THREE.Shape()]);
    renderPage("/configurator?config=lp-3-1-standoff-halo");
    await upload(user);
    expect(screen.queryByLabelText(/letter height/i)).not.toBeInTheDocument();
    expect(screen.getByText(/minimum letter height/i)).toHaveTextContent("2″ (50 mm)");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("keeps the chosen background when switching configuration", async () => {
    const user = userEvent.setup();
    vi.mocked(parseArtwork).mockResolvedValue([new THREE.Shape()]);
    renderPage("/configurator?config=lp-5-trimless-face-lit");
    await upload(user);
    expect(screen.getByRole("radio", { name: "Concrete" })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: "Brick" }));
    expect(screen.getByRole("radio", { name: "Brick" })).toBeChecked();

    await user.click(screen.getByRole("button", { name: /change configuration/i }));
    await user.click(screen.getByRole("button", { name: /EdgeLuxe LP 11-F Block/ }));

    expect(screen.getByRole("radio", { name: "Brick" })).toBeChecked();
    expect(screen.getByLabelText("Depth")).toHaveValue("30"); // everything else still resets
  });

  it("only offers 'Use a different file' once a logo has been uploaded", () => {
    renderPage("/configurator?config=lp-11-f-face-lit");
    expect(screen.queryByRole("button", { name: /use a different file/i })).not.toBeInTheDocument();
  });

  describe("preview failure", () => {
    afterEach(() => {
      previewState.shouldThrow = false;
      vi.restoreAllMocks();
    });

    it("shows a local fallback (with contact link and retry) instead of crashing the page when the preview throws", async () => {
      const user = userEvent.setup();
      vi.spyOn(console, "error").mockImplementation(() => {}); // React logs caught render errors
      vi.mocked(parseArtwork).mockResolvedValue([new THREE.Shape()]);
      previewState.shouldThrow = true;

      renderPage("/configurator?config=lp-11-f-face-lit");
      await user.upload(screen.getByLabelText(/upload your logo/i), file());

      expect(await screen.findByText(/3D preview couldn't load/i)).toBeInTheDocument();
      expect(screen.queryByText(/WebGL context lost/)).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: /send it to us directly/i })).toHaveAttribute("href", "/contact");
      // The rest of the page keeps working.
      expect(screen.getByLabelText("Depth")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /get a quote/i })).toBeInTheDocument();

      // Retry re-renders the preview once the underlying problem is gone.
      previewState.shouldThrow = false;
      await user.click(screen.getByRole("button", { name: /try again/i }));
      expect(await screen.findByTestId("sign-preview-stub")).toBeInTheDocument();
    });
  });
});
