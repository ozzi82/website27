import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ConfiguratorTour, { TOUR_STOPS, TourOffer, cardPosition, rememberTourAnswer, tourAnswered } from "../ConfiguratorTour";

beforeEach(() => window.localStorage.clear());

describe("the first-visit question", () => {
  it("is asked once: either answer is remembered", () => {
    expect(tourAnswered()).toBe(false);
    rememberTourAnswer("skip");
    expect(tourAnswered()).toBe(true);
  });

  it("offers the tour or going straight in", () => {
    const onTour = vi.fn();
    const onSkip = vi.fn();
    render(<TourOffer onTour={onTour} onSkip={onSkip} />);
    fireEvent.click(screen.getByRole("button", { name: "Show me how" }));
    fireEvent.click(screen.getByRole("button", { name: "I know how" }));
    expect(onTour).toHaveBeenCalledTimes(1);
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});

describe("the guided tour", () => {
  it("walks through the stops, opening each options step, and ends on the last", () => {
    const onPanel = vi.fn();
    const onClose = vi.fn();
    render(<ConfiguratorTour onPanel={onPanel} onClose={onClose} />);
    // No preview, toolbar or buttons on this bare page: only the stops that open a step remain.
    const stops = TOUR_STOPS.filter((s) => s.panel);
    expect(screen.getByRole("dialog").getAttribute("aria-label")).toContain(`step 1 of ${stops.length}`);
    expect(onPanel).toHaveBeenLastCalledWith("type");
    for (let i = 1; i < stops.length; i++) fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onPanel).toHaveBeenLastCalledWith("light");
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(onPanel).toHaveBeenLastCalledWith("colour");
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Start building" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape and on the close button", () => {
    const onClose = vi.fn();
    render(<ConfiguratorTour onPanel={() => {}} onClose={onClose} />);
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "Close the tour" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

describe("cardPosition", () => {
  it("puts the card beside the target on a wide window, inside it", () => {
    const p = cardPosition({ x: 940, y: 300, w: 450, h: 380 }, { w: 1440, h: 900 }, 190);
    expect(p.left + 320).toBeLessThanOrEqual(940); // to the left of the options column
    expect(p.top).toBeGreaterThanOrEqual(12);
    const q = cardPosition({ x: 20, y: 70, w: 300, h: 600 }, { w: 1440, h: 900 }, 190);
    expect(q.left).toBeGreaterThanOrEqual(320); // no room on the left: to the right
  });
  it("puts the card under or over the target on a phone, never off the screen", () => {
    const under = cardPosition({ x: 12, y: 60, w: 366, h: 300 }, { w: 390, h: 800 }, 190);
    expect(under.top).toBeGreaterThanOrEqual(360);
    const over = cardPosition({ x: 12, y: 420, w: 366, h: 330 }, { w: 390, h: 800 }, 190);
    expect(over.top + 190).toBeLessThanOrEqual(420);
    for (const p of [under, over]) {
      expect(p.left).toBeGreaterThanOrEqual(12);
      expect(p.left + 320).toBeLessThanOrEqual(390 - 12);
    }
  });
});
