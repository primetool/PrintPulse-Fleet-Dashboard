import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine,
  LineChart,
  Line,
  AreaChart,
  Area,
  Cell
} from 'recharts';
import { 
  Calendar, 
  TrendingDown, 
  AlertTriangle, 
  Clock, 
  Droplet, 
  Layers, 
  Sparkles, 
  Sliders, 
  CheckCircle2, 
  ArrowRight,
  Package,
  Zap,
  Info
} from 'lucide-react';
import type { PrinterDevice, PrintJob } from '../types';

interface PrinterForecastSectionProps {
  printers: PrinterDevice[];
  jobs: PrintJob[];
  onRefillToner?: (printerId: string) => void;
  onReloadPaper?: (printerId: string) => void;
}

export interface PrinterDepletionForecast {
  printerId: string;
  printerName: string;
  location: string;
  model: string;
  dailyPageRate: number;
  dailyColorRate: number;
  dailyMonoRate: number;
  // Days until empty
  daysUntilBlackTonerEmpty: number;
  daysUntilCyanEmpty: number;
  daysUntilMagentaEmpty: number;
  daysUntilYellowEmpty: number;
  daysUntilMinTonerEmpty: number;
  daysUntilPaperEmpty: number;
  daysUntilDrumEmpty: number;
  daysUntilBottleneckEmpty: number;
  bottleneckConsumable: string;
  bottleneckType: 'toner' | 'paper' | 'drum';
  statusCategory: 'critical' | 'warning' | 'healthy';
  projectedEmptyDate: string;
  suggestedAction: string;
  partNumber: string;
}

