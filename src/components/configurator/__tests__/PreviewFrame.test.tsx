import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PreviewFrame, { KEY_ROTATE_STEP } from "../PreviewFrame";

function setup() {
  const handlers = { onZoomIn: vi.fn(), onZoomOut: vi.fn(), onReset: vi.fn(), onRotate: vi.fn() };
  render(
    <PreviewFrame {...handlers}>
      <div data-testid="canvas-stub" />
    </PreviewFrame>
  );
  return handlers;
}

const frame = () => screen.getByRole("group", { name: /3D preview/i });

describe("PreviewFrame buttons", () => {
  it("renders the canvas it frames", () => {
    setup();
    expect(screen.getByTestId("canvas-stub")).toBeInTheDocument();
  });

  it("has labelled zoom in, zoom out and reset view buttons that call back", async () => {
    const user = userEvent.setup();
    const h = setup();
    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    await user.click(screen.getByRole("button", { name: "Zoom out" }));
    await user.click(screen.getByRole("button", { name: "Reset view" }));
    expect(h.onZoomIn).toHaveBeenCalledTimes(1);
    expect(h.onZoomOut).toHaveBeenCalledTimes(1);
    expect(h.onReset).toHaveBeenCalledTimes(1);
  });

  it("makes the buttons plain buttons (never submitting a surrounding form)", () => {
    setup();
    for (const name of ["Zoom in", "Zoom out", "Reset view"]) {
      expect(screen.getByRole("button", { name })).toHaveAttribute("type", "button");
    }
  });

  it("tells the user how to rotate and zoom", () => {
    setup();
    expect(screen.getByText(/drag to rotate/i)).toBeInTheDocument();
  });
});

describe("PreviewFrame keyboard", () => {
  it("is focusable and describes its keys", () => {
    setup();
    expect(frame()).toHaveAttribute("tabindex", "0");
    expect(frame().getAttribute("aria-label")).toMatch(/arrow/i);
  });

  it("rotates with the arrow keys: left/right orbit sideways, up/down tilt", () => {
    const h = setup();
    fireEvent.keyDown(frame(), { key: "ArrowLeft" });
    expect(h.onRotate).toHaveBeenLastCalledWith(-KEY_ROTATE_STEP, 0);
    fireEvent.keyDown(frame(), { key: "ArrowRight" });
    expect(h.onRotate).toHaveBeenLastCalledWith(KEY_ROTATE_STEP, 0);
    fireEvent.keyDown(frame(), { key: "ArrowUp" });
    expect(h.onRotate).toHaveBeenLastCalledWith(0, -KEY_ROTATE_STEP);
    fireEvent.keyDown(frame(), { key: "ArrowDown" });
    expect(h.onRotate).toHaveBeenLastCalledWith(0, KEY_ROTATE_STEP);
  });

  it("zooms with + and - and resets with 0", () => {
    const h = setup();
    fireEvent.keyDown(frame(), { key: "+" });
    fireEvent.keyDown(frame(), { key: "=" });
    expect(h.onZoomIn).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(frame(), { key: "-" });
    expect(h.onZoomOut).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(frame(), { key: "0" });
    expect(h.onReset).toHaveBeenCalledTimes(1);
  });

  it("stops the page scrolling on the keys it handles, and leaves other keys alone", () => {
    setup();
    expect(fireEvent.keyDown(frame(), { key: "ArrowLeft" })).toBe(false); // default prevented
    expect(fireEvent.keyDown(frame(), { key: "Tab" })).toBe(true);
    expect(fireEvent.keyDown(frame(), { key: "a" })).toBe(true);
  });

  it("does not hijack browser shortcuts such as Ctrl and minus (page zoom)", () => {
    const h = setup();
    expect(fireEvent.keyDown(frame(), { key: "-", ctrlKey: true })).toBe(true);
    expect(fireEvent.keyDown(frame(), { key: "+", metaKey: true })).toBe(true);
    expect(h.onZoomIn).not.toHaveBeenCalled();
    expect(h.onZoomOut).not.toHaveBeenCalled();
  });
});
