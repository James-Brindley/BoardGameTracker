import { getGames, addGame } from "./data.js";

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

// MAKE RENDER ASYNC
async function render() {
  list.innerHTML = '<div class="card">Loading your collection...</div>';
  
  // FETCH FROM SERVER
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
      g.playTime?.max != null &&
      g.playTime.max <= timeValue
    );
  }

  if (!isNaN(ratingValue)) {
    games = games.filter(g => (g.rating || 0) >= ratingValue);
  }

  if (statusValue !== "all") {
    if (statusValue === "played") games = games.filter(g => g.plays > 0);
    if (statusValue === "unplayed") games = games.filter(g => g.plays === 0);
  }

  const sortVal = sort.value;
  games.sort((a, b) => {
    if (sortVal === "name") return a.name.localeCompare(b.name);
    if (sortVal === "plays") return (b.plays || 0) - (a.plays || 0);
    if (sortVal === "rating") return (b.rating || 0) - (a.rating || 0);
    return 0;
  });

  list.innerHTML = "";
  if (games.length === 0) {
    list.innerHTML = '<div class="card">No games found.</div>';
    return;
  }

  games.forEach(g => {
    const card = document.createElement("div");
    card.className = "card game-card";
    card.onclick = () => location.href = `game.html?id=${g.id}`;

    card.innerHTML = `
      <img class="game-card-img" src="${g.image || 'https://via.placeholder.com/200'}" alt="${g.name}">
      <div class="game-card-content">
        <div class="game-card-title">${g.name}</div>
        <div class="game-card-stats">
          <span>👥 ${formatRange(g.players?.min, g.players?.max)}</span>
          <span>⏳ ${formatRange(g.playTime?.min, g.playTime?.max, "m")}</span>
        </div>
        <div class="game-card-footer">
          <span class="badge badge-plays">${g.plays || 0} plays</span>
          ${g.rating ? `<span class="badge badge-rating">⭐ ${g.rating}</span>` : ""}
        </div>
      </div>
    `;
    list.appendChild(card);
  });
}

// ADD GAME LOGIC
addBtn.onclick = () => {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = `
    <div class="card modal">
      <div class="modal-header">
        <h2>Add New Game</h2>
        <button class="close-button">×</button>
      </div>
      <input id="newName" class="ui-input" placeholder="Game Name">
      
      <div class="row">
        <input id="pMin" type="number" placeholder="Players min">
        <input id="pMax" type="number" placeholder="Players max">
      </div>

      <div class="row">
        <input id="tMin" type="number" placeholder="Time min (mins)">
        <input id="tMax" type="number" placeholder="Time max (mins)">
      </div>

      <input id="newImage" class="ui-input" placeholder="Image URL (optional)">
      <button id="saveNew" style="width:100%; margin-top:1rem;">Add Game</button>
    </div>
  `;

  backdrop.querySelector(".close-button").onclick = () => backdrop.remove();

  backdrop.querySelector("#saveNew").onclick = async () => {
    const name = backdrop.querySelector("#newName").value.trim();
    if (!name) return alert("Game name required");

    const newGame = {
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
      playHistory: {}
    };

    await addGame(newGame);
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
