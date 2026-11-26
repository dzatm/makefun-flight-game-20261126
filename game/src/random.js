// Deterministic dice for the sky: a mulberry32 generator. Feed it the same
// seed and it deals the same islands, rings and storms every time, which is
// what keeps ?seed=N flights and the screenshot scenes reproducible.

export function makeRng(seed) {
  let state = seed | 0;
  return function next() {
    state = (state + 0x6d2b79f5) | 0;
    let mix = Math.imul(state ^ (state >>> 15), 1 | state);
    mix = (mix + Math.imul(mix ^ (mix >>> 7), 61 | mix)) ^ mix;
    return ((mix ^ (mix >>> 14)) >>> 0) / 4294967296;
  };
}

/** Draw one entry out of `list` with the seeded generator. */
export function choose(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

/** Draw a float in [lo, hi) with the seeded generator. */
export function between(rng, lo, hi) {
  return lo + rng() * (hi - lo);
}
