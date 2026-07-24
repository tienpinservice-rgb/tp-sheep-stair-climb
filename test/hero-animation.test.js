"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const HeroAnimation = require("../hero-animation.js");

test("Given normal and charged walking frames, when charging animates, then every charged frame flashes against its matching normal frame", () => {
  const normalFrames = ["normal-1", "normal-2"];
  const chargedFrames = ["charged-1", "charged-2"];

  const sequence = HeroAnimation.interleaveChargeFrames(normalFrames, chargedFrames);

  assert.deepEqual(sequence, ["normal-1", "charged-1", "normal-2", "charged-2"]);
});

test("Given crystal charging frames, when charging animates, then the same flash rhythm is preserved", () => {
  const normalFrames = ["normal-1", "normal-2"];
  const crystalFrames = ["crystal-1", "crystal-2"];

  const sequence = HeroAnimation.interleaveChargeFrames(normalFrames, crystalFrames);

  assert.deepEqual(sequence, ["normal-1", "crystal-1", "normal-2", "crystal-2"]);
});
