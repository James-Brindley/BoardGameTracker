const games = getGames().sort((a,b) => b.plays - a.plays);

const podium = document.getElementById("podium");
const top10 = document.getElementById("top10");

const top3 = games.slice(0,3);
const rest = games.slice(3,10);

top3.forEach((g, i) => {
  const div = document.createElement("div");
  div.className = `card podium-card podium-${i+1}`;
  div.innerHTML = `
    <div class="rank">#${i+1}</div>
    <img src="${g.image || 'https://via.placeholder.com/400'}">
    <strong>${g.name}</strong>
    <div>${g.plays} plays</div>
  `;
  podium.appendChild(div);
});

rest.forEach((g, i) => {
  const row = document.createElement("div");
  row.className = "top10-row";
  row.innerHTML = `
    <div class="top10-rank">${i+4}</div>
    <img src="${g.image || 'https://via.placeholder.com/400'}">
    <div>
      <strong>${g.name}</strong><br>
      ${g.plays} plays
    </div>
  `;
  row.onclick = () => location.href = `game.html?id=${g.id}`;
  top10.appendChild(row);
});
