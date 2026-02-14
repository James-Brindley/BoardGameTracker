import { getGames, saveGames } from "./data.js";

const list = document.getElementById("list");
const search = document.getElementById("search");
const sort = document.getElementById("sort");
const addBtn = document.getElementById("addGame");

const filterPlayers = document.getElementById("filterPlayers");
const filterTime = document.getElementById("filterTime");
const filterRating = document.getElementById("filterRating");
const filterPlayed = document.getElementById("filterPlayed");

function formatRange(min, max, suffix="") {
  if (min == null && max == null) return "—";
  if (min === max || max == null) return `${min}${suffix}`;
  return `${min}–${max}${suffix}`;
}

/* =============================
   RENDER CATALOGUE
============================= */
async function render() {
  let games = await getGames();

  const searchValue = search.value.toLowerCase();
  const playersValue = parseInt(filterPlayers.value);
  const timeValue = parseInt(filterTime.value);
  const ratingValue = parseFloat(filterRating.value);
  const statusValue = filterPlayed.value;

  if (searchValue) {
    games = games.filter(g =>
      g.name.toLowerCase().includes(searchValue)
    );
  }

  if (!isNaN(playersValue)) {
    games = games.filter(g =>
      g.players?.min != null &&
      g.players?.max != null &&
      playersValue >= g.players.min &&
      playersValue <= g.players.max
    );
  }

  if (!isNaN(timeValue)) {
    games = games.filter(g =>
      g.playTime?.min != null &&
      g.playTime?.max != null &&
      timeValue >= g.playTime.min &&
      timeValue <= g.playTime.max
    );
  }

  if (!isNaN(ratingValue)) {
    games = games.filter(g =>
      g.rating != null &&
      g.rating >= ratingValue
    );
  }

  if (statusValue === "played") {
    games = games.filter(g => g.plays > 0);
  }

  if (statusValue === "unplayed") {
    games = games.filter(g => g.plays === 0);
  }

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
      <img src="${g.image || "https://via.placeholder.com/400"}">
      <div class="card-header">
        <strong>${g.name}</strong>
        <span>⭐ ${g.rating ?? "—"}</span>
      </div>
      <div class="card-stats">
        <span>${formatRange(g.players?.min, g.players?.max, " players")}</span>
        <span>${formatRange(g.playTime?.min, g.playTime?.max, " min")}</span>
      </div>
      <div class="plays">${g.plays || 0} plays</div>
    `;

    card.onclick = () => {
      location.href = `game.html?id=${g.id}`;
    };

    list.appendChild(card);
  });
}

/* =============================
   ADD NEW GAME
============================= */
addBtn.onclick = async () => {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";

  backdrop.innerHTML = `
    <div class="modal">
      <div class="close-button">×</div>
      <h2>Add Game</h2>
      <input id="newName" placeholder="Game name">

      <div class="row">
        <input id="pMin" type="number" placeholder="Players min">
        <input id="pMax" type="number" placeholder="Players max">
      </div>

      <div class="row">
        <input id="tMin" type="number" placeholder="Time min (mins)">
        <input id="tMax" type="number" placeholder="Time max (mins)">
      </div>

      <input id="newImage" placeholder="Image URL (optional)">
      <button id="saveNew">Add Game</button>
    </div>
  `;

  backdrop.querySelector(".close-button").onclick = () => backdrop.remove();

  backdrop.querySelector("#saveNew").onclick = async () => {
    const name = backdrop.querySelector("#newName").value.trim();
    if (!name) return alert("Game name required");

    const games = await getGames();

    games.push({
      id: crypto.randomUUID(),
      name,
      image: backdrop.querySelector("#newImage").value.trim() || null,
      plays: 0,
      rating: null,
      review: "",
      players: {
        min: Number(backdrop.querySelector("#pMin").value) || null,
        max: Number(backdrop.querySelector("#pMax").value) || null
      },
      playTime: {
        min: Number(backdrop.querySelector("#tMin").value) || null,
        max: Number(backdrop.querySelector("#tMax").value) || null
      },
      playHistory: {},
      badges: []
    });

    await saveGames(games);
    backdrop.remove();
    render();
  };

  document.body.appendChild(backdrop);
};

search.oninput = render;
sort.onchange = render;
filterPlayers.oninput = render;
filterTime.oninput = render;
filterRating.oninput = render;
filterPlayed.onchange = render;

render();
