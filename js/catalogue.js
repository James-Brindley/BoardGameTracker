import { getGames, saveGames } from "./data.js";

const list = document.getElementById("list");
const search = document.getElementById("search");
const sort = document.getElementById("sort");
const addBtn = document.getElementById("addGame");

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

  if (filters.players)
    games = games.filter(g => g.players.max >= filters.players);

  if (filters.playTime)
    games = games.filter(g => g.playTime.min <= filters.playTime);

  if (filters.minRating)
    games = games.filter(g => (g.rating ?? 0) >= filters.minRating);

  if (filters.played === "played")
    games = games.filter(g => g.plays > 0);

  if (filters.played === "unplayed")
    games = games.filter(g => g.plays === 0);

  games.sort((a, b) =>
    sort.value === "name"
      ? a.name.localeCompare(b.name)
      : (b[sort.value] || 0) - (a[sort.value] || 0)
  );

  list.innerHTML = "";

  if (!games.length) {
    list.innerHTML = `<div class="card">No games found</div>`;
    return;
  }

  games.forEach(g => {
    const card = document.createElement("div");
    card.className = "game-card";
    card.innerHTML = `
      <div class="card-header">
        <strong>${g.name}</strong>
        <span>⭐ ${g.rating ?? "—"}</span>
      </div>
      <div class="card-stats">
        <span>${g.players.min}–${g.players.max} players</span>
        <span>${g.playTime.min}–${g.playTime.max} min</span>
      </div>
      <div class="plays">${g.plays} plays</div>
    `;
    card.onclick = () => {
      location.href = `game.html?id=${g.id}`;
    };
    list.appendChild(card);
  });
}

/* ---------- ADD GAME MODAL ---------- */
addBtn.onclick = () => {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";

  backdrop.innerHTML = `
    <div class="modal">
      <div class="close-button">×</div>
      <h2>Add Game</h2>

      <input id="newName" placeholder="Game name">

      <div class="modal-row">
        <input id="pMin" type="number" min="1" placeholder="Min players">
        <input id="pMax" type="number" min="1" placeholder="Max players">
      </div>

      <div class="modal-row">
        <input id="tMin" type="number" min="1" placeholder="Min minutes">
        <input id="tMax" type="number" min="1" placeholder="Max minutes">
      </div>

      <button id="saveNew">Add Game</button>
    </div>
  `;

  backdrop.querySelector(".close-button").onclick = () => backdrop.remove();

  backdrop.querySelector("#saveNew").onclick = () => {
    const name = backdrop.querySelector("#newName").value.trim();
    const pMin = Number(backdrop.querySelector("#pMin").value);
    const pMax = Number(backdrop.querySelector("#pMax").value);
    const tMin = Number(backdrop.querySelector("#tMin").value);
    const tMax = Number(backdrop.querySelector("#tMax").value);

    if (!name) return alert("Game name required");
    if (!pMin || !pMax || pMin > pMax) return alert("Invalid player count");
    if (!tMin || !tMax || tMin > tMax) return alert("Invalid play time");

    const games = getGames();

    games.push({
      id: crypto.randomUUID(),
      name,
      plays: 0,
      rating: null,
      players: { min: pMin, max: pMax },
      playTime: { min: tMin, max: tMax },
      playHistory: {}
    });

    saveGames(games);
    backdrop.remove();
    render();
  };

  document.body.appendChild(backdrop);
};

/* EVENTS */
search.oninput = render;
sort.onchange = render;

filterPlayers.onchange = () => {
  filters.players = +filterPlayers.value || null;
  render();
};

filterTime.onchange = () => {
  filters.playTime = +filterTime.value || null;
  render();
};

filterRating.onchange = () => {
  filters.minRating = +filterRating.value || null;
  render();
};

filterPlayed.onchange = () => {
  filters.played = filterPlayed.value;
  render();
};

render();
