import { getGames, saveGames } from "./data.js";

const params = new URLSearchParams(location.search);
const id = params.get("id"); // STRING — DO NOT Number()

const games = getGames();
const gameIndex = games.findIndex(g => g.id === id);
const game = games[gameIndex];

if (!game) {
  alert("Game not found.");
  location.href = "catalogue.html";
}

/* ---------- ELEMENTS ---------- */
const title = document.getElementById("title");
const image = document.getElementById("image");
const plays = document.getElementById("plays");
const ratingView = document.getElementById("ratingView");
const reviewView = document.getElementById("reviewView");
const playTime = document.getElementById("playTime");
const playerCount = document.getElementById("playerCount");

const editPanel = document.getElementById("editPanel");
const nameInput = document.getElementById("name");
const imageInput = document.getElementById("imageUrl");
const ratingInput = document.getElementById("rating");
const reviewInput = document.getElementById("review");
const playTimeMinInput = document.getElementById("playTimeMin");
const playTimeMaxInput = document.getElementById("playTimeMax");
const playerMinInput = document.getElementById("playerMin");
const playerMaxInput = document.getElementById("playerMax");

const trackerGrid = document.getElementById("gameTracker");
const monthLabel = document.getElementById("monthLabel");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");

let currentView = new Date();

/* ---------- SAFETY ---------- */
if (!game.playHistory) game.playHistory = {};

/* ---------- RENDER ---------- */
function render() {
  title.textContent = game.name;
  image.src = game.image || "https://via.placeholder.com/600x320";
  plays.textContent = game.plays ?? 0;
  ratingView.textContent = game.rating != null ? `${game.rating}/10` : "—";
  reviewView.textContent = game.review?.trim() || "No review yet";

  playTime.textContent =
    game.playTime?.min != null
      ? `${game.playTime.min}–${game.playTime.max ?? game.playTime.min} mins`
      : "—";

  playerCount.textContent =
    game.players?.min != null
      ? `${game.players.min}–${game.players.max ?? game.players.min} players`
      : "—";

  nameInput.value = game.name;
  imageInput.value = game.image || "";
  ratingInput.value = game.rating ?? "";
  reviewInput.value = game.review || "";

  playTimeMinInput.value = game.playTime?.min ?? "";
  playTimeMaxInput.value = game.playTime?.max ?? "";
  playerMinInput.value = game.players?.min ?? "";
  playerMaxInput.value = game.players?.max ?? "";

  renderTracker();
}

/* ---------- TRACKER ---------- */
function renderTracker() {
  trackerGrid.innerHTML = "";

  const year = currentView.getFullYear();
  const month = currentView.getMonth();
  monthLabel.textContent = currentView.toLocaleString("default", {
    month: "long",
    year: "numeric"
  });

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${String(month + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const count = game.playHistory[dateKey] || 0;

    const dayCell = document.createElement("div");
    dayCell.className = "tracker-day";
    if (count > 0) dayCell.classList.add(`level-${Math.min(3,count)}`);
    dayCell.innerHTML = `<div class="tracker-tooltip">${count} plays<br>${dateKey}</div>`;

    dayCell.onclick = () => {
      game.playHistory[dateKey] = (game.playHistory[dateKey] || 0) + 1;
      game.plays++;
      saveGames(games);
      render();
    };

    dayCell.oncontextmenu = e => {
      e.preventDefault();
      if (!game.playHistory[dateKey]) return;
      game.playHistory[dateKey]--;
      game.plays = Math.max(0, game.plays - 1);
      if (game.playHistory[dateKey] === 0) delete game.playHistory[dateKey];
      saveGames(games);
      render();
    };

    trackerGrid.appendChild(dayCell);
  }
}

/* ---------- EDIT ---------- */
document.getElementById("save").onclick = () => {
  game.name = nameInput.value.trim() || game.name;
  game.image = imageInput.value.trim() || null;
  game.rating = ratingInput.value !== "" ? Number(ratingInput.value) : null;
  game.review = reviewInput.value.trim();

  game.playTime = {
    min: playTimeMinInput.value !== "" ? Number(playTimeMinInput.value) : null,
    max: playTimeMaxInput.value !== "" ? Number(playTimeMaxInput.value) : null
  };

  game.players = {
    min: playerMinInput.value !== "" ? Number(playerMinInput.value) : null,
    max: playerMaxInput.value !== "" ? Number(playerMaxInput.value) : null
  };

  saveGames(games);
  editPanel.style.display = "none";
  render();
};

/* ---------- DELETE ---------- */
document.getElementById("deleteGame").onclick = () => {
  if (!confirm(`Delete "${game.name}"?`)) return;
  games.splice(gameIndex, 1);
  saveGames(games);
  location.href = "catalogue.html";
};

prevMonthBtn.onclick = () => {
  currentView.setMonth(currentView.getMonth() - 1);
  renderTracker();
};

nextMonthBtn.onclick = () => {
  currentView.setMonth(currentView.getMonth() + 1);
  renderTracker();
};

render();
