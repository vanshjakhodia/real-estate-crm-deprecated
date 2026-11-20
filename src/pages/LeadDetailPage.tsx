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
      <div className="rounded-xl border border-[#332D24] bg-[#181613] p-12 text-center text-[#EAE5D9]">
        <h3 className="font-serif font-bold text-lg text-[#F4EFE6]">Dossier Not Found or Access Restricted</h3>
        <p className="text-xs text-[#8C8477] mt-1">
          {currentRole === 'agent'
            ? 'This client dossier is not assigned to your account under Fiduciary RLS rules.'
            : 'The record may have been deleted.'}
        </p>
        <button
          onClick={onBack}
          className="mt-4 rounded-lg bg-[#C2A675] hover:bg-[#B39562] px-5 py-2 text-xs font-medium text-[#11100E]"
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
    } catch (e: any) {
      alert(`Error generating draft: ${e.message}`);
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
    } catch (e: any) {
      alert(`Error evaluating lead: ${e.message}`);
    } finally {
      setIsScoring(false);
    }
  };

  // Add message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;
    addMessage(leadId, newMessageText.trim(), selectedChannel, 'agent');
    setNewMessageText('');
  };

  // Handle Book Appointment
  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookDate || !bookTime) {
      alert('Please select date and time.');
      return;
    }
    const isoDateTime = `${bookDate}T${bookTime}:00+05:30`;
    const res = createAppointment({
      lead_id: leadId,
      type: bookType,
      property_id: bookPropertyId || null,
      scheduled_at: isoDateTime,
      notes: bookNotes
    });

    if (res.conflict) {
      setConflictWarning(true);
    } else {
      setIsBookModalOpen(false);
      setConflictWarning(false);
    }
  };

  // Delete lead (DPDP)
  const handleDeleteLead = () => {
    if (confirm(`Permanently purge records for ${lead.full_name}? This action aligns with DPDP erasure regulations and cannot be reversed.`)) {
      deleteLead(leadId);
      onBack();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#3E362A] bg-[#1C1A16] px-3 py-1.5 text-xs font-medium text-[#C2A675] hover:bg-[#25221C] hover:border-[#C2A675] hover:text-[#F4EFE6] transition-all shadow-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Client Registry</span>
          </button>
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-1 text-xs text-[#8C8477] hover:text-[#EAE5D9] px-2.5 py-1.5 rounded transition-colors"
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
            className="flex items-center gap-1.5 rounded-lg bg-[#1B261F] border border-[#2B3E30] px-3.5 py-1.5 text-xs font-medium text-[#9DBFA5] hover:bg-[#25362B] transition-all"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Open WhatsApp</span>
          </a>

          {/* Call Phone */}
          <a
            href={`tel:${lead.phone}`}
            className="flex items-center gap-1.5 rounded-lg border border-[#352F26] bg-[#1A1814] px-3 py-1.5 text-xs font-medium text-[#D5CEBF] hover:bg-[#221F1A]"
          >
            <Phone className="h-3.5 w-3.5 text-[#C8A389]" />
            <span>Telephone</span>
          </a>

          {/* Delete Lead (Admin Only DPDP) */}
          {currentRole === 'admin' && (
            <button
              onClick={handleDeleteLead}
              className="flex items-center gap-1.5 rounded-lg border border-[#482D27] bg-[#2A1D1A] px-3 py-1.5 text-xs font-medium text-[#BFA0A0] hover:bg-[#34221E]"
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
          <div className="rounded-xl border border-[#2E2820] bg-[#161411] p-6 shadow-xs space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#F4EFE6]">{lead.full_name}</h2>
                <div className="text-xs text-[#C2A675] font-mono mt-0.5">{lead.phone}</div>
                {lead.email && <div className="text-xs text-[#8C8477] mt-0.5">{lead.email}</div>}
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
            <div className="grid grid-cols-2 gap-3 text-xs border-y border-[#26221B] py-3.5">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#736B5F]">Intent</span>
                <p className="font-serif font-bold text-[#F4EFE6] text-sm mt-0.5 uppercase">{lead.intent || 'PURCHASE'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#736B5F]">Asset Class</span>
                <p className="font-medium text-[#D5CEBF] mt-0.5">{lead.property_type || 'Apartment'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#736B5F]">Estimated Budget</span>
                <p className="font-serif font-bold text-[#C2A675] text-sm mt-0.5">
                  {lead.budget_max ? formatIndianCurrency(lead.budget_max) : 'Not specified'}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#736B5F]">Possession Window</span>
                <p className="font-medium text-[#D5CEBF] mt-0.5">{lead.timeline || '1-2 months'}</p>
              </div>
            </div>

            {/* Location & Status */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-[#D5CEBF]">
                <MapPin className="h-4 w-4 text-[#C2A675] shrink-0" />
                <span>{lead.preferred_location || 'Kanpur, UP'}</span>
              </div>
              {lead.ig_handle && (
                <div className="flex items-center gap-2 text-[#C2A675] font-mono text-[11px]">
                  <span className="text-[10px] bg-[#2A2318] border border-[#443825] rounded px-1 py-0.5">IG</span>
                  <span>@{lead.ig_handle}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-[#8C8477] text-[11px] font-mono">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>Last Interaction: {formatIST(lead.last_contact_at)}</span>
              </div>
            </div>

            {/* DPDP Consent Box */}
            <div className="rounded-lg p-3 text-[11px] badge-forest">
              <div className="flex items-center gap-1.5 font-medium text-[#9DBFA5]">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>DPDP Consent Stored</span>
              </div>
              <p className="mt-0.5 text-[10px] text-[#8C8477]">
                Consent recorded: {lead.consent_at ? formatIST(lead.consent_at) : 'Active Verification'}
              </p>
            </div>
          </div>

          {/* AI Executive Summary & Auto-scoring */}
          <div className="rounded-xl border border-[#3E3528] bg-[#181613] p-6 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#C2A675]" />
                <h3 className="font-serif font-bold text-sm text-[#F4EFE6]">Estate Intelligence Synthesis</h3>
              </div>
              <button
                onClick={handleScoreLead}
                disabled={isScoring}
                className="flex items-center gap-1.5 rounded-lg bg-[#C2A675] hover:bg-[#B39562] px-3 py-1.5 text-xs font-medium text-[#11100E] disabled:opacity-40 transition-colors"
              >
                {isScoring ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Flame className="h-3.5 w-3.5" />}
                <span>Evaluate</span>
              </button>
            </div>

            <div className="rounded-lg bg-[#14120F] p-4 border border-[#2E2820] text-xs text-[#D5CEBF] leading-relaxed">
              <div className="font-mono text-[10px] uppercase tracking-wider text-[#C2A675] mb-1">
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
          <div className="rounded-xl border border-[#2E2820] bg-[#161411] p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#2C2720] pb-4">
              <div>
                <h3 className="font-serif font-bold text-base text-[#F4EFE6] flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#C2A675]" />
                  <span>Draft Client Correspondence (Gemini)</span>
                </h3>
                <p className="text-xs text-[#8C8477] mt-0.5">Composes polite, bespoke correspondence in Hinglish, Hindi, or English.</p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={draftLanguage}
                  onChange={(e) => setDraftLanguage(e.target.value as any)}
                  className="rounded-lg border border-[#332D24] bg-[#11100E] px-2.5 py-1.5 text-xs font-medium text-[#D5CEBF]"
                >
                  <option value="Hinglish">Hinglish</option>
                  <option value="Hindi">Hindi (हिंदी)</option>
                  <option value="English">English</option>
                </select>

                <button
                  onClick={handleGenerateDraft}
                  disabled={isDrafting}
                  className="flex items-center gap-1.5 rounded-lg bg-[#C2A675] hover:bg-[#B39562] px-3.5 py-1.5 text-xs font-medium text-[#11100E] disabled:opacity-40 transition-all"
                >
                  {isDrafting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  <span>Generate Draft</span>
                </button>
              </div>
            </div>

            {aiDraft ? (
              <div className="rounded-lg border border-[#3E3528] bg-[#1B1814] p-4 space-y-3">
                <p className="text-xs text-[#EAE5D9] leading-relaxed whitespace-pre-wrap font-sans">
                  {aiDraft}
                </p>
                <div className="flex items-center justify-between border-t border-[#2C2720] pt-2.5 text-xs">
                  <span className="text-[11px] text-[#8C8477]">
                    Review draft before dispatching to client
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center gap-1 rounded-lg border border-[#383126] bg-[#221F1A] px-3 py-1.5 text-[11px] font-medium text-[#D5CEBF] hover:bg-[#2C2720]"
                    >
                      {copiedDraft ? <Check className="h-3.5 w-3.5 text-[#9DBFA5]" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedDraft ? 'Copied' : 'Copy'}</span>
                    </button>
                    <a
                      href={buildWhatsAppLink(lead.phone, aiDraft)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg bg-[#1B261F] border border-[#2B3E30] px-3.5 py-1.5 text-[11px] font-medium text-[#9DBFA5] hover:bg-[#25362B]"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>Send via WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[#332D24] p-6 text-center text-[#736B5F] text-xs">
                Select <strong>"Generate Draft"</strong> to formulate tailored correspondence in {draftLanguage}.
              </div>
            )}
          </div>

          {/* Full Multi-channel Message History */}
          <div className="rounded-xl border border-[#2E2820] bg-[#161411] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#2C2720] pb-3">
              <h3 className="font-serif font-bold text-base text-[#F4EFE6]">Communication Archive</h3>
              <span className="text-xs text-[#8C8477] font-mono">{leadMessages.length} total entries</span>
            </div>

            {/* Chat Thread */}
            <div className="max-h-64 overflow-y-auto space-y-3 p-1">
              {leadMessages.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#736B5F]">
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
                          ? 'bg-[#25211B] text-[#F4EFE6] border border-[#3E362A]'
                          : 'bg-[#1C1A16] text-[#D5CEBF] border border-[#2E2820]'
                      }`}
                    >
                      <div>{msg.content}</div>
                      <div className="mt-1 flex items-center justify-end gap-1.5 text-[10px] text-[#8C8477] font-mono">
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
            <form onSubmit={handleSendMessage} className="border-t border-[#2C2720] pt-3 space-y-2">
              <div className="flex items-center gap-2">
                <select
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value as any)}
                  className="rounded-lg border border-[#332D24] bg-[#11100E] px-2.5 py-2 text-xs font-medium text-[#D5CEBF]"
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
                  className="flex-1 rounded-lg border border-[#332D24] bg-[#11100E] px-3.5 py-2 text-xs text-[#EAE5D9] placeholder-[#736B5F] focus:border-[#C2A675] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!newMessageText.trim()}
                  className="rounded-lg bg-[#C2A675] hover:bg-[#B39562] px-4 py-2 text-xs font-medium text-[#11100E] disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </div>

          {/* Appointments Box */}
          <div className="rounded-xl border border-[#2E2820] bg-[#161411] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#2C2720] pb-3">
              <div>
                <h3 className="font-serif font-bold text-base text-[#F4EFE6]">Estate Engagements & Consultations</h3>
                <p className="text-xs text-[#8C8477]">Scheduled on-site walkthroughs</p>
              </div>
              <button
                onClick={() => setIsBookModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-[#C2A675] hover:bg-[#B39562] px-3.5 py-2 text-xs font-medium text-[#11100E] transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Schedule Engagement</span>
              </button>
            </div>

            {leadAppointments.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#736B5F]">
                No engagements scheduled for this client folio.
              </div>
            ) : (
              <div className="space-y-2.5">
                {leadAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between rounded-lg border border-[#2E2820] bg-[#1A1814] p-3.5 text-xs"
                  >
                    <div>
                      <div className="font-serif font-bold text-[#F4EFE6]">
                        {apt.type === 'site_visit' ? 'Site Walkthrough' : 'Telephone Consultation'}
                      </div>
                      <div className="text-[#8C8477] text-[11px] mt-0.5 font-mono">
                        {formatIST(apt.scheduled_at)} {apt.property?.project_name ? `• ${apt.property.project_name}` : ''}
                      </div>
                      {apt.notes && <div className="text-[11px] text-[#A8A194] italic mt-0.5">{apt.notes}</div>}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded px-2 py-0.5 text-[10px] font-mono font-medium uppercase badge-forest">
                        {apt.status}
                      </span>
                      {apt.status === 'booked' && (
                        <button
                          onClick={() => cancelAppointment(apt.id, 'Cancelled by team')}
                          className="rounded border border-[#482D27] bg-[#2A1D1A] px-2 py-0.5 text-[10px] font-medium text-[#BFA0A0] hover:bg-[#34221E]"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0A09]/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-[#181613] p-6 shadow-2xl border border-[#383126] text-[#EAE5D9] text-xs space-y-4">
            <h3 className="font-serif font-bold text-base text-[#F4EFE6]">Schedule Engagement for {lead.full_name}</h3>

            {conflictWarning && (
              <div className="rounded-lg p-3 text-[11px] flex items-start gap-2 badge-oxblood">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-[#BFA0A0]" />
                <div>
                  <strong>Potential Collision Detected:</strong> Another client engagement is scheduled within 40 minutes of this slot.
                </div>
              </div>
            )}

            <form onSubmit={handleBookAppointment} className="space-y-3">
              <div>
                <label className="font-medium text-[#C8C2B5]">Format</label>
                <select
                  value={bookType}
                  onChange={(e) => setBookType(e.target.value as any)}
                  className="mt-1 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9]"
                >
                  <option value="site_visit">On-site Estate Walkthrough</option>
                  <option value="call">Consultative Telephone Briefing</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-[#C8C2B5]">Estate</label>
                <select
                  value={bookPropertyId}
                  onChange={(e) => setBookPropertyId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9]"
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
                  <label className="font-medium text-[#C8C2B5]">Date</label>
                  <input
                    type="date"
                    required
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9]"
                  />
                </div>
                <div>
                  <label className="font-medium text-[#C8C2B5]">Time</label>
                  <input
                    type="time"
                    required
                    value={bookTime}
                    onChange={(e) => setBookTime(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9]"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-[#C8C2B5]">Private Briefing Notes</label>
                <textarea
                  rows={2}
                  value={bookNotes}
                  onChange={(e) => setBookNotes(e.target.value)}
                  placeholder="e.g. Client requested inspection of penthouse sample..."
                  className="mt-1 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9] placeholder-[#736B5F]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#2C2720]">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="rounded-lg border border-[#352F26] px-4 py-2 font-medium text-[#8C8477] hover:text-[#EAE5D9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#C2A675] hover:bg-[#B39562] px-5 py-2 font-medium text-[#11100E]"
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
