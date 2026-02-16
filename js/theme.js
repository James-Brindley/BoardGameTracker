/* ---------- THEME ---------- */
const savedTheme = localStorage.getItem("theme") || "light";
document.documentElement.setAttribute("data-theme", savedTheme);

/* ---------- ACCENT ---------- */
const savedAccent = localStorage.getItem("accent");
if (savedAccent) {
  document.documentElement.style.setProperty("--accent", savedAccent);
}

/* ---------- TOGGLE THEME ---------- */
function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  localStorage.setItem("theme", next);
  document.documentElement.setAttribute("data-theme", next);
}

/* ---------- MOBILE MENU LOGIC ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("mobileMenuBtn");
  const nav = document.getElementById("mobileNav");

  if (btn && nav) {
    btn.onclick = () => {
      const isOpen = nav.classList.contains("open");
      if (isOpen) {
        nav.classList.remove("open");
        btn.textContent = "☰";
      } else {
        nav.classList.add("open");
        btn.textContent = "×";
      }
    };
  }
  
  const themeBtn = document.getElementById("themeToggle");
  if (themeBtn) {
    themeBtn.onclick = toggleTheme;
  }
});
