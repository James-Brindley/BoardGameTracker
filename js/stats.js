import { getGames } from "./data.js";

const tracker = document.getElementById("globalTracker");
const label = document.getElementById("monthLabel");
const monthPodium = document.getElementById("monthPodium");
const top10 = document.getElementById("top10");
const recentActivityList = document.getElementById("recentActivityList");

let view = new Date();

async function renderAll() {
  const games = await getGames();
  
  // Quick Stats Calculation
  let totalPlays = 0;
  let uniquePlayed = 0;
  let totalWins = 0;
  let totalWLSessions = 0;
  const playCounts = [];
  let allSessions = [];

  games.forEach(g => {
    const plays = g.plays || 0;
    totalPlays += plays;
    if (plays > 0) uniquePlayed++;
    playCounts.push(plays);

    (g.sessions || []).forEach(s => {
      allSessions.push({ ...s, gameName: g.name, gameId: g.id, image: g.image });
      if (s.won !== null && s.won !== undefined) {
          totalWLSessions++;
          if (s.won) totalWins++;
      }
    });
  });

  // Calculate H-Index
  playCounts.sort((a,b) => b - a);
  let hIndex = 0;
  for(let i=0; i<playCounts.length; i++) {
      if(playCounts[i] >= i + 1) hIndex = i + 1;
      else break;
  }

  const winRate = totalWLSessions > 0 ? Math.round((totalWins/totalWLSessions)*100) : 0;

  // Update Hero Stats
  document.getElementById('qs-plays').textContent = totalPlays;
  document.getElementById('qs-unique').textContent = uniquePlayed;
  document.getElementById('qs-hindex').textContent = hIndex;
  document.getElementById('qs-winrate').textContent = winRate + '%';

  // Render Recent Activity (Top 5)
  allSessions.sort((a,b) => b.timestamp - a.timestamp);
  renderRecentActivity(allSessions.slice(0, 6));

  // Monthly Stats
  const key = `${view.getFullYear()}-${String(view.getMonth() + 1).padStart(2, "0")}`;
  const mGames = games.map(g => ({
    ...g,
    monthPlays: Object.entries(g.playHistory || {})
      .filter(([d]) => d.startsWith(key))
      .reduce((a, [, v]) => a + v, 0)
  })).filter(g => g.monthPlays > 0).sort((a, b) => b.monthPlays - a.monthPlays);

  // All-Time Stats
  const aGames = [...games].filter(g => (g.plays || 0) > 0).sort((a, b) => (b.plays || 0) - (a.plays || 0));

  renderTracker(games);
  renderPodium(monthPodium, mGames, "monthPlays");
  renderList(top10, aGames, 0, 10, "plays");
}

function renderRecentActivity(recentSessions) {
  recentActivityList.innerHTML = "";
  if (recentSessions.length === 0) {
    recentActivityList.innerHTML = `<div style="text-align:center; color:var(--subtext); padding:2rem 0;">No plays logged yet.</div>`;
    return;
  }

  recentSessions.forEach(session => {
    const row = document.createElement("div");
    row.className = "top10-row activity-row";
    
    // Determine status badge (Win/Loss/Played)
    let badgeHtml = `<span style="font-size:0.7rem; color:var(--subtext)">Played</span>`;
    if (session.won === true) badgeHtml = `<span style="color:var(--success); font-weight:800; font-size:0.8rem">WIN</span>`;
    if (session.won === false) badgeHtml = `<span style="color:var(--danger); font-weight:800; font-size:0.8rem">LOSS</span>`;
    if (session.score != null) badgeHtml += ` <span style="font-size:0.7rem; background:rgba(120,120,128,0.1); padding:2px 6px; border-radius:4px; margin-left:4px;">Score: ${session.score}</span>`;

    // Format Date nicely
    const [y, m, d] = session.date.split('-');
    const formattedDate = `${d}/${m}`;

    row.innerHTML = `
      <img src="${session.image || 'https://via.placeholder.com/200'}" loading="lazy" style="width:40px !important; height:40px !important;">
      <div style="flex:1">
        <div style="font-weight:700; font-size:0.95rem; line-height:1.2;">${session.gameName}</div>
        <div style="display:flex; align-items:center; gap:8px; margin-top:2px;">
          <span style="font-size:0.75rem; color:var(--subtext);">${formattedDate}</span>
          ${badgeHtml}
        </div>
      </div>
      <div style="color:var(--accent); font-weight:800;">›</div>
    `;
    row.onclick = () => location.href = `game.html?id=${session.gameId}`;
    recentActivityList.appendChild(row);
  });
}

