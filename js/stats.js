import { getGames } from "./data.js";

const tracker = document.getElementById("globalTracker");
const label = document.getElementById("monthLabel");

let view = new Date();

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

document.getElementById("prevMonth").onclick = () => {
  view.setMonth(view.getMonth() - 1);
  renderTracker();
};

document.getElementById("nextMonth").onclick = () => {
  view.setMonth(view.getMonth() + 1);
  renderTracker();
};

renderTracker();
