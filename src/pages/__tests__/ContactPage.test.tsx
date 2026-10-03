import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { IDBFactory } from "fake-indexeddb";
import ContactPage from "../ContactPage";
import { saveQuote, quoteFileId, type QuoteSnapshot } from "../../components/configurator/quoteStorage";
import { saveArtworkFile, loadArtworkFile } from "../../components/configurator/artworkFileStorage";
import { FakeDataTransfer, makeFileInput } from "../../components/__tests__/helpers/fakeFileInput";

const quote: QuoteSnapshot = {
  v: 1,
  summary: "Sign configuration (from the Sunlite 3D configurator)\nConfiguration: LP 5 Trimless\nDepth: 2″ (50 mm)",
  rows: [
    { label: "Configuration", value: "LP 5 Trimless" },
    { label: "Depth", value: "2″ (50 mm)" },
    { label: "Glow color", value: "Cyan (#19e0ff)", swatch: "#19e0ff" },
  ],
  image: "data:image/jpeg;base64,/9j/AAAA",
  savedAt: 1,
};

interface HubSpotOptions {
  /** Render the form this long after create() (HubSpot builds it asynchronously). */
  delayMs?: number;
  /** A file the visitor already chose in the form's file field. */
  preselected?: File;
  /** The browser cannot build a DataTransfer. */
  noDataTransfer?: boolean;
}

/** Stands in for HubSpot's embed: a same-origin iframe holding a message textarea and a file input, like the real form. */
function installHubSpot({ delayMs = 0, preselected, noDataTransfer = false }: HubSpotOptions = {}) {
  let onFormSubmitted: (() => void) | undefined;
  const create = vi.fn((opts: { target: string; onFormReady?: () => void; onFormSubmitted?: () => void }) => {
    onFormSubmitted = opts.onFormSubmitted;
    const target = document.querySelector(opts.target)!;
    const frame = document.createElement("iframe");
    target.appendChild(frame);
    const build = () => {
      const doc = frame.contentDocument!;
      (frame.contentWindow as unknown as { DataTransfer?: unknown }).DataTransfer = noDataTransfer
        ? undefined
        : FakeDataTransfer;
      const area = doc.createElement("textarea");
      area.name = "message";
      doc.body.appendChild(area);
      const captcha = doc.createElement("textarea");
      captcha.name = "g-recaptcha-response";
      doc.body.appendChild(captcha);
      const input = makeFileInput(doc);
      if (preselected) input.files = [preselected] as unknown as FileList;
      opts.onFormReady?.();
    };
    if (delayMs > 0) setTimeout(build, delayMs);
    else build();
  });
  window.hbspt = { forms: { create } };
  return { create, submit: () => onFormSubmitted?.() };
}

const fileInput = () => {
  const frame = document.querySelector("iframe")!;
  return frame.contentDocument?.querySelector<HTMLInputElement>("input[type=file]") ?? null;
};

const field = () => {
  const frame = document.querySelector("iframe")!;
  return frame.contentDocument!.querySelector<HTMLTextAreaElement>("textarea[name=message]")!;
};

function renderContact(state?: unknown) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[{ pathname: "/contact", state }]}>
        <ContactPage />
      </MemoryRouter>
    </HelmetProvider>
  );
}