export const PrinterForecastSection: React.FC<PrinterForecastSectionProps> = ({
  printers,
  jobs,
  onRefillToner,
  onReloadPaper,
}) => {
  // State for forecast controls
  const [selectedChartMode, setSelectedChartMode] = useState<'comparison' | 'trajectory'>('comparison');
  const [selectedPrinterId, setSelectedPrinterId] = useState<string>('all');
  const [workloadMultiplier, setWorkloadMultiplier] = useState<number>(1.0); // 0.7 = low, 1.0 = normal, 1.4 = surge
  const [consumableFilter, setConsumableFilter] = useState<'all' | 'toner' | 'paper'>('all');

  // Compute realistic historical daily rates & forecast models for each printer
  const forecasts = useMemo<PrinterDepletionForecast[]>(() => {
    // Reference base date (current time)
    const baseDate = new Date();

    return printers.map((printer) => {
      // Find jobs logged for this printer
      const printerJobs = jobs.filter(
        (j) => j.printerId === printer.id || j.printerName.toLowerCase() === printer.name.toLowerCase()
      );

      const totalJobPages = printerJobs.reduce((acc, j) => acc + j.pageCount * j.copies, 0);
      const colorJobPages = printerJobs
        .filter((j) => j.isColor)
        .reduce((acc, j) => acc + j.pageCount * j.copies, 0);
      const monoJobPages = totalJobPages - colorJobPages;

      // Base daily burn rate: derived from jobs + fleet baseline based on printer tier
      // Typical office volume: 80 - 240 pages/day per printer
      let baseDailyPages = totalJobPages > 0 ? Math.max(totalJobPages * 1.5, 45) : 85;
      if (printer.name.includes('Enterprise') || printer.name.includes('Lobby') || printer.name.includes('HQ')) {
        baseDailyPages = Math.max(baseDailyPages, 160);
      } else if (printer.name.includes('Marketing') || printer.name.includes('Design')) {
        baseDailyPages = Math.max(baseDailyPages, 130);
      }

      // Apply workload multiplier
      const dailyPageRate = Math.round(baseDailyPages * workloadMultiplier);
      const isColorPrinter =
        printer.tonerLevels.cyan > 0 || printer.tonerLevels.magenta > 0 || printer.tonerLevels.yellow > 0;
      
      const dailyColorRate = isColorPrinter 
        ? Math.round(dailyPageRate * (colorJobPages > 0 ? colorJobPages / Math.max(totalJobPages, 1) : 0.45))
        : 0;
      const dailyMonoRate = dailyPageRate - dailyColorRate;

      // Standard cartridge yield assumptions:
      // Black high-yield: 10,000 pages (1% = 100 pages)
      // Color high-yield: 6,000 pages (1% = 60 pages)
      // Paper tray capacity: 500 sheets (1% = 5 sheets)
      // Drum unit: 40,000 pages (1% = 400 pages)
      const blackPagesPerPct = 95;
      const colorPagesPerPct = 60;
      const paperSheetsPerPct = 5.0;
      const drumPagesPerPct = 350;

      // Calculate days remaining (avoiding division by zero)
      const blackDailyBurn = Math.max((dailyMonoRate + dailyColorRate * 0.35) / blackPagesPerPct, 0.4);
      const daysUntilBlackTonerEmpty = Number((printer.tonerLevels.black / blackDailyBurn).toFixed(1));

      let daysUntilCyanEmpty = 999;
      let daysUntilMagentaEmpty = 999;
      let daysUntilYellowEmpty = 999;

      if (isColorPrinter && dailyColorRate > 0) {
        const cyanDailyBurn = Math.max((dailyColorRate * 0.38) / colorPagesPerPct, 0.3);
        const magentaDailyBurn = Math.max((dailyColorRate * 0.35) / colorPagesPerPct, 0.3);
        const yellowDailyBurn = Math.max((dailyColorRate * 0.32) / colorPagesPerPct, 0.3);

        daysUntilCyanEmpty = Number((printer.tonerLevels.cyan / cyanDailyBurn).toFixed(1));
        daysUntilMagentaEmpty = Number((printer.tonerLevels.magenta / magentaDailyBurn).toFixed(1));
        daysUntilYellowEmpty = Number((printer.tonerLevels.yellow / yellowDailyBurn).toFixed(1));
      }

      const daysUntilMinTonerEmpty = isColorPrinter
        ? Math.min(daysUntilBlackTonerEmpty, daysUntilCyanEmpty, daysUntilMagentaEmpty, daysUntilYellowEmpty)
        : daysUntilBlackTonerEmpty;

      // Paper Tray 1
      const paperDailyBurn = Math.max(dailyPageRate / paperSheetsPerPct, 1.0);
      const daysUntilPaperEmpty = Number((printer.paperTrays.tray1CapacityPct / paperDailyBurn).toFixed(1));

      // Drum unit
      const drumDailyBurn = Math.max(dailyPageRate / drumPagesPerPct, 0.2);
      const daysUntilDrumEmpty = Number((printer.drumLifePercent / drumDailyBurn).toFixed(1));

      // Determine bottleneck
      let bottleneckConsumable = 'Black Toner (K)';
      let bottleneckType: 'toner' | 'paper' | 'drum' = 'toner';
      let daysUntilBottleneckEmpty = daysUntilBlackTonerEmpty;

      if (isColorPrinter) {
        if (daysUntilCyanEmpty < daysUntilBottleneckEmpty) {
          daysUntilBottleneckEmpty = daysUntilCyanEmpty;
          bottleneckConsumable = 'Cyan Toner (C)';
        }
        if (daysUntilMagentaEmpty < daysUntilBottleneckEmpty) {
          daysUntilBottleneckEmpty = daysUntilMagentaEmpty;
          bottleneckConsumable = 'Magenta Toner (M)';
        }
        if (daysUntilYellowEmpty < daysUntilBottleneckEmpty) {
          daysUntilBottleneckEmpty = daysUntilYellowEmpty;
          bottleneckConsumable = 'Yellow Toner (Y)';
        }
      }

      if (daysUntilPaperEmpty < daysUntilBottleneckEmpty) {
        daysUntilBottleneckEmpty = daysUntilPaperEmpty;
        bottleneckConsumable = 'Tray 1 Paper Supply';
        bottleneckType = 'paper';
      }

      if (daysUntilDrumEmpty < daysUntilBottleneckEmpty) {
        daysUntilBottleneckEmpty = daysUntilDrumEmpty;
        bottleneckConsumable = 'Drum Unit Imaging Core';
        bottleneckType = 'drum';
      }

      // Status categorization
      let statusCategory: 'critical' | 'warning' | 'healthy' = 'healthy';
      if (daysUntilBottleneckEmpty <= 3.0 || printer.tonerLevels.black <= 15 || printer.paperTrays.tray1CapacityPct <= 15) {
        statusCategory = 'critical';
      } else if (daysUntilBottleneckEmpty <= 7.0 || printer.tonerLevels.black <= 30) {
        statusCategory = 'warning';
      }

      // Projected empty date string
      const emptyDate = new Date(baseDate);
      emptyDate.setDate(emptyDate.getDate() + Math.ceil(daysUntilBottleneckEmpty));
      const projectedEmptyDate = emptyDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      // Cartridge / SKU metadata
      let partNumber = 'HP-W1470X / BK';
      if (printer.model.includes('Canon')) partNumber = 'CRG-056 High Yield';
      else if (printer.model.includes('Brother')) partNumber = 'TN-850 Ultra Yield';
      else if (printer.model.includes('Epson')) partNumber = 'T11B Multi-Pack';
      else if (printer.model.includes('Xerox')) partNumber = 'XER-106R03887';

      let suggestedAction = `Order replacement ${bottleneckConsumable} before ${projectedEmptyDate}`;
      if (bottleneckType === 'paper') {
        suggestedAction = `Restock Tray 1 with 2 reams 80gsm paper (${daysUntilPaperEmpty}d remaining)`;
      }

      return {
        printerId: printer.id,
        printerName: printer.name,
        location: printer.location,
        model: printer.model,
        dailyPageRate,
        dailyColorRate,
        dailyMonoRate,
        daysUntilBlackTonerEmpty,
        daysUntilCyanEmpty,
        daysUntilMagentaEmpty,
        daysUntilYellowEmpty,
        daysUntilMinTonerEmpty,
        daysUntilPaperEmpty,
        daysUntilDrumEmpty,
        daysUntilBottleneckEmpty,
        bottleneckConsumable,
        bottleneckType,
        statusCategory,
        projectedEmptyDate,
        suggestedAction,
        partNumber,
      };
    });
  }, [printers, jobs, workloadMultiplier]);

  // Summary counts
  const criticalCount = forecasts.filter((f) => f.statusCategory === 'critical').length;
  const warningCount = forecasts.filter((f) => f.statusCategory === 'warning').length;
  const averageDaysUntilEmpty = Math.round(
    forecasts.reduce((acc, f) => acc + f.daysUntilBottleneckEmpty, 0) / Math.max(forecasts.length, 1)
  );

  // Bar Chart Data (Comparison View)
  const barChartData = useMemo(() => {
    return forecasts.map((f) => ({
      name: f.printerName.replace('Office ', '').replace('Floor ', 'Fl.').replace('Printer', 'Pr.'),
      fullName: f.printerName,
      location: f.location,
      blackTonerDays: Math.min(f.daysUntilBlackTonerEmpty, 35),
      minTonerDays: Math.min(f.daysUntilMinTonerEmpty, 35),
      paperDays: Math.min(f.daysUntilPaperEmpty, 35),
      drumDays: Math.min(f.daysUntilDrumEmpty, 45),
      bottleneckDays: f.daysUntilBottleneckEmpty,
      bottleneckConsumable: f.bottleneckConsumable,
      projectedEmptyDate: f.projectedEmptyDate,
      dailyRate: f.dailyPageRate,
      statusCategory: f.statusCategory,
    }));
  }, [forecasts]);

  // Trajectory Simulation Data (Next 14 Days decay curves)
  const trajectoryData = useMemo(() => {
    const daysArray = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
    const targetForecasts =
      selectedPrinterId === 'all'
        ? forecasts
        : forecasts.filter((f) => f.printerId === selectedPrinterId);

    return daysArray.map((day) => {
      const dataPoint: Record<string, any> = {
        day: day === 0 ? 'Today' : `+${day}d`,
        dayNum: day,
      };

      if (selectedPrinterId === 'all') {
        // Average fleet depletion
        let avgTonerPct = 0;
        let avgPaperPct = 0;

        printers.forEach((p) => {
          const forecast = forecasts.find((f) => f.printerId === p.id);
          const dailyTonerBurn = forecast ? 100 / Math.max(forecast.daysUntilMinTonerEmpty, 1) : 4;
          const dailyPaperBurn = forecast ? 100 / Math.max(forecast.daysUntilPaperEmpty, 1) : 10;

          const currentToner = Math.min(p.tonerLevels.black, p.tonerLevels.cyan || 100);
          avgTonerPct += Math.max(0, Math.round(currentToner - dailyTonerBurn * day));
          avgPaperPct += Math.max(0, Math.round(p.paperTrays.tray1CapacityPct - dailyPaperBurn * day));
        });

        dataPoint['Avg Fleet Toner'] = Math.round(avgTonerPct / Math.max(printers.length, 1));
        dataPoint['Avg Fleet Paper'] = Math.round(avgPaperPct / Math.max(printers.length, 1));
      } else {
        // Individual printer detailed consumable curves
        const printer = printers.find((p) => p.id === selectedPrinterId);
        const forecast = forecasts.find((f) => f.printerId === selectedPrinterId);

        if (printer && forecast) {
          const blackBurn = 100 / Math.max(forecast.daysUntilBlackTonerEmpty, 1);
          const paperBurn = 100 / Math.max(forecast.daysUntilPaperEmpty, 1);
          const drumBurn = 100 / Math.max(forecast.daysUntilDrumEmpty, 1);

          dataPoint['Black Toner'] = Math.max(0, Math.round(printer.tonerLevels.black - blackBurn * day));
          dataPoint['Tray 1 Paper'] = Math.max(0, Math.round(printer.paperTrays.tray1CapacityPct - paperBurn * day));
          dataPoint['Drum Unit'] = Math.max(0, Math.round(printer.drumLifePercent - drumBurn * day));

          if (printer.tonerLevels.cyan > 0) {
            const cyanBurn = 100 / Math.max(forecast.daysUntilCyanEmpty, 1);
            dataPoint['Cyan Toner'] = Math.max(0, Math.round(printer.tonerLevels.cyan - cyanBurn * day));
          }
          if (printer.tonerLevels.magenta > 0) {
            const magentaBurn = 100 / Math.max(forecast.daysUntilMagentaEmpty, 1);
            dataPoint['Magenta Toner'] = Math.max(0, Math.round(printer.tonerLevels.magenta - magentaBurn * day));
          }
          if (printer.tonerLevels.yellow > 0) {
            const yellowBurn = 100 / Math.max(forecast.daysUntilYellowEmpty, 1);
            dataPoint['Yellow Toner'] = Math.max(0, Math.round(printer.tonerLevels.yellow - yellowBurn * day));
          }
        }
      }

      return dataPoint;
    });
  }, [printers, forecasts, selectedPrinterId]);

  if (printers.length === 0) {
    return null;
  }

  return (
    <div id="printer-forecast-container" className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-6">
      
      {/* Forecast Header & Meta */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Hardware Depletion Horizon & Consumable Forecast</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Sparkles className="w-3 h-3" />
                  Predictive Analytics
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Estimates remaining operational days for toner cartridges, paper trays, and maintenance kits based on active run rates.
              </p>
            </div>
          </div>
        </div>

        {/* Forecast Summary KPIs */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-400 block text-[10px] font-medium">Avg Fleet Autonomy</span>
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              {averageDaysUntilEmpty} Days
            </span>
          </div>

          <div
            className={`px-3 py-1.5 rounded-xl border text-xs ${
              criticalCount > 0
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <span className="block text-[10px] font-medium opacity-80">Critical Run-outs (&le;3d)</span>
            <span className="font-bold flex items-center gap-1">
              {criticalCount > 0 ? (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              )}
              {criticalCount} Device{criticalCount === 1 ? '' : 's'}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            <span className="block text-[10px] font-medium opacity-80">Order Restock (&le;7d)</span>
            <span className="font-bold">{warningCount} Devices</span>
          </div>
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
        
        {/* Left: View Mode Toggles */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedChartMode('comparison')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedChartMode === 'comparison'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            Fleet Depletion Horizon
          </button>

          <button
            onClick={() => setSelectedChartMode('trajectory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedChartMode === 'trajectory'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            14-Day Trajectory Curve
          </button>
        </div>

        {/* Right: Simulation & Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Workload Simulation Multiplier */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium">Demand Rate:</span>
            <select
              value={workloadMultiplier}
              onChange={(e) => setWorkloadMultiplier(Number(e.target.value))}
              className="bg-transparent font-semibold text-blue-700 outline-hidden cursor-pointer"
            >
              <option value={0.7}>Low (-30%)</option>
              <option value={1.0}>Historical Baseline (1.0x)</option>
              <option value={1.4}>Heavy Surge (+40%)</option>
              <option value={2.0}>Peak Audit (+100%)</option>
            </select>
          </div>

          {/* Consumable Filter for Bar Chart */}
          {selectedChartMode === 'comparison' && (
            <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setConsumableFilter('all')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  consumableFilter === 'all' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setConsumableFilter('toner')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  consumableFilter === 'toner' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Toner Only
              </button>
              <button
                onClick={() => setConsumableFilter('paper')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  consumableFilter === 'paper' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Paper Only
              </button>
            </div>
          )}

          {/* Printer Selector for Trajectory View */}
          {selectedChartMode === 'trajectory' && (
            <select
              value={selectedPrinterId}
              onChange={(e) => setSelectedPrinterId(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 font-semibold text-slate-800 outline-hidden"
            >
              <option value="all">Fleet Average</option>
              {printers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Recharts Visualization */}
      <div className="w-full">
        {selectedChartMode === 'comparison' ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">
                Estimated Days Until Empty by Hardware Device
              </span>
              <div className="flex items-center gap-4 text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-slate-800 inline-block" />
                  Black Toner
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
                  Tray 1 Paper
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-indigo-400 inline-block" />
                  Drum Unit
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 15, right: 20, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#64748b', fontSize: 11 }} 
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                    interval={0}
                    angle={-12}
                    textAnchor="end"
                  />
                  <YAxis 
                    unit="d" 
                    tick={{ fill: '#64748b', fontSize: 11 }} 
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-800 z-50">
                            <div className="font-bold border-b border-slate-700 pb-1 flex items-center justify-between gap-4">
                              <span>{d.fullName}</span>
                              <span className="text-[10px] text-slate-400">{d.location}</span>
                            </div>
                            <div className="text-slate-300 flex items-center justify-between gap-4">
                              <span>Daily Print Rate:</span>
                              <span className="font-semibold text-white font-mono">{d.dailyRate} pages/day</span>
                            </div>
                            <div className="text-slate-300 flex items-center justify-between gap-4">
                              <span>Critical Bottleneck:</span>
                              <span className="font-bold text-amber-300">{d.bottleneckConsumable}</span>
                            </div>
                            <div className="text-slate-300 flex items-center justify-between gap-4">
                              <span>Depletion Horizon:</span>
                              <span className={`font-bold ${d.bottleneckDays <= 3 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {d.bottleneckDays} Days ({d.projectedEmptyDate})
                              </span>
                            </div>
                            <div className="pt-1.5 border-t border-slate-800 text-[11px] grid grid-cols-2 gap-x-3 gap-y-0.5 text-slate-400">
                              <div>Toner: <strong className="text-white">{d.blackTonerDays}d</strong></div>
                              <div>Paper: <strong className="text-white">{d.paperDays}d</strong></div>
                              <div>Drum: <strong className="text-white">{d.drumDays}d</strong></div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  {/* Reference Threshold Lines */}
                  <ReferenceLine 
                    y={3} 
                    stroke="#f43f5e" 
                    strokeDasharray="4 4" 
                    label={{ value: '🚨 Critical (3d)', fill: '#e11d48', fontSize: 10, position: 'right' }} 
                  />
                  <ReferenceLine 
                    y={7} 
                    stroke="#f59e0b" 
                    strokeDasharray="4 4" 
                    label={{ value: '⚠️ Restock (7d)', fill: '#d97706', fontSize: 10, position: 'right' }} 
                  />

                  {(consumableFilter === 'all' || consumableFilter === 'toner') && (
                    <Bar dataKey="blackTonerDays" name="Black Toner (Days)" fill="#0f172a" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  )}
                  {(consumableFilter === 'all' || consumableFilter === 'paper') && (
                    <Bar dataKey="paperDays" name="Paper Supply (Days)" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  )}
                  {consumableFilter === 'all' && (
                    <Bar dataKey="drumDays" name="Drum Life (Days)" fill="#818cf8" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">
                14-Day Projected Consumable Decay Curve ({selectedPrinterId === 'all' ? 'Fleet Average' : printers.find(p => p.id === selectedPrinterId)?.name})
              </span>
              <span className="text-[11px] text-slate-400">
                Shows supply % remaining over time until depletion
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trajectoryData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                  <YAxis unit="%" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                  <ReferenceLine y={15} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Critical (15%)', fill: '#f43f5e', fontSize: 10 }} />
                  
                  {selectedPrinterId === 'all' ? (
                    <>
                      <Line type="monotone" dataKey="Avg Fleet Toner" stroke="#0f172a" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="Avg Fleet Paper" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </>
                  ) : (
                    <>
                      <Line type="monotone" dataKey="Black Toner" stroke="#0f172a" strokeWidth={2.5} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="Tray 1 Paper" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="Drum Unit" stroke="#818cf8" strokeWidth={1.5} strokeDasharray="4 4" dot={{ r: 2 }} />
                      <Line type="monotone" dataKey="Cyan Toner" stroke="#06b6d4" strokeWidth={2} dot={{ r: 2 }} />
                      <Line type="monotone" dataKey="Magenta Toner" stroke="#ec4899" strokeWidth={2} dot={{ r: 2 }} />
                      <Line type="monotone" dataKey="Yellow Toner" stroke="#eab308" strokeWidth={2} dot={{ r: 2 }} />
                    </>
                  )}
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Actionable Depletion Schedule & Restock Matrix */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-blue-600" />
            <span>Hardware Depletion Schedule & Procurement Schedule</span>
          </h4>
          <span className="text-[11px] text-slate-400">
            Ordered by soonest depletion date
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {forecasts
            .slice()
            .sort((a, b) => a.daysUntilBottleneckEmpty - b.daysUntilBottleneckEmpty)
            .map((forecast) => {
              const isUrgent = forecast.daysUntilBottleneckEmpty <= 3.0;
              const isWarning = forecast.daysUntilBottleneckEmpty > 3.0 && forecast.daysUntilBottleneckEmpty <= 7.0;

              return (
                <div
                  key={forecast.printerId}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                    isUrgent
                      ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
                      : isWarning
                      ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                      : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    {/* Title & Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block truncate" title={forecast.printerName}>
                          {forecast.printerName}
                        </span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <span>{forecast.location}</span>
                          <span>•</span>
                          <span>{forecast.dailyPageRate} pgs/day</span>
                        </span>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          isUrgent
                            ? 'bg-rose-100 text-rose-800 animate-pulse'
                            : isWarning
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {forecast.daysUntilBottleneckEmpty} Days
                      </span>
                    </div>

                    {/* Bottleneck Callout */}
                    <div className="mt-2.5 p-2 rounded-lg bg-white border border-slate-200/80 text-xs">
                      <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
                        <span className="font-medium text-slate-500">Depleting Item:</span>
                        <span className="font-bold text-slate-800">{forecast.bottleneckConsumable}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-600">
                        <span className="font-medium text-slate-500">Run-out Date:</span>
                        <strong className={isUrgent ? 'text-rose-600 font-bold' : 'text-slate-800 font-semibold'}>
                          {forecast.projectedEmptyDate}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action / SKU Info */}
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-mono text-[10px] truncate max-w-[150px]">
                      SKU: {forecast.partNumber}
                    </span>

                    {forecast.bottleneckType === 'toner' && onRefillToner && (
                      <button
                        onClick={() => onRefillToner(forecast.printerId)}
                        className="px-2 py-1 rounded-md text-[11px] font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <Droplet className="w-3 h-3 text-blue-600" />
                        <span>Refill</span>
                      </button>
                    )}

                    {forecast.bottleneckType === 'paper' && onReloadPaper && (
                      <button
                        onClick={() => onReloadPaper(forecast.printerId)}
                        className="px-2 py-1 rounded-md text-[11px] font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <Layers className="w-3 h-3 text-emerald-600" />
                        <span>Restock</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
