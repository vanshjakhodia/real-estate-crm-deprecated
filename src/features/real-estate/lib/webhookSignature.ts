// ====================================================================
// META INSTAGRAM WEBHOOK SIGNATURE VERIFIER (HMAC SHA-256)
// ====================================================================

import crypto from 'node:crypto';

/**
 * Verifies Meta's X-Hub-Signature-256 header against the raw request body
 * Returns true if valid, false if signature mismatch or missing
 */
export function verifyMetaSignature(
  rawPayload: string | Buffer,
  signatureHeader: string | null | undefined,
  appSecret: string
): boolean {
  if (!signatureHeader || !appSecret) return false;

  const parts = signatureHeader.split('=');
  if (parts.length !== 2 || parts[0] !== 'sha256') {
    return false;
  }

  const expectedHash = parts[1];
  if (!expectedHash) return false;
  const hmac = crypto.createHmac('sha256', appSecret);
  hmac.update(rawPayload);
  const calculatedHash = hmac.digest('hex');

  // Timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(calculatedHash, 'utf8'),
      Buffer.from(expectedHash, 'utf8')
    );
  } catch {
    return false;
  }
}
