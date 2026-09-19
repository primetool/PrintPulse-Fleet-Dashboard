import React from 'react';
import { 
  Printer, 
  Laptop, 
  Activity, 
  Sparkles, 
  PlusCircle, 
  Play, 
  Pause, 
  Terminal, 
  RefreshCw, 
  Cpu, 
  Bell, 
  Radio, 
  Wifi, 
  WifiOff,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  Shield,
  Download
} from 'lucide-react';
import type { FleetMetrics, RealtimeSyncStatus } from '../types';
import { useAdminAuth } from '../context/AdminAuthContext';

interface HeaderProps {
  metrics: FleetMetrics | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSimulating: boolean;
  setIsSimulating: (val: boolean) => void;
  onSimulateOnce: () => void;
  onOpenConnectModal: () => void;
  onOpenAddModal: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  unresolvedAlertsCount?: number;
  unacknowledgedAlertsCount?: number;
  syncStatus?: RealtimeSyncStatus;
}

export const Header: React.FC<HeaderProps> = ({
  metrics,
  activeTab,
  setActiveTab,
  isSimulating,
  setIsSimulating,
  onSimulateOnce,
  onOpenConnectModal,
  onOpenAddModal,
  onRefresh,
  isRefreshing,
  unresolvedAlertsCount = 0,
  unacknowledgedAlertsCount = 0,
  syncStatus,
}) => {
  const { isAdmin, lockAdmin, openAuthModal, openChangePinModal, requireAdminAction } = useAdminAuth();

  const handleToggleSimulation = () => {
    requireAdminAction(() => {
      setIsSimulating(!isSimulating);
    }, 'Admin authorization required to run continuous traffic simulation across workstations.');
  };

  const handleAddNode = () => {
    requireAdminAction(() => {
      onOpenAddModal();
    }, 'Admin authorization required to register or deploy a new computer workstation.');
  };

  const tabs = [
    { id: 'overview', label: 'Fleet Overview', icon: Activity },
    { 
      id: 'alerts', 
      label: 'Alerts & Incidents', 
      count: unresolvedAlertsCount, 
      countHighlight: unresolvedAlertsCount > 0,
      icon: Bell 
    },
    { id: 'workstations', label: 'Workstations', count: metrics?.totalNodesCount, icon: Laptop },
    { id: 'printers', label: 'Printers & Hardware', count: metrics?.totalPrintersCount, icon: Printer },
    { id: 'jobs', label: 'Print Ledger', count: metrics?.totalJobs, icon: Cpu },
    { id: 'analytics', label: 'Cost & Sustainability', icon: Activity },
    { id: 'ai-copilot', label: 'AI Fleet Diagnostics', badge: 'Gemini AI', icon: Sparkles },
    { id: 'agent-setup', label: 'Agent Connect & API', icon: Terminal },
  ];

  const isConnected = syncStatus?.connected ?? true;

  return (
    <header id="printpulse-header" className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top bar with Branding, Live Status & Quick Action Buttons */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between py-3 gap-3">
          
          {/* Logo & Node aggregation status & SSE sync badge */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                    PrintPulse <span className="text-blue-600 font-semibold text-[11px] px-1.5 py-0.5 rounded-md bg-blue-50 border border-blue-200">HUB</span>
                  </h1>
                  
                  {/* Real-Time SSE Sync Indicator */}
                  <div
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                      isConnected
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                    title={isConnected ? 'Real-time continuous SSE connection active. Telemetry updates without manual refresh.' : 'Reconnecting to PrintPulse telemetry stream...'}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                      }`}
                    />
                    <span className="hidden sm:inline">
                      {isConnected ? `Real-Time Sync (${syncStatus?.latencyMs || 18}ms)` : 'Reconnecting...'}
                    </span>
                    <span className="sm:hidden">{isConnected ? 'Live' : 'Syncing'}</span>
                  </div>

                  <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    {metrics?.activeNodesCount || 7} Nodes Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Centralized Multi-Computer Print Telemetry & Fleet Management
                </p>
              </div>
            </div>

            {/* Mobile notification & refresh */}
            <div className="flex items-center gap-1.5 md:hidden">
              <button
                onClick={() => setActiveTab('alerts')}
                className="relative p-2 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200"
                title="Alerts"
              >
                <Bell className="w-4 h-4" />
                {unresolvedAlertsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                    {unresolvedAlertsCount}
                  </span>
                )}
              </button>
              <button
                id="btn-mobile-refresh"
                onClick={onRefresh}
                className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200"
                title="Refresh Data"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            {/* Auto Traffic Simulator Toggle */}
            <button
              id="btn-auto-simulate-toggle"
              onClick={handleToggleSimulation}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                isSimulating
                  ? 'bg-amber-50 border-amber-300 text-amber-800 ring-2 ring-amber-400/20'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
              title={isAdmin ? "Continuously simulate incoming print events from multiple computers" : "Admin PIN required to toggle traffic simulation"}
            >
              {isSimulating ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                  <span>Simulating Stream</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-slate-500" />
                  <span>Auto Simulator</span>
                  {!isAdmin && <Lock className="w-3 h-3 text-slate-400 ml-0.5" />}
                </>
              )}
            </button>

            {/* Send Single Print Event */}
            <button
              id="btn-simulate-single-job"
              onClick={onSimulateOnce}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
              title="Send a sample print telemetry packet from a random computer node"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
              <span>Simulate Event</span>
            </button>

            {/* Register Workstation */}
            <button
              id="btn-add-workstation"
              onClick={handleAddNode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Add Node</span>
              {!isAdmin && <Lock className="w-3 h-3 text-slate-400 ml-0.5" />}
            </button>

            {/* Connect Client Guide */}
            <button
              id="btn-connect-agent-guide"
              onClick={onOpenConnectModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 shadow-xs transition-all"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Connect Agent</span>
            </button>

            {/* Download Windows App (.zip) */}
            <a
              id="btn-download-windows-package"
              href="/api/download/PrintPulse-Windows.zip"
              download="PrintPulse-Windows.zip"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 shadow-xs transition-all"
              title="Download complete Windows distribution package (.zip with PrintPulse.exe and installer)"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Windows App</span>
              <span className="sm:hidden">App</span>
            </a>

            {/* Notification Center Quick Icon */}
            <button
              onClick={() => setActiveTab('alerts')}
              className="relative p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors hidden md:flex items-center justify-center shadow-xs"
              title="Alerts & Notification Center"
            >
              <Bell className="w-4 h-4" />
              {unresolvedAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-xs animate-pulse">
                  {unresolvedAlertsCount}
                </span>
              )}
            </button>

            {/* Desktop Refresh button */}
            <button
              id="btn-desktop-refresh"
              onClick={onRefresh}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors hidden md:flex items-center justify-center shadow-xs"
              title="Refresh Fleet Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            {/* Admin PIN & Passcode Security Status Lock */}
            <div className="flex items-center pl-1 sm:pl-2 border-l border-slate-200">
              {isAdmin ? (
                <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-300 rounded-lg p-0.5 shadow-2xs">
                  <div 
                    className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-emerald-800"
                    title="Admin Mode Unlocked: You can add, delete, and alter printers, workstations, and alert rules"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden sm:inline">Admin Mode</span>
                  </div>
                  <button
                    id="btn-admin-change-pin"
                    onClick={openChangePinModal}
                    className="p-1 rounded text-emerald-700 hover:bg-emerald-100 hover:text-emerald-900 transition-colors"
                    title="Change Admin Passcode"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                  </button>
                  <button
                    id="btn-admin-lock"
                    onClick={lockAdmin}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                    title="Lock Admin Mode (Switch to Read-Only Viewer)"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Lock</span>
                  </button>
                </div>
              ) : (
                <button
                  id="btn-admin-unlock-trigger"
                  onClick={() => openAuthModal("Unlock Admin Mode with your PIN to delete, add, or configure printers and fleet settings.")}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300 transition-all shadow-2xs group"
                  title="Viewer Mode: Click to enter Admin PIN to unlock full administrative management"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-600 group-hover:text-amber-700" />
                  <span className="hidden sm:inline">Viewer Mode</span>
                  <span className="sm:hidden">Viewer</span>
                  <span className="text-[10px] bg-amber-200/90 text-amber-900 px-1.5 py-0.2 rounded font-bold ml-0.5">
                    Unlock Admin
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav id="printpulse-nav-tabs" className="flex overflow-x-auto no-scrollbar border-t border-slate-100 -mb-px gap-1 pt-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-all ${
                  isActive
                    ? 'border-blue-600 text-blue-600 bg-blue-50/30 rounded-t-lg font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    tab.countHighlight && tab.count > 0
                      ? 'bg-rose-500 text-white font-bold'
                      : isActive
                      ? 'bg-blue-100 text-blue-800 font-semibold'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

