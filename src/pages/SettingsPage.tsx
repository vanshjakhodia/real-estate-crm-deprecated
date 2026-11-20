import React, { useState } from 'react';
import { useCrm } from '../context/CrmContext';
import { UserRole } from '../types/crm';
import {
  Users,
  Sparkles,
  Trash2,
  UserPlus,
  Building,
  Save,
  Check,
  ArrowLeft
} from 'lucide-react';

interface SettingsPageProps {
  onBack?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  const {
    settings,
    updateSettings,
    teamMembers,
    inviteTeamMember,
    removeTeamMember,
    clearAllData,
    currentRole,
    currentUser
  } = useCrm();

  const [formSettings, setFormSettings] = useState(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Invite member state
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('agent');
  const [newPhone, setNewPhone] = useState('');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formSettings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newName) return;
    inviteTeamMember({
      email: newEmail,
      full_name: newName,
      role: newRole,
      phone: newPhone
    });
    setNewEmail('');
    setNewName('');
    setNewPhone('');
    alert(`Enrolled ${newName} (${newRole}) to team registry.`);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-normal text-[#F4EFE6]">
          Firm Governance & Operating Protocols
        </h2>
        <p className="text-xs text-[#8C8477] mt-1">
          Configure regional defaults, associate credentials, operating windows, and AI behavior.
        </p>
      </div>

      {/* Business Details & Working Hours */}
      <form
        onSubmit={handleSaveSettings}
        className="rounded-xl border border-[#2E2820] bg-[#161411] p-6 shadow-xs space-y-6 text-xs"
      >
        <div className="flex items-center justify-between border-b border-[#2C2720] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#221F1A] text-[#C2A675] border border-[#383126]">
              <Building className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-[#F4EFE6]">Firm Identity & Operating Schedule</h3>
              <p className="text-[11px] text-[#8C8477]">Public consultation slots and AI communication utilize these parameters</p>
            </div>
          </div>
          {savedSuccess && (
            <span className="flex items-center gap-1 font-mono text-xs badge-forest rounded px-3 py-1">
              <Check className="h-3.5 w-3.5 text-[#9DBFA5]" />
              <span>Settings Saved</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-medium text-[#C8C2B5]">Firm / Corporate Name</label>
            <input
              type="text"
              value={formSettings.company_name}
              onChange={(e) => setFormSettings({ ...formSettings, company_name: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9] placeholder-[#736B5F] focus:border-[#C2A675] focus:outline-none"
            />
          </div>
          <div>
            <label className="font-medium text-[#C8C2B5]">City / Operating Jurisdiction</label>
            <input
              type="text"
              value={formSettings.city}
              onChange={(e) => setFormSettings({ ...formSettings, city: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9] placeholder-[#736B5F] focus:border-[#C2A675] focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-medium text-[#C8C2B5]">Operating Hours: Commencement (IST)</label>
            <input
              type="time"
              value={formSettings.working_hours_start}
              onChange={(e) => setFormSettings({ ...formSettings, working_hours_start: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9] focus:border-[#C2A675] focus:outline-none"
            />
          </div>
          <div>
            <label className="font-medium text-[#C8C2B5]">Operating Hours: Conclusion (IST)</label>
            <input
              type="time"
              value={formSettings.working_hours_end}
              onChange={(e) => setFormSettings({ ...formSettings, working_hours_end: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9] focus:border-[#C2A675] focus:outline-none"
            />
          </div>
        </div>

        {/* AI SETTINGS */}
        <div className="border-t border-[#2C2720] pt-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#221F1A] text-[#C2A675] border border-[#383126]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm text-[#F4EFE6]">Gemini Intelligence Configuration</h4>
              <p className="text-[11px] text-[#8C8477]">Server-side execution via Edge Function (No client secrets)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-medium text-[#C8C2B5]">Default Linguistic Style</label>
              <select
                value={formSettings.ai_language === 'Hinglish' ? 'English' : formSettings.ai_language}
                onChange={(e) => setFormSettings({ ...formSettings, ai_language: e.target.value as any })}
                className="mt-1.5 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9] focus:border-[#C2A675] focus:outline-none"
              >
                <option value="English">English (Formal & Consultative - Recommended)</option>
                <option value="Hindi">Hindi (हिंदी script)</option>
              </select>
            </div>
            <div>
              <label className="font-medium text-[#C8C2B5]">Demeanor / Persona</label>
              <input
                type="text"
                value={formSettings.ai_tone}
                onChange={(e) => setFormSettings({ ...formSettings, ai_tone: e.target.value })}
                placeholder="Polite, warm, consultative and respectful"
                className="mt-1.5 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9] placeholder-[#736B5F] focus:border-[#C2A675] focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-lg bg-[#C2A675] hover:bg-[#B39562] px-6 py-2.5 font-medium text-[#11100E] text-xs transition-all shadow-xs"
          >
            <Save className="h-4 w-4" />
            <span>Preserve Settings</span>
          </button>
        </div>
      </form>

      {/* TEAM MANAGEMENT (Admin Only) */}
      <div className="rounded-xl border border-[#2E2820] bg-[#161411] p-6 shadow-xs space-y-6 text-xs">
        <div className="flex items-center justify-between border-b border-[#2C2720] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#221F1A] text-[#9DBFA5] border border-[#2B3E30]">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-[#F4EFE6]">Associate Permissions & RLS Directives</h3>
              <p className="text-[11px] text-[#8C8477]">Associates access exclusively assigned client folios; Principal accesses all</p>
            </div>
          </div>
          <span className="text-[10px] font-mono tracking-wider uppercase badge-gold rounded px-3 py-1">
            {currentRole === 'admin' ? 'Principal Authority' : 'Restricted Associate'}
          </span>
        </div>

        {/* Members List */}
        <div className="divide-y divide-[#24201A]">
          {teamMembers.map((member) => (
            <div key={member.id} className="flex items-center justify-between py-3.5">
              <div>
                <div className="font-serif font-bold text-sm text-[#F4EFE6]">{member.full_name}</div>
                <div className="text-[#8C8477] text-[11px] mt-0.5">
                  {member.email} {member.phone ? `• ${member.phone}` : ''}
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <span
                  className={`rounded px-2.5 py-0.5 text-[10px] font-mono font-medium uppercase ${
                    member.role === 'admin' ? 'badge-oxblood' : 'badge-forest'
                  }`}
                >
                  {member.role}
                </span>

                {currentRole === 'admin' && member.id !== currentUser.id && (
                  <button
                    onClick={() => removeTeamMember(member.id)}
                    className="rounded p-1 text-[#8C8477] hover:text-[#BFA0A0] transition-colors"
                    title="Remove Associate"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Agent Form (Admin only) */}
        {currentRole === 'admin' && (
          <form onSubmit={handleInviteSubmit} className="border-t border-[#2C2720] pt-5 space-y-3">
            <div className="font-serif font-bold text-xs text-[#F4EFE6]">Enroll New Associate</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                placeholder="Full Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-xs text-[#EAE5D9] placeholder-[#736B5F] focus:border-[#C2A675] focus:outline-none"
              />
              <input
                type="email"
                required
                placeholder="Corporate Email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-xs text-[#EAE5D9] placeholder-[#736B5F] focus:border-[#C2A675] focus:outline-none"
              />
              <div className="flex gap-2">
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-xs text-[#EAE5D9] focus:border-[#C2A675] focus:outline-none flex-1"
                >
                  <option value="agent">Associate</option>
                  <option value="admin">Principal Admin</option>
                </select>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg bg-[#24201A] border border-[#3E372C] px-4 py-2.5 text-xs font-medium text-[#D5CEBF] hover:bg-[#2C2720] transition-all shrink-0"
                >
                  <UserPlus className="h-3.5 w-3.5 text-[#C2A675]" />
                  <span>Enroll</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* DATA MANAGEMENT & REGISTRY RESET CONTROL */}
      {currentRole === 'admin' && (
        <div className="rounded-xl border border-[#482D27] bg-[#1A1614] p-6 shadow-xs space-y-4 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2A1D1A] text-[#BFA0A0] border border-[#482D27]">
              <Trash2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-[#F4EFE6]">Master Registry Reset & Data Controls</h3>
              <p className="text-[11px] text-[#8C8477]">Irreversible purge and reset to empty state</p>
            </div>
          </div>
          <p className="text-[#A8A194] leading-relaxed">
            The CRM operates strictly with authentic client folios entered or imported. To purge all registry records and return to a clean slate, execute below.
          </p>
          <button
            type="button"
            onClick={() => {
              if (confirm('Are you certain you wish to purge all leads, properties, appointments, and messages to an empty slate?')) {
                clearAllData();
                alert('All records purged. The registry is completely empty.');
              }
            }}
            className="flex items-center gap-2 rounded-lg border border-[#482D27] bg-[#2A1D1A] px-4 py-2 font-medium text-[#BFA0A0] hover:bg-[#34221E] transition-all text-xs"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Purge All Records (Reset to Empty Slate)</span>
          </button>
        </div>
      )}
    </div>
  );
};
