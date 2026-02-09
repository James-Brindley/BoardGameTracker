import { getGames } from "./data.js";

const tracker = document.getElementById("globalTracker");
const label = document.getElementById("monthLabel");
const top10 = document.getElementById("top10");
const topMonth = document.getElementById("topMonth");

let view = new Date();

/* ---------- TRACKER ---------- */
function renderTracker() {
  tracker.innerHTML = "";

  const year = view.getFullYear();
  const month = view.getMonth();
  label.textContent = view.toLocaleString("default", { month: "long", year: "numeric" });

  const days = new Date(year, month + 1, 0).getDate();
  const games = getGames();

  for (let d = 1; d <= days; d++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    let total = 0;
    let names = [];

    games.forEach(g => {
      const count = g.playHistory?.[dateKey] || 0;
      if (count) {
        total += count;
        names.push(`${g.name} (${count})`);
      }
    });

    const cell = document.createElement("div");
    cell.className = "tracker-day " + (total ? `level-${Math.min(3, total)}` : "");

    if (total) {
      cell.innerHTML = `<div class="tracker-tooltip">${names.join("<br>")}</div>`;
    }

    tracker.appendChild(cell);
  }
}

/* ---------- TOP 10 ALL TIME ---------- */
function renderTop10() {
  const games = getGames()
    .filter(g => g.plays > 0)
    .sort((a, b) => b.plays - a.plays)
    .slice(0, 10);

  top10.innerHTML = "";

  if (!games.length) {
    top10.innerHTML = `<p style="opacity:0.6">No plays yet</p>`;
    return;
  }

  games.forEach((g, i) => {
    const row = document.createElement("div");
    row.className = "top10-row";
    row.innerHTML = `
      <div class="top10-rank">${i + 1}</div>
      <img src="${g.image || "https://via.placeholder.com/200x120"}">
      <div>
        <strong>${g.name}</strong><br>
        ${g.plays} plays
      </div>
    `;
    row.onclick = () => location.href = `game.html?id=${g.id}`;
    top10.appendChild(row);
  });
}

/* ---------- TOP MONTH ---------- */
function renderTopMonth() {
  const year = view.getFullYear();
  const month = view.getMonth() + 1;
  const prefix = `${year}-${String(month).padStart(2, "0")}`;

  const games = getGames()
    .map(g => {
      const plays = Object.entries(g.playHistory || {})
        .filter(([k]) => k.startsWith(prefix))
        .reduce((a, [, v]) => a + v, 0);
      return { ...g, monthPlays: plays };
    })
    .filter(g => g.monthPlays > 0)
    .sort((a, b) => b.monthPlays - a.monthPlays)
    .slice(0, 5);

  topMonth.innerHTML = "";

  if (!games.length) {
    topMonth.innerHTML = `<p style="opacity:0.6">No plays this month</p>`;
    return;
  }

  games.forEach((g, i) => {
    const row = document.createElement("div");
    row.className = "top10-row";
    row.innerHTML = `
      <div class="top10-rank">${i + 1}</div>
      <img src="${g.image || "https://via.placeholder.com/200x120"}">
      <div>
        <strong>${g.name}</strong><br>
        ${g.monthPlays} plays
      </div>
    `;
    row.onclick = () => location.href = `game.html?id=${g.id}`;
    topMonth.appendChild(row);
  });
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

function renderAll() {
  renderTracker();
  renderTop10();
  renderTopMonth();
}

renderAll();
