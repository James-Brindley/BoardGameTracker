<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Game</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>

<header class="header-compact">
  <h1>🎮</h1>
  <nav>
    <a href="index.html">Stats</a>
    <a href="catalogue.html">Catalogue</a>
    <a href="settings.html">Settings</a>
  </nav>
</header>

<main>
  <h1 class="game-title" id="title"></h1>
  <img id="image" class="game-image">

  <div class="card stats-card">
    <div class="game-stats">
      <div class="stat">
        <span class="stat-label">Play Time</span>
        <span id="playTime" class="stat-value"></span>
      </div>

      <div class="stat">
        <span class="stat-label">Players</span>
        <span id="playerCount" class="stat-value"></span>
      </div>

      <div class="stat">
        <span class="stat-label">Plays</span>
        <span id="plays" class="stat-value"></span>
      </div>
    </div>

    <div class="review-header">
      <h2>Review</h2>
      <span id="ratingView"></span>
    </div>
    <p id="reviewView"></p>
  </div>

  <div class="card">
    <h2>Play Tracker</h2>
    <div class="tracker-header">
      <button id="prevMonth">←</button>
      <strong id="monthLabel"></strong>
      <button id="nextMonth">→</button>
    </div>
    <div id="gameTracker" class="tracker-grid small"></div>
    <p class="muted">Click to add · Right-click to remove</p>
  </div>

  <button id="editToggle">Edit Game</button>
  <div id="editPanel" class="card" style="display:none">
    <input id="name" placeholder="Name">
    <input id="imageUrl" placeholder="Image URL">
    <input id="playTimeInput" type="number" placeholder="Play time">
    <input id="playerCountInput" placeholder="Players">
    <input id="rating" type="number" min="0" max="10" placeholder="Rating">
    <textarea id="review"></textarea>
    <button id="save">Save</button>
    <button id="deleteGame" class="danger">Delete</button>
  </div>
</main>

<script type="module" src="js/theme.js"></script>
<script type="module" src="js/game.js"></script>
</body>
</html>
