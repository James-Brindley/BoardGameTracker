import { getGames, saveGames } from "./data.js";

/* =============================
   LOAD GAME
============================= */
const params = new URLSearchParams(location.search);
const id = params.get("id");

const games = getGames();
const index = games.findIndex(g => g.id === id);
const game = games[index];

if (!game) {
  alert("Game not found");
  location.href = "catalogue.html";
}

game.playHistory ||= {};
game.players ||= { min: null, max: null };
game.playTime ||= { min: null, max: null };
game.badges ||= []; // saved badges (non-dynamic)

/* =============================
   ELEMENTS
============================= */
const title = document.getElementById("title");
const image = document.getElementById("image");
const plays = document.getElementById("plays");
const ratingView = document.getElementById("ratingView");
const reviewView = document.getElementById("reviewView");
const playTimeView = document.getElementById("playTime");
const playerView = document.getElementById("playerCount");
const badgeContainer = document.getElementById("badgeContainer");

const trackerGrid = document.getElementById("gameTracker");
const monthLabel = document.getElementById("monthLabel");

let view = new Date();

/* =============================
   RENDER
============================= */
function render() {
  title.textContent = game.name;
  image.src = game.image || "https://via.placeholder.com/800x360";
  plays.textContent = game.plays || 0;

  ratingView.textContent =
    game.rating != null ? `${game.rating}/10` : "—";

  reviewView.textContent =
    game.review?.trim() || "No review yet";

  playTimeView.textContent =
    game.playTime.min != null
      ? `${game.playTime.min}–${game.playTime.max ?? game.playTime.min} mins`
      : "—";

  playerView.textContent =
    game.players.min != null
      ? `${game.players.min}–${game.players.max ?? game.players.min} players`
      : "—";

  renderTracker();
  renderBadges();
}

/* =============================
   TRACKER
============================= */
function renderTracker() {
  trackerGrid.innerHTML = "";

  const year = view.getFullYear();
  const month = view.getMonth();

  monthLabel.textContent = view.toLocaleString("default", {
    month: "long",
    year: "numeric"
  });

  const days = new Date(year, month + 1, 0).getDate();

  for (let d = 1; d <= days; d++) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const count = game.playHistory[key] || 0;

    const cell = document.createElement("div");
    cell.className = "tracker-day";
    if (count) cell.classList.add(`level-${Math.min(3, count)}`);

    cell.onclick = () => updatePlay(key, +1);
    cell.oncontextmenu = e => {
      e.preventDefault();
      updatePlay(key, -1);
    };

    trackerGrid.appendChild(cell);
  }
}

function updatePlay(dateKey, delta) {
  const current = game.playHistory[dateKey] || 0;
  const next = Math.max(0, current + delta);

  if (next === 0) delete game.playHistory[dateKey];
  else game.playHistory[dateKey] = next;

  game.plays = Math.max(0, (game.plays || 0) + delta);

  saveGames(games);
  render();
}

/* =============================
   BADGE ENGINE
============================= */

function renderBadges() {
  badgeContainer.innerHTML = "";

  const dynamic = computeMonthlyTopBadges();
  const saved = game.badges || [];

  const allBadges = [...dynamic, ...saved];

  if (allBadges.length === 0) {
    badgeContainer.innerHTML = "<p style='opacity:.6'>No achievements yet.</p>";
    return;
  }

  allBadges.forEach(b => {
    const el = document.createElement("div");
    el.className = `badge badge-${b.type}`;
    el.innerHTML = `
      <div class="badge-title">${b.title}</div>
      <div class="badge-sub">${b.subtitle}</div>
    `;
    badgeContainer.appendChild(el);
  });
}

/* ---------- MONTHLY TOP BADGE (DYNAMIC) ---------- */

function computeMonthlyTopBadges() {
  const results = [];
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,"0")}`;

  const months = new Set();

  games.forEach(g => {
    Object.keys(g.playHistory || {}).forEach(date => {
      months.add(date.slice(0,7));
    });
  });

  months.forEach(monthKey => {

    if (monthKey === currentMonthKey) return; // no current month

    const monthlyTotals = games.map(g => {
      const total = Object.entries(g.playHistory || {})
        .filter(([d]) => d.startsWith(monthKey))
        .reduce((a,[,v]) => a+v,0);
      return { id: g.id, total };
    });

    const max = Math.max(...monthlyTotals.map(g => g.total));
    if (max === 0) return;

    const winners = monthlyTotals.filter(g => g.total === max);

    if (winners.some(w => w.id === game.id)) {
      const [year, month] = monthKey.split("-");
      const dateObj = new Date(year, month - 1);
      results.push({
        type: "gold",
        title: "Top Game of the Month",
        subtitle: `${dateObj.toLocaleString("default",{month:"long"})} ${year}`
      });
    }
  });

  return results;
}

render();
