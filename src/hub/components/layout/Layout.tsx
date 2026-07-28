import type { ReactNode } from "react";
import type { SpecListItem } from "core";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { OverviewFooter } from "../version/OverviewFooter";

interface LayoutProps {
  children: ReactNode;
  specs?: SpecListItem[];
  sidebarFilters?: {
    type?: string;
    owner?: string;
    tags?: string[];
    classification?: string;
    track?: string;
    onFilterChange: (filters: { type?: string; owner?: string; tags?: string[]; classification?: string; track?: string }) => void;
  };
}

export function Layout({ children, specs, sidebarFilters }: LayoutProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar filters={sidebarFilters} specs={specs} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
          <OverviewFooter />
        </main>
      </div>
    </div>
  );
}
