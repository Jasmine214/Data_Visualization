import type { ReactNode } from "react";
import { SidebarNav, type DashboardView } from "./SidebarNav";

interface DashboardLayoutProps {
  activeView: DashboardView;
  onViewChange: (view: DashboardView) => void;
  children: ReactNode;
}

export function DashboardLayout({ activeView, onViewChange, children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[#000000]">
      <SidebarNav activeView={activeView} onViewChange={onViewChange} />
      <main className="dashboard-scrollbar mx-auto min-w-0 max-w-[1600px] overflow-x-hidden px-4 py-3 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
