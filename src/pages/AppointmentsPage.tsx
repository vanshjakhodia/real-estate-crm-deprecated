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

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !newTime) return;

    const isoDateTime = `${newDate}T${newTime}:00+05:30`;
    const res = createAppointment({
      lead_id: newLeadId,
      type: newType,
      property_id: newPropertyId,
      scheduled_at: isoDateTime,
      notes: newNotes
    });

    if (res.conflict) {
      setCollisionWarning('Engagement recorded, but overlapping within 40 minutes of another booking.');
      setTimeout(() => {
        setIsCreateOpen(false);
        setCollisionWarning(null);
      }, 1500);
    } else {
      setIsCreateOpen(false);
      setCollisionWarning(null);
    }
  };

  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAptId || !rescheduleDate || !rescheduleTime) return;

    const isoDateTime = `${rescheduleDate}T${rescheduleTime}:00+05:30`;
    const res = rescheduleAppointment(selectedAptId, isoDateTime);

    if (res.conflict) {
      setRescheduleWarning('Rescheduled with notice: conflicts with another engagement in registry.');
      setTimeout(() => {
        setIsRescheduleOpen(false);
        setRescheduleWarning(null);
      }, 1500);
    } else {
      setIsRescheduleOpen(false);
      setRescheduleWarning(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-normal text-[#F4EFE6]">
            Site Engagements & Calendar
          </h2>
          <p className="text-xs text-[#8C8477] mt-1">
            {appointments.length} total scheduled • Dynamic collision prevention active (40-min buffer)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Toggle */}
          <div className="flex rounded-lg border border-[#352F26] bg-[#1A1814] p-1 text-xs">
            <button
              onClick={() => setViewMode('calendar')}
              className={`rounded px-3 py-1 font-medium transition-all ${
                viewMode === 'calendar' ? 'bg-[#C2A675] text-[#11100E] font-semibold' : 'text-[#8C8477] hover:text-[#D5CEBF]'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded px-3 py-1 font-medium transition-all ${
                viewMode === 'list' ? 'bg-[#C2A675] text-[#11100E] font-semibold' : 'text-[#8C8477] hover:text-[#D5CEBF]'
              }`}
            >
              List View
            </button>
          </div>

          {/* Export */}
          <button
            onClick={() => exportAppointmentsToExcel(appointments)}
            className="flex items-center gap-1.5 rounded-lg border border-[#352F26] bg-[#1A1814] px-3.5 py-2 text-xs font-medium text-[#D5CEBF] hover:bg-[#221F1A]"
          >
            <FileSpreadsheet className="h-4 w-4 text-[#9DBFA5]" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>

          {/* Create Button */}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[#C2A675] hover:bg-[#B39562] px-4 py-2 text-xs font-medium text-[#11100E] border border-[#A68A56] transition-all"
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
                ? 'bg-[#C2A675] text-[#11100E] font-semibold'
                : 'border border-[#352F26] bg-[#1A1814] text-[#8C8477] hover:text-[#D5CEBF]'
            }`}
          >
            {st} ({appointments.filter((a) => (st === 'all' ? true : a.status === st)).length})
          </button>
        ))}
      </div>

      {/* Main Content: Calendar vs List */}
      {viewMode === 'calendar' ? (
        <div className="rounded-xl border border-[#2E2820] bg-[#161411] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#2C2720] pb-3">
            <h3 className="font-serif font-bold text-base text-[#F4EFE6] flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-[#C2A675]" />
              <span>Engagement Schedule</span>
            </h3>
            <span className="text-xs text-[#8C8477] font-mono">Operating Hours: 10:00 - 18:00 IST</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAppointments.length === 0 ? (
              <div className="col-span-full py-16 text-center text-xs text-[#736B5F] space-y-2">
                <CalendarIcon className="mx-auto h-7 w-7 text-[#554E44] mb-1" />
                <p className="font-serif font-bold text-[#D5CEBF] text-sm">No engagements found for active filter.</p>
                <p className="text-[#736B5F]">Schedule a client walkthrough or consultation using the button above.</p>
              </div>
            ) : (
              filteredAppointments.map((apt) => {
                const lead = apt.lead;
                const property = apt.property;
                return (
                  <div
                    key={apt.id}
                    className="flex flex-col justify-between rounded-xl border border-[#2E2820] bg-[#1A1814] p-4 hover:border-[#443C30] transition-all"
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
                          className="font-serif font-bold text-sm text-[#F4EFE6] hover:text-[#C2A675] cursor-pointer"
                        >
                          {lead?.full_name || 'Client'}
                        </div>
                        <div className="text-xs text-[#C2A675] font-mono mt-0.5">{lead?.phone}</div>
                      </div>

                      <div className="text-xs text-[#D5CEBF] flex items-center gap-1.5 font-mono">
                        <Clock className="h-3.5 w-3.5 text-[#8C8477] shrink-0" />
                        <span>{formatIST(apt.scheduled_at)}</span>
                      </div>

                      {property && (
                        <div className="text-xs text-[#8C8477] flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-[#C2A675] shrink-0" />
                          <span>{property.project_name}</span>
                        </div>
                      )}

                      {apt.notes && (
                        <div className="rounded bg-[#14120F] p-2.5 border border-[#2A251E] text-[11px] text-[#A8A194] italic">
                          {apt.notes}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex items-center justify-between border-t border-[#26221B] pt-3 text-xs">
                      {lead?.phone && (
                        <a
                          href={buildWhatsAppLink(lead.phone, `Namaste ${lead.full_name} ji, regarding your appointment for ${property?.project_name || 'our property'}...`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 font-medium text-[#9DBFA5] hover:underline"
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
                          className="rounded border border-[#352F26] bg-[#221F1A] px-2.5 py-1 text-[11px] font-medium text-[#D5CEBF] hover:bg-[#2A2620]"
                        >
                          Reschedule
                        </button>
                        {apt.status === 'booked' && (
                          <button
                            onClick={() => cancelAppointment(apt.id)}
                            className="rounded border border-[#482D27] bg-[#2A1D1A] px-2 py-1 text-[11px] font-medium text-[#BFA0A0] hover:bg-[#34221E]"
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
        <div className="overflow-hidden rounded-xl border border-[#2E2820] bg-[#161411] shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#2C2720] bg-[#1C1A16] text-[10px] font-sans font-medium uppercase tracking-widest text-[#8C8477]">
              <tr>
                <th className="py-3.5 pl-5 pr-3">Scheduled Time</th>
                <th className="px-3 py-3.5">Format</th>
                <th className="px-3 py-3.5">Client Details</th>
                <th className="px-3 py-3.5">Estate / Locality</th>
                <th className="px-3 py-3.5">Status</th>
                <th className="py-3.5 pl-3 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#24201A]">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#736B5F]">
                    No appointments recorded yet.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-[#1C1A16]">
                    <td className="py-3.5 pl-5 pr-3 font-mono text-[#EAE5D9]">
                      {formatIST(apt.scheduled_at)}
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="capitalize font-medium text-[#D5CEBF]">{apt.type.replace('_', ' ')}</span>
                    </td>
                    <td className="px-3 py-3.5">
                      <div
                        onClick={() => apt.lead && onSelectLead(apt.lead.id)}
                        className="font-serif font-bold text-[#F4EFE6] hover:text-[#C2A675] cursor-pointer"
                      >
                        {apt.lead?.full_name}
                      </div>
                      <div className="text-[11px] text-[#C2A675] font-mono">{apt.lead?.phone}</div>
                    </td>
                    <td className="px-3 py-3.5 text-[#8C8477]">
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
                        className="rounded border border-[#352F26] px-2.5 py-1 text-[11px] font-medium text-[#D5CEBF] hover:bg-[#221F1A]"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0A09]/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-[#181613] p-6 shadow-2xl border border-[#383126] text-[#EAE5D9] text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#2C2720] pb-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex items-center gap-1 text-xs text-[#C2A675] hover:text-[#F4EFE6] px-2 py-1 rounded bg-[#221F1A] border border-[#3E362A] transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back</span>
                </button>
                <h3 className="font-serif font-bold text-base text-[#F4EFE6]">Schedule Client Engagement</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg p-1 text-[#8C8477] hover:bg-[#221F1A]"
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
                <label className="font-medium text-[#C8C2B5]">Client *</label>
                {leads.length > 0 ? (
                  <select
                    value={newLeadId}
                    onChange={(e) => setNewLeadId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9]"
                  >
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.full_name} ({l.phone})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="mt-1 rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#736B5F] text-xs">
                    No client records in registry yet. Add a lead first.
                  </div>
                )}
              </div>

              <div>
                <label className="font-medium text-[#C8C2B5]">Format *</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="mt-1 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9]"
                >
                  <option value="site_visit">On-site Estate Walkthrough</option>
                  <option value="call">Consultative Telephone Briefing</option>
                </select>
              </div>

              {properties.length > 0 && (
                <div>
                  <label className="font-medium text-[#C8C2B5]">Estate</label>
                  <select
                    value={newPropertyId}
                    onChange={(e) => setNewPropertyId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9]"
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
                  <label className="font-medium text-[#C8C2B5]">Date *</label>
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
                    className="mt-1 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9]"
                  />
                </div>
                <div>
                  <label className="font-medium text-[#C8C2B5]">Time *</label>
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
                    className="mt-1 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9]"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-[#C8C2B5]">Briefing Notes</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Client requested walkthrough of penthouse unit..."
                  className="mt-1 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9] placeholder-[#736B5F]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#2C2720]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-lg border border-[#352F26] px-4 py-2 font-medium text-[#8C8477] hover:text-[#EAE5D9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={leads.length === 0}
                  className="rounded-lg bg-[#C2A675] hover:bg-[#B39562] px-5 py-2 font-medium text-[#11100E] disabled:opacity-40"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0A09]/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-[#181613] p-6 shadow-2xl border border-[#383126] text-[#EAE5D9] text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#2C2720] pb-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsRescheduleOpen(false)}
                  className="flex items-center gap-1 text-xs text-[#C2A675] hover:text-[#F4EFE6] px-2 py-1 rounded bg-[#221F1A] border border-[#3E362A] transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back</span>
                </button>
                <h3 className="font-serif font-bold text-base text-[#F4EFE6]">Reschedule Engagement</h3>
              </div>
              <button
                onClick={() => setIsRescheduleOpen(false)}
                className="rounded-lg p-1 text-[#8C8477] hover:bg-[#221F1A]"
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
                  <label className="font-medium text-[#C8C2B5]">New Date</label>
                  <input
                    type="date"
                    required
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9]"
                  />
                </div>
                <div>
                  <label className="font-medium text-[#C8C2B5]">New Time</label>
                  <input
                    type="time"
                    required
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#2C2720]">
                <button
                  type="button"
                  onClick={() => setIsRescheduleOpen(false)}
                  className="rounded-lg border border-[#352F26] px-4 py-2 font-medium text-[#8C8477] hover:text-[#EAE5D9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#C2A675] hover:bg-[#B39562] px-5 py-2 font-medium text-[#11100E]"
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
