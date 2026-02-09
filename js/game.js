import { getGames, saveGames } from "./data.js";

const params = new URLSearchParams(location.search);
const id = Number(params.get("id"));

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
const playTimeInput = document.getElementById("playTimeInput");
const playerCountInput = document.getElementById("playerCountInput");

const trackerGrid = document.getElementById("gameTracker");

/* ---------- RENDER ---------- */
function render() {
  title.textContent = game.name;
  image.src = game.image || "https://via.placeholder.com/600x320";

  plays.textContent = game.plays ?? 0;
  ratingView.textContent =
    game.rating != null ? `${game.rating}/10` : "—";

  reviewView.textContent =
    game.review?.trim() || "No review yet";

  playTime.textContent =
    game.playTime != null ? `${game.playTime} mins` : "—";

  playerCount.textContent =
    game.playerCount?.toString() || "—";

  nameInput.value = game.name;
  imageInput.value = game.image || "";
  ratingInput.value = game.rating ?? "";
  reviewInput.value = game.review || "";
  playTimeInput.value = game.playTime ?? "";
  playerCountInput.value = game.playerCount ?? "";

  renderTracker();
}

/* ---------- GAME TRACKER ---------- */
function renderTracker() {
  trackerGrid.innerHTML = "";
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(today.getFullYear(), today.getMonth(), d);
    const dateKey = date.toISOString().split("T")[0];

    const count = game.playHistory?.[dateKey] || 0;

    const cell = document.createElement("div");
    cell.className = "tracker-day " + (count ? `level-${Math.min(3, count)}` : "");
    cell.title = `${dateKey} — ${count} plays`;

    cell.onclick = () => {
      if (!game.playHistory) game.playHistory = {};
      if (count > 0) {
        game.playHistory[dateKey]--;
        game.plays = Math.max(0, game.plays - 1);
        if (game.playHistory[dateKey] === 0) delete game.playHistory[dateKey];
      } else {
        game.playHistory[dateKey] = 1;
        game.plays = (game.plays || 0) + 1;
      }
      saveGames(games);
      render();
    };

    trackerGrid.appendChild(cell);
  }
}

/* ---------- EDIT ---------- */
document.getElementById("editToggle").onclick = () => {
  editPanel.style.display =
    editPanel.style.display === "none" ? "block" : "none";
};

documen
