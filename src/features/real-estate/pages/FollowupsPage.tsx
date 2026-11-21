import React from 'react';
import { useCrm } from '../context/CrmContext';
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  MessageCircle,
  ArrowLeft
} from 'lucide-react';
import { formatIST, buildWhatsAppLink } from '../lib/utils';

interface FollowupsPageProps {
  onSelectLead: (leadId: string) => void;
  onBack?: () => void;
}

export const FollowupsPage: React.FC<FollowupsPageProps> = ({ onSelectLead, onBack }) => {
  const { followups, leads, markFollowupDone, snoozeFollowup } = useCrm();

  const now = Date.now();

  const overdueFollowups = followups.filter(
    (f) => f.status === 'pending' && new Date(f.scheduled_for).getTime() < now
  );

  const upcomingFollowups = followups.filter(
    (f) => f.status === 'pending' && new Date(f.scheduled_for).getTime() >= now
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-normal text-foreground">
          Client Communications & Follow-up Desk
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Scheduled cadence for active inquiries • Timely touchpoints across Kanpur
        </p>
      </div>

      {/* OVERDUE TASKS */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive-foreground" />
          <h3 className="font-serif font-bold text-destructive-foreground text-sm">
            Overdue Follow-ups ({overdueFollowups.length})
          </h3>
        </div>

        {overdueFollowups.length === 0 ? (
          <div className="rounded-xl border border-border bg-sidebar p-6 text-center text-xs text-forest">
            <CheckCircle2 className="mx-auto h-6 w-6 text-forest mb-1" />
            <p className="font-serif font-bold text-sm text-foreground">Communications Ledger Current</p>
            <p className="text-muted-foreground mt-0.5">No overdue follow-up tasks recorded.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {overdueFollowups.map((item) => {
              const lead = leads.find((l) => l.id === item.lead_id);
              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border bg-secondary p-5 shadow-xs gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded px-2 py-0.5 text-[10px] font-mono font-medium uppercase badge-oxblood">
                        Overdue Dispatch
                      </span>
                      <span className="text-[11px] font-mono text-destructive-foreground">
                        Scheduled: {formatIST(item.scheduled_for)}
                      </span>
                    </div>

                    <div
                      onClick={() => lead && onSelectLead(lead.id)}
                      className="mt-1 font-serif font-bold text-foreground text-sm hover:text-primary cursor-pointer"
                    >
                      {lead?.full_name || 'Client'}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Telephone: <span className="font-mono text-primary">{lead?.phone}</span> • Looking for {lead?.property_type || 'Apartment'} in {lead?.preferred_location || 'Kanpur'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {lead?.phone && (
                      <a
                        href={buildWhatsAppLink(lead.phone, `Namaste ${lead.full_name} ji! Lineage Properties Pvt Ltd se contact kar rahe hain.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-lg bg-secondary border border-border px-3.5 py-1.5 text-xs font-medium text-forest hover:bg-secondary"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>WhatsApp</span>
                      </a>
                    )}

                    <button
                      onClick={() => void snoozeFollowup(item.id, 1).catch(() => undefined)}
                      className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary"
                      title="Snooze 1 Day"
                    >
                      Snooze 1d
                    </button>

                    <button
                      onClick={() => void snoozeFollowup(item.id, 3).catch(() => undefined)}
                      className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary"
                      title="Snooze 3 Days"
                    >
                      Snooze 3d
                    </button>

                    <button
                      onClick={() => void markFollowupDone(item.id).catch(() => undefined)}
                      className="rounded-lg bg-primary hover:bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground"
                    >
                      Mark Dispatched
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* UPCOMING TASKS */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-serif font-bold text-foreground text-sm">
            Upcoming Communications ({upcomingFollowups.length})
          </h3>
        </div>

        {upcomingFollowups.length === 0 ? (
          <div className="rounded-xl border border-border bg-sidebar p-8 text-center text-xs text-muted-foreground">
            No future touchpoints currently scheduled in registry.
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingFollowups.map((item) => {
              const lead = leads.find((l) => l.id === item.lead_id);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4 text-xs shadow-xs"
                >
                  <div>
                    <div
                      onClick={() => lead && onSelectLead(lead.id)}
                      className="font-serif font-bold text-foreground hover:text-primary cursor-pointer"
                    >
                      {lead?.full_name || 'Prospect'}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                      Channel: <span className="capitalize">{item.channel}</span> • Due: {formatIST(item.scheduled_for)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => void snoozeFollowup(item.id, 2).catch(() => undefined)}
                      className="rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-secondary-foreground"
                    >
                      Snooze +2d
                    </button>
                    <button
                      onClick={() => void markFollowupDone(item.id).catch(() => undefined)}
                      className="rounded-lg bg-primary hover:bg-primary px-3 py-1 text-[11px] font-medium text-primary-foreground"
                    >
                      Dispatched
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
