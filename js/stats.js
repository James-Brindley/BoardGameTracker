const games = getGames().sort((a, b) => b.plays - a.plays);

const podium = document.getElementById("podium");
const top10 = document.getElementById("top10");

const podiumOrder = [1, 0, 2]; // 2nd, 1st, 3rd
const podiumHeights = ["podium-2", "podium-1", "podium-3"];

podiumOrder.forEach((gameIndex, visualIndex) => {
  const g = games[gameIndex];
  if (!g) return;

  const card = document.createElement("div");
  card.className = `card podium-card ${podiumHeights[visualIndex]}`;
  card.innerHTML = `
    <div class="rank">#${gameIndex + 1}</div>
    <img src="${g.image || 'https://via.placeholder.com/400'}">
    <strong>${g.name}</strong>
    <div>${g.plays} plays</div>
  `;
  card.onclick = () => location.href = `game.html?id=${g.id}`;
  podium.appendChild(card);
});

games.slice(3, 10).forEach((g, i) => {
  const row = document.createElement("div");
  row.className = "top10-row";
  row.innerHTML = `
    <div class="top10-rank">${i + 4}</div>
    <img src="${g.image || 'https://via.placeholder.com/400'}">
    <div>
      <strong>${g.name}</strong><br>
      ${g.plays} plays
    </div>
  `;
  row.onclick = () => location.href = `game.html?id=${g.id}`;
  top10.appendChild(row);
});
