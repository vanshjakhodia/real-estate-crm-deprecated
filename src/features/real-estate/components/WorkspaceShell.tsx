import { useState } from "react";
import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { AiAssistantModal } from "./AiAssistantModal";
import { MobileBottomNav } from "./MobileBottomNav";
import { Navbar } from "./Navbar";
import { SecurityAuditModal } from "./SecurityAuditModal";
import { Sidebar } from "./Sidebar";
import { useCrm } from "../context/CrmContext";

const tabPaths: Record<string, "/admin" | "/leads" | "/appointments" | "/properties" | "/market-map" | "/followups" | "/settings"> = {
  dashboard: "/admin",
  leads: "/leads",
  appointments: "/appointments",
  properties: "/properties",
  "market-map": "/market-map",
  followups: "/followups",
  settings: "/settings",
};

function tabForPath(path: string) {
  if (path.startsWith("/lead/")) return "leads";
  if (path === "/admin") return "dashboard";
  return Object.entries(tabPaths).find(([, value]) => value === path)?.[0] ?? "dashboard";
}

export function WorkspaceShell() {
  const { isLoading, loadError, actionError, clearActionError, refreshData, aiAvailable } = useCrm();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const currentTab = tabForPath(pathname);

  function selectTab(tab: string) {
    const path = tabPaths[tab];
    if (path) void navigate({ to: path });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar
        onToggleSidebar={() => setSidebarOpen((open) => !open)}
        onOpenAi={() => setAssistantOpen(true)}
        onOpenSecurity={() => setAccessOpen(true)}
        aiAvailable={aiAvailable}
      />
      <div className="flex min-h-0 flex-1">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={selectTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpenAi={() => setAssistantOpen(true)}
          aiAvailable={aiAvailable}
        />
        <main className="min-w-0 flex-1 px-4 py-5 pb-24 sm:px-6 sm:py-7 lg:px-8 lg:pb-8">
          {loadError ? (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm" role="alert">
              <span className="text-destructive-foreground">{loadError}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => void refreshData()}>Try again</Button>
            </div>
          ) : null}
          {actionError ? (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm" role="alert">
              <span className="text-destructive-foreground">{actionError}</span>
              <Button type="button" variant="ghost" size="sm" onClick={clearActionError}>Dismiss</Button>
            </div>
          ) : null}
          {isLoading && !loadError ? (
            <p className="mb-5 border-b border-border pb-3 text-xs text-muted-foreground" role="status">Loading your CRM records…</p>
          ) : null}
          <Outlet />
        </main>
      </div>
      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={selectTab}
        onOpenAi={() => setAssistantOpen(true)}
        onOpenMenu={() => setSidebarOpen((open) => !open)}
        aiAvailable={aiAvailable}
      />
      <AiAssistantModal isOpen={assistantOpen && aiAvailable} onClose={() => setAssistantOpen(false)} />
      <SecurityAuditModal isOpen={accessOpen} onClose={() => setAccessOpen(false)} />
      <div className="sr-only" aria-live="polite">{isLoading ? "Loading CRM" : "CRM ready"}</div>
    </div>
  );
}