import { describe, it, expect } from 'vitest';
import { normalizeIndianPhone, isValidIndianPhone } from '../lib/utils';
import { validateAndDeduplicateLeads } from '../lib/excel';
import { Lead } from '../types/crm';

describe('Lead Deduplication & Indian Phone Normalization', () => {
  it('normalizes 10-digit Indian numbers to +91 format', () => {
    expect(normalizeIndianPhone('9839012345')).toBe('+919839012345');
    expect(normalizeIndianPhone(' 9839012345 ')).toBe('+919839012345');
  });

  it('normalizes numbers with leading 0 or with spaces/dashes', () => {
    expect(normalizeIndianPhone('09839012345')).toBe('+919839012345');
    expect(normalizeIndianPhone('91-9839012345')).toBe('+919839012345');
    expect(normalizeIndianPhone('+91 98390 12345')).toBe('+919839012345');
    expect(normalizeIndianPhone('+919839012345')).toBe('+919839012345');
  });

  it('validates genuine Indian mobile numbers starting with 6-9', () => {
    expect(isValidIndianPhone('9839012345')).toBe(true);
    expect(isValidIndianPhone('8765432109')).toBe(true);
    expect(isValidIndianPhone('7000000000')).toBe(true);
    expect(isValidIndianPhone('6123456789')).toBe(true);

    // Invalid numbers
    expect(isValidIndianPhone('1234567890')).toBe(false);
    expect(isValidIndianPhone('98390')).toBe(false);
    expect(isValidIndianPhone('')).toBe(false);
  });

  it('skips leads with duplicate phone numbers against existing database', () => {
    const existingLeads: Lead[] = [
      {
        id: 'lead-1',
        source: 'manual',
        full_name: 'Dr. Alok Mishra',
        phone: '+919839012345',
        lead_score: 'hot',
        status: 'site_visit_booked',
        consent_given: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const rawRows = [
      { 'Name': 'Alok Mishra Duplicate', 'Phone': '09839012345' },
      { 'Name': 'New Buyer Vikram', 'Phone': '9838099999' }
    ];

    const report = validateAndDeduplicateLeads(rawRows, { full_name: 'Name', phone: 'Phone' }, existingLeads);

    expect(report.totalRows).toBe(2);
    expect(report.skippedDuplicates.length).toBe(1);
    expect(report.skippedDuplicates[0].phone).toBe('+919839012345');
    expect(report.validToAdd.length).toBe(1);
    expect(report.validToAdd[0].full_name).toBe('New Buyer Vikram');
  });

  it('skips leads with duplicate Instagram handles', () => {
    const existingLeads: Lead[] = [
      {
        id: 'lead-1',
        source: 'instagram',
        ig_handle: 'dr_alok_mishra',
        full_name: 'Dr. Alok Mishra',
        phone: '+919839012345',
        lead_score: 'hot',
        status: 'site_visit_booked',
        consent_given: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const rawRows = [
      { 'Name': 'Alok Instagram Inquiry', 'Phone': '9999999999', 'Instagram': '@DR_ALOK_MISHRA' }
    ];

    const report = validateAndDeduplicateLeads(rawRows, { full_name: 'Name', phone: 'Phone', ig_handle: 'Instagram' }, existingLeads);

    expect(report.skippedDuplicates.length).toBe(1);
    expect(report.validToAdd.length).toBe(0);
  });
});
