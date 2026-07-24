"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const PlayerRecords = require("../player-records.js");

const RECORDS_KEY = "sheepStairClimbDataV1";
const DEVICE_KEY = "sheepStairClimbDeviceIdV1";

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    read(key) {
      return values.get(key);
    },
  };
}

function fixedDate() {
  return new Date(2026, 6, 24, 9, 8, 7);
}

function createSubject(options = {}) {
  const storage = options.storage || createStorage();
  const requests = [];
  const warnings = [];
  const snapshots = [];
  const fetchImpl =
    options.fetchImpl ||
    (async (url, init = {}) => {
      requests.push({ url, init });
      return {
        ok: true,
        status: 204,
        async text() {
          return "";
        },
      };
    });
  const records = PlayerRecords.create({
    storage,
    config: options.config || {},
    fetchImpl,
    now: fixedDate,
    randomUUID: () => "device-123",
    random: () => 0.25,
    warn: (...args) => warnings.push(args),
    onChange: (snapshot) => snapshots.push(snapshot),
  });
  return { records, requests, snapshots, storage, warnings };
}

test("Given missing or malformed local data, when records load, then defaults are returned", () => {
  const missing = createSubject();
  assert.deepEqual(missing.records.current(), {
    source: "local",
    players: [],
    personalBest: null,
    localStats: { totalPlays: 0, totalUniquePlayers: 0, anonymousPlays: 0 },
  });

  const malformed = createSubject({
    storage: createStorage({ [RECORDS_KEY]: "{not-json" }),
  });
  assert.deepEqual(malformed.records.current().localStats, {
    totalPlays: 0,
    totalUniquePlayers: 0,
    anonymousPlays: 0,
  });
});

test("Given a new play, when an attempt begins, then local counters increment synchronously", () => {
  const { records, storage } = createSubject();
  records.attempt.begin();

  const stored = JSON.parse(storage.read(RECORDS_KEY));
  assert.equal(stored.totalPlays, 1);
  assert.equal(stored.anonymousPlays, 1);
  assert.equal(records.current().localStats.totalPlays, 1);
});

test("Given five scores, when a tied or higher floor finishes, then qualification stays strict", () => {
  const players = [90, 80, 70, 60, 50].map((bestFloor, index) => ({
    id: `p${index}`,
    name: `P${index}`,
    bestFloor,
    playCount: 1,
  }));
  const { records } = createSubject({
    storage: createStorage({
      [RECORDS_KEY]: JSON.stringify({ players, totalPlays: 5, totalUniquePlayers: 5, anonymousPlays: 0 }),
    }),
  });

  const tied = records.attempt.finish(50);
  assert.equal(tied.qualifies, false);
  records.attempt.abandon();

  const higher = records.attempt.finish(51);
  assert.equal(higher.qualifies, true);
});

test("Given a pending attempt, when a trimmed name is submitted, then local identity and best-score rules are preserved", async () => {
  const existing = {
    id: "old",
    name: "Alice",
    bestFloor: 20,
    bestTimeIso: "old",
    bestTimeLabel: "old",
    playCount: 2,
  };
  const { records, storage } = createSubject({
    storage: createStorage({
      [RECORDS_KEY]: JSON.stringify({
        players: [existing],
        totalPlays: 3,
        totalUniquePlayers: 1,
        anonymousPlays: 1,
      }),
    }),
  });

  records.attempt.finish(20);
  const outcome = records.attempt.name("  Alice123456  ");
  await outcome.synced;

  const stored = JSON.parse(storage.read(RECORDS_KEY));
  assert.equal(outcome.status, "submitted");
  assert.equal(outcome.name, "Alice1234");
  assert.equal(stored.players.length, 2);
  assert.equal(stored.players.find((player) => player.name === "Alice").playCount, 2);
  assert.equal(stored.players.find((player) => player.name === "Alice1234").bestFloor, 20);
  assert.equal(stored.anonymousPlays, 0);
});

