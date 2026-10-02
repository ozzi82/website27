import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import * as THREE from "three";
import UploadDropzone from "../UploadDropzone";
import { parseArtwork } from "../parseArtwork";
import {
  FileTooLargeError,
  NoVectorPathsFoundError,
  ParseError,
  TextNotOutlinedError,
  UnsupportedFormatError,
} from "../parseErrors";

vi.mock("../parseArtwork", () => ({
  parseArtwork: vi.fn(),
}));

function renderDropzone(onParsed = vi.fn()) {
  return render(
    <MemoryRouter>
      <UploadDropzone onParsed={onParsed} />
    </MemoryRouter>
  );
}

async function uploadSvg(user: ReturnType<typeof userEvent.setup>, name = "logo.svg") {
  const file = new File(["<svg></svg>"], name, { type: "image/svg+xml" });
  await user.upload(screen.getByLabelText(/upload your logo/i), file);
}

describe("UploadDropzone", () => {
  it("calls onParsed with the shapes when parsing succeeds", async () => {
    const user = userEvent.setup();
    const shape = new THREE.Shape();
    vi.mocked(parseArtwork).mockResolvedValue([shape]);
    const onParsed = vi.fn();

    renderDropzone(onParsed);
    await uploadSvg(user);

    await waitFor(() => expect(onParsed).toHaveBeenCalledWith([shape], "logo.svg"));
  });

  it("shows the specific NoVectorPathsFoundError message when parsing fails that way", async () => {
    const user = userEvent.setup();
    vi.mocked(parseArtwork).mockRejectedValue(new NoVectorPathsFoundError());
    renderDropzone();
    await uploadSvg(user);

    expect(await screen.findByText(/couldn't find a clean outline/i)).toBeInTheDocument();
  });

  it("shows the specific UnsupportedFormatError message when parsing fails that way", async () => {
    // applyAccept: false — the dropzone's <input accept=".svg,.pdf"> makes
    // user-event's default accept-filtering silently drop a .png before it
    // ever reaches onChange, which isn't the thing this test is checking.
    // (In a real browser, the native file picker's own accept filter plays
    // the same role the dropzone's `accept` attribute is meant for; the only
    // realistic way an unsupported file reaches this component is via
    // drag-and-drop, which handleDrop does not pre-filter — this test models
    // that path by bypassing accept-filtering on the input instead.)
    const user = userEvent.setup({ applyAccept: false });
    vi.mocked(parseArtwork).mockRejectedValue(new UnsupportedFormatError("logo.png"));
    renderDropzone();
    const file = new File(["not a logo"], "logo.png", { type: "image/png" });
    await user.upload(screen.getByLabelText(/upload your logo/i), file);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "We support SVG and PDF right now. Export your logo as SVG, or send it to us directly and we'll quote it by hand."
    );
    // The raw technical message must not reach the user.
    expect(alert).not.toHaveTextContent(/unsupported file type/i);
  });

  it.each([
    ["FileTooLargeError", new FileTooLargeError(20_000_000, 10_485_760), /10MB/],
    ["ParseError", new ParseError("artwork.pdf", new Error("bad xref table")), /couldn't be read.*corrupted.*re-exporting/i],
    ["TextNotOutlinedError", new TextNotOutlinedError(), /Create Outlines/],
    ["NoVectorPathsFoundError", new NoVectorPathsFoundError(), /couldn't find a clean outline.*send us a vector file/i],
  ])("shows friendly copy plus a /contact link for %s", async (_name, error, copy) => {
    const user = userEvent.setup();
    vi.mocked(parseArtwork).mockRejectedValue(error);
    renderDropzone();
    await uploadSvg(user);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(copy);
    const link = within(alert).getByRole("link", { name: /send it to us directly/i });
    expect(link).toHaveAttribute("href", "/contact");
  });

  it("does not leak the raw message of an unexpected error", async () => {
    const user = userEvent.setup();
    vi.mocked(parseArtwork).mockRejectedValue(new TypeError("Cannot read properties of undefined (reading 'x')"));
    renderDropzone();
    await uploadSvg(user);

    const alert = await screen.findByRole("alert");
    expect(alert).not.toHaveTextContent(/cannot read properties/i);
    expect(alert).toHaveTextContent(/something went wrong/i);
    expect(within(alert).getByRole("link", { name: /send it to us directly/i })).toHaveAttribute("href", "/contact");
  });

  it("does not leak the raw ParseError cause", async () => {
    const user = userEvent.setup();
    vi.mocked(parseArtwork).mockRejectedValue(new ParseError("artwork.pdf", new Error("bad xref table")));
    renderDropzone();
    await uploadSvg(user);
    expect(await screen.findByRole("alert")).not.toHaveTextContent(/xref/i);
  });

  it("triggers again when the same file is selected twice in a row", async () => {
    const user = userEvent.setup();
    vi.mocked(parseArtwork).mockReset();
    vi.mocked(parseArtwork).mockRejectedValueOnce(new ParseError("logo.svg", new Error("x")));
    vi.mocked(parseArtwork).mockResolvedValueOnce([new THREE.Shape()]);
    const onParsed = vi.fn();
    renderDropzone(onParsed);
    const input = screen.getByLabelText(/upload your logo/i) as HTMLInputElement;
    const file = new File(["<svg></svg>"], "logo.svg", { type: "image/svg+xml" });

    await user.upload(input, file);
    await screen.findByRole("alert");
    // The input is cleared after reading, so the same filename fires change again.
    expect(input.value).toBe("");

    await user.upload(input, file);
    await waitFor(() => expect(onParsed).toHaveBeenCalledTimes(1));
    expect(parseArtwork).toHaveBeenCalledTimes(2);
  });

  it("keeps a /contact footer link as a client-side router link", () => {
    renderDropzone();
    expect(screen.getByRole("link", { name: /contact us/i })).toHaveAttribute("href", "/contact");
  });
});
