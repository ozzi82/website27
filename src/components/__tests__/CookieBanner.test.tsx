import { beforeEach, describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CookieBanner from "../CookieBanner";
import { clearConsent, getConsent } from "../../lib/consent";

beforeEach(() => window.localStorage.clear());

describe("CookieBanner", () => {
  it("asks once, and Accept or Decline is remembered and hides it", async () => {
    const user = userEvent.setup();
    render(<CookieBanner />);
    expect(screen.getByRole("region", { name: "Cookie notice" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Decline" }));
    expect(getConsent()).toBe("declined");
    expect(screen.queryByRole("region", { name: "Cookie notice" })).not.toBeInTheDocument();
  });

  it("does not show when a choice was already made, and the footer's Cookie settings brings it back", () => {
    window.localStorage.setItem("sls.consent.v1", "accepted");
    render(<CookieBanner />);
    expect(screen.queryByRole("region", { name: "Cookie notice" })).not.toBeInTheDocument();
    act(() => clearConsent());
    expect(screen.getByRole("region", { name: "Cookie notice" })).toBeInTheDocument();
  });

  it("says optional cookies are off unless accepted", () => {
    render(<CookieBanner />);
    expect(screen.getByRole("region", { name: "Cookie notice" }).textContent).toMatch(/stay off unless you accept/);
  });
});
