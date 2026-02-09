const list = document.getElementById("list");

getGames().forEach(g=>{
  const card = document.createElement("div");
  card.className = "card game-card";
  card.innerHTML = `
    <img src="${g.image || 'https://via.placeholder.com/400'}">
    <strong>${g.name}</strong>
    <div>🎲 ${g.plays} plays</div>
    <div>⭐ ${g.rating ?? "—"}</div>
  `;
  card.onclick = ()=>location.href=`game.html?id=${g.id}`;
  list.appendChild(card);
});
