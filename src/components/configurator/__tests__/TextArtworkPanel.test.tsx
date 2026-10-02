import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TextArtworkPanel from "../TextArtworkPanel";
import { TEXT_FONTS } from "../textFonts";
import { ensureFontFaces } from "../fontFaces";

vi.mock("../fontFaces", () => ({ ensureFontFaces: vi.fn().mockResolvedValue(undefined) }));

const base = {
  text: "",
  fontId: "montserrat",
  error: null as string | null,
  skipped: [] as string[],
  announcement: "",
  onTextChange: () => {},
  onFontChange: () => {},
};

describe("TextArtworkPanel", () => {
  beforeEach(() => vi.mocked(ensureFontFaces).mockClear());

  it("registers the preview font faces when it opens", () => {
    render(<TextArtworkPanel {...base} />);
    expect(ensureFontFaces).toHaveBeenCalledTimes(1);
  });

  it("has a labelled text box with the 'Your brand' placeholder", () => {
    render(<TextArtworkPanel {...base} />);
    const box = screen.getByLabelText(/your text/i);
    expect(box).toHaveAttribute("placeholder", "Your brand");
    expect(box.tagName).toBe("TEXTAREA");
  });

  it("reports typing, including a second line", async () => {
    const onTextChange = vi.fn();
    render(<TextArtworkPanel {...base} onTextChange={onTextChange} />);
    await userEvent.type(screen.getByLabelText(/your text/i), "Hi{Enter}x");
    expect(onTextChange).toHaveBeenLastCalledWith("x"); // controlled with value "": each key reports on its own
    expect(onTextChange).toHaveBeenCalledWith("\n");
  });

  it("clamps what is typed to the line and character limits", async () => {
    const onTextChange = vi.fn();
    render(<TextArtworkPanel {...base} text={"a\nb\nc"} onTextChange={onTextChange} />);
    await userEvent.type(screen.getByLabelText(/your text/i), "{Enter}");
    // a 4th line is dropped, so the value stays at three lines
    expect(onTextChange).toHaveBeenLastCalledWith("a\nb\nc");
  });

  it("shows how much of the limit is used", () => {
    render(<TextArtworkPanel {...base} text={"ab\ncd"} />);
    expect(screen.getByText(/4\s*\/\s*100/)).toBeInTheDocument();
  });

  it("offers every bundled font as a radio, each named in its own font", () => {
    render(<TextArtworkPanel {...base} />);
    const group = screen.getByRole("radiogroup", { name: /font/i });
    expect(group).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(TEXT_FONTS.length);
    for (const f of TEXT_FONTS) {
      expect(screen.getByRole("radio", { name: f.label })).toBeInTheDocument();
      expect(screen.getByText(f.label)).toHaveStyle({ fontFamily: `"${f.cssFamily}", sans-serif` });
    }
    expect(screen.getByRole("radio", { name: "Montserrat" })).toBeChecked();
  });

  it("reports the chosen font", async () => {
    const onFontChange = vi.fn();
    render(<TextArtworkPanel {...base} onFontChange={onFontChange} />);
    await userEvent.click(screen.getByRole("radio", { name: "Pacifico" }));
    expect(onFontChange).toHaveBeenCalledWith("pacifico");
  });

  it("shows an error as an alert and marks the text box invalid", () => {
    render(<TextArtworkPanel {...base} text="x" error="Couldn't render that text with this font. Try different characters or another font." />);
    expect(screen.getByRole("alert")).toHaveTextContent(/couldn't render that text/i);
    expect(screen.getByLabelText(/your text/i)).toHaveAttribute("aria-invalid", "true");
  });

  it("lists characters the font left out", () => {
    render(<TextArtworkPanel {...base} text="Ł" skipped={["Ł"]} />);
    expect(screen.getByText(/left out/i)).toHaveTextContent("Ł");
  });

  it("has a polite live region with the announcement", () => {
    render(<TextArtworkPanel {...base} announcement="Preview updated" />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Preview updated");
    expect(status).toHaveAttribute("aria-live", "polite");
  });
});
