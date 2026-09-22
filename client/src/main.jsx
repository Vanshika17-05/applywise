import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./state/auth.jsx";
import { ThemeProvider } from "./state/theme.jsx";
import App from "./App.jsx";
import "./index.css";

function ThemedApp() {
  return <><App /><Toaster position="bottom-right" gutter={10} toastOptions={{ className: "applywise-toast", duration: 4000, style: { background: "var(--glass-strong)", color: "var(--text)", border: "1px solid var(--accent-border)", boxShadow: "var(--shadow), 0 0 22px var(--accent-muted)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" }, success: { iconTheme: { primary: "var(--accent)", secondary: "var(--accent-foreground)" } } }} /></>;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider><ThemedApp /></AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
