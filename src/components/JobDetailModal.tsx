import React from 'react';
import { X, FileText, Laptop, Printer, CheckCircle2, AlertTriangle, Activity, DollarSign, Calendar, Layers } from 'lucide-react';
import type { PrintJob } from '../types';

interface JobDetailModalProps {
  job: PrintJob | null;
  onClose: () => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({ job, onClose }) => {
  if (!job) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white text-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-mono text-xs font-bold">
              {job.jobCode}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Print Telemetry Record</h3>
              <p className="text-[11px] text-slate-500">Captured by PrintPulse Workstation Agent</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Details Content */}
        <div className="p-6 space-y-4 text-xs">
          
          {/* Document Header Box */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Document Title</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                job.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                job.status === 'printing' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {job.status}
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900 break-all">{job.documentName}</div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
              <span className="uppercase font-semibold text-slate-600">{job.documentCategory}</span>
              <span>•</span>
              <span>Paper: {job.paperSize}</span>
              <span>•</span>
              <span>Spool latency: {job.spoolDurationSec}s</span>
            </div>
          </div>

          {/* Failure Alert if error */}
          {job.failureReason && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <div>
                <strong className="font-semibold block">Spooler / Printer Exception:</strong>
                <span>{job.failureReason}</span>
              </div>
            </div>
          )}

          {/* 2-Column Meta Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-semibold mb-1 flex items-center gap-1">
                <Laptop className="w-3 h-3 text-slate-400" />
                <span>Origin Workstation</span>
              </span>
              <div className="font-bold text-slate-900">{job.hostname}</div>
              <div className="text-[11px] text-slate-500">{job.user} ({job.department})</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-semibold mb-1 flex items-center gap-1">
                <Printer className="w-3 h-3 text-slate-400" />
                <span>Target Printer</span>
              </span>
              <div className="font-bold text-slate-900 truncate">{job.printerName}</div>
              <div className="text-[11px] text-slate-500">ID: {job.printerId}</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-semibold mb-1 flex items-center gap-1">
                <Layers className="w-3 h-3 text-slate-400" />
                <span>Volume & Duplex</span>
              </span>
              <div className="font-bold text-slate-900">{job.pageCount * job.copies} Total Pages ({job.copies} copy)</div>
              <div className="text-[11px] text-slate-500">{job.isDuplex ? '2-Sided (Duplex)' : '1-Sided (Simplex)'} • {job.totalSheets} sheets</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-semibold mb-1 flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-emerald-600" />
                <span>Cost & Toner Type</span>
              </span>
              <div className="font-bold text-slate-900">${job.estimatedCost.toFixed(2)}</div>
              <div className="text-[11px] text-slate-500">{job.isColor ? 'Color Process (CMYK)' : 'Monochrome (K)'}</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-slate-500 text-[11px]">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>Timestamp:</span>
            </span>
            <span className="font-mono text-slate-700">{new Date(job.timestamp).toLocaleString()}</span>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
