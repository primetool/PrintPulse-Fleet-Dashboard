/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { OverviewTab } from './components/OverviewTab';
import { WorkstationsTab } from './components/WorkstationsTab';
import { PrintersTab } from './components/PrintersTab';
import { JobsTab } from './components/JobsTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { AiCopilotTab } from './components/AiCopilotTab';
import { AlertsTab } from './components/AlertsTab';
import { AlertBanner } from './components/AlertBanner';
import { AgentSetupModal } from './components/AgentSetupModal';
import { AddWorkstationModal } from './components/AddWorkstationModal';
import { JobDetailModal } from './components/JobDetailModal';
import { GeminiChatbot } from './components/GeminiChatbot';
import { ToastContainer, type ToastMessage } from './components/Toast';
import { Sparkles, Bot, X, Maximize2 } from 'lucide-react';
import { useRealtimeSync } from './hooks/useRealtimeSync';
import type { 
  FleetMetrics, 
  DepartmentMetric, 
  PrinterDevice, 
  ComputerNode, 
  PrintJob,
  AiDiagnosticInsight,
  FleetAlert,
  EmailNotificationLog,
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedJob, setSelectedJob] = useState<PrintJob | null>(null);

  // Modals & Controls
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFloatingChatOpen, setIsFloatingChatOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // AI Insights
  const [aiInsights, setAiInsights] = useState<{
    summaryHeadline?: string;
    overallHealthEvaluation?: string;
    estimatedAnnualSavings?: string;
    insights?: AiDiagnosticInsight[];
  } | null>(null);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((title: string, message: string, type: 'success' | 'warning' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Play subtle browser audio tone for alerts
  const playAlertTone = useCallback((severity: 'critical' | 'warning' | 'info') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (severity === 'critical') {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch {
      // Audio context might be restricted before user interaction
    }
  }, []);

  // Real-time synchronization hook
  const {
    metrics,
    departments,
    printers,
    nodes,
    recentJobs,
    allJobs,
    alerts,
    rules,
    alertSettings,
    emailLogs,
    syncStatus,
    isRefreshing,
    fetchOverview,
    acknowledgeAlert,
    resolveAlert,
    resolveAllAlerts,
    updateAlertSettings,
    updateAlertRules,
    sendTestEmail,
    simulateCondition,
  } = useRealtimeSync({
    onNewAlert: (alert: FleetAlert) => {
      addToast(
        `🚨 ${alert.title}`,
        `${alert.message} (Target: ${alert.targetName})`,
        alert.severity === 'critical' ? 'warning' : 'info'
      );
      if (alertSettings.enableSoundAlerts) {
        playAlertTone(alert.severity);
      }
    },
    onNewJob: (job: PrintJob) => {
      if (job.status === 'error') {
        addToast(
          `Print Error: ${job.hostname}`,
          `Failed to print "${job.documentName}" on ${job.printerName}. Reason: ${job.failureReason || 'Spooler failure'}`,
          'warning'
        );
      }
    },
    onEmailSent: (log: EmailNotificationLog) => {
      addToast(
        `✉ Email Dispatched`,
        `Alert sent to ${log.recipient} | Subject: "${log.subject}"`,
        'info'
      );
    }
  });

  const unresolvedAlertsCount = alerts.filter((a) => !a.isResolved).length;
  const unacknowledgedAlertsCount = alerts.filter((a) => !a.isAcknowledged && !a.isResolved).length;

  // Auto-run AI audit once on startup in the background
  useEffect(() => {
    handleRunAiAudit(true);
  }, []);

  // Continuous background Traffic Simulator Interval
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/printpulse/simulate-traffic', { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          if (data.job) {
            addToast(
              `Live Spool: ${data.job.hostname}`,
              `Printed "${data.job.documentName}" (${data.job.pageCount} pgs, ${data.job.isColor ? 'Color' : 'Mono'})`,
              'info'
            );
          }
        }
      } catch (err) {
        console.error('Simulation error:', err);
      }
    }, 3800);

    return () => clearInterval(interval);
  }, [isSimulating, addToast]);

  // Single simulation trigger
  const handleSimulateOnce = async () => {
    try {
      const res = await fetch('/api/printpulse/simulate-traffic', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        addToast(
          `Print Ingested: ${data.job.hostname}`,
          `User ${data.job.user} printed "${data.job.documentName}" on ${data.job.printerName}`,
          'success'
        );
      }
    } catch (err) {
      console.error(err);
      addToast('Simulation Error', 'Failed to generate simulation traffic', 'warning');
    }
  };

  // Specific node test print
  const handleSimulateNodeJob = async (node: ComputerNode) => {
    try {
      const res = await fetch('/api/printpulse/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          computer: {
            hostname: node.hostname,
            os: node.os,
            activeUser: node.activeUser,
            department: node.department,
          },
          job: {
            documentName: `Test_Spool_Page_${node.hostname}.pdf`,
            printerName: node.assignedPrinters?.[0] || 'HP LaserJet Enterprise M608',
            pageCount: 3,
            isColor: false,
            isDuplex: true,
            paperSize: 'A4',
          }
        }),
      });

      if (res.ok) {
        addToast('Test Spool Sent', `Dispatched test print job from workstation ${node.hostname}`, 'success');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Printer maintenance action
  const handlePerformMaintenance = async (printerId: string, action: string) => {
    try {
      const res = await fetch(`/api/printpulse/printers/${printerId}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        const data = await res.json();
        addToast(
          'Maintenance Complete',
          `Successfully applied ${action.replace('_', ' ')} on ${data.printer.name}`,
          'success'
        );
      }
    } catch (err) {
      console.error(err);
      addToast('Error', 'Maintenance action failed', 'warning');
    }
  };

  // Add workstation
  const handleAddWorkstation = async (data: any) => {
    try {
      const res = await fetch('/api/printpulse/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const result = await res.json();
        addToast('Workstation Registered', `Added ${result.node.hostname} (${result.node.department}) to active fleet`, 'success');
      }
    } catch (err) {
      console.error(err);
      addToast('Error', 'Failed to register workstation', 'warning');
    }
  };

  // Send live telemetry packet from sandbox
  const handleSendTelemetry = async (payload: any) => {
    const res = await fetch('/api/printpulse/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      addToast('Telemetry Ingested', `Captured print job from ${payload.computer.hostname}`, 'success');
    }
  };

  // Run AI Fleet Audit
  const handleRunAiAudit = async (background = false) => {
    if (!background) setIsLoadingAudit(true);
    try {
      const res = await fetch('/api/printpulse/ai/audit', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          setAiInsights(data.result);
          if (!background) {
            addToast('AI Audit Complete', 'Gemini 3.7 Flash generated updated fleet diagnostic insights', 'success');
          }
        }
      }
    } catch (err) {
      console.error('Audit error:', err);
    } finally {
      if (!background) setIsLoadingAudit(false);
    }
  };

  return (
    <div id="printpulse-app-root" className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans antialiased">
      
      {/* Top Header & Nav */}
      <Header
        metrics={metrics}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSimulating={isSimulating}
        setIsSimulating={setIsSimulating}
        onSimulateOnce={handleSimulateOnce}
        onOpenConnectModal={() => setIsConnectModalOpen(true)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onRefresh={() => fetchOverview(false)}
        isRefreshing={isRefreshing}
        unresolvedAlertsCount={unresolvedAlertsCount}
        unacknowledgedAlertsCount={unacknowledgedAlertsCount}
        syncStatus={syncStatus}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        
        {/* Persistent Alert Banner if Active Incidents Exist */}
        {activeTab !== 'alerts' && (
          <AlertBanner
            alerts={alerts}
            onReviewAlerts={() => setActiveTab('alerts')}
            onResolve={resolveAlert}
          />
        )}

        {activeTab === 'overview' && (
          <OverviewTab
            metrics={metrics}
            departments={departments}
            printers={printers}
            nodes={nodes}
            recentJobs={recentJobs}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onSimulateOnce={handleSimulateOnce}
            onOpenConnectModal={() => setIsConnectModalOpen(true)}
            onSelectJob={(job) => setSelectedJob(job)}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertsTab
            alerts={alerts}
            rules={rules}
            alertSettings={alertSettings}
            emailLogs={emailLogs}
            onAcknowledge={acknowledgeAlert}
            onResolve={resolveAlert}
            onResolveAll={resolveAllAlerts}
            onUpdateSettings={updateAlertSettings}
            onUpdateRules={updateAlertRules}
            onSendTestEmail={sendTestEmail}
            onSimulateCondition={simulateCondition}
          />
        )}

        {activeTab === 'workstations' && (
          <WorkstationsTab
            nodes={nodes}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onOpenConnectModal={() => setIsConnectModalOpen(true)}
            onSimulateNodeJob={handleSimulateNodeJob}
            onRefresh={() => fetchOverview(false)}
          />
        )}

        {activeTab === 'printers' && (
          <PrintersTab
            printers={printers}
            jobs={allJobs.length > 0 ? allJobs : recentJobs}
            onPerformMaintenance={handlePerformMaintenance}
            onRefresh={() => fetchOverview(false)}
          />
        )}

        {activeTab === 'jobs' && (
          <JobsTab
            jobs={allJobs.length > 0 ? allJobs : recentJobs}
            nodes={nodes}
            printers={printers}
            onSelectJob={(job) => setSelectedJob(job)}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab
            metrics={metrics}
            departments={departments}
            jobs={allJobs.length > 0 ? allJobs : recentJobs}
          />
        )}

        {activeTab === 'ai-copilot' && (
          <AiCopilotTab
            insights={aiInsights}
            isLoadingAudit={isLoadingAudit}
            onRunAudit={() => handleRunAiAudit(false)}
            metrics={metrics}
            printers={printers}
            workstations={nodes}
          />
        )}

        {activeTab === 'agent-setup' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">PrintPulse Agent Integration Center</h2>
            <p className="text-xs text-slate-500">
              Integrate PrintPulse client daemons on Windows, macOS, or Linux computers to aggregate live telemetry.
            </p>
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 shadow-xs"
            >
              Open Interactive Agent Setup & Testing Sandbox
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">PrintPulse Central Fleet Hub</span>
            <span>•</span>
            <span>Multi-Workstation Aggregator v2.4.1</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-emerald-700 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Real-time Ingestion Stream Active ({syncStatus.eventsCount} events received)
            </span>
            <span>•</span>
            <span>Gemini 3.7 Flash Telemetry AI</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AgentSetupModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        printers={printers}
        onSendTestPayload={handleSendTelemetry}
      />

      <AddWorkstationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        printers={printers}
        onAddWorkstation={handleAddWorkstation}
      />

      <JobDetailModal
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
      />

      {/* Floating Gemini AI Chatbot Launcher (accessible on all tabs) */}
      {activeTab !== 'ai-copilot' && (
        <aside aria-label="Floating Gemini Assistant">
          <button
            id="btn-floating-gemini-chat"
            onClick={() => setIsFloatingChatOpen(true)}
            className="fixed bottom-6 right-6 z-40 px-4 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-xl hover:shadow-2xl transition-all duration-200 flex items-center gap-2.5 font-bold text-xs group border-2 border-white/20 cursor-pointer"
            title="Open PrintPulse Gemini AI Copilot"
          >
            <div className="relative">
              <Sparkles className="w-4 h-4 text-blue-100 group-hover:rotate-12 transition-transform" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full" />
            </div>
            <span>Ask Gemini AI</span>
          </button>
        </aside>
      )}

      {/* Floating Gemini Chat Slide-Over Modal */}
      {isFloatingChatOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-900/40 backdrop-blur-xs">
          <div 
            className="fixed inset-0" 
            onClick={() => setIsFloatingChatOpen(false)} 
          />
          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">PrintPulse Gemini Fleet Assistant</h3>
                  <span className="text-[10px] text-slate-500">Live multi-turn conversation across all workstations</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsFloatingChatOpen(false);
                    setActiveTab('ai-copilot');
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors flex items-center gap-1"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Full Screen Tab</span>
                </button>

                <button
                  id="btn-close-floating-chat"
                  onClick={() => setIsFloatingChatOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Content Body */}
            <div className="flex-1 overflow-hidden p-3 bg-slate-50/50">
              <GeminiChatbot
                metrics={metrics}
                printers={printers}
                workstations={nodes}
                initialRole="general_copilot"
                compactMode={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

    </div>
  );
}

