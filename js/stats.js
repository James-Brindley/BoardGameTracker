import { getGames } from "./data.js";

const tracker = document.getElementById("globalTracker");
const label = document.getElementById("monthLabel");
const monthPodium = document.getElementById("monthPodium");
const monthRest = document.getElementById("monthRest");
const allTimePodium = document.getElementById("allTimePodium");
const top10 = document.getElementById("top10");

let view = new Date();

async function renderTracker(games) {
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
    tooltip.innerHTML = `<strong>${d} ${label.textContent}</strong><br>${totalPlays > 0 ? details.join("<br>") : "No plays"}`;
    cell.appendChild(tooltip);
    tracker.appendChild(cell);
  }
}

function getMonthlyStats(games) {
  const key = `${view.getFullYear()}-${String(view.getMonth() + 1).padStart(2, "0")}`;
  return games
    .map(g => {
      const plays = Object.entries(g.playHistory || {})
        .filter(([d]) => d.startsWith(key))
        .reduce((a, [, v]) => a + v, 0);
      return { ...g, monthPlays: plays };
    })
    .filter(g => g.monthPlays > 0)
    .sort((a, b) => b.monthPlays - a.monthPlays);
}

function renderPodium(container, games, valueKey) {
  container.innerHTML = "";
  if (!games.length) {
    container.innerHTML = "<p>No data for this period</p>";
    return;
  }
  const displayOrder = [1, 0, 2]; 
  const heights = ["podium-2", "podium-1", "podium-3"];

  displayOrder.forEach((sortedIdx, i) => {
    const g = games[sortedIdx];
    if (!g) return;
    const card = document.createElement("div");
    card.className = `card podium-card ${heights[i]}`;
    card.innerHTML = `
      <div class="rank">#${sortedIdx + 1}</div>
      <img src="${g.image || 'https://via.placeholder.com/150'}">
      <div style="font-size:0.9rem; font-weight:bold; margin-bottom:4px">${g.name}</div>
      <div style="font-size:0.8rem">${g[valueKey]} plays</div>
    `;
    card.onclick = () => location.href = `game.html?id=${g.id}`;
    container.appendChild(card);
  });
}

async function renderAll() {
  const games = await getGames();
  renderTracker(games);
  
  const mGames = getMonthlyStats(games);
  renderPodium(monthPodium, mGames, "monthPlays");

  const aGames = [...games].sort((a,b) => (b.plays || 0) - (a.plays || 0)).filter(g => g.plays > 0);
  renderPodium(allTimePodium, aGames, "plays");
}

document.getElementById("prevMonth").onclick = () => { view.setMonth(view.getMonth() - 1); renderAll(); };
document.getElementById("nextMonth").onclick = () => { view.setMonth(view.getMonth() + 1); renderAll(); };

renderAll();
