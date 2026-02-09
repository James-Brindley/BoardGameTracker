const list = document.getElementById("list");
const sort = document.getElementById("sort");

function render() {
  let games = getGames();
  const key = sort.value;

  games.sort((a,b) =>
    key === "name" ? a.name.localeCompare(b.name) : (b[key]||0)-(a[key]||0)
  );

  list.innerHTML = "";
  games.forEach(g => {
    const div = document.createElement("div");
    div.className = "card game-card";
    div.innerHTML = `
      <img src="${g.image || 'https://via.placeholder.com/400'}">
      <h3>${g.name}</h3>
      <div>🎲 ${g.plays} plays</div>
      <div>⭐ ${g.rating ?? "—"}</div>
    `;
    div.onclick = () => location.href = `game.html?id=${g.id}`;
    list.appendChild(div);
  });
}

document.getElementById("addGame").onclick = () => {
  const name = prompt("Game name?");
  const image = prompt("Image URL?");
  if (!name) return;

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
