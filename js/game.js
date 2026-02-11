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

game.playHistory ||= {};
game.players ||= { min: null, max: null };
game.playTime ||= { min: null, max: null };

let currentMonth = new Date().toISOString().slice(0, 7);

/* ---------- ELEMENTS ---------- */

const title = document.getElementById("title");
const image = document.getElementById("image");
const plays = document.getElementById("plays");
const ratingView = document.getElementById("ratingView");
const reviewView = document.getElementById("reviewView");
const playTimeView = document.getElementById("playTime");
const playerView = document.getElementById("playerCount");

const trackerGrid = document.getElementById("gameTracker");
const monthLabel = document.getElementById("monthLabel");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");

const badgeContainer = document.getElementById("badgeContainer");

const editToggle = document.getElementById("editToggle");

/* ---------- FORMAT HELPERS ---------- */

function formatRange(min, max, suffix = "") {
  if (min == null && max == null) return "—";
  if (min === max || max == null) return `${min}${suffix}`;
  return `${min}–${max}${suffix}`;
}

/* ---------- RENDER GAME INFO ---------- */

function renderInfo() {
  title.textContent = game.name;
  image.src = game.image || "https://via.placeholder.com/800x360";

  plays.textContent = game.plays || 0;

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
  trackerGrid.innerHTML = "";

  const [year, month] = currentMonth.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  monthLabel.textContent =
    new Date(year, month - 1).toLocaleString("default", {
      month: "long",
      year: "numeric"
    });

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${currentMonth}-${String(d).padStart(2, "0")}`;
    const count = game.playHistory[dateKey] || 0;

    const cell = document.createElement("div");
    cell.className = "tracker-day";

    if (count > 0) {
      cell.classList.add("level-" + Math.min(count, 3));
      cell.textContent = count;
    }

    /* Left click = add */
    cell.addEventListener("click", () => {
      game.playHistory[dateKey] =
        (game.playHistory[dateKey] || 0) + 1;

      game.plays = (game.plays || 0) + 1;

      saveGames(games);
      render();
    });

    /* Right click = remove */
    cell.addEventListener("contextmenu", (e) => {
      e.preventDefault();

      if (game.playHistory[dateKey]) {
        game.playHistory[dateKey]--;
        game.plays = Math.max(0, (game.plays || 0) - 1);

        if (game.playHistory[dateKey] <= 0) {
          delete game.playHistory[dateKey];
        }

        saveGames(games);
        render();
      }
    });

    trackerGrid.appendChild(cell);
  }
}

/* ---------- ACHIEVEMENTS ---------- */

function renderAchievements() {
  badgeContainer.innerHTML = "";

  const milestones = [
    { value: 5, title: "Table Starter" },
    { value: 10, title: "Card Conqueror" },
    { value: 20, title: "Dice Veteran" },
    { value: 30, title: "Meeple Master" },
    { value: 40, title: "Board Warlord" },
    { value: 50, title: "Legend of the Table" }
  ];

  milestones.forEach(m => {
    if ((game.plays || 0) >= m.value) {
      const badge = document.createElement("div");
      badge.className = "achievement-badge";
      badge.textContent = `${m.title} (${m.value})`;
      badgeContainer.appendChild(badge);
    }
  });
}

/* ---------- MONTH NAV ---------- */

prevMonthBtn.addEventListener("click", () => {
  const date = new Date(currentMonth + "-01");
  date.setMonth(date.getMonth() - 1);
  currentMonth = date.toISOString().slice(0, 7);
  renderTracker();
});

nextMonthBtn.addEventListener("click", () => {
  const date = new Date(currentMonth + "-01");
  date.setMonth(date.getMonth() + 1);
  currentMonth = date.toISOString().slice(0, 7);
  renderTracker();
});

/* ---------- EDIT BUTTON ---------- */

editToggle.addEventListener("click", () => {
  const newName = prompt("Edit game name:", game.name);
  if (newName === null) return;

  game.name = newName.trim() || game.name;

  saveGames(games);
  render();
});

/* ---------- MAIN RENDER ---------- */

function render() {
  renderInfo();
  renderTracker();
  renderAchievements();
}

render();
