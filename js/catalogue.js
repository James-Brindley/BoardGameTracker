import { getGames, saveGames } from "./data.js";

const list = document.getElementById("list");
const search = document.getElementById("search");
const sort = document.getElementById("sort");

const filtersBtn = document.getElementById("filtersBtn");
const filtersPanel = document.getElementById("filtersPanel");
const playerFilter = document.getElementById("playerFilter");
const timeMin = document.getElementById("timeMin");
const timeMax = document.getElementById("timeMax");
const tagFilter = document.getElementById("tagFilter");

filtersBtn.onclick = () => {
  filtersPanel.style.display =
    filtersPanel.style.display === "none" ? "block" : "none";
};

function render() {
  let games = getGames();

  const q = search.value.toLowerCase();
  if (q) games = games.filter(g => g.name.toLowerCase().includes(q));

  const p = Number(playerFilter.value);
  if (p) {
    games = games.filter(g =>
      g.players && p >= g.players.min && p <= g.players.max
    );
  }

  const minT = Number(timeMin.value);
  const maxT = Number(timeMax.value);
  if (minT || maxT) {
    games = games.filter(g => {
      if (!g.playTime) return false;
      return (
        (!minT || g.playTime.max >= minT) &&
        (!maxT || g.playTime.min <= maxT)
      );
    });
  }

  if (tagFilter.value) {
    games = games.filter(g =>
      g.tags?.some(t => t.type === tagFilter.value)
    );
  }

  const key = sort.value;
  games.sort((a, b) =>
    key === "name" ? a.name.localeCompare(b.name) : (b[key] || 0) - (a[key] || 0)
  );

  list.innerHTML = "";
  games.forEach(g => {
    const card = document.createElement("div");
    card.className = "game-card";
    card.innerHTML = `
      <img src="${g.image || "https://via.placeholder.com/400x200"}">
      <div class="card-header">
        <strong>${g.name}</strong>
        <span>⭐ ${g.rating ?? "—"}</span>
      </div>
      <div class="card-stats">
        <span>${g.players.min}${g.players.max > g.players.min ? `–${g.players.max}` : ""} players</span>
        <span>${g.playTime.min}${g.playTime.max > g.playTime.min ? `–${g.playTime.max}` : ""} mins</span>
      </div>
      <div class="tag-row">
        ${(g.tags || []).map(t => `<span class="tag gold">${t.label}</span>`).join("")}
      </div>
    `;
    card.onclick = () => location.href = `game.html?id=${g.id}`;
    list.appendChild(card);
  });
}

[search, sort, playerFilter, timeMin, timeMax, tagFilter].forEach(
  el => el.oninput = render
);

render();