describe("ContactPage configuration card", () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.scrollTo = vi.fn();
    installHubSpot();
  });
  afterEach(() => {
    delete window.hbspt;
  });

  it("shows no card when nothing was configured", () => {
    renderContact();
    expect(screen.queryByRole("heading", { name: "Your configuration" })).not.toBeInTheDocument();
    expect(field().value).toBe("");
  });

  it("shows the configuration from router state: rows, preview image and prefilled message", async () => {
    renderContact({ quote });
    expect(screen.getByRole("heading", { name: "Your configuration" })).toBeInTheDocument();
    expect(screen.getByText("LP 5 Trimless")).toBeInTheDocument();
    expect(screen.getByText("2″ (50 mm)")).toBeInTheDocument();
    expect(screen.getByText("Cyan (#19e0ff)")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /preview of your configured sign/i })).toHaveAttribute("src", quote.image);
    await waitFor(() => expect(field().value).toBe(quote.summary));
  });

  it("falls back to sessionStorage (a refresh keeps the card) and ignores malformed router state", () => {
    saveQuote(quote);
    renderContact({ quote: { nonsense: true } });
    expect(screen.getByRole("heading", { name: "Your configuration" })).toBeInTheDocument();
  });

  it("does not need an image", () => {
    renderContact({ quote: { ...quote, image: null } });
    expect(screen.getByRole("heading", { name: "Your configuration" })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /preview of your configured sign/i })).not.toBeInTheDocument();
  });

  it("copies the plain-text summary", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    renderContact({ quote });
    await user.click(screen.getByRole("button", { name: /copy summary/i }));
    expect(writeText).toHaveBeenCalledWith(quote.summary);
    expect(await screen.findByText(/copied to the clipboard/i)).toBeInTheDocument();
  });

  it("Clear removes the card, the stored quote and our prefilled text", async () => {
    const user = userEvent.setup();
    saveQuote(quote);
    renderContact({ quote });
    await waitFor(() => expect(field().value).toBe(quote.summary));
    await user.click(screen.getByRole("button", { name: /clear/i }));
    expect(screen.queryByRole("heading", { name: "Your configuration" })).not.toBeInTheDocument();
    expect(sessionStorage.getItem("sls.quote.v1")).toBeNull();
    await waitFor(() => expect(field().value).toBe(""));
  });

  it("never overwrites something the visitor typed in the message field", async () => {
    const user = userEvent.setup();
    renderContact({ quote });
    await waitFor(() => expect(field().value).toBe(quote.summary));
    field().value = "My own words";
    await user.click(screen.getByRole("button", { name: /clear/i }));
    expect(field().value).toBe("My own words");
  });
});

