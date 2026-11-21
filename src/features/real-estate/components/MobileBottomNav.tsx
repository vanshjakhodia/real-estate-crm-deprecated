import React from 'react';
import { useCrm } from '../context/CrmContext';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Sparkles,
  Menu
} from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAi: () => void;
  onOpenMenu: () => void;
  aiAvailable: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenAi,
  onOpenMenu,
  aiAvailable
}) => {
  const { leads, followups } = useCrm();

  const hotCount = leads.filter((l) => l.lead_score === 'hot').length;
  const overdueCount = followups.filter(
    (f) => f.status === 'pending' && new Date(f.scheduled_for).getTime() < Date.now()
  ).length;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-border bg-sidebar/95 backdrop-blur-md px-2 py-1.5 safe-area-bottom">
      <div className="flex items-center justify-around">
        {/* Dashboard */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-all ${
            currentTab === 'dashboard'
              ? 'text-primary font-semibold'
              : 'text-muted-foreground hover:text-secondary-foreground'
          }`}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[10px] mt-0.5 tracking-tight font-sans">Desk</span>
        </button>

        {/* Leads */}
        <button
          onClick={() => onSelectTab('leads')}
          className={`relative flex flex-col items-center justify-center p-1.5 rounded-lg transition-all ${
            currentTab === 'leads'
              ? 'text-primary font-semibold'
              : 'text-muted-foreground hover:text-secondary-foreground'
          }`}
        >
          <Users className="h-5 w-5" />
          <span className="text-[10px] mt-0.5 tracking-tight font-sans">Clients</span>
          {hotCount > 0 && (
            <span className="absolute top-0 right-1 flex h-2 w-2 rounded-full bg-card" />
          )}
        </button>

        {/* AI Assistant Center Floating Button */}
        <button
          onClick={onOpenAi}
          disabled={!aiAvailable}
          className="flex flex-col items-center justify-center -mt-3.5 bg-primary text-primary-foreground p-2.5 rounded-xl border border-primary shadow-sm active:scale-95 transition-transform disabled:cursor-not-allowed disabled:opacity-50"
          title={aiAvailable ? "Open assistant" : "Assistant model selection is pending"}
        >
          <Sparkles className="h-4 w-4 fill-foreground" />
        </button>

        {/* Visits */}
        <button
          onClick={() => onSelectTab('appointments')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-all ${
            currentTab === 'appointments'
              ? 'text-primary font-semibold'
              : 'text-muted-foreground hover:text-secondary-foreground'
          }`}
        >
          <Calendar className="h-5 w-5" />
          <span className="text-[10px] mt-0.5 tracking-tight font-sans">Engagements</span>
        </button>

        {/* Tasks / Menu */}
        <button
          onClick={onOpenMenu}
          className={`relative flex flex-col items-center justify-center p-1.5 rounded-lg transition-all ${
            ['properties', 'market-map', 'followups', 'settings'].includes(currentTab)
              ? 'text-primary font-semibold'
              : 'text-muted-foreground hover:text-secondary-foreground'
          }`}
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] mt-0.5 tracking-tight font-sans">Menu</span>
          {overdueCount > 0 && (
            <span className="absolute top-0 right-1 flex h-2 w-2 rounded-full bg-card" />
          )}
        </button>
      </div>
    </nav>
  );
};
