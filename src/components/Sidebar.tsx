import React from 'react';
import { useCrm } from '../context/CrmContext';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Building,
  CheckSquare,
  Settings,
  Sparkles,
  X,
  ShieldCheck,
  Compass,
  MapPin
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenAi: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  onOpenAi
}) => {
  const { leads, appointments, followups } = useCrm();

  const hotCount = leads.filter((l) => l.lead_score === 'hot').length;
  const overdueCount = followups.filter(
    (f) => f.status === 'pending' && new Date(f.scheduled_for).getTime() < Date.now()
  ).length;
  const upcomingAptCount = appointments.filter((a) => a.status === 'booked').length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'leads',
      label: 'Client Registry',
      icon: Users,
      badge: hotCount > 0 ? `${hotCount} hot` : null,
      badgeClass: 'badge-oxblood'
    },
    {
      id: 'appointments',
      label: 'Site Engagements',
      icon: Calendar,
      badge: upcomingAptCount > 0 ? `${upcomingAptCount}` : null,
      badgeClass: 'badge-gold'
    },
    {
      id: 'properties',
      label: 'Estate Portfolio',
      icon: Building,
      badge: null
    },
    {
      id: 'market-map',
      label: 'Kanpur Market Map',
      icon: Compass,
      badge: 'Live',
      badgeClass: 'badge-gold'
    },
    {
      id: 'followups',
      label: 'Communications',
      icon: CheckSquare,
      badge: overdueCount > 0 ? `${overdueCount} due` : null,
      badgeClass: 'badge-oxblood'
    },
    {
      id: 'settings',
      label: 'Firm Settings',
      icon: Settings,
      badge: null
    }
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-[#0B0A09]/80 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[#2C2720] bg-[#14120F] transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header */}
        <div className="flex h-16 items-center justify-between border-b border-[#2C2720] px-4 lg:hidden">
          <span className="font-serif text-lg font-bold text-[#EAE5D9]">Operations Desk</span>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#8C8477] hover:bg-[#1E1C18] hover:text-[#EAE5D9]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Section Label */}
        <div className="px-5 pt-6 pb-2 text-[10px] font-sans font-medium tracking-widest uppercase text-[#736B5F]">
          Navigation
        </div>

        {/* Navigation Links */}
        <div className="flex-1 space-y-1 px-3 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#211E18] text-[#F4EFE6] border-l-2 border-[#C2A675] font-semibold'
                    : 'text-[#9E978C] hover:bg-[#1A1814] hover:text-[#EAE5D9]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-[#C2A675]' : 'text-[#7A7265]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-medium ${item.badgeClass}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Assistant Card */}
        <div className="p-3">
          <div className="rounded-xl border border-[#352F26] bg-[#1A1814] p-4">
            <div className="flex items-center gap-2 text-[#C2A675] text-xs font-serif font-bold">
              <Sparkles className="h-3.5 w-3.5 text-[#C2A675]" />
              <span>Gemini Estate Intelligence</span>
            </div>
            <p className="mt-1 text-[11px] text-[#8C8477] leading-relaxed">
              Synthesizes registry inquiries, portfolio pricing & drafts correspondence.
            </p>
            <button
              onClick={() => {
                onOpenAi();
                onClose();
              }}
              className="mt-3 w-full rounded-lg bg-[#25211B] border border-[#3E372C] py-1.5 text-center text-xs font-medium text-[#D5CEBF] hover:bg-[#2F2921] hover:text-[#F4EFE6] transition-colors"
            >
              Consult Assistant
            </button>
          </div>
        </div>

        {/* Security & Heritage Footer */}
        <div className="border-t border-[#2C2720] p-3 text-center text-[10px] text-[#736B5F] flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck className="h-3.5 w-3.5 text-[#9DBFA5]" />
          <span>Fiduciary RLS & DPDP • Kanpur Desk</span>
        </div>
      </aside>
    </>
  );
};
