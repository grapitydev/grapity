import "@testing-library/jest-dom";
import "../setup";
import { beforeEach, afterEach, describe, expect, test } from "bun:test";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { AuthProvider } from "hub/context/AuthContext";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider } from "hub/context/ConfigContext";
import { ThemeProvider } from "hub/context/ThemeContext";
import { Header } from "hub/components/layout/Header";

afterEach(() => {
  cleanup();
});

describe("Theme toggle", () => {
  test("defaults to dark mode", () => {
    document.documentElement.classList.remove("dark", "light");
    localStorage.clear();

    render(
      <BrowserRouter>
        <ConfigProvider>
          <AuthProvider>
            <ThemeProvider>
              <Header />
            </ThemeProvider>
          </AuthProvider>
        </ConfigProvider>
      </BrowserRouter>
    );

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  test("toggles to light mode on button click", () => {
    render(
      <BrowserRouter>
        <ConfigProvider>
          <AuthProvider>
            <ThemeProvider>
              <Header />
            </ThemeProvider>
          </AuthProvider>
        </ConfigProvider>
      </BrowserRouter>
    );

    const toggle = screen.getByLabelText(/Switch to light mode/i);
    fireEvent.click(toggle);

    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(localStorage.getItem("grapity-theme")).toBe("light");
  });
});
