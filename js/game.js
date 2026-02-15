import { getGames, updateGame, deleteGame } from "./data.js";

/* =============================
   INITIALIZATION
============================= */
let game = null;
let view = new Date();

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

// New Container for Advanced Stats
const advancedStatsContainer = document.createElement('div');
advancedStatsContainer.id = "advancedStats";
document.querySelector('.game-stats').after(advancedStatsContainer);

async function init() {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  const games = await getGames();
  game = games.find(g => g.id === id);

  if (!game) {
    location.href = "catalogue.html";
    return;
  }

  // Ensure defaults
  if (!game.tracking) game.tracking = { score: false, won: false };
  if (!game.sessions) game.sessions = [];

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

  renderAdvancedStats();
  renderTracker();
  renderBadges();
}

/* NEW: RENDER SCORE / WIN LOSS */
function renderAdvancedStats() {
  const hasData = game.sessions && game.sessions.length > 0;
  const showScore = game.tracking.score || (hasData && game.sessions.some(s => s.score != null));
  const showWon = game.tracking.won || (hasData && game.sessions.some(s => s.won != null));

  advancedStatsContainer.innerHTML = "";
  
  if (!showScore && !showWon) {
    advancedStatsContainer.style.display = 'none';
    return;
  }
  
  advancedStatsContainer.style.display = 'flex';
  advancedStatsContainer.className = "stats-row-advanced";

  // 1. HIGH SCORE
  if (showScore) {
    const scores = game.sessions.filter(s => s.score != null).map(s => s.score);
    const highScore = scores.length ? Math.max(...scores) : "—";
    
    const div = document.createElement('div');
    div.className = "stat";
    div.innerHTML = `<span class="stat-label">High Score</span><span class="stat-value">${highScore}</span>`;
    advancedStatsContainer.appendChild(div);
  }

  // 2. WIN / LOSS
  if (showWon) {
    const validSessions = game.sessions.filter(s => s.won != null);
    const wins = validSessions.filter(s => s.won === true).length;
    const losses = validSessions.filter(s => s.won === false).length;

    const div = document.createElement('div');
    div.className = "stat";
    div.innerHTML = `
      <span class="stat-label">Win Rate</span>
      <span class="stat-value">${wins}W – ${losses}L</span>
    `;
    advancedStatsContainer.appendChild(div);
  }
}

/* =============================
   TRACKER & UPDATES (IMPROVED TOOLTIP)
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
    if (count > 0) cell.classList.add(`level-${Math.min(3, count)}`);
    if (today.getFullYear() === year && today.getMonth() === month && today.getDate() === d) cell.classList.add("today");

    const dayNum = document.createElement("span");
    dayNum.className = "day-number";
    dayNum.textContent = d;
    cell.appendChild(dayNum);

    // --- ENHANCED TOOLTIP LOGIC ---
    const tooltip = document.createElement("div");
    tooltip.className = "tracker-tooltip";
    const formattedDate = `${String(d).padStart(2,"0")}/${String(month+1).padStart(2,"0")}/${year}`;
    
    // Check if we have detailed session data for this day
    const daySessions = (game.sessions || []).filter(s => s.date === dateKey);

    let content = `<strong>${formattedDate}</strong>`;

    if (daySessions.length > 0 && (game.tracking.score || game.tracking.won)) {
      // Detailed View
      daySessions.forEach(s => {
        let rowHtml = `<div class="tooltip-row">`;
        
        // Win/Loss Tag
        if (game.tracking.won && s.won != null) {
          rowHtml += s.won 
            ? `<span class="tooltip-tag tag-win">WIN</span>` 
            : `<span class="tooltip-tag tag-loss">LOSS</span>`;
        }
        
        // Score Tag
        if (game.tracking.score && s.score != null) {
          rowHtml += `<span class="tooltip-tag tag-score">${s.score} pts</span>`;
        }
        
        // Fallback if empty
        if ((!game.tracking.won || s.won == null) && (!game.tracking.score || s.score == null)) {
          rowHtml += `<span>Play logged</span>`;
        }

        rowHtml += `</div>`;
        content += rowHtml;
      });
    } else {
      // Simple Count View
      content += `<div style="margin-top:2px">${count} play${count !== 1 ? "s" : ""}</div>`;
    }

    tooltip.innerHTML = content;
    cell.appendChild(tooltip);

    cell.onclick = () => handlePlayClick(dateKey, 1);
    cell.oncontextmenu = (e) => {
        e.preventDefault();
        if (game.playHistory[dateKey]) handlePlayClick(dateKey, -1);
    };
    trackerGrid.appendChild(cell);
  }
}

/* LOGIC TO HANDLE CLICKS & SMART REMOVAL */
async function handlePlayClick(dateKey, delta) {
  // === ADDING PLAY ===
  if (delta === 1) {
    if (game.tracking.score || game.tracking.won) {
      showPlayModal(dateKey);
    } else {
      updatePlayCount(dateKey, 1);
      game.sessions.push({ date: dateKey, timestamp: Date.now() });
      await saveGame();
    }
    return;
  }

  // === REMOVING PLAY (SMART DELETE) ===
  const daySessions = (game.sessions || []).filter(s => s.date === dateKey);
  
  // 1. If no detailed sessions (legacy data) or only 1 session, just delete it directly
  if (daySessions.length <= 1) {
    removeSessionDirectly(dateKey, daySessions[0]); 
    return;
  }

  // 2. If multiple sessions, check if they are all identical (same W/L and same Score)
  const allIdentical = daySessions.every(s => {
    const first = daySessions[0];
    return s.won === first.won && s.score === first.score;
  });

  if (allIdentical) {
    // If they are all the same, just remove the last one without asking
    removeSessionDirectly(dateKey, daySessions[daySessions.length - 1]);
  } else {
    // 3. Differing data -> Show Popup to select which one
    showRemovalModal(dateKey, daySessions);
  }
}

