const GAME_KEY = "boardGames";

/* ---------- HELPERS ---------- */
function parseRange(value) {
  if (value == null) return null;

  // number → {min,max}
  if (typeof value === "number") {
    return { min: value, max: value };
  }

  // string "2–4" or "2-4"
  if (typeof value === "string") {
    const parts = value.split(/[–-]/).map(n => parseInt(n.trim(), 10));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return { min: parts[0], max: parts[1] };
    }
    const single = parseInt(value, 10);
    if (!isNaN(single)) {
      return { min: single, max: single };
    }
  }

  return null;
}

function migrateGame(g) {
  const migrated = { ...g };

  // PLAYERS
  if (!g.players) {
    const parsed = parseRange(g.playerCount);
    migrated.players = parsed || { min: null, max: null };
  }

  // PLAY TIME
  if (!g.playTime || typeof g.playTime === "number") {
    const parsed = parseRange(g.playTime);
    migrated.playTime = parsed || { min: null, max: null };
  }

  // TAGS
  if (!Array.isArray(g.tags)) {
    migrated.tags = [];
  }

  // HISTORY SAFETY
  if (!g.playHistory) migrated.playHistory = {};

  // PLAYS
  if (typeof g.plays !== "number") {
    migrated.plays = Object.values(migrated.playHistory).reduce((a, b) => a + b, 0);
  }

  // CLEAN OLD FIELDS
  delete migrated.playerCount;

  return migrated;
}

/* ---------- PUBLIC API ---------- */
export function getGames() {
  const raw = JSON.parse(localStorage.getItem(GAME_KEY)) || [];
  const migrated = raw.map(migrateGame);

  // persist migration once
  localStorage.setItem(GAME_KEY, JSON.stringify(migrated));
  return migrated;
}

export function saveGames(games) {
  localStorage.setItem(GAME_KEY, JSON.stringify(games));
}

export function todayKey() {
  return new Date().toISOString().split("T")[0];
}
