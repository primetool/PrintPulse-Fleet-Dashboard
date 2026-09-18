export type NodeOS = 'windows' | 'macos' | 'linux';
export type NodeStatus = 'online' | 'idle' | 'offline';
export type PrinterStatus = 'ready' | 'printing' | 'warning' | 'jammed' | 'toner_low' | 'offline';
export type JobStatus = 'completed' | 'printing' | 'queued' | 'cancelled' | 'error' | 'jammed';
export type DocumentCategory = 'pdf' | 'docx' | 'xlsx' | 'dwg' | 'txt' | 'img' | 'other';
export type PaperSize = 'A4' | 'A3' | 'Letter' | 'Legal' | 'Custom';

export interface ComputerNode {
  id: string;
  hostname: string;
  os: NodeOS;
  osVersion: string;
  ipAddress: string;
  macAddress: string;
  department: string;
  activeUser: string;
  agentVersion: string;
  status: NodeStatus;
  lastHeartbeat: string;
  assignedPrinters: string[]; // printer names or ids
  totalJobsToday: number;
  totalPagesToday: number;
  totalCostToday: number;
  activeSpoolQueue: number;
  location: string;
  isDemo?: boolean;
}

export interface PrinterDevice {
  id: string;
  name: string;
  model: string;
  manufacturer: string;
  location: string;
  ipAddress: string;
  connectionType: 'network' | 'usb' | 'wifi';
  status: PrinterStatus;
  statusMessage?: string;
  isDemo?: boolean;
  tonerLevels: {
    black: number;
    cyan: number;
    magenta: number;
    yellow: number;
  };
  paperTrays: {
    tray1CapacityPct: number;
    tray2CapacityPct?: number;
    manualFeedPct?: number;
  };
  totalPagesPrinted: number;
  drumLifePercent: number;
  maintenanceKitDueInPages: number;
  activeJobsInQueue: number;
  currentJobName?: string;
  costPerPageMono: number;
  costPerPageColor: number;
}

export interface PrintJob {
  id: string;
  jobCode: string;
  timestamp: string;
  computerId: string;
  hostname: string;
  user: string;
  department: string;
  printerId: string;
  printerName: string;
  documentName: string;
  documentCategory: DocumentCategory;
  pageCount: number;
  copies: number;
  totalSheets: number;
  isColor: boolean;
  isDuplex: boolean;
  paperSize: PaperSize;
  estimatedCost: number;
  status: JobStatus;
  spoolDurationSec: number;
  failureReason?: string;
}

export interface DepartmentMetric {
  department: string;
  totalJobs: number;
  totalPages: number;
  colorPages: number;
  monoPages: number;
  totalCost: number;
  computerCount: number;
  budgetAllocated: number;
}

export interface FleetMetrics {
  totalJobs: number;
  totalPages: number;
  colorPages: number;
  monoPages: number;
  totalCost: number;
  activeNodesCount: number;
  totalNodesCount: number;
  activePrintersCount: number;
  totalPrintersCount: number;
  fleetHealthScore: number;
  paperSheetsSavedDuplex: number;
  co2SavedKg: number;
  costSavedDuplex: number;
  activeErrorsCount: number;
}

export interface AiDiagnosticInsight {
  id: string;
  type: 'cost' | 'maintenance' | 'anomaly' | 'efficiency';
  title: string;
  severity: 'info' | 'warning' | 'critical';
  description: string;
  recommendation: string;
  affectedTargets: string[];
  potentialMonthlySavings?: string;
  urgency: 'high' | 'medium' | 'low';
}

export type AlertConditionType = 
  | 'printer_offline'
  | 'paper_jam'
  | 'high_error_rate'
  | 'low_toner'
  | 'tray_empty'
  | 'workstation_offline'
  | 'budget_anomaly'
  | 'maintenance_due'
  | 'custom';

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface FleetAlert {
  id: string;
  ruleId?: string;
  type: AlertConditionType;
  severity: AlertSeverity;
  title: string;
  message: string;
  targetType: 'printer' | 'workstation' | 'fleet';
  targetId: string;
  targetName: string;
  timestamp: string;
  isAcknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  isResolved: boolean;
  resolvedAt?: string;
  emailSent: boolean;
  emailSentTo?: string;
  emailSentAt?: string;
  channels: ('dashboard' | 'email')[];
  suggestedAction?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  conditionType: AlertConditionType;
  enabled: boolean;
  severity: AlertSeverity;
  thresholdValue?: number; // e.g. 15 for toner <15%, 10 for error rate >10%
  description: string;
  sendEmail: boolean;
  targetEmail?: string;
  debounceMinutes: number;
}

export interface EmailNotificationLog {
  id: string;
  alertId: string;
  recipient: string;
  subject: string;
  severity: AlertSeverity;
  alertType: AlertConditionType;
  bodySnippet: string;
  status: 'delivered' | 'pending' | 'failed';
  timestamp: string;
  deliveryLatencyMs: number;
}

export interface AlertSettings {
  primaryEmail: string;
  enableEmailAlerts: boolean;
  enableDashboardAlerts: boolean;
  enableSoundAlerts: boolean;
  minSeverityForEmail: AlertSeverity;
  highErrorRateThresholdPct: number; // default 15
  lowTonerThresholdPct: number; // default 15
  offlineTimeoutSeconds: number; // default 180 (3 min)
  paperJamAutoAlert: boolean;
  emailDigestFrequency: 'instant' | 'hourly' | 'daily';
}

export interface RealtimeSyncStatus {
  connected: boolean;
  lastSyncedAt: string;
  transport: 'sse' | 'polling';
  eventsCount: number;
  latencyMs: number;
  activeNodesCount: number;
}

export interface IngestionPayload {
  computer: {
    hostname: string;
    os: NodeOS;
    osVersion?: string;
    ipAddress?: string;
    department: string;
    activeUser: string;
    agentVersion?: string;
  };
  job?: {
    documentName: string;
    documentCategory?: DocumentCategory;
    printerName: string;
    pageCount: number;
    copies?: number;
    isColor: boolean;
    isDuplex: boolean;
    paperSize?: PaperSize;
    status?: JobStatus;
    failureReason?: string;
  };
  printersReported?: {
    name: string;
    model?: string;
    status?: PrinterStatus;
    tonerLevels?: {
      black: number;
      cyan?: number;
      magenta?: number;
      yellow?: number;
    };
    paperTrayCapacityPct?: number;
  }[];
}

export interface AdminAuthState {
  isAdmin: boolean;
  adminToken: string | null;
  isDefaultPin: boolean;
  isLoading: boolean;
  unlockAdmin: (pin: string) => Promise<{ success: boolean; error?: string }>;
  lockAdmin: () => void;
  changePin: (newPin: string) => Promise<{ success: boolean; error?: string }>;
  requireAdminAction: (action: () => void | Promise<void>, promptReason?: string) => void;
  isAuthModalOpen: boolean;
  openAuthModal: (reason?: string, pendingAction?: () => void | Promise<void>) => void;
  closeAuthModal: () => void;
  authModalReason: string;
  isChangePinModalOpen: boolean;
  openChangePinModal: () => void;
  closeChangePinModal: () => void;
}
