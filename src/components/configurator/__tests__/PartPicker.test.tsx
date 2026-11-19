import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import * as THREE from "three";
import { PartPicker } from "../PartPicker";

const square = (x: number, size = 1) => new THREE.Shape([new THREE.Vector2(x, 0), new THREE.Vector2(x + size, 0), new THREE.Vector2(x + size, size), new THREE.Vector2(x, size)]);

describe("PartPicker", () => {
  it("marks the clicked parts as what the visitor says they are", () => {
    const onChange = vi.fn();
    render(<PartPicker shapes={[square(0, 5), square(1), square(3)]} roles={[]} onChange={onChange} />);
    // Nothing can be assigned before a part is picked
    expect(screen.getByRole("button", { name: "Raceway" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Part 1: Letter" }));
    expect(screen.getByText("1 part selected")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Raceway" }));
    expect(onChange).toHaveBeenCalledWith(["raceway", "letter", "letter"]);
  });

  it("shows what a part already is", () => {
    render(<PartPicker shapes={[square(0, 5), square(1)]} roles={["cabinet"]} onChange={() => undefined} />);
    expect(screen.getByRole("button", { name: "Part 1: Cabinet" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Part 2: Letter" })).toBeInTheDocument();
  });
});
