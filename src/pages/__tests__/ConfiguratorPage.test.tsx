import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import * as THREE from "three";
import ConfiguratorPage from "../ConfiguratorPage";
import { parseArtwork } from "../../components/configurator/parseArtwork";
import { generateTextArtworkFile, generateTextShapes } from "../../components/configurator/textArtwork";
import { loadArtworkFile } from "../../components/configurator/artworkFileStorage";
import { IDBFactory } from "fake-indexeddb";
import { TextRenderError } from "../../components/configurator/textToShapes";

vi.mock("../../components/configurator/parseArtwork", () => ({
  parseArtwork: vi.fn(),
}));

// The real generator pulls in opentype.js and a font file over the network; the page only cares that the
// debounced text and chosen font are handed to it and what comes back is shown.
vi.mock("../../components/configurator/textArtwork", () => ({
  generateTextShapes: vi.fn(),
  generateTextArtworkFile: vi.fn(),
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

/** Stands in for /contact: shows the quote that arrived in router state. */
function ContactProbe() {
  const state = useLocation().state as {
    quote?: { summary: string; image: string | null; savedAt: number; artworkFile?: unknown };
  } | null;
  return (
    <div>
      <p>Contact Page</p>
      <pre data-testid="quote-summary">{state?.quote?.summary ?? "no quote"}</pre>
      <p data-testid="quote-image">{state?.quote?.image ?? "no image"}</p>
      <p data-testid="quote-file">{JSON.stringify(state?.quote?.artworkFile ?? null)}</p>
      <p data-testid="quote-id">{state?.quote?.savedAt}</p>
    </div>
  );
}

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
          <Route path="/contact" element={<ContactProbe />} />
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
  it("is called Build Your Sign: H1, document title and description", async () => {
    renderPage("/configurator");
    expect(screen.getByRole("heading", { level: 1, name: "Build Your Sign" })).toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe("Build Your Sign: 3D Channel Letter Preview | Sunlite Signs"));
    expect(document.head.querySelector('meta[name="description"]')!.getAttribute("content")).toMatch(/wholesale pricing/i);
  });

  it("chooser path: pick a configuration, upload, change depth, toggle day/night, reach the quote button", async () => {
    const user = userEvent.setup();
    vi.mocked(parseArtwork).mockResolvedValue([new THREE.Shape()]);

    renderPage("/configurator");

    expect(screen.getAllByRole("button", { name: /EdgeLuxe LP/ })).toHaveLength(12);
    await user.click(screen.getByRole("button", { name: /EdgeLuxe LP 3\.1/ }));
    expect(screen.queryByRole("button", { name: /EdgeLuxe LP 5/ })).not.toBeInTheDocument(); // chooser is gone

    await upload(user);

    await user.click(screen.getByRole("radio", { name: "4″ (100 mm)" }));
    expect(screen.getByRole("radio", { name: "4″ (100 mm)" })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: "Night" }));
    expect(screen.getByRole("radio", { name: "Night" })).toBeChecked();

    const quote = screen.getByRole("link", { name: /request wholesale pricing/i });
    expect(quote).toHaveAttribute("href", "/contact");
  });

  it("preselects the configuration from ?config= and skips the chooser", async () => {
    const user = userEvent.setup();
    vi.mocked(parseArtwork).mockResolvedValue([new THREE.Shape()]);

    renderPage("/configurator?config=lp-11-b-back-lit");

    expect(screen.queryByRole("button", { name: /EdgeLuxe LP 5/ })).not.toBeInTheDocument();
    expect(screen.getByText("LP 11-B")).toBeInTheDocument();
    await upload(user);
    const depth = screen.getByRole("radiogroup", { name: "Depth" });
    expect(within(depth).getAllByRole("radio").map((o) => o.getAttribute("value"))).toEqual(["10", "15", "20", "30"]);
    expect(within(depth).getByRole("radio", { name: "1.2″ (30 mm)" })).toBeChecked();
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
    await user.click(screen.getByRole("radio", { name: "3″ (75 mm)" }));

    await user.click(screen.getByRole("button", { name: /use a different file/i }));

    // Back to the upload step: no preview, no replace button, dropzone is shown.
    expect(screen.queryByTestId("sign-preview-stub")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /use a different file/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/upload your logo/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /EdgeLuxe LP 3\.1/ })).not.toBeInTheDocument(); // chooser not shown again

    // Uploading the same filename again works, and the configuration was kept.
    await upload(user);
    expect(screen.getByRole("radio", { name: "3″ (75 mm)" })).toBeChecked();
  });

  const switcher = () => screen.getByRole("combobox", { name: "Configuration" });

  it("switching configuration keeps the artwork and the visitor's choices, and resets only what no longer applies", async () => {
    const user = userEvent.setup();
    vi.mocked(parseArtwork).mockResolvedValue([new THREE.Shape()]);
    renderPage("/configurator?config=lp-5-trimless-face-lit");
    await upload(user);
    await user.click(screen.getByRole("radio", { name: "3″ (75 mm)" }));
    await user.click(screen.getByRole("radio", { name: "Night" }));
    await user.click(within(screen.getByRole("group", { name: "Glow color" })).getByRole("button", { name: /cyan/i }));
    fireEvent.change(screen.getByRole("slider", { name: "Brightness" }), { target: { value: "60" } });

    await user.selectOptions(switcher(), "lp-3-1-standoff-halo"); // also offers 75 mm

    // Straight away, same artwork (no second upload, no chooser).
    expect(screen.getByTestId("sign-preview-stub")).toBeInTheDocument();
    expect(screen.queryByLabelText(/upload your logo/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /EdgeLuxe LP/ })).not.toBeInTheDocument();
    expect(switcher()).toHaveValue("lp-3-1-standoff-halo");
    expect(screen.getByRole("radio", { name: "3″ (75 mm)" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Night" })).toBeChecked();
    expect(within(screen.getByRole("group", { name: "Glow color" })).getByRole("button", { name: /cyan/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("slider", { name: "Brightness" })).toHaveValue("60");
    expect(parseArtwork).toHaveBeenCalledTimes(1);
  });

  it("falls back to the new configuration's default depth when it does not offer the chosen one", async () => {
    const user = userEvent.setup();
    vi.mocked(parseArtwork).mockResolvedValue([new THREE.Shape()]);
    renderPage("/configurator?config=lp-5-trimless-face-lit");
    await upload(user);
    await user.click(screen.getByRole("radio", { name: "3″ (75 mm)" }));

    await user.selectOptions(switcher(), "lp-11-f-face-lit"); // acrylic: 10-30 mm
    expect(screen.getByRole("radio", { name: "1.2″ (30 mm)" })).toBeChecked();
  });

  it("steps through the configurations with the arrows", async () => {
    const user = userEvent.setup();
    vi.mocked(parseArtwork).mockResolvedValue([new THREE.Shape()]);
    renderPage("/configurator?config=lp-3-1-standoff-halo");
    await upload(user);
    await user.click(screen.getByRole("button", { name: "Next configuration" }));
    expect(switcher()).toHaveValue("lp-3-2-flush-mount");
    await user.click(screen.getByRole("button", { name: "Previous configuration" }));
    await user.click(screen.getByRole("button", { name: "Previous configuration" }));
    expect(switcher()).toHaveValue("lp-1-flat-cutout");
  });

  it("has no separate 'Change configuration' link once the switcher is there", async () => {
    const user = userEvent.setup();
    vi.mocked(parseArtwork).mockResolvedValue([new THREE.Shape()]);
    renderPage("/configurator?config=lp-5-trimless-face-lit");
    expect(screen.getByRole("button", { name: /change configuration/i })).toBeInTheDocument(); // before artwork: back to the chooser
    await upload(user);
    expect(screen.queryByRole("button", { name: /change configuration/i })).not.toBeInTheDocument();
    expect(switcher()).toBeInTheDocument();
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

    await user.selectOptions(switcher(), "lp-11-f-face-lit");

    expect(screen.getByRole("radio", { name: "Brick" })).toBeChecked();
  });

  it("returning to the chooser before any artwork still works (it starts from the defaults)", async () => {
    const user = userEvent.setup();
    renderPage("/configurator?config=lp-5-trimless-face-lit");
    await user.click(screen.getByRole("button", { name: /change configuration/i }));
    expect(screen.getAllByRole("button", { name: /EdgeLuxe LP/ })).toHaveLength(12);
    await user.click(screen.getByRole("button", { name: /EdgeLuxe LP 11-F Block/ }));
    expect(screen.getByText("LP 11-F")).toBeInTheDocument();
  });

  it("only offers 'Use a different file' once a logo has been uploaded", () => {
    renderPage("/configurator?config=lp-11-f-face-lit");
    expect(screen.queryByRole("button", { name: /use a different file/i })).not.toBeInTheDocument();
  });

  describe("The quote button carries the configuration", () => {
    beforeEach(() => {
      sessionStorage.clear();
      globalThis.indexedDB = new IDBFactory();
      vi.mocked(generateTextArtworkFile).mockReset();
    });

    it("navigates to /contact with the configuration in router state and sessionStorage", async () => {
      const user = userEvent.setup();
      vi.mocked(parseArtwork).mockResolvedValue([new THREE.Shape()]);
      renderPage("/configurator?config=lp-3-1-standoff-halo");
      await upload(user);
      await user.click(screen.getByRole("radio", { name: "3″ (75 mm)" }));
      await user.click(within(screen.getByRole("group", { name: "Glow color" })).getByRole("button", { name: /cyan/i }));
      fireEvent.change(screen.getByRole("slider", { name: "Brightness" }), { target: { value: "70" } });

      await user.click(screen.getByRole("link", { name: /request wholesale pricing/i }));

      expect(await screen.findByText("Contact Page")).toBeInTheDocument();
      const summary = screen.getByTestId("quote-summary").textContent!;
      expect(summary).toContain("LP 3.1");
      expect(summary).toContain("Depth: 3″ (75 mm)");
      expect(summary).toContain("Glow color: Cyan (#19e0ff)");
      expect(summary).toContain("LED brightness: 70%");
      expect(summary).toContain("Artwork: uploaded file logo.svg");
      // no snapshot function in the stubbed preview: the quote still goes through, without an image
      expect(screen.getByTestId("quote-image")).toHaveTextContent("no image");
      expect(JSON.parse(sessionStorage.getItem("sls.quote.v1")!).summary).toBe(summary);
    });

    it("includes typed text and its font", async () => {
      const user = userEvent.setup();
      vi.mocked(generateTextShapes).mockResolvedValue({ shapes: [new THREE.Shape()], skipped: [] });
      renderPage("/configurator?config=lp-5-trimless-face-lit");
      await user.click(screen.getByRole("radio", { name: "Type text" }));
      await user.type(screen.getByLabelText(/your text/i), "Open");
      await user.click(screen.getByRole("radio", { name: "Pacifico" }));
      await screen.findByTestId("sign-preview-stub");

      await user.click(screen.getByRole("link", { name: /request wholesale pricing/i }));
      expect(await screen.findByTestId("quote-summary")).toHaveTextContent('Artwork: typed text "Open" in Pacifico');
    });

    describe("artwork file", () => {
      it("stores the uploaded file and tells /contact about it", async () => {
        const user = userEvent.setup();
        vi.mocked(parseArtwork).mockResolvedValue([new THREE.Shape()]);
        renderPage("/configurator?config=lp-5-trimless-face-lit");
        await upload(user);
        await user.click(screen.getByRole("link", { name: /request wholesale pricing/i }));

        expect(await screen.findByText("Contact Page")).toBeInTheDocument();
        expect(JSON.parse(screen.getByTestId("quote-file").textContent!)).toEqual({
          name: "logo.svg",
          size: file().size,
          generated: false,
        });
        const stored = await loadArtworkFile(screen.getByTestId("quote-id").textContent!);
        expect(stored?.name).toBe("logo.svg");
        expect(await stored!.text()).toBe("<svg></svg>");
      });

      it("makes an SVG of typed text and sends that", async () => {
        const user = userEvent.setup();
        vi.mocked(generateTextShapes).mockResolvedValue({ shapes: [new THREE.Shape()], skipped: [] });
        vi.mocked(generateTextArtworkFile).mockResolvedValue(
          new File(["<svg>text</svg>"], "sunlite-text-open.svg", { type: "image/svg+xml" })
        );
        renderPage("/configurator?config=lp-5-trimless-face-lit");
        await user.click(screen.getByRole("radio", { name: "Type text" }));
        await user.type(screen.getByLabelText(/your text/i), "Open");
        await user.click(screen.getByRole("radio", { name: "Pacifico" }));
        await screen.findByTestId("sign-preview-stub");
        await user.click(screen.getByRole("link", { name: /request wholesale pricing/i }));

        expect(await screen.findByText("Contact Page")).toBeInTheDocument();
        expect(generateTextArtworkFile).toHaveBeenCalledWith("Open", "pacifico");
        expect(JSON.parse(screen.getByTestId("quote-file").textContent!)).toMatchObject({
          name: "sunlite-text-open.svg",
          generated: true,
        });
        expect((await loadArtworkFile(screen.getByTestId("quote-id").textContent!))?.name).toBe("sunlite-text-open.svg");
      });

      it("still sends the quote, without a file, when the text file cannot be made", async () => {
        const user = userEvent.setup();
        vi.mocked(generateTextShapes).mockResolvedValue({ shapes: [new THREE.Shape()], skipped: [] });
        vi.mocked(generateTextArtworkFile).mockResolvedValue(null);
        renderPage("/configurator?config=lp-5-trimless-face-lit");
        await user.click(screen.getByRole("radio", { name: "Type text" }));
        await user.type(screen.getByLabelText(/your text/i), "Open");
        await screen.findByTestId("sign-preview-stub");
        await user.click(screen.getByRole("link", { name: /request wholesale pricing/i }));
        expect(await screen.findByText("Contact Page")).toBeInTheDocument();
        expect(screen.getByTestId("quote-file")).toHaveTextContent("null");
        expect(screen.getByTestId("quote-summary")).toHaveTextContent('Artwork: typed text "Open"');
      });

      it("still sends the quote, without a file, when IndexedDB is unavailable", async () => {
        const user = userEvent.setup();
        globalThis.indexedDB = {
          open: () => {
            throw new DOMException("denied", "SecurityError");
          },
        } as unknown as IDBFactory;
        vi.mocked(parseArtwork).mockResolvedValue([new THREE.Shape()]);
        renderPage("/configurator?config=lp-5-trimless-face-lit");
        await upload(user);
        await user.click(screen.getByRole("link", { name: /request wholesale pricing/i }));
        expect(await screen.findByText("Contact Page")).toBeInTheDocument();
        expect(screen.getByTestId("quote-file")).toHaveTextContent("null");
        expect(screen.getByTestId("quote-summary")).toHaveTextContent("Artwork: uploaded file logo.svg");
      });

      it("sends the file of the artwork on show, not an earlier one", async () => {
        const user = userEvent.setup();
        vi.mocked(parseArtwork).mockResolvedValue([new THREE.Shape()]);
        renderPage("/configurator?config=lp-5-trimless-face-lit");
        await upload(user);
        await user.click(screen.getByRole("button", { name: /use a different file/i }));
        await user.upload(
          screen.getByLabelText(/upload your logo/i),
          new File(["<svg>two</svg>"], "second.svg", { type: "image/svg+xml" })
        );
        await screen.findByTestId("sign-preview-stub");
        await user.click(screen.getByRole("link", { name: /request wholesale pricing/i }));
        expect(await screen.findByText("Contact Page")).toBeInTheDocument();
        expect(JSON.parse(screen.getByTestId("quote-file").textContent!).name).toBe("second.svg");
      });
    });

    it("still works with no artwork yet (a summary without the artwork line)", async () => {
      const user = userEvent.setup();
      renderPage("/configurator?config=lp-5-trimless-face-lit");
      await user.click(screen.getByRole("radio", { name: "Type text" })); // the workspace, with an empty text
      await user.click(screen.getByRole("link", { name: /request wholesale pricing/i }));
      const summary = (await screen.findByTestId("quote-summary")).textContent!;
      expect(summary).toContain("LP 5");
      expect(summary).not.toMatch(/artwork:/i);
    });
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
      await user.click(screen.getByRole("radio", { name: "3″ (75 mm)" }));

      await user.type(screen.getByLabelText(/your text/i), "Sunlite");
      expect(await screen.findByTestId("sign-preview-stub")).toBeInTheDocument();
      expect(generateTextShapes).toHaveBeenCalledTimes(1); // typing 7 characters in a row is one rebuild
      expect(generateTextShapes).toHaveBeenCalledWith("Sunlite", "montserrat");
      expect(screen.getByRole("status")).toHaveTextContent("Preview updated");
      expect(screen.getByRole("radio", { name: "3″ (75 mm)" })).toBeChecked();
    });

    it("rebuilds with the new font when the font changes, without touching depth or the text", async () => {
      const user = userEvent.setup();
      renderPage("/configurator?config=lp-5-trimless-face-lit");
      await chooseText(user);
      await user.click(screen.getByRole("radio", { name: "3″ (75 mm)" }));
      await user.type(screen.getByLabelText(/your text/i), "Hi");
      await screen.findByTestId("sign-preview-stub");

      await user.click(screen.getByRole("radio", { name: "Pacifico" }));
      await waitFor(() => expect(generateTextShapes).toHaveBeenLastCalledWith("Hi", "pacifico"));
      expect(screen.getByLabelText(/your text/i)).toHaveValue("Hi");
      expect(screen.getByRole("radio", { name: "3″ (75 mm)" })).toBeChecked();
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
      expect(screen.getByRole("radiogroup", { name: "Depth" })).toBeInTheDocument(); // the page keeps working
      spy.mockRestore();
    });

    it("keeps the uploaded artwork and the typed text apart when switching back and forth", async () => {
      const user = userEvent.setup();
      vi.mocked(parseArtwork).mockResolvedValue([new THREE.Shape()]);
      renderPage("/configurator?config=lp-5-trimless-face-lit");

      // Upload first, then switch to text: the uploaded sign must not be shown for the text source.
      await upload(user);
      await user.click(screen.getByRole("radio", { name: "3″ (75 mm)" }));
      await chooseText(user);
      expect(screen.queryByTestId("sign-preview-stub")).not.toBeInTheDocument();
      expect(screen.getByRole("radio", { name: "3″ (75 mm)" })).toBeChecked();
      expect(screen.queryByRole("button", { name: /use a different file/i })).not.toBeInTheDocument();

      await user.type(screen.getByLabelText(/your text/i), "Hello");
      await user.click(screen.getByRole("radio", { name: "Poppins" }));
      await screen.findByTestId("sign-preview-stub");

      // Back to upload: the earlier upload returns at once, text controls are gone.
      await user.click(screen.getByRole("radio", { name: "Upload logo" }));
      expect(screen.getByTestId("sign-preview-stub")).toBeInTheDocument();
      expect(screen.queryByLabelText(/your text/i)).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /use a different file/i })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: "3″ (75 mm)" })).toBeChecked();

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

      await user.selectOptions(screen.getByRole("combobox", { name: "Configuration" }), "lp-11-f-face-lit");
      expect(screen.getByLabelText(/your text/i)).toHaveValue("Hello");
      expect(screen.getByTestId("sign-preview-stub")).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: "1.2″ (30 mm)" })).toBeChecked();
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
      expect(screen.getByRole("radiogroup", { name: "Depth" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /request wholesale pricing/i })).toBeInTheDocument();

      // Retry re-renders the preview once the underlying problem is gone.
      previewState.shouldThrow = false;
      await user.click(screen.getByRole("button", { name: /try again/i }));
      expect(await screen.findByTestId("sign-preview-stub")).toBeInTheDocument();
    });
  });
});
