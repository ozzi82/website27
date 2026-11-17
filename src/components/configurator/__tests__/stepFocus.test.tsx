import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ConfiguratorPanel from "../ConfiguratorPanel";
import { STEP_VIEWS, VIEW_LIMITS, clampView } from "../cameraMath";

describe("step views", () => {
  it("are all inside the camera's limits (the camera really gets there)", () => {
    for (const [id, view] of Object.entries(STEP_VIEWS)) expect(clampView(view, VIEW_LIMITS), id).toEqual(view);
  });
  it("show the colour closer than the size", () => {
    expect(STEP_VIEWS.colour.radius).toBeLessThan(STEP_VIEWS.size.radius);
  });
});

describe("ConfiguratorPanel", () => {
  const tabs = ["type", "size"].map((id) => ({ id, label: id, icon: null, content: <p>{id} options</p> }));
  it("tells which step is open, and null when it is folded away", () => {
    const onStep = vi.fn();
    render(<ConfiguratorPanel tabs={tabs} action={null} onStep={onStep} />);
    fireEvent.click(screen.getByRole("button", { name: "Step 2: size" }));
    expect(onStep).toHaveBeenLastCalledWith("size");
    fireEvent.click(screen.getByRole("button", { name: "Step 2: size" }));
    expect(onStep).toHaveBeenLastCalledWith(null);
    fireEvent.click(screen.getByRole("button", { name: "Step 2: size" }));
    expect(onStep).toHaveBeenLastCalledWith("size");
  });
});
