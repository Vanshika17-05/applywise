import { createContext, useContext, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const ThemeContext = createContext(null);
const KEY = "applywise-theme";

function initialTheme() {
  try { return localStorage.getItem(KEY) === "light" ? "light" : "dark"; }
  catch { return "dark"; }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#07191c" : "#eaf6f3");
    try { localStorage.setItem(KEY, theme); } catch { /* Theme still works without storage. */ }
  }, [theme]);
  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme: () => setTheme((current) => current === "dark" ? "light" : "dark") }}>{children}</ThemeContext.Provider>;
}

export function useTheme() { return useContext(ThemeContext); }

export function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return <button type="button" onClick={toggleTheme} className={`theme-toggle ${className}`} aria-label={`Switch to ${isDark ? "day" : "night"} mode`} title={`Switch to ${isDark ? "day" : "night"} mode`}>
    {isDark ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
  </button>;
}
