import { describe, it, expect } from 'vitest';
import { isAppointmentConflicting, generateAvailableSlots } from '../lib/utils';

describe('Slot Booking Conflicts & Double-Booking Prevention', () => {
  it('detects a conflict when requested time is within 40 minutes of existing appointment', () => {
    const existingTimes = ['2026-11-21T15:00:00+05:30'];

    // Exactly the same time
    expect(isAppointmentConflicting('2026-11-21T15:00:00+05:30', existingTimes, 40)).toBe(true);

    // 20 minutes later (overlaps)
    expect(isAppointmentConflicting('2026-11-21T15:20:00+05:30', existingTimes, 40)).toBe(true);

    // 25 minutes earlier (overlaps)
    expect(isAppointmentConflicting('2026-11-21T14:35:00+05:30', existingTimes, 40)).toBe(true);

    // 45 minutes later (no conflict)
    expect(isAppointmentConflicting('2026-11-21T15:45:00+05:30', existingTimes, 40)).toBe(false);

    // 2 hours earlier (no conflict)
    expect(isAppointmentConflicting('2026-11-21T13:00:00+05:30', existingTimes, 40)).toBe(false);
  });

  it('generates slots strictly within working hours (10:00 to 18:00 IST)', () => {
    const dateStr = '2026-12-01';
    const slots = generateAvailableSlots(dateStr, { start: '10:00', end: '18:00' }, [], 45);

    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0].time).toBe('10:00');
    // Last slot starting before 18:00
    const lastSlot = slots[slots.length - 1];
    const [h, m] = lastSlot.time.split(':').map(Number);
    expect(h * 60 + m + 45).toBeLessThanOrEqual(18 * 60);
  });

  it('hides already-booked slots in available slot generation', () => {
    const dateStr = '2026-12-01';
    const bookedTime = '2026-12-01T11:30:00+05:30';
    const slots = generateAvailableSlots(dateStr, { start: '10:00', end: '18:00' }, [bookedTime], 45);

    const conflictingSlot = slots.find((s) => s.time === '11:30');
    expect(conflictingSlot?.isAvailable).toBe(false);

    const openSlot = slots.find((s) => s.time === '10:00');
    expect(openSlot?.isAvailable).toBe(true);
  });

  it('generates 30-minute slots between 11:00 AM and 7:00 PM and marks booked slots', () => {
    const dateStr = '2026-12-15';
    const bookedTime = '2026-12-15T14:30:00+05:30';
    const slots = generateAvailableSlots(dateStr, { start: '11:00', end: '19:00' }, [bookedTime], 30);

    expect(slots[0].time).toBe('11:00');
    expect(slots[0].displayTime).toBe('11:00 AM');
    expect(slots[1].time).toBe('11:30');
    expect(slots[1].displayTime).toBe('11:30 AM');

    const bookedSlot = slots.find((s) => s.time === '14:30');
    expect(bookedSlot?.isBooked).toBe(true);
    expect(bookedSlot?.isAvailable).toBe(false);

    // Last slot starts at 18:30 (finishes by 19:00)
    const lastSlot = slots[slots.length - 1];
    expect(lastSlot.time).toBe('18:30');
    expect(lastSlot.displayTime).toBe('6:30 PM');
  });
});
