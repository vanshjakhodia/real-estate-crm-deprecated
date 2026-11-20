import { describe, it, expect } from 'vitest';
import { verifyMetaSignature } from '../lib/webhookSignature';
import crypto from 'node:crypto';

describe('Meta Webhook Signature Verification (Phase 2 Readiness)', () => {
  const secret = 'kanpur_crm_secret_123456';
  const payload = JSON.stringify({
    entry: [{ id: '12345', messaging: [{ message: { text: 'Price for Ganga Heights?' } }] }]
  });

  it('validates a correct HMAC SHA-256 signature', () => {
    const hash = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const header = `sha256=${hash}`;

    expect(verifyMetaSignature(payload, header, secret)).toBe(true);
  });

  it('rejects an incorrect signature or tampered payload', () => {
    const wrongHeader = 'sha256=invalidhash987654321';
    expect(verifyMetaSignature(payload, wrongHeader, secret)).toBe(false);

    // Tampered body
    const hash = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    expect(verifyMetaSignature(payload + 'tampered', `sha256=${hash}`, secret)).toBe(false);
  });

  it('rejects requests with missing or empty header', () => {
    expect(verifyMetaSignature(payload, null, secret)).toBe(false);
    expect(verifyMetaSignature(payload, '', secret)).toBe(false);
  });
});
