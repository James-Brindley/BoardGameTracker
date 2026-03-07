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

  if (!game.tracking) game.tracking = { won: false, status: "owned", metrics: [] };
  if (!game.tracking.status) game.tracking.status = "owned"; 
  if (!game.tracking.metrics) game.tracking.metrics = [];
  if (!game.sessions) game.sessions = [];
  if (!game.playHistory) game.playHistory = {};

  document.title = game.name;
  if (editBtn) editBtn.onclick = showEditModal;

  render(games);
}

function render(allGames = []) {
  title.textContent = game.name;
  image.src = game.image || "https://via.placeholder.com/800x360";
  plays.textContent = game.plays || 0;
  
  if (game.rating != null) {
      ratingView.textContent = `★ ${game.rating}`;
      ratingView.style.display = 'inline-block';
  } else {
      ratingView.style.display = 'none';
  }
  
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

  let statusContainer = document.getElementById("gameStatusPill");
  if (!statusContainer) {
      statusContainer = document.createElement("div");
      statusContainer.id = "gameStatusPill";
      statusContainer.style.marginBottom = "1.5rem";
      title.after(statusContainer);
  }
  
  const sMap = { "owned": "Owned", "wishlist": "Wishlist", "friends": "Friend's Copy", "previously_owned": "Previously Owned" };
  let sColor = "rgba(16, 185, 129, 0.1)"; let tColor = "var(--success)"; // Owned Green
  if (game.tracking.status === "wishlist") { sColor = "rgba(0,122,255,0.1)"; tColor = "#007AFF"; }
  else if (game.tracking.status === "friends" || game.tracking.status === "previously_owned") { sColor = "rgba(120,120,128,0.1)"; tColor = "var(--subtext)"; }
  
  statusContainer.innerHTML = `<span style="padding:4px 12px; border-radius:99px; font-size:0.8rem; font-weight:800; background:${sColor}; color:${tColor};">${sMap[game.tracking.status] || "Owned"}</span>`;

  renderAdvancedStats();
  renderTracker();
  if (allGames.length > 0) renderBadges(allGames);
}

// Global helper to find the best values for highlighting
function getBestValues() {
    const bests = {};
    if (game.tracking.metrics) {
        game.tracking.metrics.forEach(m => {
            const validVals = game.sessions
                .map(s => s.results && s.results[m.name])
                .filter(v => v != null && v !== "")
                .map(Number);
            if (validVals.length > 0) {
                bests[m.name] = m.bestIs === "highest" ? Math.max(...validVals) : Math.min(...validVals);
            }
        });
    }
    return bests;
}

