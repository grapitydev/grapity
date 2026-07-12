import { Routes, Route, Outlet, useSearchParams } from "react-router-dom";
import { useMemo, useCallback } from "react";
import { ConfigProvider, useConfig } from "./context/ConfigContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
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
import { useSpecs } from "./hooks/useSpecs";

interface Filters {
  type?: string;
  owner?: string;
  tags?: string[];
  classification?: string;
}

function parseFilters(searchParams: URLSearchParams): Filters {
  const type = searchParams.get("type") || undefined;
  const owner = searchParams.get("owner") || undefined;
  const tags = searchParams.get("tags")?.split(",").filter(Boolean) || undefined;
  const classification = searchParams.get("classification") || undefined;
  return { type, owner, tags, classification };
}

function AppRoutes() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const { auth } = useConfig();
  const { isAuthenticated } = useAuth();
  const { specs, loading, error } = useSpecs({}, !auth || isAuthenticated);

  const setFilters = useCallback(
    (next: Filters) => {
      const params = new URLSearchParams();
      if (next.type) params.set("type", next.type);
      if (next.owner) params.set("owner", next.owner);
      if (next.tags?.length) params.set("tags", next.tags.join(","));
      if (next.classification) params.set("classification", next.classification);
      setSearchParams(params, { replace: true });
    },
    [setSearchParams]
  );

  return (
    <Routes>
      <Route path="/callback" element={<CallbackPage />} />
      <Route
        element={
          <AuthGuard>
            <Layout sidebarFilters={{ ...filters, onFilterChange: setFilters }} specs={specs}>
              <Outlet />
            </Layout>
          </AuthGuard>
        }
      >
        <Route index element={<SpecListPage filters={filters} onFilterChange={setFilters} specs={specs} loading={loading} error={error} />} />
        <Route path="specs/:name" element={<SpecDetailPage />} />
        <Route path="specs/:name/versions/:semver" element={<VersionPage />} />
        <Route path="specs/:name/diff" element={<DiffPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ConfigProvider>
      <AuthProvider>
        <ThemeProvider>
          <SpecExplorerProvider>
            <AppRoutes />
          </SpecExplorerProvider>
        </ThemeProvider>
      </AuthProvider>
    </ConfigProvider>
  );
}
