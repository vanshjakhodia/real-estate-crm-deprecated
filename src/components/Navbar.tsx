import React from 'react';
import { useCrm } from '../context/CrmContext';
import {
  Building2,
  Sparkles,
  Shield,
  ShieldCheck,
  UserCheck,
  Menu,
  ChevronDown,
  ArrowLeft,
  LogOut,
  FileSpreadsheet
} from 'lucide-react';
import { exportMasterCrmToExcel } from '../lib/excel';

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenAi: () => void;
  onOpenSecurity: () => void;
  canGoBack?: boolean;
  onGoBack?: () => void;
  onLogoutToPublic?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onOpenAi,
  onOpenSecurity,
  canGoBack = false,
  onGoBack,
  onLogoutToPublic
}) => {
  const { currentUser, currentRole, switchUser, teamMembers, settings, leads, appointments, properties } = useCrm();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#2C2720] bg-[#14120F]/95 px-4 backdrop-blur-md sm:px-6">
      {/* Left: Hamburger + Heritage Brand + Universal Back */}
      <div className="flex items-center gap-3 sm:gap-3.5">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-[#9E978C] hover:bg-[#1E1C18] hover:text-[#EAE5D9] lg:hidden transition-colors"
          title="Toggle Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {canGoBack && onGoBack && (
          <button
            onClick={onGoBack}
            className="flex items-center gap-1.5 rounded-lg border border-[#3E362A] bg-[#221F1A] px-2.5 sm:px-3 py-1.5 text-xs font-medium text-[#C2A675] hover:bg-[#2C2720] hover:text-[#F4EFE6] transition-all shadow-xs shrink-0"
            title="Return to previous view"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
        )}

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#231F19] text-[#C2A675] border border-[#443C2F] shadow-sm">
            <Building2 className="h-5 w-5 stroke-[1.8]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg font-bold tracking-normal text-[#F4EFE6] sm:text-xl">
                {settings.company_name}
              </span>
              <span className="hidden rounded px-2 py-0.5 text-[10px] font-medium tracking-widest uppercase badge-gold font-sans md:inline-flex">
                {settings.city}
              </span>
            </div>
            <p className="text-[10px] font-sans tracking-wider uppercase text-[#8C8477] hidden sm:block">
              Private Client Office & Estates
            </p>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Instant MS Excel Master Dossier Export */}
        <button
          onClick={() => exportMasterCrmToExcel({ leads, appointments, properties })}
          className="flex items-center gap-1.5 rounded-lg border border-[#3E3528] bg-[#1E1C18] px-2.5 sm:px-3 py-1.5 text-xs font-medium text-[#C2A675] hover:bg-[#28241E] hover:border-[#C2A675] transition-all shadow-xs"
          title="Export Complete Multi-Sheet MS Excel (.xlsx) Dossier"
        >
          <FileSpreadsheet className="h-3.5 w-3.5 text-[#C2A675]" />
          <span className="hidden md:inline">MS Excel</span>
        </button>

        {/* Security & RLS Compliance Center */}
        <button
          onClick={onOpenSecurity}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium badge-forest hover:brightness-110 transition-all"
          title="System Security & DPDP Compliance Center"
        >
          <ShieldCheck className="h-3.5 w-3.5 text-[#9DBFA5]" />
          <span className="hidden sm:inline">RLS Audit</span>
        </button>

        {/* AI Assistant Button */}
        <button
          onClick={onOpenAi}
          className="flex items-center gap-1.5 rounded-lg bg-[#C2A675] hover:bg-[#B39562] px-3.5 py-1.5 text-xs font-medium text-[#11100E] border border-[#A68A56] transition-all shadow-xs"
        >
          <Sparkles className="h-3.5 w-3.5 fill-[#11100E]" />
          <span className="hidden sm:inline">Gemini AI</span>
          <span className="sm:hidden">AI</span>
        </button>

        {/* User Role Switcher Dropdown */}
        <div className="relative group">
          <div className="flex items-center gap-2 rounded-lg border border-[#352F26] bg-[#1A1814] p-1.5 pl-2.5 hover:bg-[#221F1A] transition-colors cursor-pointer">
            <div className="flex items-center gap-1.5">
              {currentRole === 'admin' ? (
                <Shield className="h-4 w-4 text-[#BFA0A0]" />
              ) : (
                <UserCheck className="h-4 w-4 text-[#9DBFA5]" />
              )}
              <div className="text-left hidden sm:block">
                <div className="text-xs font-medium text-[#EAE5D9] leading-tight">
                  {currentUser.full_name}
                </div>
                <div className="text-[10px] uppercase font-mono tracking-wider text-[#8C8477]">
                  {currentRole}
                </div>
              </div>
            </div>
            <ChevronDown className="h-3 w-3 text-[#8C8477]" />
          </div>

          {/* Switcher Dropdown menu */}
          <div className="absolute right-0 mt-1 hidden w-64 rounded-xl border border-[#3B342A] bg-[#181613] p-2 shadow-2xl group-hover:block group-focus-within:block z-50 text-[#D5CEBF]">
            <div className="px-2 py-1 text-[10px] font-sans font-medium text-[#8C8477] uppercase tracking-wider">
              Switch RLS Session Role
            </div>
            {teamMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => switchUser(member.id)}
                className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                  member.id === currentUser.id
                    ? 'bg-[#25211B] text-[#EAE5D9] font-medium border border-[#443C2F]'
                    : 'text-[#A8A194] hover:bg-[#201D18]'
                }`}
              >
                <div>
                  <div className="text-sm font-medium text-[#EAE5D9]">{member.full_name}</div>
                  <div className="text-[10px] text-[#8C8477]">{member.email}</div>
                </div>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${
                    member.role === 'admin' ? 'badge-oxblood' : 'badge-forest'
                  }`}
                >
                  {member.role}
                </span>
              </button>
            ))}
            <div className="mt-2 border-t border-[#2C2720] pt-2 px-2 text-[10px] text-[#8C8477]">
              {currentRole === 'admin'
                ? '• Admin: Master view across all team leads and audit records.'
                : '• Agent: View restricted exclusively to assigned records.'}
            </div>

            {onLogoutToPublic && (
              <div className="mt-2 border-t border-[#2C2720] pt-2">
                <button
                  onClick={onLogoutToPublic}
                  className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-[#BFA0A0] hover:bg-[#251A1A] transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Exit Admin CRM</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
