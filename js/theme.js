/* ---------- THEME ---------- */
const savedTheme = localStorage.getItem("theme") || "light";
document.documentElement.setAttribute("data-theme", savedTheme);

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  localStorage.setItem("theme", next);
  document.documentElement.setAttribute("data-theme", next);
}

/* ---------- CENTRALIZED NAVIGATION ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const navContainer = document.getElementById("nav-container");
  
  if (navContainer) {
    const path = window.location.pathname;
    const page = path.split("/").pop() || "index.html";

    // Dynamic Left Side (Back button for Game page, Logo for others)
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

  // Mobile Menu Logic
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
  
  // Theme Toggle (used on Settings page)
  const themeBtn = document.getElementById("themeToggle");
  if (themeBtn) {
    themeBtn.onclick = toggleTheme;
  }
});
