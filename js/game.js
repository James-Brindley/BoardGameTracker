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
  if (!game.playHistory) game.playHistory = {};

  document.title = game.name;
  
  if(editBtn) editBtn.onclick = showEditModal;

  render(games); // Pass all games for badge logic
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

  renderAdvancedStats();
  renderTracker();
  if(allGames.length > 0) renderBadges(allGames);
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

    // TOOLTIP LOGIC (Updated for stacking)
    const tooltip = document.createElement("div");
    tooltip.className = "tracker-tooltip";
    const formattedDate = `${String(d).padStart(2,"0")}/${String(month+1).padStart(2,"0")}`;
    const daySessions = (game.sessions || []).filter(s => s.date === dateKey);
    let content = `<strong style="display:block; margin-bottom:4px">${formattedDate}</strong>`;

    if (daySessions.length > 0 && (game.tracking.score || game.tracking.won)) {
      // Check if any session has a score. If so, use detailed list mode.
      const anyScore = daySessions.some(s => s.score != null);

      if (!anyScore && game.tracking.won) {
        // STACK MODE: Just Wins/Losses
        const wins = daySessions.filter(s => s.won === true).length;
        const losses = daySessions.filter(s => s.won === false).length;
        let stackHtml = `<div style="margin-top:2px;">`;
        if (wins > 0) stackHtml += `<span class="tooltip-win">W</span> x${wins} `;
        if (losses > 0) stackHtml += `<span class="tooltip-loss">L</span> x${losses}`;
        stackHtml += `</div>`;
        content += stackHtml;
      } else {
        // LIST MODE: Detailed
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
      }
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
    // Check identical
    const first = daySessions[0];
    const allSame = daySessions.every(s => s.won === first.won && s.score === first.score);
    if (allSame) removeSessionDirectly(dateKey, daySessions[daySessions.length - 1]);
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
  const allGames = await getGames(); // Refresh for badges
  render(allGames);
}

// BADGE LOGIC OVERHAUL
function renderBadges(allGames) {
    badgeContainer.innerHTML = "";
    
    // Helper: Get Tier Class
    const getTier = (val) => {
        if (val >= 50) return "tier-legend"; // Legend
        if (val >= 40) return "tier-diamond";
        if (val >= 30) return "tier-gold";
        if (val >= 20) return "tier-silver";
        if (val >= 5) return "tier-bronze";
        return "tier-bronze";
    };

    // 1. ALL-TIME RANK
    const sorted = [...allGames].sort((a,b) => (b.plays||0) - (a.plays||0));
    const rank = sorted.findIndex(g => g.id === game.id);
    if(rank === 0 && game.plays > 0) createBadge("All-Time #1", "Top Played", "tier-gold");
    else if(rank === 1 && game.plays > 0) createBadge("All-Time #2", "2nd Place", "tier-silver");
    else if(rank === 2 && game.plays > 0) createBadge("All-Time #3", "3rd Place", "tier-bronze");

    // 2. PLAY MILESTONES (5, 10, 15... 50)
    const p = game.plays || 0;
    // Find highest milestone 5-50
    let bestPlay = 0;
    for(let i=5; i<=50; i+=5) { if(p >= i) bestPlay = i; }
    
    if(bestPlay > 0) {
        createBadge("Veteran", `${bestPlay}+ Plays`, getTier(bestPlay));
    }

    // 3. WIN MILESTONES (5, 10... 50)
    if (game.sessions) {
        const wins = game.sessions.filter(s => s.won === true).length;
        let bestWin = 0;
        for(let i=5; i<=50; i+=5) { if(wins >= i) bestWin = i; }
        
        if(bestWin > 0) {
            createBadge("Victor", `${bestWin}+ Wins`, getTier(bestWin));
        }
    }

    // 4. MONTHLY CHAMPION (Previous Months Only)
    // Counts how many times this game was #1 in a past month
    const myMonths = new Set(Object.keys(game.playHistory).map(d => d.slice(0, 7)));
    const currentMonthKey = new Date().toISOString().slice(0, 7); // "YYYY-MM"
    
    let champMonths = []; // Store "January 2024" strings

    myMonths.forEach(month => {
        if (month >= currentMonthKey) return; // Skip current or future

        // Check if this game is #1 for that month
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
            const [y, m] = month.split('-');
            const dateStr = new Date(y, m-1).toLocaleString('default', { month: 'short', year: '2-digit' });
            champMonths.push(dateStr);
        }
    });

    if (champMonths.length > 0) {
        // Calculate Tier based on count (1x = bronze, 5x = silver, etc.)
        // Mapping arbitrary count to existing tiers for visual flair
        let count = champMonths.length;
        let tierClass = "tier-bronze";
        if(count >= 3) tierClass = "tier-silver";
        if(count >= 5) tierClass = "tier-gold";
        if(count >= 10) tierClass = "tier-legend";

        // Create Badge with Tooltip logic via title attribute
        const badgeDiv = document.createElement("div");
        badgeDiv.className = `badge ${tierClass}`;
        badgeDiv.title = "Months Won:\n" + champMonths.join("\n"); // Native browser tooltip
        badgeDiv.innerHTML = `
            <div class="badge-title">Champion</div>
            <div class="badge-sub">x${count} Months</div>
        `;
        badgeContainer.appendChild(badgeDiv);
    }

    if (badgeContainer.children.length === 0) {
        badgeContainer.innerHTML = `<p style="grid-column:1/-1;text-align:center;opacity:0.5;font-size:0.8rem">Play more to earn badges.</p>`;
    }
}

