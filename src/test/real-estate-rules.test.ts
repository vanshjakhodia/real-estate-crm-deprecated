import { describe, expect, it } from "vitest";

import { isAppointmentConflicting, generateAvailableSlots } from "@/features/real-estate/lib/utils";
import { calculateKanpurStampDuty } from "@/features/real-estate/lib/kanpurMarketData";

describe("Lineage Properties Pvt Ltd operating rules", () => {
  it("blocks appointments within the 40-minute collision window, including the boundary", () => {
    const booked = ["2030-12-01T10:00:00+05:30"];

    expect(isAppointmentConflicting("2030-12-01T10:40:00+05:30", booked, 40)).toBe(true);
    expect(isAppointmentConflicting("2030-12-01T10:41:00+05:30", booked, 40)).toBe(false);
  });

  it("offers 30-minute slots inside the 10:00–18:00 IST operating window", () => {
    const slots = generateAvailableSlots("2030-12-01", { start: "10:00", end: "18:00" }, [], 30);
    const firstSlot = slots[0];
    const lastSlot = slots[slots.length - 1];

    expect(firstSlot?.time).toBe("10:00");
    expect(lastSlot?.time).toBe("17:30");
    expect(slots).toHaveLength(16);
  });

  it("does not offer public appointment slots on a non-working day", () => {
    const slots = generateAvailableSlots(
      "2030-12-01",
      { start: "10:00", end: "18:00" },
      [],
      30,
      ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    );

    expect(slots).toHaveLength(0);
  });

  it("preserves the source calculator's Kanpur duty percentages", () => {
    const maleBuyer = calculateKanpurStampDuty(10_000_000, "male");
    const femaleBuyer = calculateKanpurStampDuty(10_000_000, "female");
    const jointBuyer = calculateKanpurStampDuty(10_000_000, "joint");

    expect(maleBuyer.totalGovtFees).toBe(800_000);
    expect(femaleBuyer.totalGovtFees).toBe(700_000);
    expect(jointBuyer.totalGovtFees).toBe(750_000);
  });
});