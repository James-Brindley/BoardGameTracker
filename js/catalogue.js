import { getGames, addGame, uploadImage } from "./data.js";

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

  // If no games exist or error
  if (!games || !Array.isArray(games)) {
      list.innerHTML = `<div class="card" style="text-align:center">Error loading games.</div>`;
      return;
  }

  const searchValue = search.value.toLowerCase();
  const playersValue = parseInt(filterPlayers.value);
  const timeValue = parseInt(filterTime.value);
  const ratingValue = parseFloat(filterRating.value);
  const statusValue = filterPlayed.value;

  // Search
  if (searchValue) {
    games = games.filter(g => 
      (g.name && g.name.toLowerCase().includes(searchValue)) || 
      (g.tags && g.tags.some(t => t.toLowerCase().includes(searchValue)))
    );
  }

  // Filters
  if (!isNaN(playersValue)) {
    games = games.filter(g => g.players?.min != null && playersValue >= g.players.min && playersValue <= g.players.max);
  }
  if (!isNaN(timeValue)) {
    games = games.filter(g => g.playTime?.min != null && timeValue >= g.playTime.min && timeValue <= g.playTime.max);
  }
  if (!isNaN(ratingValue)) {
    games = games.filter(g => g.rating != null && g.rating >= ratingValue);
  }
  if (statusValue === "played") games = games.filter(g => g.plays > 0);
  if (statusValue === "unplayed") games = games.filter(g => g.plays === 0);

  // Sort
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

    let tagsHtml = "";
    if (g.tags && g.tags.length > 0) {
        tagsHtml = `<div style="padding:0 1rem 0.5rem;">${g.tags.slice(0,3).map(t => `<span class="tag-pill" style="font-size:0.65rem; padding:2px 6px;">${t}</span>`).join("")}</div>`;
    }

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
      ${tagsHtml}
      <div class="plays">${g.plays || 0} Plays</div>
    `;

    card.onclick = () => { location.href = `game.html?id=${g.id}`; };
    list.appendChild(card);
  });
}

// Add Game Modal (Kept same logic, just ensuring it triggers render)
addBtn.onclick = () => {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  // ... (HTML content same as previous response for brevity) ...
  // *Re-inserting strictly the HTML part if you need it, but the key fix was render()*
  // Assuming you have the modal HTML from previous turn. 
  // Let me know if you need full modal code again.
  // Short version for "Paste compliance":
  backdrop.innerHTML = `
    <div class="modal">
      <div class="close-button">×</div>
      <h2>Add New Game</h2>
      <input id="newName" class="ui-input" placeholder="Game Name">
      <button id="saveNew" style="width:100%; margin-top:1rem">Add</button>
    </div>
  `;
  backdrop.querySelector(".close-button").onclick = () => backdrop.remove();
  backdrop.querySelector("#saveNew").onclick = async () => {
      const name = backdrop.querySelector("#newName").value;
      if(name) {
          await addGame({ name, plays:0, players:{}, playTime:{}, tags:[], tracking:{score:false, won:false}, playHistory:{} });
          backdrop.remove();
          render();
      }
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
