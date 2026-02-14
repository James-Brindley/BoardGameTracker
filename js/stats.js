import { getGames } from "./data.js";

const tracker = document.getElementById("globalTracker");
const label = document.getElementById("monthLabel");
const monthPodium = document.getElementById("monthPodium");
const monthRest = document.getElementById("monthRest");
const allTimePodium = document.getElementById("allTimePodium");
const top10 = document.getElementById("top10");

let view = new Date();

/* ---------- HELPERS ---------- */
function monthKey() {
  return `${view.getFullYear()}-${String(view.getMonth() + 1).padStart(2, "0")}`;
}

/* ---------- TRACKER (RESTORED UI) ---------- */
function renderTracker() {
  tracker.innerHTML = "";

  const year = view.getFullYear();
  const month = view.getMonth();
  const today = new Date();
  
  label.textContent = view.toLocaleString("default", { month: "long", year: "numeric" });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const games = getGames(); //

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

    // Restore Progressive Intensity (Level 1-5 for Global Stats)
    if (totalPlays > 0) {
      const level = Math.min(5, totalPlays);
      cell.classList.add(`level-${level}`); //
    }

    // Restore Current Day Border
    if (today.getFullYear() === year && today.getMonth() === month && today.getDate() === d) {
      cell.classList.add("today"); //
    }

    // Restore Day Number
    const dayNum = document.createElement("span");
    dayNum.className = "day-number";
    dayNum.textContent = d;
    cell.appendChild(dayNum);

    // Restore Tooltip (Date + Games list)
    const tooltip = document.createElement("div");
    tooltip.className = "tracker-tooltip";
    const formattedDate = `${String(d).padStart(2, "0")}/${String(month + 1).padStart(2, "0")}/${year}`;
    
    if (totalPlays > 0) {
      tooltip.innerHTML = `<strong>${formattedDate}</strong><br>${details.join("<br>")}`;
    } else {
      tooltip.innerHTML = `<strong>${formattedDate}</strong><br>No plays`;
    }
    cell.appendChild(tooltip);

    tracker.appendChild(cell);
  }
}

/* ---------- MONTHLY DATA ---------- */
function monthlyStats() {
  const key = monthKey();
  return getGames()
    .map(g => {
      const plays = Object.entries(g.playHistory || {})
        .filter(([d]) => d.startsWith(key))
        .reduce((a, [, v]) => a + v, 0);
      return { ...g, monthPlays: plays };
    })
    .filter(g => g.monthPlays > 0)
    .sort((a, b) => b.monthPlays - a.monthPlays);
}

/* ---------- PODIUM ---------- */
function renderPodium(container, games, valueKey) {
  container.innerHTML = "";
  if (!games.length) return;

  const podiumGames = games.slice(0, 3);
  const displayOrder = [1, 0, 2]; // 2nd, 1st, 3rd
  const heights = ["podium-2", "podium-1", "podium-3"];

  displayOrder.forEach((sortedIdx, i) => {
    const g = podiumGames[sortedIdx];
    if (!g) return;

    const card = document.createElement("div");
    card.className = `card podium-card ${heights[i]}`;
    card.innerHTML = `
      <div class="rank">#${sortedIdx + 1}</div>
      <img src="${g.image || "https://via.placeholder.com/400"}">
      <strong>${g.name}</strong>
      <div>${g[valueKey]} plays</div>
    `;
    card.onclick = () => location.href = `game.html?id=${g.id}`;
    container.appendChild(card);
  });
}

/* ---------- LIST ---------- */
function renderList(container, games, start, end, valueKey) {
  container.innerHTML = "";
  const slice = games.slice(start, end);
  slice.forEach((g, i) => {
    const row = document.createElement("div");
    row.className = "top10-row";
    row.innerHTML = `
      <div class="top10-rank">${start + i + 1}</div>
      <img src="${g.image || "https://via.placeholder.com/200"}">
      <div>
        <strong>${g.name}</strong><br>
        ${g[valueKey]} plays
      </div>
    `;
    row.onclick = () => location.href = `game.html?id=${g.id}`;
    container.appendChild(row);
  });
}

/* ---------- RENDER ALL ---------- */
function renderAll() {
  renderTracker();
  const mGames = monthlyStats();
  renderPodium(monthPodium, mGames, "monthPlays");
  renderList(monthRest, mGames, 3, 5, "monthPlays");

  const aGames = getGames().filter(g => (g.plays || 0) > 0).sort((a, b) => (b.plays || 0) - (a.plays || 0));
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
