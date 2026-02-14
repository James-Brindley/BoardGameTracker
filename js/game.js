import { getGames, updateGame } from "./data.js";

/* =============================
   INITIALIZATION
============================= */
let game = null;
let view = new Date();

// DOM ELEMENTS
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
const editBtn = document.getElementById("editToggle");

async function init() {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  const games = await getGames();
  game = games.find(g => g.id === id);

  if (!game) {
    alert("Game not found");
    location.href = "catalogue.html";
    return;
  }

  document.title = game.name;
  render();
}

/* =============================
   RENDER FUNCTIONS
============================= */
function render() {
  title.textContent = game.name;
  image.src = game.image || "https://via.placeholder.com/800x360";
  plays.textContent = game.plays || 0;
  
  // Restore Original UI Rating Format
  ratingView.textContent = game.rating != null ? `${game.rating}/10` : "—";
  reviewView.textContent = game.review?.trim() || "No review yet";

  // Restore Original UI Stats Format
  if (game.playTime?.min != null) {
    if (game.playTime.max != null && game.playTime.max !== game.playTime.min) {
      playTimeView.textContent = `${game.playTime.min}–${game.playTime.max} mins`;
    } else {
      playTimeView.textContent = `${game.playTime.min} mins`;
    }
  } else {
    playTimeView.textContent = "—";
  }

  if (game.players?.min != null) {
    if (game.players.max != null && game.players.max !== game.players.min) {
      playerView.textContent = `${game.players.min}–${game.players.max} players`;
    } else {
      playerView.textContent = `${game.players.min} players`;
    }
  } else {
    playerView.textContent = "—";
  }

  renderTracker();
  renderBadges();
}

function renderTracker() {
  trackerGrid.innerHTML = "";
  const year = view.getFullYear();
  const month = view.getMonth();
  monthLabel.textContent = view.toLocaleString("default", { month: "long", year: "numeric" });

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const count = game.playHistory[dateKey] || 0;

    const cell = document.createElement("div");
    cell.className = `tracker-day ${count ? "active" : ""}`;
    cell.innerHTML = `
      <span class="day-number">${d}</span>
      ${count ? `<span class="play-count">${count}</span>` : ""}
    `;
    
    cell.onclick = () => updatePlay(dateKey, 1);
    cell.oncontextmenu = (e) => {
        e.preventDefault();
        updatePlay(dateKey, -1);
    };

    trackerGrid.appendChild(cell);
  }
}

window.updatePlay = async function(dateKey, delta) {
  const current = game.playHistory[dateKey] || 0;
  const next = Math.max(0, current + delta);
  
  if (next === 0) delete game.playHistory[dateKey];
  else game.playHistory[dateKey] = next;

  game.plays = Object.values(game.playHistory).reduce((a, b) => a + b, 0);
  
  await updateGame(game);
  render();
};

/* ---------- BADGES ---------- */
async function renderBadges() {
  badgeContainer.innerHTML = "";
  const badges = [
    ...computeMilestoneBadges(),
    ...(await computeAllTimeRankBadges())
  ];

  if (badges.length === 0) {
    badgeContainer.innerHTML = "<p style='opacity:0.5'>No achievements yet. Keep playing!</p>";
    return;
  }

  badges.forEach(b => {
    const div = document.createElement("div");
    div.className = `badge-item badge-${b.type}`;
    div.innerHTML = `
      <div class="badge-icon"></div>
      <div>
        <strong>${b.title}</strong><br>
        <small>${b.subtitle}</small>
      </div>
    `;
    badgeContainer.appendChild(div);
  });
}

async function computeAllTimeRankBadges() {
  const freshGames = await getGames();
  const sorted = [...freshGames].sort((a, b) => (b.plays || 0) - (a.plays || 0));
  const rankIndex = sorted.findIndex(g => g.id === game.id);

  if (rankIndex === -1 || rankIndex > 2) return [];

  const rank = rankIndex + 1;
  const ranks = {
    1: { type: "crown",  title: "All-Time Champion" },
    2: { type: "silver", title: "Grand Strategist" },
    3: { type: "bronze", title: "Tabletop Contender" }
  };

  return [{
    type: ranks[rank].type,
    title: ranks[rank].title,
    subtitle: `Rank #${rank} — ${game.plays || 0} plays`
  }];
}

function computeMilestoneBadges() {
  const total = game.plays || 0;
  const milestones = [
    { value: 50,  type: "empire",  title: "Empire Architect" },
    { value: 25,  type: "table",   title: "Table Commander" },
    { value: 10,  type: "dice",    title: "Dice Adept" },
    { value: 5,   type: "meeple",  title: "Rookie Roller" }
  ];

  const earned = milestones.find(m => total >= m.value);
  return earned ? [{ ...earned, subtitle: `${total} total plays` }] : [];
}

/* ---------- EDIT GAME MODAL ---------- */
editBtn.onclick = () => {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = `
    <div class="modal">
      <div class="close-button">×</div>
      <h2>Edit Game</h2>
      
      <label>Game Name</label>
      <input id="editName" value="${game.name}">

      <div class="row">
        <div>
          <label>Min Players</label>
          <input id="editPMin" type="number" value="${game.players.min || ''}">
        </div>
        <div>
          <label>Max Players</label>
          <input id="editPMax" type="number" value="${game.players.max || ''}">
        </div>
      </div>

      <div class="row">
        <div>
          <label>Min Time</label>
          <input id="editTMin" type="number" value="${game.playTime.min || ''}">
        </div>
        <div>
          <label>Max Time</label>
          <input id="editTMax" type="number" value="${game.playTime.max || ''}">
        </div>
      </div>

      <label>Rating (0-10)</label>
      <input id="editRating" type="number" step="0.1" value="${game.rating || ''}">

      <label>Image URL</label>
      <input id="editImage" value="${game.image || ''}">

      <label>Review</label>
      <textarea id="editReview" rows="3">${game.review || ''}</textarea>

      <button id="saveEdit">Save Changes</button>
    </div>
  `;

  backdrop.querySelector(".close-button").onclick = () => backdrop.remove();

  backdrop.querySelector("#saveEdit").onclick = async () => {
    game.name = backdrop.querySelector("#editName").value.trim();
    game.image = backdrop.querySelector("#editImage").value.trim() || null;
    game.rating = parseFloat(backdrop.querySelector("#editRating").value) || null;
    game.review = backdrop.querySelector("#editReview").value.trim();
    
    game.players = {
      min: Number(backdrop.querySelector("#editPMin").value) || null,
      max: Number(backdrop.querySelector("#editPMax").value) || null
    };
    
    game.playTime = {
      min: Number(backdrop.querySelector("#editTMin").value) || null,
      max: Number(backdrop.querySelector("#editTMax").value) || null
    };

    await updateGame(game);
    backdrop.remove();
    render();
  };

  document.body.appendChild(backdrop);
};

/* ---------- NAV ---------- */
document.getElementById("prevMonth").onclick = () => {
  view = new Date(view.getFullYear(), view.getMonth() - 1, 1);
  renderTracker();
};
document.getElementById("nextMonth").onclick = () => {
  view = new Date(view.getFullYear(), view.getMonth() + 1, 1);
  renderTracker();
};

init();
