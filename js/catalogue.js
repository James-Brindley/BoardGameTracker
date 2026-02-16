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

  const searchValue = search.value.toLowerCase();
  const playersValue = parseInt(filterPlayers.value);
  const timeValue = parseInt(filterTime.value);
  const ratingValue = parseFloat(filterRating.value);
  const statusValue = filterPlayed.value;

  if (searchValue) {
    games = games.filter(g => 
      g.name.toLowerCase().includes(searchValue) || 
      (g.tags && g.tags.some(t => t.toLowerCase().includes(searchValue)))
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

  if (!games.length) {
    list.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">🎲</span>
        <h3>No games found</h3>
        <p>Try adjusting your filters or search for something else.</p>
      </div>
    `;
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

    card.onclick = () => {
      location.href = `game.html?id=${g.id}`;
    };

    list.appendChild(card);
  });
}

// ADD GAME MODAL
addBtn.onclick = () => {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";

  backdrop.innerHTML = `
    <div class="modal">
      <div class="close-button">×</div>
      <h2>Add New Game</h2>
      
      <div style="margin-bottom:1rem; position:relative;">
        <div class="input-header">Auto-fill from BGG</div>
        <div style="display:flex; gap:10px;">
            <input id="bggSearch" class="ui-input" placeholder="Type game name...">
            <button id="bggBtn" class="secondary" style="white-space:nowrap;">Search</button>
        </div>
        <div id="bggResults" class="bgg-results"></div>
      </div>

      <hr style="border:0; border-top:1px solid var(--border); margin:1.5rem 0;">

      <div class="input-header">Details</div>
      <input id="newName" class="ui-input" placeholder="Game Name" style="margin-bottom:10px">
      
      <div class="input-header">Cover Image</div>
      <div style="display:flex; gap:10px; align-items:center; margin-bottom:10px;">
        <input id="newImage" class="ui-input" placeholder="Image URL">
        <span style="font-size:0.8rem; color:var(--subtext)">OR</span>
        <label for="imgUpload" class="secondary" style="padding:8px 12px; border-radius:12px; cursor:pointer; font-weight:600; font-size:0.9rem; background:rgba(120,120,128,0.15); color:var(--accent);">Upload</label>
        <input id="imgUpload" type="file" accept="image/*" hidden>
      </div>

      <div class="input-header">Specs</div>
      <div class="row">
        <input id="pMin" type="number" class="ui-input" placeholder="Min Players">
        <input id="pMax" type="number" class="ui-input" placeholder="Max Players">
      </div>

      <div class="row">
        <input id="tMin" type="number" class="ui-input" placeholder="Min Time (m)">
        <input id="tMax" type="number" class="ui-input" placeholder="Max Time (m)">
      </div>
      
      <div class="input-header">Tags (comma separated)</div>
      <input id="newTags" class="ui-input" placeholder="e.g. Co-op, Deckbuilder, Sci-Fi" style="margin-bottom:1rem">

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

  // CLOSE
  backdrop.querySelector(".close-button").onclick = () => backdrop.remove();

  // UPLOAD
  const fileInput = backdrop.querySelector("#imgUpload");
  fileInput.onchange = async () => {
    if (fileInput.files.length > 0) {
        const btn = backdrop.querySelector("label[for='imgUpload']");
        btn.textContent = "Uploading...";
        try {
            const url = await uploadImage(fileInput.files[0]);
            backdrop.querySelector("#newImage").value = url;
            btn.textContent = "Done!";
        } catch (e) {
            alert("Upload failed. Make sure you created the 'game-images' bucket in Supabase.");
            btn.textContent = "Upload";
        }
    }
  };

  // BGG SEARCH
  const bggBtn = backdrop.querySelector("#bggBtn");
  const bggInput = backdrop.querySelector("#bggSearch");
  const bggResults = backdrop.querySelector("#bggResults");

  bggBtn.onclick = async () => {
    const query = bggInput.value.trim();
    if (!query) return;
    bggBtn.textContent = "...";
    
    try {
        const res = await fetch(`https://corsproxy.io/?https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame`);
        const text = await res.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, "text/xml");
        const items = xml.querySelectorAll("item");

        bggResults.innerHTML = "";
        bggResults.style.display = "block";

        if (items.length === 0) {
            bggResults.innerHTML = "<div class='bgg-item'>No results found</div>";
        }

        items.forEach(item => {
            const id = item.getAttribute("id");
            const name = item.querySelector("name").getAttribute("value");
            const year = item.querySelector("yearpublished")?.getAttribute("value") || "?";
            
            const div = document.createElement("div");
            div.className = "bgg-item";
            div.textContent = `${name} (${year})`;
            div.onclick = async () => {
                // Fetch Details
                bggResults.style.display = "none";
                bggInput.value = name;
                
                const detRes = await fetch(`https://corsproxy.io/?https://boardgamegeek.com/xmlapi2/thing?id=${id}`);
                const detText = await detRes.text();
                const detXml = parser.parseFromString(detText, "text/xml");
                const item = detXml.querySelector("item");

                backdrop.querySelector("#newName").value = item.querySelector("name[type='primary']").getAttribute("value");
                backdrop.querySelector("#newImage").value = item.querySelector("image")?.textContent || "";
                backdrop.querySelector("#pMin").value = item.querySelector("minplayers").getAttribute("value");
                backdrop.querySelector("#pMax").value = item.querySelector("maxplayers").getAttribute("value");
                backdrop.querySelector("#tMin").value = item.querySelector("minplaytime").getAttribute("value");
                backdrop.querySelector("#tMax").value = item.querySelector("maxplaytime").getAttribute("value");
            };
            bggResults.appendChild(div);
        });
    } catch (e) {
        alert("BGG Search failed. Might be a CORS issue.");
    } finally {
        bggBtn.textContent = "Search";
    }
  };

  // SAVE
  backdrop.querySelector("#saveNew").onclick = async () => {
    const name = backdrop.querySelector("#newName").value.trim();
    if (!name) return alert("Game name required");

    const tagsStr = backdrop.querySelector("#newTags").value;
    const tags = tagsStr ? tagsStr.split(",").map(t => t.trim()).filter(t => t) : [];

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
      },
      tags: tags
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
