import React, { useState, useMemo } from 'react';
import { useCrm } from '../context/CrmContext';
import { Lead, LeadScore, LeadStatus, LeadSource } from '../types/crm';
import {
  Search,
  Filter,
  Download,
  Upload,
  UserPlus,
  Flame,
  Phone,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  X,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { exportLeadsToExcel, validateAndDeduplicateLeads, ImportValidationReport } from '../lib/excel';
import { formatIndianCurrency, formatIST, buildWhatsAppLink, normalizeIndianPhone } from '../lib/utils';
import * as XLSX from 'xlsx';

interface LeadsPageProps {
  onSelectLead: (leadId: string) => void;
  initialFilter?: any;
  onBack?: () => void;
}

export const LeadsPage: React.FC<LeadsPageProps> = ({ onSelectLead, initialFilter, onBack }) => {
  const { leads, appointments, currentRole, teamMembers, addLead, quickUpdateStatus, quickUpdateScore } = useCrm();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter?.status || 'all');
  const [scoreFilter, setScoreFilter] = useState<string>(initialFilter?.score || 'all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // New Lead Form State
  const [newLeadForm, setNewLeadForm] = useState<Partial<Lead>>({
    full_name: '',
    phone: '',
    email: '',
    ig_handle: '',
    intent: 'buy',
    property_type: 'Apartment',
    preferred_location: 'Civil Lines, Kanpur',
    budget_min: 5000000,
    budget_max: 15000000,
    timeline: '1-2 months',
    lead_score: 'warm',
    status: 'new',
    source: 'manual',
    notes: '',
    consent_given: true
  });

  // Excel Import Wizard State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRawRows, setParsedRawRows] = useState<Record<string, any>[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({
    full_name: '',
    phone: '',
    email: '',
    ig_handle: '',
    preferred_location: '',
    budget: '',
    intent: '',
    notes: ''
  });
  const [validationReport, setValidationReport] = useState<ImportValidationReport | null>(null);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        !searchTerm ||
        lead.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm) ||
        (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.ig_handle && lead.ig_handle.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.preferred_location && lead.preferred_location.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesScore = scoreFilter === 'all' || lead.lead_score === scoreFilter;
      const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;
      const matchesAgent = agentFilter === 'all' || lead.assigned_to === agentFilter;

      return matchesSearch && matchesStatus && matchesScore && matchesSource && matchesAgent;
    });
  }, [leads, searchTerm, statusFilter, scoreFilter, sourceFilter, agentFilter]);

  // Handle Export to Excel
  const handleExport = () => {
    exportLeadsToExcel(filteredLeads, appointments);
  };

  // Handle File Upload for Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (rawJson.length < 2) {
          alert('Spreadsheet is empty or lacks data rows.');
          return;
        }

        const headers = (rawJson[0] as string[]).map((h) => String(h || '').trim());
        setParsedHeaders(headers);

        const rowObjects: Record<string, any>[] = [];
        for (let i = 1; i < rawJson.length; i++) {
          const rowData = rawJson[i];
          if (!rowData || rowData.length === 0) continue;
          const obj: Record<string, any> = {};
          headers.forEach((h, idx) => {
            obj[h] = rowData[idx];
          });
          rowObjects.push(obj);
        }
        setParsedRawRows(rowObjects);

        const autoMap: Record<string, string> = {
          full_name: '',
          phone: '',
          email: '',
          ig_handle: '',
          preferred_location: '',
          budget: '',
          intent: '',
          notes: ''
        };

        headers.forEach((h) => {
          const low = h.toLowerCase();
          if (low.includes('name') && !autoMap.full_name) autoMap.full_name = h;
          else if ((low.includes('phone') || low.includes('mobile') || low.includes('contact')) && !autoMap.phone) autoMap.phone = h;
          else if (low.includes('mail') && !autoMap.email) autoMap.email = h;
          else if ((low.includes('instagram') || low.includes('handle') || low.includes('ig')) && !autoMap.ig_handle) autoMap.ig_handle = h;
          else if ((low.includes('location') || low.includes('area') || low.includes('city')) && !autoMap.preferred_location) autoMap.preferred_location = h;
          else if ((low.includes('budget') || low.includes('price')) && !autoMap.budget) autoMap.budget = h;
          else if (low.includes('intent') && !autoMap.intent) autoMap.intent = h;
          else if (low.includes('note') && !autoMap.notes) autoMap.notes = h;
        });

        setColumnMap(autoMap);
      } catch (err: any) {
        alert('Failed to parse Excel file: ' + err.message);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleValidateImport = () => {
    if (!columnMap.full_name || !columnMap.phone) {
      alert('Please map at least Full Name and Phone columns.');
      return;
    }

    const report = validateAndDeduplicateLeads(parsedRawRows, columnMap, leads);
    setValidationReport(report);
  };

  const handleConfirmImport = () => {
    if (!validationReport) return;

    validationReport.validToAdd.forEach((lead) => {
      addLead(lead);
    });

    alert(`Successfully imported ${validationReport.validToAdd.length} new leads into CRM registry!`);
    setIsImportModalOpen(false);
    setImportFile(null);
    setParsedHeaders([]);
    setParsedRawRows([]);
    setValidationReport(null);
  };

  const handleAddLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.full_name || !newLeadForm.phone) {
      alert('Full Name and Phone are required.');
      return;
    }

    const cleanPhone = normalizeIndianPhone(newLeadForm.phone);
    const isDup = leads.some((l) => normalizeIndianPhone(l.phone) === cleanPhone);

    if (isDup) {
      if (!confirm(`Warning: A lead with phone ${cleanPhone} already exists. Add anyway?`)) {
        return;
      }
    }

    addLead(newLeadForm);
    setIsAddModalOpen(false);
    setNewLeadForm({
      full_name: '',
      phone: '',
      email: '',
      ig_handle: '',
      intent: 'buy',
      property_type: 'Apartment',
      preferred_location: 'Civil Lines, Kanpur',
      budget_min: 5000000,
      budget_max: 15000000,
      timeline: '1-2 months',
      lead_score: 'warm',
      status: 'new',
      source: 'manual',
      notes: '',
      consent_given: true
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-normal text-[#F4EFE6]">
              Client Registry & Inquiries
            </h2>
            <span className="rounded px-2.5 py-0.5 text-[10px] font-mono tracking-widest uppercase badge-gold font-sans">
              {currentRole === 'agent' ? 'Assigned Folios' : 'Master Registry'}
            </span>
          </div>
          <p className="text-xs text-[#8C8477] mt-1">
            Displaying {filteredLeads.length} of {leads.length} recorded inquiries • Fiduciary RLS active
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Export to Excel */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-lg border border-[#352F26] bg-[#1A1814] px-3.5 py-2 text-xs font-medium text-[#D5CEBF] hover:bg-[#221F1A] hover:border-[#4B4337] transition-all"
          >
            <Download className="h-4 w-4 text-[#9DBFA5]" />
            <span>Export Registry (.xlsx)</span>
          </button>

          {/* Import from Excel */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-[#352F26] bg-[#1A1814] px-3.5 py-2 text-xs font-medium text-[#D5CEBF] hover:bg-[#221F1A] hover:border-[#4B4337] transition-all"
          >
            <Upload className="h-4 w-4 text-[#C2A675]" />
            <span>Import Spreadsheets</span>
          </button>

          {/* Add Lead */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[#C2A675] hover:bg-[#B39562] px-4 py-2 text-xs font-medium text-[#11100E] border border-[#A68A56] transition-all shadow-xs"
          >
            <UserPlus className="h-4 w-4" />
            <span>Register Client</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-xl border border-[#2E2820] bg-[#161411] p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#736B5F]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search registry by client name, telephone, @handle, or Kanpur district..."
              className="w-full rounded-lg border border-[#332D24] bg-[#11100E] pl-9 pr-4 py-2 text-xs text-[#EAE5D9] placeholder-[#736B5F] focus:border-[#C2A675] focus:outline-none"
            />
          </div>

          {/* Filter Selects */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-[#332D24] bg-[#11100E] px-3 py-2 text-xs text-[#D5CEBF] focus:border-[#C2A675] focus:outline-none"
            >
              <option value="all">All Pipeline Stages</option>
              <option value="new">New Inquiries</option>
              <option value="contacted">Initial Contact</option>
              <option value="site_visit_booked">Site Visit Booked</option>
              <option value="negotiation">Terms Negotiation</option>
              <option value="won">Deed Completed (Won)</option>
              <option value="lost">Archived (Lost)</option>
            </select>

            {/* Score Filter */}
            <select
              value={scoreFilter}
              onChange={(e) => setScoreFilter(e.target.value)}
              className="rounded-lg border border-[#332D24] bg-[#11100E] px-3 py-2 text-xs text-[#D5CEBF] focus:border-[#C2A675] focus:outline-none"
            >
              <option value="all">All Intent Tiers</option>
              <option value="hot">High Intent (Hot)</option>
              <option value="warm">Moderate (Warm)</option>
              <option value="cold">Inquiry Stage (Cold)</option>
            </select>

            {/* Source Filter */}
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="rounded-lg border border-[#332D24] bg-[#11100E] px-3 py-2 text-xs text-[#D5CEBF] focus:border-[#C2A675] focus:outline-none"
            >
              <option value="all">All Channels</option>
              <option value="instagram">Instagram Direct</option>
              <option value="manual">Office Desk</option>
              <option value="form">Private Portal</option>
              <option value="import">Historical Import</option>
            </select>

            {/* Agent Filter (Admin only) */}
            {currentRole === 'admin' && (
              <select
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                className="rounded-lg border border-[#332D24] bg-[#11100E] px-3 py-2 text-xs text-[#D5CEBF] focus:border-[#C2A675] focus:outline-none"
              >
                <option value="all">All Associates</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name}
                  </option>
                ))}
              </select>
            )}

            {(searchTerm || statusFilter !== 'all' || scoreFilter !== 'all' || sourceFilter !== 'all' || agentFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setScoreFilter('all');
                  setSourceFilter('all');
                  setAgentFilter('all');
                }}
                className="rounded-lg border border-[#332D24] p-2 text-xs text-[#8C8477] hover:bg-[#201D18]"
                title="Reset Filters"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="overflow-hidden rounded-xl border border-[#2E2820] bg-[#161411] shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#2C2720] bg-[#1C1A16] text-[10px] font-sans font-medium uppercase tracking-widest text-[#8C8477]">
              <tr>
                <th className="py-3.5 pl-5 pr-3">Client Folio</th>
                <th className="px-3 py-3.5">Intent & Locality</th>
                <th className="px-3 py-3.5">Estimated Budget</th>
                <th className="px-3 py-3.5">Intent Rating</th>
                <th className="px-3 py-3.5">Pipeline Stage</th>
                <th className="px-3 py-3.5">Managing Associate</th>
                <th className="py-3.5 pl-3 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#24201A]">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[#736B5F] space-y-2">
                    <AlertCircle className="mx-auto h-7 w-7 text-[#554E44] mb-1" />
                    <p className="font-serif font-bold text-[#D5CEBF] text-sm">No client records match active parameters.</p>
                    <p className="text-xs text-[#736B5F]">
                      Register a prospective Kanpur buyer or import contact ledgers.
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="rounded-lg bg-[#C2A675] hover:bg-[#B39562] px-4 py-1.5 text-xs font-medium text-[#11100E]"
                      >
                        + Register First Client
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  return (
                    <tr
                      key={lead.id}
                      className="group hover:bg-[#1C1A16] transition-colors"
                    >
                      {/* Lead & Contact */}
                      <td className="py-4 pl-5 pr-3">
                        <div
                          onClick={() => onSelectLead(lead.id)}
                          className="font-serif font-bold text-sm text-[#F4EFE6] hover:text-[#C2A675] cursor-pointer flex items-center gap-1.5"
                        >
                          <span>{lead.full_name}</span>
                          <ChevronRight className="h-3 w-3 text-[#736B5F] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-[#8C8477] font-mono text-[11px]">
                          <span>{lead.phone}</span>
                          {lead.ig_handle && (
                            <span className="text-[#C2A675] font-sans">@{lead.ig_handle}</span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#736B5F] mt-0.5">
                          Source: <span className="capitalize">{lead.source}</span> • {formatIST(lead.created_at)}
                        </div>
                      </td>

                      {/* Intent & Location */}
                      <td className="px-3 py-4">
                        <div className="font-medium text-[#D5CEBF]">
                          {lead.property_type || 'Apartment'} • <span className="uppercase text-[10px] font-mono font-bold text-[#C2A675]">{lead.intent || 'BUY'}</span>
                        </div>
                        <div className="text-[#8C8477] text-[11px]">{lead.preferred_location || 'Kanpur'}</div>
                      </td>

                      {/* Budget & Timeline */}
                      <td className="px-3 py-4">
                        <div className="font-serif font-bold text-[#C2A675]">
                          {lead.budget_max ? formatIndianCurrency(lead.budget_max) : 'Not specified'}
                        </div>
                        <div className="text-[#8C8477] text-[11px]">{lead.timeline || '1-2 months'}</div>
                      </td>

                      {/* Quick Edit Score */}
                      <td className="px-3 py-4">
                        <select
                          value={lead.lead_score}
                          onChange={(e) => quickUpdateScore(lead.id, e.target.value as LeadScore)}
                          className={`rounded px-2 py-1 text-xs font-mono font-medium uppercase border-0 focus:ring-1 focus:ring-[#C2A675] cursor-pointer ${
                            lead.lead_score === 'hot'
                              ? 'badge-oxblood'
                              : lead.lead_score === 'warm'
                              ? 'badge-cognac'
                              : 'badge-stone'
                          }`}
                        >
                          <option value="hot">Hot</option>
                          <option value="warm">Warm</option>
                          <option value="cold">Cold</option>
                        </select>
                      </td>

                      {/* Quick Edit Status */}
                      <td className="px-3 py-4">
                        <select
                          value={lead.status}
                          onChange={(e) => quickUpdateStatus(lead.id, e.target.value as LeadStatus)}
                          className="rounded-lg border border-[#332D24] bg-[#11100E] px-2 py-1 text-xs font-medium text-[#D5CEBF] focus:border-[#C2A675] focus:outline-none cursor-pointer"
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="site_visit_booked">Visit Booked</option>
                          <option value="negotiation">Negotiation</option>
                          <option value="won">Won (Deed Registered)</option>
                          <option value="lost">Archived</option>
                        </select>
                      </td>

                      {/* Assigned Agent */}
                      <td className="px-3 py-4">
                        <span className="text-[#A8A194] font-medium">
                          {lead.assigned_profile?.full_name || 'Unassigned'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 pl-3 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* WhatsApp Button */}
                          <a
                            href={buildWhatsAppLink(lead.phone, `Namaste ${lead.full_name} ji! Kanpur Prime Realty se contact kar rahe hain.`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg bg-[#1B261F] border border-[#2B3E30] p-1.5 text-[#9DBFA5] hover:bg-[#25362B] transition-colors"
                            title="Dispatch WhatsApp Message"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a>

                          {/* Direct Phone Call */}
                          <a
                            href={`tel:${lead.phone}`}
                            className="rounded-lg bg-[#1E1B17] border border-[#332D24] p-1.5 text-[#C8A389] hover:bg-[#2A251F] transition-colors"
                            title="Direct Call"
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </a>

                          {/* Detail View Button */}
                          <button
                            onClick={() => onSelectLead(lead.id)}
                            className="rounded-lg border border-[#383126] bg-[#221F1A] px-2.5 py-1 text-[11px] font-medium text-[#D5CEBF] hover:bg-[#2C2720] hover:text-[#F4EFE6] transition-all"
                          >
                            Dossier
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD LEAD MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0A09]/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl bg-[#181613] p-6 shadow-2xl border border-[#383126] text-[#EAE5D9] overflow-y-auto max-h-[90vh] space-y-4">
            <div className="flex items-center justify-between border-b border-[#2C2720] pb-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex items-center gap-1 text-xs text-[#C2A675] hover:text-[#F4EFE6] px-2 py-1 rounded bg-[#221F1A] border border-[#3E362A] transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back</span>
                </button>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#F4EFE6]">Register Client Dossier</h3>
                  <p className="text-[11px] text-[#8C8477]">Internal records stored under DPDP compliance</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1 text-[#8C8477] hover:bg-[#221F1A] hover:text-[#EAE5D9]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddLeadSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-[#C8C2B5]">Client Name *</label>
                  <input
                    type="text"
                    required
                    value={newLeadForm.full_name || ''}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, full_name: e.target.value })}
                    placeholder="e.g. Ramesh Srivastava"
                    className="mt-1 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9] placeholder-[#736B5F] focus:border-[#C2A675] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-medium text-[#C8C2B5]">Telephone (+91) *</label>
                  <input
                    type="text"
                    required
                    value={newLeadForm.phone || ''}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                    placeholder="e.g. 9839012345"
                    className="mt-1 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9] placeholder-[#736B5F] focus:border-[#C2A675] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-[#C8C2B5]">Electronic Mail</label>
                  <input
                    type="email"
                    value={newLeadForm.email || ''}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                    placeholder="client@domain.com"
                    className="mt-1 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9] placeholder-[#736B5F] focus:border-[#C2A675] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-medium text-[#C8C2B5]">Instagram Handle</label>
                  <input
                    type="text"
                    value={newLeadForm.ig_handle || ''}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, ig_handle: e.target.value.replace(/^@/, '') })}
                    placeholder="handle"
                    className="mt-1 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9] placeholder-[#736B5F] focus:border-[#C2A675] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-medium text-[#C8C2B5]">Acquisition Intent</label>
                  <select
                    value={newLeadForm.intent || 'buy'}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, intent: e.target.value as any })}
                    className="mt-1 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9] focus:border-[#C2A675] focus:outline-none"
                  >
                    <option value="buy">Purchase</option>
                    <option value="rent">Lease</option>
                    <option value="invest">Capital Investment</option>
                  </select>
                </div>
                <div>
                  <label className="font-medium text-[#C8C2B5]">Asset Class</label>
                  <select
                    value={newLeadForm.property_type || 'Apartment'}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, property_type: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9] focus:border-[#C2A675] focus:outline-none"
                  >
                    <option value="Apartment">Apartment Suite</option>
                    <option value="Plot">Residential Plot</option>
                    <option value="Commercial">Commercial / Retail</option>
                    <option value="Villa">Independent Villa</option>
                  </select>
                </div>
                <div>
                  <label className="font-medium text-[#C8C2B5]">Timeline</label>
                  <select
                    value={newLeadForm.timeline || '1-2 months'}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, timeline: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9] focus:border-[#C2A675] focus:outline-none"
                  >
                    <option value="Immediate">Immediate Possession</option>
                    <option value="1-2 months">1-2 months</option>
                    <option value="3-6 months">3-6 months</option>
                    <option value="Browsing">Preliminary Inquiry</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-[#C8C2B5]">Preferred Kanpur Locality</label>
                  <select
                    value={newLeadForm.preferred_location || 'Civil Lines, Kanpur'}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, preferred_location: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9] focus:border-[#C2A675] focus:outline-none"
                  >
                    <option value="Civil Lines, Kanpur">Civil Lines</option>
                    <option value="Swaroop Nagar, Kanpur">Swaroop Nagar</option>
                    <option value="Kakadeo, Kanpur">Kakadeo</option>
                    <option value="Tilak Nagar, Kanpur">Tilak Nagar</option>
                    <option value="Shyam Nagar, Kanpur">Shyam Nagar</option>
                    <option value="Kalyanpur, Kanpur">Kalyanpur (GT Road)</option>
                    <option value="Kidwai Nagar, Kanpur">Kidwai Nagar</option>
                    <option value="Mall Road / Cantt, Kanpur">Mall Road / Cantt</option>
                  </select>
                </div>
                <div>
                  <label className="font-medium text-[#C8C2B5]">Maximum Budget (₹)</label>
                  <input
                    type="number"
                    value={newLeadForm.budget_max || ''}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, budget_max: Number(e.target.value) })}
                    placeholder="e.g. 15000000 (1.5 Cr)"
                    className="mt-1 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9] placeholder-[#736B5F] focus:border-[#C2A675] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-[#C8C2B5]">Private Requirements / Notes</label>
                <textarea
                  rows={2}
                  value={newLeadForm.notes || ''}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, notes: e.target.value })}
                  placeholder="e.g. Inquired about corner riverside unit in Civil Lines..."
                  className="mt-1 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9] placeholder-[#736B5F] focus:border-[#C2A675] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-[#14120F] p-3 border border-[#2E2820]">
                <input
                  type="checkbox"
                  id="consent_check"
                  checked={newLeadForm.consent_given}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, consent_given: e.target.checked })}
                  className="h-4 w-4 rounded text-[#C2A675] focus:ring-[#C2A675]"
                />
                <label htmlFor="consent_check" className="text-[11px] text-[#A8A194]">
                  Client provided explicit consent to be contacted via Phone/WhatsApp under DPDP Act requirements.
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-[#2C2720] pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg border border-[#352F26] px-4 py-2 font-medium text-[#8C8477] hover:text-[#EAE5D9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#C2A675] hover:bg-[#B39562] px-5 py-2 font-medium text-[#11100E] transition-all"
                >
                  Save Dossier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT EXCEL / CSV MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0A09]/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-xl bg-[#181613] p-6 shadow-2xl border border-[#383126] text-[#EAE5D9] max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-[#2C2720] pb-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setValidationReport(null);
                  }}
                  className="flex items-center gap-1 text-xs text-[#C2A675] hover:text-[#F4EFE6] px-2 py-1 rounded bg-[#221F1A] border border-[#3E362A] transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back</span>
                </button>
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-[#9DBFA5]" />
                  <h3 className="font-serif font-bold text-lg text-[#F4EFE6]">Import Contact Ledger (.xlsx / .csv)</h3>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setValidationReport(null);
                }}
                className="rounded-lg p-1 text-[#8C8477] hover:bg-[#221F1A] hover:text-[#EAE5D9]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {!parsedHeaders.length ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#3E372C] p-8 text-center hover:bg-[#1E1C18] transition-colors">
                  <Upload className="h-9 w-9 text-[#736B5F] mb-2" />
                  <p className="font-serif font-bold text-[#EAE5D9] text-sm">Select an .xlsx or .csv contact ledger</p>
                  <p className="text-[#8C8477] text-[11px] mt-1">
                    Columns like Name, Phone (+91), Locality, and Budget are parsed automatically.
                  </p>
                  <label className="mt-4 cursor-pointer rounded-lg bg-[#C2A675] hover:bg-[#B39562] px-5 py-2 text-xs font-medium text-[#11100E] transition-all">
                    Browse File
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : !validationReport ? (
                <div className="space-y-4">
                  <div className="rounded-lg bg-[#201D18] p-3.5 border border-[#3B342A] text-[#D5CEBF] text-[11px]">
                    Identified <strong>{parsedRawRows.length}</strong> rows in {importFile?.name}. Confirm column mappings below.
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-medium text-[#C8C2B5]">Client Name Column *</label>
                      <select
                        value={columnMap.full_name}
                        onChange={(e) => setColumnMap({ ...columnMap, full_name: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2 text-[#EAE5D9]"
                      >
                        <option value="">-- Select Header --</option>
                        {parsedHeaders.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-medium text-[#C8C2B5]">Phone Column (+91) *</label>
                      <select
                        value={columnMap.phone}
                        onChange={(e) => setColumnMap({ ...columnMap, phone: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2 text-[#EAE5D9]"
                      >
                        <option value="">-- Select Header --</option>
                        {parsedHeaders.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-medium text-[#C8C2B5]">Email Column</label>
                      <select
                        value={columnMap.email}
                        onChange={(e) => setColumnMap({ ...columnMap, email: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2 text-[#EAE5D9]"
                      >
                        <option value="">-- None / Select Header --</option>
                        {parsedHeaders.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-medium text-[#C8C2B5]">Locality Column</label>
                      <select
                        value={columnMap.preferred_location}
                        onChange={(e) => setColumnMap({ ...columnMap, preferred_location: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2 text-[#EAE5D9]"
                      >
                        <option value="">-- None / Select Header --</option>
                        {parsedHeaders.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setParsedHeaders([])}
                      className="rounded-lg border border-[#352F26] px-3 py-2 font-medium text-[#8C8477]"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleValidateImport}
                      className="rounded-lg bg-[#C2A675] hover:bg-[#B39562] px-5 py-2 font-medium text-[#11100E]"
                    >
                      Audit & Check Duplicates
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-lg p-3 badge-forest">
                      <div className="text-2xl font-serif font-bold text-[#9DBFA5]">{validationReport.validToAdd.length}</div>
                      <div className="text-[11px] font-medium text-[#9DBFA5]">New Dossiers to Add</div>
                    </div>
                    <div className="rounded-lg p-3 badge-gold">
                      <div className="text-2xl font-serif font-bold text-[#D5BE8F]">{validationReport.skippedDuplicates.length}</div>
                      <div className="text-[11px] font-medium text-[#D5BE8F]">Skipped Duplicates</div>
                    </div>
                    <div className="rounded-lg p-3 badge-oxblood">
                      <div className="text-2xl font-serif font-bold text-[#BFA0A0]">{validationReport.failedRows.length}</div>
                      <div className="text-[11px] font-medium text-[#BFA0A0]">Malformed Rows</div>
                    </div>
                  </div>

                  {validationReport.skippedDuplicates.length > 0 && (
                    <div className="rounded-lg border border-[#3B342A] bg-[#1E1C18] p-3">
                      <div className="font-serif font-bold text-[#D5BE8F] mb-1">Deduplication Safeguard:</div>
                      <div className="max-h-24 overflow-y-auto space-y-1 text-[11px] text-[#A8A194] font-mono">
                        {validationReport.skippedDuplicates.map((s, idx) => (
                          <div key={idx}>
                            Row {s.row}: {s.name} ({s.phone}) - {s.reason}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2 border-t border-[#2C2720]">
                    <button
                      type="button"
                      onClick={() => setValidationReport(null)}
                      className="rounded-lg border border-[#352F26] px-4 py-2 font-medium text-[#8C8477]"
                    >
                      Re-map Columns
                    </button>
                    <button
                      type="button"
                      disabled={validationReport.validToAdd.length === 0}
                      onClick={handleConfirmImport}
                      className="rounded-lg bg-[#C2A675] hover:bg-[#B39562] px-5 py-2 font-medium text-[#11100E] disabled:opacity-40"
                    >
                      Confirm & Import ({validationReport.validToAdd.length}) Records
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
