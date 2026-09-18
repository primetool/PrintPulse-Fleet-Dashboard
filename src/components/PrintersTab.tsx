import React, { useState } from 'react';
import { 
  Printer, 
  Droplet, 
  Layers, 
  Wrench, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  RefreshCw,
  Clock, 
  Trash2,
  Plus,
  RotateCcw,
  X,
  Server,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Lock,
  KeyRound
} from 'lucide-react';
import type { PrinterDevice, PrintJob } from '../types';
import { PrinterForecastSection } from './PrinterForecastSection';
import { useAdminAuth } from '../context/AdminAuthContext';

interface PrintersTabProps {
  printers: PrinterDevice[];
  jobs?: PrintJob[];
  onPerformMaintenance: (printerId: string, action: string) => Promise<void>;
  onRefresh: () => void;
  onDeletePrinter?: (printerId: string, printerName: string) => Promise<void>;
  onClearDemoPrinters?: () => Promise<void>;
  onAddPrinter?: (printerData: Partial<PrinterDevice>) => Promise<void>;
  onRestoreDemoPrinters?: () => Promise<void>;
}

export const PrintersTab: React.FC<PrintersTabProps> = ({
  printers,
  jobs = [],
  onPerformMaintenance,
  onRefresh,
  onDeletePrinter,
  onClearDemoPrinters,
  onAddPrinter,
  onRestoreDemoPrinters,
}) => {
  const { isAdmin, openAuthModal, requireAdminAction } = useAdminAuth();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Deletion modals state
  const [printerToDelete, setPrinterToDelete] = useState<PrinterDevice | null>(null);
  const [showConfirmClearDemo, setShowConfirmClearDemo] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add physical printer modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    model: '',
    manufacturer: 'HP',
    location: '',
    ipAddress: '',
    connectionType: 'network' as 'network' | 'usb' | 'wifi',
    costPerPageMono: 0.02,
    costPerPageColor: 0.08,
  });

  const demoPrinters = printers.filter((p) => p.isDemo || p.id.startsWith('prn-0'));
  const hasDemoPrinters = demoPrinters.length > 0;

  const handleMaintenance = async (printerId: string, action: string) => {
    requireAdminAction(async () => {
      setLoadingAction(`${printerId}-${action}`);
      try {
        await onPerformMaintenance(printerId, action);
      } finally {
        setLoadingAction(null);
      }
    }, `Admin Passcode required to perform hardware maintenance (${action.replace('_', ' ')}).`);
  };

  const handleTriggerClearDemo = () => {
    requireAdminAction(() => {
      setShowConfirmClearDemo(true);
    }, 'Admin Passcode required to permanently remove all demo printers.');
  };

  const handleTriggerDeleteSingle = (printer: PrinterDevice) => {
    requireAdminAction(() => {
      setPrinterToDelete(printer);
    }, `Admin Passcode required to delete printer "${printer.name}".`);
  };

  const handleTriggerAddModal = () => {
    requireAdminAction(() => {
      setIsAddModalOpen(true);
    }, 'Admin Passcode required to register a physical hardware printer.');
  };

  const handleTriggerRestoreDemo = () => {
    if (!onRestoreDemoPrinters) return;
    requireAdminAction(async () => {
      await onRestoreDemoPrinters();
    }, 'Admin Passcode required to restore demo printers.');
  };

  const handleConfirmDeleteSingle = async () => {
    if (!printerToDelete || !onDeletePrinter) return;
    setIsDeleting(true);
    try {
      await onDeletePrinter(printerToDelete.id, printerToDelete.name);
      setPrinterToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmClearAllDemo = async () => {
    if (!onClearDemoPrinters) return;
    setIsDeleting(true);
    try {
      await onClearDemoPrinters();
      setShowConfirmClearDemo(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim() || !onAddPrinter) return;
    setIsSubmittingAdd(true);
    try {
      await onAddPrinter({
        name: addForm.name.trim(),
        model: addForm.model.trim() || 'Standard Office MFP',
        manufacturer: addForm.manufacturer || 'Network',
        location: addForm.location.trim() || 'Main Office',
        ipAddress: addForm.ipAddress.trim() || '192.168.1.100',
        connectionType: addForm.connectionType,
        costPerPageMono: Number(addForm.costPerPageMono) || 0.02,
        costPerPageColor: Number(addForm.costPerPageColor) || 0.08,
      });
      setIsAddModalOpen(false);
      setAddForm({
        name: '',
        model: '',
        manufacturer: 'HP',
        location: '',
        ipAddress: '',
        connectionType: 'network',
        costPerPageMono: 0.02,
        costPerPageColor: 0.08,
      });
    } finally {
      setIsSubmittingAdd(false);
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

    if (isColor) {
      const cyanDays = Number((printer.tonerLevels.cyan / Math.max(dailyPages / 140, 0.3)).toFixed(1));
      if (cyanDays < days && cyanDays > 0) {
        days = cyanDays;
        bottleneck = 'Cyan Toner';
      }
    }

    if (paperDays < days) {
      days = paperDays;
      bottleneck = 'Paper Tray';
    }

    const d = new Date();
    d.setDate(d.getDate() + Math.ceil(days));
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return {
      bottleneck,
      days: Math.max(1, Math.round(days)),
      dateStr,
      isCritical: days <= 3.0,
      isWarning: days > 3.0 && days <= 7.0,
    };
  };

  const getStatusBadge = (printer: PrinterDevice) => {
    switch (printer.status) {
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Online • Ready
          </span>
        );
      case 'printing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
            Printing
          </span>
        );
      case 'toner_low':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Toner Low
          </span>
        );
      case 'jammed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Paper Jam
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Attention Needed
          </span>
        );
      case 'offline':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Offline
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Status Notice Banner */}
      {!isAdmin ? (
        <div id="banner-printers-viewer-mode" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-200/70 flex items-center justify-center shrink-0 border border-amber-300/50">
              <Lock className="w-4 h-4 text-amber-800" />
            </div>
            <div>
              <span className="font-bold text-amber-950 block">Viewer Mode • Protected Fleet Configuration</span>
              <span className="text-amber-800">
                You have real-time read access. Modifying, registering, or deleting printers requires Admin Passcode authorization.
              </span>
            </div>
          </div>
          <button
            id="btn-unlock-printers-admin"
            onClick={() => openAuthModal('Unlock Admin Mode to manage hardware printers and delete demo units.')}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors shrink-0 shadow-2xs flex items-center gap-1.5 justify-center"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Enter Admin PIN</span>
          </button>
        </div>
      ) : (
        <div id="banner-printers-admin-mode" className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-xs text-emerald-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-200/70 flex items-center justify-center shrink-0 border border-emerald-300/50">
              <ShieldCheck className="w-4 h-4 text-emerald-800" />
            </div>
            <div>
              <span className="font-bold text-emerald-950 block">Administrator Mode Active</span>
              <span className="text-emerald-800">
                Authorized session: You can delete demo units, manage physical hardware, and execute maintenance cycles.
              </span>
            </div>
          </div>
          <span className="text-[11px] font-mono font-medium text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-lg border border-emerald-300">
            Admin Authorized
          </span>
        </div>
      )}

      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Hardware Fleet & Consumables Telemetry</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {printers.length} {printers.length === 1 ? 'Printer' : 'Printers'}
            </span>
            {hasDemoPrinters && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                {demoPrinters.length} Demo {demoPrinters.length === 1 ? 'Device' : 'Devices'}
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time SNMP/PrintPulse hardware status, CMYK toner levels, paper trays, and predictive depletion forecast.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Delete All Demo Printers Action */}
          {hasDemoPrinters && onClearDemoPrinters && (
            <button
              id="btn-delete-demo-printers"
              onClick={handleTriggerClearDemo}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Remove pre-populated demo printers from the dashboard"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Delete Demo Printers ({demoPrinters.length})</span>
              {!isAdmin && <Lock className="w-3 h-3 text-rose-400 ml-0.5" />}
            </button>
          )}

          {/* Add Physical Printer Action */}
          {onAddPrinter && (
            <button
              id="btn-add-printer"
              onClick={handleTriggerAddModal}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Physical Printer</span>
              {!isAdmin && <Lock className="w-3 h-3 text-blue-200 ml-0.5" />}
            </button>
          )}

          {/* Restore Demo Printers Action (when no demo printers exist) */}
          {!hasDemoPrinters && onRestoreDemoPrinters && (
            <button
              id="btn-restore-demo-printers"
              onClick={handleTriggerRestoreDemo}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Restore sample demo printers for evaluation and testing"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Restore Demo Printers</span>
              {!isAdmin && <Lock className="w-3 h-3 text-slate-400 ml-0.5" />}
            </button>
          )}

          {/* Refresh Action */}
          <button
            id="btn-refresh-printers"
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
            title="Refresh Fleet Status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Visual Forecast using Recharts (Estimated Days Until Empty) */}
      {printers.length > 0 && (
        <PrinterForecastSection
          printers={printers}
          jobs={jobs}
          onRefillToner={(id) => handleMaintenance(id, 'refill_toner')}
          onReloadPaper={(id) => handleMaintenance(id, 'reload_paper')}
        />
      )}

      {/* Empty Fleet State when all demo printers deleted */}
      {printers.length === 0 && (
        <div id="empty-printers-fleet" className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mx-auto">
            <Printer className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-base font-bold text-slate-900">All Demo Printers Have Been Removed</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your fleet is in clean production mode. Any physical printer used when your Windows PrintPulse desktop client prints a document will be <strong>automatically discovered and registered here in real time</strong>.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            {onAddPrinter && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Physical Printer Manually</span>
              </button>
            )}
            {onRestoreDemoPrinters && (
              <button
                onClick={onRestoreDemoPrinters}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Restore 5 Demo Printers</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Printer Fleet Cards Grid */}
      {printers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Hardware Device Fleet</span>
              <span className="text-xs font-medium text-slate-500">({printers.length} active {printers.length === 1 ? 'unit' : 'units'})</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {printers.map((printer) => {
              const isColor = printer.tonerLevels.cyan > 0 || printer.tonerLevels.magenta > 0 || printer.tonerLevels.yellow > 0;
              const forecast = getPrinterForecastSummary(printer);
              const isDemo = printer.isDemo || printer.id.startsWith('prn-0');

              return (
                <div
                  key={printer.id}
                  id={`printer-card-${printer.id}`}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between transition-shadow hover:shadow-sm"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                          <Printer className="w-6 h-6 text-slate-800" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900">{printer.name}</h3>
                            {isDemo ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                Demo
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                Production
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>{printer.location}</span>
                            <span>•</span>
                            <span className="font-mono">{printer.ipAddress}</span>
                            <span>•</span>
                            <span className="capitalize">{printer.connectionType}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {getStatusBadge(printer)}
                        {/* Delete Single Printer Button */}
                        {onDeletePrinter && (
                          <button
                            id={`btn-delete-printer-${printer.id}`}
                            onClick={() => handleTriggerDeleteSingle(printer)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
                            title={isAdmin ? `Delete ${printer.name}` : `Admin PIN required to delete ${printer.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                            {!isAdmin && <Lock className="w-2.5 h-2.5 text-slate-400" />}
                          </button>
                        )}
                      </div>
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
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Droplet className="w-3 h-3 text-blue-600" />
                        <span>{loadingAction === `${printer.id}-refill_toner` ? 'Refilling...' : 'Refill Toner'}</span>
                      </button>

                      <button
                        id={`btn-reload-paper-${printer.id}`}
                        onClick={() => handleMaintenance(printer.id, 'reload_paper')}
                        disabled={loadingAction === `${printer.id}-reload_paper`}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Layers className="w-3 h-3 text-emerald-600" />
                        <span>Reload Paper</span>
                      </button>

                      <button
                        id={`btn-full-service-${printer.id}`}
                        onClick={() => handleMaintenance(printer.id, 'full_service')}
                        disabled={loadingAction === `${printer.id}-full_service`}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
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
      )}

      {/* Confirmation Modal: Delete Single Printer */}
      {printerToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Printer</h3>
                <p className="text-xs text-slate-500">Remove hardware device from fleet</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-900">{printerToDelete.name}</strong> ({printerToDelete.ipAddress})? This will remove the device from your dashboard and clear its active alerts.
            </p>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
              <div>• Model: <span className="font-semibold text-slate-700">{printerToDelete.model}</span></div>
              <div>• Location: <span className="font-semibold text-slate-700">{printerToDelete.location}</span></div>
              <div>• Type: <span className="font-semibold text-slate-700">{printerToDelete.isDemo ? 'Demo Device' : 'Physical Production Device'}</span></div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPrinterToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSingle}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete ALL Demo Printers */}
      {showConfirmClearDemo && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete All Demo Printers</h3>
                <p className="text-xs text-slate-500">Purge sample devices from dashboard</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This will remove all <strong className="text-slate-900">{demoPrinters.length} sample demo printers</strong> (HP Enterprise, Canon imageRUNNER, Xerox AltaLink, Epson WorkForce, Brother Lab) from your fleet dashboard.
            </p>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong>Clean Production Mode:</strong> After deleting demo printers, any printer that your Windows PrintPulse app spools print jobs to will be auto-discovered and displayed here.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmClearDemo(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAllDemo}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : `Delete ${demoPrinters.length} Demo Printers`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Physical Printer */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Physical Printer</h3>
                  <p className="text-xs text-slate-500">Register an office printer to the PrintPulse fleet</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Printer Display Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Office HP LaserJet Pro M404"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Manufacturer
                  </label>
                  <select
                    value={addForm.manufacturer}
                    onChange={(e) => setAddForm({ ...addForm, manufacturer: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-blue-500 bg-white"
                  >
                    <option value="HP">HP</option>
                    <option value="Canon">Canon</option>
                    <option value="Brother">Brother</option>
                    <option value="Xerox">Xerox</option>
                    <option value="Epson">Epson</option>
                    <option value="Ricoh">Ricoh</option>
                    <option value="Kyocera">Kyocera</option>
                    <option value="Lexmark">Lexmark</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hardware Model
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. LaserJet Enterprise M608"
                    value={addForm.model}
                    onChange={(e) => setAddForm({ ...addForm, model: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    IP Address or Network Host
                  </label>
                  <input
                    type="text"
                    placeholder="192.168.1.150"
                    value={addForm.ipAddress}
                    onChange={(e) => setAddForm({ ...addForm, ipAddress: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Location / Floor
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Floor 2 - Accounting"
                    value={addForm.location}
                    onChange={(e) => setAddForm({ ...addForm, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Connection
                  </label>
                  <select
                    value={addForm.connectionType}
                    onChange={(e) => setAddForm({ ...addForm, connectionType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-blue-500 bg-white"
                  >
                    <option value="network">Ethernet / LAN</option>
                    <option value="wifi">Wi-Fi</option>
                    <option value="usb">Direct USB</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cost/Mono Page ($)
                  </label>
                  <input
                    type="number"
                    step="0.005"
                    min="0"
                    value={addForm.costPerPageMono}
                    onChange={(e) => setAddForm({ ...addForm, costPerPageMono: parseFloat(e.target.value) || 0.02 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cost/Color Page ($)
                  </label>
                  <input
                    type="number"
                    step="0.005"
                    min="0"
                    value={addForm.costPerPageColor}
                    onChange={(e) => setAddForm({ ...addForm, costPerPageColor: parseFloat(e.target.value) || 0.08 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd || !addForm.name.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isSubmittingAdd ? 'Adding...' : 'Add Printer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
