import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
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
  /** Add a company_type field to the fake form: a dropdown with these options, or a plain text input. */
  companyField?: { kind: "select"; options: string[]; value?: string } | { kind: "input"; value?: string };
  /** Render the form this long after create() (HubSpot builds it asynchronously). */
  delayMs?: number;
  /** A file the visitor already chose in the form's file field. */
  preselected?: File;
  /** The browser cannot build a DataTransfer. */
  noDataTransfer?: boolean;
}

/** Stands in for HubSpot's embed: a same-origin iframe holding a message textarea and a file input, like the real form. */
function installHubSpot({ delayMs = 0, preselected, noDataTransfer = false, companyField }: HubSpotOptions = {}) {
  let onFormSubmitted: (() => void) | undefined;
  const create = vi.fn((opts: { target: string; submitText?: string; onFormReady?: () => void; onFormSubmitted?: () => void }) => {
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
      if (companyField?.kind === "select") {
        const sel = doc.createElement("select");
        sel.name = "company_type";
        for (const o of ["", ...companyField.options]) {
          const opt = doc.createElement("option");
          opt.value = o;
          opt.textContent = o || "Please Select";
          sel.appendChild(opt);
        }
        sel.value = companyField.value ?? "";
        doc.body.appendChild(sel);
      } else if (companyField?.kind === "input") {
        const inp = doc.createElement("input");
        inp.name = "company_type";
        inp.value = companyField.value ?? "";
        doc.body.appendChild(inp);
      }
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

describe("ContactPage hydration safety", () => {
  it("server-renders the same HTML whatever history state, storage or company type exist (no quote card, no company choice)", () => {
    sessionStorage.setItem("sls.companyType.v1", "Sign Company");
    saveQuote(quote);
    const html = renderToString(
      <HelmetProvider>
        <MemoryRouter initialEntries={[{ pathname: "/contact", state: { quote } }]}>
          <ContactPage />
        </MemoryRouter>
      </HelmetProvider>,
    );
    expect(html).not.toContain("Your configuration");
    expect(html).not.toContain("LP 5 Trimless");
    expect(html).not.toMatch(/value="Sign Company"[^>]*selected/);
    expect(html).toContain("Get your");
    sessionStorage.clear();
  });
});

describe("ContactPage wholesale quote page (brief section 10)", () => {
  const company = () => screen.getByRole("combobox", { name: /company type/i }) as HTMLSelectElement;

  beforeEach(() => {
    sessionStorage.clear();
    window.scrollTo = vi.fn();
  });
  afterEach(() => {
    delete window.hbspt;
  });

  it("has the wholesale H1, the 48-hour body copy and the visible trade-only line", () => {
    installHubSpot();
    renderContact();
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent!.replace(/\s+/g, " ").trim()).toMatch(/^get your wholesale quote$/i);
    expect(h1.className).toMatch(/uppercase/);
    expect(screen.getByText("Send your artwork, dimensions and project details. We'll return a tailored quote within 48 hours.")).toBeInTheDocument();
    expect(screen.getByText(/trade customers only · no retail sales/i)).toBeVisible();
    expect(screen.queryByText(/get in touch|request a quote|get a quote|start your project/i)).not.toBeInTheDocument();
  });

  it("keeps phone, email and WhatsApp alternatives", () => {
    installHubSpot();
    renderContact();
    expect(screen.getByRole("link", { name: /hello@sunlitesigns\.com/ })).toHaveAttribute("href", "mailto:hello@sunlitesigns.com");
    expect(screen.getByRole("link", { name: /\(689\) 294-0912/ })).toHaveAttribute("href", "tel:+16892940912");
    expect(screen.getByRole("link", { name: /whatsapp/i })).toHaveAttribute("href", expect.stringContaining("wa.me"));
  });

  it("asks HubSpot for the primary CTA label on the submit button", () => {
    const hs = installHubSpot();
    renderContact();
    expect(hs.create).toHaveBeenCalledTimes(1);
    expect(hs.create.mock.calls[0][0].submitText).toBe("Request Wholesale Pricing");
  });

  it("sets the title, description and JSON-LD (ContactPage, BreadcrumbList, FAQPage)", async () => {
    installHubSpot();
    renderContact();
    await waitFor(() => {
      expect(document.title).toBe("Get Your Wholesale Quote: Channel Letters | Sunlite Signs");
      expect(document.head.querySelectorAll("script[type=\"application/ld+json\"]")).toHaveLength(3); // Helmet flushes title and tags together, but a title left by an earlier test can win the race
    });
    const desc = document.head.querySelector('meta[name="description"]')!.getAttribute("content")!;
    expect(desc).toMatch(/wholesale quote/i);
    expect(desc).toMatch(/48 hours/);
    expect(desc).toMatch(/trade customers only/i);
    expect(desc.length).toBeLessThanOrEqual(180);
    const ld = [...document.head.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent!));
    expect(ld.map((x) => x["@type"]).sort()).toEqual(["BreadcrumbList", "ContactPage", "FAQPage"]);
    expect(ld.find((x) => x["@type"] === "ContactPage").url).toMatch(/\/contact$/);
  });

  it("offers the five company types in an optional select that nothing requires", () => {
    installHubSpot();
    renderContact();
    const options = Array.from(company().options).map((o) => o.textContent);
    expect(options).toEqual(["Select your company type", "Sign Company", "Sign Installer", "Agency / Broker", "Architect / Contractor", "Other Trade Professional"]);
    expect(company().required).toBe(false);
    expect(company().value).toBe("");
    expect(field().value).toBe(""); // nothing chosen: nothing added to the message
  });

  it("adds Company type to the message, ahead of the configurator summary", async () => {
    const user = userEvent.setup();
    installHubSpot();
    renderContact({ quote });
    await waitFor(() => expect(field().value).toBe(quote.summary));
    await user.selectOptions(company(), "Sign Company");
    await waitFor(() => expect(field().value).toBe(`Company type: Sign Company\n\n${quote.summary}`));
    await user.selectOptions(company(), "Agency / Broker");
    await waitFor(() => expect(field().value).toBe(`Company type: Agency / Broker\n\n${quote.summary}`));
    await user.selectOptions(company(), "");
    await waitFor(() => expect(field().value).toBe(quote.summary));
  });

  it("works without a configuration: the message is just the company type line", async () => {
    const user = userEvent.setup();
    installHubSpot();
    renderContact();
    await user.selectOptions(company(), "Sign Installer");
    await waitFor(() => expect(field().value).toBe("Company type: Sign Installer"));
  });

  it("never overwrites text the visitor typed in the message", async () => {
    const user = userEvent.setup();
    installHubSpot();
    renderContact({ quote });
    await waitFor(() => expect(field().value).toBe(quote.summary));
    field().value = "My own words";
    await user.selectOptions(company(), "Sign Company");
    expect(field().value).toBe("My own words");
  });

  it("remembers the choice for the tab (sessionStorage) and restores it on the next visit", async () => {
    const user = userEvent.setup();
    installHubSpot();
    const first = renderContact();
    await user.selectOptions(company(), "Architect / Contractor");
    expect(sessionStorage.getItem("sls.companyType.v1")).toBe("Architect / Contractor");
    first.unmount();
    installHubSpot();
    renderContact();
    await waitFor(() => expect(company().value).toBe("Architect / Contractor"));
    await waitFor(() => expect(field().value).toBe("Company type: Architect / Contractor"));
    await user.selectOptions(company(), "");
    expect(sessionStorage.getItem("sls.companyType.v1")).toBeNull();
  });

  it("ignores a junk value in storage", async () => {
    sessionStorage.setItem("sls.companyType.v1", "Retail customer");
    installHubSpot();
    renderContact();
    expect(company().value).toBe("");
    expect(field().value).toBe("");
  });

  it("also fills a company_type dropdown when the HubSpot form has one (matching option only)", async () => {
    const user = userEvent.setup();
    installHubSpot({ companyField: { kind: "select", options: ["Sign Company", "Sign Installer"] } });
    renderContact();
    const hubspotSelect = () => document.querySelector("iframe")!.contentDocument!.querySelector<HTMLSelectElement>("select[name=company_type]")!;
    expect(hubspotSelect().value).toBe("");
    await user.selectOptions(company(), "Sign Installer");
    await waitFor(() => expect(hubspotSelect().value).toBe("Sign Installer"));
    await user.selectOptions(company(), "Agency / Broker"); // not an option in the HubSpot dropdown: left as it was
    expect(hubspotSelect().value).toBe("Sign Installer");
    await user.selectOptions(company(), "");
    await waitFor(() => expect(hubspotSelect().value).toBe(""));
  });

  it("fills a company_type text input too, but never replaces a value the visitor set in the form", async () => {
    const user = userEvent.setup();
    installHubSpot({ companyField: { kind: "input" } });
    renderContact();
    const input = () => document.querySelector("iframe")!.contentDocument!.querySelector<HTMLInputElement>("input[name=company_type]")!;
    await user.selectOptions(company(), "Sign Company");
    await waitFor(() => expect(input().value).toBe("Sign Company"));
    input().value = "My own entry";
    await user.selectOptions(company(), "Sign Installer");
    expect(input().value).toBe("My own entry");
  });

  it("sets the company_type field once the form is ready when a choice was already remembered", async () => {
    sessionStorage.setItem("sls.companyType.v1", "Sign Company");
    installHubSpot({ delayMs: 300, companyField: { kind: "select", options: ["Sign Company", "Other Trade Professional"] } });
    renderContact();
    const hubspotSelect = () => document.querySelector("iframe")!.contentDocument?.querySelector<HTMLSelectElement>("select[name=company_type]");
    await waitFor(() => expect(hubspotSelect()?.value).toBe("Sign Company"), { timeout: 3000 });
  });

  it("does nothing special when the form has no company_type field (the message carries the answer)", async () => {
    const user = userEvent.setup();
    installHubSpot();
    renderContact();
    await user.selectOptions(company(), "Sign Company");
    await waitFor(() => expect(field().value).toBe("Company type: Sign Company"));
    expect(document.querySelector("iframe")!.contentDocument!.querySelector("[name=company_type]")).toBeNull();
  });
});
