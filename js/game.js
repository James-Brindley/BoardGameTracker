const id = Number(new URLSearchParams(location.search).get("id"));
const games = getGames();
const game = games.find(g => g.id === id);

const title = document.getElementById("title");
const image = document.getElementById("image");
const playsEl = document.getElementById("plays");

const editPanel = document.getElementById("editPanel");
const nameInput = document.getElementById("name");
const imageInput = document.getElementById("imageUrl");
const reviewInput = document.getElementById("review");
const ratingInput = document.getElementById("rating");

function render() {
  title.textContent = game.name;
  image.src = game.image || "https://via.placeholder.com/600";
  playsEl.textContent = game.plays;

  nameInput.value = game.name;
  imageInput.value = game.image || "";
  reviewInput.value = game.review || "";
  ratingInput.value = game.rating ?? "";
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

[nameInput, imageInput, reviewInput, ratingInput].forEach(input => {
  input.oninput = () => {
    game.name = nameInput.value.trim();
    game.image = imageInput.value.trim();
    game.review = reviewInput.value;
    game.rating = Number(ratingInput.value);
    saveGames(games);
    render();
  };
});

render();
