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
  bufferMinutes = 45
): boolean {
  const candidate = new Date(candidateTime).getTime();
  const bufferMs = bufferMinutes * 60 * 1000;

  return existingTimes.some((time) => {
    const existing = new Date(time).getTime();
    return Math.abs(candidate - existing) < bufferMs;
  });
}

/**
 * Formats 24h time string ("11:00", "14:30") to readable 12h format ("11:00 AM", "2:30 PM")
 */
export function formatTime12h(time24: string): string {
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12; // 0 becomes 12
  return `${h}:${m} ${ampm}`;
}

/**
 * Generates selectable time slots for a given date within working hours.
 * Default workingHours: 11:00 AM to 7:00 PM (11:00 to 19:00), 30 mins interval.
 */
export function generateAvailableSlots(
  dateStr: string, // YYYY-MM-DD
  workingHours = { start: '11:00', end: '19:00' },
  bookedDateTimes: (Date | string)[] = [],
  slotDurationMinutes = 30
): {
  time: string;
  displayTime: string;
  dateTime: string;
  isAvailable: boolean;
  isBooked: boolean;
  isPast: boolean;
}[] {
  const [startHour, startMin] = (workingHours.start || '11:00').split(':').map(Number);
  const [endHour, endMin] = (workingHours.end || '19:00').split(':').map(Number);

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
    const isBooked = isAppointmentConflicting(slotDate, bookedDateTimes, slotDurationMinutes - 5);

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
