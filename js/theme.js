const theme = localStorage.getItem("theme") || "light";
document.documentElement.setAttribute("data-theme", theme);

function toggleTheme() {
  const next = theme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", next);
  location.reload();
}
