import { getGames, saveGames } from "./data.js";

const list = document.getElementById("list");
const search = document.getElementById("search");
const sort = document.getElementById("sort");
const modal = document.getElementById("modal");

/* FILTER ELEMENTS */
const filterPlayers = document.getElementById("filterPlayers");
const filterTime = document.getElementById("filterTime");
const filterRating = document.getElementById("filterRating");
const filterPlayed = document.getElementById("filterPlayed");

/* FILTER STATE */
const filters = {
  players: null,
  playTime: null,
  minRating: null,
  played: "all"
};

function formatRange(r) {
  if (!r || r.min == null) return "—";
  return r.min === r.max ? `${r.min}` : `${r.min}–${r.max}`;
}

function applyFilters(games) {
  return games.filter(g => {

    if (filters.players != null) {
      if (!g.players || g.players.max < filters.players) return false;
    }

    if (filters.playTime != null) {
      if (!g.playTime || g.playTime.min > filters.playTime) return false;
    }

    if (filters.minRating != null) {
      if ((g.rating ?? 0) < filters.minRating) return false;
    }

    if (filters.played === "played" && g.plays === 0) return false;
    if (filters.played === "unplayed" && g.plays > 0) return false;

    return true;
  });
}

function render() {
  let games = getGames();

  const q = search.value.toLowerCase();
  if (q) {
    games = games.filter(g => g.name.toLowerCase().includes(q));
  }

  games = applyFilters(games);

  const key = sort.value;
  games.sort((a, b) =>
    key === "name"
      ? a.name.localeCompare(b.name)
      : (b[key] || 0) - (a[key] || 0)
  );

  list.innerHTML = "";

  if (!games.length) {
    list.innerHTML = `<p style="opacity:.6">No matching games</p>`;
    return;
  }

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
        <span>${formatRange(g.players)} players</span>
        <span>${formatRange(g.playTime)} mins</span>
      </div>
      <div style="padding:0 10px 10px">${g.plays || 0} plays</div>
    `;
    card.onclick = () => {
      location.href = `game.html?id=${g.id}`;
    };
    list.appendChild(card);
  });
}

/* FILTER EVENTS */
filterPlayers.onchange = () => {
  filters.players = filterPlayers.value ? Number(filterPlayers.value) : null;
  render();
};

filterTime.onchange = () => {
  filters.playTime = filterTime.value ? Number(filterTime.value) : null;
  render();
};

filterRating.onchange = () => {
  filters.minRating = filterRating.value ? Number(filterRating.value) : null;
  render();
};

filterPlayed.onchange = () => {
  filters.played = filterPlayed.value;
  render();
};

search.oninput = render;
sort.onchange = render;

render();