test("Given an exact existing name and equal floor, when submitted, then play count and timestamp update", async () => {
  const { records, storage } = createSubject({
    storage: createStorage({
      [RECORDS_KEY]: JSON.stringify({
        players: [
          {
            id: "old",
            name: "Alice",
            bestFloor: 20,
            bestTimeIso: "old",
            bestTimeLabel: "old",
            playCount: 2,
          },
        ],
        totalPlays: 3,
        totalUniquePlayers: 1,
        anonymousPlays: 1,
      }),
    }),
  });

  records.attempt.finish(20);
  await records.attempt.name("Alice").synced;

  const player = JSON.parse(storage.read(RECORDS_KEY)).players[0];
  assert.equal(player.playCount, 3);
  assert.equal(player.bestTimeIso, "2026-07-24T09:08:07");
  assert.equal(player.bestTimeLabel, "2026/07/24 09:08:07");
});

test("Given configured cloud storage, when records refresh, then cloud data becomes active", async () => {
  const responses = [
    [{ id: "cloud-1", player_name: "雲端", floor: 88, submitted_at: "2026-07-24T01:02:03Z" }],
    [
      {
        player_device_id: "device-123",
        player_name: null,
        best_floor: 77,
        best_played_at: "2026-07-23T01:02:03Z",
        play_count: 0,
      },
    ],
  ];
  const { records } = createSubject({
    config: { url: "https://example.supabase.co", anonKey: "anon-key" },
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      async text() {
        return JSON.stringify(responses.shift());
      },
    }),
  });

  await records.refresh();
  const snapshot = records.current();
  assert.equal(snapshot.source, "cloud");
  assert.equal(snapshot.players[0].name, "雲端");
  assert.equal(snapshot.personalBest.name, "你");
  assert.equal(snapshot.personalBest.bestFloor, 77);
  assert.equal(snapshot.personalBest.playCount, 0);
});

test("Given a cloud failure, when records refresh, then local data remains active", async () => {
  const { records, warnings } = createSubject({
    config: { url: "https://example.supabase.co", anonKey: "anon-key" },
    fetchImpl: async () => {
      throw new Error("offline");
    },
  });

  await records.refresh();
  assert.equal(records.current().source, "local");
  assert.equal(warnings[0][0], "Supabase records unavailable; using local records.");
});

test("Given extreme floors, when cloud writes occur, then payload floors clamp to zero through 999", async () => {
  const { records, requests } = createSubject({
    config: { url: "https://example.supabase.co", anonKey: "anon-key" },
  });

  const low = records.attempt.finish(-10);
  await low.synced;
  records.attempt.abandon();
  const high = records.attempt.finish(1200);
  await high.synced;

  const attemptBodies = requests
    .filter(({ url }) => url.includes("/game_attempts"))
    .map(({ init }) => JSON.parse(init.body));
  assert.deepEqual(
    attemptBodies.map(({ floor }) => floor),
    [0, 999],
  );
  assert.equal(attemptBodies[0].player_device_id, "sheep_device-123");
  assert.equal(attemptBodies[0].player_name, null);
});

test("Given local admin rows, when replaced, then values normalize and total plays never decreases", () => {
  const { records } = createSubject({
    storage: createStorage({
      [RECORDS_KEY]: JSON.stringify({
        players: [],
        totalPlays: 10,
        totalUniquePlayers: 0,
        anonymousPlays: 2,
      }),
    }),
  });

  records.admin.replace([
    { name: " ", bestFloor: -2, bestTimeLabel: "", playCount: 0 },
    { name: "LongPlayerName", bestFloor: 12.9, bestTimeLabel: "2026/07/01 10:00", playCount: 3 },
  ]);

  const admin = records.admin.current();
  assert.equal(admin.players[0].name, "LongPlaye");
  assert.equal(admin.players[0].bestFloor, 12);
  assert.equal(admin.players[1].name, "玩家1");
  assert.equal(admin.players[1].bestFloor, 0);
  assert.equal(admin.totalPlays, 10);
  assert.equal(admin.anonymousPlays, 2);
});
