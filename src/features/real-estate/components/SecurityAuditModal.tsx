import { Database, FileCheck, ShieldCheck, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCrm } from "../context/CrmContext";
import { formatIST } from "../lib/utils";

interface SecurityAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const safeguards = [
  {
    title: "Strict Master Admin Access",
    description: "Exclusive administrator authorization protected by confidential Master PIN. Multi-staff logins and external invitations are permanently disabled.",
    icon: ShieldCheck,
  },
  {
    title: "End-to-End Cryptography",
    description: "Classified client dossiers, walkthrough notes and budget details are protected via AES-256-GCM authenticated encryption.",
    icon: Database,
  },
  {
    title: "DPDP Act 2023 Consent & Integrity",
    description: "Walkthrough reservations require explicit fiduciary consent with SHA-256 tamper-proof ledger tracking.",
    icon: FileCheck,
  },
];

export function SecurityAuditModal({ isOpen, onClose }: SecurityAuditModalProps) {
  const { currentRole, currentUser, activityLogs } = useCrm();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-xs">
      <section className="max-h-[90vh] w-full max-w-2xl space-y-6 overflow-y-auto border border-border bg-card p-5 text-foreground shadow-2xl sm:p-6" role="dialog" aria-modal="true" aria-labelledby="access-title">
        <header className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center border border-border bg-secondary text-primary"><ShieldCheck className="size-5" /></span>
            <div>
              <h2 id="access-title" className="font-serif text-lg font-semibold">Access &amp; activity</h2>
              <p className="text-xs text-muted-foreground">{currentUser.full_name} · {currentRole}</p>
            </div>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close access and activity"><X /></Button>
        </header>

        <div className="divide-y divide-border border-y border-border">
          {safeguards.map(({ title, description, icon: Icon }) => (
            <article key={title} className="flex gap-3 py-4">
              <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <h3 className="text-sm font-medium text-foreground">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-serif text-base font-semibold">Recent system events</h3>
            <span className="font-mono text-[10px] text-muted-foreground">Latest {activityLogs.length}</span>
          </div>
          <div className="max-h-52 divide-y divide-border overflow-y-auto border border-border bg-background px-3">
            {activityLogs.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">No activity has been recorded yet.</p>
            ) : activityLogs.map((log) => (
              <div key={log.id} className="flex items-start justify-between gap-3 py-2.5 text-xs">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{log.action.replace(/_/g, " ")}</p>
                  <p className="mt-0.5 truncate text-muted-foreground">{log.user_profile?.full_name || "Public visitor"}</p>
                </div>
                <time className="shrink-0 font-mono text-[10px] text-muted-foreground">{formatIST(log.created_at)}</time>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">This list includes recorded booking and appointment events; it is not a complete history of every record edit.</p>
        </div>

        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onClose}>Close</Button>
        </div>
      </section>
    </div>
  );
}
