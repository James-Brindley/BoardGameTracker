import { getGames, saveGames } from "./data.js";

const params = new URLSearchParams(location.search);
const id = params.get("id");

const games = getGames();
const index = games.findIndex(g => g.id === id);
const game = games[index];

if (!game) {
  alert("Game not found");
  location.href = "catalogue.html";
}

/* ---------- SAFE DEFAULTS ---------- */
game.playHistory ||= {};
game.players ||= { min: null, max: null };
game.playTime ||= { min: null, max: null };
game.plays ||= 0;

/* ---------- ELEMENTS ---------- */
const title = document.getElementById("title");
const image = document.getElementById("image");
const plays = document.getElementById("plays");
const ratingView = document.getElementById("ratingView");
const reviewView = document.getElementById("reviewView");
const playTimeView = document.getElementById("playTime");
const playerView = document.getElementById("playerCount");

const trackerGrid = document.getElementById("trackerGrid");
const monthLabel = document.getElementById("monthLabel");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");

const leaderboardEl = document.getElementById("allTimeLeaderboard");
const achievementsEl = document.getElementById("achievements");

/* EDIT PANEL */
const editToggle = document.getElementById("editToggle");
const editPanel = document.getElementById("editPanel");
const nameInput = document.getElementById("name");
const imageInput = document.getElementById("imageUrl");
const ratingInput = document.getElementById("rating");
const reviewInput = document.getElementById("review");
const minPlayersInput = document.getElementById("minPlayers");
const maxPlayersInput = document.getElementById("maxPlayers");
const minTimeInput = document.getElementById("minTime");
const maxTimeInput = document.getElementById("maxTime");
const saveBtn = document.getElementById("save");
const deleteBtn = document.getElementById("deleteGame");

let currentMonth = new Date().toISOString().slice(0, 7);

/* ---------- HELPERS ---------- */
function formatRange(min, max, suffix = "") {
  if (min == null && max == null) return "—";
  if (min === max || max == null) return `${min}${suffix}`;
  return `${min}–${max}${suffix}`;
}

/* ---------- RENDER INFO ---------- */
function renderInfo() {
  if (!title) return;

  title.textContent = game.name;
  image.src = game.image || "https://via.placeholder.com/800x360";
  plays.textContent = game.plays;

  ratingView.textContent =
    game.rating != null ? `${game.rating}/10` : "—";

  reviewView.textContent =
    game.review?.trim() || "No review yet";

  playTimeView.textContent =
    formatRange(game.playTime.min, game.playTime.max, " mins");

  playerView.textContent =
    formatRange(game.players.min, game.players.max, " players");
}

/* ---------- TRACKER ---------- */
function renderTracker() {
  if (!trackerGrid) return;

  trackerGrid.innerHTML = "";

  const [year, month] = currentMonth.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  if (monthLabel) {
    monthLabel.textContent =
      new Date(year, month - 1).toLocaleString("default", {
        month: "long",
        year: "numeric"
      });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${currentMonth}-${String(d).padStart(2, "0")}`;
    const count = game.playHistory[dateKey] || 0;

    const cell = document.createElement("div");
    cell.className = "tracker-cell";
    if (count > 0) cell.classList.add("active");
    cell.textContent = count > 0 ? count : "";

    cell.onclick = () => {
      game.playHistory[dateKey] = (game.playHistory[dateKey] || 0) + 1;
      game.plays++;
      saveGames(games);
      render();
    };

    cell.oncontextmenu = (e) => {
      e.preventDefault();
      if (game.playHistory[dateKey] > 0) {
        game.playHistory[dateKey]--;
        game.plays--;
        if (game.playHistory[dateKey] <= 0) {
          delete game.playHistory[dateKey];
        }
        saveGames(games);
        render();
      }
    };

    trackerGrid.appendChild(cell);
  }
}

/* ---------- LEADERBOARD ---------- */
function renderLeaderboard() {
  if (!leaderboardEl) return;

  const sorted = [...games].sort((a, b) => b.plays - a.plays).slice(0, 10);

  leaderboardEl.innerHTML = "";

  sorted.forEach((g, i) => {
    const row = document.createElement("div");
    row.className = "leaderboard-row";

    let badge = "";
    if (i === 0) badge = "🥇";
    if (i === 1) badge = "🥈";
    if (i === 2) badge = "🥉";

    row.innerHTML = `
      <span>${badge} ${i + 1}. ${g.name}</span>
      <strong>${g.plays}</strong>
    `;

    leaderboardEl.appendChild(row);
  });
}

/* ---------- ACHIEVEMENTS ---------- */
function renderAchievements() {
  if (!achievementsEl) return;

  achievementsEl.innerHTML = "";

  const milestones = [
    { value: 5, title: "Table Starter" },
    { value: 10, title: "Card Conqueror" },
    { value: 20, title: "Dice Veteran" },
    { value: 30, title: "Meeple Master" },
    { value: 40, title: "Board Warlord" },
    { value: 50, title: "Legend of the Table" }
  ];

  milestones.forEach(m => {
    if (game.plays >= m.value) {
      const badge = document.createElement("div");
      badge.className = "achievement-badge";
      badge.textContent = m.title;
      achievementsEl.appendChild(badge);
    }
  });
}

/* ---------- MONTH NAV ---------- */
if (prevMonthBtn) {
  prevMonthBtn.onclick = () => {
    const date = new Date(currentMonth + "-01");
    date.setMonth(date.getMonth() - 1);
    currentMonth = date.toISOString().slice(0, 7);
    renderTracker();
  };
}

if (nextMonthBtn) {
  nextMonthBtn.onclick = () => {
    const date = new Date(currentMonth + "-01");
    date.setMonth(date.getMonth() + 1);
    currentMonth = date.toISOString().slice(0, 7);
    renderTracker();
  };
}

/* ---------- EDIT TOGGLE ---------- */
if (editToggle) {
  editToggle.onclick = () => {
    editPanel.style.display =
      editPanel.style.display === "block" ? "none" : "block";
  };
}

/* ---------- SAVE ---------- */
if (saveBtn) {
  saveBtn.onclick = () => {
    game.name = nameInput.value.trim() || game.name;
    game.image = imageInput.value.trim();
    game.rating = ratingInput.value
      ? Number(ratingInput.value)
      : null;
    game.review = reviewInput.value.trim();

    game.players.min = minPlayersInput.value
      ? Number(minPlayersInput.value)
      : null;
    game.players.max = maxPlayersInput.value
      ? Number(maxPlayersInput.value)
      : null;

    game.playTime.min = minTimeInput.value
      ? Number(minTimeInput.value)
      : null;
    game.playTime.max = maxTimeInput.value
      ? Number(maxTimeInput.value)
      : null;

    saveGames(games);
    editPanel.style.display = "none";
    render();
  };
}

/* ---------- DELETE ---------- */
if (deleteBtn) {
  deleteBtn.onclick = () => {
    if (!confirm(`Delete "${game.name}"?`)) return;
    games.splice(index, 1);
    saveGames(games);
    location.href = "catalogue.html";
  };
}

/* ---------- INIT ---------- */
function render() {
  renderInfo();
  renderTracker();
  renderLeaderboard();
  renderAchievements();
}

render();
