"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");

function createStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
  };
}

test("Given the production page, when classic scripts load, then player records precede the game", () => {
  const html = fs.readFileSync(path.join(projectRoot, "index.html"), "utf8");
  const scripts = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map((match) => match[1].split("?")[0]);

  assert.deepEqual(scripts.slice(-3), ["supabase-config.js", "player-records.js", "game.js"]);
});

test("Given a browser global, when player records load, then the game-facing module works through window", () => {
  const source = fs.readFileSync(path.join(projectRoot, "player-records.js"), "utf8");
  const context = vm.createContext({
    window: {},
    console,
    Date,
    Math,
    JSON,
    Promise,
    Object,
    Array,
    String,
    Number,
    Boolean,
    Error,
  });

  new vm.Script(source, { filename: "player-records.js" }).runInContext(context);
  const module = context.window.SHEEP_PLAYER_RECORDS;
  assert.equal(typeof module.create, "function");

  const storage = createStorage();
  const records = module.create({
    storage,
    config: {},
    now: () => new Date(2026, 6, 24, 9, 8, 7),
    randomUUID: () => "smoke-device",
    random: () => 0.25,
  });
  records.attempt.begin();
  const finish = records.attempt.finish(42);
  const submission = records.attempt.name("QA測試玩家");

  assert.equal(finish.qualifies, true);
  assert.equal(submission.status, "submitted");
  assert.equal(records.current().players[0].bestFloor, 42);
});
