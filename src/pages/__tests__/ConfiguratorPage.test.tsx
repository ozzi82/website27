import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import * as THREE from "three";
import ConfiguratorPage from "../ConfiguratorPage";
import { parseArtwork } from "../../components/configurator/parseArtwork";
import { generateTextShapes } from "../../components/configurator/textArtwork";
import { TextRenderError } from "../../components/configurator/textToShapes";

vi.mock("../../components/configurator/parseArtwork", () => ({
  parseArtwork: vi.fn(),
}));

// The real generator pulls in opentype.js and a font file over the network; the page only cares that the
// debounced text and chosen font are handed to it and what comes back is shown.
vi.mock("../../components/configurator/textArtwork", () => ({
  generateTextShapes: vi.fn(),
}));
vi.mock("../../components/configurator/fontFaces", () => ({
  ensureFontFaces: vi.fn().mockResolvedValue(undefined),
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

  describe("typed text artwork", () => {
    beforeEach(() => {
      vi.mocked(generateTextShapes).mockReset();
      vi.mocked(generateTextShapes).mockImplementation(async (text) =>
        text.trim() === "" ? { shapes: null, skipped: [] } : { shapes: [new THREE.Shape()], skipped: [] }
      );
    });

    async function chooseText(user: ReturnType<typeof userEvent.setup>) {
      await user.click(screen.getByRole("radio", { name: "Type text" }));
    }

    it("defaults to uploading a logo and offers the toggle", () => {
      renderPage("/configurator?config=lp-5-trimless-face-lit");
      expect(screen.getByRole("radio", { name: "Upload logo" })).toBeChecked();
      expect(screen.getByLabelText(/upload your logo/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/your text/i)).not.toBeInTheDocument();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("shows the text box, the font picker and an empty prompt (no error) in text mode", async () => {
      const user = userEvent.setup();
      renderPage("/configurator?config=lp-5-trimless-face-lit");
      await chooseText(user);

      expect(screen.queryByLabelText(/upload your logo/i)).not.toBeInTheDocument();
      expect(screen.getByLabelText(/your text/i)).toHaveValue("");
      expect(screen.getByRole("radiogroup", { name: /font/i })).toBeInTheDocument();
      expect(screen.getByText(/type your text to see your sign/i)).toBeInTheDocument();
      expect(screen.queryByTestId("sign-preview-stub")).not.toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(generateTextShapes).not.toHaveBeenCalled();
    });

    it("builds the preview from typed text (debounced) and keeps the configuration controls", async () => {
      const user = userEvent.setup();
      renderPage("/configurator?config=lp-5-trimless-face-lit");
      await chooseText(user);
      await user.selectOptions(screen.getByLabelText("Depth"), "75");

      await user.type(screen.getByLabelText(/your text/i), "Sunlite");
      expect(await screen.findByTestId("sign-preview-stub")).toBeInTheDocument();
      expect(generateTextShapes).toHaveBeenCalledTimes(1); // typing 7 characters in a row is one rebuild
      expect(generateTextShapes).toHaveBeenCalledWith("Sunlite", "montserrat");
      expect(screen.getByRole("status")).toHaveTextContent("Preview updated");
      expect(screen.getByLabelText("Depth")).toHaveValue("75");
    });

    it("rebuilds with the new font when the font changes, without touching depth or the text", async () => {
      const user = userEvent.setup();
      renderPage("/configurator?config=lp-5-trimless-face-lit");
      await chooseText(user);
      await user.selectOptions(screen.getByLabelText("Depth"), "75");
      await user.type(screen.getByLabelText(/your text/i), "Hi");
      await screen.findByTestId("sign-preview-stub");

      await user.click(screen.getByRole("radio", { name: "Pacifico" }));
      await waitFor(() => expect(generateTextShapes).toHaveBeenLastCalledWith("Hi", "pacifico"));
      expect(screen.getByLabelText(/your text/i)).toHaveValue("Hi");
      expect(screen.getByLabelText("Depth")).toHaveValue("75");
    });

    it("returns to the prompt, with no error, when the text is cleared", async () => {
      const user = userEvent.setup();
      renderPage("/configurator?config=lp-5-trimless-face-lit");
      await chooseText(user);
      await user.type(screen.getByLabelText(/your text/i), "Hi");
      await screen.findByTestId("sign-preview-stub");

      await user.clear(screen.getByLabelText(/your text/i));
      expect(screen.queryByTestId("sign-preview-stub")).not.toBeInTheDocument();
      expect(screen.getByText(/type your text to see your sign/i)).toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("shows a friendly message and no preview when the text cannot be rendered", async () => {
      const user = userEvent.setup();
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(generateTextShapes).mockRejectedValue(new TextRenderError("no glyphs"));
      renderPage("/configurator?config=lp-5-trimless-face-lit");
      await chooseText(user);
      await user.type(screen.getByLabelText(/your text/i), "x");

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Couldn't render that text with this font. Try different characters or another font."
      );
      expect(screen.queryByTestId("sign-preview-stub")).not.toBeInTheDocument();
      expect(screen.getByLabelText("Depth")).toBeInTheDocument(); // the page keeps working
      spy.mockRestore();
    });

    it("keeps the uploaded artwork and the typed text apart when switching back and forth", async () => {
      const user = userEvent.setup();
      vi.mocked(parseArtwork).mockResolvedValue([new THREE.Shape()]);
      renderPage("/configurator?config=lp-5-trimless-face-lit");

      // Upload first, then switch to text: the uploaded sign must not be shown for the text source.
      await upload(user);
      await user.selectOptions(screen.getByLabelText("Depth"), "75");
      await chooseText(user);
      expect(screen.queryByTestId("sign-preview-stub")).not.toBeInTheDocument();
      expect(screen.getByLabelText("Depth")).toHaveValue("75");
      expect(screen.queryByRole("button", { name: /use a different file/i })).not.toBeInTheDocument();

      await user.type(screen.getByLabelText(/your text/i), "Hello");
      await user.click(screen.getByRole("radio", { name: "Poppins" }));
      await screen.findByTestId("sign-preview-stub");

      // Back to upload: the earlier upload returns at once, text controls are gone.
      await user.click(screen.getByRole("radio", { name: "Upload logo" }));
      expect(screen.getByTestId("sign-preview-stub")).toBeInTheDocument();
      expect(screen.queryByLabelText(/your text/i)).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /use a different file/i })).toBeInTheDocument();
      expect(screen.getByLabelText("Depth")).toHaveValue("75");

      // Back to text: what was typed, and the font, were remembered.
      await chooseText(user);
      expect(screen.getByLabelText(/your text/i)).toHaveValue("Hello");
      expect(screen.getByRole("radio", { name: "Poppins" })).toBeChecked();
      expect(screen.getByTestId("sign-preview-stub")).toBeInTheDocument();
    });

    it("shows the upload prompt when switching to upload before anything was uploaded", async () => {
      const user = userEvent.setup();
      renderPage("/configurator?config=lp-5-trimless-face-lit");
      await chooseText(user);
      await user.type(screen.getByLabelText(/your text/i), "Hello");
      await screen.findByTestId("sign-preview-stub");

      await user.click(screen.getByRole("radio", { name: "Upload logo" }));
      expect(screen.queryByTestId("sign-preview-stub")).not.toBeInTheDocument();
      expect(screen.getByLabelText(/upload your logo/i)).toBeInTheDocument();
    });

    it("keeps the text when switching configuration", async () => {
      const user = userEvent.setup();
      renderPage("/configurator?config=lp-5-trimless-face-lit");
      await chooseText(user);
      await user.type(screen.getByLabelText(/your text/i), "Hello");
      await screen.findByTestId("sign-preview-stub");

      await user.click(screen.getByRole("button", { name: /change configuration/i }));
      await user.click(screen.getByRole("button", { name: /EdgeLuxe LP 11-F Block/ }));
      expect(screen.getByLabelText(/your text/i)).toHaveValue("Hello");
      expect(screen.getByTestId("sign-preview-stub")).toBeInTheDocument();
      expect(screen.getByLabelText("Depth")).toHaveValue("30");
    });
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
