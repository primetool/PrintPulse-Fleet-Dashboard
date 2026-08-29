import React from 'react';
import { 
  Printer, 
  Laptop, 
  Layers, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  Leaf, 
  Sparkles, 
  ArrowUpRight, 
  Clock, 
  Activity,
  FileText,
  RefreshCw,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import type { FleetMetrics, DepartmentMetric, PrinterDevice, ComputerNode, PrintJob } from '../types';

interface OverviewTabProps {
  metrics: FleetMetrics | null;
  departments: DepartmentMetric[];
  printers: PrinterDevice[];
  nodes: ComputerNode[];
  recentJobs: PrintJob[];
  onNavigateTab: (tab: string) => void;
  onSimulateOnce: () => void;
  onOpenConnectModal: () => void;
  onSelectJob: (job: PrintJob) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  metrics,
  departments,
  printers,
  nodes,
  recentJobs,
  onNavigateTab,
  onSimulateOnce,
  onOpenConnectModal,
  onSelectJob,
}) => {
  const onlineNodes = nodes.filter(n => n.status === 'online');
  const alertPrinters = printers.filter(p => p.status === 'warning' || p.status === 'toner_low' || p.status === 'jammed');

  const getOsIcon = (os: string) => {
    switch (os) {
      case 'macos': return ' macOS';
      case 'linux': return '🐧 Linux';
      default: return '⊞ Windows';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3 h-3" /> Completed</span>;
      case 'printing':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200"><Activity className="w-3 h-3 animate-pulse" /> Printing</span>;
      case 'error':
      case 'jammed':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200"><AlertTriangle className="w-3 h-3" /> Alert</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  return (
    <div id="overview-tab-content" className="space-y-6">
      
      {/* AI Quick Insight Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">Gemini Fleet Intelligence</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Live Ingestion Active</span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                Aggregating print telemetry from {nodes.length} distinct computers across 7 departments.
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Toner levels on Floor 2 require attention within 3 days. 
                Duplex printing policies have saved {metrics?.paperSheetsSavedDuplex || 140} sheets of paper today (${metrics?.costSavedDuplex || '2.10'} saved).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
            <button
              id="btn-quick-ai-audit"
              onClick={() => onNavigateTab('ai-copilot')}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>View Fleet Audit</span>
            </button>
            <button
              id="btn-quick-connect"
              onClick={onOpenConnectModal}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all"
            >
              <span>+ Connect Node</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Print Volume */}
        <div id="stat-card-volume" className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Volume Today</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {metrics?.totalPages || 0}
            </span>
            <span className="text-xs text-slate-500">pages</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <span>{metrics?.totalJobs || 0} jobs ingested</span>
            <span className="text-blue-600 font-medium">{metrics?.colorPages || 0} Color / {metrics?.monoPages || 0} Mono</span>
          </div>
        </div>

        {/* Card 2: Estimated Fleet Spend */}
        <div id="stat-card-spend" className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Est. Daily Print Spend</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              ${metrics?.totalCost ? metrics.totalCost.toFixed(2) : '0.00'}
            </span>
            <span className="text-xs text-emerald-600 font-medium">budget safe</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <span>Avg ${(metrics && metrics.totalPages > 0 ? (metrics.totalCost / metrics.totalPages).toFixed(3) : '0.03')}/page</span>
            <span className="text-emerald-600 font-medium">+${metrics?.costSavedDuplex || '0.00'} saved</span>
          </div>
        </div>

        {/* Card 3: Connected Nodes Online */}
        <div id="stat-card-nodes" className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Workstation Telemetry</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Laptop className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {onlineNodes.length} / {nodes.length}
            </span>
            <span className="text-xs text-slate-500">online</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <span className="text-purple-600 font-medium">Windows, Mac, Linux</span>
            <span className="text-slate-400">100% agent health</span>
          </div>
        </div>

        {/* Card 4: Hardware Fleet Health Score */}
        <div id="stat-card-health" className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Fleet Health Score</span>
            <div className={`p-2 rounded-lg ${
              (metrics?.fleetHealthScore || 90) >= 80 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
            }`}>
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {metrics?.fleetHealthScore || 88}%
            </span>
            <span className="text-xs font-medium text-emerald-600">Optimal</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <span>{printers.length} physical printers</span>
            <span className={`${alertPrinters.length > 0 ? 'text-amber-600 font-medium' : 'text-slate-400'}`}>
              {alertPrinters.length > 0 ? `${alertPrinters.length} need attention` : 'All healthy'}
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Connected Computers & Printer Fleet Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Connected Computers Reporting to PrintPulse */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Laptop className="w-4 h-4 text-blue-600" />
                <span>Reporting Workstations & Computers</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Aggregating live spooler queues and print telemetry from client machines
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('workstations')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View All ({nodes.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {nodes.slice(0, 6).map((node) => (
              <div
                key={node.id}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all bg-slate-50/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700 shadow-xs">
                      {node.os === 'macos' ? '🍏' : node.os === 'linux' ? '🐧' : '🪟'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{node.hostname}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <span className="font-medium text-slate-600">{node.activeUser}</span>
                        <span>•</span>
                        <span>{node.department}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    node.status === 'online'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${node.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                    {node.status}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Jobs Today</span>
                    <span className="font-semibold text-slate-800">{node.totalJobsToday}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Pages</span>
                    <span className="font-semibold text-slate-800">{node.totalPagesToday}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Spend</span>
                    <span className="font-semibold text-slate-800">${node.totalCostToday.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Agents run background print spooler hooks via PrintPulse client</span>
            <button
              onClick={onSimulateOnce}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Simulate Node Event</span>
            </button>
          </div>
        </div>

        {/* Right 1 Col: Printer Fleet Status & Toner Gauges */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Printer className="w-4 h-4 text-blue-600" />
                <span>Printer Fleet Status</span>
              </h3>
              <button
                onClick={() => onNavigateTab('printers')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Manage
              </button>
            </div>

            <div className="space-y-3">
              {printers.slice(0, 3).map((printer) => (
                <div key={printer.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 truncate max-w-[180px]">{printer.name}</div>
                      <div className="text-[10px] text-slate-500">{printer.location}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      printer.status === 'ready' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      printer.status === 'printing' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      printer.status === 'toner_low' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {printer.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* CMYK Mini Bars */}
                  <div className="mt-2.5 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Toner Levels</span>
                      <span>K: {printer.tonerLevels.black}% {printer.tonerLevels.cyan > 0 && `| C: ${printer.tonerLevels.cyan}%`}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 h-1.5 rounded-full overflow-hidden bg-slate-200">
                      {/* Black */}
                      <div 
                        className="bg-slate-900 rounded-sm" 
                        style={{ width: `${printer.tonerLevels.black}%` }} 
                        title={`Black: ${printer.tonerLevels.black}%`}
                      />
                      {/* Cyan */}
                      <div 
                        className="bg-cyan-500 rounded-sm" 
                        style={{ width: `${printer.tonerLevels.cyan}%` }} 
                        title={`Cyan: ${printer.tonerLevels.cyan}%`}
                      />
                      {/* Magenta */}
                      <div 
                        className="bg-pink-500 rounded-sm" 
                        style={{ width: `${printer.tonerLevels.magenta}%` }} 
                        title={`Magenta: ${printer.tonerLevels.magenta}%`}
                      />
                      {/* Yellow */}
                      <div 
                        className="bg-amber-400 rounded-sm" 
                        style={{ width: `${printer.tonerLevels.yellow}%` }} 
                        title={`Yellow: ${printer.tonerLevels.yellow}%`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Eco sustainability metric */}
          <div className="mt-4 p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0">
              <Leaf className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <div className="font-semibold text-emerald-900">Green Printing Impact</div>
              <div className="text-emerald-700 text-[11px]">
                {metrics?.paperSheetsSavedDuplex || 0} sheets saved ({metrics?.co2SavedKg || 0} kg CO2 avoided) via duplex policies.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Master Print Job Ledger Stream */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Real-Time Aggregated Print Feed</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live streaming print jobs collected across all workstations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('jobs')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View Full Ledger</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/75 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200/60">
              <tr>
                <th className="py-2.5 px-3">Job Code</th>
                <th className="py-2.5 px-3">Workstation & User</th>
                <th className="py-2.5 px-3">Document</th>
                <th className="py-2.5 px-3">Printer Device</th>
                <th className="py-2.5 px-3">Pages / Format</th>
                <th className="py-2.5 px-3">Cost</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {recentJobs.slice(0, 7).map((job) => (
                <tr 
                  key={job.id} 
                  onClick={() => onSelectJob(job)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">
                    {job.jobCode}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-900">{job.hostname}</div>
                    <div className="text-[10px] text-slate-400">{job.user} ({job.department})</div>
                  </td>
                  <td className="py-2.5 px-3 max-w-[200px] truncate" title={job.documentName}>
                    <div className="font-medium text-slate-800 truncate">{job.documentName}</div>
                    <div className="text-[10px] text-slate-400 uppercase">{job.documentCategory} • {job.paperSize}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="text-slate-800 font-medium truncate max-w-[150px]">{job.printerName}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-slate-800">{job.pageCount * job.copies} pgs</span>
                    <div className="text-[10px] text-slate-400">
                      {job.isColor ? <span className="text-purple-600 font-medium">Color</span> : 'Mono'} • {job.isDuplex ? '2-Sided' : '1-Sided'}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    ${job.estimatedCost.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3">
                    {getStatusBadge(job.status)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-400 font-mono text-[10px]">
                    {new Date(job.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
