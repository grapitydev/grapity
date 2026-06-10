import type { ReactNode } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
  sidebarFilters?: {
    type?: string;
    owner?: string;
    tags?: string[];
    classification?: string;
    onFilterChange: (filters: { type?: string; owner?: string; tags?: string[]; classification?: string }) => void;
  };
}

export function Layout({ children, sidebarFilters }: LayoutProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar filters={sidebarFilters} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
