import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

const applyTheme = (theme) => {
  const root = document.documentElement;

  // Resolve system preference correctly
  let activeTheme = theme;
  if (theme === "system") {
    // 👈 Fixed media query string to "(prefers-color-scheme: dark)"
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    activeTheme = prefersDark ? "black" : "light";
  }

  // 1. Set your custom attribute
  root.setAttribute("data-theme", activeTheme);

  // 2. Toggle standard Tailwind `.dark` class if theme isn't 'light'
  if (activeTheme === "light") {
    root.classList.remove("dark");
  } else {
    root.classList.add("dark");
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem("theme") || "black";
  });

  useEffect(() => {
    applyTheme(theme);

    if (theme === "system") {
      // Fixed media query string here too
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme("system");

      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme]);

  const setTheme = (newTheme) => {
    localStorage.setItem("theme", newTheme);
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