async function removeSessionDirectly(dateKey, sessionObj) {
  // Update sessions array
  if (sessionObj) {
    const idx = game.sessions.indexOf(sessionObj);
    if (idx > -1) game.sessions.splice(idx, 1);
  } else {
    // Fallback for legacy data (remove last empty session for this date)
    const idx = game.sessions.findLastIndex(s => s.date === dateKey);
    if (idx > -1) game.sessions.splice(idx, 1);
  }

  updatePlayCount(dateKey, -1);
  await saveGame();
}

function showRemovalModal(dateKey, sessions) {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  
  let html = `
    <div class="modal">
      <div class="close-button">×</div>
      <h2>Remove Play</h2>
      <p style="text-align:center; color:var(--muted); margin-bottom:1rem">Select which play to remove for ${dateKey}</p>
      <div class="removal-list">
  `;

  sessions.forEach((s, i) => {
    let details = [];
    if (game.tracking.won && s.won != null) details.push(s.won ? "Win" : "Loss");
    if (game.tracking.score && s.score != null) details.push(`Score: ${s.score}`);
    if (details.length === 0) details.push(`Play #${i+1}`);

    // Add class for styling border
    let classExtra = "";
    if (s.won === true) classExtra = "win";
    if (s.won === false) classExtra = "loss";

    html += `
      <button class="removal-option ${classExtra}" data-index="${i}">
        <span>${details.join(" · ")}</span>
        <span style="opacity:0.5">🗑️</span>
      </button>
    `;
  });

  html += `</div></div>`;
  backdrop.innerHTML = html;

  backdrop.querySelector(".close-button").onclick = () => backdrop.remove();
  
  // Handle clicks on list items
  const buttons = backdrop.querySelectorAll(".removal-option");
  buttons.forEach(btn => {
    btn.onclick = async () => {
      const idx = parseInt(btn.dataset.index);
      const sessionToRemove = sessions[idx]; // Get the actual object from the filtered list
      await removeSessionDirectly(dateKey, sessionToRemove);
      backdrop.remove();
    };
  });

  document.body.appendChild(backdrop);
}

