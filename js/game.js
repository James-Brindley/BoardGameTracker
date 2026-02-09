const id = Number(new URLSearchParams(location.search).get("id"));
const games = getGames();
const game = games.find(g=>g.id===id);

const title = document.getElementById("title");
const image = document.getElementById("image");
const plays = document.getElementById("plays");

function render(){
  title.textContent = game.name;
  image.src = game.image || "https://via.placeholder.com/600";
  plays.textContent = game.plays;
}

document.getElementById("plus").onclick = ()=>{
  game.plays++;
  saveGames(games);
  render();
};

document.getElementById("minus").onclick = ()=>{
  game.plays = Math.max(0, game.plays-1);
  saveGames(games);
  render();
};

document.getElementById("edit").onclick = ()=>{
  editPanel.style.display =
    editPanel.style.display === "none" ? "block" : "none";

  name.value = game.name;
  imageUrl.value = game.image || "";
  review.value = game.review || "";
  rating.value = game.rating ?? "";
};

["name","imageUrl","review","rating"].forEach(id=>{
  document.getElementById(id).oninput = ()=>{
    game[id==="imageUrl"?"image":id] =
      document.getElementById(id).value;
    saveGames(games);
    render();
  };
});

render();
