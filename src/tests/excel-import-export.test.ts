import { describe, it, expect } from 'vitest';
import { validateAndDeduplicateLeads } from '../lib/excel';
import { Lead } from '../types/crm';

describe('Excel Import Validation & Column Mapping', () => {
  it('correctly maps arbitrary columns and filters invalid rows', () => {
    const rawRows = [
      {
        'Customer': 'Sunil Kumar',
        'Mobile': '9839123456',
        'Area': 'Swaroop Nagar',
        'Budget Max': '12500000'
      },
      {
        'Customer': '', // Missing name
        'Mobile': '9839999999'
      },
      {
        'Customer': 'Invalid Phone Lead',
        'Mobile': '123' // Invalid phone
      }
    ];

    const colMap = {
      full_name: 'Customer',
      phone: 'Mobile',
      preferred_location: 'Area',
      budget: 'Budget Max'
    };

    const report = validateAndDeduplicateLeads(rawRows, colMap, []);

    expect(report.totalRows).toBe(3);
    expect(report.validToAdd.length).toBe(1);
    expect(report.validToAdd[0].full_name).toBe('Sunil Kumar');
    expect(report.validToAdd[0].phone).toBe('+919839123456');
    expect(report.validToAdd[0].budget_max).toBe(12500000);
    expect(report.failedRows.length).toBe(2);
  });

  it('detects duplicates within the same uploaded file', () => {
    const rawRows = [
      { 'Name': 'Buyer 1', 'Phone': '9839001122' },
      { 'Name': 'Buyer 1 Duplicate', 'Phone': '9839001122' }
    ];

    const report = validateAndDeduplicateLeads(rawRows, { full_name: 'Name', phone: 'Phone' }, []);

    expect(report.validToAdd.length).toBe(1);
    expect(report.skippedDuplicates.length).toBe(1);
    expect(report.skippedDuplicates[0].reason).toContain('found earlier in this same file');
  });
});
