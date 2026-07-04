import { Routes, Route, Outlet } from "react-router-dom";
import { ConfigProvider } from "./context/ConfigContext";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { SpecExplorerProvider } from "./context/SpecExplorerContext";
import { AuthGuard } from "./components/auth/AuthGuard";
import { Layout } from "./components/layout/Layout";
import { SpecListPage } from "./pages/SpecListPage";
import { SpecDetailPage } from "./pages/SpecDetailPage";
import { VersionPage } from "./pages/VersionPage";
import { DiffPage } from "./pages/DiffPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { CallbackPage } from "./pages/CallbackPage";
import { useState } from "react";

export default function App() {
  const [filters, setFilters] = useState<{
    type?: string;
    owner?: string;
    tags?: string[];
    classification?: string;
  }>({});

  return (
    <ConfigProvider>
      <AuthProvider>
        <ThemeProvider>
          <SpecExplorerProvider>
            <Routes>
              <Route path="/callback" element={<CallbackPage />} />
              <Route
                element={
                  <AuthGuard>
                    <Layout sidebarFilters={{ ...filters, onFilterChange: setFilters }}>
                      <Outlet />
                    </Layout>
                  </AuthGuard>
                }
              >
                <Route index element={<SpecListPage filters={filters} />} />
                <Route path="specs/:name" element={<SpecDetailPage />} />
                <Route path="specs/:name/versions/:semver" element={<VersionPage />} />
                <Route path="specs/:name/diff" element={<DiffPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </SpecExplorerProvider>
        </ThemeProvider>
      </AuthProvider>
    </ConfigProvider>
  );
}
