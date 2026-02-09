const list = document.getElementById("gameList");
const sortSelect = document.getElementById("sort");

function render() {
  let games = getGames();

  const sort = sortSelect.value;
  games.sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    return (b[sort] || 0) - (a[sort] || 0);
  });

  list.innerHTML = "";
  games.forEach(game => {
    const div = document.createElement("div");
    div.className = "game-card";
    div.innerHTML = `
      <h3>${game.name}</h3>
      <div class="meta">🎲 Plays: ${game.plays}</div>
      <div class="meta">⭐ Rating: ${game.rating ?? "—"}</div>
    `;
    div.onclick = () => {
      window.location.href = `game.html?id=${game.id}`;
    };
    list.appendChild(div);
  });
}

document.getElementById("addGameBtn").onclick = () => {
  const name = prompt("Game name?");
  if (!name) return;

  const games = getGames();
  games.push({
    id: Date.now(),
    name,
    plays: 0,
    review: "",
    rating: null
  });
  saveGames(games);
  render();
};

sortSelect.onchange = render;
render();
