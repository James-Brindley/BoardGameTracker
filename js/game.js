import { getGames, updateGame, deleteGame, uploadImage } from "./data.js";

let game = null;
let view = new Date();

// Elements
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

  const games = await getGames();
  game = games.find(g => g.id === id);

  if (!game) {
    location.href = "catalogue.html";
    return;
  }

  // Set defaults
  if (!game.tracking) game.tracking = { score: false, won: false };
  if (!game.sessions) game.sessions = [];
  if (!game.tags) game.tags = [];
  if (!game.playHistory) game.playHistory = {};

  document.title = game.name;
  
  // FIX: Bind Edit Button Here
  if (editBtn) {
      editBtn.onclick = showEditModal;
  }

  render();
}

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

  tagsContainer.innerHTML = game.tags.map(t => `<span class="tag-pill">${t}</span>`).join("");

  renderAdvancedStats();
  renderTracker();
  renderBadges();
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
  
  if (monthLabel) monthLabel.textContent = view.toLocaleString("default", { month: "long", year: "numeric" });
  
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
    
    // Safety check for game.sessions
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
  render();
}

// EDIT MODAL
function showEditModal() {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = `
    <div class="modal">
      <div class="close-button">×</div>
      <h2>Edit Game</h2>
      
      <div class="input-header">Basic Info</div>
      <input id="editName" class="ui-input" value="${game.name}" placeholder="Game Name">
      
      <div style="display:flex; gap:10px; align-items:center; margin-top:10px;">
        <input id="editImage" class="ui-input" value="${game.image || ''}" placeholder="Image URL">
        <label for="imgUploadEdit" class="secondary" style="padding:10px; border-radius:12px; cursor:pointer;">Upload</label>
        <input id="imgUploadEdit" type="file" hidden>
      </div>
      
      <div class="input-header">Specs</div>
      <div class="row">
        <input id="editPMin" type="number" class="ui-input" value="${game.players.min ?? ''}" placeholder="Min P">
        <input id="editPMax" type="number" class="ui-input" value="${game.players.max ?? ''}" placeholder="Max P">
      </div>
      <div class="row">
        <input id="editTMin" type="number" class="ui-input" value="${game.playTime.min ?? ''}" placeholder="Min T">
        <input id="editTMax" type="number" class="ui-input" value="${game.playTime.max ?? ''}" placeholder="Max T">
      </div>

      <div class="input-header">Tags</div>
      <input id="editTags" class="ui-input" value="${(game.tags || []).join(', ')}">

      <div class="toggle-group" style="margin-top:1rem">
        <label><input type="checkbox" id="editTrackScore" ${game.tracking.score ? 'checked' : ''}> Score</label>
        <label><input type="checkbox" id="editTrackWon" ${game.tracking.won ? 'checked' : ''}> Win/Loss</label>
      </div>

      <div class="input-header">Review</div>
      <input id="editRating" class="ui-input" type="number" step="0.1" value="${game.rating ?? ''}" placeholder="Rating 0-10">
      <textarea id="editReview" placeholder="Review..." style="margin-top:10px">${game.review || ''}</textarea>
      
      <button id="saveEdit" style="width:100%; margin-top:1.5rem">Save</button>
      <button id="deleteGameBtn" class="danger" style="width:100%; margin-top:10px">Delete</button>
    </div>
  `;

  backdrop.querySelector(".close-button").onclick = () => backdrop.remove();

  // Upload
  const fileIn = backdrop.querySelector("#imgUploadEdit");
  fileIn.onchange = async () => {
      if(fileIn.files[0]) {
          try {
              const url = await uploadImage(fileIn.files[0]);
              backdrop.querySelector("#editImage").value = url;
              alert("Image Uploaded");
          } catch(e) { alert("Upload failed"); }
      }
  };

  // Save
  backdrop.querySelector("#saveEdit").onclick = async () => {
      game.name = backdrop.querySelector("#editName").value;
      game.image = backdrop.querySelector("#editImage").value;
      game.review = backdrop.querySelector("#editReview").value;
      game.rating = parseFloat(backdrop.querySelector("#editRating").value);
      game.tags = backdrop.querySelector("#editTags").value.split(",").map(t=>t.trim()).filter(t=>t);
      game.players = { min: backdrop.querySelector("#editPMin").value, max: backdrop.querySelector("#editPMax").value };
      game.playTime = { min: backdrop.querySelector("#editTMin").value, max: backdrop.querySelector("#editTMax").value };
      game.tracking = { score: backdrop.querySelector("#editTrackScore").checked, won: backdrop.querySelector("#editTrackWon").checked };
      
      await updateGame(game);
      backdrop.remove();
      render();
  };

  // Delete
  backdrop.querySelector("#deleteGameBtn").onclick = async () => {
      if(confirm("Delete this game?")) {
          await deleteGame(game.id);
          window.location.href = "catalogue.html";
      }
  };

  document.body.appendChild(backdrop);
}

function showPlayModal(dateKey) {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.innerHTML = `
      <div class="modal">
        <div class="close-button">×</div>
        <h2>Log Play</h2>
        <p style="text-align:center">${dateKey}</p>
        ${game.tracking.score ? `<input id="logScore" class="ui-input" type="number" placeholder="Score">` : ''}
        ${game.tracking.won ? `<div style="display:flex;gap:10px;margin-top:10px"><button id="btnWin" style="flex:1" class="secondary">Won</button><button id="btnLoss" style="flex:1" class="secondary">Lost</button></div><input type="hidden" id="logWon">` : ''}
        <button id="confirmPlay" style="width:100%;margin-top:1rem">Save</button>
      </div>
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
        const score = backdrop.querySelector("#logScore")?.value;
        const won = backdrop.querySelector("#logWon")?.value;
        game.sessions.push({ date: dateKey, timestamp: Date.now(), score: score, won: won === "true" ? true : (won === "false" ? false : null) });
        updatePlayCount(dateKey, 1);
        await saveGame();
        backdrop.remove();
    };
    document.body.appendChild(backdrop);
}

function showRemovalModal(dateKey, sessions) {
    if(confirm("Remove last play?")) removeSessionDirectly(dateKey, sessions[sessions.length-1]);
}

// BADGES - Corrected Logic
function renderBadges() {
    badgeContainer.innerHTML = "";
    
    // Play Milestones
    const plays = game.plays || 0;
    if(plays >= 50) createBadge("Legend", "50+ Plays", "legend");
    else if(plays >= 30) createBadge("Master", "30+ Plays", "guild");
    else if(plays >= 10) createBadge("Roller", "10+ Plays", "dice");
    
    // Wins
    if (game.sessions) {
        const wins = game.sessions.filter(s => s.won === true).length;
        if(wins >= 50) createBadge("Champion", "50 Wins", "gold");
        else if(wins >= 25) createBadge("Winner", "25 Wins", "silver");
        else if(wins >= 5) createBadge("Rookie", "5 Wins", "bronze");
    }
}

function createBadge(title, sub, type) {
    const el = document.createElement("div");
    el.className = `badge badge-${type}`;
    el.innerHTML = `<div class="badge-title">${title}</div><div class="badge-sub">${sub}</div>`;
    badgeContainer.appendChild(el);
}

// Nav
document.getElementById("prevMonth").onclick = () => { view.setMonth(view.getMonth() - 1); renderTracker(); };
document.getElementById("nextMonth").onclick = () => { view.setMonth(view.getMonth() + 1); renderTracker(); };

init();
