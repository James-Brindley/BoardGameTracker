import { getGames, saveGames, initGames } from "./data.js";

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

function render() {
  let games = [...getGames()];

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

addBtn.onclick = async () => {
  const name = prompt("Game name?");
  if (!name) return;

  const games = [...getGames()];

  games.push({
    id: crypto.randomUUID(),
    name,
    image: null,
    plays: 0,
    rating: null,
    review: "",
    players: { min: null, max: null },
    playTime: { min: null, max: null },
    playHistory: {}
  });

  await saveGames(games);
};

search.oninput = render;
sort.onchange = render;
filterPlayers.oninput = render;
filterTime.oninput = render;
filterRating.oninput = render;
filterPlayed.onchange = render;

/* INIT */
initGames(render);