function createBadge(title, sub, tierClass) {
    const el = document.createElement("div");
    el.className = `badge ${tierClass}`;
    el.innerHTML = `<div class="badge-title">${title}</div><div class="badge-sub">${sub}</div>`;
    badgeContainer.appendChild(el);
}

// Modal & Nav (Existing code)
function showEditModal() {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = `
    <div class="modal"><div class="close-button">×</div><h2>Edit Game</h2>
    <div class="input-header">Basic</div><input id="editName" class="ui-input" value="${game.name}">
    <input id="editImage" class="ui-input" value="${game.image||''}" placeholder="Image URL" style="margin-top:10px">
    <div class="input-header">Stats</div>
    <div class="row"><input id="editPMin" class="ui-input" value="${game.players.min||''}"><input id="editPMax" class="ui-input" value="${game.players.max||''}"></div>
    <div class="row"><input id="editTMin" class="ui-input" value="${game.playTime.min||''}"><input id="editTMax" class="ui-input" value="${game.playTime.max||''}"></div>
    <div class="toggle-group" style="margin-top:10px"><label><input type="checkbox" id="editTrackScore" ${game.tracking.score?'checked':''}> Score</label><label><input type="checkbox" id="editTrackWon" ${game.tracking.won?'checked':''}> Win/Loss</label></div>
    <div class="input-header">Review</div><input id="editRating" class="ui-input" value="${game.rating||''}" placeholder="0-10"><textarea id="editReview" style="margin-top:5px">${game.review||''}</textarea>
    <button id="saveEdit" style="width:100%;margin-top:15px">Save</button><button id="deleteGameBtn" class="danger" style="width:100%;margin-top:10px">Delete</button></div>
  `;
  backdrop.querySelector(".close-button").onclick=()=>backdrop.remove();
  backdrop.querySelector("#saveEdit").onclick=async()=>{
      game.name=backdrop.querySelector("#editName").value;
      game.image=backdrop.querySelector("#editImage").value;
      game.rating=parseFloat(backdrop.querySelector("#editRating").value);
      game.review=backdrop.querySelector("#editReview").value;
      game.players={min:backdrop.querySelector("#editPMin").value,max:backdrop.querySelector("#editPMax").value};
      game.playTime={min:backdrop.querySelector("#editTMin").value,max:backdrop.querySelector("#editTMax").value};
      game.tracking={score:backdrop.querySelector("#editTrackScore").checked,won:backdrop.querySelector("#editTrackWon").checked};
      await updateGame(game); backdrop.remove(); saveGame();
  };
  backdrop.querySelector("#deleteGameBtn").onclick=async()=>{if(confirm("Delete?")){await deleteGame(game.id);window.location.href="catalogue.html";}};
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
    if(confirm("Remove last play?")) removeSessionDirectly(dateKey, sessions[sessions.length-1]);
}

document.getElementById("prevMonth").onclick = () => { view.setMonth(view.getMonth() - 1); renderTracker(); };
document.getElementById("nextMonth").onclick = () => { view.setMonth(view.getMonth() + 1); renderTracker(); };

init();
