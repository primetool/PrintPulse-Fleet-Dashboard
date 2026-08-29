import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  FleetMetrics,
  DepartmentMetric,
  PrinterDevice,
  ComputerNode,
  PrintJob,
  FleetAlert,
  AlertRule,
  AlertSettings,
  EmailNotificationLog,
  RealtimeSyncStatus,
} from '../types';

interface UseRealtimeSyncProps {
  onNewAlert?: (alert: FleetAlert) => void;
  onNewJob?: (job: PrintJob) => void;
  onEmailSent?: (log: EmailNotificationLog) => void;
}

export function useRealtimeSync({ onNewAlert, onNewJob, onEmailSent }: UseRealtimeSyncProps = {}) {
  const [metrics, setMetrics] = useState<FleetMetrics | null>(null);
  const [departments, setDepartments] = useState<DepartmentMetric[]>([]);
  const [printers, setPrinters] = useState<PrinterDevice[]>([]);
  const [nodes, setNodes] = useState<ComputerNode[]>([]);
  const [recentJobs, setRecentJobs] = useState<PrintJob[]>([]);
  const [allJobs, setAllJobs] = useState<PrintJob[]>([]);
  const [alerts, setAlerts] = useState<FleetAlert[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [alertSettings, setAlertSettings] = useState<AlertSettings>({
    primaryEmail: 'wanyoiker@gmail.com',
    enableEmailAlerts: true,
    enableDashboardAlerts: true,
    enableSoundAlerts: true,
    minSeverityForEmail: 'warning',
    highErrorRateThresholdPct: 15,
    lowTonerThresholdPct: 15,
    offlineTimeoutSeconds: 180,
    paperJamAutoAlert: true,
    emailDigestFrequency: 'instant',
  });
  const [emailLogs, setEmailLogs] = useState<EmailNotificationLog[]>([]);
  const [syncStatus, setSyncStatus] = useState<RealtimeSyncStatus>({
    connected: false,
    lastSyncedAt: new Date().toISOString(),
    transport: 'sse',
    eventsCount: 0,
    latencyMs: 18,
    activeNodesCount: 7,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbacksRef = useRef({ onNewAlert, onNewJob, onEmailSent });

  useEffect(() => {
    callbacksRef.current = { onNewAlert, onNewJob, onEmailSent };
  }, [onNewAlert, onNewJob, onEmailSent]);

  // Full manual/fallback refresh
  const fetchOverview = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    const start = performance.now();
    try {
      const [overviewRes, jobsRes, alertsRes] = await Promise.all([
        fetch('/api/printpulse/overview'),
        fetch('/api/printpulse/jobs?limit=150'),
        fetch('/api/printpulse/alerts'),
      ]);

      const latency = Math.round(performance.now() - start);

      if (overviewRes.ok) {
        const data = await overviewRes.json();
        setMetrics(data.metrics);
        setDepartments(data.departments);
        setPrinters(data.printers);
        setNodes(data.nodes);
        setRecentJobs(data.recentJobs);
      }

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setAllJobs(jobsData.jobs || []);
      }

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData.alerts || []);
        setRules(alertsData.rules || []);
        if (alertsData.settings) setAlertSettings(alertsData.settings);
        setEmailLogs(alertsData.emailLogs || []);
      }

      setSyncStatus((prev) => ({
        ...prev,
        lastSyncedAt: new Date().toISOString(),
        latencyMs: latency || 16,
      }));
    } catch (err) {
      console.error('Failed to fetch telemetry data:', err);
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  }, []);

  // Connect to SSE Stream
  useEffect(() => {
    let isSubscribed = true;

    function connectSSE() {
      if (!isSubscribed) return;

      try {
        const es = new EventSource('/api/printpulse/events');
        eventSourceRef.current = es;

        es.onopen = () => {
          if (!isSubscribed) return;
          setSyncStatus((prev) => ({
            ...prev,
            connected: true,
            transport: 'sse',
            lastSyncedAt: new Date().toISOString(),
          }));
        };

        es.onmessage = (event) => {
          if (!isSubscribed) return;
          try {
            const parsed = JSON.parse(event.data);
            const { type, data } = parsed;

            setSyncStatus((prev) => ({
              ...prev,
              connected: true,
              eventsCount: prev.eventsCount + 1,
              lastSyncedAt: new Date().toISOString(),
            }));

            if (type === 'INITIAL_SYNC') {
              if (data.metrics) setMetrics(data.metrics);
              if (data.departments) setDepartments(data.departments);
              if (data.printers) setPrinters(data.printers);
              if (data.nodes) setNodes(data.nodes);
              if (data.recentJobs) {
                setRecentJobs(data.recentJobs);
                setAllJobs(data.recentJobs);
              }
              if (data.alerts) setAlerts(data.alerts);
              if (data.rules) setRules(data.rules);
              if (data.alertSettings) setAlertSettings(data.alertSettings);
              if (data.emailLogs) setEmailLogs(data.emailLogs);
            } else if (type === 'TELEMETRY_INGESTED') {
              if (data.job) {
                setRecentJobs((prev) => [data.job, ...prev.slice(0, 49)]);
                setAllJobs((prev) => [data.job, ...prev]);
                callbacksRef.current.onNewJob?.(data.job);
              }
              if (data.node) {
                setNodes((prev) => {
                  const idx = prev.findIndex((n) => n.id === data.node.id || n.hostname === data.node.hostname);
                  if (idx >= 0) {
                    const copy = [...prev];
                    copy[idx] = data.node;
                    return copy;
                  }
                  return [data.node, ...prev];
                });
              }
              if (data.printer) {
                setPrinters((prev) =>
                  prev.map((p) => (p.id === data.printer.id ? data.printer : p))
                );
              }
              if (data.metrics) {
                setMetrics(data.metrics);
              }
            } else if (type === 'ALERT_TRIGGERED') {
              setAlerts((prev) => [data, ...prev.filter((a) => a.id !== data.id)]);
              callbacksRef.current.onNewAlert?.(data);
            } else if (type === 'ALERT_UPDATED' || type === 'ALERT_ACKNOWLEDGED' || type === 'ALERT_RESOLVED') {
              setAlerts((prev) =>
                prev.map((a) => (a.id === data.id ? data : a))
              );
            } else if (type === 'ALL_ALERTS_RESOLVED') {
              setAlerts((prev) =>
                prev.map((a) => ({ ...a, isResolved: true, isAcknowledged: true }))
              );
              setPrinters((prev) =>
                prev.map((p) =>
                  p.status === 'jammed' || p.status === 'warning' || p.status === 'offline'
                    ? { ...p, status: 'ready', statusMessage: undefined }
                    : p
                )
              );
            } else if (type === 'ALERT_SETTINGS_UPDATED') {
              setAlertSettings(data);
            } else if (type === 'ALERT_RULES_UPDATED') {
              setRules(data);
            } else if (type === 'EMAIL_DISPATCHED') {
              setEmailLogs((prev) => [data, ...prev.slice(0, 49)]);
              callbacksRef.current.onEmailSent?.(data);
            } else if (type === 'PRINTER_UPDATED') {
              setPrinters((prev) =>
                prev.map((p) => (p.id === data.id ? data : p))
              );
            } else if (type === 'NODE_HEARTBEAT' || type === 'NODE_UPDATED') {
              setNodes((prev) =>
                prev.map((n) => (n.id === data.node?.id ? data.node : n))
              );
            } else if (type === 'NODE_REGISTERED') {
              setNodes((prev) => [data.node, ...prev]);
            } else if (type === 'FLEET_SYNC_PULSE') {
              if (data.metrics) setMetrics(data.metrics);
            }
          } catch (err) {
            console.error('Error handling SSE message:', err);
          }
        };

        es.onerror = () => {
          if (!isSubscribed) return;
          setSyncStatus((prev) => ({ ...prev, connected: false }));
          es.close();

          // Exponential backoff reconnect
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isSubscribed) {
              connectSSE();
              fetchOverview(true); // Fallback sync on reconnect
            }
          }, 3000);
        };
      } catch (err) {
        console.error('SSE connection initiation failed:', err);
      }
    }

    connectSSE();
    fetchOverview(true);

    return () => {
      isSubscribed = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [fetchOverview]);

  // Alert actions
  const acknowledgeAlert = async (alertId: string, user = 'Admin') => {
    try {
      const res = await fetch(`/api/printpulse/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user }),
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts((prev) => prev.map((a) => (a.id === alertId ? data.alert : a)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const res = await fetch(`/api/printpulse/alerts/${alertId}/resolve`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts((prev) => prev.map((a) => (a.id === alertId ? data.alert : a)));
        fetchOverview(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resolveAllAlerts = async () => {
    try {
      const res = await fetch('/api/printpulse/alerts/resolve-all', { method: 'POST' });
      if (res.ok) {
        setAlerts((prev) => prev.map((a) => ({ ...a, isResolved: true, isAcknowledged: true })));
        fetchOverview(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateAlertSettings = async (newSettings: Partial<AlertSettings>) => {
    try {
      const res = await fetch('/api/printpulse/alerts/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      if (res.ok) {
        const data = await res.json();
        setAlertSettings(data.settings);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateAlertRules = async (newRules: AlertRule[]) => {
    try {
      const res = await fetch('/api/printpulse/alerts/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: newRules }),
      });
      if (res.ok) {
        const data = await res.json();
        setRules(data.rules);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const sendTestEmail = async (recipient: string, alertType = 'printer_offline') => {
    try {
      const res = await fetch('/api/printpulse/alerts/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient, alertType }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.log) {
          setEmailLogs((prev) => [data.log, ...prev]);
        }
        return { success: true, log: data.log };
      }
    } catch (err) {
      console.error(err);
      return { success: false, error: err };
    }
  };

  const simulateCondition = async (condition: string) => {
    try {
      const res = await fetch('/api/printpulse/alerts/simulate-condition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ condition }),
      });
      if (res.ok) {
        const data = await res.json();
        fetchOverview(true);
        return { success: true, alert: data.alert };
      }
    } catch (err) {
      console.error(err);
      return { success: false, error: err };
    }
  };

  return {
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
  };
}
