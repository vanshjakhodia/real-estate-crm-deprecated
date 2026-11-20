import React, { useState } from 'react';
import { CrmProvider, useCrm } from './context/CrmContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AiAssistantModal } from './components/AiAssistantModal';
import { SecurityAuditModal } from './components/SecurityAuditModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { DashboardPage } from './pages/DashboardPage';
import { LeadsPage } from './pages/LeadsPage';
import { LeadDetailPage } from './pages/LeadDetailPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { PropertiesPage } from './pages/PropertiesPage';
import { FollowupsPage } from './pages/FollowupsPage';
import { SettingsPage } from './pages/SettingsPage';
import { KanpurMarketMapPage } from './pages/KanpurMarketMapPage';
import { PublicShowcaseWebsite } from './pages/PublicShowcaseWebsite';

const CrmAppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [navHistory, setNavHistory] = useState<string[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [leadFilterInitial, setLeadFilterInitial] = useState<any>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);

  // Determine if the URL or active session belongs to the Owner
  const isOwnerUrl = () => {
    return (
      window.location.hash === '#admin' ||
      window.location.pathname.startsWith('/admin') ||
      window.location.search.includes('admin')
    );
  };

  // Public visitors only ever see the Public Portal.
  // The Admin CRM is only visible if the Owner is authenticated and requested it.
  const [isPublicWebsiteView, setIsPublicWebsiteView] = useState<boolean>(() => {
    const isOwnerSession = localStorage.getItem('kanpur_crm_owner_auth') === 'true';
    if (isOwnerSession && isOwnerUrl()) {
      return false;
    }
    return true; // Default view for public visitors
  });

  // Listen to owner route changes
  React.useEffect(() => {
    const checkHash = () => {
      const isOwnerSession = localStorage.getItem('kanpur_crm_owner_auth') === 'true';
      if (isOwnerUrl() && isOwnerSession) {
        setIsPublicWebsiteView(false);
      }
    };
    window.addEventListener('hashchange', checkHash);
    window.addEventListener('popstate', checkHash);
    return () => {
      window.removeEventListener('hashchange', checkHash);
      window.removeEventListener('popstate', checkHash);
    };
  }, []);

  const handleLogoutOwner = () => {
    localStorage.removeItem('kanpur_crm_owner_auth');
    setIsPublicWebsiteView(true);
    if (window.location.hash === '#admin') {
      window.history.pushState(null, '', window.location.pathname);
    }
  };

  const handleOpenOwnerCrm = () => {
    localStorage.setItem('kanpur_crm_owner_auth', 'true');
    setIsPublicWebsiteView(false);
    window.location.hash = '#admin';
  };

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Quick navigation helpers with history stack
  const handleSelectTab = (tab: string, filter?: any) => {
    setSelectedLeadId(null);
    if (tab !== currentTab) {
      setNavHistory((prev) => [...prev, currentTab]);
      setCurrentTab(tab);
    }
    setLeadFilterInitial(filter || null);
  };

  const handleSelectLead = (leadId: string) => {
    setNavHistory((prev) => [...prev, currentTab]);
    setSelectedLeadId(leadId);
  };

  const handleBackToLeads = () => {
    setSelectedLeadId(null);
  };

  const handleGoBack = () => {
    if (selectedLeadId) {
      setSelectedLeadId(null);
      return;
    }
    if (navHistory.length > 0) {
      const prev = navHistory[navHistory.length - 1];
      setNavHistory((h) => h.slice(0, -1));
      setCurrentTab(prev);
    } else {
      setCurrentTab('dashboard');
    }
  };

  const canGoBack = selectedLeadId !== null || currentTab !== 'dashboard';

  // If in Public Website & Showcase View
  if (isPublicWebsiteView) {
    return <PublicShowcaseWebsite onOpenCrm={handleOpenOwnerCrm} />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#11100E] text-[#EAE5D9] font-sans selection:bg-[#B89758] selection:text-[#11100E]">
      {/* Top Navigation */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenAi={() => setIsAiOpen(true)}
        onOpenSecurity={() => setIsSecurityOpen(true)}
        canGoBack={canGoBack}
        onGoBack={handleGoBack}
        onLogoutToPublic={handleLogoutOwner}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar
          currentTab={selectedLeadId ? 'leads' : currentTab}
          onSelectTab={(tab) => handleSelectTab(tab)}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpenAi={() => setIsAiOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          <div className="mx-auto max-w-7xl">
            {selectedLeadId ? (
              <LeadDetailPage
                leadId={selectedLeadId}
                onBack={handleBackToLeads}
                onNavigateAppointments={() => {
                  setSelectedLeadId(null);
                  handleSelectTab('appointments');
                }}
                onBackToDashboard={() => handleSelectTab('dashboard')}
              />
            ) : currentTab === 'dashboard' ? (
              <DashboardPage
                onNavigate={handleSelectTab}
                onOpenAddLead={() => handleSelectTab('leads')}
                onSelectLead={handleSelectLead}
              />
            ) : currentTab === 'leads' ? (
              <LeadsPage
                onSelectLead={handleSelectLead}
                initialFilter={leadFilterInitial}
                onBack={handleGoBack}
              />
            ) : currentTab === 'appointments' ? (
              <AppointmentsPage
                onSelectLead={handleSelectLead}
                onBack={handleGoBack}
              />
            ) : currentTab === 'properties' ? (
              <PropertiesPage onBack={handleGoBack} />
            ) : currentTab === 'market-map' ? (
              <KanpurMarketMapPage onBack={handleGoBack} />
            ) : currentTab === 'followups' ? (
              <FollowupsPage
                onSelectLead={handleSelectLead}
                onBack={handleGoBack}
              />
            ) : currentTab === 'settings' ? (
              <SettingsPage onBack={handleGoBack} />
            ) : (
              <DashboardPage
                onNavigate={handleSelectTab}
                onOpenAddLead={() => handleSelectTab('leads')}
                onSelectLead={handleSelectLead}
              />
            )}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation (Native App feel on phones) */}
      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => handleSelectTab(tab)}
        onOpenAi={() => setIsAiOpen(true)}
        onOpenMenu={() => setIsSidebarOpen(true)}
      />

      {/* Gemini AI Assistant Drawer */}
      <AiAssistantModal isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />

      {/* Security & RLS Compliance Center */}
      <SecurityAuditModal isOpen={isSecurityOpen} onClose={() => setIsSecurityOpen(false)} />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <CrmProvider>
      <CrmAppContent />
    </CrmProvider>
  );
};

export default App;
