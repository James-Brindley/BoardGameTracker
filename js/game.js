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
game.badges ||= [];
game.plays ||= 0;

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
   MONTH NAV FIX
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
   RENDER
============================= */
function render() {
  title.textContent = game.name;
  image.src = game.image || "https://via.placeholder.com/800x360";
  plays.textContent = game.plays;

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
   TRACKER (FIXED + ENHANCED)
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

    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const count = game.playHistory[key] || 0;

    const cell = document.createElement("div");
    cell.className = "tracker-day";

    /* ---------- LEVEL COLOR ---------- */
    if (count > 0) {
      cell.classList.add(`level-${Math.min(3, count)}`);
    }

    /* ---------- TODAY BORDER ---------- */
    if (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === d
    ) {
      cell.classList.add("today");
    }

    /* ---------- DAY NUMBER ---------- */
    const dayNumber = document.createElement("span");
    dayNumber.className = "day-number";
    dayNumber.textContent = d;
    cell.appendChild(dayNumber);

    /* ---------- TOOLTIP (DD/MM/YYYY) ---------- */
    const tooltip = document.createElement("div");
    tooltip.className = "tracker-tooltip";

    const formattedDate = `${String(d).padStart(2,"0")}/${String(month+1).padStart(2,"0")}/${year}`;
    tooltip.innerHTML = `${formattedDate}<br>${count} play${count !== 1 ? "s" : ""}`;

    cell.appendChild(tooltip);

    /* ---------- CLICK HANDLING ---------- */
    cell.addEventListener("click", () => {
      updatePlay(key, 1);
    });

    cell.addEventListener("contextmenu", (e) => {
      e.preventDefault();

      // FIX: Only allow removal if plays exist
      if (!game.playHistory[key]) return;

      updatePlay(key, -1);
    });

    trackerGrid.appendChild(cell);
  }
}

function updatePlay(dateKey, delta) {
  const current = game.playHistory[dateKey] || 0;
  const next = current + delta;

  if (next <= 0) {
    delete game.playHistory[dateKey];
  } else {
    game.playHistory[dateKey] = next;
  }

  game.plays = Math.max(0, (game.plays || 0) + delta);

  saveGames(games);
  render();
}

/* =============================
   EDIT BUTTON FIX
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

  backdrop.querySelector("#saveEdit").onclick = () => {
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

    saveGames(games);
    backdrop.remove();
    render();
  };

  document.body.appendChild(backdrop);
});

/* =============================
   BADGES (UNCHANGED ENGINE)
============================= */

function renderBadges() {
  badgeContainer.innerHTML = "";

  const dynamic = [
    ...computeMonthlyTopBadges(),
    ...computeAllTimeRankBadges(),
    ...computeMilestoneBadges()
  ];

  if (dynamic.length === 0) {
    badgeContainer.innerHTML =
      "<p style='opacity:.6'>No achievements yet.</p>";
    return;
  }

  dynamic.forEach(b => {
    const el = document.createElement("div");
    el.className = `badge badge-${b.type}`;
    el.innerHTML = `
      <div class="badge-title">${b.title}</div>
      <div class="badge-sub">${b.subtitle}</div>
    `;
    badgeContainer.appendChild(el);
  });
}

/* ----- existing badge compute functions unchanged ----- */
/* (keep your computeMonthlyTopBadges, computeAllTimeRankBadges, computeMilestoneBadges exactly as they are) */

render();
