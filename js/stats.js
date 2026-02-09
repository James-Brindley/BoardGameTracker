const games = getGames();

document.getElementById("totalGames").textContent = games.length;

const totalPlays = games.reduce((sum, g) => sum + g.plays, 0);
document.getElementById("totalPlays").textContent = totalPlays;

if (games.length) {
  const mostPlayed = games.reduce((a, b) => a.plays > b.plays ? a : b);
  document.getElementById("mostPlayed").textContent =
    `${mostPlayed.name} (${mostPlayed.plays})`;
}
