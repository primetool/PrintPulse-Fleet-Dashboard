import React from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  AlertTriangle, 
  TrendingDown, 
  Wrench, 
  Zap,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import type { AiDiagnosticInsight, FleetMetrics, PrinterDevice, ComputerNode } from '../types';
import { GeminiChatbot, ChatRole } from './GeminiChatbot';

interface AiCopilotTabProps {
  insights: {
    summaryHeadline?: string;
    overallHealthEvaluation?: string;
    estimatedAnnualSavings?: string;
    insights?: AiDiagnosticInsight[];
  } | null;
  isLoadingAudit: boolean;
  onRunAudit: () => Promise<void>;
  metrics?: FleetMetrics | null;
  printers?: PrinterDevice[];
  workstations?: ComputerNode[];
}

export const AiCopilotTab: React.FC<AiCopilotTabProps> = ({
  insights,
  isLoadingAudit,
  onRunAudit,
  metrics,
  printers = [],
  workstations = [],
}) => {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'cost': return <TrendingDown className="w-5 h-5 text-emerald-600" />;
      case 'maintenance': return <Wrench className="w-5 h-5 text-amber-600" />;
      case 'anomaly': return <AlertTriangle className="w-5 h-5 text-rose-600" />;
      default: return <Zap className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div id="ai-copilot-tab-content" className="space-y-6">
      
      {/* Top Banner with Run Fleet Audit Button */}
      <div className="bg-white rounded-2xl p-6 text-slate-900 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 shadow-xs">
              <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Enterprise Multi-Model Intelligence</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                  <Cpu className="w-3 h-3" />
                  Gemini 3.1 Pro / 3.5 Flash / 3.1 Flash-Lite
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                {insights?.summaryHeadline || "AI Fleet Diagnostics & Predictive Telemetry Analysis"}
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                {insights?.overallHealthEvaluation || "Analyzes aggregated workstation spool data, toner depletion velocities, and print anomaly patterns."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {insights?.estimatedAnnualSavings && (
              <div className="text-right hidden sm:block">
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Projected Fleet ROI</span>
                <span className="text-xl font-extrabold text-emerald-600">{insights.estimatedAnnualSavings}</span>
              </div>
            )}
            <button
              id="btn-trigger-ai-audit"
              onClick={onRunAudit}
              disabled={isLoadingAudit}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAudit ? 'animate-spin' : ''}`} />
              <span>{isLoadingAudit ? 'Reasoning with Gemini...' : 'Re-Run AI Fleet Audit'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI Diagnostic Insight Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights?.insights?.map((item) => (
          <div
            key={item.id}
            id={`insight-card-${item.id}`}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl border ${
                    item.type === 'cost' ? 'bg-emerald-50 border-emerald-200' :
                    item.type === 'maintenance' ? 'bg-amber-50 border-amber-200' :
                    item.type === 'anomaly' ? 'bg-rose-50 border-rose-200' : 'bg-blue-50 border-blue-200'
                  }`}>
                    {getInsightIcon(item.type)}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{item.type}</span>
                    <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  item.severity === 'critical' ? 'bg-rose-100 text-rose-800' :
                  item.severity === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {item.severity}
                </span>
              </div>

              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                {item.description}
              </p>

              {/* Recommendation Box */}
              <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5 mb-1 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>AI Recommended Action:</span>
                </div>
                <div className="text-slate-700 leading-relaxed">{item.recommendation}</div>
              </div>
            </div>

            {/* Footer with Affected Targets & Savings */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs gap-2">
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[10px] text-slate-400">Targets:</span>
                {item.affectedTargets.map((target, idx) => (
                  <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">
                    {target}
                  </span>
                ))}
              </div>

              {item.potentialMonthlySavings && (
                <span className="text-xs font-bold text-emerald-600">
                  {item.potentialMonthlySavings}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Main Multi-Turn Gemini Chatbot Interface */}
      <div className="mt-8">
        <GeminiChatbot
          metrics={metrics}
          printers={printers}
          workstations={workstations}
          initialRole="general_copilot"
        />
      </div>

    </div>
  );
};
