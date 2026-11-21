import React, { useState } from 'react';
import { useCrm } from '../context/CrmContext';
import {
  ArrowLeft,
  Flame,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  MessageCircle,
  Copy,
  Check,
  Plus,
  Send,
  Trash2,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { formatIndianCurrency, formatIST, buildWhatsAppLink } from '../lib/utils';

interface LeadDetailPageProps {
  leadId: string;
  onBack: () => void;
  onNavigateAppointments: () => void;
  onBackToDashboard?: () => void;
}

export const LeadDetailPage: React.FC<LeadDetailPageProps> = ({
  leadId,
  onBack,
  onNavigateAppointments,
  onBackToDashboard
}) => {
  const {
    leads,
    deleteLead,
    appointments,
    createAppointment,
    cancelAppointment,
    getLeadMessages,
    addMessage,
    generateFollowupDraft,
    scoreLeadWithAi,
    aiAvailable,
    currentRole,
    settings,
    properties
  } = useCrm();

  const lead = leads.find((l) => l.id === leadId);
  const leadMessages = getLeadMessages(leadId);
  const leadAppointments = appointments.filter((a) => a.lead_id === leadId);

  // AI draft state
  const [aiDraft, setAiDraft] = useState('');
  const [draftLanguage, setDraftLanguage] = useState<'English' | 'Hindi' | 'Hinglish'>(settings.ai_language);
  const [draftTone, setDraftTone] = useState('Polite, warm and consultative');
  const [isDrafting, setIsDrafting] = useState(false);
  const [copiedDraft, setCopiedDraft] = useState(false);

  // AI Lead scoring state
  const [isScoring, setIsScoring] = useState(false);
  const [scoreResult, setScoreResult] = useState<{ lead_score: string; reason: string } | null>(null);

  // New message form state
  const [newMessageText, setNewMessageText] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<'whatsapp' | 'instagram' | 'email' | 'manual'>('whatsapp');

  // Book appointment modal state
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bookType, setBookType] = useState<'call' | 'site_visit'>('site_visit');
  const [bookPropertyId, setBookPropertyId] = useState(properties[0]?.id || '');
  const [bookDate, setBookDate] = useState('');
  const [bookTime, setBookTime] = useState('15:00');
  const [bookNotes, setBookNotes] = useState('');
  const [conflictWarning, setConflictWarning] = useState(false);

  if (!lead) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center text-foreground">
        <h3 className="font-serif font-bold text-lg text-foreground">Dossier Not Found or Access Restricted</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {currentRole === 'agent'
            ? 'This client dossier is not assigned to your account under Fiduciary RLS rules.'
            : 'The record may have been deleted.'}
        </p>
        <button
          onClick={onBack}
          className="mt-4 rounded-lg bg-primary hover:bg-primary px-5 py-2 text-xs font-medium text-primary-foreground"
        >
          Return to Registry
        </button>
      </div>
    );
  }

  // Generate Followup with Gemini
  const handleGenerateDraft = async () => {
    setIsDrafting(true);
    setCopiedDraft(false);
    try {
      const draft = await generateFollowupDraft(leadId, draftLanguage, draftTone);
      setAiDraft(draft);
    } catch (issue) {
      alert(issue instanceof Error ? issue.message : 'The draft could not be generated.');
    } finally {
      setIsDrafting(false);
    }
  };

  const copyToClipboard = () => {
    if (!aiDraft) return;
    navigator.clipboard.writeText(aiDraft);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  // Auto-Score Lead with Gemini
  const handleScoreLead = async () => {
    setIsScoring(true);
    try {
      const result = await scoreLeadWithAi(leadId);
      setScoreResult(result);
    } catch (issue) {
      alert(issue instanceof Error ? issue.message : 'The client could not be evaluated.');
    } finally {
      setIsScoring(false);
    }
  };

  // Add message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;
    try {
      await addMessage(leadId, newMessageText.trim(), selectedChannel, 'agent');
      setNewMessageText('');
    } catch {
      // The workspace error banner reports the failed save.
    }
  };

  // Handle Book Appointment
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookDate || !bookTime) {
      alert('Please select date and time.');
      return;
    }
    const isoDateTime = `${bookDate}T${bookTime}:00+05:30`;
    try {
      const res = await createAppointment({
        lead_id: leadId,
        type: bookType,
        ...(bookPropertyId ? { property_id: bookPropertyId } : {}),
        scheduled_at: isoDateTime,
        notes: bookNotes,
      });
      if (res.conflict || res.error) setConflictWarning(true);
      else {
        setIsBookModalOpen(false);
        setConflictWarning(false);
      }
    } catch {
      setConflictWarning(true);
    }
  };

  // Delete lead (DPDP)
  const handleDeleteLead = async () => {
    if (!confirm(`Permanently delete ${lead.full_name} and its linked messages and appointments? This cannot be undone.`)) return;
    try {
      await deleteLead(leadId);
      onBack();
    } catch {
      // The workspace error banner reports the failed deletion.
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-primary hover:bg-secondary hover:border-primary hover:text-foreground transition-all shadow-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Client Registry</span>
          </button>
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded transition-colors"
            >
              <span>Dashboard</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Open WhatsApp Button */}
          <a
            href={buildWhatsAppLink(lead.phone, aiDraft || `Hello ${lead.full_name}, greetings from ${settings.company_name}. We are following up regarding your real estate inquiry.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-secondary border border-border px-3.5 py-1.5 text-xs font-medium text-forest hover:bg-secondary transition-all"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Open WhatsApp</span>
          </a>

          {/* Call Phone */}
          <a
            href={`tel:${lead.phone}`}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary"
          >
            <Phone className="h-3.5 w-3.5 text-brass-soft" />
            <span>Telephone</span>
          </a>

          {/* Delete Lead (Admin Only DPDP) */}
          {currentRole === 'admin' && (
            <button
              onClick={handleDeleteLead}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-destructive/20 px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:bg-destructive/20"
              title="Delete dossier under DPDP Act requirements"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Purge Dossier (DPDP)</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid: Profile Card & AI Evaluation */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Lead Profile */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-sidebar p-6 shadow-xs space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-serif text-xl font-bold text-foreground">{lead.full_name}</h2>
                <div className="text-xs text-primary font-mono mt-0.5">{lead.phone}</div>
                {lead.email && <div className="text-xs text-muted-foreground mt-0.5">{lead.email}</div>}
              </div>
              <span
                className={`rounded px-2.5 py-1 text-xs font-mono font-medium uppercase ${
                  lead.lead_score === 'hot'
                    ? 'badge-oxblood'
                    : lead.lead_score === 'warm'
                    ? 'badge-cognac'
                    : 'badge-stone'
                }`}
              >
                {lead.lead_score} Tier
              </span>
            </div>

            {/* Badges / Specs */}
            <div className="grid grid-cols-2 gap-3 text-xs border-y border-border py-3.5">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">Intent</span>
                <p className="font-serif font-bold text-foreground text-sm mt-0.5 uppercase">{lead.intent || 'PURCHASE'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">Asset Class</span>
                <p className="font-medium text-secondary-foreground mt-0.5">{lead.property_type || 'Apartment'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">Estimated Budget</span>
                <p className="font-serif font-bold text-primary text-sm mt-0.5">
                  {lead.budget_max ? formatIndianCurrency(lead.budget_max) : 'Not specified'}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">Possession Window</span>
                <p className="font-medium text-secondary-foreground mt-0.5">{lead.timeline || '1-2 months'}</p>
              </div>
            </div>

            {/* Location & Status */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-secondary-foreground">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span>{lead.preferred_location || 'Kanpur, UP'}</span>
              </div>
              {lead.ig_handle && (
                <div className="flex items-center gap-2 text-primary font-mono text-[11px]">
                  <span className="text-[10px] bg-secondary border border-border rounded px-1 py-0.5">IG</span>
                  <span>@{lead.ig_handle}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground text-[11px] font-mono">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>Last Interaction: {formatIST(lead.last_contact_at)}</span>
              </div>
            </div>

            {/* DPDP Consent Box */}
            <div className="rounded-lg p-3 text-[11px] badge-forest">
              <div className="flex items-center gap-1.5 font-medium text-forest">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>{lead.consent_given ? 'Consent recorded' : 'No consent recorded'}</span>
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {lead.consent_given && lead.consent_at ? `Recorded ${formatIST(lead.consent_at)}` : 'Do not contact until consent is confirmed.'}
              </p>
            </div>
          </div>

          {/* AI Executive Summary & Auto-scoring */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="font-serif font-bold text-sm text-foreground">Estate Intelligence Synthesis</h3>
              </div>
              <button
                onClick={handleScoreLead}
                disabled={isScoring || !aiAvailable}
                className="flex items-center gap-1.5 rounded-lg bg-primary hover:bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-40 transition-colors"
              >
                {isScoring ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Flame className="h-3.5 w-3.5" />}
                <span>{aiAvailable ? 'Evaluate' : 'AI unavailable'}</span>
              </button>
            </div>

            <div className="rounded-lg bg-sidebar p-4 border border-border text-xs text-secondary-foreground leading-relaxed">
              <div className="font-mono text-[10px] uppercase tracking-wider text-primary mb-1">
                Synthesized Profile:
              </div>
              <p>{lead.ai_summary || lead.notes || 'No synthesis generated yet. Click Evaluate to analyze requirements.'}</p>
            </div>

            {scoreResult && (
              <div className="rounded-lg p-3 text-xs badge-gold">
                <span className="font-semibold">Evaluation Logic: </span>
                <span>{scoreResult.reason}</span>
              </div>
            )}
          </div>
        </div>

        {/* Center & Right Columns: Chat History & AI Follow-up Drafter */}
        <div className="space-y-6 lg:col-span-2">
          {/* AI Follow-up Message Generator Box */}
          <div className="rounded-xl border border-border bg-sidebar p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
              <div>
                <h3 className="font-serif font-bold text-base text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>Draft client correspondence</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Composes polite, bespoke correspondence in Hinglish, Hindi, or English.</p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={draftLanguage}
                  onChange={(e) => setDraftLanguage(e.target.value as any)}
                  className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-secondary-foreground"
                >
                  <option value="Hinglish">Hinglish</option>
                  <option value="Hindi">Hindi (हिंदी)</option>
                  <option value="English">English</option>
                </select>

                <button
                  onClick={handleGenerateDraft}
                  disabled={isDrafting || !aiAvailable}
                  className="flex items-center gap-1.5 rounded-lg bg-primary hover:bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-40 transition-all"
                >
                  {isDrafting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  <span>{aiAvailable ? 'Generate draft' : 'AI unavailable'}</span>
                </button>
              </div>
            </div>

            {aiDraft ? (
              <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap font-sans">
                  {aiDraft}
                </p>
                <div className="flex items-center justify-between border-t border-border pt-2.5 text-xs">
                  <span className="text-[11px] text-muted-foreground">
                    Review draft before dispatching to client
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center gap-1 rounded-lg border border-border bg-secondary px-3 py-1.5 text-[11px] font-medium text-secondary-foreground hover:bg-card"
                    >
                      {copiedDraft ? <Check className="h-3.5 w-3.5 text-forest" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedDraft ? 'Copied' : 'Copy'}</span>
                    </button>
                    <a
                      href={buildWhatsAppLink(lead.phone, aiDraft)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg bg-secondary border border-border px-3.5 py-1.5 text-[11px] font-medium text-forest hover:bg-secondary"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>Send via WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-muted-foreground text-xs">
                Select <strong>"Generate Draft"</strong> to formulate tailored correspondence in {draftLanguage}.
              </div>
            )}
          </div>

          {/* Full Multi-channel Message History */}
          <div className="rounded-xl border border-border bg-sidebar p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-serif font-bold text-base text-foreground">Communication Archive</h3>
              <span className="text-xs text-muted-foreground font-mono">{leadMessages.length} total entries</span>
            </div>

            {/* Chat Thread */}
            <div className="max-h-64 overflow-y-auto space-y-3 p-1">
              {leadMessages.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No prior messages logged for this client folio.
                </div>
              ) : (
                leadMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.direction === 'out' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-4 py-2.5 text-xs shadow-xs ${
                        msg.direction === 'out'
                          ? 'bg-secondary text-foreground border border-border'
                          : 'bg-secondary text-secondary-foreground border border-border'
                      }`}
                    >
                      <div>{msg.content}</div>
                      <div className="mt-1 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground font-mono">
                        <span className="capitalize">{msg.channel}</span>
                        <span>•</span>
                        <span>{formatIST(msg.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Send / Log Message Box */}
            <form onSubmit={handleSendMessage} className="border-t border-border pt-3 space-y-2">
              <div className="flex items-center gap-2">
                <select
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value as any)}
                  className="rounded-lg border border-border bg-background px-2.5 py-2 text-xs font-medium text-secondary-foreground"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="instagram">Instagram Direct</option>
                  <option value="email">Electronic Mail</option>
                  <option value="manual">Telephone Record</option>
                </select>
                <input
                  type="text"
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  placeholder="Record an interaction note or message..."
                  className="flex-1 rounded-lg border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!newMessageText.trim()}
                  className="rounded-lg bg-primary hover:bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </div>

          {/* Appointments Box */}
          <div className="rounded-xl border border-border bg-sidebar p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-serif font-bold text-base text-foreground">Estate Engagements & Consultations</h3>
                <p className="text-xs text-muted-foreground">Scheduled on-site walkthroughs</p>
              </div>
              <button
                onClick={() => setIsBookModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-primary hover:bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Schedule Engagement</span>
              </button>
            </div>

            {leadAppointments.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No engagements scheduled for this client folio.
              </div>
            ) : (
              <div className="space-y-2.5">
                {leadAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-3.5 text-xs"
                  >
                    <div>
                      <div className="font-serif font-bold text-foreground">
                        {apt.type === 'site_visit' ? 'Site Walkthrough' : 'Telephone Consultation'}
                      </div>
                      <div className="text-muted-foreground text-[11px] mt-0.5 font-mono">
                        {formatIST(apt.scheduled_at)} {apt.property?.project_name ? `• ${apt.property.project_name}` : ''}
                      </div>
                      {apt.notes && <div className="text-[11px] text-muted-foreground italic mt-0.5">{apt.notes}</div>}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded px-2 py-0.5 text-[10px] font-mono font-medium uppercase badge-forest">
                        {apt.status}
                      </span>
                      {apt.status === 'booked' && (
                        <button
                          onClick={() => void cancelAppointment(apt.id, 'Cancelled by team').catch(() => undefined)}
                          className="rounded border border-border bg-destructive/20 px-2 py-0.5 text-[10px] font-medium text-destructive-foreground hover:bg-destructive/20"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BOOK APPOINTMENT MODAL */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-2xl border border-border text-foreground text-xs space-y-4">
            <h3 className="font-serif font-bold text-base text-foreground">Schedule Engagement for {lead.full_name}</h3>

            {conflictWarning && (
              <div className="rounded-lg p-3 text-[11px] flex items-start gap-2 badge-oxblood">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-destructive-foreground" />
                <div>
                  <strong>Potential Collision Detected:</strong> Another client engagement is scheduled within 40 minutes of this slot.
                </div>
              </div>
            )}

            <form onSubmit={handleBookAppointment} className="space-y-3">
              <div>
                <label className="font-medium text-secondary-foreground">Format</label>
                <select
                  value={bookType}
                  onChange={(e) => setBookType(e.target.value as any)}
                  className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-foreground"
                >
                  <option value="site_visit">On-site Estate Walkthrough</option>
                  <option value="call">Consultative Telephone Briefing</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-secondary-foreground">Estate</label>
                <select
                  value={bookPropertyId}
                  onChange={(e) => setBookPropertyId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-foreground"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.project_name} ({p.location})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-medium text-secondary-foreground">Date</label>
                  <input
                    type="date"
                    required
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-foreground"
                  />
                </div>
                <div>
                  <label className="font-medium text-secondary-foreground">Time</label>
                  <input
                    type="time"
                    required
                    value={bookTime}
                    onChange={(e) => setBookTime(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-secondary-foreground">Private Briefing Notes</label>
                <textarea
                  rows={2}
                  value={bookNotes}
                  onChange={(e) => setBookNotes(e.target.value)}
                  placeholder="e.g. Client requested inspection of penthouse sample..."
                  className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-foreground placeholder-muted-foreground"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 font-medium text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary hover:bg-primary px-5 py-2 font-medium text-primary-foreground"
                >
                  Confirm Engagement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
