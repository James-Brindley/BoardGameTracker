const params = new URLSearchParams(window.location.search);
const id = Number(params.get("id"));

let games = getGames();
let game = games.find(g => g.id === id);

document.getElementById("gameName").textContent = game.name;
document.getElementById("plays").textContent = game.plays;
document.getElementById("review").value = game.review;
document.getElementById("rating").value = game.rating ?? "";

document.getElementById("logPlay").onclick = () => {
  game.plays++;
  document.getElementById("plays").textContent = game.plays;
};

document.getElementById("save").onclick = () => {
  game.review = document.getElementById("review").value;
  game.rating = Number(document.getElementById("rating").value);

  saveGames(games);
  alert("Saved!");
};
