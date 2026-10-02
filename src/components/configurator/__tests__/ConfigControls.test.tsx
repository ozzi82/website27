import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfigControls from "../ConfigControls";
import { defaultConfigFor } from "../types";
import type { ProductConfig } from "../types";

describe("ConfigControls", () => {
  it("shows Trimless-only controls when configuring Trimless Letters", () => {
    render(<ConfigControls config={defaultConfigFor("trimless-letters")} onChange={vi.fn()} />);
    expect(screen.getByLabelText(/illumination/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/depth/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/face color/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/return color/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/day.*night|night.*day/i)).toBeInTheDocument();
  });

  it("shows only acrylic color and day/night for Cast Block Acrylic, no illumination/depth/return controls", () => {
    render(<ConfigControls config={defaultConfigFor("cast-block-acrylic")} onChange={vi.fn()} />);
    expect(screen.getByLabelText(/acrylic color/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/day.*night|night.*day/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/illumination/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^depth/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/return color/i)).not.toBeInTheDocument();
  });

  it("calls onChange with an updated config when the day/night toggle is used", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const config = defaultConfigFor("trimless-letters");
    render(<ConfigControls config={config} onChange={onChange} />);

    await user.click(screen.getByLabelText(/day.*night|night.*day/i));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ dayNight: "night" })
    );
  });

  it("calls onChange with an updated illumination style for Trimless", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const config = defaultConfigFor("trimless-letters");
    render(<ConfigControls config={config} onChange={onChange} />);

    await user.selectOptions(screen.getByLabelText(/illumination/i), "halo-lit");

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ illumination: "halo-lit" })
    );
  });
});
