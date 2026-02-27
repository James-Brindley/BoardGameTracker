import { getGames } from './data.js';

/* ---------- THEME ---------- */
const savedTheme = localStorage.getItem("theme") || "light";
document.documentElement.setAttribute("data-theme", savedTheme);

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  localStorage.setItem("theme", next);
  document.documentElement.setAttribute("data-theme", next);
}

/* ---------- GLOBAL HEADER, SEARCH & FOOTER ---------- */
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
            <div class="global-search-container">
                <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input type="text" id="globalSearch" placeholder="Search your library...">
                <div class="global-search-results" id="globalSearchResults"></div>
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

  // 2. SEARCH BAR LOGIC (Only runs if not on login page)
  if (page !== "login.html") {
      const globalSearch = document.getElementById('globalSearch');
      const searchResults = document.getElementById('globalSearchResults');
      let allGamesCache = null;

      if (globalSearch && searchResults) {
          globalSearch.addEventListener('input', async (e) => {
              const query = e.target.value.toLowerCase().trim();
              if (!query) { searchResults.style.display = 'none'; return; }
              
              if (!allGamesCache) allGamesCache = await getGames();
              
              const matches = allGamesCache.filter(g => g.name.toLowerCase().includes(query)).slice(0, 3);
              
              if (matches.length > 0) {
                  searchResults.innerHTML = matches.map(g => `
                      <div class="search-result-item" onclick="window.location.href='game.html?id=${g.id}'">
                          <img src="${g.image || 'https://via.placeholder.com/50'}" alt="">
                          <span>${g.name}</span>
                      </div>
                  `).join('');
                  searchResults.style.display = 'block';
              } else {
                  searchResults.innerHTML = `<div class="search-result-empty">No games found</div>`;
                  searchResults.style.display = 'block';
              }
          });

          document.addEventListener('click', (e) => {
              if (!e.target.closest('.global-search-container')) {
                  searchResults.style.display = 'none';
              }
          });
      }
  }

  // 3. INJECT FOOTER
  const footerHTML = `
    <footer class="site-footer">
       <div class="footer-content">
          <div class="footer-col">
             <h3>Game Tracker 🎲</h3>
             <p>Your personal board game collection manager and detailed stat tracker. Keep rolling!</p>
          </div>
          <div class="footer-col">
             <h3>Navigation</h3>
             <a href="index.html">Dashboard</a>
             <a href="catalogue.html">Library</a>
             <a href="settings.html">Settings</a>
          </div>
          <div class="footer-col">
             <h3>Community</h3>
             <a href="#">BGG Profile</a>
             <a href="#">Discord Server</a>
             <a href="#">Report a Bug</a>
          </div>
       </div>
       <div class="footer-bottom">
          &copy; ${new Date().getFullYear()} Game Tracker. Created for the love of the table.
       </div>
    </footer>
  `;
  // Don't add footer on login screen
  if(page !== "login.html") document.body.insertAdjacentHTML('beforeend', footerHTML);

  // 4. MOBILE MENU & THEME TOGGLE
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
  const themeBtn = document.getElementById("themeToggle");
  if (themeBtn) themeBtn.onclick = toggleTheme;
});
