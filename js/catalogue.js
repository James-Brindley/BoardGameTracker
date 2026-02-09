const list = document.getElementById("list");
const sort = document.getElementById("sort");
const modal = document.getElementById("modal");

function render() {
  let games = getGames();
  const key = sort.value;

  games.sort((a,b) =>
    key === "name"
      ? a.name.localeCompare(b.name)
      : (b[key] || 0) - (a[key] || 0)
  );

  list.innerHTML = "";
  games.forEach(g => {
    const card = document.createElement("div");
    card.className = "card game-card";

    card.innerHTML = `
      <button class="edit-btn">⋯</button>
      <img src="${g.image || 'https://via.placeholder.com/400'}">
      <h3>${g.name}</h3>
      <div>🎲 ${g.plays} plays</div>
      <div>⭐ ${g.rating ?? "—"}</div>
    `;

    card.onclick = () => location.href = `game.html?id=${g.id}`;

    card.querySelector(".edit-btn").onclick = (e) => {
      e.stopPropagation();
      openEditModal(g);
    };

    list.appendChild(card);
  });
}

function openEditModal(game) {
  modal.style.display = "block";
  modal.innerHTML = `
    <div class="modal-backdrop">
      <div class="card modal">
        <h2>Edit Game</h2>
        <input id="editName" placeholder="Game name" value="${game.name}">
        <input id="editImage" placeholder="Image URL" value="${game.image || ""}">
        <div style="display:flex;gap:1rem;margin-top:1rem">
          <button id="saveEdit">Save</button>
          <button class="secondary" id="cancelEdit">Cancel</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("cancelEdit").onclick = () => {
    modal.style.display = "none";
  };

  document.getElementById("saveEdit").onclick = () => {
    const games = getGames();
    const g = games.find(x => x.id === game.id);

    g.name = document.getElementById("editName").value.trim();
    g.image = document.getElementById("editImage").value.trim();

    saveGames(games);
    modal.style.display = "none";
    render();
  };
}

document.getElementById("addGame").onclick = () => {
  const name = prompt("Game name?");
  if (!name) return;

  const image = prompt("Image URL (optional)");
  const games = getGames();

  games.push({
    id: Date.now(),
    name,
    image,
    plays: 0,
    rating: null,
    review: ""
  });

  saveGames(games);
  render();
};

sort.onchange = render;
render();
