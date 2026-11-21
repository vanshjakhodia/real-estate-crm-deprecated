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
        <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-normal text-[#F4EFE6]">
          Client Communications & Follow-up Desk
        </h2>
        <p className="text-xs text-[#8C8477] mt-1">
          Scheduled cadence for active inquiries • Timely touchpoints across Kanpur
        </p>
      </div>

      {/* OVERDUE TASKS */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-[#BFA0A0]" />
          <h3 className="font-serif font-bold text-[#D5B0B0] text-sm">
            Overdue Follow-ups ({overdueFollowups.length})
          </h3>
        </div>

        {overdueFollowups.length === 0 ? (
          <div className="rounded-xl border border-[#2B3E30] bg-[#151916] p-6 text-center text-xs text-[#9DBFA5]">
            <CheckCircle2 className="mx-auto h-6 w-6 text-[#9DBFA5] mb-1" />
            <p className="font-serif font-bold text-sm text-[#F4EFE6]">Communications Ledger Current</p>
            <p className="text-[#8C8477] mt-0.5">No overdue follow-up tasks recorded.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {overdueFollowups.map((item) => {
              const lead = leads.find((l) => l.id === item.lead_id);
              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl border border-[#482D27] bg-[#1A1614] p-5 shadow-xs gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded px-2 py-0.5 text-[10px] font-mono font-medium uppercase badge-oxblood">
                        Overdue Dispatch
                      </span>
                      <span className="text-[11px] font-mono text-[#BFA0A0]">
                        Scheduled: {formatIST(item.scheduled_for)}
                      </span>
                    </div>

                    <div
                      onClick={() => lead && onSelectLead(lead.id)}
                      className="mt-1 font-serif font-bold text-[#F4EFE6] text-sm hover:text-[#C2A675] cursor-pointer"
                    >
                      {lead?.full_name || 'Client'}
                    </div>

                    <div className="text-xs text-[#8C8477]">
                      Telephone: <span className="font-mono text-[#C2A675]">{lead?.phone}</span> • Looking for {lead?.property_type || 'Apartment'} in {lead?.preferred_location || 'Kanpur'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {lead?.phone && (
                      <a
                        href={buildWhatsAppLink(lead.phone, `Namaste ${lead.full_name} ji! Lineage Properties Pvt Ltd se contact kar rahe hain.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-lg bg-[#1B261F] border border-[#2B3E30] px-3.5 py-1.5 text-xs font-medium text-[#9DBFA5] hover:bg-[#25362B]"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>WhatsApp</span>
                      </a>
                    )}

                    <button
                      onClick={() => snoozeFollowup(item.id, 1)}
                      className="rounded-lg border border-[#352F26] bg-[#221F1A] px-3 py-1.5 text-xs font-medium text-[#D5CEBF] hover:bg-[#2A2620]"
                      title="Snooze 1 Day"
                    >
                      Snooze 1d
                    </button>

                    <button
                      onClick={() => snoozeFollowup(item.id, 3)}
                      className="rounded-lg border border-[#352F26] bg-[#221F1A] px-3 py-1.5 text-xs font-medium text-[#D5CEBF] hover:bg-[#2A2620]"
                      title="Snooze 3 Days"
                    >
                      Snooze 3d
                    </button>

                    <button
                      onClick={() => markFollowupDone(item.id)}
                      className="rounded-lg bg-[#C2A675] hover:bg-[#B39562] px-4 py-1.5 text-xs font-medium text-[#11100E]"
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
          <Clock className="h-4 w-4 text-[#8C8477]" />
          <h3 className="font-serif font-bold text-[#EAE5D9] text-sm">
            Upcoming Communications ({upcomingFollowups.length})
          </h3>
        </div>

        {upcomingFollowups.length === 0 ? (
          <div className="rounded-xl border border-[#2E2820] bg-[#161411] p-8 text-center text-xs text-[#736B5F]">
            No future touchpoints currently scheduled in registry.
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingFollowups.map((item) => {
              const lead = leads.find((l) => l.id === item.lead_id);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-[#2E2820] bg-[#181613] p-4 text-xs shadow-xs"
                >
                  <div>
                    <div
                      onClick={() => lead && onSelectLead(lead.id)}
                      className="font-serif font-bold text-[#F4EFE6] hover:text-[#C2A675] cursor-pointer"
                    >
                      {lead?.full_name || 'Prospect'}
                    </div>
                    <div className="text-[11px] text-[#8C8477] font-mono mt-0.5">
                      Channel: <span className="capitalize">{item.channel}</span> • Due: {formatIST(item.scheduled_for)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => snoozeFollowup(item.id, 2)}
                      className="rounded-lg border border-[#352F26] px-2.5 py-1 text-[11px] font-medium text-[#8C8477] hover:text-[#D5CEBF]"
                    >
                      Snooze +2d
                    </button>
                    <button
                      onClick={() => markFollowupDone(item.id)}
                      className="rounded-lg bg-[#C2A675] hover:bg-[#B39562] px-3 py-1 text-[11px] font-medium text-[#11100E]"
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
