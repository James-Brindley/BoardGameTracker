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

const trackerGrid = document.getElementById("gameTracker");
const monthLabel = document.getElementById("monthLabel");

document.getElementById("prevMonth").onclick = () => {
  view.setMonth(view.getMonth() - 1);
  renderTracker();
};

document.getElementById("nextMonth").onclick = () => {
  view.setMonth(view.getMonth() + 1);
  renderTracker();
};

document.getElementById("editToggle").onclick = openEditModal;
document.getElementById("deleteGame").onclick = deleteGame;

/* =============================
   STATE
============================= */
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
}

/* =============================
   TRACKER (FIXED)
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

    cell.innerHTML = `
      <div class="tracker-tooltip">
        ${count} plays<br>${key}
      </div>
    `;

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
  renderTracker(); // 🔥 no full render loop
  plays.textContent = game.plays;
}

/* =============================
   EDIT MODAL (NEW)
============================= */
function openEditModal() {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";

  backdrop.innerHTML = `
    <div class="modal">
      <div class="close-button">×</div>
      <h2>Edit Game</h2>

      <input class="ui-input" id="eName" placeholder="Game name">
      <input class="ui-input" id="eImage" placeholder="Image URL">

      <div class="row">
        <input class="ui-input" id="pMin" type="number" placeholder="Players min">
        <input class="ui-input" id="pMax" type="number" placeholder="Players max">
      </div>

      <div class="row">
        <input class="ui-input" id="tMin" type="number" placeholder="Time min (mins)">
        <input class="ui-input" id="tMax" type="number" placeholder="Time max (mins)">
      </div>

      <input class="ui-input" id="eRating" type="number" min="0" max="10" placeholder="Rating (0–10)">
      <textarea class="ui-input" id="eReview" placeholder="Review"></textarea>

      <button id="saveEdit">Save</button>
    </div>
  `;

  document.body.appendChild(backdrop);

  backdrop.querySelector(".close-button").onclick = () => backdrop.remove();

  // Prefill
  backdrop.querySelector("#eName").value = game.name;
  backdrop.querySelector("#eImage").value = game.image || "";
  backdrop.querySelector("#pMin").value = game.players.min ?? "";
  backdrop.querySelector("#pMax").value = game.players.max ?? "";
  backdrop.querySelector("#tMin").value = game.playTime.min ?? "";
  backdrop.querySelector("#tMax").value = game.playTime.max ?? "";
  backdrop.querySelector("#eRating").value = game.rating ?? "";
  backdrop.querySelector("#eReview").value = game.review ?? "";

  backdrop.querySelector("#saveEdit").onclick = () => {
    game.name = backdrop.querySelector("#eName").value.trim() || game.name;
    game.image = backdrop.querySelector("#eImage").value.trim() || null;

    game.players = {
      min: num("#pMin"),
      max: num("#pMax")
    };

    game.playTime = {
      min: num("#tMin"),
      max: num("#tMax")
    };

    const rating = backdrop.querySelector("#eRating").value;
    game.rating = rating !== "" ? Number(rating) : null;

    game.review = backdrop.querySelector("#eReview").value.trim();

    saveGames(games);
    backdrop.remove();
    render();
  };
}

function num(sel) {
  const v = document.querySelector(sel).value;
  return v === "" ? null : Number(v);
}

/* =============================
   DELETE
============================= */
function deleteGame() {
  if (!confirm(`Delete "${game.name}"? This cannot be undone.`)) return;
  games.splice(index, 1);
  saveGames(games);
  location.href = "catalogue.html";
}

render();
