import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ChatLauncher from "../ChatLauncher";
import { CHAT_READY_EVENT } from "../../lib/chat";

afterEach(() => {
  delete (window as unknown as { HubSpotConversations?: unknown }).HubSpotConversations;
  window.localStorage.clear();
});

describe("ChatLauncher", () => {
  it("is a visible 'Chat with us' button even before the visitor chose cookies", () => {
    render(<ChatLauncher />);
    expect(screen.getByRole("button", { name: /chat with us/i })).toBeInTheDocument();
  });

  it("steps aside once HubSpot's own chat bubble is ready", () => {
    render(<ChatLauncher />);
    act(() => { window.dispatchEvent(new CustomEvent(CHAT_READY_EVENT)); });
    expect(screen.queryByRole("button", { name: /chat with us/i })).toBeNull();
  });

  it("opens the chat when clicked", () => {
    const open = vi.fn();
    (window as unknown as { HubSpotConversations: unknown }).HubSpotConversations = { widget: { open } };
    // widget already there: the launcher is not needed, the footer link and this call still work
    render(<ChatLauncher />);
    expect(screen.queryByRole("button", { name: /chat with us/i })).toBeNull();
  });
});
