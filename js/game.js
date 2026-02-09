const id = Number(new URLSearchParams(location.search).get("id"));
const games = getGames();
const game = games.find(g => g.id === id);

const title = document.getElementById("title");
const image = document.getElementById("image");
const nameInput = document.getElementById("name");
const imageInput = document.getElementById("imageUrl");
const playsEl = document.getElementById("plays");
const reviewEl = document.getElementById("review");
const ratingEl = document.getElementById("rating");

function render() {
  title.textContent = game.name;
  nameInput.value = game.name;
  image.src = game.image || "https://via.placeholder.com/400";
  imageInput.value = game.image || "";
  playsEl.textContent = game.plays;
  reviewEl.value = game.review;
  ratingEl.value = game.rating ?? "";
}

document.getElementById("play").onclick = () => {
  game.plays++;
  playsEl.textContent = game.plays;
};

document.getElementById("save").onclick = () => {
  game.name = nameInput.value.trim();
  game.image = imageInput.value.trim();
  game.review = reviewEl.value;
  game.rating = Number(ratingEl.value);

  saveGames(games);
  render();
  alert("Saved");
};

render();
