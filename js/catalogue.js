import { getGames, saveGames } from "./data.js";

const list = document.getElementById("list");
const search = document.getElementById("search");
const sort = document.getElementById("sort");
const modal = document.getElementById("modal");

function formatRange(r) {
  if (!r || r.min == null) return "—";
  return r.min === r.max ? `${r.min}` : `${r.min}–${r.max}`;
}

function render() {
  let games = getGames();

  const query = search.value.toLowerCase();
  if (query) {
    games = games.filter(g => g.name.toLowerCase().includes(query));
  }

  const key = sort.value;
  games.sort((a, b) =>
    key === "name"
      ? a.name.localeCompare(b.name)
      : (b[key] || 0) - (a[key] || 0)
  );

  list.innerHTML = "";

  if (!games.length) {
    list.innerHTML = `<p style="opacity:0.6">No games yet</p>`;
    return;
  }

  games.forEach(g => {
    const card = document.createElement("div");
    card.className = "game-card";
    card.innerHTML = `
      <img src="${g.image || "https://via.placeholder.com/400x200"}">
      <div class="card-header">
        <strong>${g.name}</strong>
        <span>⭐ ${g.rating ?? "—"}</span>
      </div>
      <div class="card-stats">
        <span>${formatRange(g.players)} players</span>
        <span>${formatRange(g.playTime)} mins</span>
      </div>
      <div>${g.plays || 0} plays</div>
    `;
    card.onclick = () => {
      location.href = `game.html?id=${g.id}`;
    };
    list.appendChild(card);
  });
}

document.getElementById("addGame").onclick = () => {
  modal.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal">
        <div class="close-button">&times;</div>
        <h2>Add Game</h2>

        <input id="newName" placeholder="Game name">

        <input id="playersMin" type="number" placeholder="Min players">
        <input id="playersMax" type="number" placeholder="Max players">

        <input id="timeMin" type="number" placeholder="Min playtime (mins)">
        <input id="timeMax" type="number" placeholder="Max playtime (mins)">

        <button id="create">Create</button>
      </div>
    </div>
  `;

  modal.querySelector(".close-button").onclick = () => modal.innerHTML = "";

  document.getElementById("create").onclick = () => {
    const name = document.getElementById("newName").value.trim();
    if (!name) return;

    const games = getGames();

    games.push({
      id: Date.now(),
      name,
      image: "",
      players: {
        min: Number(document.getElementById("playersMin").value) || null,
        max: Number(document.getElementById("playersMax").value) || null
      },
      playTime: {
        min: Number(document.getElementById("timeMin").value) || null,
        max: Number(document.getElementById("timeMax").value) || null
      },
      tags: [],
      playHistory: {},
      plays: 0,
      rating: null,
      review: ""
    });

    saveGames(games);
    modal.innerHTML = "";
    render();
  };
};

search.oninput = render;
sort.onchange = render;
render();
