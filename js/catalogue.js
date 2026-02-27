import { getGames, addGame } from "./data.js";

const list = document.getElementById("list");
const search = document.getElementById("search");
const sort = document.getElementById("sort");
const addBtn = document.getElementById("addGame");

const filterPlayers = document.getElementById("filterPlayers");
const filterTime = document.getElementById("filterTime");
const filterRating = document.getElementById("filterRating");
const filterPlayed = document.getElementById("filterPlayed");
const filterStatus = document.getElementById("filterStatus");

function formatRange(min, max, suffix="") {
  if (min == null && max == null) return "—";
  if (min === max || max == null) return `${min}${suffix}`;
  return `${min}–${max}${suffix}`;
}

async function render() {
  list.innerHTML = `<div class="card" style="text-align:center; color:var(--subtext)">Loading library...</div>`;
  
  let games = await getGames();

  if (!games || !Array.isArray(games)) {
      list.innerHTML = `<div class="card" style="text-align:center">Error loading games.</div>`;
      return;
  }

  const searchValue = search.value.toLowerCase();
  const playersValue = parseInt(filterPlayers.value);
  const timeValue = parseInt(filterTime.value);
  const ratingValue = parseFloat(filterRating.value);
  const playedValue = filterPlayed.value;
  const statusValue = filterStatus ? filterStatus.value : "all";

  // Filter Status
  if (statusValue !== "all") {
    games = games.filter(g => {
        const s = (g.tracking && g.tracking.status) ? g.tracking.status : "owned";
        return s === statusValue;
    });
  }

  if (searchValue) {
    games = games.filter(g => g.name.toLowerCase().includes(searchValue));
  }
  if (!isNaN(playersValue)) {
    games = games.filter(g => g.players?.min != null && g.players?.max != null && playersValue >= g.players.min && playersValue <= g.players.max);
  }
  if (!isNaN(timeValue)) {
    games = games.filter(g => g.playTime?.min != null && g.playTime?.max != null && timeValue >= g.playTime.min && timeValue <= g.playTime.max);
  }
  if (!isNaN(ratingValue)) {
    games = games.filter(g => g.rating != null && g.rating >= ratingValue);
  }
  if (playedValue === "played") games = games.filter(g => g.plays > 0);
  if (playedValue === "unplayed") games = games.filter(g => g.plays === 0);

  games.sort((a, b) => sort.value === "name" ? a.name.localeCompare(b.name) : (b[sort.value] || 0) - (a[sort.value] || 0));

  list.innerHTML = "";

  if (games.length === 0) {
    list.innerHTML = `<div class="card" style="text-align:center; padding:3rem; grid-column:1/-1;">No games found.</div>`;
    return;
  }

  games.forEach(g => {
    const card = document.createElement("div");
    card.className = "game-card";

    // Little badge for non-owned games
    const stat = (g.tracking && g.tracking.status) ? g.tracking.status : "owned";
    let statusBadge = "";
    if (stat === "wishlist") statusBadge = `<span style="font-size:0.65rem; background:rgba(0,122,255,0.1); color:var(--accent); padding:2px 6px; border-radius:4px; margin-left:6px; vertical-align:middle;">Wishlist</span>`;
    else if (stat === "friends") statusBadge = `<span style="font-size:0.65rem; background:rgba(120,120,128,0.1); color:var(--subtext); padding:2px 6px; border-radius:4px; margin-left:6px; vertical-align:middle;">Friend's</span>`;

    card.innerHTML = `
      <img src="${g.image || "https://via.placeholder.com/400"}" loading="lazy">
      <div class="card-header" style="align-items:center;">
        <strong>${g.name}${statusBadge}</strong>
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

// === NEW ADD GAME MODAL ===
addBtn.onclick = () => {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";

  backdrop.innerHTML = `
    <div class="modal wide">
      <div class="close-button">×</div>
      <h2 style="text-align:left;">Add New Game</h2>
      
      <div class="modal-split">
        <div class="modal-split-left">
            <div class="input-header" style="margin-top:0;">Game Details</div>
            <input id="newName" class="ui-input" placeholder="Game Name" style="margin-bottom:10px">
            <input id="newImage" class="ui-input" placeholder="Image URL (optional)" style="margin-bottom:10px">
            
            <select id="newStatus" class="ui-select" style="margin-bottom:10px;">
                <option value="owned">Collection: Owned</option>
                <option value="wishlist">Collection: Wishlist</option>
                <option value="friends">Collection: Friend's Copy</option>
                <option value="previously_owned">Collection: Previously Owned</option>
            </select>

            <div class="row">
                <input id="pMin" type="number" class="ui-input" placeholder="Min Players">
                <input id="pMax" type="number" class="ui-input" placeholder="Max Players">
            </div>

            <div class="row">
                <input id="tMin" type="number" class="ui-input" placeholder="Min Time (m)">
                <input id="tMax" type="number" class="ui-input" placeholder="Max Time (m)">
            </div>
            
            <div class="input-header">Tracking Features</div>
            <div class="toggle-row">
                <span style="font-weight:600; font-size:0.9rem;">Track High Score</span>
                <label class="toggle-switch">
                    <input type="checkbox" id="trackScore">
                    <span class="toggle-slider"></span>
                </label>
            </div>
            <div class="toggle-row">
                <span style="font-weight:600; font-size:0.9rem;">Track Low Score</span>
                <label class="toggle-switch">
                    <input type="checkbox" id="trackLowScore">
                    <span class="toggle-slider"></span>
                </label>
            </div>
            <div class="toggle-row">
                <span style="font-weight:600; font-size:0.9rem;">Track Win/Loss</span>
                <label class="toggle-switch">
                    <input type="checkbox" id="trackWon">
                    <span class="toggle-slider"></span>
                </label>
            </div>
        </div>

        <div class="modal-split-right">
            <div class="input-header" style="margin-top:0;">Live Preview</div>
            <div class="game-card" style="pointer-events:none; width:100%; height:auto;">
                <img id="previewImage" src="https://via.placeholder.com/400" style="height:150px; border-bottom:1px solid var(--border);">
                <div class="card-header" style="padding:0.8rem 1rem 0.5rem;">
                    <strong id="previewName">Game Name</strong>
                </div>
                <div class="card-stats" style="padding:0 1rem; padding-bottom:1rem;">
                    <span id="previewPlayers">👥 —</span>
                    <span id="previewTime">⏱ —</span>
                </div>
            </div>
        </div>
      </div>

      <button id="saveNew" style="width:100%; margin-top:2rem;">Add to Library</button>
    </div>
  `;

  document.body.appendChild(backdrop);
  
  backdrop.querySelector(".close-button").onclick = () => backdrop.remove();

  // --- LIVE PREVIEW LOGIC ---
  const inputs = {
      name: document.getElementById("newName"),
      img: document.getElementById("newImage"),
      pMin: document.getElementById("pMin"),
      pMax: document.getElementById("pMax"),
      tMin: document.getElementById("tMin"),
      tMax: document.getElementById("tMax")
  };
  
  const preview = {
      name: document.getElementById("previewName"),
      img: document.getElementById("previewImage"),
      players: document.getElementById("previewPlayers"),
      time: document.getElementById("previewTime")
  };

  const updatePreview = () => {
      preview.name.textContent = inputs.name.value.trim() || "Game Name";
      preview.img.src = inputs.img.value.trim() || "https://via.placeholder.com/400";
      
      const pMinVal = inputs.pMin.value ? Number(inputs.pMin.value) : null;
      const pMaxVal = inputs.pMax.value ? Number(inputs.pMax.value) : null;
      preview.players.textContent = `👥 ${formatRange(pMinVal, pMaxVal)}`;

      const tMinVal = inputs.tMin.value ? Number(inputs.tMin.value) : null;
      const tMaxVal = inputs.tMax.value ? Number(inputs.tMax.value) : null;
      preview.time.textContent = `⏱ ${formatRange(tMinVal, tMaxVal, 'm')}`;
  };

  Object.values(inputs).forEach(input => input.addEventListener("input", updatePreview));

  // --- SAVE LOGIC ---
  backdrop.querySelector("#saveNew").onclick = async () => {
    const name = inputs.name.value.trim();
    if (!name) return alert("Game name required");

    const newGame = {
      name,
      image: inputs.img.value.trim() || null,
      plays: 0,
      rating: null,
      review: "",
      players: {
        min: Number(inputs.pMin.value) || null,
        max: Number(inputs.pMax.value) || null
      },
      playTime: {
        min: Number(inputs.tMin.value) || null,
        max: Number(inputs.tMax.value) || null
      },
      playHistory: {},
      tracking: {
        score: document.getElementById("trackScore").checked,
        lowScore: document.getElementById("trackLowScore").checked,
        won: document.getElementById("trackWon").checked,
        status: document.getElementById("newStatus").value // Save new status
      }
    };

    await addGame(newGame);
    backdrop.remove();
    render();
  };
};

search.oninput = render;
sort.onchange = render;
filterPlayers.oninput = render;
filterTime.oninput = render;
filterRating.oninput = render;
filterPlayed.onchange = render;
if(filterStatus) filterStatus.onchange = render;

render();
