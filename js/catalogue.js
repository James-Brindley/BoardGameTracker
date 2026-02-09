const list = document.getElementById("list");
const search = document.getElementById("search");
const sort = document.getElementById("sort");
const modal = document.getElementById("modal");

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
  games.forEach(g => {
  const card = document.createElement("div");
  card.className = "card game-card";
  card.innerHTML = `
    <img src="${g.image || 'https://via.placeholder.com/400'}" alt="${g.name}">
    <div class="card-header">
      <strong>${g.name}</strong>
      <span>⭐ ${g.rating ?? "—"}</span>
    </div>
    <div class="card-stats">
      <span>${g.playerCount ?? 0} players</span>
      <span>${g.playTime ?? 0} mins</span>
    </div>
    <div>${g.plays} plays</div>
  `;
  card.onclick = () => location.href = `game.html?id=${g.id}`;
  list.appendChild(card);
});
}

// Add Game Modal
document.getElementById("addGame").onclick = () => {
  modal.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal">
        <div class="close-button">&times;</div>
        <h2>Add Game</h2>
        <input id="newName" placeholder="Game name">
        <input id="newPlayers" type="number" placeholder="Player count">
        <input id="newTime" type="number" placeholder="Play time (mins)">
        <button id="create">Create</button>
      </div>
    </div>
  `;

  const closeBtn = modal.querySelector(".close-button");
  closeBtn.onclick = () => (modal.innerHTML = "");

  document.getElementById("create").onclick = () => {
    const name = document.getElementById("newName").value.trim();
    if (!name) return;

    const playerCount = Number(document.getElementById("newPlayers").value) || 0;
    const playTime = Number(document.getElementById("newTime").value) || 0;

    const games = getGames();
    games.push({
      id: Date.now(),
      name,
      plays: 0,
      rating: null,
      review: "",
      image: "",
      playerCount,
      playTime
    });
    saveGames(games);
    modal.innerHTML = "";
    render();
  };
};

search.oninput = render;
sort.onchange = render;
render();
