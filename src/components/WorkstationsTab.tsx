import React, { useState } from 'react';
import { 
  Laptop, 
  Search, 
  Filter, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  HardDrive, 
  Activity, 
  Send, 
  Printer, 
  RefreshCw,
  Terminal,
  ExternalLink,
  Lock,
} from 'lucide-react';
import type { ComputerNode } from '../types';
import { useAdminAuth } from '../context/AdminAuthContext';

interface WorkstationsTabProps {
  nodes: ComputerNode[];
  onOpenAddModal: () => void;
  onOpenConnectModal: () => void;
  onSimulateNodeJob: (node: ComputerNode) => void;
  onRefresh: () => void;
}

export const WorkstationsTab: React.FC<WorkstationsTabProps> = ({
  nodes,
  onOpenAddModal,
  onOpenConnectModal,
  onSimulateNodeJob,
  onRefresh,
}) => {
  const { isAdmin, requireAdminAction } = useAdminAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedOs, setSelectedOs] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const handleRegisterNode = () => {
    requireAdminAction(() => {
      onOpenAddModal();
    }, 'Admin Passcode required to register and deploy a new computer workstation.');
  };

  const departments = ['all', ...Array.from(new Set(nodes.map((n) => n.department)))];
  const osList = ['all', 'windows', 'macos', 'linux'];

  const filteredNodes = nodes.filter((node) => {
    const matchSearch =
      node.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.activeUser.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.ipAddress.includes(searchTerm) ||
      node.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchDept = selectedDept === 'all' || node.department === selectedDept;
    const matchOs = selectedOs === 'all' || node.os === selectedOs;
    const matchStatus = selectedStatus === 'all' || node.status === selectedStatus;

    return matchSearch && matchDept && matchOs && matchStatus;
  });

  const getOsBadge = (os: string) => {
    switch (os) {
      case 'macos':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200"> macOS</span>;
      case 'linux':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">🐧 Linux</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">⊞ Windows</span>;
    }
  };

  const getRelativeTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    return `${diffHr}h ago`;
  };

  return (
    <div id="workstations-tab-content" className="space-y-6">
      
      {/* Top Banner with Stats & Add Node CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Laptop className="w-5 h-5 text-blue-600" />
            <span>Connected Workstation Nodes</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {nodes.length} Registered
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            PrintPulse agent monitors local spoolers across Windows, macOS, and Linux workstations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="btn-workstation-connect-agent"
            onClick={onOpenConnectModal}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Terminal className="w-3.5 h-3.5 text-blue-600" />
            <span>Agent Setup Guide</span>
          </button>
          <button
            id="btn-workstation-add-modal"
            onClick={handleRegisterNode}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-colors flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Register Workstation</span>
            {!isAdmin && <Lock className="w-3 h-3 text-blue-200 ml-0.5" />}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search hostname, user, IP, department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs text-slate-500 font-medium">Department:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs py-2 px-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-700 focus:outline-none focus:border-blue-500"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === 'all' ? 'All Departments' : dept}
                </option>
              ))}
            </select>
          </div>

          {/* OS Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs text-slate-500 font-medium">OS:</span>
            <select
              value={selectedOs}
              onChange={(e) => setSelectedOs(e.target.value)}
              className="text-xs py-2 px-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Operating Systems</option>
              <option value="windows">Windows</option>
              <option value="macos">macOS</option>
              <option value="linux">Linux</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs text-slate-500 font-medium">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs py-2 px-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="online">Online</option>
              <option value="idle">Idle</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          {/* Clear Filter / Count */}
          <div className="text-xs text-slate-400 md:ml-auto">
            Showing {filteredNodes.length} of {nodes.length} nodes
          </div>
        </div>
      </div>

      {/* Workstations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNodes.map((node) => (
          <div
            key={node.id}
            id={`node-card-${node.id}`}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-base shadow-xs">
                    {node.os === 'macos' ? '🍏' : node.os === 'linux' ? '🐧' : '🪟'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{node.hostname}</h3>
                    <div className="text-xs text-slate-500">{node.activeUser}</div>
                  </div>
                </div>

                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  node.status === 'online'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : node.status === 'idle'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    node.status === 'online' ? 'bg-emerald-500 animate-pulse' : node.status === 'idle' ? 'bg-amber-500' : 'bg-slate-400'
                  }`}></span>
                  {node.status}
                </span>
              </div>

              {/* Badges & Meta */}
              <div className="mt-3.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                {getOsBadge(node.os)}
                <span className="px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  {node.department}
                </span>
                <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-50 text-slate-500 border border-slate-200">
                  {node.ipAddress}
                </span>
              </div>

              {/* Assigned Printers */}
              <div className="mt-3.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div className="text-[10px] font-semibold uppercase text-slate-400 mb-1 flex items-center gap-1">
                  <Printer className="w-3 h-3 text-slate-400" />
                  <span>Mapped Printers</span>
                </div>
                <div className="text-slate-700 font-medium truncate">
                  {node.assignedPrinters && node.assignedPrinters.length > 0
                    ? node.assignedPrinters.join(', ')
                    : 'HP LaserJet Enterprise M608'}
                </div>
              </div>

              {/* Stats today */}
              <div className="mt-3.5 grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Print Jobs</span>
                  <span className="text-sm font-bold text-slate-900">{node.totalJobsToday}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Pages Today</span>
                  <span className="text-sm font-bold text-slate-900">{node.totalPagesToday}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Spend</span>
                  <span className="text-sm font-bold text-slate-900">${node.totalCostToday.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Footer with Heartbeat & Test Print Action */}
            <div className="mt-4 pt-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-[11px] text-slate-400" title={`Last ping: ${node.lastHeartbeat}`}>
                <Clock className="w-3 h-3" />
                <span>Ping: {getRelativeTime(node.lastHeartbeat)}</span>
              </div>

              <button
                id={`btn-test-print-${node.id}`}
                onClick={() => onSimulateNodeJob(node)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-1"
                title="Send test print event from this workstation"
              >
                <Send className="w-3 h-3" />
                <span>Test Spool</span>
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
