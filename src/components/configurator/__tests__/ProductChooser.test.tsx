import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProductChooser from "../ProductChooser";

describe("ProductChooser", () => {
  it("renders both product options", () => {
    render(<ProductChooser onSelect={vi.fn()} />);
    expect(screen.getByText(/trimless letters/i)).toBeInTheDocument();
    expect(screen.getByText(/cast block acrylic/i)).toBeInTheDocument();
  });

  it("calls onSelect with 'trimless-letters' when that option is chosen", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ProductChooser onSelect={onSelect} />);
    await user.click(screen.getByText(/trimless letters/i));
    expect(onSelect).toHaveBeenCalledWith("trimless-letters");
  });

  it("calls onSelect with 'cast-block-acrylic' when that option is chosen", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ProductChooser onSelect={onSelect} />);
    await user.click(screen.getByText(/cast block acrylic/i));
    expect(onSelect).toHaveBeenCalledWith("cast-block-acrylic");
  });
});
