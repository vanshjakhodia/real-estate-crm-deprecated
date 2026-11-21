import React, { useState } from 'react';
import { useCrm } from '../context/CrmContext';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  FileSpreadsheet,
  MapPin,
  Phone,
  MessageCircle,
  X,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';
import { formatIST, buildWhatsAppLink, isAppointmentConflicting } from '../lib/utils';
import { exportAppointmentsToExcel } from '../lib/excel';

interface AppointmentsPageProps {
  onSelectLead: (leadId: string) => void;
  onBack?: () => void;
}

export const AppointmentsPage: React.FC<AppointmentsPageProps> = ({ onSelectLead, onBack }) => {
  const { appointments, leads, properties, createAppointment, rescheduleAppointment, cancelAppointment } = useCrm();

  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [selectedAptId, setSelectedAptId] = useState<string | null>(null);

  // New appointment form state
  const [newLeadId, setNewLeadId] = useState(leads[0]?.id || '');
  const [newType, setNewType] = useState<'call' | 'site_visit'>('site_visit');
  const [newPropertyId, setNewPropertyId] = useState(properties[0]?.id || '');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('14:00');
  const [newNotes, setNewNotes] = useState('');
  const [collisionWarning, setCollisionWarning] = useState<string | null>(null);

  // Reschedule form state
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('15:00');
  const [rescheduleWarning, setRescheduleWarning] = useState<string | null>(null);

  const filteredAppointments = appointments.filter((a) => {
    if (filterStatus === 'all') return true;
    return a.status === filterStatus;
  });

  // Check collision dynamically as user selects time
  const checkCollision = (dateTimeStr: string, propId?: string) => {
    const bookedTimes = appointments
      .filter((a) => a.status === 'booked' && (!propId || a.property_id === propId))
      .map((a) => a.scheduled_at);

    if (isAppointmentConflicting(dateTimeStr, bookedTimes, 40)) {
      return 'Notice: Another engagement is scheduled within 40 minutes of this time slot.';
    }
    return null;
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !newTime) return;

    const isoDateTime = `${newDate}T${newTime}:00+05:30`;
    try {
      const res = await createAppointment({
      lead_id: newLeadId,
      type: newType,
      ...(newPropertyId ? { property_id: newPropertyId } : {}),
      scheduled_at: isoDateTime,
      notes: newNotes
      });

      if (res.conflict || res.error) {
        setCollisionWarning(res.error || 'Another appointment is scheduled within 40 minutes. Choose another time.');
      } else {
        setIsCreateOpen(false);
        setCollisionWarning(null);
      }
    } catch {
      setCollisionWarning('The appointment could not be saved. Please try again.');
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAptId || !rescheduleDate || !rescheduleTime) return;

    const isoDateTime = `${rescheduleDate}T${rescheduleTime}:00+05:30`;
    try {
      const res = await rescheduleAppointment(selectedAptId, isoDateTime);
      if (res.conflict || res.error) {
        setRescheduleWarning(res.error || 'Another appointment is scheduled within 40 minutes. Choose another time.');
      } else {
        setIsRescheduleOpen(false);
        setRescheduleWarning(null);
      }
    } catch {
      setRescheduleWarning('The appointment could not be changed. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-normal text-foreground">
            Site Engagements & Calendar
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {appointments.length} total scheduled • Dynamic collision prevention active (40-min buffer)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Toggle */}
          <div className="flex rounded-lg border border-border bg-card p-1 text-xs">
            <button
              onClick={() => setViewMode('calendar')}
              className={`rounded px-3 py-1 font-medium transition-all ${
                viewMode === 'calendar' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-secondary-foreground'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded px-3 py-1 font-medium transition-all ${
                viewMode === 'list' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-secondary-foreground'
              }`}
            >
              List View
            </button>
          </div>

          {/* Export */}
          <button
            onClick={() => exportAppointmentsToExcel(appointments)}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-medium text-secondary-foreground hover:bg-secondary"
          >
            <FileSpreadsheet className="h-4 w-4 text-forest" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>

          {/* Create Button */}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary hover:bg-primary px-4 py-2 text-xs font-medium text-primary-foreground border border-primary transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Book Visit</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {['all', 'booked', 'completed', 'cancelled'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`rounded-lg px-3 py-1.5 font-medium capitalize transition-all ${
              filterStatus === st
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'border border-border bg-card text-muted-foreground hover:text-secondary-foreground'
            }`}
          >
            {st} ({appointments.filter((a) => (st === 'all' ? true : a.status === st)).length})
          </button>
        ))}
      </div>

      {/* Main Content: Calendar vs List */}
      {viewMode === 'calendar' ? (
        <div className="rounded-xl border border-border bg-sidebar p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-serif font-bold text-base text-foreground flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" />
              <span>Engagement Schedule</span>
            </h3>
            <span className="text-xs text-muted-foreground font-mono">Operating Hours: 10:00 - 18:00 IST</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAppointments.length === 0 ? (
              <div className="col-span-full py-16 text-center text-xs text-muted-foreground space-y-2">
                <CalendarIcon className="mx-auto h-7 w-7 text-muted-foreground mb-1" />
                <p className="font-serif font-bold text-secondary-foreground text-sm">No engagements found for active filter.</p>
                <p className="text-muted-foreground">Schedule a client walkthrough or consultation using the button above.</p>
              </div>
            ) : (
              filteredAppointments.map((apt) => {
                const lead = apt.lead;
                const property = apt.property;
                return (
                  <div
                    key={apt.id}
                    className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 hover:border-border transition-all"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between">
                        <span className="rounded px-2 py-0.5 text-[10px] font-medium uppercase badge-forest">
                          {apt.type === 'site_visit' ? 'Walkthrough' : 'Consult'}
                        </span>
                        <span className="rounded px-2 py-0.5 text-[10px] font-mono font-medium uppercase badge-stone">
                          {apt.status}
                        </span>
                      </div>

                      <div>
                        <div
                          onClick={() => lead && onSelectLead(lead.id)}
                          className="font-serif font-bold text-sm text-foreground hover:text-primary cursor-pointer"
                        >
                          {lead?.full_name || 'Client'}
                        </div>
                        <div className="text-xs text-primary font-mono mt-0.5">{lead?.phone}</div>
                      </div>

                      <div className="text-xs text-secondary-foreground flex items-center gap-1.5 font-mono">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span>{formatIST(apt.scheduled_at)}</span>
                      </div>

                      {property && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>{property.project_name}</span>
                        </div>
                      )}

                      {apt.notes && (
                        <div className="rounded bg-sidebar p-2.5 border border-border text-[11px] text-muted-foreground italic">
                          {apt.notes}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
                      {lead?.phone && (
                        <a
                          href={buildWhatsAppLink(lead.phone, `Namaste ${lead.full_name} ji, regarding your appointment for ${property?.project_name || 'our property'}...`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 font-medium text-forest hover:underline"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      )}

                      <div className="flex items-center gap-1.5 ml-auto">
                        <button
                          onClick={() => {
                            setSelectedAptId(apt.id);
                            setIsRescheduleOpen(true);
                          }}
                          className="rounded border border-border bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground hover:bg-secondary"
                        >
                          Reschedule
                        </button>
                        {apt.status === 'booked' && (
                          <button
                            onClick={() => void cancelAppointment(apt.id).catch(() => undefined)}
                            className="rounded border border-border bg-destructive/20 px-2 py-1 text-[11px] font-medium text-destructive-foreground hover:bg-destructive/20"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="overflow-hidden rounded-xl border border-border bg-sidebar shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-secondary text-[10px] font-sans font-medium uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="py-3.5 pl-5 pr-3">Scheduled Time</th>
                <th className="px-3 py-3.5">Format</th>
                <th className="px-3 py-3.5">Client Details</th>
                <th className="px-3 py-3.5">Estate / Locality</th>
                <th className="px-3 py-3.5">Status</th>
                <th className="py-3.5 pl-3 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--surface-raised)]">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    No appointments recorded yet.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-secondary">
                    <td className="py-3.5 pl-5 pr-3 font-mono text-foreground">
                      {formatIST(apt.scheduled_at)}
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="capitalize font-medium text-secondary-foreground">{apt.type.replace('_', ' ')}</span>
                    </td>
                    <td className="px-3 py-3.5">
                      <div
                        onClick={() => apt.lead && onSelectLead(apt.lead.id)}
                        className="font-serif font-bold text-foreground hover:text-primary cursor-pointer"
                      >
                        {apt.lead?.full_name}
                      </div>
                      <div className="text-[11px] text-primary font-mono">{apt.lead?.phone}</div>
                    </td>
                    <td className="px-3 py-3.5 text-muted-foreground">
                      {apt.property?.project_name || 'General Consultation'}
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="rounded px-2 py-0.5 text-[10px] font-mono font-medium uppercase badge-forest">
                        {apt.status}
                      </span>
                    </td>
                    <td className="py-3.5 pl-3 pr-5 text-right">
                      <button
                        onClick={() => {
                          setSelectedAptId(apt.id);
                          setIsRescheduleOpen(true);
                        }}
                        className="rounded border border-border px-2.5 py-1 text-[11px] font-medium text-secondary-foreground hover:bg-secondary"
                      >
                        Reschedule
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE APPOINTMENT MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-2xl border border-border text-foreground text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex items-center gap-1 text-xs text-primary hover:text-foreground px-2 py-1 rounded bg-secondary border border-border transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back</span>
                </button>
                <h3 className="font-serif font-bold text-base text-foreground">Schedule Client Engagement</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {collisionWarning && (
              <div className="rounded-lg p-3 text-[11px] badge-oxblood">
                {collisionWarning}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="font-medium text-secondary-foreground">Client *</label>
                {leads.length > 0 ? (
                  <select
                    value={newLeadId}
                    onChange={(e) => setNewLeadId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-foreground"
                  >
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.full_name} ({l.phone})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="mt-1 rounded-lg border border-border bg-background p-2.5 text-muted-foreground text-xs">
                    No client records in registry yet. Add a lead first.
                  </div>
                )}
              </div>

              <div>
                <label className="font-medium text-secondary-foreground">Format *</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-foreground"
                >
                  <option value="site_visit">On-site Estate Walkthrough</option>
                  <option value="call">Consultative Telephone Briefing</option>
                </select>
              </div>

              {properties.length > 0 && (
                <div>
                  <label className="font-medium text-secondary-foreground">Estate</label>
                  <select
                    value={newPropertyId}
                    onChange={(e) => setNewPropertyId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-foreground"
                  >
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.project_name} ({p.location})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-medium text-secondary-foreground">Date *</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => {
                      setNewDate(e.target.value);
                      if (e.target.value && newTime) {
                        setCollisionWarning(checkCollision(`${e.target.value}T${newTime}:00+05:30`, newPropertyId));
                      }
                    }}
                    className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-foreground"
                  />
                </div>
                <div>
                  <label className="font-medium text-secondary-foreground">Time *</label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => {
                      setNewTime(e.target.value);
                      if (newDate && e.target.value) {
                        setCollisionWarning(checkCollision(`${newDate}T${e.target.value}:00+05:30`, newPropertyId));
                      }
                    }}
                    className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-secondary-foreground">Briefing Notes</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Client requested walkthrough of penthouse unit..."
                  className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-foreground placeholder-muted-foreground"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 font-medium text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={leads.length === 0}
                  className="rounded-lg bg-primary hover:bg-primary px-5 py-2 font-medium text-primary-foreground disabled:opacity-40"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESCHEDULE MODAL */}
      {isRescheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-2xl border border-border text-foreground text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsRescheduleOpen(false)}
                  className="flex items-center gap-1 text-xs text-primary hover:text-foreground px-2 py-1 rounded bg-secondary border border-border transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back</span>
                </button>
                <h3 className="font-serif font-bold text-base text-foreground">Reschedule Engagement</h3>
              </div>
              <button
                onClick={() => setIsRescheduleOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {rescheduleWarning && (
              <div className="rounded-lg p-3 text-[11px] badge-oxblood">
                {rescheduleWarning}
              </div>
            )}

            <form onSubmit={handleRescheduleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-medium text-secondary-foreground">New Date</label>
                  <input
                    type="date"
                    required
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-foreground"
                  />
                </div>
                <div>
                  <label className="font-medium text-secondary-foreground">New Time</label>
                  <input
                    type="time"
                    required
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-foreground"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsRescheduleOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 font-medium text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary hover:bg-primary px-5 py-2 font-medium text-primary-foreground"
                >
                  Save New Time
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
