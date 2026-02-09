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
