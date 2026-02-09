const id = Number(new URLSearchParams(location.search).get("id"));
const games = getGames();
const game = games.find(g => g.id === id);

document.getElementById("title").textContent = game.name;
document.getElementById("image").src = game.image || "https://via.placeholder.com/400";
document.getElementById("plays").textContent = game.plays;
document.getElementById("review").value = game.review;
document.getElementById("rating").value = game.rating ?? "";

document.getElementById("play").onclick = () => {
  game.plays++;
  document.getElementById("plays").textContent = game.plays;
};

document.getElementById("save").onclick = () => {
  game.review = review.value;
  game.rating = Number(rating.value);
  saveGames(games);
  alert("Saved");
};
