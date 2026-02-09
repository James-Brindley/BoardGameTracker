const stats = document.getElementById("stats");
const games = getGames();

if (games.length) {
  const mostPlayed = games.reduce((a, b) => a.plays > b.plays ? a : b);

  const card = document.createElement("div");
  card.className = "card stat-card";
  card.innerHTML = `
    <img src="${mostPlayed.image || 'https://via.placeholder.com/300'}">
    <div>
      <h2>Most Played</h2>
      <div class="stat-number">${mostPlayed.plays}</div>
      <div>${mostPlayed.name}</div>
    </div>
  `;

  card.onclick = () => {
    location.href = `game.html?id=${mostPlayed.id}`;
  };

  stats.appendChild(card);
}
