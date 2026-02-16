import { getGames, updateGame, deleteGame } from "./data.js";

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

// Containers
let advancedStatsContainer = document.getElementById("advancedStats");
if(!advancedStatsContainer) {
    advancedStatsContainer = document.createElement('div');
    advancedStatsContainer.id = "advancedStats";
    document.querySelector('.game-stats-grid').after(advancedStatsContainer);
}

let tagsContainer = document.getElementById("gameTags");
if (!tagsContainer) {
    tagsContainer = document.createElement("div");
    tagsContainer.id = "gameTags";
    tagsContainer.className = "tags-container";
    document.querySelector(".game-hero").appendChild(tagsContainer);
}

async function init() {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  const games = await getGames(); // Fetch ALL games to calculate ranks
  game = games.find(g => g.id === id);

  if (!game) {
    location.href = "catalogue.html";
    return;
  }

  // Set defaults
  if (!game.tracking) game.tracking = { score: false, won: false };
  if (!game.sessions) game.sessions = [];
  if (!game.playHistory) game.playHistory = {};
  if (!game.tags) game.tags = [];

  document.title = game.name;
  
  if (editBtn) editBtn.onclick = showEditModal;

  render(games); // Pass all games to render for badge calculation
}

function render(allGames = []) {
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

  if(game.tags) tagsContainer.innerHTML = game.tags.map(t => `<span class="tag-pill">${t}</span>`).join("");

  renderAdvancedStats();
  renderTracker();
  if (allGames.length > 0) renderBadges(allGames);
}

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

  if (showScore) {
    const scores = game.sessions.filter(s => s.score != null).map(s => s.score);
    const highScore = scores.length ? Math.max(...scores) : "—";
    const div = document.createElement('div');
    div.className = "stat-widget";
    div.innerHTML = `<div class="label">High Score</div><div class="value">${highScore}</div>`;
    advancedStatsContainer.appendChild(div);
  }

  if (showWon) {
    const validSessions = game.sessions.filter(s => s.won != null);
    const wins = validSessions.filter(s => s.won === true).length;
    const losses = validSessions.filter(s => s.won === false).length;
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

function renderTracker() {
  if (!trackerGrid) return;
  trackerGrid.innerHTML = "";
  const year = view.getFullYear();
  const month = view.getMonth();
  const today = new Date();
  
  if(monthLabel) monthLabel.textContent = view.toLocaleString("default", { month: "long", year: "numeric" });
  
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
    const daySessions = (game.sessions || []).filter(s => s.date === dateKey);
    let content = `<strong style="display:block; margin-bottom:4px">${formattedDate}</strong>`;

    if (daySessions.length > 0 && (game.tracking.score || game.tracking.won)) {
      daySessions.forEach(s => {
        let rowHtml = `<div style="margin-top:2px; display:flex; align-items:center; gap:4px">`;
        if (game.tracking.won && s.won != null) {
          rowHtml += s.won 
            ? `<span class="tooltip-tag tag-win">W</span>` 
            : `<span class="tooltip-tag tag-loss">L</span>`;
        }
        if (game.tracking.score && s.score != null) {
          rowHtml += `<span class="tooltip-tag tag-score">${s.score}</span>`;
        }
        if ((!game.tracking.won || s.won == null) && (!game.tracking.score || s.score == null)) {
          rowHtml += `<span style="font-size:0.7rem">Played</span>`;
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
  } else {
    const allIdentical = daySessions.every(s => s.won === daySessions[0].won && s.score === daySessions[0].score);
    if (allIdentical) removeSessionDirectly(dateKey, daySessions[daySessions.length - 1]);
    else showRemovalModal(dateKey, daySessions);
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

function updatePlayCount(dateKey, delta) {
  const current = game.playHistory[dateKey] || 0;
  const next = Math.max(0, current + delta);
  if (next === 0) delete game.playHistory[dateKey];
  else game.playHistory[dateKey] = next;
  game.plays = Object.values(game.playHistory).reduce((a, b) => a + b, 0);
}

async function saveGame() {
  await updateGame(game);
  // Re-fetch all games to update rank badges correctly
  const allGames = await getGames();
  render(allGames);
}

// === BADGE LOGIC ===
function renderBadges(allGames) {
    badgeContainer.innerHTML = "";
    
    // 1. ALL TIME RANK (Gold/Silver/Bronze)
    const sortedByPlays = [...allGames].sort((a,b) => (b.plays||0) - (a.plays||0));
    const rankIndex = sortedByPlays.findIndex(g => g.id === game.id);
    
    if (rankIndex === 0 && game.plays > 0) createBadge("All-Time #1", "Top Played", "shape-star");
    else if (rankIndex === 1 && game.plays > 0) createBadge("All-Time #2", "2nd Place", "shape-hex");
    else if (rankIndex === 2 && game.plays > 0) createBadge("All-Time #3", "3rd Place", "shape-shield");

    // 2. MONTHLY CHAMPION (Previous Months)
    const myMonths = new Set(Object.keys(game.playHistory).map(d => d.slice(0, 7)));
    let isMonthlyChamp = false;
    
    myMonths.forEach(month => {
        // Calculate plays for THIS month for ALL games
        let maxPlays = 0;
        let bestGameId = null;
        
        allGames.forEach(g => {
            let mPlays = 0;
            Object.entries(g.playHistory || {}).forEach(([d, c]) => {
                if (d.startsWith(month)) mPlays += c;
            });
            if (mPlays > maxPlays) {
                maxPlays = mPlays;
                bestGameId = g.id;
            }
        });

        if (bestGameId === game.id && maxPlays > 0) {
            isMonthlyChamp = true;
        }
    });

    if (isMonthlyChamp) {
        createBadge("Champion", "Monthly Top", "shape-star"); // Reuse gold star
    }

    // 3. WINS (Upgrading)
    if (game.sessions) {
        const wins = game.sessions.filter(s => s.won === true).length;
        let winBadge = null;
        if (wins >= 50) winBadge = { t: "Dominator", s: "50 Wins", c: "tier-legend" };
        else if (wins >= 25) winBadge = { t: "Conqueror", s: "25 Wins", c: "tier-menacing" };
        else if (wins >= 10) winBadge = { t: "Victor", s: "10 Wins", c: "tier-gold" };
        else if (wins >= 5) winBadge = { t: "Winner", s: "5 Wins", c: "tier-silver" };
        
        if (winBadge) createBadge(winBadge.t, winBadge.s, "shape-diamond " + winBadge.c);
    }

    // 4. PLAYS (Upgrading)
    const p = game.plays || 0;
    let playBadge = null;
    if (p >= 50) playBadge = { t: "Legend", s: "50+ Plays", c: "tier-legend" };
    else if (p >= 30) playBadge = { t: "Warlord", s: "30+ Plays", c: "tier-menacing" };
    else if (p >= 20) playBadge = { t: "Veteran", s: "20+ Plays", c: "tier-gold" };
    else if (p >= 10) playBadge = { t: "Regular", s: "10+ Plays", c: "tier-silver" };
    else if (p >= 5) playBadge = { t: "Novice", s: "5+ Plays", c: "tier-bronze" };

    if (playBadge) createBadge(playBadge.t, playBadge.s, "shape-crest " + playBadge.c);

    if (badgeContainer.children.length === 0) {
        badgeContainer.innerHTML = `<p style="grid-column:1/-1; text-align:center; opacity:0.5; font-size:0.8rem">No badges earned yet.</p>`;
    }
}

function createBadge(title, sub, classes) {
    const el = document.createElement("div");
    el.className = `badge ${classes}`;
    el.innerHTML = `<div class="badge-title">${title}</div><div class="badge-sub">${sub}</div>`;
    badgeContainer.appendChild(el);
}

// Modal Logic
function showEditModal() {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = `
    <div class="modal">
      <div class="close-button">×</div>
      <h2>Edit Game</h2>
      <div class="input-header">Basic Info</div>
      <input id="editName" class="ui-input" value="${game.name}">
      <input id="editImage" class="ui-input" value="${game.image || ''}" placeholder="Image URL" style="margin-top:10px">
      <div class="input-header">Stats</div>
      <div class="row"><input id="editPMin" class="ui-input" value="${game.players.min||''}"><input id="editPMax" class="ui-input" value="${game.players.max||''}"></div>
      <div class="row"><input id="editTMin" class="ui-input" value="${game.playTime.min||''}"><input id="editTMax" class="ui-input" value="${game.playTime.max||''}"></div>
      <div class="input-header">Tags</div>
      <input id="editTags" class="ui-input" value="${(game.tags||[]).join(', ')}">
      <div class="toggle-group" style="margin-top:10px"><label><input type="checkbox" id="editTrackScore" ${game.tracking.score?'checked':''}> Score</label><label><input type="checkbox" id="editTrackWon" ${game.tracking.won?'checked':''}> Win/Loss</label></div>
      <div class="input-header">Review</div>
      <input id="editRating" class="ui-input" value="${game.rating||''}">
      <textarea id="editReview" style="margin-top:5px">${game.review||''}</textarea>
      <button id="saveEdit" style="width:100%; margin-top:15px">Save</button>
      <button id="deleteGameBtn" class="danger" style="width:100%; margin-top:10px">Delete</button>
    </div>
  `;
  backdrop.querySelector(".close-button").onclick = () => backdrop.remove();
  
  backdrop.querySelector("#saveEdit").onclick = async () => {
      game.name = backdrop.querySelector("#editName").value;
      game.image = backdrop.querySelector("#editImage").value;
      game.rating = parseFloat(backdrop.querySelector("#editRating").value);
      game.review = backdrop.querySelector("#editReview").value;
      game.tags = backdrop.querySelector("#editTags").value.split(",").map(t=>t.trim()).filter(t=>t);
      game.tracking.score = backdrop.querySelector("#editTrackScore").checked;
      game.tracking.won = backdrop.querySelector("#editTrackWon").checked;
      await updateGame(game);
      backdrop.remove();
      saveGame(); // Refetch
  };
  
  backdrop.querySelector("#deleteGameBtn").onclick = async () => {
      if(confirm("Delete?")) { await deleteGame(game.id); window.location.href="catalogue.html"; }
  };
  document.body.appendChild(backdrop);
}

function showPlayModal(dateKey) {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.innerHTML = `
      <div class="modal"><div class="close-button">×</div><h2>Log Play</h2><p style="text-align:center">${dateKey}</p>
      ${game.tracking.score ? `<input id="logScore" class="ui-input" type="number" placeholder="Score">` : ''}
      ${game.tracking.won ? `<div style="display:flex;gap:10px;margin-top:10px"><button id="btnWin" style="flex:1" class="secondary">Won</button><button id="btnLoss" style="flex:1" class="secondary">Lost</button></div><input type="hidden" id="logWon">` : ''}
      <button id="confirmPlay" style="width:100%;margin-top:1rem">Save</button></div>
    `;
    backdrop.querySelector(".close-button").onclick = () => backdrop.remove();
    if(game.tracking.won) {
        const btnWin = backdrop.querySelector("#btnWin");
        const btnLoss = backdrop.querySelector("#btnLoss");
        const inp = backdrop.querySelector("#logWon");
        btnWin.onclick = () => { inp.value="true"; btnWin.style.background="var(--success)"; btnWin.style.color="white"; btnLoss.style.background="var(--bg)"; btnLoss.style.color="var(--accent)"; };
        btnLoss.onclick = () => { inp.value="false"; btnLoss.style.background="var(--danger)"; btnLoss.style.color="white"; btnWin.style.background="var(--bg)"; btnWin.style.color="var(--accent)"; };
    }
    backdrop.querySelector("#confirmPlay").onclick = async () => {
        const s = backdrop.querySelector("#logScore")?.value;
        const w = backdrop.querySelector("#logWon")?.value;
        game.sessions.push({ date: dateKey, timestamp: Date.now(), score: s, won: w==="true"?true:(w==="false"?false:null) });
        updatePlayCount(dateKey, 1);
        await saveGame();
        backdrop.remove();
    };
    document.body.appendChild(backdrop);
}

function showRemovalModal(dateKey, sessions) {
    if(confirm("Delete last play?")) removeSessionDirectly(dateKey, sessions[sessions.length-1]);
}

document.getElementById("prevMonth").onclick = () => { view.setMonth(view.getMonth() - 1); renderTracker(); };
document.getElementById("nextMonth").onclick = () => { view.setMonth(view.getMonth() + 1); renderTracker(); };

init();
