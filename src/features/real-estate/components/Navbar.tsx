import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, LogOut, Menu, ShieldCheck, Sparkles, FileSpreadsheet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCrm } from "../context/CrmContext";
import { exportMasterCrmToExcel } from "../lib/excel";

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenAi: () => void;
  onOpenSecurity: () => void;
  aiAvailable: boolean;
}

export function Navbar({ onToggleSidebar, onOpenAi, onOpenSecurity, aiAvailable }: NavbarProps) {
  const { currentUser, currentRole, settings, leads, appointments, properties } = useCrm();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  async function handleSignOut() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('kanpur_crm_owner_auth');
    }
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/", replace: true });
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-sidebar/95 px-3 xs:px-4 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <Button type="button" variant="ghost" size="icon" onClick={onToggleSidebar} className="lg:hidden shrink-0" aria-label="Open navigation">
          <Menu className="size-5" />
        </Button>
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <span className="flex size-9 sm:size-10 shrink-0 items-center justify-center border border-border bg-secondary text-primary rounded-lg">
            <Building2 className="size-4 sm:size-5" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="truncate font-serif text-base sm:text-xl font-semibold text-foreground max-w-[130px] xs:max-w-[200px] sm:max-w-xs md:max-w-none">{settings.company_name}</span>
              <span className="hidden border border-border px-1.5 py-0.5 font-mono text-[9px] sm:text-[10px] uppercase text-primary md:inline-flex">{settings.city}</span>
            </div>
            <p className="hidden text-[10px] uppercase text-muted-foreground sm:block">Private Client Office &amp; Estates</p>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => exportMasterCrmToExcel({ leads, appointments, properties })}
          className="hidden sm:inline-flex gap-1.5"
          title="Export all records to Microsoft Excel (.xlsx)"
        >
          <FileSpreadsheet className="size-3.5" />
          MS Excel
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onOpenSecurity} className="hidden sm:inline-flex gap-1.5">
          <ShieldCheck className="size-3.5" />
          Access log
        </Button>
        <Button type="button" size="sm" onClick={onOpenAi} disabled={!aiAvailable} title={aiAvailable ? "Open assistant" : "Assistant model selection is pending"} className="px-2.5 sm:px-3">
          <Sparkles className="size-3.5" />
          <span className="hidden sm:inline ml-1.5">Assistant</span>
        </Button>
        <details className="relative">
          <summary className="flex min-h-9 max-w-36 xs:max-w-44 cursor-pointer list-none items-center gap-1.5 xs:gap-2 border border-border bg-card px-2 xs:px-2.5 text-left text-xs text-foreground sm:max-w-60 rounded-md">
            <span className="min-w-0">
              <span className="block truncate font-medium text-xs">{currentUser.full_name || 'Admin'}</span>
              <span className="block truncate font-mono text-[9px] uppercase text-primary">ADMIN</span>
            </span>
          </summary>
          <div className="absolute right-0 z-50 mt-1 w-56 border border-border bg-card p-2 shadow-xl rounded-lg">
            <p className="px-2 py-1 text-xs text-muted-foreground">Signed in as Administrator</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full justify-start sm:hidden mb-1 gap-2 text-xs"
              onClick={() => exportMasterCrmToExcel({ leads, appointments, properties })}
            >
              <FileSpreadsheet className="size-3.5 text-primary" />
              Download MS Excel Dossier
            </Button>
            <Button type="button" variant="ghost" className="w-full justify-start text-xs text-destructive hover:text-destructive" onClick={() => void handleSignOut()}>
              <LogOut className="size-3.5 mr-2" />
              Exit Admin CRM
            </Button>
          </div>
        </details>
      </div>
    </header>
  );
}
