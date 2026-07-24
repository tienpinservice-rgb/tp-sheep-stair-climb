(function initHeroAnimation(root, factory) {
  const heroAnimation = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = heroAnimation;
    return;
  }
  root.SHEEP_HERO_ANIMATION = heroAnimation;
})(typeof window === "object" ? window : globalThis, function createHeroAnimationModule() {
  "use strict";

  function interleaveChargeFrames(normalFrames, chargedFrames) {
    return chargedFrames.flatMap((chargedFrame, index) => [
      normalFrames[index % normalFrames.length],
      chargedFrame,
    ]);
  }

  return Object.freeze({ interleaveChargeFrames });
});
