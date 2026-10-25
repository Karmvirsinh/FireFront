// Choosing a seed is nondeterministic; creating the map from it remains deterministic.
export function freshSeed(cryptoSource = globalThis.crypto) {
  return cryptoSource.getRandomValues(new Uint32Array(1))[0];
}

export function startupOptions(search, randomSeed = freshSeed) {
  const query = new URLSearchParams(search);
  const benchmark = query.get('benchmark') === '1';
  const fixedFixture = benchmark || query.get('map') === 'fixed';
  return { benchmark, fixedFixture, seed: fixedFixture ? null : randomSeed(),
    normalAnimation: benchmark && query.get('animation') === 'normal' };
}
