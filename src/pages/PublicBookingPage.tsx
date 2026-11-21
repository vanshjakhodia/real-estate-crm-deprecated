import React, { useState, useMemo } from 'react';
import { useCrm } from '../context/CrmContext';
import {
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  ArrowRight,
  Phone,
  Mail,
  User,
  AlertCircle
} from 'lucide-react';
import { generateAvailableSlots, formatIndianCurrency, formatIST, isValidIndianPhone } from '../lib/utils';

interface PublicBookingPageProps {
  onBackToApp?: () => void;
}

export const PublicBookingPage: React.FC<PublicBookingPageProps> = ({ onBackToApp }) => {
  const { settings, properties, appointments, bookPublicSlot } = useCrm();

  // Booking Form State
  const [selectedType, setSelectedType] = useState<'site_visit' | 'call'>('site_visit');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(properties[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Tomorrow as default
    const tomorrow = new Date(Date.now() + 86400000);
    return tomorrow.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Compute available slots for selected date
  const availableSlots = useMemo(() => {
    if (!selectedDate) return [];
    const bookedTimes = appointments
      .filter((a) => a.status === 'booked' && (!selectedPropertyId || a.property_id === selectedPropertyId))
      .map((a) => a.scheduled_at);

    return generateAvailableSlots(
      selectedDate,
      { start: settings.working_hours_start, end: settings.working_hours_end },
      bookedTimes,
      45
    );
  }, [selectedDate, selectedPropertyId, appointments, settings]);

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedSlot) {
      setErrorMsg('Please select an available appointment time slot.');
      return;
    }

    if (!fullName.trim()) {
      setErrorMsg('Please provide your full name.');
      return;
    }

    if (!isValidIndianPhone(phone)) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number (e.g. 9839012345).');
      return;
    }

    if (!consentGiven) {
      setErrorMsg('Please tick the consent checkbox to permit our team to contact you.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = bookPublicSlot({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        type: selectedType,
        propertyId: selectedPropertyId || undefined,
        scheduledAt: selectedSlot,
        notes: notes.trim(),
        consentGiven: true
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to book slot.');
      } else {
        setBookingSuccess({
          name: fullName,
          slot: selectedSlot,
          type: selectedType,
          property: selectedProperty?.project_name
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error booking appointment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto w-full space-y-6">
        {/* Header Branding */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                {settings.company_name}
              </h1>
              <p className="text-xs text-amber-400 font-medium">
                Official Kanpur Site Visit & Consultation Portal
              </p>
            </div>
          </div>

          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              Back to CRM
            </button>
          )}
        </div>

        {/* Confirmation State */}
        {bookingSuccess ? (
          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-950/40 p-8 text-center space-y-4 backdrop-blur-md shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-black text-white">Appointment Confirmed!</h2>
            <p className="text-sm text-slate-300 max-w-md mx-auto">
              Thank you, <strong>{bookingSuccess.name}</strong>. Your{' '}
              {bookingSuccess.type === 'site_visit' ? 'Site Visit' : 'Consultation Call'} has been reserved for:
            </p>

            <div className="inline-block rounded-2xl border border-emerald-500/30 bg-slate-900/80 px-6 py-4 text-left space-y-1">
              <div className="text-xs text-amber-400 font-bold uppercase tracking-wider">Scheduled Time (IST)</div>
              <div className="text-base font-bold text-white">{formatIST(bookingSuccess.slot)}</div>
              {bookingSuccess.property && (
                <div className="text-xs text-slate-300">Project: {bookingSuccess.property}</div>
              )}
            </div>

            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Our Kanpur real estate advisor will send you property directions and confirmation via WhatsApp shortly.
            </p>

            <button
              onClick={() => {
                setBookingSuccess(null);
                setSelectedSlot('');
                setFullName('');
                setPhone('');
                setEmail('');
              }}
              className="mt-4 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
            >
              Book Another Visit
            </button>
          </div>
        ) : (
          /* Booking Form */
          <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-800 bg-slate-800/50 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white sm:text-xl">
                Schedule a Private Site Visit or Consultation
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Explore premium 3 & 4 BHK residences, plots and commercial projects across Kanpur.
              </p>
            </div>

            {errorMsg && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-950/40 p-3.5 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Step 1: Visit Type */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                1. Select Experience Type
              </label>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedType('site_visit')}
                  className={`flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all ${
                    selectedType === 'site_visit'
                      ? 'border-amber-500 bg-amber-500/10 text-white shadow-sm'
                      : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <span className="font-bold text-white text-sm">🏢 In-Person Site Visit</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">Walk through sample flat & site location in Kanpur</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedType('call')}
                  className={`flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all ${
                    selectedType === 'call'
                      ? 'border-amber-500 bg-amber-500/10 text-white shadow-sm'
                      : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <span className="font-bold text-white text-sm">📞 Phone Consultation</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">30-min call on pricing, RERA & layouts</span>
                </button>
              </div>
            </div>

            {/* Step 2: Property Selection */}
            {properties.length > 0 ? (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  2. Project of Interest
                </label>
                <select
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900 p-3 text-xs text-white focus:border-amber-500 focus:outline-none"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.project_name} — {p.location} ({formatIndianCurrency(p.price_min)} - {formatIndianCurrency(p.price_max)})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  2. Consultation Scope
                </label>
                <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-3 text-xs text-slate-300">
                  General Real Estate Inquiries & Property Advisory across Kanpur
                </div>
              </div>
            )}

            {/* Step 3: Date & Slot Picker */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  3. Pick Date & Available Slot
                </label>
                <span className="text-[11px] text-slate-400">
                  Hours: {settings.working_hours_start} - {settings.working_hours_end} IST
                </span>
              </div>

              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlot('');
                }}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 p-3 text-xs text-white focus:border-amber-500 focus:outline-none"
              />

              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400 font-medium">Select Slot (Conflicting & unavailable slots are hidden):</span>
                {availableSlots.length === 0 ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-center text-xs text-slate-400">
                    No open slots remaining for this date. Please pick another date.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availableSlots.map((slot) => {
                      if (!slot.isAvailable) return null; // Hidden per requirements!
                      const isSelected = selectedSlot === slot.dateTime;
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          onClick={() => setSelectedSlot(slot.dateTime)}
                          className={`rounded-xl border p-2 text-center text-xs font-semibold transition-all ${
                            isSelected
                              ? 'border-amber-500 bg-amber-500 text-slate-950 shadow-md font-bold'
                              : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
                          }`}
                        >
                          {slot.time}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Step 4: Contact Information */}
            <div className="space-y-3 border-t border-slate-800 pt-5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                4. Your Contact Details
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-300">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alok Mishra"
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300">Indian Mobile Number (+91) *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9839012345"
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-300">Email Address (Optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300">Specific Requirements</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Interested in 3 BHK high floor unit"
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* DPDP Compliance Checkbox */}
              <div className="flex items-start gap-2.5 rounded-2xl border border-slate-700 bg-slate-900/60 p-3.5 text-xs">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-700 text-amber-500 focus:ring-amber-400"
                />
                <label htmlFor="consent" className="text-slate-400 text-[11px] leading-relaxed">
                  I consent to {settings.company_name} contacting me via Phone/WhatsApp regarding my property inquiry under India's Digital Personal Data Protection (DPDP) Act. You may opt out anytime.
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 text-center text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:to-amber-500 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Confirming Reservation...' : 'Confirm Appointment'}
            </button>
          </form>
        )}

        <div className="text-center text-xs text-slate-500">
          Lineage Properties Pvt Ltd • Licensed & RERA registered projects in Kanpur, Uttar Pradesh
        </div>
      </div>
    </div>
  );
};
