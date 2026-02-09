import { getGames, saveGames, addPlay } from "./data.js";

const params = new URLSearchParams(location.search);
const id = Number(params.get("id"));

const games = getGames();
const gameIndex = games.findIndex(g => g.id === id);
const game = games[gameIndex];

if (!game) {
  alert("Game not found.");
  location.href = "catalogue.html";
}

/* ---------- ELEMENTS ---------- */
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

/* ---------- RENDER ---------- */
function render() {
  title.textContent = game.name;
  image.src = game.image || "https://via.placeholder.com/600x320";

  plays.textContent = game.plays ?? 0;
  ratingView.textContent =
    game.rating != null ? `${game.rating}/10` : "—";

  reviewView.textContent =
    game.review?.trim() || "No review yet";

  playTime.textContent =
    game.playTime != null ? `${game.playTime} mins` : "—";

  playerCount.textContent =
    game.playerCount?.toString() || "—";

  nameInput.value = game.name;
  imageInput.value = game.image || "";
  ratingInput.value = game.rating ?? "";
  reviewInput.value = game.review || "";
  playTimeInput.value = game.playTime ?? "";
  playerCountInput.value = game.playerCount ?? "";
}

/* ---------- PLAYS ---------- */
document.getElementById("addPlay").onclick = () => {
  addPlay(game);
  saveGames(games);
  render();
};

document.getElementById("removePlay").onclick = () => {
  game.plays = Math.max(0, (game.plays || 0) - 1);
  saveGames(games);
  render();
};

/* ---------- EDIT ---------- */
document.getElementById("editToggle").onclick = () => {
  editPanel.style.display =
    editPanel.style.display === "none" ? "block" : "none";
};

document.getElementById("save").onclick = () => {
  game.name = nameInput.value.trim() || game.name;
  game.image = imageInput.value.trim();
  game.rating =
    ratingInput.value !== "" ? Number(ratingInput.value) : null;
  game.review = reviewInput.value.trim();
  game.playTime =
    playTimeInput.value !== "" ? Number(playTimeInput.value) : null;
  game.playerCount = playerCountInput.value.trim();

  saveGames(games);
  editPanel.style.display = "none";
  render();
};

/* ---------- DELETE ---------- */
document.getElementById("deleteGame").onclick = () => {
  const confirmed = confirm(
    `Delete "${game.name}"?\nThis cannot be undone.`
  );
  if (!confirmed) return;

  games.splice(gameIndex, 1);
  saveGames(games);
  location.href = "catalogue.html";
};

render();
