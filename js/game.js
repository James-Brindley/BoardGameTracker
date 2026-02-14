import { getGames, saveGames, setCurrentUser } from "./data.js";
import { onUserChange, login } from "./firebase.js";

/* =============================
   AUTH SETUP
============================= */
onUserChange(async user => {
  if (!user) {
    alert("Please login to access your games.");
    login();
    return;
  }
  setCurrentUser(user);
  await loadGame();
});

/* =============================
   LOAD GAME
============================= */
const params = new URLSearchParams(location.search);
const id = params.get("id");

let games = [];
let game;

async function loadGame() {
  games = await getGames();
  const index = games.findIndex(g => g.id === id);
  game = games[index];

  if (!game) {
    alert("Game not found");
    location.href = "catalogue.html";
    return;
  }

  game.playHistory ||= {};
  game.players ||= { min: null, max: null };
  game.playTime ||= { min: null, max: null };
  game.badges ||= [];
  game.plays ||= 0;

  render();
}

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
   MONTH NAVIGATION
============================= */
document.getElementById("prevMonth").addEventListener("click", () => {
  view = new Date(view.getFullYear(), view.getMonth() - 1, 1);
  renderTracker();
});

document.getElementById("nextMonth").addEventListener("click", () => {
  view = new Date(view.getFullYear(), view.getMonth() + 1, 1);
  renderTracker();
});

