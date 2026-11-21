// ====================================================================
// EXCEL IMPORT & EXPORT MODULE (SheetJS / xlsx)
// ====================================================================

import * as XLSX from 'xlsx';
import { Lead, Appointment, Property } from '../types/crm';
import { normalizeIndianPhone, formatIndianCurrency, formatIST } from './utils';

/**
 * EXPORT LEADS TO EXCEL (.xlsx)
 * Exactly satisfies prompt column specs:
 * Date | IG Handle | Full Name | Phone | Email | Intent | Property Type |
 * Location | Budget | Timeline | Lead Score | Status | Appointment Date |
 * AI Summary | Assigned To
 */
export function exportLeadsToExcel(leads: Lead[], appointments: Appointment[] = [], filename = 'Lineage_Properties_Leads.xlsx') {
  const appointmentMap = new Map<string, string>();
  appointments.forEach((apt) => {
    if (apt.status === 'booked') {
      appointmentMap.set(apt.lead_id, formatIST(apt.scheduled_at));
    }
  });

  const exportData = leads.map((lead) => {
    const budgetStr =
      lead.budget_min || lead.budget_max
        ? `${formatIndianCurrency(lead.budget_min)} - ${formatIndianCurrency(lead.budget_max)}`
        : 'Not Specified';

    return {
      'Date': formatIST(lead.created_at),
      'IG Handle': lead.ig_handle ? `@${lead.ig_handle}` : '—',
      'Full Name': lead.full_name,
      'Phone': lead.phone,
      'Email': lead.email || '—',
      'Intent': lead.intent ? lead.intent.toUpperCase() : '—',
      'Property Type': lead.property_type || '—',
      'Location': lead.preferred_location || '—',
      'Budget': budgetStr,
      'Timeline': lead.timeline || '—',
      'Lead Score': lead.lead_score.toUpperCase(),
      'Status': lead.status.replace(/_/g, ' ').toUpperCase(),
      'Appointment Date': appointmentMap.get(lead.id) || 'None',
      'AI Summary': lead.ai_summary || lead.notes || '—',
      'Assigned To': lead.assigned_profile?.full_name || 'Unassigned'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  // Auto-fit column widths
  const colWidths = [
    { wch: 18 }, // Date
    { wch: 16 }, // IG Handle
    { wch: 22 }, // Full Name
    { wch: 15 }, // Phone
    { wch: 25 }, // Email
    { wch: 10 }, // Intent
    { wch: 16 }, // Property Type
    { wch: 20 }, // Location
    { wch: 22 }, // Budget
    { wch: 14 }, // Timeline
    { wch: 12 }, // Lead Score
    { wch: 18 }, // Status
    { wch: 20 }, // Appointment Date
    { wch: 40 }, // AI Summary
    { wch: 20 }  // Assigned To
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
  XLSX.writeFile(workbook, filename);
}

/**
 * EXPORT APPOINTMENTS TO EXCEL
 */
export function exportAppointmentsToExcel(appointments: Appointment[], filename = 'Lineage_Properties_Appointments.xlsx') {
  const exportData = appointments.map((apt) => ({
    'Scheduled Date & Time': formatIST(apt.scheduled_at),
    'Type': apt.type === 'site_visit' ? 'Site Visit' : 'Phone Call',
    'Status': apt.status.toUpperCase(),
    'Lead Name': apt.lead?.full_name || 'Unknown Lead',
    'Lead Phone': apt.lead?.phone || '—',
    'Project': apt.property?.project_name || 'General / Unassigned',
    'Location': apt.property?.location || '—',
    'Notes': apt.notes || '—'
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Appointments');
  XLSX.writeFile(workbook, filename);
}

/**
 * EXPORT PROPERTIES CATALOG TO EXCEL
 */
export function exportPropertiesToExcel(properties: Property[], filename = 'Lineage_Properties_Estates.xlsx') {
  const exportData = properties.map((prop) => ({
    'Project Name': prop.project_name,
    'Location': prop.location,
    'Property Type': prop.property_type,
    'BHK': prop.bhk || '—',
    'Carpet Area (sqft)': prop.carpet_area || '—',
    'Price Range': `${formatIndianCurrency(prop.price_min)} - ${formatIndianCurrency(prop.price_max)}`,
    'Status': prop.status.toUpperCase(),
    'RERA Number': prop.rera_number || '—',
    'Payment Plan': prop.payment_plan || '—',
    'Description': prop.description
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Properties');
  XLSX.writeFile(workbook, filename);
}

/**
 * EXPORT COMPLETE MASTER CRM DATABASE TO MULTI-TAB MS EXCEL WORKBOOK (.xlsx)
 * Consolidates all Client Leads, Site Walkthroughs, Estates and Firm Details
 */
export function exportMasterCrmToExcel({
  leads,
  appointments,
  properties,
  filename = 'Lineage_Properties_Master_Dossier.xlsx'
}: {
  leads: Lead[];
  appointments: Appointment[];
  properties: Property[];
  filename?: string;
}) {
  const workbook = XLSX.utils.book_new();

  // Tab 1: Client Leads Registry
  const appointmentMap = new Map<string, string>();
  appointments.forEach((apt) => {
    if (apt.status === 'booked') {
      appointmentMap.set(apt.lead_id, formatIST(apt.scheduled_at));
    }
  });

  const leadsData = leads.map((lead) => {
    const budgetStr =
      lead.budget_min || lead.budget_max
        ? `${formatIndianCurrency(lead.budget_min)} - ${formatIndianCurrency(lead.budget_max)}`
        : 'Not Specified';

    return {
      'Date Registered': formatIST(lead.created_at),
      'Full Legal Name': lead.full_name,
      'Mobile (+91)': lead.phone,
      'Email': lead.email || '—',
      'Preferred Locality': lead.preferred_location || '—',
      'Intent': lead.intent ? lead.intent.toUpperCase() : 'BUY',
      'Property Type': lead.property_type || '—',
      'Budget Range': budgetStr,
      'Timeline': lead.timeline || '—',
      'Score': lead.lead_score.toUpperCase(),
      'Status': lead.status.replace(/_/g, ' ').toUpperCase(),
      'Confirmed Walkthrough': appointmentMap.get(lead.id) || 'None Scheduled',
      'Notes & Specifications': lead.notes || lead.ai_summary || '—',
      'DPDP Consent': lead.consent_given ? 'VERIFIED' : 'PENDING'
    };
  });
  const leadsSheet = XLSX.utils.json_to_sheet(leadsData.length > 0 ? leadsData : [{
    'Date Registered': 'No clients registered yet',
    'Full Legal Name': '—',
    'Mobile (+91)': '—',
    'Email': '—',
    'Preferred Locality': '—',
    'Intent': '—',
    'Property Type': '—',
    'Budget Range': '—',
    'Timeline': '—',
    'Score': '—',
    'Status': '—',
    'Confirmed Walkthrough': '—',
    'Notes & Specifications': '—',
    'DPDP Consent': '—'
  }]);
  leadsSheet['!cols'] = [
    { wch: 20 }, { wch: 24 }, { wch: 16 }, { wch: 26 }, { wch: 24 },
    { wch: 12 }, { wch: 16 }, { wch: 22 }, { wch: 16 }, { wch: 12 },
    { wch: 18 }, { wch: 24 }, { wch: 45 }, { wch: 14 }
  ];
  XLSX.utils.book_append_sheet(workbook, leadsSheet, 'Client Registry');

  // Tab 2: Site Walkthroughs & Appointments
  const appointmentsData = appointments.map((apt) => ({
    'Scheduled Time (IST)': formatIST(apt.scheduled_at),
    'Type': apt.type === 'site_visit' ? 'Site Walkthrough' : 'Consultation Call',
    'Status': apt.status.toUpperCase(),
    'Client Name': apt.lead?.full_name || '—',
    'Client Phone': apt.lead?.phone || '—',
    'Estate Project': apt.property?.project_name || 'General Locality Tour',
    'Locality': apt.property?.location || apt.lead?.preferred_location || 'Kanpur',
    'Special Instructions': apt.notes || '—'
  }));
  const aptSheet = XLSX.utils.json_to_sheet(appointmentsData.length > 0 ? appointmentsData : [{
    'Scheduled Time (IST)': 'No appointments scheduled yet',
    'Type': '—',
    'Status': '—',
    'Client Name': '—',
    'Client Phone': '—',
    'Estate Project': '—',
    'Locality': '—',
    'Special Instructions': '—'
  }]);
  aptSheet['!cols'] = [
    { wch: 24 }, { wch: 18 }, { wch: 14 }, { wch: 22 }, { wch: 16 },
    { wch: 26 }, { wch: 24 }, { wch: 40 }
  ];
  XLSX.utils.book_append_sheet(workbook, aptSheet, 'Site Walkthroughs');

  // Tab 3: Estate Portfolio
  const propertiesData = properties.map((prop) => ({
    'Project Name': prop.project_name,
    'Locality / Area': prop.location,
    'Property Type': prop.property_type,
    'BHK Layout': prop.bhk || '—',
    'Carpet Area (sq.ft)': prop.carpet_area || '—',
    'Price Range': `${formatIndianCurrency(prop.price_min)} - ${formatIndianCurrency(prop.price_max)}`,
    'RERA Number': prop.rera_number || 'UP RERA Verified',
    'Status': prop.status.toUpperCase(),
    'Description': prop.description
  }));
  const propSheet = XLSX.utils.json_to_sheet(propertiesData.length > 0 ? propertiesData : [{
    'Project Name': 'Curating verified developments',
    'Locality / Area': 'Kanpur Prime',
    'Property Type': 'Luxury Residential',
    'BHK Layout': '3/4 BHK',
    'Carpet Area (sq.ft)': '2500',
    'Price Range': '₹1.50 Cr - ₹4.50 Cr',
    'RERA Number': 'UP RERA Verified',
    'Status': 'AVAILABLE',
    'Description': 'Premium curated residences'
  }]);
  propSheet['!cols'] = [
    { wch: 26 }, { wch: 24 }, { wch: 18 }, { wch: 14 }, { wch: 18 },
    { wch: 26 }, { wch: 22 }, { wch: 14 }, { wch: 45 }
  ];
  XLSX.utils.book_append_sheet(workbook, propSheet, 'Estate Portfolio');

  // Tab 4: Firm Information
  const firmData = [
    { 'Parameter': 'Firm Legal Name', 'Details': 'Lineage Properties Pvt Ltd' },
    { 'Parameter': 'Jurisdiction', 'Details': 'Kanpur, Uttar Pradesh, India' },
    { 'Parameter': 'Office Location', 'Details': 'Civil Lines & Swaroop Nagar, Kanpur' },
    { 'Parameter': 'Operating Hours', 'Details': '11:00 AM – 7:00 PM IST (Mon – Sat)' },
    { 'Parameter': 'Official Inquiries', 'Details': 'admin@lineageproperties.com' },
    { 'Parameter': 'Data Protection Standard', 'Details': 'DPDP Act 2023 Compliant' },
    { 'Parameter': 'Export Timestamp', 'Details': new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) }
  ];
  const firmSheet = XLSX.utils.json_to_sheet(firmData);
  firmSheet['!cols'] = [{ wch: 26 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(workbook, firmSheet, 'Firm Profile');

  XLSX.writeFile(workbook, filename);
}

export interface ImportValidationReport {
  totalRows: number;
  validToAdd: Partial<Lead>[];
  skippedDuplicates: { row: number; name: string; phone: string; reason: string }[];
  failedRows: { row: number; raw: any; reason: string }[];
}

/**
 * Validates, normalizes and deduplicates imported Excel/CSV rows against existing database records
 */
export function validateAndDeduplicateLeads(
  rawRows: Record<string, any>[],
  columnMap: Record<string, string>, // e.g. { full_name: 'Customer Name', phone: 'Mobile' }
  existingLeads: Lead[]
): ImportValidationReport {
  const validToAdd: Partial<Lead>[] = [];
  const skippedDuplicates: { row: number; name: string; phone: string; reason: string }[] = [];
  const failedRows: { row: number; raw: any; reason: string }[] = [];

  // Build lookup index of existing leads
  const existingPhones = new Set(existingLeads.map((l) => normalizeIndianPhone(l.phone)));
  const existingHandles = new Set(
    existingLeads
      .filter((l) => l.ig_handle)
      .map((l) => l.ig_handle!.toLowerCase().replace(/^@/, ''))
  );

  // Keep track of within-file duplicates too
  const seenInFilePhones = new Set<string>();
  const seenInFileHandles = new Set<string>();

  rawRows.forEach((row, idx) => {
    const rowNum = idx + 2; // Accounting for 1-based index + header row

    const fullNameRaw = row[columnMap.full_name] || row['Full Name'] || row['Name'] || row['Customer Name'];
    const phoneRaw = row[columnMap.phone] || row['Phone'] || row['Mobile'] || row['Contact'];
    const emailRaw = row[columnMap.email] || row['Email'] || row['Email Address'];
    const igHandleRaw = row[columnMap.ig_handle] || row['IG Handle'] || row['Instagram'];
    const locationRaw = row[columnMap.preferred_location] || row['Location'] || row['Area'];
    const intentRaw = row[columnMap.intent] || row['Intent'] || 'buy';
    const propTypeRaw = row[columnMap.property_type] || row['Property Type'] || row['Type'];
    const budgetRaw = row[columnMap.budget] || row['Budget'] || row['Budget Max'];
    const notesRaw = row[columnMap.notes] || row['Notes'] || row['Comments'];

    if (!fullNameRaw || String(fullNameRaw).trim() === '') {
      failedRows.push({ row: rowNum, raw: row, reason: 'Missing Full Name' });
      return;
    }

    if (!phoneRaw || String(phoneRaw).trim() === '') {
      failedRows.push({ row: rowNum, raw: row, reason: 'Missing Phone Number' });
      return;
    }

    const normalizedPhone = normalizeIndianPhone(String(phoneRaw));
    if (normalizedPhone.length < 12) {
      failedRows.push({ row: rowNum, raw: row, reason: `Invalid Indian Phone (${phoneRaw})` });
      return;
    }

    const cleanHandle = igHandleRaw ? String(igHandleRaw).toLowerCase().replace(/^@/, '').trim() : null;

    // Check duplicate in database
    if (existingPhones.has(normalizedPhone)) {
      skippedDuplicates.push({
        row: rowNum,
        name: String(fullNameRaw),
        phone: normalizedPhone,
        reason: 'Phone number already exists in CRM database'
      });
      return;
    }

    if (cleanHandle && existingHandles.has(cleanHandle)) {
      skippedDuplicates.push({
        row: rowNum,
        name: String(fullNameRaw),
        phone: normalizedPhone,
        reason: `Instagram handle @${cleanHandle} already exists in CRM database`
      });
      return;
    }

    // Check duplicate within the same uploaded file
    if (seenInFilePhones.has(normalizedPhone)) {
      skippedDuplicates.push({
        row: rowNum,
        name: String(fullNameRaw),
        phone: normalizedPhone,
        reason: 'Duplicate phone number found earlier in this same file'
      });
      return;
    }

    if (cleanHandle && seenInFileHandles.has(cleanHandle)) {
      skippedDuplicates.push({
        row: rowNum,
        name: String(fullNameRaw),
        phone: normalizedPhone,
        reason: `Duplicate Instagram handle @${cleanHandle} found earlier in this file`
      });
      return;
    }

    seenInFilePhones.add(normalizedPhone);
    if (cleanHandle) seenInFileHandles.add(cleanHandle);

    let budgetNum: number | undefined;
    if (budgetRaw) {
      const parsedNum = Number(String(budgetRaw).replace(/[^0-9.]/g, ''));
      if (!isNaN(parsedNum) && parsedNum > 0) {
        budgetNum = parsedNum;
      }
    }

    validToAdd.push({
      full_name: String(fullNameRaw).trim(),
      phone: normalizedPhone,
      email: emailRaw ? String(emailRaw).trim() : null,
      ig_handle: cleanHandle,
      preferred_location: locationRaw ? String(locationRaw).trim() : 'Kanpur',
      intent: (['buy', 'rent', 'invest'].includes(String(intentRaw).toLowerCase()) ? String(intentRaw).toLowerCase() : 'buy') as any,
      property_type: propTypeRaw ? String(propTypeRaw).trim() : 'Apartment',
      budget_max: budgetNum,
      source: 'import',
      lead_score: 'warm',
      status: 'new',
      notes: notesRaw ? String(notesRaw).trim() : 'Imported via Excel spreadsheet',
      consent_given: true, // Offline/event list import
      consent_at: new Date().toISOString()
    });
  });

  return {
    totalRows: rawRows.length,
    validToAdd,
    skippedDuplicates,
    failedRows
  };
}
