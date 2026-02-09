const list = document.getElementById("gameList");
const sortSelect = document.getElementById("sort");

function render() {
  let games = getGames();

  const sort = sortSelect.value;
  games.sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    return b[sort] - a[sort];
  });

  list.innerHTML = "";
  games.forEach(game => {
    const li = document.createElement("li");
    li.innerHTML = `
      <a href="game.html?id=${game.id}">
        ${game.name} – Plays: ${game.plays} – ⭐ ${game.rating ?? "—"}
      </a>`;
    list.appendChild(li);
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
