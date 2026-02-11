import { getGames, saveGames } from "./data.js";

const params = new URLSearchParams(location.search);
const id = params.get("id");

const games = getGames();
const index = games.findIndex(g => g.id === id);
const game = games[index];

if (!game) {
  alert("Game not found");
  location.href = "catalogue.html";
}

game.playHistory ||= {};
game.players ||= { min: null, max: null };
game.playTime ||= { min: null, max: null };

const title = document.getElementById("title");
const image = document.getElementById("image");
const plays = document.getElementById("plays");
const ratingView = document.getElementById("ratingView");
const reviewView = document.getElementById("reviewView");
const playTimeView = document.getElementById("playTime");
const playerView = document.getElementById("playerCount");

function formatRange(min, max, suffix="") {
  if (min == null && max == null) return "—";
  if (min === max || max == null) return `${min}${suffix}`;
  return `${min}–${max}${suffix}`;
}

function render() {
  title.textContent = game.name;
  image.src = game.image || "https://via.placeholder.com/800x360";
  plays.textContent = game.plays || 0;

  ratingView.textContent = game.rating != null ? `${game.rating}/10` : "—";
  reviewView.textContent = game.review?.trim() || "No review yet";

  playTimeView.textContent =
    formatRange(game.playTime.min, game.playTime.max, " mins");

  playerView.textContent =
    formatRange(game.players.min, game.players.max, " players");
}

document.getElementById("editToggle").onclick = () => {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";

  backdrop.innerHTML = `
    <div class="modal">
      <div class="close-button">×</div>
      <h2>Edit Game</h2>

      <input id="editName" value="${game.name}">
      <input id="editImage" value="${game.image || ""}" placeholder="Image URL">

      <div class="row">
        <input id="editPMin" type="number" value="${game.players.min ?? ""}" placeholder="Players min">
        <input id="editPMax" type="number" value="${game.players.max ?? ""}" placeholder="Players max">
      </div>

      <div class="row">
        <input id="editTMin" type="number" value="${game.playTime.min ?? ""}" placeholder="Time min">
        <input id="editTMax" type="number" value="${game.playTime.max ?? ""}" placeholder="Time max">
      </div>

      <input id="editRating" type="number" step="0.1" value="${game.rating ?? ""}" placeholder="Rating">
      <textarea id="editReview" placeholder="Review">${game.review || ""}</textarea>

      <button id="saveEdit">Save Changes</button>
    </div>
  `;

  backdrop.querySelector(".close-button").onclick = () => backdrop.remove();

  backdrop.querySelector("#saveEdit").onclick = () => {
    game.name = backdrop.querySelector("#editName").value.trim();
    game.image = backdrop.querySelector("#editImage").value.trim() || null;

    game.players = {
      min: Number(backdrop.querySelector("#editPMin").value) || null,
      max: Number(backdrop.querySelector("#editPMax").value) || null
    };

    game.playTime = {
      min: Number(backdrop.querySelector("#editTMin").value) || null,
      max: Number(backdrop.querySelector("#editTMax").value) || null
    };

    const ratingValue = backdrop.querySelector("#editRating").value;
    game.rating = ratingValue ? parseFloat(ratingValue) : null;

    game.review = backdrop.querySelector("#editReview").value.trim();

    saveGames(games);
    backdrop.remove();
    render();
  };

  document.body.appendChild(backdrop);
};

render();
