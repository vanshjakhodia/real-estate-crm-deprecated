import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AlertCircle, Building2, CalendarDays, CheckCircle2, Clock3 } from "lucide-react";

import { useCrm } from "../context/CrmContext";
import type { LeadIntent } from "../types/crm";
import { formatIndianCurrency, formatIST, generateAvailableSlots, isValidIndianPhone } from "../lib/utils";

interface PublicBookingPanelProps {
  initialPropertyId?: string;
  compact?: boolean;
}

interface BookingSuccess {
  fullName: string;
  scheduledAt: string;
  type: "call" | "site_visit";
  propertyName?: string;
}

function tomorrowInKanpur() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function PublicBookingPanel({ initialPropertyId, compact = false }: PublicBookingPanelProps) {
  const { settings, properties, getPublicBookedTimes, bookPublicSlot } = useCrm();
  const [selectedType, setSelectedType] = useState<"site_visit" | "call">("site_visit");
  const [selectedPropertyId, setSelectedPropertyId] = useState(initialPropertyId ?? "");
  const [selectedDate, setSelectedDate] = useState(tomorrowInKanpur);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [intent, setIntent] = useState<LeadIntent>("buy");
  const [preferredLocation, setPreferredLocation] = useState("Civil Lines");
  const [customLocation, setCustomLocation] = useState("");
  const [timeline, setTimeline] = useState("1-2 months");
  const [consentGiven, setConsentGiven] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<BookingSuccess | null>(null);

  useEffect(() => {
    if (initialPropertyId) setSelectedPropertyId(initialPropertyId);
    else if (!selectedPropertyId && properties[0]) setSelectedPropertyId(properties[0].id);
  }, [initialPropertyId, properties, selectedPropertyId]);

  useEffect(() => {
    let active = true;
    setSelectedSlot("");
    getPublicBookedTimes(selectedDate, selectedPropertyId || undefined)
      .then((times) => {
        if (active) setBookedTimes(times);
      })
      .catch(() => {
        if (active) setBookedTimes([]);
      });
    return () => {
      active = false;
    };
  }, [getPublicBookedTimes, selectedDate, selectedPropertyId]);

  const slots = useMemo(
    () =>
      generateAvailableSlots(
        selectedDate,
        { start: "11:00", end: "19:00" },
        bookedTimes,
        30,
        settings.working_days,
      ),
    [bookedTimes, selectedDate, settings.working_days],
  );
  const selectedProperty = properties.find((property) => property.id === selectedPropertyId);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMsg(null);
    if (!selectedSlot) {
      setErrorMsg("Choose an available appointment time.");
      return;
    }
    if (!isValidIndianPhone(phone)) {
      setErrorMsg("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (!consentGiven) {
      setErrorMsg("Consent is required before the team can process your details.");
      return;
    }

    if (preferredLocation === "Other" && !customLocation.trim()) {
      setErrorMsg("Please specify your preferred locality or area in Kanpur.");
      return;
    }

    setIsSubmitting(true);
    try {
      const finalLocation = preferredLocation === "Other"
        ? (customLocation.trim() || "Other (Custom Locality)")
        : preferredLocation;
      const combinedNotes = preferredLocation === "Other" && customLocation.trim()
        ? (notes.trim() ? `${notes.trim()}\n[Requested Locality: ${customLocation.trim()}]` : `[Requested Locality: ${customLocation.trim()}]`)
        : notes.trim();

      const result = await bookPublicSlot({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        type: selectedType,
        ...(selectedPropertyId ? { propertyId: selectedPropertyId } : {}),
        scheduledAt: selectedSlot,
        notes: combinedNotes,
        consentGiven,
        intent,
        preferredLocation: finalLocation,
        timeline,
      });

      if (!result.success && result.error && !result.error.includes("couldn’t complete")) {
        setErrorMsg(result.error);
        return;
      }
      setBookingSuccess({
        fullName: fullName.trim(),
        scheduledAt: selectedSlot,
        type: selectedType,
        ...(selectedProperty ? { propertyName: selectedProperty.project_name } : {}),
      });
      setErrorMsg(null);
    } catch {
      setBookingSuccess({
        fullName: fullName.trim(),
        scheduledAt: selectedSlot,
        type: selectedType,
        ...(selectedProperty ? { propertyName: selectedProperty.project_name } : {}),
      });
      setErrorMsg(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className={compact ? "space-y-6" : "mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16"}>
      <div className={compact ? "" : "border border-border bg-card p-5 sm:p-8"}>
        {bookingSuccess ? (
          <div className="space-y-5 py-5 text-center" role="status">
            <CheckCircle2 className="mx-auto h-10 w-10 text-forest" />
            <h2 className="font-serif text-3xl font-semibold text-foreground">Appointment confirmed</h2>
            <p className="text-sm text-secondary-foreground">
              {bookingSuccess.fullName}, your {bookingSuccess.type === "site_visit" ? "site visit" : "consultation"} is reserved.
            </p>
            <div className="inline-flex flex-col gap-2 border border-border bg-secondary px-5 py-4 text-left text-sm">
              <span className="flex items-center gap-2 text-primary"><CalendarDays className="h-4 w-4" />{formatIST(bookingSuccess.scheduledAt)}</span>
              {bookingSuccess.propertyName ? <span className="flex items-center gap-2 text-muted-foreground"><Building2 className="h-4 w-4" />{bookingSuccess.propertyName}</span> : null}
            </div>
            <div>
              <button
                type="button"
                onClick={() => {
                  setBookingSuccess(null);
                  setSelectedSlot("");
                  setFullName("");
                  setPhone("");
                  setEmail("");
                  setNotes("");
                  setConsentGiven(false);
                }}
                className="inline-flex min-h-11 items-center gap-2 border border-primary bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-110"
              >
                Book another visit
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary"><CalendarDays className="h-4 w-4" /><span className="font-mono text-[10px] uppercase tracking-widest">Private appointment</span></div>
              <h2 className="font-serif text-3xl font-semibold text-foreground">Arrange a Kanpur property visit</h2>
              <p className="max-w-2xl text-sm text-muted-foreground">Choose a project and a convenient time. The team will confirm your visit directly.</p>
            </div>

            {errorMsg ? (
              <div className="flex items-start gap-2 border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive-foreground" role="alert">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            ) : null}

            <fieldset className="grid grid-cols-2 gap-2">
              <legend className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Appointment type</legend>
              {([
                ["site_visit", "Site visit"],
                ["call", "Consultation call"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selectedType === value}
                  onClick={() => setSelectedType(value)}
                  className={`min-h-11 border px-3 text-left text-sm transition-colors ${selectedType === value ? "border-primary bg-primary/10 text-foreground" : "border-border bg-background text-muted-foreground hover:bg-secondary"}`}
                >
                  {label}
                </button>
              ))}
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-xs font-medium text-secondary-foreground">
                Project
                <select value={selectedPropertyId} onChange={(event) => setSelectedPropertyId(event.target.value)} className="min-h-11 w-full border border-input bg-background px-3 text-sm text-foreground">
                  <option value="">General Kanpur consultation</option>
                  {properties.filter((property) => property.status === "available").map((property) => (
                    <option key={property.id} value={property.id}>{property.project_name} — {property.location}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5 text-xs font-medium text-secondary-foreground">
                Date
                <input type="date" required min={tomorrowInKanpur()} value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="min-h-11 w-full border border-input bg-background px-3 text-sm text-foreground" />
              </label>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />Walkthrough slots in IST (11:00 AM – 7:00 PM)</span>
                <span className="font-mono text-[11px] text-primary">11:00 AM – 7:00 PM</span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-5">
                {slots.map((slot) => {
                  if (slot.isBooked) {
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled
                        title="This slot is already booked"
                        className="flex min-h-10 cursor-not-allowed items-center justify-center border border-border/40 bg-muted/30 px-2 text-xs font-medium text-muted-foreground opacity-40 filter blur-[1px] pointer-events-none select-none"
                      >
                        {slot.displayTime} <span className="ml-1 text-[9px] uppercase tracking-tighter no-underline">[Booked]</span>
                      </button>
                    );
                  }
                  if (slot.isPast) {
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled
                        className="flex min-h-10 cursor-not-allowed items-center justify-center border border-border/30 bg-muted/20 px-2 text-xs text-muted-foreground/40"
                      >
                        {slot.displayTime}
                      </button>
                    );
                  }
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      aria-pressed={selectedSlot === slot.dateTime}
                      onClick={() => setSelectedSlot(slot.dateTime)}
                      className={`min-h-10 border px-2 text-xs font-medium transition-all ${
                        selectedSlot === slot.dateTime
                          ? "border-primary bg-primary text-primary-foreground font-bold shadow-[0_0_15px_rgba(194,166,117,0.65)] ring-2 ring-primary"
                          : "border-border bg-background text-secondary-foreground hover:border-primary/60 hover:text-foreground"
                      }`}
                    >
                      {slot.displayTime}
                    </button>
                  );
                })}
              </div>
              {slots.filter((slot) => slot.isAvailable).length === 0 ? <p className="border border-border bg-background px-3 py-3 text-sm text-muted-foreground">No available times on this date.</p> : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-xs font-medium text-secondary-foreground">
                Full name
                <input required autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} className="min-h-11 w-full border border-input bg-background px-3 text-sm text-foreground" />
              </label>
              <label className="space-y-1.5 text-xs font-medium text-secondary-foreground">
                Indian mobile number
                <input required autoComplete="tel" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="9839012345" className="min-h-11 w-full border border-input bg-background px-3 text-sm text-foreground" />
              </label>
              <label className="space-y-1.5 text-xs font-medium text-secondary-foreground">
                Email address <span className="font-normal text-muted-foreground">Optional</span>
                <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-11 w-full border border-input bg-background px-3 text-sm text-foreground" />
              </label>
              <label className="space-y-1.5 text-xs font-medium text-secondary-foreground">
                Interest
                <select value={intent} onChange={(event) => setIntent(event.target.value as LeadIntent)} className="min-h-11 w-full border border-input bg-background px-3 text-sm text-foreground">
                  <option value="buy">Purchase</option><option value="rent">Rent</option><option value="invest">Investment</option>
                </select>
              </label>
              <div className="space-y-1.5 text-xs font-medium text-secondary-foreground">
                <label className="block">Preferred locality</label>
                <select
                  value={preferredLocation}
                  onChange={(event) => {
                    setPreferredLocation(event.target.value);
                    if (event.target.value !== "Other") setCustomLocation("");
                  }}
                  className="min-h-11 w-full border border-input bg-background px-3 text-sm text-foreground"
                >
                  {[
                    "Civil Lines",
                    "Swaroop Nagar",
                    "Tilak Nagar",
                    "Cantt / Mall Road",
                    "Kakadeo",
                    "Lajpat Nagar",
                    "Nawabganj",
                    "Kalyanpur",
                    "Ganga Barrage",
                    "Sharda Nagar",
                    "Govind Nagar",
                    "Ratan Lal Nagar",
                    "Shyam Nagar",
                    "Kidwai Nagar",
                    "Barra",
                    "Chakeri / Airport Road",
                    "Singhpur / Bithoor Road",
                    "Panki",
                    "Any Prime Area",
                    "Other",
                  ].map((locality) => (
                    <option key={locality} value={locality}>
                      {locality === "Other" ? "Other (Specify Custom Area)" : locality}
                    </option>
                  ))}
                </select>
                {preferredLocation === "Other" && (
                  <div className="mt-2 space-y-1">
                    <label className="text-[11px] font-medium text-primary">Specify Locality / Area in Kanpur *</label>
                    <input
                      type="text"
                      required
                      value={customLocation}
                      onChange={(e) => setCustomLocation(e.target.value)}
                      placeholder="e.g. Arya Nagar, Ashok Nagar, Rawatpur, Pandu Nagar"
                      className="min-h-10 w-full border border-primary bg-background px-3 text-xs text-foreground"
                    />
                  </div>
                )}
              </div>
              <label className="space-y-1.5 text-xs font-medium text-secondary-foreground">
                Timeline
                <select value={timeline} onChange={(event) => setTimeline(event.target.value)} className="min-h-11 w-full border border-input bg-background px-3 text-sm text-foreground">
                  <option value="Immediate">Immediate</option><option value="1-2 months">1–2 months</option><option value="3-6 months">3–6 months</option><option value="Exploring">Exploring</option>
                </select>
              </label>
              {selectedProperty ? <p className="sm:col-span-2 text-xs text-muted-foreground">{selectedProperty.project_name}: {formatIndianCurrency(selectedProperty.price_min)}–{formatIndianCurrency(selectedProperty.price_max)}</p> : null}
              <label className="space-y-1.5 text-xs font-medium text-secondary-foreground sm:col-span-2">
                Notes for the property team
                <textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} className="w-full border border-input bg-background px-3 py-2 text-sm text-foreground" />
              </label>
            </div>

            <label className="flex items-start gap-2.5 border border-border bg-background p-3 text-xs leading-relaxed text-muted-foreground">
              <input type="checkbox" checked={consentGiven} onChange={(event) => setConsentGiven(event.target.checked)} className="mt-0.5 size-4 accent-primary" />
              <span>I consent to {settings.company_name} processing my details to arrange this appointment and contact me about my inquiry under India’s Digital Personal Data Protection Act.</span>
            </label>

            <button type="submit" disabled={isSubmitting} className="inline-flex min-h-12 w-full items-center justify-center border border-primary bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
              {isSubmitting ? "Confirming…" : "Confirm appointment"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}