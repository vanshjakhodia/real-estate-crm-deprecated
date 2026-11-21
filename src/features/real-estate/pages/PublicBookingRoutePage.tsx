import { Link } from "@tanstack/react-router";
import { Building2 } from "lucide-react";

import { PublicBookingPanel } from "../components/PublicBookingPanel";
import { useCrm } from "../context/CrmContext";

export function PublicBookingRoutePage() {
  const { settings } = useCrm();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-sidebar">
        <div className="mx-auto flex min-h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center border border-border bg-secondary text-primary"><Building2 className="size-5" /></span>
            <span className="truncate font-serif text-lg font-semibold text-foreground">{settings.company_name}</span>
          </Link>
          <Link to="/" className="text-xs text-secondary-foreground hover:text-primary">Back to estates</Link>
        </div>
      </header>
      <PublicBookingPanel />
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        {settings.company_name} · Kanpur, Uttar Pradesh
      </footer>
    </main>
  );
}