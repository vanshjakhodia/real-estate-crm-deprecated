import { describe, it, expect } from 'vitest';

export const OWNER_MASTER_PIN = '14241700';

export function verifyOwnerMasterPin(candidatePin: string): boolean {
  return candidatePin.trim() === OWNER_MASTER_PIN;
}

describe('Owner Master PIN Security Gate', () => {
  it('authenticates successfully with exact owner PIN 14241700', () => {
    expect(verifyOwnerMasterPin('14241700')).toBe(true);
    expect(verifyOwnerMasterPin(' 14241700 ')).toBe(true);
  });

  it('strictly rejects any other PIN or unauthorized attempts', () => {
    expect(verifyOwnerMasterPin('00000000')).toBe(false);
    expect(verifyOwnerMasterPin('12345678')).toBe(false);
    expect(verifyOwnerMasterPin('1424170')).toBe(false); // short
    expect(verifyOwnerMasterPin('142417001')).toBe(false); // long
    expect(verifyOwnerMasterPin('admin')).toBe(false);
    expect(verifyOwnerMasterPin('')).toBe(false);
  });
});
