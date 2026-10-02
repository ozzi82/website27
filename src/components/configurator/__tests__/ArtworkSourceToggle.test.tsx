import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ArtworkSourceToggle from "../ArtworkSourceToggle";

describe("ArtworkSourceToggle", () => {
  it("is a labelled radio group with 'Upload logo' and 'Type text'", () => {
    render(<ArtworkSourceToggle value="upload" onChange={() => {}} />);
    expect(screen.getByRole("radiogroup", { name: /artwork/i })).toBeInTheDocument();
    expect(screen.getAllByRole("radio").map((r) => r.getAttribute("value"))).toEqual(["upload", "text"]);
    expect(screen.getByRole("radio", { name: "Upload logo" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Type text" })).not.toBeChecked();
  });

  it("reports the choice on click", async () => {
    const onChange = vi.fn();
    render(<ArtworkSourceToggle value="upload" onChange={onChange} />);
    await userEvent.click(screen.getByRole("radio", { name: "Type text" }));
    expect(onChange).toHaveBeenCalledWith("text");
  });

  it("is keyboard operable with the arrow keys", async () => {
    const onChange = vi.fn();
    render(<ArtworkSourceToggle value="upload" onChange={onChange} />);
    screen.getByRole("radio", { name: "Upload logo" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledWith("text");
  });
});
