/** Small seeded PRNG, so generated wall textures are identical on every load. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Value noise on a `cells` x `cells` lattice that wraps, so it repeats exactly every
 * 1.0 in u and v and a texture painted from it tiles without seams. Returns [0, 1].
 */
export function makeTileableNoise(cells: number, seed: number): (u: number, v: number) => number {
  const rand = mulberry32(seed);
  const lattice = Float32Array.from({ length: cells * cells }, () => rand());
  return (u, v) => {
    const x = u * cells;
    const y = v * cells;
    const fi = Math.floor(x);
    const fj = Math.floor(y);
    const fx = x - fi;
    const fy = y - fj;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    // Wrap the lattice indices once (negative u or v just wraps the other way).
    const i0 = ((fi % cells) + cells) % cells;
    const j0 = ((fj % cells) + cells) % cells;
    const i1 = i0 + 1 === cells ? 0 : i0 + 1;
    const j1 = j0 + 1 === cells ? 0 : j0 + 1;
    const r0 = j0 * cells;
    const r1 = j1 * cells;
    const top = lattice[r0 + i0] + (lattice[r0 + i1] - lattice[r0 + i0]) * sx;
    const bottom = lattice[r1 + i0] + (lattice[r1 + i1] - lattice[r1 + i0]) * sx;
    return top + (bottom - top) * sy;
  };
}

/** Sum of tileable noise octaves (each twice the frequency, half the weight), normalised to [0, 1]. */
export function makeFbm(baseCells: number, octaves: number, seed: number): (u: number, v: number) => number {
  const layers = Array.from({ length: octaves }, (_, o) => makeTileableNoise(baseCells * 2 ** o, seed + o * 101));
  let total = 0;
  for (let o = 0; o < octaves; o++) total += 0.5 ** o;
  return (u, v) => {
    let sum = 0;
    let weight = 1;
    for (let o = 0; o < octaves; o++) {
      sum += layers[o](u, v) * weight;
      weight *= 0.5;
    }
    return sum / total;
  };
}
