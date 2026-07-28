import "@testing-library/jest-dom";
import "../setup";
import { afterEach, describe, expect, test } from "bun:test";
import { render, screen, cleanup } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider } from "hub/context/ConfigContext";
import { AuthProvider } from "hub/context/AuthContext";
import { ThemeProvider } from "hub/context/ThemeContext";
import { SpecExplorerProvider } from "hub/context/SpecExplorerContext";
import { Layout } from "hub/components/layout/Layout";

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <ConfigProvider>
        <AuthProvider>
          <ThemeProvider>
            <SpecExplorerProvider>{children}</SpecExplorerProvider>
          </ThemeProvider>
        </AuthProvider>
      </ConfigProvider>
    </BrowserRouter>
  );
}

afterEach(() => {
  cleanup();
});

describe("Layout footer", () => {
  test("renders the shared footer on every page", () => {
    render(
      <Layout>
        <div>page content</div>
      </Layout>,
      { wrapper }
    );

    expect(screen.getByText("page content")).toBeTruthy();
    expect(screen.getByText("Grapity")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Docs/i })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /support@grapity.dev/i })
    ).toBeTruthy();
  });
});
