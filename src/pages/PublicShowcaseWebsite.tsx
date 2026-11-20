import React, { useState, useEffect, useMemo } from 'react';
import { useCrm } from '../context/CrmContext';
import {
  Building2,
  Calendar,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Lock,
  Clock,
  User,
  Phone,
  Mail,
  Compass,
  Briefcase,
  X,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  LogOut,
  ChevronDown
} from 'lucide-react';
import {
  generateAvailableSlots,
  formatIndianCurrency,
  formatIST,
  isValidIndianPhone,
  formatTime12h
} from '../lib/utils';
import { LeadIntent } from '../types/crm';

interface PublicShowcaseWebsiteProps {
  onOpenCrm: () => void;
}

interface ClientUser {
  id: string;
  fullName: string;
  phone: string;
  email: string;
}

export const PublicShowcaseWebsite: React.FC<PublicShowcaseWebsiteProps> = ({ onOpenCrm }) => {
  const { settings, properties, appointments, bookPublicSlot, switchUser, teamMembers } = useCrm();

  // Client Session (Stored in localStorage for persistent client portal access)
  const [clientUser, setClientUser] = useState<ClientUser | null>(() => {
    try {
      const saved = localStorage.getItem('kanpur_client_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Owner secret shortcut: Ctrl+Shift+A or Cmd+Shift+A
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setIsStaffLoginModalOpen(true);
      }
    };

    // Check if owner navigated directly to /admin or #admin
    if (
      window.location.hash === '#admin' ||
      window.location.pathname.includes('/admin') ||
      window.location.search.includes('admin')
    ) {
      setIsStaffLoginModalOpen(true);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [isClientAuthModalOpen, setIsClientAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'signin' | 'register'>('register');
  const [isMyAppointmentsModalOpen, setIsMyAppointmentsModalOpen] = useState(false);
  const [isStaffLoginModalOpen, setIsStaffLoginModalOpen] = useState(false);

  // Client Auth Form State
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Owner Master PIN Security Gate (Strict PIN: 14241700)
  const [ownerPin, setOwnerPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [ownerPinError, setOwnerPinError] = useState<string | null>(null);

  // Filter & Booking Form State
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'site_visit' | 'call'>('site_visit');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const tomorrow = new Date(Date.now() + 86400000);
    return tomorrow.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [hideBookedSlots, setHideBookedSlots] = useState<boolean>(false);

  // Client Details
  const [fullName, setFullName] = useState(clientUser?.fullName || '');
  const [phone, setPhone] = useState(clientUser?.phone || '');
  const [email, setEmail] = useState(clientUser?.email || '');
  const [intent, setIntent] = useState<LeadIntent>('buy');
  const [preferredLocation, setPreferredLocation] = useState<string>('Civil Lines');
  const [budgetMin, setBudgetMin] = useState<number>(10000000);
  const [budgetMax, setBudgetMax] = useState<number>(25000000);
  const [timeline, setTimeline] = useState<string>('1 - 2 Months');
  const [notes, setNotes] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Keep form fields synced if clientUser changes
  useEffect(() => {
    if (clientUser) {
      if (!fullName) setFullName(clientUser.fullName);
      if (!phone) setPhone(clientUser.phone);
      if (!email) setEmail(clientUser.email);
    }
  }, [clientUser]);

  const filteredProperties = properties.filter((p) => {
    if (selectedLocation === 'all') return true;
    return p.location.toLowerCase().includes(selectedLocation.toLowerCase());
  });

  // Real-Time 30-Minute Time Slots (11:00 AM to 7:00 PM)
  const allSlots = useMemo(() => {
    if (!selectedDate) return [];
    const bookedTimes = appointments
      .filter((a) => a.status === 'booked' && (!selectedPropertyId || a.property_id === selectedPropertyId))
      .map((a) => a.scheduled_at);

    return generateAvailableSlots(
      selectedDate,
      { start: '11:00', end: '19:00' },
      bookedTimes,
      30
    );
  }, [selectedDate, selectedPropertyId, appointments]);

  const displayedSlots = useMemo(() => {
    if (hideBookedSlots) {
      return allSlots.filter((s) => s.isAvailable);
    }
    return allSlots;
  }, [allSlots, hideBookedSlots]);

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);

  // Client Appointments (Filtered by logged-in client phone/email or current phone)
  const clientAppointments = useMemo(() => {
    const searchPhone = clientUser?.phone || phone;
    const searchEmail = clientUser?.email || email;
    if (!searchPhone && !searchEmail) return [];

    return appointments.filter((apt) => {
      // Check if attached lead matches
      const lead = apt.lead;
      if (!lead) return false;
      const phoneMatch = searchPhone && lead.phone && lead.phone.includes(searchPhone.replace(/[^0-9]/g, '').slice(-10));
      const emailMatch = searchEmail && lead.email && lead.email.toLowerCase() === searchEmail.toLowerCase();
      return phoneMatch || emailMatch;
    });
  }, [appointments, clientUser, phone, email]);

  // Client Authentication Handlers
  const handleClientRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!authName.trim()) {
      setAuthError('Please enter your full legal name.');
      return;
    }
    if (!isValidIndianPhone(authPhone)) {
      setAuthError('Please enter a valid 10-digit Indian phone number.');
      return;
    }
    if (!authEmail.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    const newClient: ClientUser = {
      id: `client-${Date.now()}`,
      fullName: authName.trim(),
      phone: authPhone.trim(),
      email: authEmail.trim()
    };

    localStorage.setItem('kanpur_client_session', JSON.stringify(newClient));
    setClientUser(newClient);
    setFullName(newClient.fullName);
    setPhone(newClient.phone);
    setEmail(newClient.email);
    setIsClientAuthModalOpen(false);
  };

  const handleClientSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!authPhone.trim() && !authEmail.trim()) {
      setAuthError('Please enter your registered phone number or email.');
      return;
    }

    const client: ClientUser = {
      id: `client-${Date.now()}`,
      fullName: authName || 'Kanpur Private Client',
      phone: authPhone.trim() || '9839012345',
      email: authEmail.trim() || 'client@example.com'
    };

    localStorage.setItem('kanpur_client_session', JSON.stringify(client));
    setClientUser(client);
    setFullName(client.fullName);
    setPhone(client.phone);
    setEmail(client.email);
    setIsClientAuthModalOpen(false);
  };

  const handleClientSignOut = () => {
    localStorage.removeItem('kanpur_client_session');
    setClientUser(null);
  };

  // Owner Master PIN Verification Handler (Strict PIN: 14241700)
  const handleOwnerPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOwnerPinError(null);

    // Strictly verify Owner PIN 14241700
    if (ownerPin.trim() === '14241700') {
      const adminMember = teamMembers.find((m) => m.role === 'admin') || teamMembers[0];
      if (adminMember) switchUser(adminMember.id);
      localStorage.setItem('kanpur_crm_owner_auth', 'true');
      setIsStaffLoginModalOpen(false);
      setOwnerPin('');
      onOpenCrm();
    } else {
      setOwnerPinError('Access Denied: Invalid Master PIN. Only the owner has authorization.');
      setOwnerPin('');
    }
  };

  // Walkthrough & Inquiry Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedSlot) {
      setErrorMsg('Please select a 30-minute time slot (11:00 AM – 7:00 PM).');
      return;
    }

    if (!isValidIndianPhone(phone)) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!consentGiven) {
      setErrorMsg('Consent under the Digital Personal Data Protection (DPDP) Act is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const scheduledAt = `${selectedDate}T${selectedSlot}:00+05:30`;
      const res = bookPublicSlot({
        fullName,
        phone,
        email,
        type: selectedType,
        propertyId: selectedPropertyId || undefined,
        scheduledAt,
        notes,
        consentGiven,
        intent,
        preferredLocation,
        budgetMin,
        budgetMax,
        timeline
      });

      if (res.success) {
        setBookingSuccess({
          fullName,
          phone,
          scheduledAt,
          type: selectedType,
          property: selectedProperty,
          slot: selectedSlot
        });

        // If not logged in, automatically save client session for easy tracking
        if (!clientUser) {
          const autoClient: ClientUser = {
            id: `client-${Date.now()}`,
            fullName,
            phone,
            email
          };
          localStorage.setItem('kanpur_client_session', JSON.stringify(autoClient));
          setClientUser(autoClient);
        }
      } else {
        setErrorMsg(res.error || 'Failed to reserve appointment.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error recording appointment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#11100E] text-[#EAE5D9] font-sans selection:bg-[#B89758] selection:text-[#11100E]">
      {/* ==================================================================== */}
      {/* 1. PUBLIC HEADER NAVIGATION */}
      {/* ==================================================================== */}
      <header className="sticky top-0 z-40 border-b border-[#2C2720] bg-[#14120F]/95 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Identity */}
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#231F19] text-[#C2A675] border border-[#443C2F] shadow-sm">
              <Building2 className="h-6 w-6 stroke-[1.8]" />
            </div>
            <div>
              <div className="font-serif text-xl font-bold tracking-normal text-[#F4EFE6] sm:text-2xl">
                {settings.company_name}
              </div>
              <p className="text-[10px] font-mono tracking-widest uppercase text-[#8C8477]">
                Kanpur, Uttar Pradesh • Private Client Concierge
              </p>
            </div>
          </div>

          {/* Right Header Navigation & Client Authentication (Only Client UI visible) */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="#book"
              className="hidden md:inline-flex rounded-lg border border-[#3E3528] bg-[#1E1C18] px-3.5 py-2 text-xs font-medium text-[#D5CEBF] hover:bg-[#28241E] hover:text-[#F4EFE6] transition-all"
            >
              Schedule Walkthrough
            </a>

            {/* Client Account Area */}
            {clientUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMyAppointmentsModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-[#3E3528] bg-[#221F1A] px-3 py-2 text-xs font-medium text-[#C2A675] hover:bg-[#2A2620] transition-all"
                  title="View your booked site visits and consultations"
                >
                  <Calendar className="h-3.5 w-3.5 text-[#C2A675]" />
                  <span className="hidden sm:inline">My Engagements</span>
                  <span className="sm:hidden">Visits</span>
                </button>

                <div className="hidden sm:flex items-center gap-2 pl-1 text-xs text-[#A8A194]">
                  <span className="truncate max-w-[120px] font-medium text-[#F4EFE6]">
                    {clientUser.fullName.split(' ')[0]}
                  </span>
                  <button
                    onClick={handleClientSignOut}
                    className="p-1.5 text-[#8C8477] hover:text-[#BFA0A0]"
                    title="Sign Out"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthTab('register');
                  setIsClientAuthModalOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-[#3E3528] bg-[#1E1C18] px-3.5 py-2 text-xs font-medium text-[#C2A675] hover:bg-[#28241E] transition-all"
              >
                <User className="h-3.5 w-3.5" />
                <span>Client Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 2. HERO SECTION */}
      {/* ==================================================================== */}
      <section className="relative overflow-hidden py-16 sm:py-24 lg:py-28 border-b border-[#2C2720]/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded px-3 py-1 text-xs font-mono tracking-widest uppercase badge-gold font-sans">
              <Sparkles className="h-3.5 w-3.5 text-[#C2A675]" />
              <span>Verified Kanpur Prime Real Estate • Fiduciary Advisory</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#F4EFE6] leading-tight">
              Curated Estates & Prime Acquisitions in Kanpur.
            </h1>

            <p className="text-base sm:text-lg text-[#C8C2B5] leading-relaxed">
              Representing prime residential developments, luxury riverfront residences, and high-yield commercial
              corridors across Civil Lines, Swaroop Nagar, Kalyanpur, and Tilak Nagar.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <a
                href="#book"
                className="flex items-center gap-2 rounded-lg bg-[#C2A675] hover:bg-[#B39562] px-6 py-3 text-sm font-semibold text-[#11100E] border border-[#A68A56] transition-all shadow-md"
              >
                <span>Schedule Private Walkthrough</span>
                <ArrowRight className="h-4 w-4" />
              </a>

              <a
                href="#portfolio"
                className="flex items-center gap-2 rounded-lg border border-[#3E3528] bg-[#1E1C18] hover:bg-[#28241E] px-5 py-3 text-sm font-medium text-[#D5CEBF] transition-all"
              >
                <span>View Curated Estates</span>
              </a>
            </div>

            {/* Fiduciary Credentials */}
            <div className="pt-6 border-t border-[#25211B] grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-[#8C8477]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#C2A675]" />
                <span>UP RERA Verified Filings</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#C2A675]" />
                <span>Private 1-on-1 Walkthroughs</span>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-[#C2A675]" />
                <span>Clean Clear Titles</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 3. CURATED PORTFOLIO SHOWCASE */}
      {/* ==================================================================== */}
      <section id="portfolio" className="border-b border-[#2C2720] bg-[#14120F] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-[#C2A675]">Curated Portfolio</span>
              <h2 className="font-serif text-3xl font-bold text-[#F4EFE6] mt-1">Prime Kanpur Developments</h2>
              <p className="text-xs text-[#8C8477] mt-1">Verified titles and authorized UP RERA filings.</p>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setSelectedLocation('all')}
                className={`rounded-lg px-3 py-1.5 transition-all ${
                  selectedLocation === 'all'
                    ? 'bg-[#C2A675] text-[#11100E] font-semibold'
                    : 'border border-[#332D24] bg-[#161411] text-[#A8A194]'
                }`}
              >
                All Localities
              </button>
              {['Civil Lines', 'Swaroop Nagar', 'Kalyanpur', 'Tilak Nagar'].map((loc) => (
                <button
                  key={loc}
                  onClick={() => setSelectedLocation(loc)}
                  className={`rounded-lg px-3 py-1.5 transition-all whitespace-nowrap ${
                    selectedLocation === loc
                      ? 'bg-[#C2A675] text-[#11100E] font-semibold'
                      : 'border border-[#332D24] bg-[#161411] text-[#A8A194]'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          {filteredProperties.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#2C2720] bg-[#11100E] p-12 text-center text-xs text-[#736B5F]">
              <Building2 className="mx-auto h-8 w-8 text-[#5A5347] mb-2" />
              <p className="font-serif font-bold text-[#EAE5D9] text-base">Portfolio Updating</p>
              <p className="text-[#8C8477] mt-1">
                Active estates are registered directly via the CRM Estate Portfolio desk. You can still schedule an open consultation below.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((prop) => (
                <div
                  key={prop.id}
                  className="flex flex-col justify-between rounded-xl border border-[#332D24] bg-[#161411] p-6 shadow-xl hover:border-[#4B4032] transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-[#C2A675]">{prop.property_type}</span>
                      <span className="font-mono text-[10px] text-[#8C8477]">
                        RERA: {prop.rera_number || 'Under Verification'}
                      </span>
                    </div>

                    <h3 className="font-serif text-xl font-bold text-[#F4EFE6] mt-2">{prop.project_name}</h3>
                    <p className="text-xs text-[#A8A194] flex items-center gap-1 mt-1">
                      <MapPin className="h-3.5 w-3.5 text-[#C2A675]" />
                      <span>{prop.location}</span>
                    </p>

                    <div className="mt-4 pt-3 border-t border-[#26221B] grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-[10px] font-mono text-[#736B5F] uppercase">Config</div>
                        <div className="font-medium text-[#EAE5D9] mt-0.5">{prop.bhk || 'Residential'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-[#736B5F] uppercase">Carpet Area</div>
                        <div className="font-mono text-[#EAE5D9] mt-0.5">
                          {prop.carpet_area ? `${prop.carpet_area} sq.ft` : 'On Request'}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-[#8C8477] mt-3 line-clamp-3">{prop.description}</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#26221B] flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-mono text-[#736B5F] uppercase">Price Guide</div>
                      <div className="font-serif font-bold text-base text-[#C2A675]">
                        ₹{(prop.price_min / 100000).toFixed(0)}L – ₹{(prop.price_max / 100000).toFixed(0)}L
                      </div>
                    </div>

                    <a
                      href="#book"
                      onClick={() => setSelectedPropertyId(prop.id)}
                      className="rounded-lg bg-[#221F1A] hover:bg-[#2C2720] border border-[#3E362A] px-3.5 py-1.5 text-xs font-medium text-[#EAE5D9] transition-all"
                    >
                      Schedule Visit
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 4. PUBLIC WALKTHROUGH & ENGAGEMENT SCHEDULER (11:00 AM - 7:00 PM) */}
      {/* ==================================================================== */}
      <section id="book" className="py-16 sm:py-24 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="rounded-2xl border border-[#332D24] bg-[#161411] p-6 sm:p-10 shadow-2xl space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="font-mono text-[10px] tracking-widest uppercase text-[#C2A675] bg-[#221F1A] px-3 py-1 rounded border border-[#383126]">
              Direct Fiduciary Booking
            </span>
            <h2 className="font-serif text-3xl font-bold text-[#F4EFE6]">Schedule Private Walkthrough</h2>
            <p className="text-xs text-[#8C8477]">
              Available time slots are computed live from our master calendar (11:00 AM – 7:00 PM, 30-min intervals) to prevent double-booking.
            </p>
          </div>

          {bookingSuccess ? (
            <div className="rounded-xl border border-[#2B3E30] bg-[#151916] p-8 text-center space-y-4">
              <CheckCircle2 className="mx-auto h-12 w-12 text-[#9DBFA5]" />
              <h3 className="font-serif text-2xl font-bold text-[#F4EFE6]">Engagement Request Confirmed</h3>
              <p className="text-xs text-[#C8C2B5] max-w-md mx-auto leading-relaxed">
                Thank you, <strong className="text-[#F4EFE6]">{bookingSuccess.fullName}</strong>. Your appointment for{' '}
                <strong className="text-[#C2A675]">{formatIST(bookingSuccess.scheduledAt)}</strong> ({formatTime12h(bookingSuccess.slot)}) has been
                registered in our executive ledger.
              </p>
              <p className="text-[11px] text-[#8C8477]">
                A managing associate from Kanpur Prime Realty has received your dossier and will coordinate property entry protocols.
              </p>
              <div className="pt-4 flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => setIsMyAppointmentsModalOpen(true)}
                  className="rounded-lg bg-[#C2A675] hover:bg-[#B39562] text-[#11100E] px-5 py-2 text-xs font-semibold"
                >
                  View My Scheduled Visits
                </button>
                <button
                  onClick={() => setBookingSuccess(null)}
                  className="rounded-lg border border-[#352F26] bg-[#1A1814] px-5 py-2 text-xs text-[#D5CEBF] hover:bg-[#221F1A]"
                >
                  Schedule Another Appointment
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 text-xs">
              {errorMsg && (
                <div className="rounded-lg border border-[#482D27] bg-[#2A1D1A] p-3 text-xs text-[#D5B0B0] flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Client Login Notice / Quick Fill */}
              {clientUser ? (
                <div className="flex items-center justify-between rounded-lg border border-[#332D24] bg-[#1A1814] p-3 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#9DBFA5]" />
                    <span>
                      Booking as registered client: <strong className="text-[#F4EFE6]">{clientUser.fullName}</strong> ({clientUser.phone})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClientSignOut}
                    className="text-[#8C8477] hover:text-[#C2A675] underline text-[11px]"
                  >
                    Switch Account
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-lg border border-[#332D24] bg-[#181613] p-3 text-xs">
                  <div className="text-[#A8A194]">
                    Already have a client dossier? Sign in to autofill your preferences.
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('signin');
                      setIsClientAuthModalOpen(true);
                    }}
                    className="text-[#C2A675] font-semibold hover:underline shrink-0"
                  >
                    Sign In
                  </button>
                </div>
              )}

              {/* Engagement Mode & Property Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-medium text-[#C8C2B5]">Engagement Mode *</label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedType('site_visit')}
                      className={`rounded-lg p-2.5 text-center border transition-all ${
                        selectedType === 'site_visit'
                          ? 'border-[#C2A675] bg-[#221F1A] text-[#F4EFE6] font-semibold'
                          : 'border-[#2C2720] bg-[#11100E] text-[#A8A194]'
                      }`}
                    >
                      Estate Walkthrough
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedType('call')}
                      className={`rounded-lg p-2.5 text-center border transition-all ${
                        selectedType === 'call'
                          ? 'border-[#C2A675] bg-[#221F1A] text-[#F4EFE6] font-semibold'
                          : 'border-[#2C2720] bg-[#11100E] text-[#A8A194]'
                      }`}
                    >
                      Consultation Call
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-medium text-[#C8C2B5]">Target Property / Project (Optional)</label>
                  <select
                    value={selectedPropertyId}
                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9]"
                  >
                    <option value="">General Kanpur Portfolio Consultation</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.project_name} ({p.location})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Time Slot (11:00 AM - 7:00 PM) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-medium text-[#C8C2B5]">Preferred Consultation Date *</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedSlot('');
                    }}
                    className="mt-1.5 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="font-medium text-[#C8C2B5]">
                      Available Time Slot (11:00 AM – 7:00 PM) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setHideBookedSlots(!hideBookedSlots)}
                      className="text-[10px] text-[#C2A675] hover:underline"
                    >
                      {hideBookedSlots ? 'Show All Slots' : 'Hide Booked'}
                    </button>
                  </div>

                  {displayedSlots.length === 0 ? (
                    <div className="mt-1.5 rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#736B5F]">
                      No open slots available on this date.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 mt-1.5 max-h-40 overflow-y-auto p-1 bg-[#11100E] rounded-lg border border-[#332D24]">
                      {displayedSlots.map((slot) => {
                        if (slot.isBooked) {
                          return (
                            <div
                              key={slot.time}
                              title="This slot has already been reserved by another client."
                              className="rounded py-1.5 px-1 text-center font-mono text-[10px] bg-[#12100E] border border-[#262017] text-[#6E675C] opacity-40 line-through cursor-not-allowed select-none relative group"
                            >
                              <span>{slot.displayTime}</span>
                              <span className="block text-[8px] font-sans no-underline font-bold text-[#8C7A5A]">Booked</span>
                            </div>
                          );
                        }

                        if (slot.isPast) {
                          return (
                            <div
                              key={slot.time}
                              className="rounded py-1.5 px-1 text-center font-mono text-[10px] bg-[#12100E] border border-[#221D16] text-[#554E43] opacity-30 cursor-not-allowed select-none"
                            >
                              <span>{slot.displayTime}</span>
                            </div>
                          );
                        }

                        return (
                          <button
                            key={slot.time}
                            type="button"
                            onClick={() => setSelectedSlot(slot.time)}
                            className={`rounded py-1.5 px-1 text-center font-mono text-[11px] transition-all ${
                              selectedSlot === slot.time
                                ? 'bg-[#C2A675] text-[#11100E] font-bold shadow-sm'
                                : 'bg-[#181613] text-[#A8A194] hover:bg-[#25201A] hover:text-[#F4EFE6]'
                            }`}
                          >
                            {slot.displayTime}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Client Contact Dossier */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#26221B]">
                <div>
                  <label className="font-medium text-[#C8C2B5]">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikramaditya Singhania"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9]"
                  />
                </div>

                <div>
                  <label className="font-medium text-[#C8C2B5]">Indian Mobile (+91) *</label>
                  <input
                    type="tel"
                    required
                    placeholder="9839012345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9]"
                  />
                </div>

                <div>
                  <label className="font-medium text-[#C8C2B5]">Email Address</label>
                  <input
                    type="email"
                    placeholder="investor@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9]"
                  />
                </div>
              </div>

              {/* Inquiry Parameters (Intent, Budget, Location, Timeline) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="font-medium text-[#C8C2B5]">Acquisition Intent</label>
                  <select
                    value={intent}
                    onChange={(e) => setIntent(e.target.value as LeadIntent)}
                    className="mt-1.5 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9]"
                  >
                    <option value="buy">Purchase / Acquisition</option>
                    <option value="invest">High-Yield Investment</option>
                    <option value="rent">Prime Lease / Rental</option>
                  </select>
                </div>

                <div>
                  <label className="font-medium text-[#C8C2B5]">Preferred Kanpur Locality</label>
                  <select
                    value={preferredLocation}
                    onChange={(e) => setPreferredLocation(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9]"
                  >
                    <option value="Civil Lines">Civil Lines (VIP Riverfront)</option>
                    <option value="Swaroop Nagar">Swaroop Nagar (Prime Commercial)</option>
                    <option value="Tilak Nagar">Tilak Nagar (Prestige Enclave)</option>
                    <option value="Kalyanpur">Kalyanpur (Metro Hub)</option>
                    <option value="Cantt / Mall Road">Cantt / Mall Road</option>
                    <option value="Ganga Barrage">Ganga Barrage Corridor</option>
                    <option value="Any Prime Area">Flexible / Multiple</option>
                  </select>
                </div>

                <div>
                  <label className="font-medium text-[#C8C2B5]">Acquisition Timeline</label>
                  <select
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9]"
                  >
                    <option value="Immediate (Within 30 Days)">Immediate (&lt; 30 Days)</option>
                    <option value="1 - 2 Months">1 – 2 Months</option>
                    <option value="3 - 6 Months">3 – 6 Months</option>
                    <option value="Exploring Options">Market Exploration</option>
                  </select>
                </div>
              </div>

              {/* Special Instructions & DPDP Consent */}
              <div>
                <label className="font-medium text-[#C8C2B5]">Special Instructions or Requirements</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Please arrange access to the penthouse duplex and prepare the title verification dossier."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9]"
                />
              </div>

              {/* DPDP Act Compliance Consent */}
              <div className="rounded-lg border border-[#332D24] bg-[#14120F] p-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    className="mt-0.5 rounded border-[#4A3F31] bg-[#1A1814] text-[#C2A675] focus:ring-0"
                  />
                  <span className="text-[11px] text-[#A8A194] leading-relaxed">
                    I consent to Kanpur Prime Realty processing my details under the Digital Personal Data Protection (DPDP) Act, 2023 for scheduling this walkthrough and transmitting property disclosures.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto rounded-lg bg-[#C2A675] hover:bg-[#B39562] px-8 py-3 text-xs font-semibold text-[#11100E] transition-all shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording Engagement...' : 'Confirm Walkthrough Reservation'}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 5. PUBLIC CLIENT AUTHENTICATION MODAL (Sign In / Register) */}
      {/* ==================================================================== */}
      {isClientAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-[#3B342A] bg-[#181613] p-6 shadow-2xl">
            <button
              onClick={() => setIsClientAuthModalOpen(false)}
              className="absolute right-4 top-4 text-[#8C8477] hover:text-[#EAE5D9]"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center space-y-1 mb-6">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#231F19] text-[#C2A675] border border-[#443C2F] mb-1">
                <User className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#F4EFE6]">
                {authTab === 'register' ? 'Register Client Dossier' : 'Client Access Portal'}
              </h3>
              <p className="text-xs text-[#8C8477]">
                Track your walkthrough engagements, property inquiries, and fiduciary responses.
              </p>
            </div>

            {/* Auth Tab Switcher */}
            <div className="grid grid-cols-2 gap-2 mb-4 p-1 bg-[#11100E] rounded-lg border border-[#2C2720] text-xs">
              <button
                type="button"
                onClick={() => setAuthTab('register')}
                className={`py-1.5 rounded text-center transition-all ${
                  authTab === 'register'
                    ? 'bg-[#C2A675] text-[#11100E] font-semibold'
                    : 'text-[#A8A194] hover:text-[#EAE5D9]'
                }`}
              >
                New Client Registration
              </button>
              <button
                type="button"
                onClick={() => setAuthTab('signin')}
                className={`py-1.5 rounded text-center transition-all ${
                  authTab === 'signin'
                    ? 'bg-[#C2A675] text-[#11100E] font-semibold'
                    : 'text-[#A8A194] hover:text-[#EAE5D9]'
                }`}
              >
                Existing Client Sign In
              </button>
            </div>

            {authError && (
              <div className="mb-4 rounded-lg border border-[#482D27] bg-[#2A1D1A] p-2.5 text-xs text-[#D5B0B0] flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form
              onSubmit={authTab === 'register' ? handleClientRegister : handleClientSignIn}
              className="space-y-4 text-xs"
            >
              {authTab === 'register' && (
                <div>
                  <label className="font-medium text-[#C8C2B5]">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Alok Mishra"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9]"
                  />
                </div>
              )}

              <div>
                <label className="font-medium text-[#C8C2B5]">Indian Mobile (+91) *</label>
                <input
                  type="tel"
                  required
                  placeholder="9839012345"
                  value={authPhone}
                  onChange={(e) => setAuthPhone(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9]"
                />
              </div>

              <div>
                <label className="font-medium text-[#C8C2B5]">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="client@example.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9]"
                />
              </div>

              <div>
                <label className="font-medium text-[#C8C2B5]">Access Passcode</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full rounded-lg bg-[#C2A675] hover:bg-[#B39562] py-2.5 text-xs font-semibold text-[#11100E] transition-all shadow-md"
                >
                  {authTab === 'register' ? 'Complete Registration & Continue' : 'Sign In as Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 6. CLIENT'S "MY SCHEDULED ENGAGEMENTS" MODAL */}
      {/* ==================================================================== */}
      {isMyAppointmentsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-xl rounded-2xl border border-[#3B342A] bg-[#181613] p-6 shadow-2xl space-y-6">
            <button
              onClick={() => setIsMyAppointmentsModalOpen(false)}
              className="absolute right-4 top-4 text-[#8C8477] hover:text-[#EAE5D9]"
            >
              <X className="h-4 w-4" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#C2A675]" />
                <h3 className="font-serif text-xl font-bold text-[#F4EFE6]">My Scheduled Engagements</h3>
              </div>
              <p className="text-xs text-[#8C8477] mt-1">
                Active appointments and walkthrough requests registered with Kanpur Prime Realty.
              </p>
            </div>

            {clientAppointments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#2C2720] bg-[#11100E] p-8 text-center text-xs text-[#736B5F]">
                <Calendar className="mx-auto h-8 w-8 text-[#5A5347] mb-2" />
                <p className="font-serif font-bold text-[#EAE5D9] text-base">No Active Engagements</p>
                <p className="text-[#8C8477] mt-1">
                  You currently have no scheduled site visits. Select a date and slot above to book a walkthrough.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {clientAppointments.map((apt) => {
                  const prop = properties.find((p) => p.id === apt.property_id);
                  return (
                    <div
                      key={apt.id}
                      className="rounded-xl border border-[#332D24] bg-[#14120F] p-4 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-serif font-bold text-[#F4EFE6] text-sm">
                          {apt.type === 'site_visit' ? '🏢 Private Property Walkthrough' : '📞 Consultation Call'}
                        </span>
                        <span className="rounded px-2 py-0.5 font-mono text-[10px] font-semibold bg-[#2A3B2F] text-[#9DBFA5] border border-[#3B5441]">
                          Confirmed
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[#A8A194]">
                        <div>
                          <div className="text-[10px] text-[#736B5F] uppercase font-mono">Scheduled Time</div>
                          <div className="font-medium text-[#C2A675] mt-0.5">{formatIST(apt.scheduled_at)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#736B5F] uppercase font-mono">Assigned Estate</div>
                          <div className="font-medium text-[#EAE5D9] mt-0.5">
                            {prop ? `${prop.project_name} (${prop.location})` : 'General Portfolio Consultation'}
                          </div>
                        </div>
                      </div>

                      {apt.notes && (
                        <div className="pt-2 border-t border-[#221D16] text-[#8C8477] text-[11px]">
                          <strong>Notes:</strong> {apt.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-[#2C2720] text-xs">
              <span className="text-[#8C8477]">Need to reschedule? Call Concierge: +91 98390 12345</span>
              <button
                onClick={() => setIsMyAppointmentsModalOpen(false)}
                className="rounded-lg border border-[#3E3528] bg-[#221F1A] px-4 py-1.5 text-xs text-[#EAE5D9]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 7. OWNER MASTER PIN SECURITY GATE (Strict PIN: 14241700) */}
      {/* ==================================================================== */}
      {isStaffLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="relative w-full max-w-sm rounded-2xl border border-[#443C2F] bg-[#161411] p-6 sm:p-8 shadow-2xl space-y-6">
            <button
              onClick={() => {
                setIsStaffLoginModalOpen(false);
                setOwnerPin('');
                setOwnerPinError(null);
              }}
              className="absolute right-4 top-4 text-[#8C8477] hover:text-[#EAE5D9]"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center space-y-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#231F19] text-[#C2A675] border border-[#4D4233] shadow-md">
                <Lock className="h-6 w-6 stroke-[1.8]" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#F4EFE6]">
                Owner Security Gate
              </h3>
              <p className="text-xs text-[#8C8477] leading-relaxed">
                Confidential Principal Access. Enter your confidential master PIN to unlock the CRM workspace.
              </p>
            </div>

            {ownerPinError && (
              <div className="rounded-lg border border-[#482D27] bg-[#2A1D1A] p-3 text-xs text-[#D5B0B0] flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{ownerPinError}</span>
              </div>
            )}

            <form onSubmit={handleOwnerPinSubmit} className="space-y-5 text-xs">
              <div>
                <label className="block text-center font-mono text-[11px] uppercase tracking-wider text-[#C2A675] mb-2">
                  Owner Master PIN
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    required
                    autoFocus
                    maxLength={16}
                    placeholder="••••••••"
                    value={ownerPin}
                    onChange={(e) => {
                      setOwnerPin(e.target.value);
                      if (ownerPinError) setOwnerPinError(null);
                    }}
                    className="w-full rounded-xl border border-[#3E362A] bg-[#11100E] py-3 px-4 text-center font-mono text-xl tracking-[0.35em] text-[#F4EFE6] placeholder-[#4D4537] focus:border-[#C2A675] focus:outline-none transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C8477] hover:text-[#C2A675] p-1"
                    title={showPin ? 'Hide PIN' : 'Show PIN'}
                  >
                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#C2A675] hover:bg-[#B39562] py-3 text-xs font-semibold text-[#11100E] border border-[#A68A56] transition-all shadow-md active:scale-[0.98]"
                >
                  Authorize & Unlock CRM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 8. FOOTER (Pure Luxury Brokerage Footer) */}
      {/* ==================================================================== */}
      <footer className="border-t border-[#2C2720] bg-[#14120F] py-12 text-xs text-[#8C8477]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-serif font-bold text-[#EAE5D9] text-base">{settings.company_name}</span>
            <p className="mt-1">Fiduciary Real Estate Office • Civil Lines, Kanpur, Uttar Pradesh</p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[11px]">© {new Date().getFullYear()} Kanpur Prime Realty. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
