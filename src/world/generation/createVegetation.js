import { createNoise2D } from 'simplex-noise';

export function createVegetation(settings, vegetationRandom, rockRandom) {
  const regions = createNoise2D(vegetationRandom);
  const rocks = createNoise2D(rockRandom);
  return Array.from({ length: settings.width * settings.height }, (_, index) => {
    const x = index % settings.width, z = Math.floor(index / settings.width);
    const value = regions(x * settings.noiseScale, z * settings.noiseScale);
    if (rocks(x * settings.rockScale + 100, z * settings.rockScale + 100) > settings.rockThreshold) {
      return { terrain: 'obstacle', fuelType: 'none', walkable: false };
    }
    if (value < settings.clearingThreshold) return { terrain: 'clearing', fuelType: 'none', walkable: true };
    const fuelType = value < settings.grassThreshold ? 'grass' : value < settings.brushThreshold ? 'brush' : 'forest';
    return { terrain: 'vegetation', fuelType, walkable: fuelType === 'grass' };
  });
}
