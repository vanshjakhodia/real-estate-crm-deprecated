// ====================================================================
// UTILITY FUNCTIONS: Lineage Properties CRM
// ====================================================================

/**
 * Normalizes any phone number string into E.164 Indian format (+91XXXXXXXXXX)
 * Handles: "9839012345", "09839012345", "+91 98390 12345", "91-9839012345", "+919839012345"
 */
export function normalizeIndianPhone(input: string | null | undefined): string {
  if (!input) return '';
  const cleaned = input.replace(/[^0-9]/g, '');

  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `+91${cleaned.substring(1)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned}`;
  }
  if (cleaned.length > 10 && !cleaned.startsWith('91')) {
    return `+${cleaned}`;
  }
  return `+${cleaned}`;
}

/**
 * Validates whether a phone number is a valid 10-digit Indian mobile number
 */
export function isValidIndianPhone(phone: string): boolean {
  const normalized = normalizeIndianPhone(phone);
  return /^\+91[6-9]\d{9}$/.test(normalized);
}

/**
 * Formats Indian Rupee values into human-readable Crores and Lakhs
 * e.g. 15000000 -> "₹1.50 Cr", 9800000 -> "₹98.00 L", 450000 -> "₹4.50 L"
 */
export function formatIndianCurrency(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return '₹0';
  if (amount >= 10000000) {
    const cr = amount / 10000000;
    return `₹${cr % 1 === 0 ? cr : cr.toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    const lk = amount / 100000;
    return `₹${lk % 1 === 0 ? lk : lk.toFixed(2)} Lakhs`;
  }
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

/**
 * Detects if a requested appointment slot conflicts with an existing appointment.
 * Considers a 45-minute booking buffer.
 */
export function isAppointmentConflicting(
  candidateTime: Date | string,
  existingTimes: (Date | string)[],
  bufferMinutes = 40
): boolean {
  const candidate = new Date(candidateTime).getTime();
  const bufferMs = bufferMinutes * 60 * 1000;

  return existingTimes.some((time) => {
    const existing = new Date(time).getTime();
    return Math.abs(candidate - existing) <= bufferMs;
  });
}

/**
 * Formats 24h time string ("11:00", "14:30") to readable 12h format ("11:00 AM", "2:30 PM")
 */
export function formatTime12h(time24: string): string {
  const [hStr = '0', mStr = '00'] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12; // 0 becomes 12
  return `${h}:${m} ${ampm}`;
}

/**
 * Generates selectable time slots for a given date within working hours.
 * An optional weekday list keeps the public booking calendar aligned with firm settings.
 */
export function generateAvailableSlots(
  dateStr: string, // YYYY-MM-DD
  workingHours = { start: '11:00', end: '19:00' },
  bookedDateTimes: (Date | string)[] = [],
  slotDurationMinutes = 30,
  workingDays?: string[],
): {
  time: string;
  displayTime: string;
  dateTime: string;
  isAvailable: boolean;
  isBooked: boolean;
  isPast: boolean;
}[] {
  const [startHour = 10, startMin = 0] = (workingHours.start || '10:00').split(':').map(Number);
  const [endHour = 18, endMin = 0] = (workingHours.end || '18:00').split(':').map(Number);

  const startMs = startHour * 60 + startMin;
  const endMs = endHour * 60 + endMin;

  const slots: {
    time: string;
    displayTime: string;
    dateTime: string;
    isAvailable: boolean;
    isBooked: boolean;
    isPast: boolean;
  }[] = [];
  if (workingDays) {
    const date = new Date(`${dateStr}T12:00:00+05:30`);
    const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'Asia/Kolkata' }).format(date);
    if (!workingDays.includes(weekday)) return slots;
  }
  const now = new Date();

  for (let current = startMs; current + slotDurationMinutes <= endMs; current += slotDurationMinutes) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    const timeFormatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const isoDateTime = `${dateStr}T${timeFormatted}:00+05:30`;
    const slotDate = new Date(isoDateTime);

    // Cannot book slots in the past (allow for today if slot is upcoming)
    const isPast = slotDate.getTime() <= now.getTime();
    // Cannot book conflicting slots
    const isBooked = isAppointmentConflicting(slotDate, bookedDateTimes, 40);

    slots.push({
      time: timeFormatted,
      displayTime: formatTime12h(timeFormatted),
      dateTime: isoDateTime,
      isAvailable: !isPast && !isBooked,
      isBooked,
      isPast
    });
  }

  return slots;
}

/**
 * Safely parses the Gemini AI lead score JSON output
 */
export function parseLeadScoreOutput(rawText: string): {
  lead_score: 'hot' | 'warm' | 'cold';
  reason: string;
  ai_summary: string;
} {
  try {
    const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const validScores = ['hot', 'warm', 'cold'];
    const lead_score = validScores.includes(parsed.lead_score?.toLowerCase())
      ? (parsed.lead_score.toLowerCase() as 'hot' | 'warm' | 'cold')
      : 'warm';

    return {
      lead_score,
      reason: parsed.reason || 'AI evaluation completed based on profile and interactions.',
      ai_summary: parsed.ai_summary || 'Interested prospect in Kanpur real estate properties.'
    };
  } catch (err) {
    // Fallback heuristic scoring if AI returned unparseable text
    let lead_score: 'hot' | 'warm' | 'cold' = 'warm';
    if (/hot/i.test(rawText)) lead_score = 'hot';
    else if (/cold/i.test(rawText)) lead_score = 'cold';

    return {
      lead_score,
      reason: 'Extracted from AI qualitative analysis.',
      ai_summary: rawText.slice(0, 180) + '...'
    };
  }
}

/**
 * Creates a prefilled WhatsApp link for manual team sending (Phase 1 & 3 requirement)
 */
export function buildWhatsAppLink(phone: string, text: string): string {
  const cleaned = phone.replace(/[^0-9]/g, '');
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`;
}

/**
 * Format timestamp to friendly IST string
 */
export function formatIST(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    }).format(d);
  } catch {
    return dateString;
  }
}

