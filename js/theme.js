/* ---------- THEME ---------- */
const savedTheme = localStorage.getItem("theme") || "light";
document.documentElement.setAttribute("data-theme", savedTheme);

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  localStorage.setItem("theme", next);
  document.documentElement.setAttribute("data-theme", next);
}

/* ---------- CENTRALIZED NAVIGATION & SEARCH & FOOTER ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const navContainer = document.getElementById("nav-container");
  const path = window.location.pathname;
  const page = path.split("/").pop() || "index.html";

  // 1. INJECT HEADER
  if (navContainer) {
    let leftContent = `
      <a href="index.html" class="brand-logo">
        <span class="logo-icon">🎲</span>
        <span class="logo-text">Tracker</span>
      </a>
    `;
    if (page === 'game.html') {
      leftContent = `
        <a href="catalogue.html" class="back-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          Library
        </a>
      `;
    }

    navContainer.innerHTML = `
      <header class="site-header">
        <div class="header-left">
          ${leftContent}
        </div>
        
        <div class="header-center">
            <div class="global-search-wrapper">
                <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input type="text" id="globalSearchInput" class="global-search-input" placeholder="Search library...">
                <div id="globalSearchResults" class="global-search-results"></div>
            </div>
        </div>

        <div class="header-right">
          <nav class="desktop-nav">
            <a href="index.html" class="${page === 'index.html' || page === '' ? 'active' : ''}">Dashboard</a>
            <a href="catalogue.html" class="${page === 'catalogue.html' ? 'active' : ''}">Library</a>
            <a href="settings.html" class="${page === 'settings.html' ? 'active' : ''}">Settings</a>
          </nav>
          <button class="mobile-menu-btn" id="mobileMenuBtn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
        </div>
      </header>
      <div class="mobile-nav-overlay" id="mobileNav">
        <a href="index.html" class="${page === 'index.html' || page === '' ? 'active' : ''}">Dashboard</a>
        <a href="catalogue.html" class="${page === 'catalogue.html' ? 'active' : ''}">Library</a>
        <a href="settings.html" class="${page === 'settings.html' ? 'active' : ''}">Settings</a>
      </div>
    `;
  }

  // 2. INJECT FOOTER
  if (!document.getElementById("site-footer")) {
      const footerHTML = `
        <footer class="site-footer" id="site-footer">
          <div class="footer-content">
              <div class="footer-section">
                  <h3>🎲 Game Tracker</h3>
                  <p>Your personal board game collection and stat tracking dashboard. Level up your game nights.</p>
              </div>
              <div class="footer-section">
                  <h3>Quick Links</h3>
                  <a href="index.html">Dashboard</a>
                  <a href="catalogue.html">Game Library</a>
                  <a href="settings.html">Account Settings</a>
              </div>
              <div class="footer-section">
                  <h3>Connect</h3>
                  <a href="#">X / Twitter</a>
                  <a href="#">Discord Server</a>
                  <a href="#">GitHub Repo</a>
              </div>
          </div>
          <div class="footer-bottom">
              &copy; ${new Date().getFullYear()} Game Tracker. All rights reserved.
          </div>
        </footer>
      `;
      document.body.insertAdjacentHTML('beforeend', footerHTML);
  }

  // 3. MOBILE MENU LOGIC
  const btn = document.getElementById("mobileMenuBtn");
  const nav = document.getElementById("mobileNav");
  if (btn && nav) {
    btn.onclick = () => {
      nav.classList.toggle("open");
      if (nav.classList.contains("open")) {
        btn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
      } else {
        btn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
      }
    };
  }

  // 4. GLOBAL SEARCH LOGIC
  const searchInput = document.getElementById("globalSearchInput");
  const resultsBox = document.getElementById("globalSearchResults");
  let allGamesCache = null;

  if (searchInput && resultsBox) {
      searchInput.addEventListener("input", async (e) => {
          const query = e.target.value.toLowerCase().trim();
          if (!query) { resultsBox.style.display = 'none'; return; }

          if (!allGamesCache) {
              try {
                  const { getGames } = await import('./data.js');
                  allGamesCache = await getGames();
              } catch (err) { return; }
          }

          const matches = allGamesCache.filter(g => g.name.toLowerCase().includes(query)).slice(0, 3);
          
          if (matches.length > 0) {
              resultsBox.innerHTML = matches.map(g => `
                  <a href="game.html?id=${g.id}" class="search-result-item">
                      <img src="${g.image || 'https://via.placeholder.com/50'}">
                      <div>
                          <div class="title">${g.name}</div>
                          <div class="plays">${g.plays || 0} plays</div>
                      </div>
                  </a>
              `).join('');
          } else {
              resultsBox.innerHTML = '<div class="search-no-results">No matches found.</div>';
          }
          resultsBox.style.display = 'block';
      });

      // Close dropdown if clicking outside
      document.addEventListener("click", (e) => {
          if (!e.target.closest('.global-search-wrapper')) {
              resultsBox.style.display = 'none';
          }
      });
  }
  
  // Theme Toggle (Settings page)
  const themeBtn = document.getElementById("themeToggle");
  if (themeBtn) themeBtn.onclick = toggleTheme;
});
