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
const monthLabel = document.getElementById("monthLabel");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");

let currentView = new Date();

/* ---------- INITIALIZE PLAY HISTORY ---------- */
if (!game.playHistory) game.playHistory = {}; // { "YYYY-MM-DD": count }

/* ---------- RENDER ---------- */
function render() {
  title.textContent = game.name;
  image.src = game.image || "https://via.placeholder.com/600x320";
  plays.textContent = game.plays ?? 0;
  ratingView.textContent = game.rating != null ? `${game.rating}/10` : "—";
  reviewView.textContent = game.review?.trim() || "No review yet";
  playTime.textContent = game.playTime != null ? `${game.playTime} mins` : "—";
  playerCount.textContent = game.playerCount?.toString() || "—";

  nameInput.value = game.name;
  imageInput.value = game.image || "";
  ratingInput.value = game.rating ?? "";
  reviewInput.value = game.review || "";
  playTimeInput.value = game.playTime ?? "";
  playerCountInput.value = game.playerCount ?? "";

  renderTracker();
}

/* ---------- TRACKER ---------- */
function renderTracker() {
  trackerGrid.innerHTML = "";

  const year = currentView.getFullYear();
  const month = currentView.getMonth();
  monthLabel.textContent = currentView.toLocaleString("default", { month: "long", year: "numeric" });

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${String(month + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const count = game.playHistory[dateKey] || 0;

    const dayCell = document.createElement("div");
    dayCell.className = "tracker-day";
    if (count > 0) dayCell.classList.add(`level-${Math.min(3,count)}`);
    dayCell.innerHTML = `<div class="tracker-tooltip">${count} plays<br>${dateKey}</div>`;

    // LEFT CLICK = ADD PLAY
    dayCell.addEventListener("click", (e) => {
      game.playHistory[dateKey] = (game.playHistory[dateKey] || 0) + 1;
      game.plays = (game.plays || 0) + 1;
      saveGames(games);
      render();
    });

    // RIGHT CLICK = REMOVE PLAY
    dayCell.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      if (game.playHistory[dateKey]) {
        game.playHistory[dateKey]--;
        game.plays = Math.max(0, game.plays - 1);
        if (game.playHistory[dateKey] === 0) delete game.playHistory[dateKey];
        saveGames(games);
        render();
      }
    });

    trackerGrid.appendChild(dayCell);
  }
}

/* ---------- EDIT PANEL ---------- */
document.getElementById("editToggle").onclick = () => {
  editPanel.style.display = editPanel.style.display === "none" ? "block" : "none";
};

document.getElementById("save").onclick = () => {
  game.name = nameInput.value.trim() || game.name;
  game.image = imageInput.value.trim();
  game.rating = ratingInput.value !== "" ? Number(ratingInput.value) : null;
  game.review = reviewInput.value.trim();
  game.playTime = playTimeInput.value !== "" ? Number(playTimeInput.value) : null;
  game.playerCount = playerCountInput.value.trim();

  saveGames(games);
  editPanel.style.display = "none";
  render();
};

/* ---------- DELETE ---------- */
document.getElementById("deleteGame").onclick = () => {
  if (!confirm(`Delete "${game.name}"? This cannot be undone.`)) return;

  games.splice(gameIndex, 1);
  saveGames(games);
  location.href = "catalogue.html";
};

/* ---------- MONTH NAV ---------- */
prevMonthBtn.onclick = () => { currentView.setMonth(currentView.getMonth() - 1); renderTracker(); };
nextMonthBtn.onclick = () => { currentView.setMonth(currentView.getMonth() + 1); renderTracker(); };

render();
