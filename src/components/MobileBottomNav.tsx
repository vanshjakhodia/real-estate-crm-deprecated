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
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenAi,
  onOpenMenu
}) => {
  const { leads, followups } = useCrm();

  const hotCount = leads.filter((l) => l.lead_score === 'hot').length;
  const overdueCount = followups.filter(
    (f) => f.status === 'pending' && new Date(f.scheduled_for).getTime() < Date.now()
  ).length;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-[#2C2720] bg-[#14120F]/95 backdrop-blur-md px-2 py-1.5 safe-area-bottom">
      <div className="flex items-center justify-around">
        {/* Dashboard */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-all ${
            currentTab === 'dashboard'
              ? 'text-[#C2A675] font-semibold'
              : 'text-[#8C8477] hover:text-[#D5CEBF]'
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
              ? 'text-[#C2A675] font-semibold'
              : 'text-[#8C8477] hover:text-[#D5CEBF]'
          }`}
        >
          <Users className="h-5 w-5" />
          <span className="text-[10px] mt-0.5 tracking-tight font-sans">Clients</span>
          {hotCount > 0 && (
            <span className="absolute top-0 right-1 flex h-2 w-2 rounded-full bg-[#BFA0A0]" />
          )}
        </button>

        {/* AI Assistant Center Floating Button */}
        <button
          onClick={onOpenAi}
          className="flex flex-col items-center justify-center -mt-3.5 bg-[#C2A675] text-[#11100E] p-2.5 rounded-xl border border-[#A68A56] shadow-sm active:scale-95 transition-transform"
          title="Gemini AI Assistant"
        >
          <Sparkles className="h-4 w-4 fill-[#11100E]" />
        </button>

        {/* Visits */}
        <button
          onClick={() => onSelectTab('appointments')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-all ${
            currentTab === 'appointments'
              ? 'text-[#C2A675] font-semibold'
              : 'text-[#8C8477] hover:text-[#D5CEBF]'
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
              ? 'text-[#C2A675] font-semibold'
              : 'text-[#8C8477] hover:text-[#D5CEBF]'
          }`}
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] mt-0.5 tracking-tight font-sans">Menu</span>
          {overdueCount > 0 && (
            <span className="absolute top-0 right-1 flex h-2 w-2 rounded-full bg-[#C4A58E]" />
          )}
        </button>
      </div>
    </nav>
  );
};
