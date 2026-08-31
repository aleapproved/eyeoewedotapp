(() => {
  const root = document.documentElement;
  const button = document.querySelector("[data-theme-toggle]");
  const icon = document.querySelector("[data-theme-icon]");
  const label = document.querySelector("[data-theme-label]");
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const storageKey = "eyeoewe-theme";

  if (!button || !icon || !label) return;

  function setTheme(theme, persist = false) {
    const isDark = theme === "dark";
    root.dataset.theme = isDark ? "dark" : "light";
    button.setAttribute("aria-pressed", String(isDark));
    button.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    icon.textContent = isDark ? "☼" : "☾";
    label.textContent = isDark ? "Light mode" : "Dark mode";
    themeColor?.setAttribute("content", isDark ? "#0f1824" : "#f6f0e5");

    if (persist) {
      try {
        window.localStorage.setItem(storageKey, root.dataset.theme);
      } catch {}
    }
  }

  setTheme(root.dataset.theme === "dark" ? "dark" : "light");
  button.addEventListener("click", () => {
    setTheme(root.dataset.theme === "dark" ? "light" : "dark", true);
  });
})();
