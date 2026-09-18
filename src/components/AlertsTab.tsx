import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Bell,
  Mail,
  Sliders,
  Send,
  Zap,
  RefreshCw,
  Clock,
  Laptop,
  Printer,
  ChevronRight,
  ShieldCheck,
  Flame,
  Volume2,
  VolumeX,
  Sparkles,
  Search,
  Filter,
  Check,
  X,
  ExternalLink,
  Lock,
  KeyRound,
} from 'lucide-react';
import type {
  FleetAlert,
  AlertRule,
  AlertSettings,
  EmailNotificationLog,
  AlertConditionType,
  AlertSeverity,
} from '../types';
import { useAdminAuth } from '../context/AdminAuthContext';

interface AlertsTabProps {
  alerts: FleetAlert[];
  rules: AlertRule[];
  alertSettings: AlertSettings;
  emailLogs: EmailNotificationLog[];
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
  onResolveAll: () => void;
  onUpdateSettings: (settings: Partial<AlertSettings>) => void;
  onUpdateRules: (rules: AlertRule[]) => void;
  onSendTestEmail: (recipient: string, type: AlertConditionType) => Promise<{ success: boolean; log?: EmailNotificationLog }>;
  onSimulateCondition: (condition: string) => Promise<{ success: boolean; alert?: FleetAlert }>;
}

