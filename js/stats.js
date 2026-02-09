const games = getGames().sort((a,b)=>b.plays-a.plays);
const podium = document.getElementById("podium");
const top10 = document.getElementById("top10");

games.slice(0,3).forEach((g,i)=>{
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <h2>${["🥈","🥇","🥉"][i]}</h2>
    <img src="${g.image || 'https://via.placeholder.com/400'}">
    <strong>${g.name}</strong>
    <div>${g.plays} plays</div>
  `;
  card.onclick = ()=>location.href=`game.html?id=${g.id}`;
  podium.appendChild(card);
});

games.slice(0,10).forEach(g=>{
  const row = document.createElement("div");
  row.className = "card stat-row";
  row.innerHTML = `
    <img src="${g.image || 'https://via.placeholder.com/400'}">
    <div>
      <strong>${g.name}</strong>
      <div>${g.plays} plays</div>
    </div>
  `;
  row.onclick = ()=>location.href=`game.html?id=${g.id}`;
  top10.appendChild(row);
});
