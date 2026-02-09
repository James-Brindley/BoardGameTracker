const stats = document.getElementById("stats");
const games = getGames();

if (games.length) {
  const mostPlayed = games.reduce((a, b) => a.plays > b.plays ? a : b);

  stats.innerHTML = `
    <div class="card stat-card">
      <img src="${mostPlayed.image || 'https://via.placeholder.com/300'}">
      <div class="stat-info">
        <h2>Most Played</h2>
        <div class="stat-number">${mostPlayed.plays}</div>
        <div>${mostPlayed.name}</div>
      </div>
    </div>
  `;
}