function renderAdvancedStats() {
  const hasData = game.sessions && game.sessions.length > 0;
  const showWon = game.tracking.won || (hasData && game.sessions.some(s => s.won != null));
  const hasMetrics = game.tracking.metrics && game.tracking.metrics.length > 0;

  advancedStatsContainer.innerHTML = "";
  advancedStatsContainer.className = "advanced-stats-container";
  advancedStatsContainer.style.flexWrap = 'wrap'; 
  
  if (!hasMetrics && !showWon) {
    advancedStatsContainer.style.display = 'none';
    return;
  }
  
  advancedStatsContainer.style.display = 'flex';
  const bestValues = getBestValues();

  // DYNAMIC METRICS WIDGETS (with Tie Counts & Gold Highlighting!)
  if (hasMetrics) {
      game.tracking.metrics.forEach(metric => {
          const validVals = game.sessions
              .map(s => s.results && s.results[metric.name])
              .filter(v => v != null && v !== "")
              .map(Number);

          if (validVals.length > 0) {
              const best = bestValues[metric.name];
              const count = validVals.filter(v => v === best).length;
              
              // Display tie count if it happened more than once
              const countHtml = count > 1 ? `<span style="font-size:0.55em; opacity:0.9; font-weight:800; margin-left:6px; color:var(--subtext);">(x${count})</span>` : "";

              const div = document.createElement('div');
              div.className = "stat-widget";
              div.style.borderColor = "rgba(245, 166, 35, 0.4)"; // Subtle gold border
              div.innerHTML = `
                <div class="label">Best ${metric.name}</div>
                <div class="value" style="color: #F5A623; text-shadow: 0 4px 12px rgba(245, 166, 35, 0.3);">${best}${countHtml}</div>
              `;
              advancedStatsContainer.appendChild(div);
          }
      });
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
  const bestValues = getBestValues();

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

    const tooltip = document.createElement("div");
    tooltip.className = "tracker-tooltip";
    const formattedDate = `${String(d).padStart(2,"0")}/${String(month+1).padStart(2,"0")}`;
    const daySessions = (game.sessions || []).filter(s => s.date === dateKey);
    let content = `<strong style="display:block; margin-bottom:6px; font-size:0.9rem;">${formattedDate}</strong>`;

    // Safe-Guard: Check if there's any historical data AT ALL, even if tracking is currently disabled
    const hasHistoricalData = daySessions.some(s => s.won != null || (s.results && Object.keys(s.results).length > 0));

    if (daySessions.length > 0 && (game.tracking.metrics.length > 0 || game.tracking.won || hasHistoricalData)) {
      const hasResultsToday = daySessions.some(s => s.results && Object.keys(s.results).length > 0);

      // Stack simple Win/Loss to save space if NO detailed stats exist for ANY game today
      if (!hasResultsToday && game.tracking.won) {
        const wins = daySessions.filter(s => s.won === true).length;
        const losses = daySessions.filter(s => s.won === false).length;
        let stackRow = `<div>`;
        if (wins > 0) stackRow += `<span class="tooltip-win">W</span> x${wins} `;
        if (losses > 0) stackRow += `<span class="tooltip-loss">L</span> x${losses}`;
        stackRow += `</div>`;
        content += stackRow;
      } else {
        // Build Individual Retaining Boxes for each session
        daySessions.forEach((s, idx) => {
          let rowHtml = `<div style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.15); border-radius:10px; padding:6px 10px; margin-bottom:6px; display:flex; align-items:center; flex-wrap:wrap; gap:6px;">`;
          
          if (daySessions.length > 1) {
              rowHtml += `<span style="font-size:0.65rem; color:rgba(255,255,255,0.5); font-weight:900;">#${idx+1}</span>`;
          }

          if (s.won != null) {
            rowHtml += s.won ? `<span class="tooltip-win">W</span>` : `<span class="tooltip-loss">L</span>`;
          }

          if (s.results && Object.keys(s.results).length > 0) {
            Object.entries(s.results).forEach(([k, v]) => {
                // Gold Highlight Logic inside tooltip
                const isBest = bestValues[k] !== undefined && Number(v) === bestValues[k];
                const styleStr = isBest 
                    ? `color:#F5A623; border-color:#F5A623; font-weight:900; box-shadow: 0 2px 8px rgba(245,166,35,0.2);` 
                    : `color:white; border-color:rgba(255,255,255,0.15);`;

                rowHtml += `<span style="font-size:0.7rem; background:rgba(0,0,0,0.25); border:1px solid transparent; padding:3px 8px; border-radius:6px; ${styleStr}">${k}: ${v}</span>`;
            });
          }
          
          if ((s.won == null) && (!s.results || Object.keys(s.results).length === 0)) {
            rowHtml += `<span style="font-size:0.7rem; color:rgba(255,255,255,0.6);">Played</span>`;
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
    if (game.tracking.metrics.length > 0 || game.tracking.won) {
      showPlayModal(dateKey);
    } else {
      updatePlayCount(dateKey, 1);
      game.sessions.push({ date: dateKey, timestamp: Date.now(), results: {} });
      await saveGame();
    }
    return;
  }
  
  // Right-Click handling now OPENS THE MANAGE MODAL to view/edit/delete
  const daySessions = (game.sessions || []).filter(s => s.date === dateKey);
  if (daySessions.length > 0) {
      showManagePlaysModal(dateKey, daySessions);
  }
}

// --- NEW "MANAGE PLAYS" MODAL (View/Delete/Edit specific sessions) ---
function showManagePlaysModal(dateKey, sessions) {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";

    let sessionListHtml = sessions.map((s, i) => {
        let desc = `Play #${i + 1}`;
        let badges = "";
        
        if (s.won != null) badges += s.won ? `<span style="color:var(--success); font-weight:800; margin-left:8px;">WIN</span>` : `<span style="color:var(--danger); font-weight:800; margin-left:8px;">LOSS</span>`;
        if (s.results && Object.keys(s.results).length > 0) {
            badges += `<span style="color:var(--subtext); font-size:0.8rem; margin-left:8px;">(${Object.entries(s.results).map(([k,v])=>`${k}: ${v}`).join(', ')})</span>`;
        }

        return `
        <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg); padding:12px; border-radius:12px; margin-bottom:10px; border:2px solid var(--border);">
            <div style="font-size:0.95rem; font-weight:700; flex:1;">${desc} ${badges}</div>
            <div style="display:flex; gap:8px;">
                <button class="secondary icon-btn edit-session-btn" data-idx="${i}" style="padding:6px 12px !important; font-size:0.8rem;">Edit</button>
                <button class="danger icon-btn delete-session-btn" data-idx="${i}" style="padding:6px 12px !important; font-size:0.8rem;">Delete</button>
            </div>
        </div>`;
    }).join("");

    backdrop.innerHTML = `
      <div class="modal wide">
        <div class="close-button">×</div>
        <h2 style="margin-bottom:0.5rem; font-size:1.5rem;">Manage Plays</h2>
        <p style="color:var(--subtext); margin-bottom:1.5rem; font-weight:700;">Date: ${dateKey}</p>
        ${sessionListHtml}
      </div>
    `;
    document.body.appendChild(backdrop);
    backdrop.querySelector(".close-button").onclick = () => backdrop.remove();

    // Delete Button Logic
    backdrop.querySelectorAll(".delete-session-btn").forEach(btn => {
        btn.onclick = async (e) => {
            const idx = parseInt(e.target.dataset.idx);
            if(confirm("Delete this session?")) {
                await removeSessionDirectly(dateKey, sessions[idx]);
                backdrop.remove();
            }
        };
    });

    // Edit Button Logic -> Chains into Edit Modal
    backdrop.querySelectorAll(".edit-session-btn").forEach(btn => {
        btn.onclick = (e) => {
            const idx = parseInt(e.target.dataset.idx);
            backdrop.remove();
            showEditSessionModal(dateKey, sessions[idx]);
        };
    });
}

// --- NEW "EDIT SPECIFIC SESSION" MODAL ---
function showEditSessionModal(dateKey, sessionObj) {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";

    // Build inputs for currently tracked metrics AND historically recorded metrics in this session
    const metricNames = new Set();
    game.tracking.metrics.forEach(m => metricNames.add(m.name));
    if (sessionObj.results) Object.keys(sessionObj.results).forEach(k => metricNames.add(k));

    let dynamicInputsHtml = Array.from(metricNames).map(name => `
        <div style="margin-bottom:12px;">
            <label style="font-size:0.75rem; font-weight:800; color:var(--subtext); text-transform:uppercase; display:block; margin-bottom:4px; margin-left:4px;">${name}</label>
            <input class="ui-input edit-metric-input" data-name="${name}" type="number" value="${sessionObj.results?.[name] !== undefined ? sessionObj.results[name] : ''}" placeholder="Value for ${name}">
        </div>
    `).join('');

    const trackWonHistory = game.tracking.won || sessionObj.won != null;

    backdrop.innerHTML = `
      <div class="modal">
        <div class="close-button">×</div>
        <h2 style="margin-bottom:0.5rem;">Edit Session</h2>
        <p style="text-align:center; color:var(--subtext); margin-bottom:1.5rem; font-weight:700;">${dateKey}</p>

        ${dynamicInputsHtml}

        ${trackWonHistory ? `
        <div style="display:flex;gap:10px;margin-top:15px;margin-bottom:10px;">
            <button id="editBtnWin" style="flex:1" class="secondary">Won</button>
            <button id="editBtnLoss" style="flex:1" class="secondary">Lost</button>
        </div><input type="hidden" id="editLogWon" value="${sessionObj.won === true ? 'true' : (sessionObj.won === false ? 'false' : '')}">` : ''}

        <button id="confirmEditPlay" style="width:100%;margin-top:1.5rem">Save Changes</button>
      </div>
    `;

    document.body.appendChild(backdrop);
    backdrop.querySelector(".close-button").onclick = () => backdrop.remove();

    if (trackWonHistory) {
        const btnWin = backdrop.querySelector("#editBtnWin");
        const btnLoss = backdrop.querySelector("#editBtnLoss");
        const inp = backdrop.querySelector("#editLogWon");

        const updateWonUI = () => {
            if (inp.value === "true") {
                btnWin.style.background="var(--success)"; btnWin.style.color="white"; btnWin.style.borderColor="var(--success)";
                btnLoss.style.background="var(--bg)"; btnLoss.style.color="var(--text)"; btnLoss.style.borderColor="var(--border)";
            } else if (inp.value === "false") {
                btnLoss.style.background="var(--danger)"; btnLoss.style.color="white"; btnLoss.style.borderColor="var(--danger)";
                btnWin.style.background="var(--bg)"; btnWin.style.color="var(--text)"; btnWin.style.borderColor="var(--border)";
            } else {
                btnWin.style.background="var(--bg)"; btnWin.style.color="var(--text)"; btnWin.style.borderColor="var(--border)";
                btnLoss.style.background="var(--bg)"; btnLoss.style.color="var(--text)"; btnLoss.style.borderColor="var(--border)";
            }
        };
        updateWonUI();

        // Allows toggling off if clicked twice
        btnWin.onclick = () => { inp.value = inp.value === "true" ? "" : "true"; updateWonUI(); };
        btnLoss.onclick = () => { inp.value = inp.value === "false" ? "" : "false"; updateWonUI(); };
    }

    backdrop.querySelector("#confirmEditPlay").onclick = async () => {
        let newResults = {};
        backdrop.querySelectorAll(".edit-metric-input").forEach(inp => {
            if(inp.value !== "") newResults[inp.dataset.name] = Number(inp.value);
        });

        const w = backdrop.querySelector("#editLogWon")?.value;
        const wonVal = w === "true" ? true : (w === "false" ? false : null);

        sessionObj.results = newResults;
        sessionObj.won = wonVal;

        await saveGame();
        backdrop.remove();
    };
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
  const allGames = await getGames();
  render(allGames);
}

// === BADGES ===
function renderBadges(allGames) {
    badgeContainer.innerHTML = "";
    
    const getMonthTier = (count) => {
        if (count >= 10) return "tier-50"; 
        if (count >= 9) return "tier-45";
        if (count >= 8) return "tier-40";
        if (count >= 7) return "tier-35";
        if (count >= 6) return "tier-30";
        if (count >= 5) return "tier-25";
        if (count >= 4) return "tier-20";
        if (count >= 3) return "tier-15";
        if (count >= 2) return "tier-10";
        return "tier-5"; 
    };

    const getHighTier = (val) => { return `tier-${val}`; };

    const sorted = [...allGames].sort((a,b) => (b.plays||0) - (a.plays||0));
    const rank = sorted.findIndex(g => g.id === game.id);
    if(rank === 0 && game.plays > 0) createBadge("All-Time #1", "Most Played", "rank-1");
    else if(rank === 1 && game.plays > 0) createBadge("All-Time #2", "2nd Place", "rank-2");
    else if(rank === 2 && game.plays > 0) createBadge("All-Time #3", "3rd Place", "rank-3");

    const p = game.plays || 0;
    let bestPlay = 0;
    for(let i=50; i>=5; i-=5) { if(p >= i) { bestPlay = i; break; } }
    if(bestPlay > 0) createBadge("Veteran", `${bestPlay}+ Plays`, getHighTier(bestPlay));

    if (game.sessions) {
        const wins = game.sessions.filter(s => s.won === true).length;
        let bestWin = 0;
        for(let i=50; i>=5; i-=5) { if(wins >= i) { bestWin = i; break; } }
        if(bestWin > 0) createBadge("Victor", `${bestWin}+ Wins`, getHighTier(bestWin));
    }

    const myMonths = new Set(Object.keys(game.playHistory).map(d => d.slice(0, 7)));
    const currentMonthKey = new Date().toISOString().slice(0, 7);
    let wonMonths = [];

    myMonths.forEach(month => {
        if (month >= currentMonthKey) return; 
        let maxPlays = 0;
        let bestGameId = null;
        
        allGames.forEach(g => {
            let mPlays = 0;
            Object.entries(g.playHistory || {}).forEach(([d, c]) => {
                if (d.startsWith(month)) mPlays += c;
            });
            if (mPlays > maxPlays) { maxPlays = mPlays; bestGameId = g.id; }
        });

        if (bestGameId === game.id && maxPlays > 0) {
            const [y, m] = month.split('-');
            const dateStr = new Date(y, m-1).toLocaleString('default', { month: 'short', year: '2-digit' });
            wonMonths.push(dateStr);
        }
    });

    if (wonMonths.length > 0) {
        let count = wonMonths.length;
        let displayCount = count > 10 ? 10 : count;
        let tierClass = getMonthTier(displayCount);

        const div = document.createElement("div");
        div.className = `badge ${tierClass}`;
        const tooltipHtml = `
            <div class="badge-tooltip">
                <div style="border-bottom:1px solid rgba(255,255,255,0.2); margin-bottom:4px; padding-bottom:2px;">MONTHS WON</div>
                ${wonMonths.join("<br>")}
            </div>
        `;
        div.innerHTML = `<div class="badge-title">Champion</div><div class="badge-sub">x${count} Months</div>${tooltipHtml}`;
        badgeContainer.appendChild(div);
    }
    if (badgeContainer.children.length === 0) {
        badgeContainer.innerHTML = `<p style="grid-column:1/-1;text-align:center;opacity:0.5;">Play more to earn badges.</p>`;
    }
}
function createBadge(title, sub, tierClass) {
    const el = document.createElement("div");
    el.className = `badge ${tierClass}`;
    el.innerHTML = `<div class="badge-title">${title}</div><div class="badge-sub">${sub}</div>`;
    badgeContainer.appendChild(el);
}

// EDIT GAME MODAL 
function showEditModal() {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = `
    <div class="modal">
      <div class="close-button">×</div>
      <h2>Edit Game</h2>
      
      <div class="input-header">Basic Info</div>
      <input id="editName" class="ui-input" value="${game.name}" style="margin-bottom:10px;">
      <input id="editImage" class="ui-input" value="${game.image||''}" placeholder="Image URL" style="margin-bottom:10px;">
      
      <select id="editStatus" class="ui-select" style="margin-bottom:10px;">
          <option value="owned" ${game.tracking.status === 'owned' ? 'selected' : ''}>Collection: Owned</option>
          <option value="wishlist" ${game.tracking.status === 'wishlist' ? 'selected' : ''}>Collection: Wishlist</option>
          <option value="friends" ${game.tracking.status === 'friends' ? 'selected' : ''}>Collection: Friend's Copy</option>
          <option value="previously_owned" ${game.tracking.status === 'previously_owned' ? 'selected' : ''}>Collection: Prev. Owned</option>
      </select>
      
      <div class="input-header">Stats</div>
      <div class="row">
        <input id="editPMin" type="number" class="ui-input" value="${game.players.min||''}" placeholder="Min P">
        <input id="editPMax" type="number" class="ui-input" value="${game.players.max||''}" placeholder="Max P">
      </div>
      <div class="row">
        <input id="editTMin" type="number" class="ui-input" value="${game.playTime.min||''}" placeholder="Min T">
        <input id="editTMax" type="number" class="ui-input" value="${game.playTime.max||''}" placeholder="Max T">
      </div>
      
      <div class="input-header">Custom Tracking Metrics</div>
      <div style="display:flex; gap:8px; margin-bottom:10px;">
          <input id="editMetricName" class="ui-input" placeholder="e.g. Points, Position" style="flex:1; padding:10px 14px;">
          <select id="editMetricType" class="ui-select" style="width:110px; padding:10px;">
              <option value="highest">Highest</option>
              <option value="lowest">Lowest</option>
          </select>
          <button id="editAddMetricBtn" class="secondary" style="padding:10px 16px;">Add</button>
      </div>
      <div id="editMetricTags" style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:15px;"></div>

      <div class="toggle-row">
          <span style="font-weight:700; font-size:0.95rem;">Track Win/Loss</span>
          <label class="toggle-switch">
              <input type="checkbox" id="editTrackWon" ${game.tracking.won?'checked':''}>
              <span class="toggle-slider"></span>
          </label>
      </div>
      
      <div class="input-header">Review</div>
      <input id="editRating" type="number" step="0.1" class="ui-input" value="${game.rating||''}" placeholder="Rating 0-10">
      <textarea id="editReview" placeholder="Review..." style="margin-top:10px">${game.review||''}</textarea>
      
      <button id="saveEdit" style="width:100%; margin-top:15px">Save</button>
      <button id="deleteGameBtn" class="danger" style="width:100%; margin-top:10px">Delete</button>
    </div>
  `;
  document.body.appendChild(backdrop);
  backdrop.querySelector(".close-button").onclick=()=>backdrop.remove();

  // Metrics Logic for Edit Modal
  let currentMetrics = [...(game.tracking.metrics || [])];
  const tagsContainer = backdrop.querySelector("#editMetricTags");
  
  const renderTags = () => {
      tagsContainer.innerHTML = currentMetrics.map((m, i) => `
          <span style="display:flex; align-items:center; gap:8px; background:rgba(120,120,128,0.1); padding:6px 12px; border-radius:12px; font-size:0.8rem; font-weight:700;">
              ${m.name} <span style="opacity:0.6; font-size:0.7rem;">(${m.bestIs})</span>
              <span class="remove-metric" data-idx="${i}" style="cursor:pointer; color:var(--danger); font-size:1.1rem; line-height:1;">×</span>
          </span>
      `).join("");
      backdrop.querySelectorAll(".remove-metric").forEach(btn => {
          btn.onclick = (e) => { currentMetrics.splice(e.target.dataset.idx, 1); renderTags(); };
      });
  };
  renderTags();

  backdrop.querySelector("#editAddMetricBtn").onclick = (e) => {
      e.preventDefault();
      const n = backdrop.querySelector("#editMetricName").value.trim();
      if(!n) return;
      currentMetrics.push({ name: n, bestIs: backdrop.querySelector("#editMetricType").value });
      backdrop.querySelector("#editMetricName").value = "";
      renderTags();
  };

  backdrop.querySelector("#saveEdit").onclick=async()=>{
      game.name=backdrop.querySelector("#editName").value;
      game.image=backdrop.querySelector("#editImage").value;
      let ratVal = backdrop.querySelector("#editRating").value;
      game.rating = ratVal ? parseFloat(ratVal) : null;
      game.review=backdrop.querySelector("#editReview").value;
      game.players={min:backdrop.querySelector("#editPMin").value,max:backdrop.querySelector("#editPMax").value};
      game.playTime={min:backdrop.querySelector("#editTMin").value,max:backdrop.querySelector("#editTMax").value};
      
      game.tracking={
          metrics: currentMetrics,
          won:backdrop.querySelector("#editTrackWon").checked,
          status:backdrop.querySelector("#editStatus").value
      };
      
      await updateGame(game); backdrop.remove(); saveGame();
  };
  backdrop.querySelector("#deleteGameBtn").onclick=async()=>{if(confirm("Delete?")){await deleteGame(game.id);window.location.href="catalogue.html";}};
}

// LOG PLAY MODAL 
function showPlayModal(dateKey) {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    
    let dynamicInputsHtml = game.tracking.metrics.map(m => `
        <input class="ui-input metric-input" data-name="${m.name}" type="number" placeholder="${m.name}" style="margin-bottom:10px;">
    `).join('');

    backdrop.innerHTML = `
      <div class="modal">
        <div class="close-button">×</div>
        <h2 style="margin-bottom:0.5rem;">Log Play</h2>
        <p style="text-align:center; color:var(--subtext); margin-bottom:1.5rem; font-weight:700;">${dateKey}</p>
        
        ${dynamicInputsHtml}
        
        ${game.tracking.won ? `
        <div style="display:flex;gap:10px;margin-top:10px">
            <button id="btnWin" style="flex:1" class="secondary">Won</button>
            <button id="btnLoss" style="flex:1" class="secondary">Lost</button>
        </div><input type="hidden" id="logWon">` : ''}
        
        <button id="confirmPlay" style="width:100%;margin-top:1.5rem">Save</button>
      </div>
    `;
    backdrop.querySelector(".close-button").onclick = () => backdrop.remove();
    
    if(game.tracking.won) {
        const btnWin = backdrop.querySelector("#btnWin");
        const btnLoss = backdrop.querySelector("#btnLoss");
        const inp = backdrop.querySelector("#logWon");
        btnWin.onclick = () => { inp.value="true"; btnWin.style.background="var(--success)"; btnWin.style.color="white"; btnLoss.style.background="var(--bg)"; btnLoss.style.color="var(--text)"; btnLoss.style.borderColor="var(--border)"; };
        btnLoss.onclick = () => { inp.value="false"; btnLoss.style.background="var(--danger)"; btnLoss.style.color="white"; btnWin.style.background="var(--bg)"; btnWin.style.color="var(--text)"; btnWin.style.borderColor="var(--border)"; };
    }
    
    backdrop.querySelector("#confirmPlay").onclick = async () => {
        let results = {};
        backdrop.querySelectorAll(".metric-input").forEach(inp => {
            if(inp.value !== "") results[inp.dataset.name] = Number(inp.value);
        });

        const w = backdrop.querySelector("#logWon")?.value;
        const wonVal = w === "true" ? true : (w === "false" ? false : null);
        
        game.sessions.push({ date: dateKey, timestamp: Date.now(), results: results, won: wonVal });
        updatePlayCount(dateKey, 1);
        await saveGame();
        backdrop.remove();
    };
    document.body.appendChild(backdrop);
}

document.getElementById("prevMonth").onclick = () => { view.setMonth(view.getMonth() - 1); renderTracker(); };
document.getElementById("nextMonth").onclick = () => { view.setMonth(view.getMonth() + 1); renderTracker(); };

init();
