<header>
  <h1 id="gameName"></h1>
  <nav>
    <a href="index.html">Stats</a>
    <a href="catalogue.html">Catalogue</a>
  </nav>
</header>

<main>
  <div class="card">
    <h2>Plays</h2>
    <div class="stat-number" id="plays">0</div>
    <button id="logPlay">Log Play</button>
  </div>

  <div class="card section">
    <h2>Review</h2>
    <textarea id="review" placeholder="Your thoughts..."></textarea>

    <h2>Rating</h2>
    <input type="number" id="rating" min="0" max="10" placeholder="0–10">

    <button id="save">Save</button>
  </div>
</main>

<script src="js/data.js"></script>
<script src="js/game.js"></script>
