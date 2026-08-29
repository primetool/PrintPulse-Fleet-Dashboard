import React, { useState, useMemo } from 'react';
import { 
  Printer, 
  Droplet, 
  Layers, 
  Wrench, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  RefreshCw,
  Zap,
  HardDrive,
  Info,
  Clock,
  TrendingDown,
  Sparkles
} from 'lucide-react';
import type { PrinterDevice, PrintJob } from '../types';
import { PrinterForecastSection } from './PrinterForecastSection';

interface PrintersTabProps {
  printers: PrinterDevice[];
  jobs?: PrintJob[];
  onPerformMaintenance: (printerId: string, action: string) => Promise<void>;
  onRefresh: () => void;
}

export const PrintersTab: React.FC<PrintersTabProps> = ({
  printers,
  jobs = [],
  onPerformMaintenance,
  onRefresh,
}) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleMaintenance = async (printerId: string, action: string) => {
    setLoadingAction(`${printerId}-${action}`);
    try {
      await onPerformMaintenance(printerId, action);
    } finally {
      setLoadingAction(null);
    }
  };

  // Quick helper to calculate printer run-out estimate for the card badge
  const getPrinterForecastSummary = (printer: PrinterDevice) => {
    const isColor = printer.tonerLevels.cyan > 0 || printer.tonerLevels.magenta > 0 || printer.tonerLevels.yellow > 0;
    
    // Estimate daily pages from jobs
    const printerJobs = jobs.filter((j) => j.printerId === printer.id || j.printerName.toLowerCase() === printer.name.toLowerCase());
    const jobPages = printerJobs.reduce((acc, j) => acc + j.pageCount * j.copies, 0);
    const dailyPages = jobPages > 0 ? Math.max(jobPages * 1.5, 45) : (printer.name.includes('Enterprise') ? 160 : 85);

    const blackDays = Number((printer.tonerLevels.black / Math.max(dailyPages / 95, 0.4)).toFixed(1));
    const paperDays = Number((printer.paperTrays.tray1CapacityPct / Math.max(dailyPages / 5.0, 1.0)).toFixed(1));
    
    let bottleneck = 'Black Toner';
    let days = blackDays;
    let type = 'toner';

    if (paperDays < days) {
      days = paperDays;
      bottleneck = 'Tray 1 Paper';
      type = 'paper';
    }

    if (isColor) {
      const cyanDays = Number((printer.tonerLevels.cyan / Math.max((dailyPages * 0.4) / 60, 0.3)).toFixed(1));
      if (cyanDays < days) {
        days = cyanDays;
        bottleneck = 'Cyan Toner';
      }
    }

    const emptyDate = new Date();
    emptyDate.setDate(emptyDate.getDate() + Math.ceil(days));
    const dateStr = emptyDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return { days, bottleneck, dateStr, type, isCritical: days <= 3.0, isWarning: days > 3.0 && days <= 7.0 };
  };

  const getStatusBadge = (printer: PrinterDevice) => {
    switch (printer.status) {
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Ready
          </span>
        );
      case 'printing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            Printing
          </span>
        );
      case 'toner_low':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Droplet className="w-3.5 h-3.5" />
            Toner Low
          </span>
        );
      case 'warning':
      case 'jammed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            {printer.status === 'jammed' ? 'Paper Jam' : 'Alert'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Offline
          </span>
        );
    }
  };

  return (
    <div id="printers-tab-content" className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-600" />
            <span>Hardware Fleet & Consumables Telemetry</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {printers.length} Printers
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time SNMP/PrintPulse hardware status, CMYK toner levels, paper trays, and predictive depletion forecast.
          </p>
        </div>
      </div>

      {/* Visual Forecast using Recharts (Estimated Days Until Empty) */}
      <PrinterForecastSection
        printers={printers}
        jobs={jobs}
        onRefillToner={(id) => handleMaintenance(id, 'refill_toner')}
        onReloadPaper={(id) => handleMaintenance(id, 'reload_paper')}
      />

      {/* Printer Fleet Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>Hardware Device Fleet</span>
            <span className="text-xs font-medium text-slate-500">({printers.length} online units)</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {printers.map((printer) => {
            const isColor = printer.tonerLevels.cyan > 0 || printer.tonerLevels.magenta > 0 || printer.tonerLevels.yellow > 0;
            const forecast = getPrinterForecastSummary(printer);

            return (
              <div
                key={printer.id}
                id={`printer-card-${printer.id}`}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700">
                        <Printer className="w-6 h-6 text-slate-800" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{printer.name}</h3>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{printer.location}</span>
                          <span>•</span>
                          <span className="font-mono">{printer.ipAddress}</span>
                        </div>
                      </div>
                    </div>

                    {getStatusBadge(printer)}
                  </div>

                  {/* Status alert message if any */}
                  {printer.statusMessage && (
                    <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{printer.statusMessage}</span>
                    </div>
                  )}

                  {/* Active Job in Queue */}
                  {printer.currentJobName && (
                    <div className="mt-2.5 p-2 rounded-lg bg-blue-50/70 border border-blue-200 text-[11px] text-blue-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <Activity className="w-3.5 h-3.5 text-blue-600 animate-spin shrink-0" />
                        <span className="truncate">Spooling: <strong className="font-semibold">{printer.currentJobName}</strong></span>
                      </div>
                      <span className="text-[10px] font-semibold bg-blue-200/60 px-1.5 py-0.5 rounded text-blue-900">
                        {printer.activeJobsInQueue} in queue
                      </span>
                    </div>
                  )}

                  {/* Days Until Empty Forecast Mini-Banner */}
                  <div
                    className={`mt-3 p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition-colors ${
                      forecast.isCritical
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : forecast.isWarning
                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock
                        className={`w-4 h-4 shrink-0 ${
                          forecast.isCritical ? 'text-rose-600' : forecast.isWarning ? 'text-amber-600' : 'text-slate-500'
                        }`}
                      />
                      <div>
                        <span className="font-semibold">Est. {forecast.days} Days Until Empty</span>
                        <span className="opacity-75 ml-1 text-[11px]">({forecast.bottleneck} • {forecast.dateStr})</span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        forecast.isCritical
                          ? 'bg-rose-200/80 text-rose-900'
                          : forecast.isWarning
                          ? 'bg-amber-200/80 text-amber-900'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {forecast.isCritical ? 'Order Now' : forecast.isWarning ? 'Approaching' : 'Optimal'}
                    </span>
                  </div>

                  {/* CMYK Toner Levels */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Droplet className="w-3.5 h-3.5 text-blue-600" />
                        <span>Consumables & Toner Levels</span>
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">
                        {isColor ? 'CMYK High-Yield Cartridges' : 'Monochrome High-Yield Toner'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {/* Black (K) */}
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 mb-1">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-900"></span> Black (K)</span>
                          <span>{printer.tonerLevels.black}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${printer.tonerLevels.black <= 15 ? 'bg-rose-500 animate-pulse' : 'bg-slate-900'}`}
                            style={{ width: `${printer.tonerLevels.black}%` }}
                          />
                        </div>
                      </div>

                      {/* Cyan (C) */}
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 mb-1">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-500"></span> Cyan (C)</span>
                          <span>{printer.tonerLevels.cyan}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${printer.tonerLevels.cyan <= 15 && printer.tonerLevels.cyan > 0 ? 'bg-rose-500 animate-pulse' : 'bg-cyan-500'}`}
                            style={{ width: `${printer.tonerLevels.cyan}%` }}
                          />
                        </div>
                      </div>

                      {/* Magenta (M) */}
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 mb-1">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-500"></span> Magenta (M)</span>
                          <span>{printer.tonerLevels.magenta}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${printer.tonerLevels.magenta <= 15 && printer.tonerLevels.magenta > 0 ? 'bg-rose-500 animate-pulse' : 'bg-pink-500'}`}
                            style={{ width: `${printer.tonerLevels.magenta}%` }}
                          />
                        </div>
                      </div>

                      {/* Yellow (Y) */}
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 mb-1">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Yellow (Y)</span>
                          <span>{printer.tonerLevels.yellow}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${printer.tonerLevels.yellow <= 15 && printer.tonerLevels.yellow > 0 ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'}`}
                            style={{ width: `${printer.tonerLevels.yellow}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Paper Trays & Drum Life */}
                  <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-medium">Tray 1 (Letter/A4)</span>
                      <span className="font-bold text-slate-800">{printer.paperTrays.tray1CapacityPct}% Capacity</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-medium">Drum Unit Health</span>
                      <span className="font-bold text-slate-800">{printer.drumLifePercent}% remaining</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-slate-400 block font-medium">Lifetime Pages</span>
                      <span className="font-bold text-slate-800">{printer.totalPagesPrinted.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Maintenance Actions Toolbar */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400">
                    Rates: Mono <strong className="text-slate-700 font-semibold">${printer.costPerPageMono}</strong> | Color <strong className="text-slate-700 font-semibold">${printer.costPerPageColor}</strong>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      id={`btn-refill-toner-${printer.id}`}
                      onClick={() => handleMaintenance(printer.id, 'refill_toner')}
                      disabled={loadingAction === `${printer.id}-refill_toner`}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1 shadow-xs"
                    >
                      <Droplet className="w-3 h-3 text-blue-600" />
                      <span>{loadingAction === `${printer.id}-refill_toner` ? 'Refilling...' : 'Refill Toner'}</span>
                    </button>

                    <button
                      id={`btn-reload-paper-${printer.id}`}
                      onClick={() => handleMaintenance(printer.id, 'reload_paper')}
                      disabled={loadingAction === `${printer.id}-reload_paper`}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1 shadow-xs"
                    >
                      <Layers className="w-3 h-3 text-emerald-600" />
                      <span>Reload Paper</span>
                    </button>

                    <button
                      id={`btn-full-service-${printer.id}`}
                      onClick={() => handleMaintenance(printer.id, 'full_service')}
                      disabled={loadingAction === `${printer.id}-full_service`}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors flex items-center gap-1 shadow-xs"
                    >
                      <Wrench className="w-3 h-3" />
                      <span>Full Service</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
