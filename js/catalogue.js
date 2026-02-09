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
      <img src="${g.image || 'https://via.placeholder.com/400'}">
      <strong>${g.name}</strong>
      <div>${g.plays} plays</div>
      <div>⭐ ${g.rating ?? "—"}</div>
    `;
    card.onclick = () => location.href = `game.html?id=${g.id}`;
    list.appendChild(card);
  });
}

document.getElementById("addGame").onclick = () => {
  modal.innerHTML = `
    <div class="modal-backdrop">
      <div class="card modal">
        <h2>Add Game</h2>
        <input id="newName" placeholder="Game name">
        <button id="create">Create</button>
      </div>
    </div>
  `;
  document.getElementById("create").onclick = () => {
    const name = document.getElementById("newName").value.trim();
    if (!name) return;

    const games = getGames();
    games.push({
      id: Date.now(),
      name,
      plays: 0,
      rating: null,
      review: "",
      image: ""
    });
    saveGames(games);
    modal.innerHTML = "";
    render();
  };
};

search.oninput = render;
sort.onchange = render;
render();
