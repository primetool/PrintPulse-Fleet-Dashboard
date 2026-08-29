import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, ChevronRight, X, Mail } from 'lucide-react';
import type { FleetAlert } from '../types';

interface AlertBannerProps {
  alerts: FleetAlert[];
  onReviewAlerts: () => void;
  onResolve: (id: string) => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  alerts,
  onReviewAlerts,
  onResolve,
}) => {
  const activeAlerts = alerts.filter((a) => !a.isResolved);
  if (activeAlerts.length === 0) return null;

  const criticalAlerts = activeAlerts.filter((a) => a.severity === 'critical');
  const topAlert = criticalAlerts[0] || activeAlerts[0];

  return (
    <div
      className={`px-4 py-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs transition-all ${
        criticalAlerts.length > 0
          ? 'bg-rose-50 border-rose-200 text-rose-900'
          : 'bg-amber-50 border-amber-200 text-amber-900'
      }`}
    >
      <div className="flex items-start sm:items-center gap-3">
        <div
          className={`p-1.5 rounded-lg shrink-0 ${
            criticalAlerts.length > 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
        </div>

        <div className="text-xs">
          <span className="font-bold mr-2">
            {activeAlerts.length} Active Incident{activeAlerts.length > 1 ? 's' : ''} Detected:
          </span>
          <span className="font-medium text-slate-800">{topAlert.title}</span>
          {activeAlerts.length > 1 && (
            <span className="text-slate-500 ml-1.5">
              (+{activeAlerts.length - 1} other{activeAlerts.length > 2 ? 's' : ''})
            </span>
          )}
          {topAlert.emailSent && (
            <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-100/60 px-1.5 py-0.2 rounded">
              <Mail className="w-3 h-3 text-emerald-600" />
              Email Sent
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        <button
          onClick={() => onResolve(topAlert.id)}
          className="px-2.5 py-1 text-xs font-semibold bg-white/90 hover:bg-white text-slate-700 border border-slate-300 rounded-lg shadow-2xs transition-colors"
        >
          Quick Resolve
        </button>
        <button
          onClick={onReviewAlerts}
          className={`px-3 py-1 text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1 ${
            criticalAlerts.length > 0
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : 'bg-amber-600 hover:bg-amber-700 text-white'
          }`}
        >
          Review All ({activeAlerts.length})
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
