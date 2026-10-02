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

const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * Value noise on a `cells` x `cells` lattice that wraps, so it repeats exactly every
 * 1.0 in u and v and a texture painted from it tiles without seams. Returns [0, 1].
 */
export function makeTileableNoise(cells: number, seed: number): (u: number, v: number) => number {
  const rand = mulberry32(seed);
  const lattice = Float32Array.from({ length: cells * cells }, () => rand());
  const at = (i: number, j: number) => lattice[(((j % cells) + cells) % cells) * cells + (((i % cells) + cells) % cells)];
  return (u, v) => {
    const x = u * cells;
    const y = v * cells;
    const i = Math.floor(x);
    const j = Math.floor(y);
    const fx = smooth(x - i);
    const fy = smooth(y - j);
    const top = at(i, j) + (at(i + 1, j) - at(i, j)) * fx;
    const bottom = at(i, j + 1) + (at(i + 1, j + 1) - at(i, j + 1)) * fx;
    return top + (bottom - top) * fy;
  };
}

/** Sum of tileable noise octaves (each twice the frequency, half the weight), normalised to [0, 1]. */
export function makeFbm(baseCells: number, octaves: number, seed: number): (u: number, v: number) => number {
  const layers = Array.from({ length: octaves }, (_, o) => makeTileableNoise(baseCells * 2 ** o, seed + o * 101));
  const total = layers.reduce((sum, _, o) => sum + 0.5 ** o, 0);
  return (u, v) => layers.reduce((sum, n, o) => sum + n(u, v) * 0.5 ** o, 0) / total;
}
