export function benchmarkBlockers(info) {
  const reasons = [];
  if (!info.build.productionBuild) reasons.push('Use a freshly built production preview.');
  if (info.viewport.width !== 1280 || info.viewport.height !== 720) reasons.push('Browser viewport must be 1280x720 CSS pixels.');
  if (!info.visible || !info.focused) reasons.push('Keep the document visible and focused in the foreground.');
  if (info.reducedMotion) reasons.push('Normal animation is required; reduced motion is enabled.');
  if (!info.cameraDefault) reasons.push('Press R to restore the default overview.');
  if (info.grid.width !== 64 || info.grid.height !== 64 || info.population !== 20) reasons.push('Expected 64x64 grid and 20 agents.');
  if (/swiftshader|llvmpipe|software|basic render/i.test(info.graphics.renderer)) reasons.push('Software rendering is not a representative hardware-accelerated measurement.');
  return reasons;
}
