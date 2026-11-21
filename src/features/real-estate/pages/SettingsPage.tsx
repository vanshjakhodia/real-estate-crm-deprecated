import { useEffect, useState, type FormEvent } from "react";
import { Building2, Check, LoaderCircle, ShieldCheck, KeyRound, Lock, Trash2, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCrm } from "../context/CrmContext";
import type { BusinessSettings } from "../types/crm";

const operatingDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function SettingsPage() {
  const {
    settings,
    updateSettings,
    clearAllData,
    currentRole,
    currentUser,
  } = useCrm();
  const [formSettings, setFormSettings] = useState(settings);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormSettings(settings);
  }, [settings]);

  async function handleSaveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      await updateSettings(formSettings);
      setMessage("Firm settings saved successfully.");
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Settings could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function handleClearRecords() {
    if (typeof window !== "undefined" && !window.confirm("Permanently delete every client, property record, appointment and related message? This cannot be undone.")) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await clearAllData();
      setMessage("CRM records were cleared successfully.");
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "CRM records could not be cleared.");
    } finally {
      setBusy(false);
    }
  }

  const canManage = currentRole === "admin";

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="border-b border-border pb-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-primary">Workspace</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold">Firm settings</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Operating hours, administrative security and communication parameters.</p>
      </header>

      {error ? <p className="border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground" role="alert">{error}</p> : null}
      {message ? <p className="flex items-center gap-2 border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-secondary-foreground" role="status"><Check className="size-4 text-primary" />{message}</p> : null}

      <section className="space-y-5 border-b border-border pb-8">
        <div className="flex items-center gap-3">
          <Building2 className="size-5 text-primary" />
          <div>
            <h2 className="font-serif text-xl font-semibold">Business details</h2>
            <p className="text-xs text-muted-foreground">These details appear on the public booking page.</p>
          </div>
        </div>

        {canManage ? (
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-xs font-medium text-secondary-foreground">
                Firm name
                <Input required value={formSettings.company_name} onChange={(event) => setFormSettings((current) => ({ ...current, company_name: event.target.value }))} />
              </label>
              <label className="space-y-1.5 text-xs font-medium text-secondary-foreground">
                City
                <Input required value={formSettings.city} onChange={(event) => setFormSettings((current) => ({ ...current, city: event.target.value }))} />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-xs font-medium text-secondary-foreground">
                Appointment hours start (IST)
                <Input type="time" required value={formSettings.working_hours_start} onChange={(event) => setFormSettings((current) => ({ ...current, working_hours_start: event.target.value }))} />
              </label>
              <label className="space-y-1.5 text-xs font-medium text-secondary-foreground">
                Appointment hours end (IST)
                <Input type="time" required value={formSettings.working_hours_end} onChange={(event) => setFormSettings((current) => ({ ...current, working_hours_end: event.target.value }))} />
              </label>
            </div>
            <fieldset className="space-y-2">
              <legend className="text-xs font-medium text-secondary-foreground">Booking days</legend>
              <div className="flex flex-wrap gap-3">
                {operatingDays.map((day) => (
                  <label key={day} className="flex items-center gap-2 text-xs text-foreground">
                    <input
                      type="checkbox"
                      checked={formSettings.working_days.includes(day)}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setFormSettings((current) => ({
                          ...current,
                          working_days: checked
                            ? [...current.working_days, day]
                            : current.working_days.filter((existing) => existing !== day),
                        }));
                      }}
                      className="size-4 accent-primary"
                    />
                    {day}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-xs font-medium text-secondary-foreground">
                Assistant language
                <select value={formSettings.ai_language} onChange={(event) => setFormSettings((current) => ({ ...current, ai_language: event.target.value as BusinessSettings["ai_language"] }))} className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground">
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Hinglish">Hinglish</option>
                </select>
              </label>
              <label className="space-y-1.5 text-xs font-medium text-secondary-foreground">
                Communication tone
                <Input value={formSettings.ai_tone} onChange={(event) => setFormSettings((current) => ({ ...current, ai_tone: event.target.value }))} />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">The assistant uses a secure server connection; no AI key is stored on this page.</p>
            <Button type="submit" disabled={busy}><Check />Save business details</Button>
          </form>
        ) : (
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div><dt className="text-xs text-muted-foreground">Firm</dt><dd>{settings.company_name}</dd></div>
            <div><dt className="text-xs text-muted-foreground">City</dt><dd>{settings.city}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Appointment hours</dt><dd>{settings.working_hours_start}–{settings.working_hours_end} IST</dd></div>
            <div><dt className="text-xs text-muted-foreground">Booking days</dt><dd>{settings.working_days.join(", ")}</dd></div>
          </dl>
        )}
      </section>

      {/* STRICT MASTER ADMIN SECURITY PROFILE */}
      <section className="space-y-5 border-b border-border pb-8">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-5 text-primary" />
          <div>
            <h2 className="font-serif text-xl font-semibold">Master Administrator Security Profile</h2>
            <p className="text-xs text-muted-foreground">Strict single-admin operating structure. Multi-staff invitations and agent logins are permanently disabled.</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card/60 p-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Primary Administrator</span>
              <p className="text-sm font-semibold text-foreground">{currentUser.full_name || 'Admin'}</p>
              <p className="text-xs text-muted-foreground">{currentUser.email}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Security Clearance</span>
              <div className="flex items-center gap-2">
                <span className="border border-primary/50 bg-primary/10 px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase text-primary rounded">
                  Strict Master Admin
                </span>
                <span className="flex items-center gap-1 text-[11px] text-primary">
                  <KeyRound className="size-3" /> PIN 14241700
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-3 grid gap-3 sm:grid-cols-3 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <Lock className="size-3.5 text-primary shrink-0 mt-0.5" />
              <span><strong>Staff Access:</strong> Disabled by system policy. Only strict owner admin login permitted.</span>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck className="size-3.5 text-primary shrink-0 mt-0.5" />
              <span><strong>End-to-End Encryption:</strong> AES-256-GCM active for confidential client dossiers.</span>
            </div>
            <div className="flex items-start gap-2">
              <ShieldAlert className="size-3.5 text-primary shrink-0 mt-0.5" />
              <span><strong>Data Privacy:</strong> Strict DPDP Act 2023 compliance with zero unauthorized data sharing.</span>
            </div>
          </div>
        </div>
      </section>

      {canManage ? (
        <section className="space-y-3 border-t border-destructive/30 pt-6">
          <h2 className="font-serif text-lg font-semibold text-destructive-foreground">Delete CRM records</h2>
          <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">This permanently deletes all clients, properties, appointments, messages and related activity records. Business settings and administrative credentials remain.</p>
          <Button type="button" variant="destructive" disabled={busy} onClick={() => void handleClearRecords()}>
            {busy ? <LoaderCircle className="animate-spin" /> : <Trash2 />}
            Delete all CRM records
          </Button>
        </section>
      ) : null}
    </div>
  );
}
