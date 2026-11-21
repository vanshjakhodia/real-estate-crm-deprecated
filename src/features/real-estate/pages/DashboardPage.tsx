import React from 'react';
import { useCrm } from '../context/CrmContext';
import {
  Users,
  Flame,
  Calendar,
  AlertCircle,
  TrendingUp,
  Building,
  UserPlus,
  ArrowRight,
  Phone,
  MessageCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  Compass,
  FileSpreadsheet
} from 'lucide-react';
import { exportMasterCrmToExcel } from '../lib/excel';
import { formatIndianCurrency, formatIST, buildWhatsAppLink } from '../lib/utils';

interface DashboardPageProps {
  onNavigate: (tab: string, filter?: any) => void;
  onOpenAddLead: () => void;
  onSelectLead: (leadId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenAddLead,
  onSelectLead
}) => {
  const { leads, appointments, followups, properties, currentRole, currentUser } = useCrm();

  // Metrics
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const newLeadsToday = leads.filter(
    (l) => new Date(l.created_at).getTime() >= startOfToday
  ).length;

  const hotLeads = leads.filter((l) => l.lead_score === 'hot');
  const warmLeads = leads.filter((l) => l.lead_score === 'warm');
  const coldLeads = leads.filter((l) => l.lead_score === 'cold');

  const upcomingSiteVisits = appointments.filter(
    (a) => a.status === 'booked' && a.type === 'site_visit'
  );

  const overdueFollowups = followups.filter(
    (f) => f.status === 'pending' && new Date(f.scheduled_for).getTime() < Date.now()
  );

  // Conversion Funnel
  const totalLeads = leads.length;
  const contactedCount = leads.filter((l) => ['contacted', 'site_visit_booked', 'negotiation', 'won'].includes(l.status)).length;
  const visitBookedCount = leads.filter((l) => ['site_visit_booked', 'negotiation', 'won'].includes(l.status)).length;
  const wonCount = leads.filter((l) => l.status === 'won').length;

  const funnelSteps = [
    { label: 'Registered Clients', count: totalLeads, pct: totalLeads > 0 ? 100 : 0, color: 'bg-card' },
    { label: 'Initial Consultations', count: contactedCount, pct: totalLeads > 0 ? Math.round((contactedCount / totalLeads) * 100) : 0, color: 'bg-card' },
    { label: 'Site Visits Arranged', count: visitBookedCount, pct: totalLeads > 0 ? Math.round((visitBookedCount / totalLeads) * 100) : 0, color: 'bg-card' },
    { label: 'Acquisitions Completed', count: wonCount, pct: totalLeads > 0 ? Math.round((wonCount / totalLeads) * 100) : 0, color: 'bg-forest/15' }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-xl border border-border bg-sidebar p-6 sm:p-8 text-foreground shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="rounded px-2.5 py-0.5 text-[10px] font-mono tracking-widest uppercase badge-gold">
                Executive Desk • Admin
              </span>
              <span className="text-xs text-muted-foreground">Kanpur, Uttar Pradesh</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-normal text-foreground">
              Estate Registry & Portfolio Overview
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {leads.length} active client dossiers • {properties.filter((p) => p.status === 'available').length} verified Kanpur estates listed
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <button
              onClick={() => exportMasterCrmToExcel({ leads, appointments, properties })}
              className="flex items-center gap-2 rounded-lg border border-border bg-card hover:bg-secondary px-3.5 py-2.5 text-xs font-medium text-primary transition-all shadow-xs"
              title="Download entire CRM ledger in MS Excel (.xlsx) format"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Export MS Excel (.xlsx)</span>
            </button>
            <button
              onClick={onOpenAddLead}
              className="flex items-center gap-2 rounded-lg bg-primary hover:bg-primary px-4 py-2.5 text-xs font-medium text-primary-foreground border border-primary transition-all shadow-xs"
            >
              <UserPlus className="h-4 w-4" />
              <span>Register New Client</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Noble Vintage Metrics */}
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3.5 sm:gap-4 lg:grid-cols-4">
        {/* Today's Inquiries */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Today's Registrations</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary border border-border">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-foreground">{newLeadsToday}</span>
            <span className="text-xs text-muted-foreground">of {leads.length} total</span>
          </div>
        </div>

        {/* High-Intent Clients */}
        <div
          onClick={() => onNavigate('leads', { score: 'hot' })}
          className="cursor-pointer rounded-xl border border-border bg-secondary p-5 hover:border-border transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-destructive-foreground">High Intent (Hot)</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/20 text-destructive-foreground border border-border">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-destructive-foreground">{hotLeads.length}</span>
            <span className="text-xs text-muted-foreground font-medium">Ready to acquire</span>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground flex gap-2 font-mono">
            <span>Warm: {warmLeads.length}</span>
            <span>•</span>
            <span>Cold: {coldLeads.length}</span>
          </div>
        </div>

        {/* Site Visits */}
        <div
          onClick={() => onNavigate('appointments')}
          className="cursor-pointer rounded-xl border border-border bg-sidebar p-5 hover:border-border transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-forest">Site Walkthroughs</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-forest border border-border">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-forest">{upcomingSiteVisits.length}</span>
            <span className="text-xs text-muted-foreground font-medium">Scheduled</span>
          </div>
        </div>

        {/* Overdue Cadence */}
        <div
          onClick={() => onNavigate('followups')}
          className="cursor-pointer rounded-xl border border-border bg-card p-5 hover:border-border transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-brass-soft">Pending Cadence</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-card text-brass-soft border border-border">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-brass-soft">{overdueFollowups.length}</span>
            <span className="text-xs text-muted-foreground font-medium">Requires dispatch</span>
          </div>
        </div>
      </div>

      {/* Grid: Conversion Funnel + Upcoming Engagements */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Understated Funnel Chart */}
        <div className="rounded-xl border border-border bg-sidebar p-6 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="font-serif font-bold text-base text-foreground">Pipeline Conversion Cadence</h3>
              <p className="text-xs text-muted-foreground">Progress from first inquiry to deed registration</p>
            </div>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>

          <div className="space-y-4 pt-1">
            {funnelSteps.map((step, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-secondary-foreground">
                  <span>{step.label}</span>
                  <span className="font-mono text-foreground">
                    {step.count} ({step.pct}%)
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-sm bg-secondary overflow-hidden border border-border">
                  <div
                    className={`h-full ${step.color} transition-all duration-500`}
                    style={{ width: `${Math.max(step.pct, totalLeads > 0 ? 3 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
            <span className="font-mono text-[11px]">Lineage Properties Pvt Ltd Cadence Engine</span>
            <button
              onClick={() => onNavigate('leads')}
              className="flex items-center gap-1 font-medium text-primary hover:text-brass-soft transition-colors"
            >
              <span>Inspect full registry</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Priority Upcoming Visits */}
        <div className="rounded-xl border border-border bg-sidebar p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="font-serif font-bold text-base text-foreground">Upcoming Site Visits</h3>
              <p className="text-xs text-muted-foreground">Confirmed private appointments</p>
            </div>
            <Calendar className="h-4 w-4 text-forest" />
          </div>

          {upcomingSiteVisits.length === 0 ? (
            <div className="flex h-44 flex-col items-center justify-center text-center text-muted-foreground">
              <Calendar className="h-7 w-7 mb-2 stroke-[1.2] text-muted-foreground" />
              <p className="text-xs">No upcoming site engagements scheduled.</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Visits requested via portal will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSiteVisits.slice(0, 3).map((apt) => {
                const lead = leads.find((l) => l.id === apt.lead_id);
                const property = properties.find((p) => p.id === apt.property_id);
                return (
                  <div
                    key={apt.id}
                    className="rounded-lg border border-border bg-card p-3.5 hover:border-border transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div
                          onClick={() => lead && onSelectLead(lead.id)}
                          className="font-serif font-bold text-sm text-foreground hover:text-primary cursor-pointer"
                        >
                          {lead?.full_name || 'Client'}
                        </div>
                        <div className="text-xs text-muted-foreground font-medium">
                          {property?.project_name || 'Estate Walkthrough'}
                        </div>
                      </div>
                      <span className="rounded px-2 py-0.5 text-[10px] font-medium badge-forest">
                        {apt.type === 'site_visit' ? 'Walkthrough' : 'Consult'}
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatIST(apt.scheduled_at)}</span>
                      </div>
                      {lead?.phone && (
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`tel:${lead.phone}`}
                            className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
                            title="Telephone Client"
                          >
                            <Phone className="h-3 w-3" />
                          </a>
                          <a
                            href={buildWhatsAppLink(lead.phone, `Namaste ${lead.full_name} ji, regarding your upcoming estate appointment for ${property?.project_name}...`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded bg-secondary border border-border p-1 text-forest hover:bg-secondary"
                            title="Dispatch WhatsApp"
                          >
                            <MessageCircle className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={() => onNavigate('appointments')}
            className="w-full rounded-lg border border-border bg-card py-2 text-center text-xs font-medium text-secondary-foreground hover:bg-secondary transition-colors"
          >
            Open Appointment Calendar
          </button>
        </div>
      </div>
    </div>
  );
};
