import { getGames } from "./data.js";

const tracker = document.getElementById("globalTracker");
const label = document.getElementById("monthLabel");
const monthPodium = document.getElementById("monthPodium");
const monthRest = document.getElementById("monthRest");
const allTimePodium = document.getElementById("allTimePodium");
const top10 = document.getElementById("top10");

let view = new Date();
let cachedGames = []; // Store games locally after fetching

/* ---------- HELPERS ---------- */
function monthKey() {
  return `${view.getFullYear()}-${String(view.getMonth() + 1).padStart(2, "0")}`;
}

/* ---------- TRACKER ---------- */
function renderTracker() {
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

    cachedGames.forEach(g => {
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

    const dayNum = document.createElement("span");
    dayNum.className = "day-number";
    dayNum.textContent = d;
    cell.appendChild(dayNum);

    const tooltip = document.createElement("div");
    tooltip.className = "tracker-tooltip";
    const formattedDate = `${String(d).padStart(2, "0")}/${String(month + 1).padStart(2, "0")}/${year}`;
    tooltip.innerHTML = totalPlays > 0 ? `<strong>${formattedDate}</strong><br>${details.join("<br>")}` : `<strong>${formattedDate}</strong><br>No plays`;
    cell.appendChild(tooltip);
    tracker.appendChild(cell);
  }
}

/* ---------- STATS LOGIC ---------- */
function monthlyStats() {
  const key = monthKey();
  return cachedGames
    .map(g => {
      const monthPlays = Object.keys(g.playHistory || {})
        .filter(k => k.startsWith(key))
        .reduce((sum, k) => sum + g.playHistory[k], 0);
      return { ...g, monthPlays };
    })
    .filter(g => g.monthPlays > 0)
    .sort((a, b) => b.monthPlays - a.monthPlays);
}

function renderPodium(container, games, valueKey) {
  container.innerHTML = "";
  // Display order: 2nd place, 1st place, 3rd place (Visual staircase)
  const podiumOrder = [1, 0, 2]; 
  
  podiumOrder.forEach(rankIndex => {
    const g = games[rankIndex];
    if (!g) return;

    const card = document.createElement("div");
    // podium-1 is 1st place, podium-2 is 2nd, etc.
    card.className = `podium-card podium-${rankIndex + 1}`; 
    card.innerHTML = `
      <div class="rank">${rankIndex + 1}</div>
      <img src="${g.image || "https://via.placeholder.com/200"}">
      <div style="margin-top:auto">
        <strong>${g.name}</strong>
        <div style="color: var(--muted); font-size: 0.9rem;">${g[valueKey]} plays</div>
      </div>
    `;
    card.onclick = () => location.href = `game.html?id=${g.id}`;
    container.appendChild(card);
  });
}

function renderList(container, games, start, end, valueKey) {
  container.innerHTML = "";
  games.slice(start, end).forEach((g, i) => {
    const row = document.createElement("div");
    row.className = "top10-row";
    row.innerHTML = `
      <div class="top10-rank">${start + i + 1}</div>
      <img src="${g.image || "https://via.placeholder.com/200"}">
      <div><strong>${g.name}</strong><br>${g[valueKey]} plays</div>
    `;
    row.onclick = () => location.href = `game.html?id=${g.id}`;
    container.appendChild(row);
  });
}

async function renderAll() {
  cachedGames = await getGames(); // Await the data fetch
  renderTracker();
  const mGames = monthlyStats();
  renderPodium(monthPodium, mGames, "monthPlays");
  renderList(monthRest, mGames, 3, 5, "monthPlays");

  const aGames = cachedGames.filter(g => (g.plays || 0) > 0).sort((a, b) => (b.plays || 0) - (a.plays || 0));
  renderPodium(allTimePodium, aGames, "plays");
  renderList(top10, aGames, 3, 10, "plays");
}

/* ---------- NAV ---------- */
document.getElementById("prevMonth").onclick = () => {
  view = new Date(view.getFullYear(), view.getMonth() - 1, 1);
  renderAll();
};
document.getElementById("nextMonth").onclick = () => {
  view = new Date(view.getFullYear(), view.getMonth() + 1, 1);
  renderAll();
};

renderAll();
