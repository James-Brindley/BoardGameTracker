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

/* =============================
   TRACKER
============================= */
async function renderTracker() {
  tracker.innerHTML = "";

  const year = view.getFullYear();
  const month = view.getMonth();
  label.textContent = view.toLocaleString("default", { month: "long", year: "numeric" });

  const today = new Date();
  const days = new Date(year, month + 1, 0).getDate();
  const games = await getGames();

  for (let d = 1; d <= days; d++) {
    const key = `${year}-${String(month + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

    let total = 0;
    let details = [];

    games.forEach(g => {
      const count = g.playHistory?.[key] || 0;
      if (count) {
        total += count;
        details.push(`${g.name} (${count})`);
      }
    });

    const cell = document.createElement("div");
    cell.className = "tracker-day";

    if (total > 0) cell.classList.add(`level-${Math.min(5, total)}`);

    if (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === d
    ) cell.classList.add("today");

    const dayNumber = document.createElement("span");
    dayNumber.className = "day-number";
    dayNumber.textContent = d;
    cell.appendChild(dayNumber);

    const tooltip = document.createElement("div");
    tooltip.className = "tracker-tooltip";

    tooltip.innerHTML = `
      <strong>${String(d).padStart(2,"0")}/${String(month+1).padStart(2,"0")}/${year}</strong><br>
      ${total} total play${total !== 1 ? "s" : ""}
      ${details.length ? `<hr style="margin:4px 0; opacity:.3;">${details.join("<br>")}` : ""}
    `;

    cell.appendChild(tooltip);
    tracker.appendChild(cell);
  }
}

/* =============================
   MONTHLY DATA
============================= */
async function monthlyStats() {
  const key = monthKey();
  const games = await getGames();

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

/* =============================
   PODIUM / LIST RENDER
============================= */
function renderPodium(container, games, valueKey, maxPodium = 3) {
  container.innerHTML = "";

  const podiumGames = games.slice(0, maxPodium);
  const order = [1, 0, 2];
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

/* =============================
   RENDER ALL
============================= */
async function renderAll() {
  await renderTracker();

  const monthGames = await monthlyStats();
  renderPodium(monthPodium, monthGames, "monthPlays", 3);
  renderList(monthRest, monthGames, 3, 5, "monthPlays");

  const allGames = (await getGames())
    .filter(g => g.plays > 0)
    .sort((a, b) => b.plays - a.plays);

  renderPodium(allTimePodium, allGames, "plays", 3);
  renderList(top10, allGames, 3, 10, "plays");
}

/* =============================
   NAVIGATION
============================= */
document.getElementById("prevMonth").onclick = async () => {
  view = new Date(view.getFullYear(), view.getMonth() - 1, 1);
  await renderAll();
};

document.getElementById("nextMonth").onclick = async () => {
  view = new Date(view.getFullYear(), view.getMonth() + 1, 1);
  await renderAll();
};

/* =============================
   INITIAL RENDER
============================= */
renderAll();
