const id = Number(new URLSearchParams(location.search).get("id"));
const games = getGames();
const game = games.find(g => g.id === id);

const title = document.getElementById("title");
const image = document.getElementById("image");

const plays = document.getElementById("plays");
const ratingView = document.getElementById("ratingView");
const reviewView = document.getElementById("reviewView");

const playTime = document.getElementById("playTime");
const playerCount = document.getElementById("playerCount");

const editPanel = document.getElementById("editPanel");
const nameInput = document.getElementById("name");
const imageInput = document.getElementById("imageUrl");
const ratingInput = document.getElementById("rating");
const reviewInput = document.getElementById("review");
const playTimeInput = document.getElementById("playTimeInput");
const playerCountInput = document.getElementById("playerCountInput");

function render() {
  title.textContent = game.name;
  image.src = game.image || "https://via.placeholder.com/600x320";

  plays.textContent = `${game.plays} plays`;
  ratingView.textContent = game.rating != null ? `${game.rating}/10` : "—";
  reviewView.textContent = game.review || "No review yet";

  playTime.textContent = game.playTime || "—";
  playerCount.textContent = game.playerCount || "—";

  nameInput.value = game.name;
  imageInput.value = game.image || "";
  ratingInput.value = game.rating ?? "";
  reviewInput.value = game.review || "";
  playTimeInput.value = game.playTime || "";
  playerCountInput.value = game.playerCount || "";
}

document.getElementById("plus").onclick = () => {
  game.plays++;
  saveGames(games);
  render();
};

document.getElementById("minus").onclick = () => {
  game.plays = Math.max(0, game.plays - 1);
  saveGames(games);
  render();
};

document.getElementById("editToggle").onclick = () => {
  editPanel.style.display =
    editPanel.style.display === "none" ? "block" : "none";
};

document.getElementById("save").onclick = () => {
  game.name = nameInput.value;
  game.image = imageInput.value;
  game.rating = ratingInput.value !== "" ? Number(ratingInput.value) : null;
  game.review = reviewInput.value;
  game.playTime = playTimeInput.value;
  game.playerCount = playerCountInput.value;

  saveGames(games);
  editPanel.style.display = "none";
  render();
};

render();