/* =============================
   RENDER FUNCTION
============================= */
function render() {
  if (!game) return;

  title.textContent = game.name;
  image.src = game.image || "https://via.placeholder.com/800x360";
  plays.textContent = game.plays;

  ratingView.textContent =
    game.rating != null ? `${game.rating}/10` : "—";

  reviewView.textContent =
    game.review?.trim() || "No review yet";

  playTimeView.textContent =
    game.playTime.min != null
      ? (game.playTime.max != null && game.playTime.max !== game.playTime.min
         ? `${game.playTime.min}–${game.playTime.max} mins`
         : `${game.playTime.min} mins`)
      : "—";

  playerView.textContent =
    game.players.min != null
      ? (game.players.max != null && game.players.max !== game.players.min
         ? `${game.players.min}–${game.players.max} players`
         : `${game.players.min} players`)
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

  const today = new Date();
  const days = new Date(year, month + 1, 0).getDate();

  for (let d = 1; d <= days; d++) {
    const key = `${year}-${String(month + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const count = game.playHistory[key] || 0;

    const cell = document.createElement("div");
    cell.className = "tracker-day";

    if (count > 0) cell.classList.add(`level-${Math.min(3, count)}`);
    if (today.getFullYear() === year && today.getMonth() === month && today.getDate() === d)
      cell.classList.add("today");

    const dayNumber = document.createElement("span");
    dayNumber.className = "day-number";
    dayNumber.textContent = d;
    cell.appendChild(dayNumber);

    const tooltip = document.createElement("div");
    tooltip.className = "tracker-tooltip";
    tooltip.innerHTML = `${String(d).padStart(2,"0")}/${String(month+1).padStart(2,"0")}/${year}<br>${count} play${count !== 1 ? "s" : ""}`;
    cell.appendChild(tooltip);

    // Add / remove plays
    cell.addEventListener("click", async () => updatePlay(key, 1));
    cell.addEventListener("contextmenu", async (e) => {
      e.preventDefault();
      if (!game.playHistory[key]) return;
      updatePlay(key, -1);
    });

    trackerGrid.appendChild(cell);
  }
}

async function updatePlay(dateKey, delta) {
  const current = game.playHistory[dateKey] || 0;
  const next = current + delta;

  if (next <= 0) delete game.playHistory[dateKey];
  else game.playHistory[dateKey] = next;

  game.plays = Math.max(0, (game.plays || 0) + delta);

  await saveGames(games);
  render();
}

/* =============================
   EDIT GAME
============================= */
document.getElementById("editToggle").addEventListener("click", () => {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";

  backdrop.innerHTML = `
    <div class="modal">
      <div class="close-button">×</div>
      <h2>Edit Game</h2>

      <input id="editName" value="${game.name}">
      <input id="editImage" value="${game.image || ""}" placeholder="Image URL">

      <div class="row">
        <input id="editPMin" type="number" value="${game.players.min ?? ""}" placeholder="Players min">
        <input id="editPMax" type="number" value="${game.players.max ?? ""}" placeholder="Players max">
      </div>

      <div class="row">
        <input id="editTMin" type="number" value="${game.playTime.min ?? ""}" placeholder="Time min">
        <input id="editTMax" type="number" value="${game.playTime.max ?? ""}" placeholder="Time max">
      </div>

      <input id="editRating" type="number" step="0.1" value="${game.rating ?? ""}" placeholder="Rating">
      <textarea id="editReview">${game.review || ""}</textarea>

      <button id="saveEdit">Save Changes</button>
    </div>
  `;

  backdrop.querySelector(".close-button").onclick = () => backdrop.remove();

  backdrop.querySelector("#saveEdit").onclick = async () => {
    game.name = backdrop.querySelector("#editName").value.trim();
    game.image = backdrop.querySelector("#editImage").value.trim();

    game.players = {
      min: Number(backdrop.querySelector("#editPMin").value) || null,
      max: Number(backdrop.querySelector("#editPMax").value) || null
    };

    game.playTime = {
      min: Number(backdrop.querySelector("#editTMin").value) || null,
      max: Number(backdrop.querySelector("#editTMax").value) || null
    };

    const ratingValue = backdrop.querySelector("#editRating").value;
    game.rating = ratingValue ? parseFloat(ratingValue) : null;
    game.review = backdrop.querySelector("#editReview").value.trim();

    await saveGames(games);
    backdrop.remove();
    render();
  };

  document.body.appendChild(backdrop);
});

/* =============================
   BADGES
============================= */
function renderBadges() {
  badgeContainer.innerHTML = "";

  const dynamic = [
    ...computeMonthlyTopBadges(),
    ...computeAllTimeRankBadges(),
    ...computeMilestoneBadges()
  ];

  if (dynamic.length === 0) {
    badgeContainer.innerHTML = "<p style='opacity:.6'>No achievements yet.</p>";
    return;
  }

  dynamic.forEach(b => {
    const el = document.createElement("div");
    el.className = `badge badge-${b.type}`;
    el.innerHTML = `<div class="badge-title">${b.title}</div><div class="badge-sub">${b.subtitle}</div>`;
    badgeContainer.appendChild(el);
  });
}

/* ---------- MONTHLY TOP ---------- */
function computeMonthlyTopBadges() {
  const results = [];
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,"0")}`;

  const months = new Set();
  games.forEach(g => Object.keys(g.playHistory || {}).forEach(date => months.add(date.slice(0,7))));
  months.forEach(monthKey => {
    if (monthKey === currentMonthKey) return;

    const monthlyTotals = games.map(g => {
      const total = Object.entries(g.playHistory || {}).filter(([d]) => d.startsWith(monthKey)).reduce((a,[,v]) => a+v,0);
      return { id: g.id, total };
    });

    const max = Math.max(...monthlyTotals.map(g => g.total));
    if (max === 0) return;

    const winners = monthlyTotals.filter(g => g.total === max);
    if (winners.some(w => w.id === game.id)) {
      const [year, month] = monthKey.split("-");
      const dateObj = new Date(year, month - 1);
      results.push({ type: "gold", title: "Top Game of the Month", subtitle: `${dateObj.toLocaleString("default",{month:"long"})} ${year}` });
    }
  });

  return results;
}

/* ---------- ALL TIME RANK ---------- */
function computeAllTimeRankBadges() {
  const sorted = [...games].sort((a, b) => (b.plays || 0) - (a.plays || 0));
  const rankIndex = sorted.findIndex(g => g.id === game.id);
  if (rankIndex === -1) return [];

  const rank = rankIndex + 1;
  if (rank > 3) return [];

  const ranks = { 1: { type: "crown", title: "All-Time Champion" }, 2: { type: "silver", title: "Grand Strategist" }, 3: { type: "bronze", title: "Tabletop Contender" } };
  return [{ type: ranks[rank].type, title: ranks[rank].title, subtitle: `Rank #${rank} — ${game.plays || 0} plays` }];
}

/* ---------- MILESTONES ---------- */
function computeMilestoneBadges() {
  const total = game.plays || 0;
  const milestones = [
    { value: 5, type: "meeple", title: "Rookie Roller" },
    { value: 10, type: "dice", title: "Dice Adept" },
    { value: 20, type: "guild", title: "Guild Tactician" },
    { value: 30, type: "table", title: "Table Commander" },
    { value: 40, type: "empire", title: "Empire Architect" },
    { value: 50, type: "legend", title: "Legend of the Table" }
  ];

  return milestones.filter(m => total >= m.value).map(m => ({ type: m.type, title: m.title, subtitle: `${m.value}+ Plays` }));
}

/* =============================
   INITIAL RENDER
============================= */
render();
