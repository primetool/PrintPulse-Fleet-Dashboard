import React, { useState } from 'react';
import { 
  X, 
  Terminal, 
  Copy, 
  Check, 
  Send, 
  Laptop, 
  Printer, 
  CheckCircle2,
  Code,
  ShieldCheck,
  Zap,
  Download,
  Package,
  FolderArchive
} from 'lucide-react';
import type { PrinterDevice } from '../types';

interface AgentSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  printers: PrinterDevice[];
  onSendTestPayload: (payload: any) => Promise<void>;
}

export const AgentSetupModal: React.FC<AgentSetupModalProps> = ({
  isOpen,
  onClose,
  printers,
  onSendTestPayload,
}) => {
  const [activeLang, setActiveLang] = useState<'windows-app' | 'sandbox' | 'powershell' | 'bash' | 'curl'>('windows-app');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Sandbox State
  const [customHostname, setCustomHostname] = useState('WORKSTATION-X1');
  const [customUser, setCustomUser] = useState('alexa.reed');
  const [customDept, setCustomDept] = useState('Engineering');
  const [customDoc, setCustomDoc] = useState('Release_Notes_Q3.pdf');
  const [customPrinter, setCustomPrinter] = useState(printers[0]?.name || 'HP LaserJet Enterprise M608');
  const [customPages, setCustomPages] = useState(8);
  const [customColor, setCustomColor] = useState(false);
  const [customDuplex, setCustomDuplex] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sandboxSuccess, setSandboxSuccess] = useState(false);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://your-printpulse-url.app';

  const powershellScript = `# PrintPulse Windows Telemetry Agent (PowerShell)
# Run on any Windows 10/11 or Windows Server workstation
$HubUrl = "${currentOrigin}/api/printpulse/jobs"
$Hostname = $env:COMPUTERNAME
$User = $env:USERNAME

Write-Host "Connecting $Hostname to PrintPulse Hub..." -ForegroundColor Cyan

# Hook into Windows Print Spooler WMI Events
Register-WmiEvent -Query "SELECT * FROM __InstanceCreationEvent WITHIN 2 WHERE TargetInstance ISA 'Win32_PrintJob'" -Action {
    $job = $Event.SourceEventArgs.NewEvent.TargetInstance
    $payload = @{
        computer = @{
            hostname = $env:COMPUTERNAME
            os = "windows"
            osVersion = (Get-CimInstance Win32_OperatingSystem).Caption
            activeUser = $env:USERNAME
            department = "Workstations"
        }
        job = @{
            documentName = $job.Document
            printerName = $job.Name.Split(',')[0]
            pageCount = [int]$job.TotalPages
            isColor = ($job.Color -eq "Color")
            isDuplex = $true
            paperSize = "A4"
        }
    } | ConvertTo-Json -Depth 4

    Invoke-RestMethod -Uri $HubUrl -Method POST -ContentType "application/json" -Body $payload
    Write-Host "Ingested print job: $($job.Document)" -ForegroundColor Green
}`;

  const bashScript = `#!/usr/bin/env python3
# PrintPulse macOS & Linux Spooler Telemetry Daemon
import os, sys, socket, json, urllib.request, time

HUB_URL = "${currentOrigin}/api/printpulse/jobs"
HOSTNAME = socket.gethostname()
USER = os.environ.get("USER", "user")

print(f"[*] Starting PrintPulse Daemon on {HOSTNAME}...")

def report_print_job(doc_name, printer_name, pages=5, is_color=False):
    payload = {
        "computer": {
            "hostname": HOSTNAME,
            "os": "macos" if sys.platform == "darwin" else "linux",
            "activeUser": USER,
            "department": "Engineering"
        },
        "job": {
            "documentName": doc_name,
            "printerName": printer_name,
            "pageCount": pages,
            "isColor": is_color,
            "isDuplex": True,
            "paperSize": "A4"
        }
    }
    req = urllib.request.Request(HUB_URL, data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as resp:
        print(f"[+] Successfully forwarded telemetry: {resp.status}")

# Example manual invocation or daemon loop
report_print_job("Design_Specs_2026.pdf", "Canon imageRUNNER ADVANCE C5550i", 12, True)
`;

  const curlSnippet = `curl -X POST "${currentOrigin}/api/printpulse/jobs" \\
  -H "Content-Type: application/json" \\
  -d '{
    "computer": {
      "hostname": "REMOTE-LAPTOP-09",
      "os": "windows",
      "activeUser": "jordan.miles",
      "department": "Finance"
    },
    "job": {
      "documentName": "Audit_Report_2026.pdf",
      "printerName": "HP LaserJet Enterprise M608",
      "pageCount": 16,
      "isColor": false,
      "isDuplex": true,
      "paperSize": "Letter"
    }
  }'`;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRunSandbox = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setSandboxSuccess(false);

    try {
      await onSendTestPayload({
        computer: {
          hostname: customHostname,
          os: 'windows',
          activeUser: customUser,
          department: customDept,
        },
        job: {
          documentName: customDoc,
          printerName: customPrinter,
          pageCount: Number(customPages),
          isColor: customColor,
          isDuplex: customDuplex,
          paperSize: 'A4',
        }
      });
      setSandboxSuccess(true);
      setTimeout(() => setSandboxSuccess(false), 3000);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white text-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Connect Workstation to PrintPulse Hub</h3>
              <p className="text-[11px] text-slate-500">Stream telemetry directly from any computer into this dashboard</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveLang('windows-app')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeLang === 'windows-app' ? 'border-emerald-600 text-emerald-700 bg-white shadow-2xs' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-emerald-600" />
            <span>Windows Desktop App (.exe)</span>
          </button>
          <button
            onClick={() => setActiveLang('sandbox')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              activeLang === 'sandbox' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            🧪 Live Sandbox
          </button>
          <button
            onClick={() => setActiveLang('powershell')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              activeLang === 'powershell' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            ⊞ Windows (PowerShell)
          </button>
          <button
            onClick={() => setActiveLang('bash')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              activeLang === 'bash' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
             macOS / 🐧 Linux
          </button>
          <button
            onClick={() => setActiveLang('curl')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              activeLang === 'curl' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            cURL / REST API
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">

          {activeLang === 'windows-app' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-950">Standalone Windows Desktop Hub</h4>
                    <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                      Run PrintPulse natively on any Windows 10/11 or Windows Server computer without needing Node.js or terminal knowledge.
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct Download Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href="/api/download/PrintPulse-Windows.zip"
                  download="PrintPulse-Windows.zip"
                  className="p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50 transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FolderArchive className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-emerald-900">Complete Package (.zip)</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">Recommended</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      Includes <strong>PrintPulse.exe</strong>, automated installer (<code>Install-PrintPulse.bat</code>), Start Menu & Desktop shortcut creator, and uninstaller.
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-emerald-200/80 flex items-center justify-between text-xs font-bold text-emerald-700 group-hover:text-emerald-800">
                    <span className="flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5" /> Download ZIP (~16 MB)
                    </span>
                    <span>↓</span>
                  </div>
                </a>

                <a
                  href="/api/download/PrintPulse.exe"
                  download="PrintPulse.exe"
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-slate-900">Direct Executable (.exe)</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      Single standalone binary. Double-click to immediately launch the local server at <code>http://localhost:3000</code>.
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
                    <span className="flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5" /> Download EXE (~38 MB)
                    </span>
                    <span>↓</span>
                  </div>
                </a>
              </div>

              {/* Quick Setup Guide */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2.5">
                <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>How to Install & Run on Windows:</span>
                </h5>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1 text-[11px] leading-relaxed">
                  <li>Download <strong>PrintPulse-Windows.zip</strong> and extract it on your computer.</li>
                  <li>Right-click <strong>Install-PrintPulse.bat</strong> and click <em>Run</em> (no Admin rights required).</li>
                  <li>The installer will copy the files to <code>%LOCALAPPDATA%\PrintPulse</code> and create desktop shortcuts.</li>
                  <li>PrintPulse will open automatically at <code>http://localhost:3000</code>.</li>
                  <li>Log in with the default Administrator PIN: <code className="bg-white px-1.5 py-0.5 rounded border font-mono font-bold text-slate-900">2026</code>.</li>
                </ol>
              </div>

              {/* Troubleshooting Note */}
              <div className="p-3 rounded-lg bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                <div className="shrink-0 mt-0.5">ℹ️</div>
                <div>
                  <strong>Tip for GitHub ZIP Downloads:</strong> If you downloaded the repository code as a ZIP from GitHub, git repositories do not bundle large pre-compiled binaries in source archives. The updated <code>Install-PrintPulse.bat</code> now has built-in auto-detection and can download the executable for you automatically, or you can download <strong>PrintPulse.exe</strong> above.
                </div>
              </div>
            </div>
          )}
          
          {activeLang === 'sandbox' && (
            <form onSubmit={handleRunSandbox} className="space-y-4">
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Test the live ingestion endpoint immediately without installing external scripts.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Computer Hostname</label>
                  <input
                    type="text"
                    value={customHostname}
                    onChange={(e) => setCustomHostname(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Active User</label>
                  <input
                    type="text"
                    value={customUser}
                    onChange={(e) => setCustomUser(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Department</label>
                  <select
                    value={customDept}
                    onChange={(e) => setCustomDept(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Design">Design</option>
                    <option value="Finance">Finance</option>
                    <option value="Legal">Legal</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Operations">Operations</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Target Printer</label>
                  <select
                    value={customPrinter}
                    onChange={(e) => setCustomPrinter(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200"
                  >
                    {printers.map((p) => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Document Name</label>
                  <input
                    type="text"
                    value={customDoc}
                    onChange={(e) => setCustomDoc(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Page Count</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={customPages}
                    onChange={(e) => setCustomPages(Number(e.target.value))}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200"
                  />
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customColor}
                      onChange={(e) => setCustomColor(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    <span>Color Print</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customDuplex}
                      onChange={(e) => setCustomDuplex(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    <span>2-Sided (Duplex)</span>
                  </label>
                </div>
              </div>

              {sandboxSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Telemetry packet received and processed! Dashboard updated in real-time.</span>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Transmitting...' : 'Send Live Telemetry Packet'}</span>
                </button>
              </div>
            </form>
          )}

          {activeLang === 'powershell' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Windows PowerShell Spooler Monitor</span>
                <button
                  onClick={() => handleCopy(powershellScript, 'ps')}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1"
                >
                  {copiedKey === 'ps' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'ps' ? 'Copied' : 'Copy Script'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 text-[11px] font-mono overflow-x-auto leading-relaxed">
                {powershellScript}
              </pre>
            </div>
          )}

          {activeLang === 'bash' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">macOS / Linux CUPS Daemon (Python 3)</span>
                <button
                  onClick={() => handleCopy(bashScript, 'py')}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1"
                >
                  {copiedKey === 'py' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'py' ? 'Copied' : 'Copy Script'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 text-[11px] font-mono overflow-x-auto leading-relaxed">
                {bashScript}
              </pre>
            </div>
          )}

          {activeLang === 'curl' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Direct HTTP POST Ingestion Endpoint</span>
                <button
                  onClick={() => handleCopy(curlSnippet, 'curl')}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1"
                >
                  {copiedKey === 'curl' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'curl' ? 'Copied' : 'Copy cURL'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 text-[11px] font-mono overflow-x-auto leading-relaxed">
                {curlSnippet}
              </pre>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-emerald-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Endpoint active & listening for multi-workstation events</span>
          </div>
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
