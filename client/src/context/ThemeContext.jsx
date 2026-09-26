import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "applywise-theme";

function readTheme() {
  try { return localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark"; }
  catch { return "dark"; }
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#07191c" : "#eaf6f3");
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readTheme);

  const setTheme = useCallback((nextTheme) => {
    const value = typeof nextTheme === "function" ? nextTheme(readTheme()) : nextTheme;
    const normalized = value === "light" ? "light" : "dark";
    applyTheme(normalized);
    try { localStorage.setItem(STORAGE_KEY, normalized); } catch { /* The UI can still switch without storage. */ }
    setThemeState(normalized);
  }, []);

  const toggleTheme = useCallback(() => setTheme((current) => current === "dark" ? "light" : "dark"), [setTheme]);

  useEffect(() => {
    applyTheme(theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* The UI can still switch without storage. */ }
  }, [theme]);

  useEffect(() => {
    function syncTheme(event) {
      if (event.key !== STORAGE_KEY) return;
      const next = event.newValue === "light" ? "light" : "dark";
      applyTheme(next);
      setThemeState(next);
    }
    window.addEventListener("storage", syncTheme);
    return () => window.removeEventListener("storage", syncTheme);
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}

export function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = `Switch to ${isDark ? "light" : "dark"} mode`;
  return <button type="button" onClick={toggleTheme} className={`theme-toggle ${className}`} aria-label={label} title={label}>
    {isDark ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
  </button>;
}