function renderPodium(container, games, valueKey) {
  container.innerHTML = "";
  if (!games.length) {
    container.innerHTML = `<div style="width:100%; text-align:center; color:var(--subtext); padding:2rem;">No stats for this period</div>`;
    return;
  }
  const podiumOrder = [1, 0, 2];
  const heights = ["podium-2", "podium-1", "podium-3"];

  podiumOrder.forEach((idx, i) => {
    const g = games[idx];
    if (!g) return;
    const card = document.createElement("div");
    card.className = `podium-card ${heights[i]}`;
    card.innerHTML = `
      <div class="rank-badge">${idx + 1}</div>
      <img src="${g.image || 'https://via.placeholder.com/400'}" loading="lazy">
      <div class="podium-info">
        <div style="font-weight:800; font-size:0.95rem; line-height:1.2; margin-bottom:4px">${g.name}</div>
        <div style="font-size:0.8rem; color:var(--subtext); font-weight:600;">${g[valueKey]} Plays</div>
      </div>
    `;
    card.onclick = () => location.href = `game.html?id=${g.id}`;
    container.appendChild(card);
  });
}

function renderList(container, games, start, end, valueKey) {
  container.innerHTML = "";
  const slice = games.slice(start, end);
  if(slice.length === 0) return;

  const wrapper = document.createElement("div");
  wrapper.style.borderRadius = "16px";
  wrapper.style.overflow = "hidden";
  wrapper.style.border = "1px solid var(--border)";

  slice.forEach((g, i) => {
    const row = document.createElement("div");
    row.className = "top10-row";
    row.innerHTML = `
      <div class="top10-rank">${start + i + 1}</div>
      <img src="${g.image || 'https://via.placeholder.com/200'}" loading="lazy">
      <div style="flex:1">
        <div style="font-weight:700; font-size:0.95rem;">${g.name}</div>
        <div style="font-size:0.8rem; color:var(--subtext); font-weight:600;">${g[valueKey]} plays</div>
      </div>
      <div style="color:var(--accent); font-weight:800;">›</div>
    `;
    row.onclick = () => location.href = `game.html?id=${g.id}`;
    wrapper.appendChild(row);
  });
  container.appendChild(wrapper);
}

function renderTracker(games) {
  tracker.innerHTML = "";
  const year = view.getFullYear();
  const month = view.getMonth();
  const today = new Date();
  
  label.textContent = view.toLocaleString("default", { month: "long", year: "numeric" });
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    let totalPlays = 0;
    let details = [];

    games.forEach(g => {
      const count = g.playHistory?.[dateKey] || 0;
      if (count > 0) {
        totalPlays += count;
        details.push(`${g.name}: ${count}`);
      }
    });

    const cell = document.createElement("div");
    cell.className = "tracker-day";
    if (totalPlays > 0) cell.classList.add(`level-${Math.min(5, totalPlays)}`);
    if (today.getFullYear() === year && today.getMonth() === month && today.getDate() === d) cell.classList.add("today");

    cell.innerHTML = `<span class="day-number">${d}</span>`;
    
    const tooltip = document.createElement("div");
    tooltip.className = "tracker-tooltip";
    const formattedDate = `${String(d).padStart(2, "0")}/${String(month + 1).padStart(2, "0")}`;
    
    if (totalPlays > 0) {
      tooltip.innerHTML = `<strong>${formattedDate}</strong><br>${details.join("<br>")}`;
    } else {
      tooltip.innerHTML = `<strong>${formattedDate}</strong><br>No plays`;
    }
    
    cell.appendChild(tooltip);
    tracker.appendChild(cell);
  }
}

document.getElementById("prevMonth").onclick = () => { view.setMonth(view.getMonth() - 1); renderAll(); };
document.getElementById("nextMonth").onclick = () => { view.setMonth(view.getMonth() + 1); renderAll(); };

renderAll();
