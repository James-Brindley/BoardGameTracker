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
  
  ratingView.textContent = game.rating != null ? `${game.rating}/10` : "—";
  reviewView.textContent = game.review?.trim() || "No review yet";

  // Format Stats
  if (game.playTime?.min != null) {
    playTimeView.textContent = (game.playTime.max && game.playTime.max !== game.playTime.min) 
      ? `${game.playTime.min}–${game.playTime.max} mins` 
      : `${game.playTime.min} mins`;
  } else { playTimeView.textContent = "—"; }

  if (game.players?.min != null) {
    playerView.textContent = (game.players.max && game.players.max !== game.players.min) 
      ? `${game.players.min}–${game.players.max} players` 
      : `${game.players.min} players`;
  } else { playerView.textContent = "—"; }

  renderTracker();
  renderBadges();
}

/* =============================
   TRACKER (RESTORED UI)
============================= */
function renderTracker() {
  trackerGrid.innerHTML = "";
  const year = view.getFullYear();
  const month = view.getMonth();
  const today = new Date();

  monthLabel.textContent = view.toLocaleString("default", { month: "long", year: "numeric" });

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const count = game.playHistory[dateKey] || 0;

    const cell = document.createElement("div");
    cell.className = "tracker-day";

    /* Restore: Level Intensity Coloring */
    if (count > 0) {
      cell.classList.add(`level-${Math.min(3, count)}`);
    }

    /* Restore: Current Day Border */
    if (today.getFullYear() === year && today.getMonth() === month && today.getDate() === d) {
      cell.classList.add("today");
    }

    /* Day Number (Top Left) */
    const dayNum = document.createElement("span");
    dayNum.className = "day-number";
    dayNum.textContent = d;
    cell.appendChild(dayNum);

    /* Restore: Hover Tooltip (Instead of big number in box) */
    const tooltip = document.createElement("div");
    tooltip.className = "tracker-tooltip";
    const formattedDate = `${String(d).padStart(2,"0")}/${String(month+1).padStart(2,"0")}/${year}`;
    tooltip.innerHTML = `${formattedDate}<br>${count} play${count !== 1 ? "s" : ""}`;
    cell.appendChild(tooltip);

    cell.onclick = () => updatePlay(dateKey, 1);
    cell.oncontextmenu = (e) => {
        e.preventDefault();
        if (game.playHistory[dateKey]) updatePlay(dateKey, -1);
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
  
  await updateGame(game); // Sync to Supabase
  render();
};

/* =============================
   BADGES (RESTORED UI)
============================= */
async function renderBadges() {
  badgeContainer.innerHTML = "";
  const allGames = await getGames(); 
  
  const badges = [
    ...computeMonthlyTopBadges(allGames),
    ...(await computeAllTimeRankBadges()),
    ...computeMilestoneBadges()
  ];

  if (badges.length === 0) {
    badgeContainer.innerHTML = "<p style='opacity:0.6'>No achievements yet.</p>";
    return;
  }

  badges.forEach(b => {
    const el = document.createElement("div");
    el.className = `badge badge-${b.type}`; // Restore original class
    el.innerHTML = `
      <div class="badge-title">${b.title}</div>
      <div class="badge-sub">${b.subtitle}</div>
    `;
    badgeContainer.appendChild(el);
  });
}

function computeMonthlyTopBadges(allGames) {
  const results = [];
  const playMonths = new Set(Object.keys(game.playHistory).map(d => d.slice(0,7)));
  
  playMonths.forEach(monthStr => {
    // Calculate plays for EVERY game in that specific month
    const rankings = allGames.map(g => {
      const mPlays = Object.entries(g.playHistory || {})
        .filter(([date]) => date.startsWith(monthStr))
        .reduce((sum, [, val]) => sum + val, 0);
      return { id: g.id, plays: mPlays };
    }).sort((a, b) => b.plays - a.plays);

    // If this game was #1 that month and had at least 1 play
    if (rankings[0]?.id === game.id && rankings[0]?.plays > 0) {
      const [y, m] = monthStr.split("-");
      const monthName = new Date(y, m-1).toLocaleString('default', { month: 'long' });
      results.push({
        type: "gold",
        title: `Monthly Champion`,
        subtitle: `${monthName} ${y}`
      });
    }
  });
  return results;
}

async function computeAllTimeRankBadges() {
  const freshGames = await getGames();
  const sorted = [...freshGames].sort((a, b) => (b.plays || 0) - (a.plays || 0));
  const rankIndex = sorted.findIndex(g => g.id === game.id);

  if (rankIndex === -1 || rankIndex > 2) return [];

  const ranks = {
    1: { type: "crown",  title: "All-Time Champion" },
    2: { type: "silver", title: "Grand Strategist" },
    3: { type: "bronze", title: "Tabletop Contender" }
  };

  const rank = rankIndex + 1;
  return [{
    type: ranks[rank].type,
    title: ranks[rank].title,
    subtitle: `Rank #${rank} — ${game.plays || 0} plays`
  }];
}

function computeMilestoneBadges() {
  const total = game.plays || 0;
  const milestones = [
    { value: 50, type: "legend",  title: "Legend of the Table" },
    { value: 40, type: "empire",  title: "Empire Architect" },
    { value: 30, type: "table",   title: "Table Commander" },
    { value: 20, type: "guild",   title: "Guild Tactician" },
    { value: 10, type: "dice",    title: "Dice Adept" },
    { value: 5,  type: "meeple",  title: "Rookie Roller" }
  ];

  return milestones
    .filter(m => total >= m.value)
    .map(m => ({ ...m, subtitle: `${m.value}+ Plays` }));
}

/* ---------- EDIT GAME MODAL ---------- */
editBtn.onclick = () => {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = `
    <div class="modal">
      <div class="close-button">×</div>
      <h2>Edit Game</h2>
      <input id="editName" value="${game.name}" placeholder="Game Name">
      <input id="editImage" value="${game.image || ''}" placeholder="Image URL">
      <div class="row">
        <input id="editPMin" type="number" value="${game.players.min ?? ''}" placeholder="Min Players">
        <input id="editPMax" type="number" value="${game.players.max ?? ''}" placeholder="Max Players">
      </div>
      <div class="row">
        <input id="editTMin" type="number" value="${game.playTime.min ?? ''}" placeholder="Min Time">
        <input id="editTMax" type="number" value="${game.playTime.max ?? ''}" placeholder="Max Time">
      </div>
      <input id="editRating" type="number" step="0.1" value="${game.rating ?? ''}" placeholder="Rating (0-10)">
      <textarea id="editReview" placeholder="Your review...">${game.review || ''}</textarea>
      <button id="saveEdit">Save Changes</button>
    </div>
  `;

  backdrop.querySelector(".close-button").onclick = () => backdrop.remove();
  backdrop.querySelector("#saveEdit").onclick = async () => {
    game.name = backdrop.querySelector("#editName").value.trim();
    game.image = backdrop.querySelector("#editImage").value.trim() || null;
    game.review = backdrop.querySelector("#editReview").value.trim();
    game.rating = parseFloat(backdrop.querySelector("#editRating").value) || null;
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
