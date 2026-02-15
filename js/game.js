import { getGames, updateGame, deleteGame } from "./data.js";

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

// Insert Advanced Stats Container if it doesn't exist
let advancedStatsContainer = document.getElementById("advancedStats");
if(!advancedStatsContainer) {
    advancedStatsContainer = document.createElement('div');
    advancedStatsContainer.id = "advancedStats";
    document.querySelector('.game-stats-grid').after(advancedStatsContainer);
}

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
  reviewView.textContent = game.review?.trim() || "No review logged.";

  if (game.playTime?.min != null) {
    playTimeView.textContent = (game.playTime.max && game.playTime.max !== game.playTime.min) 
      ? `${game.playTime.min}–${game.playTime.max}m` 
      : `${game.playTime.min}m`;
  } else { playTimeView.textContent = "—"; }

  if (game.players?.min != null) {
    playerView.textContent = (game.players.max && game.players.max !== game.players.min) 
      ? `${game.players.min}–${game.players.max}` 
      : `${game.players.min}`;
  } else { playerView.textContent = "—"; }

  renderAdvancedStats();
  renderTracker();
  renderBadges();
}

/* RENDER SCORE / WIN LOSS */
function renderAdvancedStats() {
  const hasData = game.sessions && game.sessions.length > 0;
  const showScore = game.tracking.score || (hasData && game.sessions.some(s => s.score != null));
  const showWon = game.tracking.won || (hasData && game.sessions.some(s => s.won != null));

  advancedStatsContainer.innerHTML = "";
  advancedStatsContainer.className = "advanced-stats-container";
  
  if (!showScore && !showWon) {
    advancedStatsContainer.style.display = 'none';
    return;
  }
  
  advancedStatsContainer.style.display = 'flex';

  // 1. HIGH SCORE
  if (showScore) {
    const scores = game.sessions.filter(s => s.score != null).map(s => s.score);
    const highScore = scores.length ? Math.max(...scores) : "—";
    
    const div = document.createElement('div');
    div.className = "stat-widget";
    div.innerHTML = `<div class="label">High Score</div><div class="value">${highScore}</div>`;
    advancedStatsContainer.appendChild(div);
  }

  // 2. WIN / LOSS
  if (showWon) {
    const validSessions = game.sessions.filter(s => s.won != null);
    const wins = validSessions.filter(s => s.won === true).length;
    const losses = validSessions.filter(s => s.won === false).length;
    // Calculate Win %
    const total = wins + losses;
    const rate = total > 0 ? Math.round((wins / total) * 100) : 0;

    const div = document.createElement('div');
    div.className = "stat-widget";
    div.innerHTML = `
      <div class="label">Win Rate (${rate}%)</div>
      <div class="value">
        <span class="win-text">${wins}W</span> - <span class="loss-text">${losses}L</span>
      </div>
    `;
    advancedStatsContainer.appendChild(div);
  }
}

