import { getGames } from "./data.js";

const list = document.getElementById("list");
const search = document.getElementById("search");
const sort = document.getElementById("sort");

const filterPlayers = document.getElementById("filterPlayers");
const filterTime = document.getElementById("filterTime");
const filterRating = document.getElementById("filterRating");
const filterPlayed = document.getElementById("filterPlayed");

const filters = {
  players: null,
  playTime: null,
  minRating: null,
  played: "all"
};

function render() {
  let games = getGames();

  if (search.value) {
    const q = search.value.toLowerCase();
    games = games.filter(g => g.name.toLowerCase().includes(q));
  }

  if (filters.players) games = games.filter(g => g.players?.max >= filters.players);
  if (filters.playTime) games = games.filter(g => g.playTime?.min <= filters.playTime);
  if (filters.minRating) games = games.filter(g => (g.rating ?? 0) >= filters.minRating);
  if (filters.played === "played") games = games.filter(g => g.plays > 0);
  if (filters.played === "unplayed") games = games.filter(g => g.plays === 0);

  games.sort((a, b) =>
    sort.value === "name"
      ? a.name.localeCompare(b.name)
      : (b[sort.value] || 0) - (a[sort.value] || 0)
  );

  list.innerHTML = "";

  games.forEach(g => {
    const card = document.createElement("div");
    card.className = "game-card";
    card.innerHTML = `
      <img src="${g.image || "https://via.placeholder.com/400"}">
      <div class="card-header">
        <strong>${g.name}</strong>
        <span>⭐ ${g.rating ?? "—"}</span>
      </div>
      <div class="card-stats">
        <span>${g.players?.min ?? "—"}–${g.players?.max ?? "—"} players</span>
        <span>${g.playTime?.min ?? "—"}–${g.playTime?.max ?? "—"} min</span>
      </div>
      <div class="plays">${g.plays || 0} plays</div>
    `;
    card.onclick = () => location.href = `game.html?id=${g.id}`;
    list.appendChild(card);
  });
}

search.oninput = render;
sort.onchange = render;
filterPlayers.onchange = () => { filters.players = +filterPlayers.value || null; render(); };
filterTime.onchange = () => { filters.playTime = +filterTime.value || null; render(); };
filterRating.onchange = () => { filters.minRating = +filterRating.value || null; render(); };
filterPlayed.onchange = () => { filters.played = filterPlayed.value; render(); };

render();
