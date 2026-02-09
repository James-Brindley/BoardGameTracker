const list = document.getElementById("list");
const games = getGames();

games.forEach(game => {
  const card = document.createElement("div");
  card.className = "card game-card";
  card.innerHTML = `
    <img src="${game.image || 'https://via.placeholder.com/400'}">
    <strong>${game.name}</strong>
    <div>🎲 ${game.plays} plays</div>
    <div>⭐ ${game.rating ?? "—"}</div>
  `;
  card.onclick = () => {
    location.href = `game.html?id=${game.id}`;
  };
  list.appendChild(card);
});
