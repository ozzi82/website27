// What each part of an uploaded drawing is. Customers' drawings often show more than letters: a raceway, a cabinet
// acting as one, vinyl on a face, a wall or a border that is no part of the sign. The visitor can say so; then only the
// letters are lit and counted, and the quote names the rest.
import * as THREE from "three";

export type PartRole = "letter" | "raceway" | "cabinet" | "vinyl" | "ignore";

export const PART_ROLES: { id: PartRole; label: string; hint: string; swatch: string }[] = [
  { id: "letter", label: "Letter", hint: "Part of the sign, built and lit as chosen", swatch: "#f1671c" },
  { id: "raceway", label: "Raceway", hint: "The box the letters are mounted on", swatch: "#4b5563" },
  { id: "cabinet", label: "Cabinet", hint: "A sign box or panel behind the letters", swatch: "#1f2937" },
  { id: "vinyl", label: "Vinyl on the face", hint: "Colour applied to a face, not a letter of its own", swatch: "#0f766e" },
  { id: "ignore", label: "Not part of the sign", hint: "A wall, a border, a note: left out", swatch: "#d1d5db" },
];

export const roleOf = (roles: readonly PartRole[], i: number): PartRole => roles[i] ?? "letter";

/** The shapes that are letters (lit, counted for LEDs and stroke width). */
export function letterShapes(shapes: THREE.Shape[], roles: readonly PartRole[]): THREE.Shape[] {
  return roles.some((r) => r && r !== "letter") ? shapes.filter((_, i) => roleOf(roles, i) === "letter") : shapes;
}

/** Raceways and cabinets: drawn as a plain box behind the letters. */
export function backingShapes(shapes: THREE.Shape[], roles: readonly PartRole[]): THREE.Shape[] {
  return shapes.filter((_, i) => roleOf(roles, i) === "raceway" || roleOf(roles, i) === "cabinet");
}

/** One line for the quote, e.g. "1 raceway, 2 areas of vinyl on the face, 1 part left out"; empty when all are letters. */
export function describeParts(roles: readonly PartRole[], count: number): string {
  const n = (role: PartRole) => Array.from({ length: count }, (_, i) => roleOf(roles, i)).filter((r) => r === role).length;
  const some = (k: number, one: string, many: string) => (k ? [`${k} ${k === 1 ? one : many}`] : []);
  return [
    ...some(n("raceway"), "raceway", "raceways"),
    ...some(n("cabinet"), "cabinet", "cabinets"),
    ...some(n("vinyl"), "area of vinyl on the face", "areas of vinyl on the face"),
    ...some(n("ignore"), "part left out (not part of the sign)", "parts left out (not part of the sign)"),
  ].join(", ");
}