export const AlertsTab: React.FC<AlertsTabProps> = ({
  alerts,
  rules,
  alertSettings,
  emailLogs,
  onAcknowledge,
  onResolve,
  onResolveAll,
  onUpdateSettings,
  onUpdateRules,
  onSendTestEmail,
  onSimulateCondition,
}) => {
  const { isAdmin, openAuthModal, requireAdminAction } = useAdminAuth();
  const [activeSubTab, setActiveSubTab] = useState<'active' | 'rules' | 'emails' | 'simulation'>('active');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'all' | 'resolved'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [testEmailRecipient, setTestEmailRecipient] = useState(alertSettings.primaryEmail);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState<string | null>(null);
  const [simulatingCondition, setSimulatingCondition] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<FleetAlert | null>(null);

  const activeAlerts = alerts.filter((a) => !a.isResolved);
  const criticalCount = activeAlerts.filter((a) => a.severity === 'critical').length;
  const warningCount = activeAlerts.filter((a) => a.severity === 'warning').length;
  const unacknowledgedCount = activeAlerts.filter((a) => !a.isAcknowledged).length;

  const filteredAlerts = alerts.filter((alert) => {
    if (statusFilter === 'active' && alert.isResolved) return false;
    if (statusFilter === 'resolved' && !alert.isResolved) return false;
    if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        alert.title.toLowerCase().includes(q) ||
        alert.message.toLowerCase().includes(q) ||
        alert.targetName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const safeUpdateSettings = (settings: Partial<AlertSettings>) => {
    requireAdminAction(() => {
      onUpdateSettings(settings);
    }, 'Admin Passcode required to modify alert dispatch settings.');
  };

  const handleToggleRule = (ruleId: string) => {
    requireAdminAction(() => {
      const updated = rules.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r));
      onUpdateRules(updated);
    }, 'Admin Passcode required to enable or disable alert trigger rules.');
  };

  const handleToggleRuleEmail = (ruleId: string) => {
    requireAdminAction(() => {
      const updated = rules.map((r) => (r.id === ruleId ? { ...r, sendEmail: !r.sendEmail } : r));
      onUpdateRules(updated);
    }, 'Admin Passcode required to toggle email notification dispatches.');
  };

  const handleUpdateRuleThreshold = (ruleId: string, val: number) => {
    requireAdminAction(() => {
      const updated = rules.map((r) => (r.id === ruleId ? { ...r, thresholdValue: val } : r));
      onUpdateRules(updated);
    }, 'Admin Passcode required to adjust alert sensitivity thresholds.');
  };

  const handleTriggerSimulation = async (condition: string) => {
    requireAdminAction(async () => {
      setSimulatingCondition(condition);
      try {
        await onSimulateCondition(condition);
        setActiveSubTab('active');
      } finally {
        setTimeout(() => setSimulatingCondition(null), 500);
      }
    }, 'Admin Passcode required to simulate fleet conditions.');
  };

  const handleSendTest = async (type: AlertConditionType) => {
    setIsSendingTestEmail(true);
    setTestEmailStatus(null);
    try {
      const res = await onSendTestEmail(testEmailRecipient, type);
      if (res.success) {
        setTestEmailStatus(`✓ Dispatched test notification to ${testEmailRecipient}`);
      } else {
        setTestEmailStatus(`✗ Failed to dispatch email`);
      }
    } finally {
      setIsSendingTestEmail(false);
      setTimeout(() => setTestEmailStatus(null), 4000);
    }
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            Critical
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3.5 h-3.5" />
            Warning
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Info className="w-3.5 h-3.5" />
            Notice
          </span>
        );
    }
  };

  const formatTimeAgo = (iso: string) => {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Active Incidents</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-bold ${activeAlerts.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {activeAlerts.length}
              </span>
              <span className="text-xs text-slate-500">
                {unacknowledgedCount > 0 ? `${unacknowledgedCount} unacknowledged` : 'all acknowledged'}
              </span>
            </div>
          </div>
          <div className={`p-3 rounded-lg ${activeAlerts.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
            <Bell className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Critical & Warning</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900">{criticalCount}</span>
              <span className="text-xs text-slate-500">critical / {warningCount} warnings</span>
            </div>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Email Recipient</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-sm font-semibold text-slate-900 truncate max-w-[180px]" title={alertSettings.primaryEmail}>
                {alertSettings.primaryEmail}
              </span>
            </div>
            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {alertSettings.enableEmailAlerts ? 'Email Gateway Active' : 'Email Alerts Paused'}
            </span>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <Mail className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Delivered Logs</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900">{emailLogs.length}</span>
              <span className="text-xs text-emerald-600 font-medium">100% delivered</span>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('active')}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                activeSubTab === 'active'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Bell className="w-4 h-4" />
              Incidents & Alerts
              {activeAlerts.length > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.2 rounded-full font-bold ${
                    activeSubTab === 'active' ? 'bg-white text-blue-600' : 'bg-rose-500 text-white'
                  }`}
                >
                  {activeAlerts.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSubTab('rules')}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                activeSubTab === 'rules'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Sliders className="w-4 h-4" />
              Alert Rules ({rules.filter((r) => r.enabled).length} Active)
            </button>

            <button
              onClick={() => setActiveSubTab('emails')}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                activeSubTab === 'emails'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Mail className="w-4 h-4" />
              Email Audit Log ({emailLogs.length})
            </button>

            <button
              onClick={() => setActiveSubTab('simulation')}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                activeSubTab === 'simulation'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-500" />
              Incident Simulator
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeAlerts.length > 0 && (
              <button
                onClick={onResolveAll}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Resolve All ({activeAlerts.length})
              </button>
            )}
          </div>
        </div>

        {/* Sub-tab 1: Active & Historic Incidents Feed */}
        {activeSubTab === 'active' && (
          <div className="p-6 space-y-4">
            {/* Filter and search controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
              <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
                <div className="relative w-full">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search incidents, printer name, or device..."
                    className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
                  <button
                    onClick={() => setStatusFilter('active')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      statusFilter === 'active' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Active ({activeAlerts.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All History ({alerts.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('resolved')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      statusFilter === 'resolved' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Resolved ({alerts.filter((a) => a.isResolved).length})
                  </button>
                </div>

                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value as any)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical Only</option>
                  <option value="warning">Warnings Only</option>
                  <option value="info">Info / Notices</option>
                </select>
              </div>
            </div>

            {/* Incident List */}
            {filteredAlerts.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">All PrintPulse Systems Operational</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  No active incidents or hardware alerts matching your filter. Real-time background telemetry monitors continuous print spooler queues.
                </p>
                <div className="mt-4">
                  <button
                    onClick={() => handleTriggerSimulation('paper_jam')}
                    className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Simulate Paper Jam Alert
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border transition-all ${
                      alert.isResolved
                        ? 'bg-slate-50/70 border-slate-200 opacity-75'
                        : alert.severity === 'critical'
                        ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
                        : alert.severity === 'warning'
                        ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 p-2 rounded-lg ${
                            alert.severity === 'critical'
                              ? 'bg-rose-100 text-rose-700'
                              : alert.severity === 'warning'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {alert.targetType === 'printer' ? (
                            <Printer className="w-4 h-4" />
                          ) : (
                            <Laptop className="w-4 h-4" />
                          )}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            {getSeverityBadge(alert.severity)}
                            <h4 className="text-sm font-semibold text-slate-900">{alert.title}</h4>
                            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimeAgo(alert.timestamp)}
                            </span>
                            {alert.emailSent && (
                              <span
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                                title={`Email delivered to ${alert.emailSentTo}`}
                              >
                                <Mail className="w-3 h-3 text-emerald-600" />
                                Email Dispatched
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{alert.message}</p>

                          {alert.suggestedAction && (
                            <div className="mt-2 text-xs bg-white/80 p-2 rounded-lg border border-slate-200/80 text-slate-700 flex items-start gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                              <span>
                                <strong className="font-semibold text-slate-900">Recommended Action: </strong>
                                {alert.suggestedAction}
                              </span>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-4 mt-2.5 text-[11px] text-slate-500">
                            <span>
                              Target: <strong className="text-slate-700 font-medium">{alert.targetName}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Channel:{' '}
                              <span className="capitalize font-medium text-slate-700">{alert.channels.join(', ')}</span>
                            </span>
                            {alert.isAcknowledged && (
                              <>
                                <span>•</span>
                                <span className="text-slate-600 font-medium flex items-center gap-1">
                                  <Check className="w-3 h-3 text-blue-600" />
                                  Acknowledged by {alert.acknowledgedBy || 'Admin'}
                                </span>
                              </>
                            )}
                            {alert.isResolved && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-600 font-medium flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Resolved {formatTimeAgo(alert.resolvedAt!)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-start shrink-0">
                        {!alert.isAcknowledged && !alert.isResolved && (
                          <button
                            onClick={() => onAcknowledge(alert.id)}
                            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-2xs transition-colors"
                          >
                            Acknowledge
                          </button>
                        )}
                        {!alert.isResolved ? (
                          <button
                            onClick={() => onResolve(alert.id)}
                            className="px-3 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Resolve
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium px-2 py-1 bg-slate-100 rounded-md">
                            Archived
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sub-tab 2: Alert Rules Configuration */}
        {activeSubTab === 'rules' && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Telemetry Alert Condition Rules</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure automated evaluation rules that trigger notifications across the dashboard and email gateway.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                  <span>Send email for severity:</span>
                  <select
                    value={alertSettings.minSeverityForEmail}
                    onChange={(e) => onUpdateSettings({ minSeverityForEmail: e.target.value as any })}
                    className="bg-white border border-slate-300 rounded px-2 py-0.5 font-medium text-slate-900 focus:outline-none"
                  >
                    <option value="info">Info & above (All)</option>
                    <option value="warning">Warning & Critical</option>
                    <option value="critical">Critical Only</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-4 rounded-xl border transition-all ${
                    rule.enabled ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-50/60 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            rule.enabled
                              ? rule.severity === 'critical'
                                ? 'bg-rose-500'
                                : 'bg-amber-500'
                              : 'bg-slate-300'
                          }`}
                        />
                        <h4 className="text-sm font-semibold text-slate-900">{rule.name}</h4>
                        {getSeverityBadge(rule.severity)}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{rule.description}</p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={() => handleToggleRule(rule.id)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rule.sendEmail}
                          disabled={!rule.enabled}
                          onChange={() => handleToggleRuleEmail(rule.id)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>Email Alert</span>
                      </label>
                    </div>

                    {rule.conditionType === 'high_error_rate' && (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <span>Threshold:</span>
                        <input
                          type="number"
                          min={5}
                          max={50}
                          value={rule.thresholdValue}
                          onChange={(e) => handleUpdateRuleThreshold(rule.id, Number(e.target.value))}
                          className="w-14 px-1.5 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded text-center font-mono font-medium"
                        />
                        <span>% error</span>
                      </div>
                    )}

                    {rule.conditionType === 'low_toner' && (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <span>Threshold:</span>
                        <input
                          type="number"
                          min={5}
                          max={30}
                          value={rule.thresholdValue}
                          onChange={(e) => handleUpdateRuleThreshold(rule.id, Number(e.target.value))}
                          className="w-14 px-1.5 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded text-center font-mono font-medium"
                        />
                        <span>% supply</span>
                      </div>
                    )}

                    {rule.conditionType === 'workstation_offline' && (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <span>Timeout:</span>
                        <span className="font-mono font-medium text-slate-700">3 mins</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Email Gateway Configuration Card */}
            <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-blue-600" />
                Notification Email Dispatcher Settings
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Primary Notification Email
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      value={alertSettings.primaryEmail}
                      onChange={(e) => onUpdateSettings({ primaryEmail: e.target.value })}
                      className="flex-1 px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    All critical hardware failures, paper jams, and offline notifications are routed here.
                  </span>
                </div>

                <div className="flex flex-col justify-center space-y-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alertSettings.enableEmailAlerts}
                      onChange={(e) => onUpdateSettings({ enableEmailAlerts: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    Enable Real-time Email Dispatching
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alertSettings.enableSoundAlerts}
                      onChange={(e) => onUpdateSettings({ enableSoundAlerts: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    Audible Alerts for Critical Incidents
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sub-tab 3: Email Notification Dispatch Log */}
        {activeSubTab === 'emails' && (
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Email Notification Delivery Logs</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live audit trail of alert messages dispatched to administrator mailbox ({alertSettings.primaryEmail}).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={testEmailRecipient}
                  onChange={(e) => setTestEmailRecipient(e.target.value)}
                  placeholder="Recipient..."
                  className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg w-48 font-mono"
                />
                <button
                  disabled={isSendingTestEmail}
                  onClick={() => handleSendTest('printer_offline')}
                  className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                >
                  <Send className="w-3 h-3" />
                  {isSendingTestEmail ? 'Sending...' : 'Send Test Alert'}
                </button>
              </div>
            </div>

            {testEmailStatus && (
              <div
                className={`p-2.5 rounded-lg text-xs font-medium border ${
                  testEmailStatus.startsWith('✓')
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {testEmailStatus}
              </div>
            )}

            {emailLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No email notifications dispatched yet in this session.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Recipient</th>
                      <th className="py-2.5 px-3">Subject</th>
                      <th className="py-2.5 px-3">Severity</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {emailLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-800 font-medium whitespace-nowrap">
                          {log.recipient}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-900 max-w-xs truncate">
                          {log.subject}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {getSeverityBadge(log.severity)}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium text-[11px] border border-emerald-200">
                            <Check className="w-3 h-3" />
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                          {log.deliveryLatencyMs || 120}ms
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Sub-tab 4: Live Incident Simulator */}
        {activeSubTab === 'simulation' && (
          <div className="p-6 space-y-6">
            <div className="bg-gradient-to-r from-blue-50 via-slate-50 to-indigo-50 p-4.5 rounded-xl border border-blue-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Live Incident & Anomaly Simulation Sandbox
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Trigger real-time simulated printer hardware anomalies and spooler errors to test instant alerting, dashboard banners, email notifications, and recovery workflows.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Paper Jam Trigger */}
              <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-lg bg-rose-50 text-rose-600">
                      <AlertTriangle className="w-4 h-4" />
                    </span>
                    <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      Critical
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-3">Paper Jam / Tray Misfeed</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Trips paper misfeed sensor in Brother HL-L6400DW Lab and immediately pauses queue.
                  </p>
                </div>
                <button
                  disabled={simulatingCondition === 'paper_jam'}
                  onClick={() => handleTriggerSimulation('paper_jam')}
                  className="mt-4 w-full py-2 px-3 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Zap className="w-3.5 h-3.5" />
                  {simulatingCondition === 'paper_jam' ? 'Triggering...' : 'Trigger Paper Jam Alert'}
                </button>
              </div>

              {/* Printer Offline Trigger */}
              <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-lg bg-rose-50 text-rose-600">
                      <Printer className="w-4 h-4" />
                    </span>
                    <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      Critical
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-3">Printer Disconnect / Offline</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Simulates network drop on HP LaserJet Enterprise M608 (IP 192.168.1.101).
                  </p>
                </div>
                <button
                  disabled={simulatingCondition === 'printer_offline'}
                  onClick={() => handleTriggerSimulation('printer_offline')}
                  className="mt-4 w-full py-2 px-3 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Zap className="w-3.5 h-3.5" />
                  {simulatingCondition === 'printer_offline' ? 'Triggering...' : 'Trigger Printer Offline'}
                </button>
              </div>

              {/* High Error Rate Trigger */}
              <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
                      <Flame className="w-4 h-4" />
                    </span>
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Warning
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-3">High Error Rate Spike</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Spools 3 consecutive failed PostScript rasterizer jobs from Finance workstation.
                  </p>
                </div>
                <button
                  disabled={simulatingCondition === 'high_error_rate'}
                  onClick={() => handleTriggerSimulation('high_error_rate')}
                  className="mt-4 w-full py-2 px-3 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Zap className="w-3.5 h-3.5" />
                  {simulatingCondition === 'high_error_rate' ? 'Triggering...' : 'Trigger Error Rate Spike'}
                </button>
              </div>

              {/* Low Toner Trigger */}
              <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
                      <AlertCircle className="w-4 h-4" />
                    </span>
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Warning
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-3">Low Toner Cartridge (&lt;5%)</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Depletes Cyan & Yellow cartridge supply on Epson WorkForce Enterprise C20590.
                  </p>
                </div>
                <button
                  disabled={simulatingCondition === 'low_toner'}
                  onClick={() => handleTriggerSimulation('low_toner')}
                  className="mt-4 w-full py-2 px-3 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Zap className="w-3.5 h-3.5" />
                  {simulatingCondition === 'low_toner' ? 'Triggering...' : 'Trigger Low Toner Alert'}
                </button>
              </div>

              {/* Workstation Heartbeat Timeout */}
              <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
                      <Laptop className="w-4 h-4" />
                    </span>
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      Warning
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-3">Workstation Offline Timeout</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Simulates lost telemetry heartbeat on HR-STATION-01 (over 6 mins silent).
                  </p>
                </div>
                <button
                  disabled={simulatingCondition === 'workstation_offline'}
                  onClick={() => handleTriggerSimulation('workstation_offline')}
                  className="mt-4 w-full py-2 px-3 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Zap className="w-3.5 h-3.5" />
                  {simulatingCondition === 'workstation_offline' ? 'Triggering...' : 'Trigger Node Timeout'}
                </button>
              </div>

              {/* Email Notification Dispatch */}
              <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                      <Mail className="w-4 h-4" />
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Email
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-3">Admin Email Delivery</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Dispatches a formatted HTML alert notification email to {alertSettings.primaryEmail}.
                  </p>
                </div>
                <button
                  disabled={isSendingTestEmail}
                  onClick={() => handleSendTest('printer_offline')}
                  className="mt-4 w-full py-2 px-3 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSendingTestEmail ? 'Dispatching...' : 'Send Test Notification'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
