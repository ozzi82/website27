import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ConfigControls from "../ConfigControls";
import { AROUND_LIMITS, PART_SURFACE, PART_VIEWS, VIEW_LIMITS, clampView } from "../cameraMath";
import { configurations as CONFIGURATIONS } from "../../../data/configurations";
import { defaultStateFor as defaultState } from "../types";

describe("the new configurator: a control shows the part it changes", () => {
  it("has a view for every part, and lets the face or the sides glow where a colour or the depth is set", () => {
    for (const key of Object.keys(PART_VIEWS) as (keyof typeof PART_VIEWS)[]) expect(PART_VIEWS[key].radius).toBeGreaterThan(0);
    expect(PART_SURFACE.paint).toBe("sides");
    expect(PART_SURFACE.face).toBe("face");
    expect(PART_SURFACE.size).toBeNull();
  });

  it("lets the camera go all the way round only with the wider limits", () => {
    const behind = { radius: 4, theta: 3, phi: 1.4 };
    expect(clampView(behind, VIEW_LIMITS).theta).toBeLessThan(1.1);
    expect(clampView(behind, AROUND_LIMITS).theta).toBe(3);
  });

  it("tells the page which part a row changes when it is pointed at, and stays quiet without a listener", () => {
    const config = CONFIGURATIONS.find((c) => c.family === "Stainless steel") ?? CONFIGURATIONS[0]!;
    const onPart = vi.fn();
    const { unmount } = render(<ConfigControls config={config} state={defaultState(config)} onChange={() => undefined} group="size" onPart={onPart} />);
    fireEvent.pointerEnter(screen.getByText("Depth").parentElement!);
    expect(onPart).toHaveBeenCalledWith("depth");
    unmount();
    render(<ConfigControls config={config} state={defaultState(config)} onChange={() => undefined} group="size" />);
    fireEvent.pointerEnter(screen.getByText("Depth").parentElement!);
    expect(onPart).toHaveBeenCalledTimes(1);
  });
});
