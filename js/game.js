import { getGames, saveGames } from "./data.js";

const params = new URLSearchParams(location.search);
const id = Number(params.get("id"));

const games = getGames();
const index = games.findIndex(g => g.id === id);
const game = games[index];

if (!game) {
  alert("Game not found.");
  location.href = "catalogue.html";
}

function formatRange(r) {
  if (!r || r.min == null) return "—";
  return r.min === r.max ? `${r.min}` : `${r.min}–${r.max}`;
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
const playMinInput = document.getElementById("playTimeInput");
const playersInput = document.getElementById("playerCountInput");

/* ---------- RENDER ---------- */
function render() {
  title.textContent = game.name;
  image.src = game.image || "https://via.placeholder.com/600x320";

  plays.textContent = game.plays;
  ratingView.textContent = game.rating != null ? `${game.rating}/10` : "—";
  reviewView.textContent = game.review || "No review yet";

  playTime.textContent = formatRange(game.playTime) + " mins";
  playerCount.textContent = formatRange(game.players) + " players";

  nameInput.value = game.name;
  imageInput.value = game.image || "";
  ratingInput.value = game.rating ?? "";
  reviewInput.value = game.review || "";

  playMinInput.value = game.playTime?.min ?? "";
  playersInput.value = game.players?.min ?? "";
}

/* ---------- SAVE ---------- */
document.getElementById("save").onclick = () => {
  game.name = nameInput.value.trim() || game.name;
  game.image = imageInput.value.trim();
  game.rating = ratingInput.value !== "" ? Number(ratingInput.value) : null;
  game.review = reviewInput.value.trim();

  saveGames(games);
  editPanel.style.display = "none";
  render();
};

document.getElementById("editToggle").onclick = () => {
  editPanel.style.display =
    editPanel.style.display === "none" ? "block" : "none";
};

document.getElementById("deleteGame").onclick = () => {
  if (!confirm(`Delete "${game.name}"?`)) return;
  games.splice(index, 1);
  saveGames(games);
  location.href = "catalogue.html";
};

render();