describe("ContactPage artwork file", () => {
  const meta = { name: "logo.svg", size: 11, generated: false };
  const withFile: QuoteSnapshot = { ...quote, artworkFile: meta };
  const logo = () => new File(["<svg></svg>"], "logo.svg", { type: "image/svg+xml", lastModified: 7 });

  beforeEach(async () => {
    sessionStorage.clear();
    window.scrollTo = vi.fn();
    globalThis.indexedDB = new IDBFactory();
    URL.createObjectURL = vi.fn(() => "blob:artwork");
    URL.revokeObjectURL = vi.fn();
    await saveArtworkFile(logo(), quoteFileId(withFile));
  });
  afterEach(() => {
    delete window.hbspt;
  });

  it("attaches the stored file to the form's file field and says so", async () => {
    installHubSpot();
    renderContact({ quote: withFile });
    await waitFor(() => expect(fileInput()!.files).toHaveLength(1));
    expect(fileInput()!.files![0].name).toBe("logo.svg");
    expect(await screen.findByText(/artwork attached:/i)).toBeInTheDocument();
    expect(screen.getByText("logo.svg")).toBeInTheDocument();
    expect(screen.getByText(/it will be sent with the form/i)).toBeInTheDocument();
  });

  it("survives a reload of /contact (no router state, quote and file come from storage)", async () => {
    saveQuote(withFile);
    installHubSpot();
    renderContact(); // a refresh: history state is gone
    await waitFor(() => expect(fileInput()!.files).toHaveLength(1));
    expect(fileInput()!.files![0].name).toBe("logo.svg");
  });

  it("attaches once the form has rendered, however late", async () => {
    installHubSpot({ delayMs: 1200 });
    renderContact({ quote: withFile });
    expect(await screen.findByText(/artwork ready:/i)).toBeInTheDocument();
    await waitFor(() => expect(fileInput()?.files).toHaveLength(1), { timeout: 4000 });
    expect(await screen.findByText(/artwork attached:/i)).toBeInTheDocument();
  });

  it("never replaces a file the visitor already chose; offers the download instead", async () => {
    const own = new File(["mine"], "mine.pdf", { type: "application/pdf", lastModified: 9 });
    installHubSpot({ preselected: own });
    renderContact({ quote: withFile });
    expect(await screen.findByText(/isn’t attached/i)).toBeInTheDocument();
    expect(fileInput()!.files).toHaveLength(1);
    expect(fileInput()!.files![0].name).toBe("mine.pdf");
    expect(screen.getByRole("link", { name: /download your artwork file/i })).toHaveAttribute("href", "blob:artwork");
  });

  it("falls back to a prominent download link when the browser cannot attach", async () => {
    installHubSpot({ noDataTransfer: true });
    renderContact({ quote: withFile });
    expect(await screen.findByText(/couldn’t attach your artwork/i)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /download your artwork file/i });
    expect(link).toHaveAttribute("download", "logo.svg");
    expect(fileInput()!.files).toHaveLength(0);
  });

  it("describes a file made from typed text", async () => {
    installHubSpot();
    const generated = { ...withFile, artworkFile: { name: "sunlite-text-open.svg", size: 11, generated: true } };
    await saveArtworkFile(new File(["<svg/>"], "sunlite-text-open.svg", { type: "image/svg+xml" }), quoteFileId(generated));
    renderContact({ quote: generated });
    expect(await screen.findByText(/artwork attached:/i)).toBeInTheDocument();
    expect(screen.getByText(/made from your text/i)).toBeInTheDocument();
  });

  it("does nothing for a quote without a file", async () => {
    installHubSpot();
    renderContact({ quote });
    await waitFor(() => expect(field().value).toBe(quote.summary));
    expect(fileInput()!.files).toHaveLength(0);
    expect(screen.queryByText(/artwork (attached|ready)/i)).not.toBeInTheDocument();
  });

  it("carries on quietly when the stored file is gone", async () => {
    globalThis.indexedDB = new IDBFactory(); // e.g. storage was cleared
    installHubSpot();
    renderContact({ quote: withFile });
    await waitFor(() => expect(field().value).toBe(quote.summary));
    expect(fileInput()!.files).toHaveLength(0);
    expect(screen.queryByText(/artwork (attached|ready)/i)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Your configuration" })).toBeInTheDocument();
  });

  it("Clear takes the file back out of the form and out of storage", async () => {
    const user = userEvent.setup();
    installHubSpot();
    renderContact({ quote: withFile });
    await waitFor(() => expect(fileInput()!.files).toHaveLength(1));
    await user.click(screen.getByRole("button", { name: /clear/i }));
    await waitFor(() => expect(fileInput()!.files).toHaveLength(0));
    await waitFor(async () => expect(await loadArtworkFile(quoteFileId(withFile))).toBeNull());
    expect(screen.queryByText(/artwork attached/i)).not.toBeInTheDocument();
  });

  it("Clear leaves a file the visitor swapped in alone", async () => {
    const user = userEvent.setup();
    installHubSpot();
    renderContact({ quote: withFile });
    await waitFor(() => expect(fileInput()!.files).toHaveLength(1));
    fileInput()!.files = [new File(["mine"], "mine.pdf", { lastModified: 9 })] as unknown as FileList;
    await user.click(screen.getByRole("button", { name: /clear/i }));
    expect(fileInput()!.files![0].name).toBe("mine.pdf");
  });

  it("forgets the quote and its file once the form is submitted", async () => {
    const hs = installHubSpot();
    renderContact({ quote: withFile });
    await waitFor(() => expect(fileInput()!.files).toHaveLength(1));
    act(() => hs.submit());
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Your configuration" })).not.toBeInTheDocument());
    expect(sessionStorage.getItem("sls.quote.v1")).toBeNull();
    expect(await loadArtworkFile(quoteFileId(withFile))).toBeNull();
  });
});
