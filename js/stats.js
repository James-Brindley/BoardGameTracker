/* */
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
    tracker.appendChild(cell);
  }
}

function renderPodium(container, games, valueKey) {
  container.innerHTML = "";
  if (!games.length) return;

  const podiumOrder = [1, 0, 2]; // 2nd, 1st, 3rd
  const heights = ["podium-2", "podium-1", "podium-3"];

  podiumOrder.forEach((idx, i) => {
    const g = games[idx];
    if (!g) return;

    const card = document.createElement("div");
    card.className = `card podium-card ${heights[i]}`;
    card.innerHTML = `
      <div style="font-weight:bold; font-size:1.2rem; margin-bottom:0.5rem">#${idx + 1}</div>
      <img src="${g.image || 'https://via.placeholder.com/200'}">
      <div style="font-weight:600">${g.name}</div>
      <div style="font-size:0.8rem; opacity:0.7">${g[valueKey]} plays</div>
    `;
    card.onclick = () => location.href = `game.html?id=${g.id}`;
    container.appendChild(card);
  });
}

/* Restore the missing List function */
function renderList(container, games, start, end, valueKey) {
  container.innerHTML = "";
  const slice = games.slice(start, end);
  if (slice.length === 0) return;

  slice.forEach((g, i) => {
    const row = document.createElement("div");
    row.className = "top-row";
    row.innerHTML = `
      <div class="top-rank">${start + i + 1}</div>
      <img class="top-img" src="${g.image || 'https://via.placeholder.com/200'}">
      <div style="flex:1">
        <div style="font-weight:600">${g.name}</div>
        <div style="font-size:0.8rem; opacity:0.7">${g[valueKey]} plays</div>
      </div>
    `;
    row.onclick = () => location.href = `game.html?id=${g.id}`;
    container.appendChild(row);
  });
}

async function renderAll() {
  const games = await getGames(); // Fix: Must await this
  
  // Monthly Stats
  const key = `${view.getFullYear()}-${String(view.getMonth() + 1).padStart(2, "0")}`;
  const mGames = games.map(g => ({
    ...g,
    monthPlays: Object.entries(g.playHistory || {})
      .filter(([d]) => d.startsWith(key))
      .reduce((a, [, v]) => a + v, 0)
  })).filter(g => g.monthPlays > 0).sort((a, b) => b.monthPlays - a.monthPlays);

  renderTracker(games);
  renderPodium(monthPodium, mGames, "monthPlays");
  renderList(monthRest, mGames, 3, 5, "monthPlays");

  // All-Time Stats
  const aGames = [...games].filter(g => (g.plays || 0) > 0).sort((a, b) => (b.plays || 0) - (a.plays || 0));
  renderPodium(allTimePodium, aGames, "plays");
  renderList(top10, aGames, 3, 10, "plays");
}

document.getElementById("prevMonth").onclick = () => { view.setMonth(view.getMonth() - 1); renderAll(); };
document.getElementById("nextMonth").onclick = () => { view.setMonth(view.getMonth() + 1); renderAll(); };

renderAll();