/* =============================
   TRACKER & UPDATES
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
    if (count > 0) cell.classList.add(`level-${Math.min(5, count)}`);
    if (today.getFullYear() === year && today.getMonth() === month && today.getDate() === d) cell.classList.add("today");

    const dayNum = document.createElement("span");
    dayNum.className = "day-number";
    dayNum.textContent = d;
    cell.appendChild(dayNum);

    // Tooltip
    const tooltip = document.createElement("div");
    tooltip.className = "tracker-tooltip";
    const formattedDate = `${String(d).padStart(2,"0")}/${String(month+1).padStart(2,"0")}`;
    
    // Check if we have detailed session data for this day
    const daySessions = (game.sessions || []).filter(s => s.date === dateKey);

    let content = `<strong style="display:block; margin-bottom:4px">${formattedDate}</strong>`;

    if (daySessions.length > 0 && (game.tracking.score || game.tracking.won)) {
      daySessions.forEach(s => {
        let rowHtml = `<div style="margin-top:2px; display:flex; align-items:center;">`;
        if (game.tracking.won && s.won != null) {
          rowHtml += s.won 
            ? `<span class="tooltip-tag tag-win">W</span>` 
            : `<span class="tooltip-tag tag-loss">L</span>`;
        }
        if (game.tracking.score && s.score != null) {
          rowHtml += `<span class="tooltip-tag tag-score">${s.score}</span>`;
        }
        if ((!game.tracking.won || s.won == null) && (!game.tracking.score || s.score == null)) {
          rowHtml += `<span>Play logged</span>`;
        }
        rowHtml += `</div>`;
        content += rowHtml;
      });
    } else {
      content += `<div>${count} play${count !== 1 ? "s" : ""}</div>`;
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

async function handlePlayClick(dateKey, delta) {
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

  const daySessions = (game.sessions || []).filter(s => s.date === dateKey);
  
  if (daySessions.length <= 1) {
    removeSessionDirectly(dateKey, daySessions[0]); 
    return;
  }

  const allIdentical = daySessions.every(s => {
    const first = daySessions[0];
    return s.won === first.won && s.score === first.score;
  });

  if (allIdentical) {
    removeSessionDirectly(dateKey, daySessions[daySessions.length - 1]);
  } else {
    showRemovalModal(dateKey, daySessions);
  }
}

async function removeSessionDirectly(dateKey, sessionObj) {
  if (sessionObj) {
    const idx = game.sessions.indexOf(sessionObj);
    if (idx > -1) game.sessions.splice(idx, 1);
  } else {
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
      <p style="text-align:center; color:var(--subtext); margin-bottom:1rem">Select which play to remove for ${dateKey}</p>
      <div style="max-height:300px; overflow-y:auto; border:1px solid var(--border); border-radius:12px;">
  `;

  sessions.forEach((s, i) => {
    let details = [];
    if (game.tracking.won && s.won != null) details.push(s.won ? "Win" : "Loss");
    if (game.tracking.score && s.score != null) details.push(`Score: ${s.score}`);
    if (details.length === 0) details.push(`Play #${i+1}`);

    let icon = s.won ? "🏆" : (s.won === false ? "💀" : "🎲");

    html += `
      <div class="removal-option" data-index="${i}">
        <span style="font-size:1.2rem; margin-right:10px">${icon}</span>
        <span style="flex:1; font-weight:500;">${details.join(" · ")}</span>
        <span style="color:var(--danger)">Delete</span>
      </div>
    `;
  });

  html += `</div></div>`;
  backdrop.innerHTML = html;

  backdrop.querySelector(".close-button").onclick = () => backdrop.remove();
  
  const buttons = backdrop.querySelectorAll(".removal-option");
  buttons.forEach(btn => {
    btn.onclick = async () => {
      const idx = parseInt(btn.dataset.index);
      const sessionToRemove = sessions[idx];
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
      <p style="text-align:center; color:var(--subtext); margin-bottom:1rem">${dateKey}</p>
  `;

  if (game.tracking.score) {
    html += `<input id="logScore" type="number" class="ui-input" placeholder="Enter Score" style="margin-bottom:1rem">`;
  }

  if (game.tracking.won) {
    html += `
      <div style="display:flex; gap:10px; margin-bottom:1rem">
        <button class="result-btn" data-val="win" style="flex:1; background:var(--card); color:var(--text); border:1px solid var(--border)">Won</button>
        <button class="result-btn" data-val="loss" style="flex:1; background:var(--card); color:var(--text); border:1px solid var(--border)">Lost</button>
      </div>
      <input type="hidden" id="logWon" value="">
    `;
  }

  html += `<button id="confirmPlay" style="width:100%">Save Play</button></div>`;
  backdrop.innerHTML = html;

  const winBtn = backdrop.querySelector('button[data-val="win"]');
  const lossBtn = backdrop.querySelector('button[data-val="loss"]');
  const wonInput = backdrop.querySelector('#logWon');

  if (winBtn && lossBtn) {
    winBtn.onclick = () => {
      winBtn.style.background = "rgba(52, 199, 89, 0.2)";
      winBtn.style.borderColor = "var(--success)";
      winBtn.style.color = "var(--success)";
      lossBtn.style.background = "var(--card)";
      lossBtn.style.borderColor = "var(--border)";
      lossBtn.style.color = "var(--text)";
      wonInput.value = "true";
    };
    lossBtn.onclick = () => {
      lossBtn.style.background = "rgba(255, 59, 48, 0.2)";
      lossBtn.style.borderColor = "var(--danger)";
      lossBtn.style.color = "var(--danger)";
      winBtn.style.background = "var(--card)";
      winBtn.style.borderColor = "var(--border)";
      winBtn.style.color = "var(--text)";
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
    ...computeMilestoneBadges(),
    ...computeWinBadges() // NEW
  ];

  if (badges.length === 0) {
    badgeContainer.innerHTML = "<p style='opacity:0.6; width:100%; text-align:center;'>No achievements yet.</p>";
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
    1: { type: "crown",  title: "All-Time King" },
    2: { type: "silver", title: "Grand Strategist" },
    3: { type: "bronze", title: "Pro Player" }
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
  // Added 10, 30, 40 as requested
  const milestones = [
    { value: 50, type: "legend",  title: "Legendary" },
    { value: 40, type: "empire",  title: "Empire Builder" },
    { value: 30, type: "table",   title: "Table Master" },
    { value: 20, type: "guild",   title: "Guild Veteran" },
    { value: 10, type: "dice",    title: "Roller" },
    { value: 5,  type: "dice",    title: "Rookie" }
  ];
  
  // Find only the HIGHEST achieved milestone
  const achieved = milestones.find(m => total >= m.value);
  return achieved ? [{ ...achieved, subtitle: `${achieved.value}+ Plays` }] : [];
}

// NEW: Win Badges (Every 5 up to 50)
function computeWinBadges() {
  if (!game.sessions) return [];
  const wins = game.sessions.filter(s => s.won === true).length;
  if (wins === 0) return [];

  // Generate milestones 50, 45, 40... down to 5
  const winMilestones = [];
  for (let i = 50; i >= 5; i -= 5) {
    winMilestones.push({ value: i, type: "trophy", title: "Victory Road" });
  }

  // Return only the highest unlocked
  const achieved = winMilestones.find(m => wins >= m.value);
  return achieved ? [{ ...achieved, subtitle: `${achieved.value}+ Wins` }] : [];
}

/* ---------- EDIT GAME MODAL ---------- */
editBtn.onclick = () => {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = `
    <div class="modal">
      <div class="close-button">×</div>
      <h2>Edit Game</h2>
      
      <div class="input-header">Basic Info</div>
      <input id="editName" class="ui-input" value="${game.name}" placeholder="Game Name" style="margin-bottom:10px">
      <input id="editImage" class="ui-input" value="${game.image || ''}" placeholder="Image URL" style="margin-bottom:10px">
      
      <div class="input-header">Player Count</div>
      <div class="row">
        <input id="editPMin" type="number" class="ui-input" value="${game.players.min ?? ''}" placeholder="Min">
        <input id="editPMax" type="number" class="ui-input" value="${game.players.max ?? ''}" placeholder="Max">
      </div>

      <div class="input-header">Play Time (Minutes)</div>
      <div class="row">
        <input id="editTMin" type="number" class="ui-input" value="${game.playTime.min ?? ''}" placeholder="Min">
        <input id="editTMax" type="number" class="ui-input" value="${game.playTime.max ?? ''}" placeholder="Max">
      </div>

      <div class="toggle-group">
        <label style="display:flex; align-items:center; gap:8px">
          <input type="checkbox" id="editTrackScore" ${game.tracking.score ? 'checked' : ''} style="width:18px; height:18px"> Track Score
        </label>
        <label style="display:flex; align-items:center; gap:8px">
          <input type="checkbox" id="editTrackWon" ${game.tracking.won ? 'checked' : ''} style="width:18px; height:18px"> Track W/L
        </label>
      </div>

      <div class="input-header">Rating & Review</div>
      <input id="editRating" class="ui-input" type="number" step="0.1" value="${game.rating ?? ''}" placeholder="Rating (0-10)" style="margin-bottom:10px">
      <textarea id="editReview" placeholder="Your review...">${game.review || ''}</textarea>
      
      <button id="saveEdit" style="width:100%; margin-top:1rem; margin-bottom:10px">Save Changes</button>
      <button id="deleteGameBtn" class="danger" style="width:100%">Delete Game</button>
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
    if (confirm(`Are you sure you want to delete "${game.name}"?`)) {
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
