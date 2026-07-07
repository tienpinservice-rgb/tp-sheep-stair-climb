(() => {
  "use strict";

  const W = 360;
  const H = 640;
  const ASSET = "PIC/Game assets";
  const SOUND = "sound";
  const RANK_LIMIT = 5;
  const STORAGE_KEY = "sheepStairClimbDataV1";
  const DEVICE_ID_KEY = "sheepStairClimbDeviceIdV1";
  const SUPABASE_CONFIG = window.SHEEP_SUPABASE || {};
  const GOTO_LINKS = [
    "https://www.tienpin.com.tw",
    "https://www.youtube.com/@%E5%A4%A9%E5%93%81%E5%B1%B1%E8%8E%8A%E5%9F%BA%E7%9D%A3%E5%BE%92%E5%A2%93%E5%9C%92/videos",
    "https://sites.google.com/view/tienpingroupweb/%E9%A6%96%E9%A0%81",
  ];
  const FIELD_LEFT = 12;
  const FIELD_RIGHT = 348;
  const GROUND_LAYER_Y = 629;
  const GROUND_Y = GROUND_LAYER_Y;
  const FOREGROUND_LAYER_Y = 254;
  const HERO_W = 96;
  const HERO_H = 96;
  const HERO_LEFT_THIRD_X = HERO_W / 3;
  const HERO_RIGHT_THIRD_X = (HERO_W * 2) / 3;
  const HERO_BASE_SPEED = 78;
  const HERO_JUMP_DISTANCE_MULTIPLIER = 1.3;
  const MAX_FLOOR = 999;
  const PLATFORM_SUPPORT_INSET = 8;
  const PLATFORM_CHARGE_INSET = 0;
  const PLATFORM_W = 90;
  const PLATFORM_H = 13;
  const PLATFORM_REQUIRED_STEP_Y = 190;
  const PLATFORM_AUX_DIVISIONS = 3;
  const PLATFORM_STEP_Y = PLATFORM_REQUIRED_STEP_Y / PLATFORM_AUX_DIVISIONS;
  const FIRST_PLATFORM_Y = 555;
  const PLATFORM_REGION_COUNT = 5;
  const PLATFORM_SCREEN_GROUP = 12;
  const MOVING_PLATFORM_SLOTS = [7, 3, 11, 0, 5, 9, 1, 4, 10, 2, 6, 8];
  const BRANCH_PLATFORM_SLOTS = [1, 2, 5, 8, 10];
  const PLATFORM_MIN_X_DELTA = 26;
  const PLATFORM_Y_JITTER = 2;
  const BRANCH_PLATFORM_MIN_X_DELTA = 118;
  const BRANCH_WALL_CHANCE = 0.12;
  const DROP_PLATFORM_START_FLOOR = 10;
  const DROP_PLATFORM_SHAKE_DELAY = 0.5;
  const DROP_PLATFORM_FALL_GRAVITY = 360;
  const MOVING_AXIS_PATTERN = ["x", "x", "y", "x", "x", "y", "x", "x", "y", "x"];
  const VERTICAL_PLATFORM_AMPLITUDE_BOOST = 2;
  const MOVING_PLATFORM_SPEED_BOOST = 1.5;
  const MIN_CLOUDS = 10;
  const MAX_CLOUDS = 16;
  const CRYSTAL_W = 28;
  const CRYSTAL_H = 28;
  const CRYSTAL_INCLUDE_FLOOR_ZERO = true;
  const CRYSTAL_BLINK_SPEED = 2.5;
  const CRYSTAL_FLOAT_AMOUNT = 4;
  const CRYSTAL_FLOAT_SPEED = 3.4;
  const CRYSTAL_FIRST_FLOOR = 10;
  const CRYSTAL_FLOOR_INTERVAL = 10;
  const DOUBLE_JUMP_GRANT = 3;
  const START_TUTORIAL_DELAY_MS = 700;

  const $ = (id) => document.getElementById(id);
  const path = (subPath) => `${ASSET}/${subPath}`;
  const soundPath = (fileName) => `${SOUND}/${fileName}`;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const rand = (min, max) => min + Math.random() * (max - min);
  const isSpaceKey = (event) => event.code === "Space" || event.key === " ";
  const isEnterKey = (event) => event.code === "Enter" || event.key === "Enter";
  const isPauseButtonEvent = (event) => event.target.closest("#pauseButton");
  const isTutorialEvent = (event) => event.target.closest("#tutorialOverlay");
  const heroLeftThirdX = () => state.hero.x + HERO_LEFT_THIRD_X;
  const heroRightThirdX = () => state.hero.x + HERO_RIGHT_THIRD_X;
  const supportInView = (worldY, margin = 0) => worldY - state.cameraY < H - margin;
  const nowStamp = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return {
      iso: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
      label: `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
    };
  };

  const powerImages = Array.from({ length: 11 }, (_, i) => {
    if (i === 6) return path("power/PPOWER_06.png");
    return path(`power/POWER_${String(i).padStart(2, "0")}.png`);
  });

  const digitImages = {
    0: path("loor/0.png"),
    1: path("loor/1.png"),
    2: path("loor/2.png"),
    3: path("loor/3.png"),
    4: path("loor/4.png"),
    5: path("loor/5.png"),
    6: path("loor/6.png"),
    7: path("loor/7.png"),
    8: path("loor/8.png"),
    9: path("loor/9.png"),
    F: path("loor/F.png"),
  };

  const roleFrames = {
    stay: [path("role/GO_01.png"), path("role/GO_02.png")],
    charge: [path("role/GOS_01.png"), path("role/GOS_02.png")],
    chargeCrystal: [path("role/GOS_03.png"), path("role/GOS_04.png")],
    jump: [path("role/JUP_01.png"), path("role/JUP_02.png"), path("role/JUP_01.png")],
  };

  const crystalFrames = [path("background/TPB-01.png"), path("background/TPB-02.png")];
  const buttonImages = [
    "START-01.png",
    "START-02.png",
    "STOP-01.png",
    "STOP-02.png",
    "RESTART-01.png",
    "RESTART-02.png",
    "GOTP-01.png",
    "GOTP-02.png",
    "MENU-01.png",
    "MENU-02.png",
    "GO-01.png",
    "GO-02.png",
    "GO-03.png",
    "GO-04.png",
  ].map((fileName) => path(`Button/${fileName}`));
  const preloadImages = [
    path("background/bg_00.png"),
    path("background/bg_06.png"),
    path("background/bg_01.png"),
    path("background/bg_02.png"),
    path("background/bg_03.png"),
    path("background/bg_04.png"),
    path("background/bg_05.png"),
    path("background/bgi_05.png"),
    path("background/illustrate-01.png"),
    path("background/illustrate-02.png"),
    path("background/bg_Bwall.png"),
    path("background/bg_LRUwall.png"),
    path("background/Leaderboard_01.png"),
    path("background/Leaderboard_02.png"),
    path("background/Leaderboard_02 -02.png"),
    path("background/Leaderboard_03.png"),
    path("background/LOGO_01.png"),
    path("background/LOGO_02.png"),
    path("background/LOGO_03.png"),
    path("background/gameover logo.png"),
    path("background/platform_01.png"),
    path("background/platform_02.png"),
    path("background/platform_03.png"),
    ...Array.from({ length: 5 }, (_, i) => path(`cloud/cloud_0${i + 1}.png`)),
    ...powerImages,
    ...Object.values(digitImages),
    ...Object.values(roleFrames).flat(),
    ...crystalFrames,
    ...buttonImages,
  ];

  const soundConfig = {
    button: { file: "Button.mp3", volume: 0.55 },
    fallHero: { file: "fall-01.MP3", volume: 0.72 },
    fallPlatform: { file: "fall-02.MP3", volume: 0.66 },
    gameover: { file: "gameover -01.mp3", volume: 0.72 },
    crystal: { file: "get.MP3", volume: 0.72 },
    jump: { file: "Jump.mp3", volume: 0.62 },
    landing: { file: "landing.mp3", volume: 0.62 },
    leaderboard: { file: "Leaderboard.MP3", volume: 0.7 },
    power: { file: "power.MP3", volume: 0.45 },
    start: { file: "START.mp3", volume: 0.7 },
  };

  const audioState = {
    unlocked: false,
    clips: new Map(),
    bgm: null,
    lastButtonAt: 0,
  };

  function initAudio() {
    if (audioState.clips.size) return;
    Object.entries(soundConfig).forEach(([name, config]) => {
      const clip = new Audio(soundPath(config.file));
      clip.preload = "auto";
      clip.volume = config.volume;
      audioState.clips.set(name, clip);
    });
    audioState.bgm = new Audio(soundPath("moodmode-retro-game-music-245230.MP3"));
    audioState.bgm.loop = true;
    audioState.bgm.preload = "auto";
    audioState.bgm.volume = 0.16;
  }

  function unlockAudio() {
    initAudio();
    if (audioState.unlocked) return;
    audioState.unlocked = true;
    audioState.clips.forEach((clip) => clip.load());
    if (audioState.bgm) audioState.bgm.muted = false;
    startBgm();
  }

  function startBgm() {
    if (!audioState.unlocked || !audioState.bgm || !audioState.bgm.paused) return;
    audioState.bgm.muted = false;
    audioState.bgm.play().catch(() => {
      audioState.unlocked = false;
    });
  }

  function primeMutedBgm() {
    initAudio();
    if (!audioState.bgm) return;
    audioState.bgm.muted = true;
    audioState.bgm.play().catch(() => {});
  }

  function playSound(name) {
    if (!audioState.unlocked) return;
    const baseClip = audioState.clips.get(name);
    if (!baseClip) return;
    const clip = baseClip.cloneNode();
    clip.volume = baseClip.volume;
    clip.play().catch(() => {});
  }

  const dom = {
    viewport: $("viewport"),
    stage: $("stage"),
    loadingOverlay: $("loadingOverlay"),
    loadingFill: $("loadingFill"),
    splashScreen: $("splashScreen"),
    menuScreen: $("menuScreen"),
    gameScreen: $("gameScreen"),
    gameOverScreen: $("gameOverScreen"),
    adminScreen: $("adminScreen"),
    menuLeaderboard: $("menuLeaderboard"),
    personalBest: $("personalBest"),
    startButton: $("startButton"),
    cloudLayer: $("cloudLayer"),
    foregroundLayer: $("foregroundLayer"),
    platformLayer: $("platformLayer"),
    groundLayer: $("groundLayer"),
    hero: $("hero"),
    powerMeter: $("powerMeter"),
    floorDigits: $("floorDigits"),
    pauseButton: $("pauseButton"),
    pauseOverlay: $("pauseOverlay"),
    tutorialOverlay: $("tutorialOverlay"),
    tutorialIllustration: $("tutorialIllustration"),
    tutorialContinueButton: $("tutorialContinueButton"),
    finalFloorText: $("finalFloorText"),
    finalBestText: $("finalBestText"),
    overHero: $("overHero"),
    rankDialog: $("rankDialog"),
    normalResultDialog: $("normalResultDialog"),
    rankRecordText: $("rankRecordText"),
    playerNameInput: $("playerNameInput"),
    submitRankButton: $("submitRankButton"),
    restartButton: $("restartButton"),
    gotoButton: $("gotoButton"),
    menuButton: $("menuButton"),
    adminSummary: $("adminSummary"),
    adminRows: $("adminRows"),
    adminAddButton: $("adminAddButton"),
    adminSaveButton: $("adminSaveButton"),
    adminClearButton: $("adminClearButton"),
    adminBackButton: $("adminBackButton"),
  };

  const state = {
    mode: "splash",
    lastTime: 0,
    scale: 1,
    cameraY: 0,
    floor: 0,
    cameraLiftRemainder: 0,
    maxWorldClimb: 0,
    cameraPushActive: false,
    cloudSpawnTimer: 0,
    nextCloudSpawnDelay: 0.8,
    charging: false,
    inputHeld: false,
    chargeMs: 0,
    chargeStartedAt: 0,
    chargeLevel: 0,
    chargeMode: "ground",
    doubleJumpCharges: 0,
    gameOverPending: false,
    gameOverDelay: 0,
    pendingRankSaved: false,
    finalRecord: null,
    nextPlatformId: 1,
    generatedPlatformZones: new Set(),
    crystalFloors: new Set(),
    platformRegionPatterns: new Map(),
    platformPlacements: new Map(),
    wallSideStart: 0,
    nextPathX: 178,
    lastMainPathPlatform: null,
    overHero: {
      x: 145,
      dir: 1,
      frameTime: 0,
      frameIndex: 0,
      jumpGrace: 0,
    },
    startedAt: 0,
    hero: {
      x: 136,
      y: GROUND_Y,
      vx: HERO_BASE_SPEED,
      vy: 0,
      dir: -1,
      grounded: true,
      surface: "ground",
      action: "stay",
      frameTime: 0,
      frameIndex: 0,
    },
    platforms: [],
    clouds: [],
    cloudEnabled: false,
    cloudLoaded: false,
    cloudPlayers: [],
    cloudPersonalBest: null,
    lastPauseButtonToggleAt: 0,
    tutorialActive: false,
    tutorialKind: null,
    tutorialStartShown: false,
    tutorialCrystalShown: false,
    tutorialTimeoutId: 0,
    lastTutorialButtonAt: 0,
  };

  const defaultData = () => ({
    players: [],
    totalPlays: 0,
    totalUniquePlayers: 0,
    anonymousPlays: 0,
  });

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
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

  function saveData(data) {
    const normalized = {
      ...defaultData(),
      ...data,
      players: [...data.players].sort((a, b) => b.bestFloor - a.bestFloor),
    };
    normalized.totalUniquePlayers = normalized.players.length;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    renderMenuRecords();
  }

  function getOrCreateDeviceId() {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (id) return id;
    const randomPart = window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    id = `sheep_${randomPart}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
    return id;
  }

  function cloudConfigured() {
    return Boolean(
      SUPABASE_CONFIG.url &&
      SUPABASE_CONFIG.anonKey &&
      /^https?:\/\//.test(SUPABASE_CONFIG.url) &&
      !SUPABASE_CONFIG.anonKey.includes("YOUR_"),
    );
  }

  function cloudHeaders(extra = {}) {
    return {
      apikey: SUPABASE_CONFIG.anonKey,
      Authorization: `Bearer ${SUPABASE_CONFIG.anonKey}`,
      "Content-Type": "application/json",
      ...extra,
    };
  }

  async function cloudRequest(pathname, options = {}) {
    if (!cloudConfigured()) throw new Error("Supabase is not configured.");
    const url = `${SUPABASE_CONFIG.url.replace(/\/$/, "")}/rest/v1/${pathname}`;
    const response = await fetch(url, {
      ...options,
      headers: cloudHeaders(options.headers || {}),
    });
    if (!response.ok) throw new Error(`Supabase ${response.status}`);
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  function mapCloudEntry(entry) {
    return {
      id: entry.id || entry.player_device_id,
      name: entry.player_name || entry.latest_player_name || "未命名",
      bestFloor: Number(entry.floor || entry.best_floor || 0),
      bestTimeIso: entry.submitted_at || entry.best_played_at || entry.last_played_at || "",
      bestTimeLabel: formatCloudTime(entry.submitted_at || entry.best_played_at || entry.last_played_at),
      playCount: Number(entry.play_count || 1),
    };
  }

  function formatCloudTime(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  function getActiveData() {
    if (state.cloudLoaded) {
      return {
        ...defaultData(),
        players: state.cloudPlayers,
        totalUniquePlayers: state.cloudPlayers.length,
      };
    }
    return loadData();
  }

  function topPlayers() {
    return [...getActiveData().players].sort((a, b) => b.bestFloor - a.bestFloor).slice(0, RANK_LIMIT);
  }

  function bestPlayer() {
    return state.cloudLoaded && state.cloudPersonalBest ? state.cloudPersonalBest : topPlayers()[0] || null;
  }

  function isTopFive(floor) {
    const players = topPlayers();
    return floor > 0 && (players.length < RANK_LIMIT || floor > players[players.length - 1].bestFloor);
  }

  function formatFloor(num) {
    return `${String(Math.max(0, Math.floor(num))).padStart(3, "0").slice(-3)}F`;
  }

  function renderFloorImageText(container, num) {
    const text = formatFloor(num);
    container.textContent = "";
    for (const char of text) {
      const img = document.createElement("img");
      img.src = digitImages[char];
      img.alt = char;
      img.draggable = false;
      container.appendChild(img);
    }
  }

  function renderFloorDigits(num) {
    renderFloorImageText(dom.floorDigits, num);
  }

  function renderMenuRecords() {
    const data = getActiveData();
    const players = [...data.players].sort((a, b) => b.bestFloor - a.bestFloor);
    dom.menuLeaderboard.textContent = "";
    for (let i = 0; i < RANK_LIMIT; i += 1) {
      const li = document.createElement("li");
      const player = players[i];
      li.textContent = player ? `${player.name || "未命名"}  ${formatFloor(player.bestFloor)}` : "---";
      dom.menuLeaderboard.appendChild(li);
    }

    const best = state.cloudLoaded && state.cloudPersonalBest ? state.cloudPersonalBest : players[0];
    dom.personalBest.textContent = best
      ? `最高：${best.name || "未命名"} ${best.bestTimeLabel || ""} ${formatFloor(best.bestFloor)}`
      : "";
  }

  async function refreshCloudRecords() {
    if (!cloudConfigured()) return;
    try {
      state.cloudEnabled = true;
      const deviceId = getOrCreateDeviceId();
      const leaderboard = await cloudRequest(
        `leaderboard_entries?select=id,player_name,floor,submitted_at&order=floor.desc,submitted_at.asc&limit=${RANK_LIMIT}`,
      );
      const personalBest = await fetchCloudPersonalBest(deviceId);
      state.cloudPlayers = Array.isArray(leaderboard) ? leaderboard.map(mapCloudEntry) : [];
      const best = personalBest;
      state.cloudPersonalBest = best
        ? {
            id: best.player_device_id,
            name: best.player_name || "你",
            bestFloor: Number(best.best_floor || 0),
            bestTimeIso: best.best_played_at || best.last_played_at || "",
            bestTimeLabel: formatCloudTime(best.best_played_at || best.last_played_at),
            playCount: Number(best.play_count || 0),
          }
        : null;
      state.cloudLoaded = true;
      renderMenuRecords();
    } catch (error) {
      console.warn("Supabase records unavailable; using local records.", error);
      state.cloudLoaded = false;
      state.cloudEnabled = false;
      renderMenuRecords();
    }
  }

  async function fetchCloudPersonalBest(deviceId) {
    const encodedDeviceId = encodeURIComponent(deviceId);
    try {
      const players = await cloudRequest(
        `players?select=player_device_id,player_name,best_floor,best_played_at,last_played_at,play_count&player_device_id=eq.${encodedDeviceId}&limit=1`,
      );
      if (Array.isArray(players) && players[0]) return players[0];
    } catch (error) {
      console.warn("Supabase players table unavailable; falling back to player_best_scores.", error);
    }

    try {
      const bestScores = await cloudRequest(
        `player_best_scores?select=player_device_id,player_name,best_floor,last_played_at,play_count&player_device_id=eq.${encodedDeviceId}&limit=1`,
      );
      return Array.isArray(bestScores) ? bestScores[0] || null : null;
    } catch {
      const bestScores = await cloudRequest(
        `player_best_scores?select=player_device_id,best_floor,last_played_at,play_count&player_device_id=eq.${encodedDeviceId}&limit=1`,
      );
      return Array.isArray(bestScores) ? bestScores[0] || null : null;
    }
  }

  async function fetchCloudPlayer(deviceId) {
    const players = await cloudRequest(
      `players?select=player_device_id,player_name,best_floor,best_played_at,first_played_at,last_played_at,play_count&player_device_id=eq.${encodeURIComponent(deviceId)}&limit=1`,
    );
    return Array.isArray(players) ? players[0] || null : null;
  }

  async function upsertCloudPlayer(record, options = {}) {
    if (!cloudConfigured()) return;
    const deviceId = getOrCreateDeviceId();
    const floor = Math.max(0, Math.min(MAX_FLOOR, Number(record.bestFloor || 0)));
    const recordTime = record.bestTimeIso || new Date().toISOString();
    const name = options.name ? options.name.slice(0, 6) : null;
    const countPlay = options.countPlay !== false;
    try {
      const current = await fetchCloudPlayer(deviceId);
      const currentBestFloor = Number(current?.best_floor || 0);
      const nextIsBest = floor >= currentBestFloor;
      const nextPlayCount = Math.max(0, Number(current?.play_count || 0) + (countPlay ? 1 : 0));
      const payload = {
        player_device_id: deviceId,
        player_name: name || current?.player_name || null,
        best_floor: nextIsBest ? floor : currentBestFloor,
        best_played_at: nextIsBest ? recordTime : current?.best_played_at || current?.last_played_at || recordTime,
        play_count: nextPlayCount,
        first_played_at: current?.first_played_at || recordTime,
        last_played_at: countPlay ? recordTime : current?.last_played_at || recordTime,
        updated_at: new Date().toISOString(),
      };
      await cloudRequest("players?on_conflict=player_device_id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.warn("Supabase player summary update failed.", error);
    }
  }

  async function recordCloudAttempt(record) {
    if (!cloudConfigured()) return;
    try {
      await cloudRequest("game_attempts", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          player_device_id: getOrCreateDeviceId(),
          player_name: record.name || null,
          floor: Math.max(0, Math.min(MAX_FLOOR, Number(record.bestFloor || 0))),
          played_at: record.bestTimeIso,
        }),
      });
      await upsertCloudPlayer(record, { countPlay: true });
      await refreshCloudRecords();
    } catch (error) {
      console.warn("Supabase attempt insert failed.", error);
    }
  }

  async function saveCloudLeaderboard(record, name) {
    if (!cloudConfigured()) return;
    try {
      await cloudRequest("leaderboard_entries", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          player_device_id: getOrCreateDeviceId(),
          player_name: name,
          floor: Math.max(0, Math.min(MAX_FLOOR, Number(record.bestFloor || 0))),
          submitted_at: record.bestTimeIso,
        }),
      });
      await upsertCloudPlayer(record, { name, countPlay: false });
      await refreshCloudRecords();
    } catch (error) {
      console.warn("Supabase leaderboard insert failed.", error);
    }
  }

  function setMode(mode) {
    if (mode !== "playing") hideTutorial();
    state.mode = mode;
    for (const screen of [dom.splashScreen, dom.menuScreen, dom.gameScreen, dom.gameOverScreen, dom.adminScreen]) {
      screen.classList.remove("active");
    }
    if (mode === "splash") {
      dom.splashScreen.classList.add("active");
    } else if (mode === "menu") {
      dom.menuScreen.classList.remove("menu-ready");
      dom.menuScreen.classList.add("active");
      renderMenuRecords();
      window.setTimeout(() => {
        if (state.mode === "menu") dom.menuScreen.classList.add("menu-ready");
      }, 2600);
    } else if (mode === "playing" || mode === "paused") {
      dom.gameScreen.classList.add("active");
      dom.pauseOverlay.classList.toggle("show", mode === "paused");
      updatePauseButton();
    } else if (mode === "gameover") {
      dom.gameOverScreen.classList.add("active");
    } else if (mode === "admin") {
      dom.adminScreen.classList.add("active");
      renderAdmin();
    }
  }

  function resizeStage() {
    const rect = dom.viewport.getBoundingClientRect();
    state.scale = rect.width / W;
    dom.stage.style.setProperty("--stage-scale", state.scale);
  }

  function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (img.decode) {
          img.decode().then(resolve).catch(resolve);
        } else {
          resolve();
        }
      };
      img.onerror = resolve;
      img.src = src;
    });
  }

  function preloadRequiredImages() {
    const uniqueImages = [...new Set(preloadImages)];
    let loaded = 0;
    const updateLoadingProgress = () => {
      if (!dom.loadingFill) return;
      const percent = uniqueImages.length ? Math.round((loaded / uniqueImages.length) * 100) : 100;
      dom.loadingFill.style.width = `${percent}%`;
    };
    updateLoadingProgress();
    const imageLoads = Promise.all(
      uniqueImages.map((src) =>
        loadImage(src).then(() => {
          loaded += 1;
          updateLoadingProgress();
        }),
      ),
    );
    const timeout = new Promise((resolve) => window.setTimeout(resolve, 4500));
    return Promise.race([imageLoads, timeout]);
  }

  function hideLoadingOverlay() {
    if (!dom.loadingOverlay) return;
    if (dom.loadingFill) dom.loadingFill.style.width = "100%";
    dom.loadingOverlay.classList.add("hidden");
    window.setTimeout(() => dom.loadingOverlay.remove(), 260);
  }

  function pressImageButton(button) {
    const img = button.querySelector("img");
    if (!img) return;
    const now = performance.now();
    if (now - audioState.lastButtonAt > 120) {
      playSound("button");
      audioState.lastButtonAt = now;
    }
    img.src = img.dataset.pressed || img.src;
    window.setTimeout(() => {
      img.src = img.dataset.normal || img.src;
    }, 140);
  }

  function setupImageButtons() {
    document.querySelectorAll(".image-button").forEach((button) => {
      button.addEventListener("pointerdown", () => pressImageButton(button));
      button.addEventListener("touchstart", () => pressImageButton(button), { passive: true });
    });
  }

  function hideTutorial() {
    state.tutorialActive = false;
    state.tutorialKind = null;
    if (!dom.tutorialOverlay) return;
    dom.tutorialOverlay.classList.remove("show");
    dom.tutorialOverlay.setAttribute("aria-hidden", "true");
  }

  function showTutorial(kind) {
    if (state.mode !== "playing" || state.gameOverPending) return;
    const isCrystalTutorial = kind === "crystal";
    state.tutorialActive = true;
    state.tutorialKind = kind;
    state.inputHeld = false;
    cancelChargeNow();
    dom.tutorialIllustration.src = isCrystalTutorial
      ? path("background/illustrate-02.png")
      : path("background/illustrate-01.png");
    dom.tutorialIllustration.alt = isCrystalTutorial ? "天品水晶球教學" : "遊戲操作教學";
    dom.tutorialIllustration.classList.toggle("tutorial-illustration-basic", !isCrystalTutorial);
    dom.tutorialIllustration.classList.toggle("tutorial-illustration-crystal", isCrystalTutorial);
    dom.tutorialOverlay.classList.add("show");
    dom.tutorialOverlay.setAttribute("aria-hidden", "false");
  }

  function showStartTutorial() {
    if (state.mode !== "playing" || state.tutorialStartShown) return;
    state.tutorialStartShown = true;
    showTutorial("basic");
  }

  function closeTutorial(event) {
    event?.preventDefault();
    event?.stopPropagation();
    if (!state.tutorialActive) return;
    const now = performance.now();
    if (now - state.lastTutorialButtonAt < 180) return;
    state.lastTutorialButtonAt = now;
    hideTutorial();
    state.lastTime = performance.now();
  }

  function startGame() {
    startBgm();
    playSound("start");
    const data = loadData();
    data.totalPlays += 1;
    data.anonymousPlays += 1;
    saveData(data);

    state.cameraY = 0;
    state.floor = 0;
    state.cameraLiftRemainder = 0;
    state.maxWorldClimb = 0;
    state.cameraPushActive = false;
    state.cloudSpawnTimer = 0;
    state.nextCloudSpawnDelay = rand(0.45, 1.25);
    state.charging = false;
    state.inputHeld = false;
    state.chargeMs = 0;
    state.chargeStartedAt = 0;
    state.chargeLevel = 0;
    state.chargeMode = "ground";
    state.doubleJumpCharges = 0;
    state.gameOverPending = false;
    state.gameOverDelay = 0;
    state.pendingRankSaved = false;
    state.finalRecord = null;
    window.clearTimeout(state.tutorialTimeoutId);
    hideTutorial();
    state.tutorialTimeoutId = 0;
    state.nextPlatformId = 1;
    state.generatedPlatformZones = new Set();
    state.crystalFloors = new Set();
    state.platformRegionPatterns = new Map();
    state.platformPlacements = new Map();
    state.wallSideStart = Math.random() < 0.5 ? 0 : 1;
    state.nextPathX = 178;
    state.lastMainPathPlatform = null;
    state.startedAt = performance.now();
    state.hero = {
      x: 130,
      y: GROUND_Y,
      vx: HERO_BASE_SPEED,
      vy: 0,
      dir: -1,
      grounded: true,
      surface: "ground",
      action: "stay",
      frameTime: 0,
      frameIndex: 0,
      jumpGrace: 0,
    };

    dom.platformLayer.textContent = "";
    dom.cloudLayer.textContent = "";
    state.platforms = [];
    state.clouds = [];
    seedPlatforms();
    seedClouds();
    renderFloorDigits(0);
    updatePower(0);
    setMode("playing");
    state.tutorialTimeoutId = window.setTimeout(showStartTutorial, START_TUTORIAL_DELAY_MS);
  }

  function seedPlatforms() {
    state.nextPathX = clamp(state.hero.x + rand(-30, 90), FIELD_LEFT + 22, FIELD_RIGHT - PLATFORM_W - 22);
    state.lastMainPathPlatform = null;
    ensurePlatforms();
  }

  function platformTierForFloor(floor) {
    const f = Math.max(1, Math.min(999, Math.floor(floor)));
    if (f <= 15) return { movingCount: 1, speedMultiplier: 1, amplitudeMultiplier: 1 };
    if (f <= 30) return { movingCount: 2, speedMultiplier: 1, amplitudeMultiplier: 1 };
    if (f <= 45) return { movingCount: 3, speedMultiplier: 1, amplitudeMultiplier: 1 };
    if (f <= 60) return { movingCount: 4, speedMultiplier: 1, amplitudeMultiplier: 1 };
    if (f <= 75) return { movingCount: 2, speedMultiplier: 1.5, amplitudeMultiplier: 1 };
    if (f <= 100) return { movingCount: 3, speedMultiplier: 1.5, amplitudeMultiplier: 1 };
    if (f <= 115) return { movingCount: 4, speedMultiplier: 1.5, amplitudeMultiplier: 1 };
    if (f <= 130) return { movingCount: 2, speedMultiplier: 2, amplitudeMultiplier: 1.5 };
    if (f <= 145) return { movingCount: 3, speedMultiplier: 2, amplitudeMultiplier: 1.5 };
    if (f <= 160) return { movingCount: 4, speedMultiplier: 2, amplitudeMultiplier: 1.5 };
    if (f <= 175) return { movingCount: 2, speedMultiplier: 2, amplitudeMultiplier: 2 };
    if (f <= 200) return { movingCount: 3, speedMultiplier: 2, amplitudeMultiplier: 2 };
    if (f <= 215) return { movingCount: 4, speedMultiplier: 2, amplitudeMultiplier: 2 };
    if (f <= 230) return { movingCount: 2, speedMultiplier: 2.5, amplitudeMultiplier: 2 };
    if (f <= 245) return { movingCount: 3, speedMultiplier: 2.5, amplitudeMultiplier: 2 };
    if (f <= 260) return { movingCount: 4, speedMultiplier: 2.5, amplitudeMultiplier: 2 };
    if (f <= 300) return { movingCount: Infinity, speedMultiplier: 2.5, amplitudeMultiplier: 1.5 };
    return { movingCount: Infinity, speedMultiplier: 2.5, amplitudeMultiplier: 2 };
  }

  function shuffle(values) {
    const result = [...values];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rand(0, i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function regionPatternForGroup(group) {
    if (state.platformRegionPatterns.has(group)) return state.platformRegionPatterns.get(group);
    const wallRegion = (group + state.wallSideStart) % 2 === 0 ? 0 : PLATFORM_REGION_COUNT - 1;
    let candidates = Array.from({ length: PLATFORM_REGION_COUNT }, (_, index) => index).filter((region) => region !== wallRegion);
    if (group === 0) {
      const openingChoices = candidates.filter((region) => region >= 1 && region <= 3);
      const first = openingChoices[Math.floor(rand(0, openingChoices.length))] ?? candidates[0];
      candidates = [first, ...shuffle(candidates.filter((region) => region !== first))];
    } else {
      candidates = shuffle(candidates);
    }
    const oppositeWallRegion = wallRegion === 0 ? PLATFORM_REGION_COUNT - 1 : 0;
    const moveWallRegionAwayFromEdge = (edgeIndex) => {
      if (candidates[edgeIndex] !== oppositeWallRegion) return;
      const swapIndex = candidates.findIndex((region, index) => index !== edgeIndex && !isWallRegion(region));
      if (swapIndex >= 0) [candidates[edgeIndex], candidates[swapIndex]] = [candidates[swapIndex], candidates[edgeIndex]];
    };
    moveWallRegionAwayFromEdge(0);
    moveWallRegionAwayFromEdge(candidates.length - 1);
    const pattern = [...candidates, wallRegion];
    state.platformRegionPatterns.set(group, pattern);
    return pattern;
  }

  function isWallRegion(region) {
    return region === 0 || region === PLATFORM_REGION_COUNT - 1;
  }

  function platformRegionForIndex(index, forceWall) {
    const group = Math.floor(index / PLATFORM_REGION_COUNT);
    const slot = index % PLATFORM_REGION_COUNT;
    const pattern = regionPatternForGroup(group);
    return forceWall ? pattern[PLATFORM_REGION_COUNT - 1] : pattern[slot];
  }

  function platformXForRegion(region, forceWall) {
    const regionWidth = W / PLATFORM_REGION_COUNT;
    const centerX = region * regionWidth + regionWidth / 2 - PLATFORM_W / 2;
    const jitter = forceWall ? rand(0, 7) * (region === 0 ? 1 : -1) : rand(-28, 28);
    return clamp(centerX + jitter, FIELD_LEFT, FIELD_RIGHT - PLATFORM_W);
  }

  function choosePlatformPlacement(index, forceWall) {
    const baseRegion = platformRegionForIndex(index, forceWall);
    const allRegions = Array.from({ length: PLATFORM_REGION_COUNT }, (_, region) => region);
    const nonWallRegions = allRegions.filter((region) => !isWallRegion(region));
    const regions = forceWall
      ? [baseRegion, ...shuffle(allRegions.filter((region) => isWallRegion(region) && region !== baseRegion))]
      : [
          ...(isWallRegion(baseRegion) ? [] : [baseRegion]),
          ...shuffle(nonWallRegions.filter((region) => region !== baseRegion)),
        ];
    const previous = state.platformPlacements.get(index - 1);
    const beforePrevious = state.platformPlacements.get(index - 2);
    let best = null;
    let bestPenalty = Number.POSITIVE_INFINITY;

    for (const region of regions) {
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const x = platformXForRegion(region, forceWall);
        const isWall = isWallRegion(region);
        const tooCloseToPrevious = previous && Math.abs(x - previous.x) < PLATFORM_MIN_X_DELTA;
        const repeatsWall = previous && previous.isWall && isWall;
        const repeatsStep = previous && beforePrevious && Math.abs(Math.abs(x - previous.x) - Math.abs(previous.x - beforePrevious.x)) < 22;
        const predictedCurveX = previous && beforePrevious ? previous.x + (previous.x - beforePrevious.x) : null;
        const followsCurve = predictedCurveX !== null && Math.abs(x - predictedCurveX) < 54;
        const candidate = { x, region, isWall };
        const penalty = (repeatsWall ? 1000 : 0) + (tooCloseToPrevious ? 120 : 0) + (followsCurve ? 85 : 0) + (repeatsStep ? 35 : 0) + (isWall && !forceWall ? 12 : 0);
        if (penalty < bestPenalty) {
          best = candidate;
          bestPenalty = penalty;
        }
        if (!tooCloseToPrevious && !repeatsWall && !repeatsStep && !followsCurve) return candidate;
      }
    }

    return best;
  }

  function platformYForIndex(index) {
    if (index === 0) return FIRST_PLATFORM_Y;
    const jitter = rand(-PLATFORM_Y_JITTER, PLATFORM_Y_JITTER);
    return FIRST_PLATFORM_Y - index * PLATFORM_STEP_Y + jitter;
  }

  function chooseBranchPlacement(index, mainPlacement, mainY) {
    if (index < 2) return null;
    if (!BRANCH_PLATFORM_SLOTS.includes(index % PLATFORM_SCREEN_GROUP)) return null;

    const allRegions = Array.from({ length: PLATFORM_REGION_COUNT }, (_, region) => region);
    const middleRegions = shuffle(allRegions.filter((region) => !isWallRegion(region)));
    const wallRegions = shuffle(allRegions.filter((region) => isWallRegion(region)));
    const regions = Math.random() < BRANCH_WALL_CHANCE
      ? [...wallRegions, ...middleRegions]
      : [...middleRegions, ...wallRegions];
    let best = null;
    let bestDistance = 0;

    for (const region of regions) {
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const x = platformXForRegion(region, isWallRegion(region));
        const distance = Math.abs(x - mainPlacement.x);
        const branch = {
          x,
          y: mainY + rand(-10, 10),
          region,
          isWall: isWallRegion(region),
        };
        if (distance > bestDistance) {
          best = branch;
          bestDistance = distance;
        }
        if (distance >= BRANCH_PLATFORM_MIN_X_DELTA) return branch;
      }
    }

    return bestDistance >= 96 ? best : null;
  }

  function isMovingPlatform(index, tier) {
    if (!Number.isFinite(tier.movingCount)) return true;
    const screenSlot = index % PLATFORM_SCREEN_GROUP;
    return MOVING_PLATFORM_SLOTS.slice(0, tier.movingCount).includes(screenSlot);
  }

  function movingAxisForIndex(index, tier) {
    if (!Number.isFinite(tier.movingCount)) return MOVING_AXIS_PATTERN[index % MOVING_AXIS_PATTERN.length];
    const screenSlot = index % PLATFORM_SCREEN_GROUP;
    const group = Math.floor(index / PLATFORM_SCREEN_GROUP);
    const activeSlots = MOVING_PLATFORM_SLOTS.slice(0, tier.movingCount);
    const orderInGroup = Math.max(0, activeSlots.indexOf(screenSlot));
    const movingOrder = group * tier.movingCount + orderInGroup;
    return MOVING_AXIS_PATTERN[movingOrder % MOVING_AXIS_PATTERN.length];
  }

  function oppositeAxis(axis) {
    return axis === "x" ? "y" : "x";
  }

  function shouldUseDropPlatform(floor, moving, pathKind = "main") {
    if (floor < DROP_PLATFORM_START_FLOOR || moving) return false;
    return Math.random() < dropPlatformChanceForFloor(floor);
  }

  function dropPlatformChanceForFloor(floor) {
    if (floor >= 910) return 1;
    if (floor >= 900) return 0.9;
    if (floor >= 800) return 0.85;
    if (floor >= 700) return 0.6;
    if (floor >= 600) return 0.6;
    if (floor >= 500) return 0.5;
    if (floor >= 300) return 0.5;
    if (floor >= 200) return 0.4;
    if (floor >= 100) return 0.4;
    if (floor >= 90) return 0.3;
    if (floor >= 80) return 0.3;
    if (floor >= 70) return 0.2;
    if (floor >= 60) return 0.2;
    if (floor >= 50) return 0.2;
    if (floor >= 40) return 0.15;
    if (floor >= 30) return 0.15;
    if (floor >= 20) return 0.15;
    if (floor >= DROP_PLATFORM_START_FLOOR) return 0.1;
    return 0;
  }

  function createPlatformZone(index) {
    if (state.generatedPlatformZones.has(index)) return;
    const floorForPlatform = Math.max(1, Math.floor(index / PLATFORM_AUX_DIVISIONS) + 1);
    const tier = platformTierForFloor(floorForPlatform);
    const y = platformYForIndex(index);
    const forceWall = index % 5 === 4;
    const zeroFloorCrystalCandidate = CRYSTAL_INCLUDE_FLOOR_ZERO && index === 0 && !state.crystalFloors.has(0);
    const crystalCandidate =
      zeroFloorCrystalCandidate ||
      floorForPlatform >= CRYSTAL_FIRST_FLOOR &&
      floorForPlatform % CRYSTAL_FLOOR_INTERVAL === 0 &&
      index % PLATFORM_AUX_DIVISIONS === 0 &&
      !state.crystalFloors.has(floorForPlatform);
    const moving = crystalCandidate ? false : isMovingPlatform(index, tier);
    const axis = moving ? movingAxisForIndex(index, tier) : "x";
    const amplitude = moving ? PLATFORM_W * rand(0.4, 0.82) * tier.amplitudeMultiplier : 0;
    const speed = rand(0.52, 0.88) * tier.speedMultiplier * MOVING_PLATFORM_SPEED_BOOST;
    const placement = choosePlatformPlacement(index, forceWall);
    const x = placement.x;
    const platformType = crystalCandidate
      ? "normal"
      : shouldUseDropPlatform(floorForPlatform, moving, forceWall ? "wall" : "main")
        ? "drop"
        : "normal";

    const platform = createPlatform(y, x, {
      moving,
      type: platformType,
      axis,
      speed,
      amplitude,
      phase: rand(0, Math.PI * 2),
      startDelay: rand(0, 0.7),
      zoneIndex: index,
      pathKind: forceWall ? "wall" : "main",
    });
    if (crystalCandidate) attachCrystalToPlatform(platform, zeroFloorCrystalCandidate ? 0 : floorForPlatform);
    state.lastMainPathPlatform = { x, y };
    state.generatedPlatformZones.add(index);
    state.platformPlacements.set(index, { x, y, region: placement.region, isWall: placement.isWall });

    const branchPlacement = chooseBranchPlacement(index, placement, y);
    if (branchPlacement) {
      const branchMoving = moving && index % 2 === 0;
      const branchType = shouldUseDropPlatform(floorForPlatform, branchMoving, "branch") ? "drop" : "normal";
      createPlatform(branchPlacement.y, branchPlacement.x, {
        moving: branchMoving,
        type: branchType,
        axis: branchMoving ? oppositeAxis(axis) : "x",
        speed: branchMoving ? speed * rand(0.82, 1.08) : 0,
        amplitude: branchMoving ? amplitude * rand(0.55, 0.78) : 0,
        phase: rand(0, Math.PI * 2),
        startDelay: rand(0.15, 0.8),
        zoneIndex: `${index}-branch`,
        pathKind: "branch",
      });
    }
  }

  function createPlatform(y, fixedX = null, options = {}) {
    const moving = typeof options.moving === "boolean" ? options.moving : Math.random() < 0.22;
    const type = options.type === "drop" && !moving ? "drop" : moving ? "moving" : "normal";
    const x = fixedX ?? rand(FIELD_LEFT + 20, FIELD_RIGHT - PLATFORM_W - 20);
    const img = document.createElement("img");
    img.className = "platform";
    img.src = type === "drop"
      ? path("background/platform_03.png")
      : moving
        ? path("background/platform_02.png")
        : path("background/platform_01.png");
    img.alt = "";
    img.draggable = false;
    dom.platformLayer.appendChild(img);
    const platform = {
      id: state.nextPlatformId++,
      el: img,
      x,
      prevX: x,
      baseX: x,
      y,
      prevY: y,
      baseY: y,
      width: PLATFORM_W,
      height: PLATFORM_H,
      type,
      moving,
      axis: options.axis || (Math.random() < 0.5 ? "x" : "y"),
      phase: options.phase ?? rand(0, Math.PI * 2),
      speed: options.speed ?? rand(0.55, 0.95),
      amplitude: moving ? options.amplitude ?? PLATFORM_W * rand(0.35, 1) : 0,
      startDelay: options.startDelay || 0,
      zoneIndex: options.zoneIndex ?? null,
      pathKind: options.pathKind || "aux",
      landed: false,
      dropTriggered: false,
      dropTimer: 0,
      dropVy: 0,
      dropFalling: false,
      crystalEl: null,
      crystalFloor: null,
      crystalCollected: false,
      crystalFloatY: 0,
    };
    state.platforms.push(platform);
    return platform;
  }

  function attachCrystalToPlatform(platform, floor) {
    const img = document.createElement("img");
    img.className = "crystal-ball";
    img.src = crystalFrames[0];
    img.alt = "";
    img.draggable = false;
    dom.platformLayer.appendChild(img);
    platform.crystalEl = img;
    platform.crystalFloor = floor;
    platform.crystalCollected = false;
    state.crystalFloors.add(floor);
  }

  function ensurePlatforms() {
    const topWorldY = state.cameraY - 220;
    const bottomWorldY = state.cameraY + H + 120;
    const firstIndex = Math.max(0, Math.floor((FIRST_PLATFORM_Y - bottomWorldY) / PLATFORM_STEP_Y) - 1);
    const lastIndex = Math.max(firstIndex, Math.ceil((FIRST_PLATFORM_Y - topWorldY) / PLATFORM_STEP_Y) + 1);

    for (let index = firstIndex; index <= lastIndex; index += 1) {
      createPlatformZone(index);
    }

    state.platforms = state.platforms.filter((platform) => {
      const screenY = platform.y - state.cameraY;
      if (screenY > H + 80) {
        platform.el.remove();
        platform.crystalEl?.remove();
        return false;
      }
      return true;
    });

    state.generatedPlatformZones.forEach((index) => {
      if (index < firstIndex - 2) state.generatedPlatformZones.delete(index);
    });
    state.platformPlacements.forEach((_, index) => {
      if (index < firstIndex - 2) state.platformPlacements.delete(index);
    });
  }

  function seedClouds() {
    for (let i = 0; i < 9; i += 1) {
      createCloud(rand(-10, 260), rand(90, 620));
    }
  }

  function createCloud(x, y, options = {}) {
    const id = options.id || Math.floor(rand(1, 6));
    const img = document.createElement("img");
    img.className = "cloud";
    img.src = path(`cloud/cloud_0${id}.png`);
    img.alt = "";
    img.draggable = false;
    const width = options.width || rand(90, 185);
    img.style.width = `${width}px`;
    img.style.animationDelay = `${options.animationDelay ?? rand(-3, 0)}s`;
    dom.cloudLayer.appendChild(img);
    state.clouds.push({
      el: img,
      x,
      y,
      drift: options.drift ?? rand(-4, 4),
      width,
      speed: options.speed ?? rand(0.08, 0.22),
      age: 0,
      ttl: options.ttl ?? rand(8, 16),
    });
  }

  function ensureClouds(dt) {
    state.clouds = state.clouds.filter((cloud) => {
      cloud.age += dt;
      const screenY = cloud.y - state.cameraY;
      if (screenY > H + 120 || cloud.age > cloud.ttl) {
        cloud.el.remove();
        return false;
      }
      return true;
    });

    state.cloudSpawnTimer += dt;
    if (state.cloudSpawnTimer >= state.nextCloudSpawnDelay && state.clouds.length < MAX_CLOUDS) {
      state.cloudSpawnTimer = 0;
      state.nextCloudSpawnDelay = rand(0.55, 1.45);
      const spawnAbove = Math.random() < 0.7;
      const spawnY = spawnAbove ? state.cameraY - rand(70, 260) : state.cameraY + rand(70, H - 120);
      createCloud(rand(-35, 280), spawnY);
    }

    while (state.clouds.length < MIN_CLOUDS) {
      createCloud(rand(-20, 260), state.cameraY - rand(90, 520), { ttl: rand(10, 18) });
    }
  }

  function updatePower(level) {
    state.chargeLevel = level;
    dom.powerMeter.src = powerImages[level] || powerImages[0];
    dom.powerMeter.alt = `集氣 ${level}`;
  }

  function beginCharge() {
    if (state.mode !== "playing") return;
    if (state.tutorialActive) return;
    if (state.gameOverPending) return;
    const airCharge = !state.hero.grounded && state.doubleJumpCharges > 0;
    if (!airCharge && !ensureChargeSupport()) return;
    if (state.charging) return;
    state.charging = true;
    state.chargeMs = 0;
    state.chargeStartedAt = performance.now();
    state.chargeMode = airCharge ? "air" : "ground";
    state.hero.action = "charge";
    state.hero.frameIndex = 0;
    state.hero.frameTime = 0;
    updatePower(0);
    playSound("power");
    dom.hero.src = chargeFrames()[0];
    renderGameObjects();
  }

  function chargeFrames() {
    return state.doubleJumpCharges > 0 ? roleFrames.chargeCrystal : roleFrames.charge;
  }

  function currentChargeLevel() {
    if (!state.charging) return 0;
    const elapsed = Math.max(0, performance.now() - state.chargeStartedAt);
    const cycle = elapsed % 1000;
    const level = Math.floor((cycle / 1000) * 11);
    return clamp(elapsed >= 1000 && level === 0 ? 1 : level, 0, 10);
  }

  function collectCrystal(platform) {
    if (!platform.crystalEl || platform.crystalCollected) return;
    platform.crystalCollected = true;
    platform.crystalEl.remove();
    platform.crystalEl = null;
    state.doubleJumpCharges += DOUBLE_JUMP_GRANT;
    playSound("crystal");
    if (!state.tutorialCrystalShown) {
      state.tutorialCrystalShown = true;
      window.setTimeout(() => showTutorial("crystal"), 120);
    }
  }

  function updateCrystals(elapsed) {
    const frame = crystalFrames[Math.floor(elapsed * CRYSTAL_BLINK_SPEED) % crystalFrames.length];
    const heroLeft = state.hero.x + HERO_W * 0.24;
    const heroRight = state.hero.x + HERO_W * 0.76;
    const heroTop = state.hero.y - HERO_H * 0.78;
    const heroBottom = state.hero.y - HERO_H * 0.12;

    state.platforms.forEach((platform) => {
      if (!platform.crystalEl || platform.crystalCollected) return;
      platform.crystalEl.src = frame;
      platform.crystalFloatY = Math.sin(elapsed * CRYSTAL_FLOAT_SPEED + platform.id * 0.72) * CRYSTAL_FLOAT_AMOUNT;
      const crystalX = platform.x + platform.width / 2 - CRYSTAL_W / 2;
      const crystalY = platform.y - CRYSTAL_H - 8 + platform.crystalFloatY;
      const overlaps =
        heroRight >= crystalX &&
        heroLeft <= crystalX + CRYSTAL_W &&
        heroBottom >= crystalY &&
        heroTop <= crystalY + CRYSTAL_H;
      if (overlaps) collectCrystal(platform);
    });
  }

  function releaseCharge() {
    if (!state.charging || state.mode !== "playing") return;
    const level = currentChargeLevel();
    const isAirCharge = state.chargeMode === "air";
    cancelChargeNow();
    if (level <= 0) {
      state.hero.action = state.hero.grounded ? "stay" : "jump";
      return;
    }

    if (isAirCharge) state.doubleJumpCharges = Math.max(0, state.doubleJumpCharges - 1);

    const desiredHeight = (H / 2) * (level / 10);
    state.cameraPushActive = false;
    state.hero.vy = -Math.sqrt(2 * 900 * desiredHeight);
    state.hero.y -= 1;
    state.hero.grounded = false;
    state.hero.surface = null;
    state.hero.action = "jump";
    state.hero.frameIndex = 0;
    state.hero.frameTime = 0;
    state.hero.jumpGrace = 0.08;
    updatePower(level);
    playSound("jump");
    dom.hero.src = roleFrames.jump[0];
    renderGameObjects();
  }

  function updateHeroFrame(dt) {
    const action = state.hero.action;
    const frames = action === "charge" ? chargeFrames() : roleFrames[action] || roleFrames.stay;
    const frameDuration = action === "charge" ? 0.065 : 0.16;
    state.hero.frameTime += dt;
    if (state.hero.frameTime >= frameDuration) {
      state.hero.frameTime = 0;
      if (action === "jump") {
        state.hero.frameIndex = Math.min(state.hero.frameIndex + 1, frames.length - 1);
      } else {
        state.hero.frameIndex = (state.hero.frameIndex + 1) % frames.length;
      }
    }
    dom.hero.src = frames[state.hero.frameIndex % frames.length];
  }

  function updatePauseButton() {
    const img = dom.pauseButton.querySelector("img");
    const paused = state.mode === "paused";
    img.src = paused ? img.dataset.pressed : img.dataset.normal;
    dom.pauseButton.setAttribute("aria-label", paused ? "繼續遊戲" : "暫停遊戲");
  }

  function togglePause() {
    if (state.tutorialActive) return;
    if (state.mode === "playing") {
      state.inputHeld = false;
      state.charging = false;
      updatePower(0);
      setMode("paused");
    } else if (state.mode === "paused") {
      setMode("playing");
      state.lastTime = performance.now();
    }
  }

  function togglePauseFromButton(event) {
    event?.preventDefault();
    event?.stopPropagation();
    const now = performance.now();
    if (now - state.lastPauseButtonToggleAt < 180) return;
    state.lastPauseButtonToggleAt = now;
    state.inputHeld = false;
    releaseCharge();
    togglePause();
  }

  function updateGame(dt, elapsed) {
    if (state.mode !== "playing") return;
    if (state.tutorialActive) return;

    if (state.gameOverPending) {
      state.gameOverDelay += dt;
      if (state.gameOverDelay >= 0.7) endGame();
      return;
    }

    if (state.charging) {
      syncChargeMeter();
    }

    const hero = state.hero;
    const prevBottom = hero.y;
    const horizontalMultiplier = hero.grounded ? 1 : HERO_JUMP_DISTANCE_MULTIPLIER;
    hero.x += hero.vx * dt * horizontalMultiplier;
    const leftThirdX = heroLeftThirdX();
    const rightThirdX = heroRightThirdX();
    if (leftThirdX <= FIELD_LEFT) {
      hero.x = FIELD_LEFT - HERO_LEFT_THIRD_X;
      hero.vx = Math.abs(hero.vx);
    } else if (rightThirdX >= FIELD_RIGHT) {
      hero.x = FIELD_RIGHT - HERO_RIGHT_THIRD_X;
      hero.vx = -Math.abs(hero.vx);
    }
    hero.dir = hero.vx >= 0 ? 1 : -1;

    updateMovingPlatforms(dt, elapsed);
    updateGroundSupport();

    if (!hero.grounded) {
      hero.jumpGrace = Math.max(0, (hero.jumpGrace || 0) - dt);
      hero.vy += 900 * dt;
      hero.y += hero.vy * dt;
    }

    handleCollisions(prevBottom);
    updateCamera();
    ensurePlatforms();
    ensureClouds(dt);
    updateCrystals(elapsed);
    updateHeroFrame(dt);
    renderGameObjects();
    checkGameOver();
  }

  function updateMovingPlatforms(dt, elapsed) {
    state.platforms.forEach((platform) => {
      platform.prevX = platform.x;
      platform.prevY = platform.y;

      if (platform.type === "drop" && platform.dropTriggered) {
        platform.dropTimer += dt;
        if (platform.dropTimer >= DROP_PLATFORM_SHAKE_DELAY) {
          if (!platform.dropFalling) {
            platform.dropFalling = true;
            playSound("fallPlatform");
          }
          const fallTime = platform.dropTimer - DROP_PLATFORM_SHAKE_DELAY;
          platform.dropVy += DROP_PLATFORM_FALL_GRAVITY * dt;
          platform.y += platform.dropVy * dt;
          platform.x = platform.baseX + Math.sin(fallTime * 42) * 3;
          return;
        }
        platform.x = platform.baseX;
        platform.y = platform.baseY;
        return;
      }

      if (platform.moving) {
        const moveElapsed = Math.max(0, elapsed - platform.startDelay);
        const offset = Math.sin(moveElapsed * platform.speed + platform.phase) * platform.amplitude;
        if (platform.axis === "x") {
          platform.x = clamp(platform.baseX + offset, -platform.width * 0.65, W - platform.width * 0.35);
          platform.y = platform.baseY;
      } else {
        platform.x = platform.baseX;
        platform.y = platform.baseY + clamp(offset * 0.55 * VERTICAL_PLATFORM_AMPLITUDE_BOOST, -144, 144);
      }
      }
    });
  }

  function platformSupportsHero(platform) {
    const bodyLeft = heroLeftThirdX();
    const bodyRight = heroRightThirdX();
    return bodyRight >= platform.x + PLATFORM_SUPPORT_INSET && bodyLeft <= platform.x + platform.width - PLATFORM_SUPPORT_INSET;
  }

  function platformAllowsCharge(platform) {
    const bodyLeft = heroLeftThirdX();
    const bodyRight = heroRightThirdX();
    return bodyRight >= platform.x - 16 + PLATFORM_CHARGE_INSET && bodyLeft <= platform.x + platform.width + 16 - PLATFORM_CHARGE_INSET;
  }

  function findSupportUnderFoot(tolerance = 6, mode = "stand") {
    const hero = state.hero;
    const groundVisible = supportInView(GROUND_Y);
    if (groundVisible && Math.abs(hero.y - GROUND_Y) <= tolerance) {
      return { type: "ground", y: GROUND_Y };
    }

    const platform = state.platforms.find((item) => {
      if (!supportInView(item.y)) return false;
      const matchesY = Math.abs(hero.y - item.y) <= tolerance;
      const matchesX = mode === "charge" ? platformAllowsCharge(item) : platformSupportsHero(item);
      return matchesY && matchesX;
    });
    return platform ? { type: "platform", platform, y: platform.y } : null;
  }

  function cancelChargeNow() {
    if (!state.charging) return;
    state.charging = false;
    state.chargeMs = 0;
    state.chargeStartedAt = 0;
    state.chargeMode = "ground";
    updatePower(0);
  }

  function resetChargeMeter() {
    state.charging = false;
    state.chargeMs = 0;
    state.chargeStartedAt = 0;
    state.chargeMode = "ground";
    updatePower(0);
  }

  function resumeChargeIfInputHeld() {
    if (!state.inputHeld || state.mode !== "playing" || state.charging) return;
    beginCharge();
  }

  function syncChargeMeter() {
    if (!state.charging) return;
    state.chargeMs = Math.max(0, performance.now() - state.chargeStartedAt);
    updatePower(currentChargeLevel());
  }

  function applySupport(support) {
    const hero = state.hero;
    hero.y = support.y;
    hero.vy = 0;
    hero.grounded = true;
    hero.surface = support.type === "ground" ? "ground" : support.platform.id;
  }

  function ensureChargeSupport() {
    const hero = state.hero;
    if (hero.grounded && hero.surface === "ground") return true;

    if (hero.grounded && hero.surface !== null) {
      const platform = state.platforms.find((item) => item.id === hero.surface);
      if (platform && Math.abs(hero.y - platform.y) <= 28 && platformAllowsCharge(platform)) {
        applySupport({ type: "platform", platform, y: platform.y });
        return true;
      }
    }

    const support = findSupportUnderFoot(28, "charge");
    if (!support) return false;
    applySupport(support);
    return true;
  }

  function updateGroundSupport() {
    const hero = state.hero;
    if (!hero.grounded) return;

    if (hero.surface === "ground") {
      if (!supportInView(GROUND_Y)) {
        cancelChargeNow();
        hero.grounded = false;
        hero.surface = null;
        hero.vy = Math.max(hero.vy, 0);
        hero.action = "jump";
        hero.frameIndex = 2;
        hero.frameTime = 0;
        return;
      }
      hero.y = GROUND_Y;
      return;
    }

    const platform = state.platforms.find((item) => item.id === hero.surface);
    const supported = platform && supportInView(platform.y) && (state.charging ? platformAllowsCharge(platform) : platformSupportsHero(platform));
    if (!supported) {
      cancelChargeNow();
      hero.grounded = false;
      hero.surface = null;
      hero.vy = Math.max(hero.vy, 0);
      hero.action = "jump";
      hero.frameIndex = 2;
      hero.frameTime = 0;
      return;
    }

    const previousY = hero.y;
    hero.x += platform.x - platform.prevX;

    if (platform.type === "drop" && platform.dropFalling && platform.y > previousY) {
      const caughtPlatform = findPlatformCrossedByFallingSupport(platform, previousY, platform.y);
      if (caughtPlatform) {
        landOn(caughtPlatform);
        return;
      }
    }

    hero.y = platform.y;
  }

  function findPlatformCrossedByFallingSupport(currentPlatform, fromY, toY) {
    return state.platforms
      .filter((platform) => {
        if (platform.id === currentPlatform.id) return false;
        if (!supportInView(platform.y)) return false;
        if (platform.dropFalling) return false;
        if (platform.y <= fromY + 2 || platform.y > toY + 8) return false;
        return platformSupportsHero(platform);
      })
      .sort((a, b) => a.y - b.y)[0] || null;
  }

  function handleCollisions(prevBottom) {
    const hero = state.hero;
    const falling = hero.vy >= 0;

    if (!hero.grounded && falling) {
      for (const platform of state.platforms) {
        if (!supportInView(platform.y)) continue;
        const platformTop = platform.y;
        const overlapsX = platformSupportsHero(platform);
        const crossesTop = prevBottom <= platformTop + 8 && hero.y >= platformTop;
        if (overlapsX && crossesTop) {
          landOn(platform);
          return;
        }
      }
    }

    const groundVisible = supportInView(GROUND_Y);
    if (!hero.grounded && falling && groundVisible && (hero.jumpGrace || 0) <= 0 && prevBottom <= GROUND_Y && hero.y >= GROUND_Y) {
      hero.y = GROUND_Y;
      hero.vy = 0;
      hero.grounded = true;
      hero.surface = "ground";
      hero.action = state.charging ? "charge" : "stay";
      resetChargeMeter();
      resumeChargeIfInputHeld();
      playSound("landing");
    }
  }

  function landOn(platform) {
    const hero = state.hero;
    hero.y = platform.y;
    hero.vy = 0;
    hero.grounded = true;
    hero.surface = platform.id;
    hero.action = "stay";
    resetChargeMeter();
    resumeChargeIfInputHeld();
    playSound("landing");

    if (!platform.landed && platform.y < GROUND_Y - 26) platform.landed = true;
    if (platform.type === "drop" && !platform.dropTriggered) {
      platform.dropTriggered = true;
      platform.dropTimer = 0;
      platform.dropVy = 0;
    }
  }

  function updateCamera() {
    const heroScreenY = state.hero.y - state.cameraY;
    if (heroScreenY < H * 0.48) {
      const target = state.hero.y - H * 0.48;
      const previousCameraY = state.cameraY;
      state.cameraY += (target - state.cameraY) * 0.16;
      const cameraLift = Math.max(0, previousCameraY - state.cameraY);
      if (cameraLift > 0) {
        state.cameraLiftRemainder += cameraLift;
        while (state.cameraLiftRemainder >= PLATFORM_REQUIRED_STEP_Y) {
          state.cameraLiftRemainder -= PLATFORM_REQUIRED_STEP_Y;
          state.floor = Math.min(MAX_FLOOR, state.floor + 1);
          if (state.floor >= MAX_FLOOR) {
            state.cameraLiftRemainder = 0;
            break;
          }
        }
        renderFloorDigits(state.floor);
      }
    } else {
      state.cameraPushActive = false;
    }
    state.maxWorldClimb = Math.max(state.maxWorldClimb, GROUND_Y - state.hero.y);
  }

  function renderGameObjects() {
    const groundScreenY = GROUND_LAYER_Y - state.cameraY;
    dom.groundLayer.style.transform = `translate3d(0, ${groundScreenY}px, 0)`;
    dom.foregroundLayer.style.transform = `translate3d(0, ${FOREGROUND_LAYER_Y - state.cameraY * 0.35}px, 0)`;

    state.platforms.forEach((platform) => {
      const screenY = platform.y - state.cameraY;
      platform.el.style.transform = `translate3d(${platform.x}px, ${screenY}px, 0)`;
      if (platform.crystalEl && !platform.crystalCollected) {
        const crystalX = platform.x + platform.width / 2 - CRYSTAL_W / 2;
        const crystalY = screenY - CRYSTAL_H - 8 + (platform.crystalFloatY || 0);
        platform.crystalEl.style.transform = `translate3d(${crystalX}px, ${crystalY}px, 0)`;
      }
    });

    state.clouds.forEach((cloud) => {
      cloud.x += cloud.speed * (state.hero.dir || 1) * 0.08;
      cloud.el.style.transform = `translate3d(${cloud.x + cloud.drift}px, ${cloud.y - state.cameraY}px, 0)`;
    });

    const heroScreenY = state.hero.y - state.cameraY - HERO_H;
    const flip = state.hero.dir > 0 ? " scaleX(-1)" : " scaleX(1)";
    dom.hero.style.transform = `translate3d(${state.hero.x}px, ${heroScreenY}px, 0)${flip}`;
  }

  function checkGameOver() {
    if (!state.gameOverPending && state.floor >= MAX_FLOOR) {
      state.inputHeld = false;
      state.charging = false;
      updatePower(0);
      endGame();
      return;
    }

    const heroBottom = state.hero.y - state.cameraY;
    const groundGone = GROUND_Y - state.cameraY > H + 4;
    if (!state.gameOverPending && groundGone && heroBottom > H + 35) {
      state.inputHeld = false;
      state.charging = false;
      playSound("fallHero");
      state.gameOverPending = true;
      state.gameOverDelay = 0;
    }
  }

  function updateGameOverHero(dt) {
    if (state.mode !== "gameover") return;
    const overHero = state.overHero;
    overHero.x += overHero.dir * 24 * dt;
    if (overHero.x <= 118) {
      overHero.x = 118;
      overHero.dir = 1;
    } else if (overHero.x >= 174) {
      overHero.x = 174;
      overHero.dir = -1;
    }

    overHero.frameTime += dt;
    if (overHero.frameTime >= 0.42) {
      overHero.frameTime = 0;
      overHero.frameIndex = (overHero.frameIndex + 1) % roleFrames.stay.length;
    }
    dom.overHero.src = roleFrames.stay[overHero.frameIndex];
    const flip = overHero.dir > 0 ? " scaleX(-1)" : " scaleX(1)";
    dom.overHero.style.transform = `translate3d(${overHero.x - 145}px, 0, 0)${flip}`;
  }

  function endGame() {
    window.clearTimeout(state.tutorialTimeoutId);
    hideTutorial();
    state.inputHeld = false;
    state.charging = false;
    state.gameOverPending = false;
    state.gameOverDelay = 0;
    const stamp = nowStamp();
    const finalFloor = state.floor;
    state.floor = finalFloor;
    state.finalRecord = {
      id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: "",
      bestFloor: finalFloor,
      bestTimeIso: stamp.iso,
      bestTimeLabel: stamp.label,
      playCount: 1,
    };
    recordCloudAttempt(state.finalRecord);
    state.overHero = {
      x: 145,
      dir: 1,
      frameTime: 0,
      frameIndex: 0,
    };

    const best = bestPlayer();
    renderFloorImageText(dom.finalFloorText, finalFloor);
    renderFloorImageText(dom.finalBestText, Math.max(finalFloor, best?.bestFloor || 0));
    renderFloorImageText(dom.rankRecordText, finalFloor);
    dom.playerNameInput.value = "";
    const ranked = isTopFive(finalFloor);
    dom.rankDialog.classList.toggle("hidden", !ranked);
    dom.normalResultDialog.classList.toggle("hidden", ranked);
    playSound("gameover");
    if (ranked) {
      window.setTimeout(() => {
        try {
          dom.playerNameInput.focus({ preventScroll: true });
        } catch (error) {
          dom.playerNameInput.focus();
        }
      }, 80);
      window.setTimeout(() => playSound("leaderboard"), 420);
    } else {
      dom.playerNameInput.blur();
    }
    setMode("gameover");
  }

  function saveRankFromDialog() {
    if (!state.finalRecord || state.pendingRankSaved) return;
    const name = dom.playerNameInput.value.trim().slice(0, 6);
    if (!name) {
      abandonRankEntry();
      return;
    }

    const data = loadData();
    const existing = data.players.find((p) => p.name === name);
    if (existing) {
      existing.playCount = (existing.playCount || 0) + 1;
      if (state.finalRecord.bestFloor >= existing.bestFloor) {
        existing.bestFloor = state.finalRecord.bestFloor;
        existing.bestTimeIso = state.finalRecord.bestTimeIso;
        existing.bestTimeLabel = state.finalRecord.bestTimeLabel;
      }
    } else {
      data.players.push({
        ...state.finalRecord,
        name,
      });
    }
    if (data.anonymousPlays > 0) data.anonymousPlays -= 1;
    saveData(data);
    saveCloudLeaderboard(state.finalRecord, name);
    state.pendingRankSaved = true;
    dom.rankDialog.classList.add("hidden");
  }

  function abandonRankEntry() {
    if (!state.finalRecord || state.pendingRankSaved) return;
    state.pendingRankSaved = true;
    dom.playerNameInput.value = "";
    dom.playerNameInput.blur();
    dom.rankDialog.classList.add("hidden");
  }

  function renderAdmin() {
    const data = loadData();
    dom.adminSummary.textContent = `總遊玩次數 ${data.totalPlays || 0} 次，已留名玩家 ${data.players.length} 人，未留名遊玩 ${data.anonymousPlays || 0} 次`;
    dom.adminRows.textContent = "";
    const players = [...data.players].sort((a, b) => b.bestFloor - a.bestFloor);
    players.forEach((player) => addAdminRow(player));
  }

  function addAdminRow(player = {}) {
    const row = document.createElement("div");
    row.className = "admin-row";
    row.innerHTML = `
      <div class="admin-fields">
        <input class="admin-name" maxlength="6" placeholder="姓名" value="${escapeAttr(player.name || "")}" />
        <input class="admin-floor" type="number" min="0" step="1" placeholder="樓層" value="${Number(player.bestFloor || 0)}" />
        <input class="admin-time" placeholder="YYYY/MM/DD HH:mm" value="${escapeAttr(player.bestTimeLabel || nowStamp().label)}" />
        <input class="admin-plays" type="number" min="1" step="1" placeholder="次數" value="${Number(player.playCount || 1)}" />
      </div>
      <button type="button" class="admin-delete">刪除</button>
    `;
    row.querySelector(".admin-delete").addEventListener("click", () => row.remove());
    dom.adminRows.appendChild(row);
  }

  function escapeAttr(value) {
    return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
  }

  function saveAdminRows() {
    const data = loadData();
    const players = [];
    dom.adminRows.querySelectorAll(".admin-row").forEach((row, index) => {
      const name = row.querySelector(".admin-name").value.trim().slice(0, 6) || `玩家${index + 1}`;
      const bestFloor = Math.max(0, Number.parseInt(row.querySelector(".admin-floor").value, 10) || 0);
      const bestTimeLabel = row.querySelector(".admin-time").value.trim() || nowStamp().label;
      const playCount = Math.max(1, Number.parseInt(row.querySelector(".admin-plays").value, 10) || 1);
      players.push({
        id: `admin_${index}_${name}`,
        name,
        bestFloor,
        bestTimeLabel,
        bestTimeIso: bestTimeLabel,
        playCount,
      });
    });
    data.players = players;
    data.totalUniquePlayers = players.length;
    data.totalPlays = Math.max(data.totalPlays || 0, players.reduce((sum, p) => sum + p.playCount, 0));
    saveData(data);
    renderAdmin();
  }

  function clearAdminData() {
    if (!window.confirm("確定清空排行榜與玩家資料？")) return;
    saveData(defaultData());
    renderAdmin();
  }

  function preventPageGesture(event) {
    if (event.target.closest(".admin-screen") || event.target.closest("input")) return;
    event.preventDefault();
  }

  function setupInput() {
    document.addEventListener("touchmove", preventPageGesture, { passive: false });
    document.addEventListener("gesturestart", (event) => event.preventDefault());

    const canStartChargeFromEvent = (event) =>
      state.mode === "playing" &&
      !state.tutorialActive &&
      dom.viewport.contains(event.target) &&
      !isPauseButtonEvent(event) &&
      !isTutorialEvent(event);
    const immediateBeginFromEvent = (event) => {
      if (!canStartChargeFromEvent(event)) return;
      event.preventDefault();
      state.inputHeld = true;
      beginCharge();
    };
    const immediateReleaseFromEvent = (event) => {
      if (state.inputHeld || state.charging) event.preventDefault();
      state.inputHeld = false;
      releaseCharge();
    };

    document.addEventListener("mousedown", immediateBeginFromEvent, { capture: true });
    document.addEventListener("mouseup", immediateReleaseFromEvent, { capture: true });
    document.addEventListener("touchstart", immediateBeginFromEvent, { capture: true, passive: false });
    document.addEventListener("touchend", immediateReleaseFromEvent, { capture: true, passive: false });
    document.addEventListener(
      "touchcancel",
      () => {
        state.inputHeld = false;
        releaseCharge();
      },
      { capture: true },
    );

    dom.viewport.addEventListener("pointerdown", (event) => {
      if (state.mode !== "playing") return;
      if (event.target.closest("#pauseButton") || isTutorialEvent(event)) return;
      event.preventDefault();
      if (dom.viewport.setPointerCapture && event.pointerId !== undefined) {
        try {
          dom.viewport.setPointerCapture(event.pointerId);
        } catch {
          // Some browsers reject capture for synthetic or already-ended pointers.
        }
      }
      state.inputHeld = true;
      beginCharge();
    });

    dom.viewport.addEventListener("pointerup", (event) => {
      if (state.mode !== "playing") return;
      if (isPauseButtonEvent(event) || isTutorialEvent(event)) return;
      event.preventDefault();
      state.inputHeld = false;
      releaseCharge();
    });

    dom.viewport.addEventListener("pointercancel", () => {
      state.inputHeld = false;
      releaseCharge();
    });
    dom.viewport.addEventListener("pointerleave", () => {
      state.inputHeld = false;
      releaseCharge();
    });
    window.addEventListener(
      "pointerup",
      (event) => {
        if (isPauseButtonEvent(event) || isTutorialEvent(event)) return;
        if (state.inputHeld || state.charging) event.preventDefault();
        state.inputHeld = false;
        releaseCharge();
      },
      { passive: false },
    );
    window.addEventListener("pointercancel", () => {
      state.inputHeld = false;
      releaseCharge();
    });

    dom.viewport.addEventListener(
      "touchstart",
      (event) => {
        if (state.mode !== "playing") return;
        if (isPauseButtonEvent(event) || isTutorialEvent(event)) return;
        event.preventDefault();
        state.inputHeld = true;
        beginCharge();
      },
      { passive: false },
    );
    window.addEventListener(
      "touchend",
      (event) => {
        if (isPauseButtonEvent(event) || isTutorialEvent(event)) return;
        if (state.inputHeld || state.charging) event.preventDefault();
        state.inputHeld = false;
        releaseCharge();
      },
      { passive: false },
    );
    window.addEventListener("touchcancel", () => {
      state.inputHeld = false;
      releaseCharge();
    });
    dom.viewport.addEventListener(
      "touchend",
      (event) => {
        if (state.mode !== "playing") return;
        if (isPauseButtonEvent(event) || isTutorialEvent(event)) return;
        event.preventDefault();
        state.inputHeld = false;
        releaseCharge();
      },
      { passive: false },
    );
    dom.viewport.addEventListener(
      "touchmove",
      (event) => {
        if (state.mode !== "playing") return;
        if (isPauseButtonEvent(event) || isTutorialEvent(event)) return;
        event.preventDefault();
      },
      { passive: false },
    );
  }

  function setupAudioUnlock() {
    document.addEventListener("pointerdown", unlockAudio, { capture: true });
    document.addEventListener("mousedown", unlockAudio, { capture: true });
    document.addEventListener("touchstart", unlockAudio, { capture: true, passive: true });
    document.addEventListener("keydown", unlockAudio, { capture: true });
  }

  function setupButtons() {
    setupImageButtons();

    dom.startButton.addEventListener("click", () => {
      window.setTimeout(startGame, 130);
    });
    dom.pauseButton.addEventListener("pointerup", togglePauseFromButton);
    dom.pauseButton.addEventListener("touchend", togglePauseFromButton, { passive: false });
    dom.pauseButton.addEventListener("click", togglePauseFromButton);
    dom.tutorialContinueButton.addEventListener("pointerup", closeTutorial);
    dom.tutorialContinueButton.addEventListener("touchend", closeTutorial, { passive: false });
    dom.tutorialContinueButton.addEventListener("click", closeTutorial);
    dom.restartButton.addEventListener("click", () => {
      abandonRankEntry();
      window.setTimeout(startGame, 130);
    });
    dom.gotoButton.addEventListener("click", () => {
      const target = GOTO_LINKS[Math.floor(Math.random() * GOTO_LINKS.length)];
      window.open(target, "_blank", "noopener");
    });
    dom.menuButton.addEventListener("click", () => {
      abandonRankEntry();
      window.setTimeout(() => setMode("menu"), 130);
    });
    dom.submitRankButton.addEventListener("click", saveRankFromDialog);

    dom.adminAddButton.addEventListener("click", () => addAdminRow());
    dom.adminSaveButton.addEventListener("click", saveAdminRows);
    dom.adminClearButton.addEventListener("click", clearAdminData);
    dom.adminBackButton.addEventListener("click", () => setMode("menu"));

    window.addEventListener("keydown", (event) => {
      if (event.key.toLowerCase() === "a" && event.shiftKey && event.altKey) {
        setMode("admin");
      }
      if (event.key === "Escape" && state.mode === "admin") setMode("menu");
      if (state.tutorialActive) {
        if (isEnterKey(event) || isSpaceKey(event)) {
          event.preventDefault();
          closeTutorial(event);
        }
        return;
      }
      if (isEnterKey(event) && (state.mode === "playing" || state.mode === "paused")) {
        event.preventDefault();
        state.inputHeld = false;
        releaseCharge();
        togglePause();
        return;
      }
      if (isSpaceKey(event) && state.mode === "playing") {
        event.preventDefault();
        state.inputHeld = true;
        if (!state.charging) beginCharge();
      }
    });
    window.addEventListener("keyup", (event) => {
      if (isSpaceKey(event) && (state.inputHeld || state.charging || state.mode === "playing")) {
        event.preventDefault();
        state.inputHeld = false;
        releaseCharge();
      }
    });
  }

  function loop(time) {
    const dt = Math.min(0.033, (time - state.lastTime) / 1000 || 0);
    state.lastTime = time;
    syncChargeMeter();
    updateGame(dt, (time - state.startedAt) / 1000);
    updateGameOverHero(dt);
    requestAnimationFrame(loop);
  }

  async function boot() {
    resizeStage();
    window.addEventListener("resize", resizeStage);
    window.addEventListener("orientationchange", () => window.setTimeout(resizeStage, 120));
    setupAudioUnlock();
    primeMutedBgm();
    setupInput();
    setupButtons();
    renderMenuRecords();
    renderFloorDigits(0);
    refreshCloudRecords();
    await preloadRequiredImages();
    hideLoadingOverlay();
    const params = new URLSearchParams(window.location.search);
    if (params.get("admin") === "1") {
      setMode("admin");
      } else if (params.get("screen") === "game") {
        startGame();
        if (params.get("autojump") === "1") {
          window.setTimeout(() => {
            beginCharge();
            window.setTimeout(releaseCharge, 350);
          }, 250);
        }
        if (params.get("qa") === "platformCharge") {
          runPlatformChargeQa();
        }
      } else {
      setMode("splash");
      window.setTimeout(() => {
        if (state.mode === "splash") setMode("menu");
      }, 2420);
    }
    state.lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  function runPlatformChargeQa() {
    window.setTimeout(() => {
      let badge = document.getElementById("qaBadge");
      if (!badge) {
        badge = document.createElement("div");
        badge.id = "qaBadge";
        badge.style.cssText =
          "position:absolute;left:6px;bottom:18px;z-index:99;padding:3px 5px;background:rgba(0,0,0,.65);color:#fff;font:10px monospace;pointer-events:none;";
        dom.stage.appendChild(badge);
      }
      const platform = state.platforms.find((item) => item.baseY === 198) || state.platforms[1];
      if (!platform) {
        document.body.dataset.qaPlatformCharge = "missing-platform";
        badge.textContent = "qa missing-platform";
        return;
      }
      state.hero.x = platform.x + platform.width / 2 - (HERO_LEFT_THIRD_X + HERO_RIGHT_THIRD_X) / 2;
      state.hero.y = platform.y;
      state.hero.vy = 0;
      state.hero.grounded = true;
      state.hero.surface = platform.id;
      renderGameObjects();
      beginCharge();
      const samples = [];
      [200, 500, 900].forEach((delay) => {
        window.setTimeout(() => {
          syncChargeMeter();
          samples.push(`${delay}:${state.chargeLevel}`);
        }, delay);
      });
      window.setTimeout(() => {
        syncChargeMeter();
        document.body.dataset.qaPlatformCharge = JSON.stringify({
          charging: state.charging,
          level: state.chargeLevel,
          samples,
          surface: state.hero.surface,
          action: state.hero.action,
          power: dom.powerMeter.getAttribute("src"),
        });
        badge.textContent = `qa charging=${state.charging} level=${state.chargeLevel} samples=${samples.join("/")}`;
      }, 950);
    }, 250);
  }

  boot();
})();
