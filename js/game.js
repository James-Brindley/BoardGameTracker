const image = document.getElementById("gameImage");
image.src = game.image || "";

document.getElementById("imageInput").onchange = e => {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = () => {
    game.image = reader.result;
    image.src = reader.result;
  };

  reader.readAsDataURL(file);
};
