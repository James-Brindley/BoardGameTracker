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
const allTimeBoard = document.getElementById("allTimeLeaderboard");
const achievementContainer = document.getElementById("achievements");

function formatRange(min, max, suffix="") {
  if (min == null && max == null) return "—";
  if (min === max || max == null) return `${min}${suffix}`;
  return `${min}–${max}${suffix}`;
}

function renderInfo() {
  title.textContent = game.name;
  image.src = game.image || "https://via.placeholder.com/800x360";
  plays.textContent = game.plays || 0;

  ratingView.textContent = game.rating != null ? `${game.rating}/10` : "—";
  reviewView.textContent = game.review?.trim() || "No review yet";

  playTimeView.textContent =
    formatRange(game.playTime.min, game.playTime.max, " mins");

  playerView.textContent =
    formatRange(game.players.min, game.players.max, " players");
}

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

function renderLeaderboard() {
  const sorted = [...games].sort((a, b) => b.plays - a.plays);
  const top10 = sorted.slice(0, 10);

  allTimeBoard.innerHTML = "";

  top10.forEach((g, i) => {
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

    allTimeBoard.appendChild(row);
  });
}

function renderAchievements() {
  achievementContainer.innerHTML = "";

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
      badge.textContent = `${m.title} (${m.value})`;
      achievementContainer.appendChild(badge);
    }
  });
}

prevMonthBtn.onclick = () => {
  const date = new Date(currentMonth + "-01");
  date.setMonth(date.getMonth() - 1);
  currentMonth = date.toISOString().slice(0, 7);
  renderTracker();
};

nextMonthBtn.onclick = () => {
  const date = new Date(currentMonth + "-01");
  date.setMonth(date.getMonth() + 1);
  currentMonth = date.toISOString().slice(0, 7);
  renderTracker();
};

function render() {
  renderInfo();
  renderTracker();
  renderLeaderboard();
  renderAchievements();
}

render();
