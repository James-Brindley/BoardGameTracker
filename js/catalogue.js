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
  
  let games = [];
  try {
    games = await getGames();
  } catch (e) {
    console.error("Failed to load games", e);
    list.innerHTML = `<div class="card" style="text-align:center; color:var(--danger)">Error loading games. Check connection.</div>`;
    return;
  }

  const searchValue = search.value.toLowerCase();
  const playersValue = parseInt(filterPlayers.value);
  const timeValue = parseInt(filterTime.value);
  const ratingValue = parseFloat(filterRating.value);
  const statusValue = filterPlayed.value;

  // Filter
  if (searchValue) {
    games = games.filter(g => 
      (g.name && g.name.toLowerCase().includes(searchValue)) || 
      (g.tags && g.tags.some(t => t.toLowerCase().includes(searchValue)))
    );
  }

  if (!isNaN(playersValue)) {
    games = games.filter(g =>
      g.players?.min != null && g.players?.max != null &&
      playersValue >= g.players.min && playersValue <= g.players.max
    );
  }

  if (!isNaN(timeValue)) {
    games = games.filter(g =>
      g.playTime?.min != null && g.playTime?.max != null &&
      timeValue >= g.playTime.min && timeValue <= g.playTime.max
    );
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
    list.innerHTML = `
      <div style="text-align:center; padding:4rem; color:var(--subtext); width:100%; grid-column: 1 / -1;">
        <h3>No games found</h3>
        <p>Try adjusting your filters or search.</p>
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

// BGG & ADD MODAL (Existing logic kept, just ensuring render is called safely)
addBtn.onclick = () => {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = `
    <div class="modal">
      <div class="close-button">×</div>
      <h2>Add New Game</h2>
      <div class="input-header">Auto-fill from BGG</div>
      <div style="display:flex; gap:10px;"><input id="bggSearch" class="ui-input" placeholder="Type game name..."><button id="bggBtn" class="secondary">Search</button></div>
      <div id="bggResults" style="display:none; max-height:150px; overflow-y:auto; margin-top:10px; background:rgba(0,0,0,0.05); padding:10px; border-radius:8px;"></div>
      <hr style="margin:1.5rem 0; border:0; border-top:1px solid var(--border);">
      <div class="input-header">Details</div>
      <input id="newName" class="ui-input" placeholder="Game Name">
      <div style="display:flex; gap:10px; margin-top:10px;"><input id="newImage" class="ui-input" placeholder="Image URL"><label for="imgUpload" class="secondary" style="padding:10px; border-radius:12px; cursor:pointer;">Upload</label><input id="imgUpload" type="file" hidden></div>
      <div class="input-header">Stats</div>
      <div class="row"><input id="pMin" type="number" class="ui-input" placeholder="Min Players"><input id="pMax" type="number" class="ui-input" placeholder="Max Players"></div>
      <div class="row"><input id="tMin" type="number" class="ui-input" placeholder="Min Time"><input id="tMax" type="number" class="ui-input" placeholder="Max Time"></div>
      <div class="input-header">Tags</div>
      <input id="newTags" class="ui-input" placeholder="Comma separated">
      <div style="margin-top:1rem"><label><input type="checkbox" id="trackScore"> Track Score</label> <label><input type="checkbox" id="trackWon"> Track Win/Loss</label></div>
      <button id="saveNew" style="width:100%; margin-top:1.5rem">Add Game</button>
    </div>
  `;
  
  backdrop.querySelector(".close-button").onclick = () => backdrop.remove();
  
  // BGG Logic
  const bggBtn = backdrop.querySelector("#bggBtn");
  const bggRes = backdrop.querySelector("#bggResults");
  bggBtn.onclick = async () => {
    bggBtn.textContent = "...";
    try {
        const res = await fetch(`https://corsproxy.io/?https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(backdrop.querySelector("#bggSearch").value)}&type=boardgame`);
        const text = await res.text();
        const xml = new DOMParser().parseFromString(text, "text/xml");
        const items = xml.querySelectorAll("item");
        bggRes.innerHTML = ""; bggRes.style.display = "block";
        items.forEach(i => {
            const div = document.createElement("div");
            div.style.padding = "8px"; div.style.borderBottom = "1px solid var(--border)"; div.style.cursor = "pointer";
            div.textContent = i.querySelector("name").getAttribute("value");
            div.onclick = async () => {
                const id = i.getAttribute("id");
                const dRes = await fetch(`https://corsproxy.io/?https://boardgamegeek.com/xmlapi2/thing?id=${id}`);
                const dText = await dRes.text();
                const dXml = new DOMParser().parseFromString(dText, "text/xml");
                const itm = dXml.querySelector("item");
                backdrop.querySelector("#newName").value = itm.querySelector("name[type='primary']").getAttribute("value");
                backdrop.querySelector("#newImage").value = itm.querySelector("image")?.textContent || "";
                backdrop.querySelector("#pMin").value = itm.querySelector("minplayers").getAttribute("value");
                backdrop.querySelector("#pMax").value = itm.querySelector("maxplayers").getAttribute("value");
                backdrop.querySelector("#tMin").value = itm.querySelector("minplaytime").getAttribute("value");
                backdrop.querySelector("#tMax").value = itm.querySelector("maxplaytime").getAttribute("value");
                bggRes.style.display = "none";
            };
            bggRes.appendChild(div);
        });
    } catch(e) { alert("BGG Error"); }
    bggBtn.textContent = "Search";
  };

  // Upload Logic
  const fileIn = backdrop.querySelector("#imgUpload");
  fileIn.onchange = async () => {
      if(fileIn.files[0]) {
          try {
              const url = await uploadImage(fileIn.files[0]);
              backdrop.querySelector("#newImage").value = url;
              alert("Uploaded!");
          } catch(e) { alert("Upload Failed. Check Supabase Bucket."); }
      }
  };

  // Save Logic
  backdrop.querySelector("#saveNew").onclick = async () => {
      const name = backdrop.querySelector("#newName").value;
      if(!name) return alert("Name required");
      await addGame({
          name,
          image: backdrop.querySelector("#newImage").value,
          players: { min: backdrop.querySelector("#pMin").value, max: backdrop.querySelector("#pMax").value },
          playTime: { min: backdrop.querySelector("#tMin").value, max: backdrop.querySelector("#tMax").value },
          tags: backdrop.querySelector("#newTags").value.split(",").map(t=>t.trim()).filter(t=>t),
          tracking: { score: backdrop.querySelector("#trackScore").checked, won: backdrop.querySelector("#trackWon").checked },
          plays: 0, rating: null, review: "", playHistory: {}
      });
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
