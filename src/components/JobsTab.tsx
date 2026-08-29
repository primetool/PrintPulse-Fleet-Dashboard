import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Download, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  Laptop,
  Printer,
  Sparkles
} from 'lucide-react';
import type { PrintJob, ComputerNode, PrinterDevice } from '../types';

interface JobsTabProps {
  jobs: PrintJob[];
  nodes: ComputerNode[];
  printers: PrinterDevice[];
  onSelectJob: (job: PrintJob) => void;
}

export const JobsTab: React.FC<JobsTabProps> = ({
  jobs,
  nodes,
  printers,
  onSelectJob,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedNode, setSelectedNode] = useState('all');
  const [selectedPrinter, setSelectedPrinter] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedColor, setSelectedColor] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const departments = ['all', 'Design', 'Finance', 'Legal', 'Engineering', 'Human Resources', 'Operations', 'Marketing'];

  const filteredJobs = jobs.filter((job) => {
    const matchSearch =
      job.documentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.jobCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchDept = selectedDept === 'all' || job.department.toLowerCase() === selectedDept.toLowerCase();
    const matchNode = selectedNode === 'all' || job.hostname === selectedNode;
    const matchPrinter = selectedPrinter === 'all' || job.printerName.toLowerCase().includes(selectedPrinter.toLowerCase());
    const matchStatus = selectedStatus === 'all' || job.status === selectedStatus;
    const matchColor = selectedColor === 'all' || (selectedColor === 'color' ? job.isColor : !job.isColor);

    return matchSearch && matchDept && matchNode && matchPrinter && matchStatus && matchColor;
  });

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage) || 1;
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExportCSV = () => {
    const headers = ['Job Code', 'Timestamp', 'Computer', 'User', 'Department', 'Printer', 'Document', 'Pages', 'Copies', 'Color', 'Duplex', 'Paper Size', 'Cost ($)', 'Status'];
    const rows = filteredJobs.map(j => [
      j.jobCode,
      j.timestamp,
      j.hostname,
      j.user,
      j.department,
      `"${j.printerName}"`,
      `"${j.documentName}"`,
      j.pageCount,
      j.copies,
      j.isColor ? 'Yes' : 'No',
      j.isDuplex ? 'Yes' : 'No',
      j.paperSize,
      j.estimatedCost.toFixed(2),
      j.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `printpulse_ledger_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3 h-3" /> Completed</span>;
      case 'printing':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200"><Activity className="w-3 h-3 animate-pulse" /> Printing</span>;
      case 'error':
      case 'jammed':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200"><AlertTriangle className="w-3 h-3" /> Error</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  return (
    <div id="jobs-tab-content" className="space-y-6">
      
      {/* Header with Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Master Print Job Ledger</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {jobs.length} Total Records
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Complete audit trail of all documents printed from all aggregated computer workstations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-export-jobs-csv"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Audit</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search document, code, user, computer..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Department */}
          <select
            value={selectedDept}
            onChange={(e) => { setSelectedDept(e.target.value); setCurrentPage(1); }}
            className="text-xs py-2 px-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-700 focus:outline-none"
          >
            {departments.map((d) => (
              <option key={d} value={d}>{d === 'all' ? 'All Departments' : d}</option>
            ))}
          </select>

          {/* Workstation */}
          <select
            value={selectedNode}
            onChange={(e) => { setSelectedNode(e.target.value); setCurrentPage(1); }}
            className="text-xs py-2 px-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-700 focus:outline-none"
          >
            <option value="all">All Workstations</option>
            {nodes.map((n) => (
              <option key={n.id} value={n.hostname}>{n.hostname} ({n.activeUser})</option>
            ))}
          </select>

          {/* Color filter */}
          <select
            value={selectedColor}
            onChange={(e) => { setSelectedColor(e.target.value); setCurrentPage(1); }}
            className="text-xs py-2 px-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-700 focus:outline-none"
          >
            <option value="all">Color & Monochrome</option>
            <option value="color">Color Only</option>
            <option value="mono">Monochrome Only</option>
          </select>

          {/* Status */}
          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
            className="text-xs py-2 px-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="printing">Printing</option>
            <option value="error">Error / Jammed</option>
          </select>

          <div className="text-xs text-slate-400 ml-auto">
            {filteredJobs.length} jobs match filters
          </div>
        </div>
      </div>

      {/* Master Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Workstation</th>
                <th className="py-3 px-4">User & Dept</th>
                <th className="py-3 px-4">Document Name</th>
                <th className="py-3 px-4">Printer</th>
                <th className="py-3 px-4">Pages / Type</th>
                <th className="py-3 px-4">Cost</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedJobs.map((job) => (
                <tr 
                  key={job.id} 
                  onClick={() => onSelectJob(job)}
                  className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {job.jobCode}
                  </td>
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(job.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Laptop className="w-3.5 h-3.5 text-slate-400" />
                      <span>{job.hostname}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-800">{job.user}</div>
                    <div className="text-[10px] text-slate-400">{job.department}</div>
                  </td>
                  <td className="py-3 px-4 max-w-[220px]">
                    <div className="font-semibold text-slate-900 truncate" title={job.documentName}>
                      {job.documentName}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {job.paperSize} • {job.documentCategory.toUpperCase()}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-slate-800 font-medium truncate max-w-[160px]">{job.printerName}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900">{job.pageCount * job.copies} pgs</span>
                    <div className="text-[10px] text-slate-400">
                      {job.isColor ? <span className="text-purple-600 font-semibold">Color</span> : 'Mono'} • {job.isDuplex ? 'Duplex' : 'Simplex'}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    ${job.estimatedCost.toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(job.status)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelectJob(job); }}
                      className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                      title="Inspect job telemetry"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing page <strong className="font-semibold text-slate-800">{currentPage}</strong> of <strong className="font-semibold text-slate-800">{totalPages}</strong> ({filteredJobs.length} jobs)
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
