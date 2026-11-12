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

// There is no live map to retain on first load. Recover visibly to a known
// validated seed instead of leaving the entry flow partially initialized.
export function generateInitialEnvironment(seed,generator){
  try{return {map:generator(seed),notice:''};}
  catch(error){
    if(seed===0)throw error;
    return {map:generator(0),notice:`Initial seed ${seed} could not generate; loaded seed 0. You can try another seed.`};
  }
}
