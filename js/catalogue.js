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

async function render() {
  list.innerHTML = `<div class="card" style="text-align:center; color:var(--subtext)">Loading library...</div>`;
  
  let games = await getGames();

  // Safety Check
  if (!games || !Array.isArray(games)) {
      list.innerHTML = `<div class="card" style="text-align:center">Error loading games.</div>`;
      return;
  }

  const searchValue = search.value.toLowerCase();
  const playersValue = parseInt(filterPlayers.value);
  const timeValue = parseInt(filterTime.value);
  const ratingValue = parseFloat(filterRating.value);
  const statusValue = filterPlayed.value;

  if (searchValue) {
    games = games.filter(g => g.name.toLowerCase().includes(searchValue));
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
    games = games.filter(g => g.rating != null && g.rating >= ratingValue);
  }

  if (statusValue === "played") games = games.filter(g => g.plays > 0);
  if (statusValue === "unplayed") games = games.filter(g => g.plays === 0);

  games.sort((a, b) =>
    sort.value === "name"
      ? a.name.localeCompare(b.name)
      : (b[sort.value] || 0) - (a[sort.value] || 0)
  );

  list.innerHTML = "";

  if (games.length === 0) {
    list.innerHTML = `<div class="card" style="text-align:center; padding:3rem; grid-column:1/-1;">No games found.</div>`;
    return;
  }

  games.forEach(g => {
    const card = document.createElement("div");
    card.className = "game-card";

    card.innerHTML = `
      <img src="${g.image || "https://via.placeholder.com/400"}" loading="lazy">
      <div class="card-header">
        <strong>${g.name}</strong>
        ${g.rating ? `<span class="rating-badge">★ ${g.rating}</span>` : ''}
      </div>
      <div class="card-stats">
        <span>👥 ${formatRange(g.players?.min, g.players?.max)}</span>
        <span>⏱ ${formatRange(g.playTime?.min, g.playTime?.max, "m")}</span>
      </div>
      <div class="plays">${g.plays || 0} Plays</div>
    `;

    card.onclick = () => {
      location.href = `game.html?id=${g.id}`;
    };

    list.appendChild(card);
  });
}

addBtn.onclick = () => {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";

  backdrop.innerHTML = `
    <div class="modal">
      <div class="close-button">×</div>
      <h2>Add New Game</h2>
      
      <div class="input-header">Game Details</div>
      <input id="newName" class="ui-input" placeholder="Game Name" style="margin-bottom:10px">
      <input id="newImage" class="ui-input" placeholder="Image URL (optional)">

      <div class="row">
        <input id="pMin" type="number" class="ui-input" placeholder="Min Players">
        <input id="pMax" type="number" class="ui-input" placeholder="Max Players">
      </div>

      <div class="row">
        <input id="tMin" type="number" class="ui-input" placeholder="Min Time (m)">
        <input id="tMax" type="number" class="ui-input" placeholder="Max Time (m)">
      </div>
      
      <div class="toggle-group">
        <label style="display:flex; align-items:center; gap:8px; font-size:0.9rem;">
          <input type="checkbox" id="trackScore" style="accent-color:var(--accent); width:18px; height:18px;"> Track Score
        </label>
        <label style="display:flex; align-items:center; gap:8px; font-size:0.9rem;">
          <input type="checkbox" id="trackWon" style="accent-color:var(--accent); width:18px; height:18px;"> Track Win/Loss
        </label>
      </div>

      <button id="saveNew" style="width:100%; margin-top:1rem">Add to Library</button>
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
      playHistory: {},
      tracking: {
        score: backdrop.querySelector("#trackScore").checked,
        won: backdrop.querySelector("#trackWon").checked
      }
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
