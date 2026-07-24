(function exposePlayerRecords(root, factory) {
  "use strict";

  const playerRecords = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = playerRecords;
    return;
  }
  root.SHEEP_PLAYER_RECORDS = playerRecords;
})(typeof window === "object" ? window : globalThis, function createPlayerRecordsModule() {
  "use strict";

  const RECORDS_KEY = "sheepStairClimbDataV1";
  const DEVICE_KEY = "sheepStairClimbDeviceIdV1";
  const RANK_LIMIT = 5;
  const NAME_LIMIT = 9;
  const MAX_CLOUD_FLOOR = 999;

  function defaultData() {
    return {
      players: [],
      totalPlays: 0,
      totalUniquePlayers: 0,
      anonymousPlays: 0,
    };
  }

  function create(options = {}) {
    const scope = typeof globalThis === "object" ? globalThis : {};
    const storage = options.storage || scope.localStorage;
    const config = options.config || scope.SHEEP_SUPABASE || {};
    const fetchImpl = options.fetchImpl || (scope.fetch ? scope.fetch.bind(scope) : null);
    const now = options.now || (() => new Date());
    const randomUUID = options.randomUUID || (() => scope.crypto?.randomUUID?.());
    const random = options.random || Math.random;
    const warn = options.warn || ((...args) => scope.console?.warn(...args));
    const onChange = options.onChange || (() => {});
    let cloudLoaded = false;
    let cloudPlayers = [];
    let cloudPersonalBest = null;
    let pendingRecord = null;

    if (!storage || typeof storage.getItem !== "function" || typeof storage.setItem !== "function") {
      throw new Error("Player records require a Web Storage adapter.");
    }

    function loadLocal() {
      try {
        const raw = storage.getItem(RECORDS_KEY);
        if (!raw) return defaultData();
        const parsed = JSON.parse(raw);
        return {
          ...defaultData(),
          ...parsed,
          players: Array.isArray(parsed.players) ? parsed.players : [],
        };
      } catch {
        return defaultData();
      }
    }

    function saveLocal(data) {
      const normalized = {
        ...defaultData(),
        ...data,
        players: [...data.players].sort((left, right) => right.bestFloor - left.bestFloor),
      };
      normalized.totalUniquePlayers = normalized.players.length;
      storage.setItem(RECORDS_KEY, JSON.stringify(normalized));
      publish();
      return normalized;
    }

    function topPlayers() {
      const players = cloudLoaded ? cloudPlayers : loadLocal().players;
      return [...players].sort((left, right) => right.bestFloor - left.bestFloor).slice(0, RANK_LIMIT);
    }

    function current() {
      const local = loadLocal();
      const players = topPlayers();
      return {
        source: cloudLoaded ? "cloud" : "local",
        players,
        personalBest: cloudLoaded && cloudPersonalBest ? { ...cloudPersonalBest } : players[0] ? { ...players[0] } : null,
        localStats: {
          totalPlays: local.totalPlays || 0,
          totalUniquePlayers: local.totalUniquePlayers || 0,
          anonymousPlays: local.anonymousPlays || 0,
        },
      };
    }

    function publish() {
      onChange(current());
    }

    function stamp() {
      const date = now();
      const pad = (value) => String(value).padStart(2, "0");
      return {
        iso: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
        label: `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
      };
    }

    function getDeviceId() {
      const stored = storage.getItem(DEVICE_KEY);
      if (stored) return stored;
      const generated = randomUUID() || `${Date.now()}_${random().toString(36).slice(2)}`;
      const deviceId = `sheep_${generated}`;
      storage.setItem(DEVICE_KEY, deviceId);
      return deviceId;
    }

    function cloudConfigured() {
      return Boolean(
        config.url &&
          config.anonKey &&
          /^https?:\/\//.test(config.url) &&
          !config.anonKey.includes("YOUR_") &&
          fetchImpl,
      );
    }

    async function cloudRequest(pathname, requestOptions = {}) {
      const url = `${config.url.replace(/\/$/, "")}/rest/v1/${pathname}`;
      const response = await fetchImpl(url, {
        ...requestOptions,
        headers: {
          apikey: config.anonKey,
          Authorization: `Bearer ${config.anonKey}`,
          "Content-Type": "application/json",
          ...(requestOptions.headers || {}),
        },
      });
      if (!response.ok) throw new Error(`Supabase ${response.status}`);
      if (response.status === 204) return null;
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    }

    function formatCloudTime(value) {
      if (!value) return "";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "";
      const pad = (number) => String(number).padStart(2, "0");
      return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    }

    function mapCloudEntry(entry) {
      const time = entry.submitted_at || entry.best_played_at || entry.last_played_at || "";
      return {
        id: entry.id || entry.player_device_id,
        name: entry.player_name || entry.latest_player_name || "未命名",
        bestFloor: Number(entry.floor || entry.best_floor || 0),
        bestTimeIso: time,
        bestTimeLabel: formatCloudTime(time),
        playCount: Number(entry.play_count || 1),
      };
    }

    async function refresh() {
      publish();
      if (!cloudConfigured()) return current();
      try {
        const deviceId = getDeviceId();
        const leaderboard = await cloudRequest(
          `leaderboard_public?select=id,player_name,floor,submitted_at&limit=${RANK_LIMIT}`,
        );
        const personal = await cloudRequest("rpc/get_public_player_best", {
          method: "POST",
          body: JSON.stringify({ p_player_device_id: deviceId }),
        });
        cloudPlayers = Array.isArray(leaderboard) ? leaderboard.map(mapCloudEntry) : [];
        if (Array.isArray(personal) && personal[0]) {
          const best = personal[0];
          const time = best.best_played_at || best.last_played_at || "";
          cloudPersonalBest = {
            id: best.player_device_id,
            name: best.player_name || "你",
            bestFloor: Number(best.best_floor || 0),
            bestTimeIso: time,
            bestTimeLabel: formatCloudTime(time),
            playCount: Number(best.play_count || 0),
          };
        } else {
          cloudPersonalBest = null;
        }
        cloudLoaded = true;
      } catch (error) {
        warn("Supabase records unavailable; using local records.", error);
        cloudLoaded = false;
        cloudPlayers = [];
        cloudPersonalBest = null;
      }
      publish();
      return current();
    }

    function beginAttempt() {
      const data = loadLocal();
      data.totalPlays += 1;
      data.anonymousPlays += 1;
      saveLocal(data);
      pendingRecord = null;
    }

    function qualifies(floor) {
      const players = topPlayers();
      return floor > 0 && (players.length < RANK_LIMIT || floor > players[players.length - 1].bestFloor);
    }

    async function syncAttempt(record) {
      if (!cloudConfigured()) return;
      try {
        await cloudRequest("game_attempts", {
          method: "POST",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            player_device_id: getDeviceId(),
            player_name: record.name || null,
            floor: Math.max(0, Math.min(MAX_CLOUD_FLOOR, Number(record.bestFloor || 0))),
            played_at: record.bestTimeIso,
          }),
        });
        await refresh();
      } catch (error) {
        warn("Supabase attempt insert failed.", error);
      }
    }

    function finishAttempt(floor) {
      const time = stamp();
      pendingRecord = {
        id: `p_${Date.now()}_${random().toString(36).slice(2, 8)}`,
        name: "",
        bestFloor: floor,
        bestTimeIso: time.iso,
        bestTimeLabel: time.label,
        playCount: 1,
      };
      const best = current().personalBest;
      return {
        record: { ...pendingRecord },
        bestFloor: Math.max(floor, best?.bestFloor || 0),
        qualifies: qualifies(floor),
        synced: syncAttempt(pendingRecord),
      };
    }

    async function syncName(record, name) {
      if (!cloudConfigured()) return;
      try {
        await cloudRequest("leaderboard_entries", {
          method: "POST",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            player_device_id: getDeviceId(),
            player_name: name,
            floor: Math.max(0, Math.min(MAX_CLOUD_FLOOR, Number(record.bestFloor || 0))),
            submitted_at: record.bestTimeIso,
          }),
        });
        await refresh();
      } catch (error) {
        warn("Supabase leaderboard insert failed.", error);
      }
    }

    function nameAttempt(input) {
      if (!pendingRecord) return { status: "ignored", name: "", synced: Promise.resolve() };
      const name = String(input || "").trim().slice(0, NAME_LIMIT);
      if (!name) {
        pendingRecord = null;
        return { status: "abandoned", name: "", synced: Promise.resolve() };
      }

      const record = pendingRecord;
      const data = loadLocal();
      const existing = data.players.find((player) => player.name === name);
      if (existing) {
        existing.playCount = (existing.playCount || 0) + 1;
        if (record.bestFloor >= existing.bestFloor) {
          existing.bestFloor = record.bestFloor;
          existing.bestTimeIso = record.bestTimeIso;
          existing.bestTimeLabel = record.bestTimeLabel;
        }
      } else {
        data.players.push({ ...record, name });
      }
      if (data.anonymousPlays > 0) data.anonymousPlays -= 1;
      saveLocal(data);
      pendingRecord = null;
      return { status: "submitted", name, synced: syncName(record, name) };
    }

    function abandonAttempt() {
      if (!pendingRecord) return false;
      pendingRecord = null;
      return true;
    }

    function adminCurrent() {
      return loadLocal();
    }

    function replaceAdminPlayers(rows) {
      const data = loadLocal();
      data.players = rows.map((row, index) => {
        const name = String(row.name || "").trim().slice(0, NAME_LIMIT) || `玩家${index + 1}`;
        const bestFloor = Math.max(0, Number.parseInt(row.bestFloor, 10) || 0);
        const bestTimeLabel = String(row.bestTimeLabel || "").trim() || stamp().label;
        const playCount = Math.max(1, Number.parseInt(row.playCount, 10) || 1);
        return {
          id: `admin_${index}_${name}`,
          name,
          bestFloor,
          bestTimeLabel,
          bestTimeIso: bestTimeLabel,
          playCount,
        };
      });
      data.totalUniquePlayers = data.players.length;
      data.totalPlays = Math.max(
        data.totalPlays || 0,
        data.players.reduce((sum, player) => sum + player.playCount, 0),
      );
      return saveLocal(data);
    }

    function clearAdmin() {
      return saveLocal(defaultData());
    }

    return Object.freeze({
      refresh,
      current,
      attempt: Object.freeze({
        begin: beginAttempt,
        finish: finishAttempt,
        name: nameAttempt,
        abandon: abandonAttempt,
      }),
      admin: Object.freeze({
        current: adminCurrent,
        replace: replaceAdminPlayers,
        clear: clearAdmin,
      }),
    });
  }

  return Object.freeze({ create });
});
