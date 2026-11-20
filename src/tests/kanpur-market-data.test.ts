import { describe, it, expect } from 'vitest';
import {
  KANPUR_LOCALITIES,
  KANPUR_INFRASTRUCTURE,
  calculateKanpurStampDuty
} from '../lib/kanpurMarketData';

describe('Kanpur Real Estate Market Intelligence', () => {
  it('should load all primary Kanpur localities with valid metrics and coordinates', () => {
    expect(KANPUR_LOCALITIES.length).toBeGreaterThanOrEqual(8);

    const civilLines = KANPUR_LOCALITIES.find((l) => l.id === 'civil-lines');
    expect(civilLines).toBeDefined();
    expect(civilLines?.avgPricePerSqFt).toBeGreaterThanOrEqual(8500);
    expect(civilLines?.circleRateSqM).toContain('₹55,000');
    expect(civilLines?.coordinates.x).toBeGreaterThan(0);
    expect(civilLines?.coordinates.y).toBeGreaterThan(0);

    const kalyanpur = KANPUR_LOCALITIES.find((l) => l.id === 'kalyanpur');
    expect(kalyanpur).toBeDefined();
    expect(kalyanpur?.tags).toContain('IIT Kanpur Hub');
  });

  it('should accurately calculate UP stamp duty and registration fees for Kanpur Nagar', () => {
    const valuation = 10000000; // 1 Crore property

    // Male buyer: 7% stamp duty + 1% registration
    const maleCalc = calculateKanpurStampDuty(valuation, 'male');
    expect(maleCalc.stampDutyRate).toBe(7);
    expect(maleCalc.stampDutyAmount).toBe(700000);
    expect(maleCalc.registrationRate).toBe(1);
    expect(maleCalc.registrationAmount).toBe(100000);
    expect(maleCalc.totalGovtFees).toBe(800000);
    expect(maleCalc.effectiveTotal).toBe(10800000);

    // Female buyer: 6% stamp duty + 1% registration
    const femaleCalc = calculateKanpurStampDuty(valuation, 'female');
    expect(femaleCalc.stampDutyRate).toBe(6);
    expect(femaleCalc.stampDutyAmount).toBe(600000);
    expect(femaleCalc.registrationAmount).toBe(100000);
    expect(femaleCalc.totalGovtFees).toBe(700000);
    expect(femaleCalc.effectiveTotal).toBe(10700000);

    // Joint buyer: 6.5% stamp duty + 1% registration
    const jointCalc = calculateKanpurStampDuty(valuation, 'joint');
    expect(jointCalc.stampDutyRate).toBe(6.5);
    expect(jointCalc.stampDutyAmount).toBe(650000);
    expect(jointCalc.totalGovtFees).toBe(750000);
  });

  it('should contain verified operational Kanpur infrastructure assets', () => {
    expect(KANPUR_INFRASTRUCTURE.length).toBeGreaterThanOrEqual(4);

    const metro = KANPUR_INFRASTRUCTURE.find((p) => p.id === 'metro-orange');
    expect(metro).toBeDefined();
    expect(metro?.status).toBe('Operational');

    const airport = KANPUR_INFRASTRUCTURE.find((p) => p.id === 'chakeri-airport');
    expect(airport).toBeDefined();
    expect(airport?.status).toBe('Operational');
  });
});
