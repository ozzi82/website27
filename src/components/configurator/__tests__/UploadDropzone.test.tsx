import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as THREE from "three";
import UploadDropzone from "../UploadDropzone";
import { parseArtwork } from "../parseArtwork";
import { NoVectorPathsFoundError, UnsupportedFormatError } from "../parseErrors";

vi.mock("../parseArtwork", () => ({
  parseArtwork: vi.fn(),
}));

describe("UploadDropzone", () => {
  it("calls onParsed with the shapes when parsing succeeds", async () => {
    const user = userEvent.setup();
    const shape = new THREE.Shape();
    vi.mocked(parseArtwork).mockResolvedValue([shape]);
    const onParsed = vi.fn();

    render(<UploadDropzone onParsed={onParsed} />);
    const file = new File(["<svg></svg>"], "logo.svg", { type: "image/svg+xml" });
    await user.upload(screen.getByLabelText(/upload your logo/i), file);

    await waitFor(() => expect(onParsed).toHaveBeenCalledWith([shape]));
  });

  it("shows the specific NoVectorPathsFoundError message when parsing fails that way", async () => {
    const user = userEvent.setup();
    vi.mocked(parseArtwork).mockRejectedValue(new NoVectorPathsFoundError());
    render(<UploadDropzone onParsed={vi.fn()} />);
    const file = new File(["<svg></svg>"], "logo.svg", { type: "image/svg+xml" });
    await user.upload(screen.getByLabelText(/upload your logo/i), file);

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
    render(<UploadDropzone onParsed={vi.fn()} />);
    const file = new File(["not a logo"], "logo.png", { type: "image/png" });
    await user.upload(screen.getByLabelText(/upload your logo/i), file);

    expect(await screen.findByText(/unsupported file type/i)).toBeInTheDocument();
  });
});