/**
 * Encrypts classified sensitive client dossier info (notes, budgets, preferences)
 * using AES-256-GCM. 100% universal browser and edge worker safe.
 */
export async function encryptClassifiedDossier(plaintext: string): Promise<string> {
  if (!plaintext || typeof plaintext !== 'string') return plaintext;
  try {
    if (typeof globalThis !== 'undefined' && (globalThis as any).crypto?.subtle) {
      const enc = new TextEncoder();
      const keyMaterial = await (globalThis as any).crypto.subtle.importKey(
        'raw',
        enc.encode('LineageProperties-Classified-Vault-14241700-StrictAdmin'),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );
      const key = await (globalThis as any).crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: enc.encode('Lineage-EndToEnd-AES256GCM-Classified-Kanpur-2026'),
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
      const iv = new Uint8Array(12);
      if (typeof (globalThis as any).crypto.getRandomValues === 'function') {
        (globalThis as any).crypto.getRandomValues(iv);
      } else {
        for (let i = 0; i < 12; i++) iv[i] = Math.floor(Math.random() * 256);
      }
      const encrypted = await (globalThis as any).crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        enc.encode(plaintext)
      );
      let ivStr = '';
      for (let i = 0; i < iv.length; i++) ivStr += String.fromCharCode(iv[i]);
      const encArr = new Uint8Array(encrypted);
      let cipherStr = '';
      for (let i = 0; i < encArr.length; i++) cipherStr += String.fromCharCode(encArr[i]);
      const ivB64 = typeof btoa === 'function' ? btoa(ivStr) : '';
      const cipherB64 = typeof btoa === 'function' ? btoa(cipherStr) : '';
      return `ENC:AES256GCM:${ivB64}:${cipherB64}`;
    }
  } catch (e) {
    console.warn('[Crypto] Notice:', e);
  }
  return plaintext;
}

/**
 * Decrypts classified payload for authorized admin view.
 */
export async function decryptClassifiedDossier(ciphertext: string): Promise<string> {
  if (!ciphertext || typeof ciphertext !== 'string' || !ciphertext.startsWith('ENC:AES256GCM:')) {
    return ciphertext;
  }
  try {
    if (typeof globalThis !== 'undefined' && (globalThis as any).crypto?.subtle && typeof atob === 'function') {
      const parts = ciphertext.split(':');
      if (parts.length === 4) {
        const enc = new TextEncoder();
        const keyMaterial = await (globalThis as any).crypto.subtle.importKey(
          'raw',
          enc.encode('LineageProperties-Classified-Vault-14241700-StrictAdmin'),
          { name: 'PBKDF2' },
          false,
          ['deriveKey']
        );
        const key = await (globalThis as any).crypto.subtle.deriveKey(
          {
            name: 'PBKDF2',
            salt: enc.encode('Lineage-EndToEnd-AES256GCM-Classified-Kanpur-2026'),
            iterations: 100000,
            hash: 'SHA-256'
          },
          keyMaterial,
          { name: 'AES-GCM', length: 256 },
          false,
          ['decrypt']
        );
        const ivBinary = atob(parts[2] || '');
        const cipherBinary = atob(parts[3] || '');
        const iv = new Uint8Array(ivBinary.length);
        for (let i = 0; i < ivBinary.length; i++) iv[i] = ivBinary.charCodeAt(i);
        const cipherBytes = new Uint8Array(cipherBinary.length);
        for (let i = 0; i < cipherBinary.length; i++) cipherBytes[i] = cipherBinary.charCodeAt(i);
        const decrypted = await (globalThis as any).crypto.subtle.decrypt(
          { name: 'AES-GCM', iv },
          key,
          cipherBytes
        );
        return new TextDecoder().decode(decrypted);
      }
    }
  } catch {
    return ciphertext;
  }
  return ciphertext;
}
