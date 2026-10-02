import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import ContactPage from "../ContactPage";
import { saveQuote, type QuoteSnapshot } from "../../components/configurator/quoteStorage";

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

/** Stands in for HubSpot's embed: a same-origin iframe holding a message textarea, like the real form. */
function installHubSpot() {
  const create = vi.fn((opts: { target: string; onFormReady?: () => void }) => {
    const target = document.querySelector(opts.target)!;
    const frame = document.createElement("iframe");
    target.appendChild(frame);
    const area = frame.contentDocument!.createElement("textarea");
    area.name = "message";
    frame.contentDocument!.body.appendChild(area);
    const captcha = frame.contentDocument!.createElement("textarea");
    captcha.name = "g-recaptcha-response";
    frame.contentDocument!.body.appendChild(captcha);
    opts.onFormReady?.();
  });
  window.hbspt = { forms: { create } };
  return create;
}

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
