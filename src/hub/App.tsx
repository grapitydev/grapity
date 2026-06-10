import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { ConfigProvider } from "./context/ConfigContext";
import { ThemeProvider } from "./context/ThemeContext";
import { SpecExplorerProvider } from "./context/SpecExplorerContext";
import { Layout } from "./components/layout/Layout";
import { SpecListPage } from "./pages/SpecListPage";
import { SpecDetailPage } from "./pages/SpecDetailPage";
import { VersionPage } from "./pages/VersionPage";
import { DiffPage } from "./pages/DiffPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export default function App() {
  const [filters, setFilters] = useState<{
    type?: string;
    owner?: string;
    tags?: string[];
    classification?: string;
  }>({});

  return (
    <ConfigProvider>
      <ThemeProvider>
        <SpecExplorerProvider>
          <Layout sidebarFilters={{ ...filters, onFilterChange: setFilters }}>
            <Routes>
              <Route path="/" element={<SpecListPage filters={filters} />} />
              <Route path="/specs/:name" element={<SpecDetailPage />} />
              <Route path="/specs/:name/versions/:semver" element={<VersionPage />} />
              <Route path="/specs/:name/diff" element={<DiffPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Layout>
        </SpecExplorerProvider>
      </ThemeProvider>
    </ConfigProvider>
  );
}
