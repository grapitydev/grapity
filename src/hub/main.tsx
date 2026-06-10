import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

// Apply saved theme before React hydrates to avoid flash
const savedTheme = localStorage.getItem("grapity-theme");
if (savedTheme === "light") {
  document.documentElement.classList.add("light");
  document.documentElement.classList.remove("dark");
} else {
  document.documentElement.classList.add("dark");
  document.documentElement.classList.remove("light");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
