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
  MapPin,
  FileSpreadsheet
} from 'lucide-react';
import { exportMasterCrmToExcel } from '../lib/excel';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenAi: () => void;
  aiAvailable: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  onOpenAi,
  aiAvailable
}) => {
  const { leads, appointments, followups, properties } = useCrm();

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
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-sidebar transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4 lg:hidden">
          <span className="font-serif text-lg font-bold text-foreground">Operations Desk</span>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Section Label */}
        <div className="px-5 pt-6 pb-2 text-[10px] font-sans font-medium tracking-widest uppercase text-muted-foreground">
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
                    ? 'bg-secondary text-foreground border-l-2 border-primary font-semibold'
                    : 'text-muted-foreground hover:bg-card hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
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
          {aiAvailable ? <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-primary text-xs font-serif font-bold">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Gemini Estate Intelligence</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
              Synthesizes registry inquiries, portfolio pricing & drafts correspondence.
            </p>
            <button
              onClick={() => {
                onOpenAi();
                onClose();
              }}
              className="mt-3 w-full rounded-lg bg-secondary border border-border py-1.5 text-center text-xs font-medium text-secondary-foreground hover:bg-card hover:text-foreground transition-colors"
            >
              Consult Assistant
            </button>
          </div> : null}
        </div>

        {/* Quick MS Excel Export */}
        <div className="px-3 pb-2">
          <button
            onClick={() => {
              exportMasterCrmToExcel({ leads, appointments, properties });
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-border bg-card hover:bg-secondary py-2 text-xs font-medium text-primary transition-all shadow-xs"
            title="Download complete CRM ledger in MS Excel format"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export MS Excel (.xlsx)</span>
          </button>
        </div>

        {/* Security & Heritage Footer */}
        <div className="border-t border-border p-3 text-center text-[10px] text-muted-foreground flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck className="h-3.5 w-3.5 text-forest" />
          <span>Fiduciary RLS & DPDP • Kanpur Desk</span>
        </div>
      </aside>
    </>
  );
};