function showPlayModal(dateKey) {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  
  let html = `
    <div class="modal">
      <div class="close-button">×</div>
      <h2>Log Play</h2>
      <p style="text-align:center; color:var(--muted); margin-bottom:1rem">${dateKey}</p>
  `;

  if (game.tracking.score) {
    html += `<input id="logScore" type="number" placeholder="Enter Score">`;
  }

  if (game.tracking.won) {
    html += `
      <div class="play-log-options">
        <button class="result-btn" data-val="win">Won</button>
        <button class="result-btn" data-val="loss">Lost</button>
      </div>
      <input type="hidden" id="logWon" value="">
    `;
  }

  html += `<button id="confirmPlay">Save Play</button></div>`;
  backdrop.innerHTML = html;

  const winBtn = backdrop.querySelector('button[data-val="win"]');
  const lossBtn = backdrop.querySelector('button[data-val="loss"]');
  const wonInput = backdrop.querySelector('#logWon');

  if (winBtn && lossBtn) {
    winBtn.onclick = () => {
      winBtn.classList.add('selected-win');
      lossBtn.classList.remove('selected-loss');
      wonInput.value = "true";
    };
    lossBtn.onclick = () => {
      lossBtn.classList.add('selected-loss');
      winBtn.classList.remove('selected-win');
      wonInput.value = "false";
    };
  }

  backdrop.querySelector(".close-button").onclick = () => backdrop.remove();
  
  backdrop.querySelector("#confirmPlay").onclick = async () => {
    const scoreVal = backdrop.querySelector("#logScore")?.value;
    const wonVal = backdrop.querySelector("#logWon")?.value;

    const sessionData = {
      date: dateKey,
      timestamp: Date.now(),
      score: scoreVal ? Number(scoreVal) : null,
      won: wonVal === "true" ? true : (wonVal === "false" ? false : null)
    };

    updatePlayCount(dateKey, 1);
    game.sessions.push(sessionData);
    await saveGame();
    backdrop.remove();
  };

  document.body.appendChild(backdrop);
}

function updatePlayCount(dateKey, delta) {
  const current = game.playHistory[dateKey] || 0;
  const next = Math.max(0, current + delta);
  if (next === 0) delete game.playHistory[dateKey];
  else game.playHistory[dateKey] = next;
  game.plays = Object.values(game.playHistory).reduce((a, b) => a + b, 0);
}

async function saveGame() {
  await updateGame(game);
  render();
}

/* =============================
   BADGES & EDIT
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
    el.className = `badge badge-${b.type}`;
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
    const rankings = allGames.map(g => {
      const mPlays = Object.entries(g.playHistory || {})
        .filter(([date]) => date.startsWith(monthStr))
        .reduce((sum, [, val]) => sum + val, 0);
      return { id: g.id, plays: mPlays };
    }).sort((a, b) => b.plays - a.plays);

    if (rankings[0]?.id === game.id && rankings[0]?.plays > 0) {
      const [y, m] = monthStr.split("-");
      results.push({
        type: "gold",
        title: `Monthly Champion`,
        subtitle: `${new Date(y, m-1).toLocaleString('default', { month: 'long' })} ${y}`
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
    { value: 20, type: "guild",   title: "Guild Tactician" },
    { value: 5,  type: "meeple",  title: "Rookie Roller" }
  ];
  return milestones.filter(m => total >= m.value).map(m => ({ ...m, subtitle: `${m.value}+ Plays` }));
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

      <div class="toggle-group">
        <label class="toggle-label">
          <input type="checkbox" id="editTrackScore" ${game.tracking.score ? 'checked' : ''}> Track Score
        </label>
        <label class="toggle-label">
          <input type="checkbox" id="editTrackWon" ${game.tracking.won ? 'checked' : ''}> Track Win/Loss
        </label>
      </div>

      <input id="editRating" type="number" step="0.1" value="${game.rating ?? ''}" placeholder="Rating (0-10)">
      <textarea id="editReview" placeholder="Your review...">${game.review || ''}</textarea>
      
      <button id="saveEdit" style="margin-bottom:10px">Save Changes</button>
      <button id="deleteGameBtn" class="danger">Delete Game</button>
    </div>
  `;

  backdrop.querySelector(".close-button").onclick = () => backdrop.remove();

  // SAVE
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
    game.tracking = {
      score: backdrop.querySelector("#editTrackScore").checked,
      won: backdrop.querySelector("#editTrackWon").checked
    };

    await updateGame(game);
    backdrop.remove();
    render();
  };

  // DELETE
  backdrop.querySelector("#deleteGameBtn").onclick = async () => {
    if (confirm(`Are you sure you want to delete "${game.name}"? This cannot be undone.`)) {
      await deleteGame(game.id);
      window.location.href = "catalogue.html";
    }
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
