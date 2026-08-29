import React, { useState } from 'react';
import { X, Laptop, PlusCircle, Printer } from 'lucide-react';
import type { PrinterDevice, NodeOS } from '../types';

interface AddWorkstationModalProps {
  isOpen: boolean;
  onClose: () => void;
  printers: PrinterDevice[];
  onAddWorkstation: (data: any) => Promise<void>;
}

export const AddWorkstationModal: React.FC<AddWorkstationModalProps> = ({
  isOpen,
  onClose,
  printers,
  onAddWorkstation,
}) => {
  const [hostname, setHostname] = useState('');
  const [os, setOs] = useState<NodeOS>('windows');
  const [activeUser, setActiveUser] = useState('');
  const [department, setDepartment] = useState('Design');
  const [location, setLocation] = useState('HQ Floor 2');
  const [ipAddress, setIpAddress] = useState('');
  const [selectedPrinters, setSelectedPrinters] = useState<string[]>([printers[0]?.name || 'HP LaserJet Enterprise M608']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostname.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddWorkstation({
        hostname: hostname.trim().toUpperCase(),
        os,
        activeUser: activeUser || 'user',
        department,
        location,
        ipAddress: ipAddress || undefined,
        assignedPrinters: selectedPrinters,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePrinter = (name: string) => {
    if (selectedPrinters.includes(name)) {
      if (selectedPrinters.length > 1) {
        setSelectedPrinters(selectedPrinters.filter(p => p !== name));
      }
    } else {
      setSelectedPrinters([...selectedPrinters, name]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white text-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Register New Workstation Node</h3>
              <p className="text-[11px] text-slate-500">Map an employee computer or print terminal to the hub</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Hostname / Computer Name</label>
              <input
                type="text"
                placeholder="e.g. MKTG-MAC-02"
                value={hostname}
                onChange={(e) => setHostname(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Operating System</label>
              <select
                value={os}
                onChange={(e) => setOs(e.target.value as NodeOS)}
                className="w-full text-xs p-2 rounded-lg border border-slate-200"
              >
                <option value="windows">Windows 11 / 10</option>
                <option value="macos">macOS (Sequoia / Sonoma)</option>
                <option value="linux">Linux (Ubuntu / Debian)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Assigned Employee User</label>
              <input
                type="text"
                placeholder="e.g. emily.watson"
                value={activeUser}
                onChange={(e) => setActiveUser(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-200"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-200"
              >
                <option value="Design">Design</option>
                <option value="Finance">Finance</option>
                <option value="Legal">Legal</option>
                <option value="Engineering">Engineering</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Operations">Operations</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Physical Location / Office</label>
              <input
                type="text"
                placeholder="e.g. Studio Wing - Pod B"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-200"
              />
            </div>

            <div className="col-span-2">
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Mapped Printers</label>
              <div className="space-y-1.5 max-h-32 overflow-y-auto p-2 rounded-lg border border-slate-200 bg-slate-50/50">
                {printers.map((printer) => {
                  const isChecked = selectedPrinters.includes(printer.name);
                  return (
                    <label key={printer.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleTogglePrinter(printer.name)}
                        className="rounded border-slate-300 text-blue-600"
                      />
                      <span className="truncate">{printer.name} ({printer.location})</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !hostname.trim()}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Registering...' : 'Register Workstation'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
