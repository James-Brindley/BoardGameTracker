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

// === BULLETPROOF BGG FETCH HELPER ===
async function fetchBGG(url) {
    try {
        // Primary approach: wrap XML inside JSON to completely bypass strict browser blocking
        const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        return data.contents;
    } catch (e) {
        // Fallback proxy if the first one goes down
        const res = await fetch(`https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`);
        return await res.text();
    }
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
            <div class="input-header" style="margin-top:0;">Quick Fill (BGG)</div>
            <div class="bgg-search-container">
                <input id="bggInput" class="ui-input" placeholder="Search BoardGameGeek...">
                <button id="bggBtn" class="secondary">Search</button>
                <div id="bggResults" class="bgg-results"></div>
            </div>

            <div class="input-header">Game Details</div>
            <input id="newName" class="ui-input" placeholder="Game Name" style="margin-bottom:10px">
            <input id="newImage" class="ui-input" placeholder="Image URL (optional)" style="margin-bottom:10px">

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
                <span style="font-weight:600; font-size:0.9rem;">Track Score</span>
                <label class="toggle-switch">
                    <input type="checkbox" id="trackScore">
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
  
  // Close Button Logic
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

  // --- BGG QUICK FILL LOGIC ---
  const bggInput = document.getElementById("bggInput");
  const bggBtn = document.getElementById("bggBtn");
  const bggResults = document.getElementById("bggResults");

  bggBtn.onclick = async () => {
      const query = bggInput.value.trim();
      if (!query) return;
      
      bggBtn.textContent = "...";
      bggResults.style.display = "block";
      bggResults.innerHTML = `<div class="bgg-loading">Searching BGG...</div>`;
      
      try {
          const bggUrl = `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame`;
          const text = await fetchBGG(bggUrl);
          
          const xml = new DOMParser().parseFromString(text, "text/xml");
          const items = xml.querySelectorAll("item");

          bggResults.innerHTML = "";

          if (items.length === 0) {
              bggResults.innerHTML = `<div class="bgg-loading">No results found.</div>`;
              setTimeout(() => { bggResults.style.display = "none"; }, 2000);
              return;
          }

          items.forEach(item => {
              const id = item.getAttribute("id");
              const nameNode = item.querySelector("name");
              const name = nameNode ? nameNode.getAttribute("value") : "Unknown";
              const yearNode = item.querySelector("yearpublished");
              const year = yearNode ? yearNode.getAttribute("value") : "N/A";
              
              const div = document.createElement("div");
              div.className = "bgg-item";
              div.innerHTML = `<span class="bgg-item-title">${name}</span><span class="bgg-item-year">${year}</span>`;
              
              div.onclick = async () => {
                  bggResults.innerHTML = `<div class="bgg-loading">Fetching details...</div>`;
                  try {
                      const detBggUrl = `https://boardgamegeek.com/xmlapi2/thing?id=${id}`;
                      const detText = await fetchBGG(detBggUrl);
                      
                      const detXml = new DOMParser().parseFromString(detText, "text/xml");
                      const itm = detXml.querySelector("item");
                      
                      const primaryName = itm.querySelector("name[type='primary']")?.getAttribute("value") || name;
                      const imageUrl = itm.querySelector("image")?.textContent || "";
                      const minP = itm.querySelector("minplayers")?.getAttribute("value") || "";
                      const maxP = itm.querySelector("maxplayers")?.getAttribute("value") || "";
                      const minT = itm.querySelector("minplaytime")?.getAttribute("value") || "";
                      const maxT = itm.querySelector("maxplaytime")?.getAttribute("value") || "";

                      inputs.name.value = primaryName;
                      inputs.img.value = imageUrl;
                      inputs.pMin.value = minP;
                      inputs.pMax.value = maxP;
                      inputs.tMin.value = minT;
                      inputs.tMax.value = maxT;
                      
                      updatePreview();
                      bggResults.style.display = "none";
                  } catch (e) {
                      bggResults.innerHTML = `<div class="bgg-loading">Error fetching details.</div>`;
                      setTimeout(() => { bggResults.style.display = "none"; }, 2000);
                  }
              };
              bggResults.appendChild(div);
          });
      } catch (e) {
          bggResults.innerHTML = `<div class="bgg-loading">Search Failed. Check connection.</div>`;
          setTimeout(() => { bggResults.style.display = "none"; }, 2000);
      } finally {
          bggBtn.textContent = "Search";
      }
  };

  // Close BGG dropdown if clicked outside
  document.addEventListener("click", (e) => {
      if (!document.querySelector(".bgg-search-container").contains(e.target)) {
          bggResults.style.display = "none";
      }
  });

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
        won: document.getElementById("trackWon").checked
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

render();
