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

/* ---------- TRACKER ---------- */
function renderTracker() {
  tracker.innerHTML = "";

  const year = view.getFullYear();
  const month = view.getMonth();
  label.textContent = view.toLocaleString("default", { month: "long", year: "numeric" });

  const days = new Date(year, month + 1, 0).getDate();
  const games = getGames();

  for (let d = 1; d <= days; d++) {
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

    let total = 0;
    let details = [];

    games.forEach(g => {
      const count = g.playHistory?.[date] || 0;
      if (count) {
        total += count;
        details.push(`${g.name} (${count})`);
      }
    });

    const cell = document.createElement("div");
    cell.className = `tracker-day ${total ? `level-${Math.min(3, total)}` : ""}`;

    if (total) {
      cell.innerHTML = `
        <div class="tracker-tooltip">
          <strong>${date}</strong><br>
          ${details.join("<br>")}
        </div>`;
    }

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
function renderPodium(container, games, valueKey, maxPodium = 3) {
  container.innerHTML = "";

  const podiumGames = games.slice(0, maxPodium);
  const order = [1, 0, 2]; // for visual podium: middle is 1st
  const heights = ["podium-2", "podium-1", "podium-3"];

  order.forEach((i, v) => {
    const g = podiumGames[i];
    if (!g) return;

    const card = document.createElement("div");
    card.className = `card podium-card ${heights[v]}`;
    card.innerHTML = `
      <div class="rank">#${i + 1}</div>
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

  const monthGames = monthlyStats();
  renderPodium(monthPodium, monthGames, "monthPlays", 3);
  renderList(monthRest, monthGames, 3, 5, "monthPlays"); // max 5 total

  const allGames = getGames().filter(g => g.plays > 0).sort((a, b) => b.plays - a.plays);
  renderPodium(allTimePodium, allGames, "plays", 3);
  renderList(top10, allGames, 3, 10, "plays"); // max 10 total
}

/* ---------- NAV ---------- */
document.getElementById("prevMonth").onclick = () => {
  view.setMonth(view.getMonth() - 1);
  renderAll();
};

document.getElementById("nextMonth").onclick = () => {
  view.setMonth(view.getMonth() + 1);
  renderAll();
};

renderAll();
