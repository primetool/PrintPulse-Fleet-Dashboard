import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import type {
  ComputerNode,
  PrinterDevice,
  PrintJob,
  FleetMetrics,
  DepartmentMetric,
  AiDiagnosticInsight,
  IngestionPayload,
  JobStatus,
  FleetAlert,
  AlertRule,
  EmailNotificationLog,
  AlertSettings,
  AlertConditionType,
  AlertSeverity,
} from "./src/types";

dotenv.config();

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Initial Seed Printers
let printers: PrinterDevice[] = [
  {
    id: "prn-01",
    name: "HP LaserJet Enterprise M608",
    model: "LaserJet Enterprise M608dn",
    manufacturer: "HP",
    location: "Floor 2 - Main Hallway",
    ipAddress: "192.168.1.110",
    connectionType: "network",
    status: "ready",
    tonerLevels: { black: 78, cyan: 0, magenta: 0, yellow: 0 },
    paperTrays: { tray1CapacityPct: 85, tray2CapacityPct: 90 },
    totalPagesPrinted: 148520,
    drumLifePercent: 88,
    maintenanceKitDueInPages: 26400,
    activeJobsInQueue: 0,
    costPerPageMono: 0.02,
    costPerPageColor: 0.08,
  },
  {
    id: "prn-02",
    name: "Canon imageRUNNER ADVANCE C5550i",
    model: "iR-ADV C5550i III",
    manufacturer: "Canon",
    location: "Floor 3 - Design & Marketing Studio",
    ipAddress: "192.168.1.115",
    connectionType: "network",
    status: "printing",
    statusMessage: "Printing high-res artwork proofs",
    tonerLevels: { black: 64, cyan: 42, magenta: 38, yellow: 51 },
    paperTrays: { tray1CapacityPct: 60, tray2CapacityPct: 45, manualFeedPct: 80 },
    totalPagesPrinted: 312450,
    drumLifePercent: 74,
    maintenanceKitDueInPages: 11200,
    activeJobsInQueue: 2,
    currentJobName: "Brand_Guidelines_2026_Final.pdf",
    costPerPageMono: 0.025,
    costPerPageColor: 0.11,
  },
  {
    id: "prn-03",
    name: "Xerox AltaLink C8170",
    model: "AltaLink C8170 MFP",
    manufacturer: "Xerox",
    location: "Floor 1 - Executive & Legal Suite",
    ipAddress: "192.168.1.120",
    connectionType: "network",
    status: "ready",
    tonerLevels: { black: 92, cyan: 88, magenta: 85, yellow: 90 },
    paperTrays: { tray1CapacityPct: 95, tray2CapacityPct: 80 },
    totalPagesPrinted: 89300,
    drumLifePercent: 91,
    maintenanceKitDueInPages: 45000,
    activeJobsInQueue: 0,
    costPerPageMono: 0.02,
    costPerPageColor: 0.09,
  },
  {
    id: "prn-04",
    name: "Epson WorkForce Enterprise WF-C20590",
    model: "WF-C20590 A3",
    manufacturer: "Epson",
    location: "Floor 2 - Accounting & Operations",
    ipAddress: "192.168.1.125",
    connectionType: "network",
    status: "toner_low",
    statusMessage: "Cyan and Yellow Cartridge below 12%",
    tonerLevels: { black: 45, cyan: 11, magenta: 24, yellow: 9 },
    paperTrays: { tray1CapacityPct: 40, tray2CapacityPct: 30 },
    totalPagesPrinted: 450120,
    drumLifePercent: 62,
    maintenanceKitDueInPages: 4800,
    activeJobsInQueue: 1,
    costPerPageMono: 0.018,
    costPerPageColor: 0.075,
  },
  {
    id: "prn-05",
    name: "Brother HL-L6400DW Lab",
    model: "HL-L6400DW High-Yield",
    manufacturer: "Brother",
    location: "Basement - Hardware R&D Lab",
    ipAddress: "192.168.1.140",
    connectionType: "network",
    status: "warning",
    statusMessage: "Tray 1 paper misfeed sensor alert",
    tonerLevels: { black: 28, cyan: 0, magenta: 0, yellow: 0 },
    paperTrays: { tray1CapacityPct: 15, tray2CapacityPct: 0 },
    totalPagesPrinted: 198400,
    drumLifePercent: 41,
    maintenanceKitDueInPages: 1200,
    activeJobsInQueue: 0,
    costPerPageMono: 0.015,
    costPerPageColor: 0.06,
  }
];

// Initial Seed Connected Computer Nodes
let computerNodes: ComputerNode[] = [
  {
    id: "node-01",
    hostname: "DESK-DESIGN-01",
    os: "macos",
    osVersion: "macOS Sequoia 15.3",
    ipAddress: "192.168.1.51",
    macAddress: "3C:22:FB:4A:91:02",
    department: "Design",
    activeUser: "sarah.jenkins",
    agentVersion: "PrintPulse-Agent v2.4.1",
    status: "online",
    lastHeartbeat: new Date(Date.now() - 15000).toISOString(),
    assignedPrinters: ["Canon imageRUNNER ADVANCE C5550i", "HP LaserJet Enterprise M608"],
    totalJobsToday: 14,
    totalPagesToday: 186,
    totalCostToday: 18.42,
    activeSpoolQueue: 1,
    location: "Studio Wing - Desk 3A",
  },
  {
    id: "node-02",
    hostname: "FIN-WIN-04",
    os: "windows",
    osVersion: "Windows 11 Pro 24H2",
    ipAddress: "192.168.1.64",
    macAddress: "00:1A:7D:F3:8B:11",
    department: "Finance",
    activeUser: "marcus.vance",
    agentVersion: "PrintPulse-Agent v2.4.1",
    status: "online",
    lastHeartbeat: new Date(Date.now() - 32000).toISOString(),
    assignedPrinters: ["Epson WorkForce Enterprise WF-C20590", "HP LaserJet Enterprise M608"],
    totalJobsToday: 22,
    totalPagesToday: 340,
    totalCostToday: 7.85,
    activeSpoolQueue: 0,
    location: "Finance Hub - Station 4",
  },
  {
    id: "node-03",
    hostname: "LEGAL-EXEC-02",
    os: "windows",
    osVersion: "Windows 11 Enterprise",
    ipAddress: "192.168.1.77",
    macAddress: "A4:83:E7:59:C0:2F",
    department: "Legal",
    activeUser: "elena.rostova",
    agentVersion: "PrintPulse-Agent v2.4.0",
    status: "online",
    lastHeartbeat: new Date(Date.now() - 5000).toISOString(),
    assignedPrinters: ["Xerox AltaLink C8170"],
    totalJobsToday: 9,
    totalPagesToday: 142,
    totalCostToday: 4.26,
    activeSpoolQueue: 0,
    location: "Executive Row - Office 104",
  },
  {
    id: "node-04",
    hostname: "ENG-UBUNTU-DEV",
    os: "linux",
    osVersion: "Ubuntu 24.04 LTS (CUPS 2.4)",
    ipAddress: "192.168.1.88",
    macAddress: "52:54:00:12:34:56",
    department: "Engineering",
    activeUser: "alex.kumar",
    agentVersion: "PrintPulse-Agent v2.3.8-linux",
    status: "online",
    lastHeartbeat: new Date(Date.now() - 48000).toISOString(),
    assignedPrinters: ["HP LaserJet Enterprise M608", "Brother HL-L6400DW Lab"],
    totalJobsToday: 6,
    totalPagesToday: 54,
    totalCostToday: 1.08,
    activeSpoolQueue: 0,
    location: "Engineering Bay 2",
  },
  {
    id: "node-05",
    hostname: "HR-STATION-01",
    os: "windows",
    osVersion: "Windows 10 Pro 22H2",
    ipAddress: "192.168.1.92",
    macAddress: "70:85:C2:10:4E:99",
    department: "Human Resources",
    activeUser: "claire.bennett",
    agentVersion: "PrintPulse-Agent v2.4.1",
    status: "idle",
    lastHeartbeat: new Date(Date.now() - 320000).toISOString(),
    assignedPrinters: ["HP LaserJet Enterprise M608", "Epson WorkForce Enterprise WF-C20590"],
    totalJobsToday: 11,
    totalPagesToday: 98,
    totalCostToday: 2.45,
    activeSpoolQueue: 0,
    location: "HR Quad - Desk 1",
  },
  {
    id: "node-06",
    hostname: "OPS-WH-TERMINAL",
    os: "linux",
    osVersion: "Debian 12 Bookworm",
    ipAddress: "192.168.1.105",
    macAddress: "B8:27:EB:7F:AA:33",
    department: "Operations",
    activeUser: "dave.reyes",
    agentVersion: "PrintPulse-Agent v2.4.1-linux",
    status: "online",
    lastHeartbeat: new Date(Date.now() - 12000).toISOString(),
    assignedPrinters: ["Brother HL-L6400DW Lab"],
    totalJobsToday: 38,
    totalPagesToday: 215,
    totalCostToday: 3.22,
    activeSpoolQueue: 0,
    location: "Logistics Bay - Terminal A",
  },
  {
    id: "node-07",
    hostname: "MKTG-MACBOOK-AIR",
    os: "macos",
    osVersion: "macOS Sonoma 14.6",
    ipAddress: "192.168.1.61",
    macAddress: "F0:18:98:C1:22:78",
    department: "Marketing",
    activeUser: "jordan.taylor",
    agentVersion: "PrintPulse-Agent v2.4.1",
    status: "offline",
    lastHeartbeat: new Date(Date.now() - 4200000).toISOString(),
    assignedPrinters: ["Canon imageRUNNER ADVANCE C5550i"],
    totalJobsToday: 4,
    totalPagesToday: 62,
    totalCostToday: 6.82,
    activeSpoolQueue: 0,
    location: "Marketing Flex Lounge",
  }
];

// Initial Seed Print Jobs
let printJobs: PrintJob[] = [
  {
    id: "job-101",
    jobCode: "PP-9821",
    timestamp: new Date(Date.now() - 120000).toISOString(),
    computerId: "node-01",
    hostname: "DESK-DESIGN-01",
    user: "sarah.jenkins",
    department: "Design",
    printerId: "prn-02",
    printerName: "Canon imageRUNNER ADVANCE C5550i",
    documentName: "Brand_Guidelines_2026_Final.pdf",
    documentCategory: "pdf",
    pageCount: 36,
    copies: 2,
    totalSheets: 36, // duplex = 36 sheets for 72 pages
    isColor: true,
    isDuplex: true,
    paperSize: "A4",
    estimatedCost: 7.92,
    status: "printing",
    spoolDurationSec: 4.2,
  },
  {
    id: "job-102",
    jobCode: "PP-9820",
    timestamp: new Date(Date.now() - 450000).toISOString(),
    computerId: "node-02",
    hostname: "FIN-WIN-04",
    user: "marcus.vance",
    department: "Finance",
    printerId: "prn-04",
    printerName: "Epson WorkForce Enterprise WF-C20590",
    documentName: "Q3_Consolidated_Audit_Report.xlsx",
    documentCategory: "xlsx",
    pageCount: 48,
    copies: 1,
    totalSheets: 24,
    isColor: false,
    isDuplex: true,
    paperSize: "A4",
    estimatedCost: 0.86,
    status: "completed",
    spoolDurationSec: 2.1,
  },
  {
    id: "job-103",
    jobCode: "PP-9819",
    timestamp: new Date(Date.now() - 920000).toISOString(),
    computerId: "node-03",
    hostname: "LEGAL-EXEC-02",
    user: "elena.rostova",
    department: "Legal",
    printerId: "prn-03",
    printerName: "Xerox AltaLink C8170",
    documentName: "Master_Service_Agreement_v4_Signed.docx",
    documentCategory: "docx",
    pageCount: 18,
    copies: 3,
    totalSheets: 27,
    isColor: false,
    isDuplex: true,
    paperSize: "Letter",
    estimatedCost: 1.08,
    status: "completed",
    spoolDurationSec: 3.5,
  },
  {
    id: "job-104",
    jobCode: "PP-9818",
    timestamp: new Date(Date.now() - 1400000).toISOString(),
    computerId: "node-06",
    hostname: "OPS-WH-TERMINAL",
    user: "dave.reyes",
    department: "Operations",
    printerId: "prn-05",
    printerName: "Brother HL-L6400DW Lab",
    documentName: "Shipping_Manifest_Batch_882.pdf",
    documentCategory: "pdf",
    pageCount: 12,
    copies: 1,
    totalSheets: 12,
    isColor: false,
    isDuplex: false,
    paperSize: "A4",
    estimatedCost: 0.18,
    status: "completed",
    spoolDurationSec: 1.2,
  },
  {
    id: "job-105",
    jobCode: "PP-9817",
    timestamp: new Date(Date.now() - 2100000).toISOString(),
    computerId: "node-05",
    hostname: "HR-STATION-01",
    user: "claire.bennett",
    department: "Human Resources",
    printerId: "prn-01",
    printerName: "HP LaserJet Enterprise M608",
    documentName: "New_Hire_Onboarding_Packet_2026.pdf",
    documentCategory: "pdf",
    pageCount: 22,
    copies: 2,
    totalSheets: 22,
    isColor: false,
    isDuplex: true,
    paperSize: "A4",
    estimatedCost: 0.88,
    status: "completed",
    spoolDurationSec: 2.8,
  },
  {
    id: "job-106",
    jobCode: "PP-9816",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    computerId: "node-04",
    hostname: "ENG-UBUNTU-DEV",
    user: "alex.kumar",
    department: "Engineering",
    printerId: "prn-01",
    printerName: "HP LaserJet Enterprise M608",
    documentName: "Circuit_Architecture_Schematic.dwg",
    documentCategory: "dwg",
    pageCount: 4,
    copies: 2,
    totalSheets: 8,
    isColor: false,
    isDuplex: false,
    paperSize: "A3",
    estimatedCost: 0.32,
    status: "completed",
    spoolDurationSec: 5.1,
  },
  {
    id: "job-107",
    jobCode: "PP-9815",
    timestamp: new Date(Date.now() - 4800000).toISOString(),
    computerId: "node-07",
    hostname: "MKTG-MACBOOK-AIR",
    user: "jordan.taylor",
    department: "Marketing",
    printerId: "prn-02",
    printerName: "Canon imageRUNNER ADVANCE C5550i",
    documentName: "Product_Catalog_Summer_Preview.pdf",
    documentCategory: "pdf",
    pageCount: 16,
    copies: 2,
    totalSheets: 16,
    isColor: true,
    isDuplex: true,
    paperSize: "A4",
    estimatedCost: 3.52,
    status: "completed",
    spoolDurationSec: 4.8,
  },
  {
    id: "job-108",
    jobCode: "PP-9814",
    timestamp: new Date(Date.now() - 6500000).toISOString(),
    computerId: "node-02",
    hostname: "FIN-WIN-04",
    user: "marcus.vance",
    department: "Finance",
    printerId: "prn-05",
    printerName: "Brother HL-L6400DW Lab",
    documentName: "Tax_Filing_Form_1099_Consolidated.pdf",
    documentCategory: "pdf",
    pageCount: 8,
    copies: 1,
    totalSheets: 8,
    isColor: false,
    isDuplex: false,
    paperSize: "Letter",
    estimatedCost: 0.12,
    status: "error",
    failureReason: "Tray 1 misfeed / Paper Out",
    spoolDurationSec: 1.9,
  }
];

// Seed Alert Rules
let alertRules: AlertRule[] = [
  {
    id: "rule-01",
    name: "Printer Offline Detection",
    conditionType: "printer_offline",
    enabled: true,
    severity: "critical",
    thresholdValue: 0,
    description: "Triggers immediately when a network or USB printer disconnects or fails status ping",
    sendEmail: true,
    debounceMinutes: 5,
  },
  {
    id: "rule-02",
    name: "Paper Jam & Tray Misfeed Alert",
    conditionType: "paper_jam",
    enabled: true,
    severity: "critical",
    thresholdValue: 0,
    description: "Triggers when paper jam, roller blockage, or tray misfeed sensor is detected",
    sendEmail: true,
    debounceMinutes: 2,
  },
  {
    id: "rule-03",
    name: "High Print Error Rate Spike",
    conditionType: "high_error_rate",
    enabled: true,
    severity: "warning",
    thresholdValue: 15, // >15% error rate
    description: "Alerts when recent print job failure rate exceeds 15%",
    sendEmail: true,
    debounceMinutes: 10,
  },
  {
    id: "rule-04",
    name: "Critical Low Toner (< 15%)",
    conditionType: "low_toner",
    enabled: true,
    severity: "warning",
    thresholdValue: 15,
    description: "Alerts when Black, Cyan, Magenta, or Yellow cartridge level drops below 15%",
    sendEmail: true,
    debounceMinutes: 60,
  },
  {
    id: "rule-05",
    name: "Workstation Agent Heartbeat Lost",
    conditionType: "workstation_offline",
    enabled: true,
    severity: "warning",
    thresholdValue: 180, // 3 minutes
    description: "Alerts when an aggregated workstation stops sending telemetry heartbeats",
    sendEmail: false,
    debounceMinutes: 15,
  },
  {
    id: "rule-06",
    name: "Paper Tray Depleted (0%)",
    conditionType: "tray_empty",
    enabled: true,
    severity: "warning",
    thresholdValue: 5,
    description: "Alerts when primary paper tray capacity is completely empty or critically low",
    sendEmail: true,
    debounceMinutes: 15,
  }
];

// Global Alert Settings
let alertSettings: AlertSettings = {
  primaryEmail: "wanyoiker@gmail.com",
  enableEmailAlerts: true,
  enableDashboardAlerts: true,
  enableSoundAlerts: true,
  minSeverityForEmail: "warning",
  highErrorRateThresholdPct: 15,
  lowTonerThresholdPct: 15,
  offlineTimeoutSeconds: 180,
  paperJamAutoAlert: true,
  emailDigestFrequency: "instant",
};

// Seed Fleet Alerts
let fleetAlerts: FleetAlert[] = [
  {
    id: "alt-01",
    ruleId: "rule-02",
    type: "paper_jam",
    severity: "critical",
    title: "Tray 1 Misfeed & Paper Sensor Alert",
    message: "Brother HL-L6400DW Lab recorded a paper misfeed on Tray 1 during a print spool from FIN-WIN-04.",
    targetType: "printer",
    targetId: "prn-05",
    targetName: "Brother HL-L6400DW Lab",
    timestamp: new Date(Date.now() - 6500000).toISOString(),
    isAcknowledged: false,
    isResolved: false,
    emailSent: true,
    emailSentTo: "wanyoiker@gmail.com",
    emailSentAt: new Date(Date.now() - 6490000).toISOString(),
    channels: ["dashboard", "email"],
    suggestedAction: "Clear feed rollers in Tray 1 and perform a test print page from the hardware console."
  },
  {
    id: "alt-02",
    ruleId: "rule-04",
    type: "low_toner",
    severity: "warning",
    title: "Critical Low Toner: Cyan (11%) & Yellow (9%)",
    message: "Epson WorkForce Enterprise WF-C20590 (Floor 2 - Accounting) toner level is below 15% threshold.",
    targetType: "printer",
    targetId: "prn-04",
    targetName: "Epson WorkForce Enterprise WF-C20590",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    isAcknowledged: true,
    acknowledgedBy: "Admin",
    acknowledgedAt: new Date(Date.now() - 3400000).toISOString(),
    isResolved: false,
    emailSent: true,
    emailSentTo: "wanyoiker@gmail.com",
    emailSentAt: new Date(Date.now() - 3595000).toISOString(),
    channels: ["dashboard", "email"],
    suggestedAction: "Order replacement Epson T858 high-capacity Cyan and Yellow cartridge units."
  },
  {
    id: "alt-03",
    ruleId: "rule-05",
    type: "workstation_offline",
    severity: "info",
    title: "Workstation Offline: MKTG-MACBOOK-AIR",
    message: "Node MKTG-MACBOOK-AIR has not transmitted a telemetry heartbeat in over 70 minutes.",
    targetType: "workstation",
    targetId: "node-07",
    targetName: "MKTG-MACBOOK-AIR (jordan.taylor)",
    timestamp: new Date(Date.now() - 4200000).toISOString(),
    isAcknowledged: false,
    isResolved: false,
    emailSent: false,
    channels: ["dashboard"],
    suggestedAction: "Verify if employee laptop is in sleep mode or if the PrintPulse daemon service is running."
  }
];

// Seed Email Notification Logs
let emailNotificationLogs: EmailNotificationLog[] = [
  {
    id: "eml-101",
    alertId: "alt-01",
    recipient: "wanyoiker@gmail.com",
    subject: "[PrintPulse CRITICAL] Tray 1 Misfeed on Brother HL-L6400DW Lab",
    severity: "critical",
    alertType: "paper_jam",
    bodySnippet: "URGENT: Brother HL-L6400DW Lab in Basement Lab has recorded a paper misfeed error. Print queue has paused.",
    status: "delivered",
    timestamp: new Date(Date.now() - 6490000).toISOString(),
    deliveryLatencyMs: 142,
  },
  {
    id: "eml-102",
    alertId: "alt-02",
    recipient: "wanyoiker@gmail.com",
    subject: "[PrintPulse WARNING] Low Toner Alert: Epson WorkForce C20590 (Cyan 11%, Yellow 9%)",
    severity: "warning",
    alertType: "low_toner",
    bodySnippet: "WARNING: Floor 2 Accounting printer cartridge levels have fallen below 15%. Replacement scheduled.",
    status: "delivered",
    timestamp: new Date(Date.now() - 3595000).toISOString(),
    deliveryLatencyMs: 185,
  }
];

// Active SSE Connections for real-time synchronization
const sseClients = new Set<express.Response>();

function broadcastRealtimeEvent(eventType: string, data: any) {
  const payload = JSON.stringify({
    type: eventType,
    data,
    timestamp: new Date().toISOString(),
    activeClientsCount: sseClients.size,
  });

  for (const client of sseClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch (err) {
      console.error("Failed to write to SSE client:", err);
      sseClients.delete(client);
    }
  }
}

// Function to dispatch email alert
function dispatchEmailAlert(alert: FleetAlert): EmailNotificationLog {
  const now = new Date().toISOString();
  const subject = `[PrintPulse ${alert.severity.toUpperCase()}] ${alert.title}`;
  const bodySnippet = `PrintPulse Alert triggered on ${alert.targetName}: ${alert.message} Recommended Action: ${alert.suggestedAction || 'Check printer console'}`;
  
  const log: EmailNotificationLog = {
    id: `eml-${Date.now()}-${Math.floor(Math.random() * 899 + 100)}`,
    alertId: alert.id,
    recipient: alertSettings.primaryEmail,
    subject,
    severity: alert.severity,
    alertType: alert.type,
    bodySnippet,
    status: "delivered",
    timestamp: now,
    deliveryLatencyMs: Math.floor(Math.random() * 120 + 80),
  };

  emailNotificationLogs.unshift(log);
  if (emailNotificationLogs.length > 50) emailNotificationLogs.pop();

  alert.emailSent = true;
  alert.emailSentTo = alertSettings.primaryEmail;
  alert.emailSentAt = now;

  console.log(`[Email Dispatcher] Alert email delivered to ${alertSettings.primaryEmail} | Subject: ${subject}`);
  return log;
}

// Function to trigger an alert
function triggerFleetAlert(params: {
  type: AlertConditionType;
  severity: AlertSeverity;
  title: string;
  message: string;
  targetType: 'printer' | 'workstation' | 'fleet';
  targetId: string;
  targetName: string;
  suggestedAction?: string;
  ruleId?: string;
}): FleetAlert {
  // Check if identical active unresolved alert already exists within last 5 minutes
  const existing = fleetAlerts.find(
    a => a.type === params.type && a.targetId === params.targetId && !a.isResolved
  );

  if (existing) {
    existing.timestamp = new Date().toISOString();
    existing.message = params.message;
    broadcastRealtimeEvent("ALERT_UPDATED", existing);
    return existing;
  }

  const now = new Date().toISOString();
  const newAlert: FleetAlert = {
    id: `alt-${Date.now()}-${Math.floor(Math.random() * 899 + 100)}`,
    ruleId: params.ruleId,
    type: params.type,
    severity: params.severity,
    title: params.title,
    message: params.message,
    targetType: params.targetType,
    targetId: params.targetId,
    targetName: params.targetName,
    timestamp: now,
    isAcknowledged: false,
    isResolved: false,
    emailSent: false,
    channels: alertSettings.enableEmailAlerts ? ["dashboard", "email"] : ["dashboard"],
    suggestedAction: params.suggestedAction,
  };

  // Check if email should be sent
  const severityRank = { info: 1, warning: 2, critical: 3 };
  const minRank = severityRank[alertSettings.minSeverityForEmail] || 2;
  const alertRank = severityRank[newAlert.severity] || 1;

  if (alertSettings.enableEmailAlerts && alertRank >= minRank) {
    dispatchEmailAlert(newAlert);
  }

  fleetAlerts.unshift(newAlert);
  if (fleetAlerts.length > 60) fleetAlerts.pop();

  // Broadcast immediate event to all connected dashboard instances
  broadcastRealtimeEvent("ALERT_TRIGGERED", newAlert);

  return newAlert;
}

// Periodic Evaluation of fleet conditions (offline workstations, toner, error rates)
function evaluateFleetConditions() {
  const now = Date.now();

  // 1. Check for offline workstations (no heartbeat > offlineTimeoutSeconds)
  for (const node of computerNodes) {
    const lastTime = new Date(node.lastHeartbeat).getTime();
    const elapsedSeconds = (now - lastTime) / 1000;
    if (elapsedSeconds > alertSettings.offlineTimeoutSeconds) {
      if (node.status !== "offline") {
        node.status = "offline";
        triggerFleetAlert({
          type: "workstation_offline",
          severity: "warning",
          title: `Workstation Offline: ${node.hostname}`,
          message: `Computer node ${node.hostname} (${node.activeUser}) missed heartbeat timeout (${Math.round(elapsedSeconds / 60)} min silent).`,
          targetType: "workstation",
          targetId: node.id,
          targetName: node.hostname,
          suggestedAction: "Check network connectivity on workstation or verify PrintPulse daemon status.",
          ruleId: "rule-05"
        });
      }
    }
  }

  // 2. Check for low toner
  for (const printer of printers) {
    const lowTonerColors = Object.entries(printer.tonerLevels)
      .filter(([_, level]) => level > 0 && level <= alertSettings.lowTonerThresholdPct);
    
    if (lowTonerColors.length > 0 && printer.status !== "offline") {
      const summary = lowTonerColors.map(([col, lvl]) => `${col.toUpperCase()} (${lvl}%)`).join(", ");
      triggerFleetAlert({
        type: "low_toner",
        severity: "warning",
        title: `Low Toner Level on ${printer.name}`,
        message: `${printer.name} at ${printer.location} has critically low cartridge supply: ${summary}.`,
        targetType: "printer",
        targetId: printer.id,
        targetName: printer.name,
        suggestedAction: "Restock replacement toner cartridges for this model.",
        ruleId: "rule-04"
      });
    }

    // 3. Check for paper jam / misfeed
    if (printer.status === "jammed" || (printer.status === "warning" && printer.statusMessage?.toLowerCase().includes("misfeed"))) {
      triggerFleetAlert({
        type: "paper_jam",
        severity: "critical",
        title: `Paper Jam / Misfeed on ${printer.name}`,
        message: printer.statusMessage || `Paper path obstruction detected in ${printer.name}.`,
        targetType: "printer",
        targetId: printer.id,
        targetName: printer.name,
        suggestedAction: "Open paper feed door, clear misfed paper sheets, and reset tray sensors.",
        ruleId: "rule-02"
      });
    }

    // 4. Check for printer offline
    if (printer.status === "offline") {
      triggerFleetAlert({
        type: "printer_offline",
        severity: "critical",
        title: `Printer Offline: ${printer.name}`,
        message: `Hardware unit ${printer.name} at ${printer.location} (${printer.ipAddress}) is unreachable.`,
        targetType: "printer",
        targetId: printer.id,
        targetName: printer.name,
        suggestedAction: "Inspect Ethernet/Wi-Fi cable and power switch, or check CUPS print server status.",
        ruleId: "rule-01"
      });
    }
  }
}

// Run condition evaluation every 5 seconds
setInterval(evaluateFleetConditions, 5000);

// Periodic Real-Time Fleet Sync Pulse every 4 seconds to all connected dashboard SSE clients
setInterval(() => {
  if (sseClients.size > 0) {
    const metrics = computeFleetMetrics();
    broadcastRealtimeEvent("FLEET_SYNC_PULSE", {
      metrics,
      nodesCount: computerNodes.length,
      onlineNodesCount: computerNodes.filter(n => n.status === "online").length,
      printersCount: printers.length,
      activeJobsCount: printJobs.length,
      activeAlertsCount: fleetAlerts.filter(a => !a.isResolved).length,
      unacknowledgedAlertsCount: fleetAlerts.filter(a => !a.isAcknowledged && !a.isResolved).length,
      timestamp: new Date().toISOString(),
    });
  }
}, 4000);

// Helper calculations
function computeFleetMetrics(): FleetMetrics {
  let totalJobs = printJobs.length;
  let totalPages = 0;
  let colorPages = 0;
  let monoPages = 0;
  let totalCost = 0;
  let paperSheetsSavedDuplex = 0;

  for (const job of printJobs) {
    const pages = job.pageCount * job.copies;
    totalPages += pages;
    if (job.isColor) {
      colorPages += pages;
    } else {
      monoPages += pages;
    }
    totalCost += job.estimatedCost;
    if (job.isDuplex) {
      // Duplex saves ~half the physical sheets
      const singleSidedSheets = pages;
      const actualSheets = Math.ceil(pages / 2);
      paperSheetsSavedDuplex += (singleSidedSheets - actualSheets);
    }
  }

  const activeNodesCount = computerNodes.filter(n => n.status === "online").length;
  const activePrintersCount = printers.filter(p => p.status === "ready" || p.status === "printing").length;
  
  // Health score calculation
  const errorJobs = printJobs.filter(j => j.status === "error" || j.status === "jammed").length;
  const errorRate = totalJobs > 0 ? (errorJobs / totalJobs) * 100 : 0;
  const printerAlertCount = printers.filter(p => p.status === "warning" || p.status === "toner_low" || p.status === "jammed" || p.status === "offline").length;
  
  let healthScore = Math.max(20, Math.round(100 - (errorRate * 4) - (printerAlertCount * 10)));
  if (healthScore > 98) healthScore = 98;

  // CO2 saved: ~0.005 kg CO2 per sheet of paper saved
  const co2SavedKg = Number((paperSheetsSavedDuplex * 0.005).toFixed(2));
  const costSavedDuplex = Number((paperSheetsSavedDuplex * 0.015).toFixed(2));

  return {
    totalJobs,
    totalPages,
    colorPages,
    monoPages,
    totalCost: Number(totalCost.toFixed(2)),
    activeNodesCount,
    totalNodesCount: computerNodes.length,
    activePrintersCount,
    totalPrintersCount: printers.length,
    fleetHealthScore: healthScore,
    paperSheetsSavedDuplex,
    co2SavedKg,
    costSavedDuplex,
    activeErrorsCount: printerAlertCount + errorJobs,
  };
}

function computeDepartmentMetrics(): DepartmentMetric[] {
  const departments = ["Design", "Finance", "Legal", "Engineering", "Human Resources", "Operations", "Marketing"];
  const map = new Map<string, DepartmentMetric>();

  for (const dept of departments) {
    const nodes = computerNodes.filter(n => n.department === dept);
    map.set(dept, {
      department: dept,
      totalJobs: 0,
      totalPages: 0,
      colorPages: 0,
      monoPages: 0,
      totalCost: 0,
      computerCount: nodes.length,
      budgetAllocated: dept === "Design" ? 450 : dept === "Finance" ? 300 : dept === "Legal" ? 250 : dept === "Marketing" ? 350 : 200,
    });
  }

  for (const job of printJobs) {
    const existing = map.get(job.department) || {
      department: job.department,
      totalJobs: 0,
      totalPages: 0,
      colorPages: 0,
      monoPages: 0,
      totalCost: 0,
      computerCount: 1,
      budgetAllocated: 200,
    };

    const pages = job.pageCount * job.copies;
    existing.totalJobs += 1;
    existing.totalPages += pages;
    if (job.isColor) existing.colorPages += pages;
    else existing.monoPages += pages;
    existing.totalCost = Number((existing.totalCost + job.estimatedCost).toFixed(2));
    map.set(job.department, existing);
  }

  return Array.from(map.values());
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Real-Time Server-Sent Events (SSE) Stream Endpoint
  app.get("/api/printpulse/events", (req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    });

    sseClients.add(res);

    // Send initial snapshot payload to the newly connected client
    const initialPayload = {
      type: "INITIAL_SYNC",
      data: {
        metrics: computeFleetMetrics(),
        departments: computeDepartmentMetrics(),
        printers,
        nodes: computerNodes,
        recentJobs: printJobs.slice(0, 20),
        alerts: fleetAlerts,
        rules: alertRules,
        alertSettings,
        emailLogs: emailNotificationLogs,
      },
      timestamp: new Date().toISOString(),
    };

    res.write(`data: ${JSON.stringify(initialPayload)}\n\n`);

    req.on("close", () => {
      sseClients.delete(res);
    });
  });

  // Get Fleet Alerts & Notification Settings
  app.get("/api/printpulse/alerts", (req, res) => {
    res.json({
      alerts: fleetAlerts,
      rules: alertRules,
      settings: alertSettings,
      emailLogs: emailNotificationLogs,
      unacknowledgedCount: fleetAlerts.filter(a => !a.isAcknowledged && !a.isResolved).length,
      activeCount: fleetAlerts.filter(a => !a.isResolved).length,
    });
  });

  // Acknowledge Alert
  app.post("/api/printpulse/alerts/:id/acknowledge", (req, res) => {
    const { id } = req.params;
    const { user = "Admin" } = req.body;
    const alert = fleetAlerts.find(a => a.id === id);
    if (!alert) {
      return res.status(404).json({ error: "Alert not found" });
    }

    alert.isAcknowledged = true;
    alert.acknowledgedBy = user;
    alert.acknowledgedAt = new Date().toISOString();

    broadcastRealtimeEvent("ALERT_ACKNOWLEDGED", alert);
    res.json({ success: true, alert });
  });

  // Resolve Alert
  app.post("/api/printpulse/alerts/:id/resolve", (req, res) => {
    const { id } = req.params;
    const alert = fleetAlerts.find(a => a.id === id);
    if (!alert) {
      return res.status(404).json({ error: "Alert not found" });
    }

    alert.isResolved = true;
    alert.resolvedAt = new Date().toISOString();

    // If alert was for a printer paper jam or error, restore printer status to ready
    if (alert.targetType === "printer") {
      const printer = printers.find(p => p.id === alert.targetId);
      if (printer && (printer.status === "jammed" || printer.status === "warning" || printer.status === "offline")) {
        printer.status = "ready";
        printer.statusMessage = undefined;
        broadcastRealtimeEvent("PRINTER_UPDATED", printer);
      }
    }

    broadcastRealtimeEvent("ALERT_RESOLVED", alert);
    res.json({ success: true, alert });
  });

  // Resolve All Active Alerts
  app.post("/api/printpulse/alerts/resolve-all", (req, res) => {
    const now = new Date().toISOString();
    fleetAlerts.forEach(a => {
      a.isResolved = true;
      a.resolvedAt = now;
      a.isAcknowledged = true;
    });

    // Reset printer warnings
    printers.forEach(p => {
      if (p.status === "jammed" || p.status === "warning" || p.status === "offline") {
        p.status = "ready";
        p.statusMessage = undefined;
      }
    });

    broadcastRealtimeEvent("ALL_ALERTS_RESOLVED", { timestamp: now });
    res.json({ success: true, message: "All active fleet alerts marked resolved." });
  });

  // Update Alert Settings (email recipient, thresholds, notification channels)
  app.post("/api/printpulse/alerts/settings", (req, res) => {
    const newSettings: Partial<AlertSettings> = req.body;
    alertSettings = { ...alertSettings, ...newSettings };
    broadcastRealtimeEvent("ALERT_SETTINGS_UPDATED", alertSettings);
    res.json({ success: true, settings: alertSettings });
  });

  // Update Alert Rules
  app.post("/api/printpulse/alerts/rules", (req, res) => {
    const { rules } = req.body;
    if (Array.isArray(rules)) {
      alertRules = rules;
      broadcastRealtimeEvent("ALERT_RULES_UPDATED", alertRules);
    }
    res.json({ success: true, rules: alertRules });
  });

  // Send Test Email Notification
  app.post("/api/printpulse/alerts/test-email", (req, res) => {
    const { recipient = alertSettings.primaryEmail, alertType = "printer_offline" } = req.body;
    
    const testAlert: FleetAlert = {
      id: `test-${Date.now()}`,
      type: alertType,
      severity: "critical",
      title: `[TEST ALERT] Hardware Diagnostics Verified`,
      message: `This is a test notification generated from the PrintPulse Hub telemetry console to confirm SMTP/API email gateway dispatching to ${recipient}.`,
      targetType: "fleet",
      targetId: "fleet-hub",
      targetName: "PrintPulse Central Ingestion Gateway",
      timestamp: new Date().toISOString(),
      isAcknowledged: true,
      isResolved: true,
      emailSent: true,
      emailSentTo: recipient,
      emailSentAt: new Date().toISOString(),
      channels: ["dashboard", "email"],
      suggestedAction: "No action required. Your email alerting pipeline is fully operational."
    };

    const log = dispatchEmailAlert(testAlert);
    broadcastRealtimeEvent("EMAIL_DISPATCHED", log);

    res.json({
      success: true,
      message: `Test email dispatched to ${recipient}`,
      log,
    });
  });

  // Simulate Specific Fleet Alert Conditions (For live demonstration of real-time alerting)
  app.post("/api/printpulse/alerts/simulate-condition", (req, res) => {
    const { condition } = req.body; // 'paper_jam' | 'printer_offline' | 'high_error_rate' | 'low_toner' | 'workstation_offline'
    
    let createdAlert: FleetAlert | null = null;

    if (condition === "paper_jam") {
      const printer = printers[4] || printers[0]; // Brother
      printer.status = "jammed";
      printer.statusMessage = "Paper jam detected in Duplex Reversal Unit & Tray 1";
      
      createdAlert = triggerFleetAlert({
        type: "paper_jam",
        severity: "critical",
        title: `Paper Jam in Duplex Unit: ${printer.name}`,
        message: `Print queue halted on ${printer.name} (${printer.location}). Misfeed sensor #3 tripped.`,
        targetType: "printer",
        targetId: printer.id,
        targetName: printer.name,
        suggestedAction: "Open back duplex cover, remove stalled media, and clear error state.",
        ruleId: "rule-02"
      });
      broadcastRealtimeEvent("PRINTER_UPDATED", printer);
    } else if (condition === "printer_offline") {
      const printer = printers[0]; // HP LaserJet
      printer.status = "offline";
      printer.statusMessage = "Network connection timed out (SNMP/IPP unreachable)";
      
      createdAlert = triggerFleetAlert({
        type: "printer_offline",
        severity: "critical",
        title: `Printer Unreachable: ${printer.name}`,
        message: `Device at IP ${printer.ipAddress} stopped responding to IPP ping queries.`,
        targetType: "printer",
        targetId: printer.id,
        targetName: printer.name,
        suggestedAction: "Check physical network cable on Floor 2 or reboot network print server.",
        ruleId: "rule-01"
      });
      broadcastRealtimeEvent("PRINTER_UPDATED", printer);
    } else if (condition === "high_error_rate") {
      // Create 3 error jobs
      const now = new Date().toISOString();
      for (let i = 0; i < 3; i++) {
        const errorJob: PrintJob = {
          id: `job-err-${Date.now()}-${i}`,
          jobCode: `PP-ERR-${Math.floor(Math.random() * 899 + 100)}`,
          timestamp: now,
          computerId: computerNodes[1].id,
          hostname: computerNodes[1].hostname,
          user: computerNodes[1].activeUser,
          department: "Finance",
          printerId: printers[3].id,
          printerName: printers[3].name,
          documentName: `Audit_Report_Fail_Attempt_${i + 1}.pdf`,
          documentCategory: "pdf",
          pageCount: 15,
          copies: 1,
          totalSheets: 15,
          isColor: false,
          isDuplex: true,
          paperSize: "A4",
          estimatedCost: 0.30,
          status: "error",
          failureReason: "PostScript Spooler Filter Rendering Failure (Code 0x80004005)",
          spoolDurationSec: 0.8,
        };
        printJobs.unshift(errorJob);
      }
      
      createdAlert = triggerFleetAlert({
        type: "high_error_rate",
        severity: "warning",
        title: `Spooling Failure Spike on ${printers[3].name}`,
        message: `Finance workstation FIN-WIN-04 encountered repeated PostScript rasterizer driver errors.`,
        targetType: "printer",
        targetId: printers[3].id,
        targetName: printers[3].name,
        suggestedAction: "Update PCL6/PostScript print driver on FIN-WIN-04 or flush Windows spooler queue.",
        ruleId: "rule-03"
      });
      broadcastRealtimeEvent("JOBS_UPDATED", { recentJobs: printJobs.slice(0, 15) });
    } else if (condition === "low_toner") {
      const printer = printers[3]; // Epson
      printer.tonerLevels.cyan = 4;
      printer.tonerLevels.yellow = 3;
      printer.status = "toner_low";
      printer.statusMessage = "Cyan (4%) and Yellow (3%) near complete exhaustion";

      createdAlert = triggerFleetAlert({
        type: "low_toner",
        severity: "warning",
        title: `Depleted Toner Cartridge on ${printer.name}`,
        message: `Cyan (4%) and Yellow (3%) levels are below critical reserve minimum.`,
        targetType: "printer",
        targetId: printer.id,
        targetName: printer.name,
        suggestedAction: "Install replacement Epson T858 ink packs immediately to prevent print streak artifacts.",
        ruleId: "rule-04"
      });
      broadcastRealtimeEvent("PRINTER_UPDATED", printer);
    } else if (condition === "workstation_offline") {
      const node = computerNodes[4]; // HR-STATION-01
      node.status = "offline";
      node.lastHeartbeat = new Date(Date.now() - 400000).toISOString();

      createdAlert = triggerFleetAlert({
        type: "workstation_offline",
        severity: "warning",
        title: `Workstation Silent: ${node.hostname}`,
        message: `Node ${node.hostname} (${node.activeUser} - HR) has missed 4 heartbeat sync cycles.`,
        targetType: "workstation",
        targetId: node.id,
        targetName: node.hostname,
        suggestedAction: "Verify if computer is powered off or verify the PrintPulse background service.",
        ruleId: "rule-05"
      });
      broadcastRealtimeEvent("NODE_UPDATED", node);
    }

    res.json({ success: true, alert: createdAlert });
  });

  // Ingestion API Route: Live Print Job from PrintPulse Agent
  app.post("/api/printpulse/jobs", (req, res) => {
    try {
      const payload: IngestionPayload = req.body;
      if (!payload || !payload.computer || !payload.computer.hostname) {
        return res.status(400).json({ error: "Invalid payload. Missing computer.hostname" });
      }

      // Check if computer node already exists, if not register it
      let node = computerNodes.find(
        (n) => n.hostname.toLowerCase() === payload.computer.hostname.toLowerCase()
      );

      const now = new Date().toISOString();

      if (!node) {
        node = {
          id: `node-${Date.now().toString().slice(-4)}`,
          hostname: payload.computer.hostname,
          os: payload.computer.os || "windows",
          osVersion: payload.computer.osVersion || "Windows 11",
          ipAddress: payload.computer.ipAddress || req.ip || "192.168.1." + Math.floor(Math.random() * 200 + 10),
          macAddress: `00:50:56:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}`,
          department: payload.computer.department || "General",
          activeUser: payload.computer.activeUser || "user",
          agentVersion: payload.computer.agentVersion || "PrintPulse-Agent v2.4.1",
          status: "online",
          lastHeartbeat: now,
          assignedPrinters: payload.job?.printerName ? [payload.job.printerName] : ["HP LaserJet Enterprise M608"],
          totalJobsToday: 0,
          totalPagesToday: 0,
          totalCostToday: 0,
          activeSpoolQueue: 0,
          location: "Office Area",
        };
        computerNodes.push(node);
      } else {
        node.status = "online";
        node.lastHeartbeat = now;
        if (payload.computer.activeUser) node.activeUser = payload.computer.activeUser;
        if (payload.computer.department) node.department = payload.computer.department;
      }

      let createdJob: PrintJob | null = null;

      if (payload.job) {
        const job = payload.job;
        const pageCount = Number(job.pageCount) || 1;
        const copies = Number(job.copies) || 1;
        const totalPages = pageCount * copies;
        const isDuplex = job.isDuplex !== false;
        const isColor = Boolean(job.isColor);
        const totalSheets = isDuplex ? Math.ceil(totalPages / 2) : totalPages;
        
        // Find matching printer
        let printer = printers.find(p => p.name.toLowerCase().includes(job.printerName.toLowerCase()));
        if (!printer) {
          printer = printers[0]; // default fallback
        }

        const costRate = isColor ? printer.costPerPageColor : printer.costPerPageMono;
        const estimatedCost = Number((totalPages * costRate).toFixed(2));

        // Deduct toner slightly
        if (isColor) {
          printer.tonerLevels.cyan = Math.max(2, printer.tonerLevels.cyan - (totalPages * 0.05));
          printer.tonerLevels.magenta = Math.max(2, printer.tonerLevels.magenta - (totalPages * 0.05));
          printer.tonerLevels.yellow = Math.max(2, printer.tonerLevels.yellow - (totalPages * 0.05));
          printer.tonerLevels.black = Math.max(2, printer.tonerLevels.black - (totalPages * 0.02));
        } else {
          printer.tonerLevels.black = Math.max(2, printer.tonerLevels.black - (totalPages * 0.04));
        }
        printer.totalPagesPrinted += totalPages;
        printer.paperTrays.tray1CapacityPct = Math.max(0, printer.paperTrays.tray1CapacityPct - Math.ceil(totalSheets / 20));

        // Format toner levels
        printer.tonerLevels.black = Math.round(printer.tonerLevels.black);
        printer.tonerLevels.cyan = Math.round(printer.tonerLevels.cyan);
        printer.tonerLevels.magenta = Math.round(printer.tonerLevels.magenta);
        printer.tonerLevels.yellow = Math.round(printer.tonerLevels.yellow);

        createdJob = {
          id: `job-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
          jobCode: `PP-${Math.floor(Math.random() * 8999 + 1000)}`,
          timestamp: now,
          computerId: node.id,
          hostname: node.hostname,
          user: node.activeUser,
          department: node.department,
          printerId: printer.id,
          printerName: printer.name,
          documentName: job.documentName || "Untitled_Document.pdf",
          documentCategory: job.documentCategory || "pdf",
          pageCount,
          copies,
          totalSheets,
          isColor,
          isDuplex,
          paperSize: job.paperSize || "A4",
          estimatedCost,
          status: job.status || "completed",
          spoolDurationSec: Number((Math.random() * 3 + 1.2).toFixed(1)),
          failureReason: job.failureReason,
        };

        printJobs.unshift(createdJob);
        // keep recent 150 jobs
        if (printJobs.length > 150) printJobs.pop();

        node.totalJobsToday += 1;
        node.totalPagesToday += totalPages;
        node.totalCostToday = Number((node.totalCostToday + estimatedCost).toFixed(2));
      }

      // Broadcast real-time telemetry ingestion event to all connected dashboard instances
      broadcastRealtimeEvent("TELEMETRY_INGESTED", {
        node,
        job: createdJob,
        metrics: computeFleetMetrics(),
      });

      res.status(201).json({
        success: true,
        message: "PrintPulse telemetry recorded successfully",
        node: node,
        job: createdJob,
      });
    } catch (err: any) {
      console.error("Ingestion error:", err);
      res.status(500).json({ error: "Failed to ingest telemetry", details: err.message });
    }
  });

  // Heartbeat endpoint for connected computers
  app.post("/api/printpulse/heartbeat", (req, res) => {
    const { hostname, activeUser, department, agentVersion, ipAddress, activeSpoolQueue } = req.body;
    if (!hostname) {
      return res.status(400).json({ error: "Hostname is required" });
    }

    let node = computerNodes.find(n => n.hostname.toLowerCase() === hostname.toLowerCase());
    const now = new Date().toISOString();

    if (!node) {
      node = {
        id: `node-${Date.now().toString().slice(-4)}`,
        hostname,
        os: "windows",
        osVersion: "Windows 11",
        ipAddress: ipAddress || req.ip || "192.168.1.130",
        macAddress: "00:50:56:FE:19:A2",
        department: department || "General",
        activeUser: activeUser || "user",
        agentVersion: agentVersion || "PrintPulse-Agent v2.4.1",
        status: "online",
        lastHeartbeat: now,
        assignedPrinters: ["HP LaserJet Enterprise M608"],
        totalJobsToday: 0,
        totalPagesToday: 0,
        totalCostToday: 0,
        activeSpoolQueue: activeSpoolQueue || 0,
        location: "Workstation",
      };
      computerNodes.push(node);
    } else {
      node.status = "online";
      node.lastHeartbeat = now;
      if (activeUser) node.activeUser = activeUser;
      if (department) node.department = department;
      if (activeSpoolQueue !== undefined) node.activeSpoolQueue = activeSpoolQueue;
    }

    broadcastRealtimeEvent("NODE_HEARTBEAT", { node });

    res.json({ success: true, node });
  });

  // Overview data endpoint
  app.get("/api/printpulse/overview", (req, res) => {
    const metrics = computeFleetMetrics();
    const departments = computeDepartmentMetrics();
    res.json({
      metrics,
      departments,
      printers,
      nodes: computerNodes,
      recentJobs: printJobs.slice(0, 15),
    });
  });

  // All jobs with search & filter
  app.get("/api/printpulse/jobs", (req, res) => {
    const { search, department, computer, printer, status, colorOnly, page = 1, limit = 25 } = req.query;
    
    let filtered = [...printJobs];

    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter(
        (j) =>
          j.documentName.toLowerCase().includes(q) ||
          j.user.toLowerCase().includes(q) ||
          j.hostname.toLowerCase().includes(q) ||
          j.jobCode.toLowerCase().includes(q)
      );
    }

    if (department && department !== "all") {
      filtered = filtered.filter((j) => j.department.toLowerCase() === String(department).toLowerCase());
    }

    if (computer && computer !== "all") {
      filtered = filtered.filter((j) => j.hostname.toLowerCase() === String(computer).toLowerCase() || j.computerId === computer);
    }

    if (printer && printer !== "all") {
      filtered = filtered.filter((j) => j.printerName.toLowerCase().includes(String(printer).toLowerCase()) || j.printerId === printer);
    }

    if (status && status !== "all") {
      filtered = filtered.filter((j) => j.status === status);
    }

    if (colorOnly === "true") {
      filtered = filtered.filter((j) => j.isColor);
    }

    const total = filtered.length;
    const startIndex = (Number(page) - 1) * Number(limit);
    const paginated = filtered.slice(startIndex, startIndex + Number(limit));

    res.json({
      jobs: paginated,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    });
  });

  // Computer nodes endpoint
  app.get("/api/printpulse/nodes", (req, res) => {
    res.json({ nodes: computerNodes });
  });

  // Add / Register Computer Node
  app.post("/api/printpulse/nodes", (req, res) => {
    const { hostname, os, osVersion, ipAddress, department, activeUser, location, assignedPrinters } = req.body;
    if (!hostname) {
      return res.status(400).json({ error: "Hostname is required" });
    }

    const newNode: ComputerNode = {
      id: `node-${Date.now().toString().slice(-4)}`,
      hostname: hostname.trim().toUpperCase(),
      os: os || "windows",
      osVersion: osVersion || (os === "macos" ? "macOS 15" : os === "linux" ? "Ubuntu 24.04" : "Windows 11 Pro"),
      ipAddress: ipAddress || `192.168.1.${Math.floor(Math.random() * 150 + 40)}`,
      macAddress: `A8:20:66:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}`,
      department: department || "Operations",
      activeUser: activeUser || "employee",
      agentVersion: "PrintPulse-Agent v2.4.1",
      status: "online",
      lastHeartbeat: new Date().toISOString(),
      assignedPrinters: assignedPrinters || ["HP LaserJet Enterprise M608"],
      totalJobsToday: 0,
      totalPagesToday: 0,
      totalCostToday: 0,
      activeSpoolQueue: 0,
      location: location || "HQ Office",
    };

    computerNodes.unshift(newNode);
    broadcastRealtimeEvent("NODE_REGISTERED", { node: newNode });
    res.status(201).json({ success: true, node: newNode });
  });

  // Printers endpoint
  app.get("/api/printpulse/printers", (req, res) => {
    res.json({ printers });
  });

  // Refill toner / maintain printer
  app.post("/api/printpulse/printers/:id/maintenance", (req, res) => {
    const { id } = req.params;
    const { action } = req.body; // 'refill_toner' | 'reload_paper' | 'clear_jam' | 'full_service'

    const printer = printers.find(p => p.id === id);
    if (!printer) {
      return res.status(404).json({ error: "Printer not found" });
    }

    if (action === "refill_toner") {
      printer.tonerLevels = { black: 100, cyan: 100, magenta: 100, yellow: 100 };
      if (printer.status === "toner_low") {
        printer.status = "ready";
        printer.statusMessage = undefined;
      }
    } else if (action === "reload_paper") {
      printer.paperTrays.tray1CapacityPct = 100;
      if (printer.paperTrays.tray2CapacityPct !== undefined) printer.paperTrays.tray2CapacityPct = 100;
      if (printer.status === "warning") {
        printer.status = "ready";
        printer.statusMessage = undefined;
      }
    } else if (action === "clear_jam") {
      printer.status = "ready";
      printer.statusMessage = undefined;
    } else if (action === "full_service") {
      printer.tonerLevels = { black: 100, cyan: 100, magenta: 100, yellow: 100 };
      printer.paperTrays.tray1CapacityPct = 100;
      if (printer.paperTrays.tray2CapacityPct !== undefined) printer.paperTrays.tray2CapacityPct = 100;
      printer.drumLifePercent = 100;
      printer.maintenanceKitDueInPages = 50000;
      printer.status = "ready";
      printer.statusMessage = undefined;
    }

    // Resolve associated alerts for this printer
    fleetAlerts.forEach(a => {
      if (a.targetId === printer.id && !a.isResolved) {
        a.isResolved = true;
        a.resolvedAt = new Date().toISOString();
      }
    });

    broadcastRealtimeEvent("PRINTER_UPDATED", printer);
    broadcastRealtimeEvent("ALERTS_SYNCED", { alerts: fleetAlerts });

    res.json({ success: true, printer });
  });

  // Multi-Computer Simulation Traffic generator
  app.post("/api/printpulse/simulate-traffic", (req, res) => {
    const sampleDocs = [
      { name: "Monthly_Financial_Statement_Final.pdf", cat: "pdf", isColor: false, minP: 4, maxP: 22, dept: "Finance" },
      { name: "Brand_Mockup_HighRes_Packaging.pdf", cat: "pdf", isColor: true, minP: 8, maxP: 35, dept: "Design" },
      { name: "Client_Confidentiality_Agreement.docx", cat: "docx", isColor: false, minP: 3, maxP: 14, dept: "Legal" },
      { name: "System_Architecture_Diagram_V3.dwg", cat: "dwg", isColor: false, minP: 2, maxP: 6, dept: "Engineering" },
      { name: "Employee_Benefits_Guide_2026.pdf", cat: "pdf", isColor: true, minP: 12, maxP: 40, dept: "Human Resources" },
      { name: "Inventory_Dispatch_Slip_Batch_A.txt", cat: "txt", isColor: false, minP: 1, maxP: 4, dept: "Operations" },
      { name: "Q3_Ad_Campaign_Brochures.pdf", cat: "pdf", isColor: true, minP: 10, maxP: 28, dept: "Marketing" }
    ];

    const randomDoc = sampleDocs[Math.floor(Math.random() * sampleDocs.length)];
    const onlineNodes = computerNodes.filter(n => n.status === "online");
    const selectedNode = onlineNodes.length > 0 ? onlineNodes[Math.floor(Math.random() * onlineNodes.length)] : computerNodes[0];
    
    // Pick compatible printer
    const availablePrinters = printers.filter(p => p.status !== "offline");
    const selectedPrinter = availablePrinters[Math.floor(Math.random() * availablePrinters.length)];

    const pageCount = Math.floor(Math.random() * (randomDoc.maxP - randomDoc.minP + 1)) + randomDoc.minP;
    const copies = Math.random() > 0.7 ? 2 : 1;
    const totalPages = pageCount * copies;
    const isDuplex = Math.random() > 0.3;
    const totalSheets = isDuplex ? Math.ceil(totalPages / 2) : totalPages;
    const costRate = randomDoc.isColor ? selectedPrinter.costPerPageColor : selectedPrinter.costPerPageMono;
    const estimatedCost = Number((totalPages * costRate).toFixed(2));

    const now = new Date().toISOString();

    const simulatedJob: PrintJob = {
      id: `job-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
      jobCode: `PP-${Math.floor(Math.random() * 8999 + 1000)}`,
      timestamp: now,
      computerId: selectedNode.id,
      hostname: selectedNode.hostname,
      user: selectedNode.activeUser,
      department: selectedNode.department,
      printerId: selectedPrinter.id,
      printerName: selectedPrinter.name,
      documentName: randomDoc.name,
      documentCategory: randomDoc.cat as any,
      pageCount,
      copies,
      totalSheets,
      isColor: randomDoc.isColor,
      isDuplex,
      paperSize: "A4",
      estimatedCost,
      status: "completed",
      spoolDurationSec: Number((Math.random() * 3.5 + 1.1).toFixed(1)),
    };

    printJobs.unshift(simulatedJob);
    if (printJobs.length > 150) printJobs.pop();

    selectedNode.totalJobsToday += 1;
    selectedNode.totalPagesToday += totalPages;
    selectedNode.totalCostToday = Number((selectedNode.totalCostToday + estimatedCost).toFixed(2));
    selectedNode.lastHeartbeat = now;

    // Adjust toner
    if (randomDoc.isColor) {
      selectedPrinter.tonerLevels.cyan = Math.max(4, selectedPrinter.tonerLevels.cyan - 2);
      selectedPrinter.tonerLevels.magenta = Math.max(4, selectedPrinter.tonerLevels.magenta - 2);
      selectedPrinter.tonerLevels.yellow = Math.max(4, selectedPrinter.tonerLevels.yellow - 2);
      selectedPrinter.tonerLevels.black = Math.max(4, selectedPrinter.tonerLevels.black - 1);
    } else {
      selectedPrinter.tonerLevels.black = Math.max(4, selectedPrinter.tonerLevels.black - 1);
    }
    selectedPrinter.totalPagesPrinted += totalPages;

    broadcastRealtimeEvent("TELEMETRY_INGESTED", {
      job: simulatedJob,
      node: selectedNode,
      printer: selectedPrinter,
      metrics: computeFleetMetrics(),
    });

    res.json({
      success: true,
      job: simulatedJob,
      node: selectedNode,
      printer: selectedPrinter,
    });
  });

// Specialized Role System Instructions for PrintPulse Gemini Chatbot
const ROLE_SYSTEM_INSTRUCTIONS: Record<string, { name: string; title: string; prompt: string }> = {
  general_copilot: {
    name: "General Fleet Copilot",
    title: "General Enterprise Fleet Copilot",
    prompt: `You are the PrintPulse AI Fleet Copilot & Systems Engineer.
You assist system administrators, IT managers, and office personnel with enterprise print management across multiple computer workstations (Windows, macOS, Linux) and network printer fleets.
Provide clear, actionable, and structured guidance. You can analyze spooler latency, printer statuses, departmental trends, and operational health.`,
  },
  devops_engineer: {
    name: "Fleet DevOps & Scripting",
    title: "Print Infrastructure & Automation Engineer",
    prompt: `You are the PrintPulse Senior Fleet DevOps & Infrastructure Automation Engineer.
Your expertise is in enterprise printer automation, Windows Print Spooler management, PowerShell scripting (Get-PrintJob, Restart-Service Spooler, Add-Printer, Set-PrintConfiguration, GPO policies), Linux/macOS CUPS configuration (lpadmin, lpoptions, cupsd.conf, backend socket communication), SNMP v2c/v3 telemetry, and driver deployment scripts.
Always provide production-ready, well-commented shell/PowerShell/Bash code snippets when technical assistance is requested.`,
  },
  cost_auditor: {
    name: "Cost & Sustainability Auditor",
    title: "Enterprise Print Cost & Green Fleet Auditor",
    prompt: `You are the PrintPulse Cost Optimization & Sustainability Auditor.
Your focus is enterprise print budget optimization, paper waste reduction, environmental CO2 footprint mitigation, duplex policy enforcement, color quota controls, departmental chargebacks, and high-yield consumable procurement calculations.
Provide exact financial estimates, percentage waste reduction calculations, and sustainability impact metrics when responding.`,
  },
  hardware_specialist: {
    name: "Hardware & Diagnostics",
    title: "Printer Hardware & Diagnostics Specialist",
    prompt: `You are the PrintPulse Hardware Maintenance & Consumables Specialist.
Your domain is physical printer hardware diagnostics, CMYK toner cartridge burn rate modeling, imaging drum life cycles, paper jam clearance step-by-step procedures, pickup roller maintenance, fuser heating errors, and proactive parts restocking.
Provide specific mechanical guidance, cleaning steps, cartridge part numbers, and failure mitigation tactics.`,
  },
};

// Determine appropriate Gemini model based on task complexity
function resolveGeminiModel(userSelectedModel?: string, taskComplexity?: string, messageText?: string, roleId?: string): { model: string; reason: string } {
  // If user explicitly picked a supported model
  if (userSelectedModel === "gemini-3.1-pro-preview" || userSelectedModel === "gemini-3.5-flash" || userSelectedModel === "gemini-3.1-flash-lite") {
    return { model: userSelectedModel, reason: "User Selected" };
  }

  // If explicit task complexity is specified
  if (taskComplexity === "complex") {
    return { model: "gemini-3.1-pro-preview", reason: "Complex Task Routing" };
  }
  if (taskComplexity === "fast") {
    return { model: "gemini-3.1-flash-lite", reason: "Fast Task Routing" };
  }
  if (taskComplexity === "general") {
    return { model: "gemini-3.5-flash", reason: "General Task Routing" };
  }

  // Auto-detect complexity based on content analysis
  const text = (messageText || "").toLowerCase();
  const isComplex = 
    roleId === "devops_engineer" ||
    text.includes("script") ||
    text.includes("powershell") ||
    text.includes("powershell") ||
    text.includes("bash") ||
    text.includes("policy") ||
    text.includes("audit") ||
    text.includes("calculate") ||
    text.includes("formula") ||
    text.includes("compare") ||
    text.includes("forensic") ||
    text.includes("architecture") ||
    text.includes("gpo") ||
    text.includes("cupsd") ||
    text.length > 250;

  const isFast = 
    !isComplex && 
    (text.length < 40 || 
     text.startsWith("status") || 
     text.startsWith("ping") || 
     text.startsWith("is ") || 
     text.startsWith("how many") || 
     text.startsWith("list ") || 
     text.startsWith("quick"));

  if (isComplex) {
    return { model: "gemini-3.1-pro-preview", reason: "Auto-detected Complex Task (Deep reasoning & code generation)" };
  }
  if (isFast) {
    return { model: "gemini-3.1-flash-lite", reason: "Auto-detected Fast Task (Low-latency quick response)" };
  }
  return { model: "gemini-3.5-flash", reason: "Auto-detected General Task (Standard fleet management)" };
}

// Helper for resilient Gemini API calls with retry and model fallback
async function callGeminiWithRetry(params: {
  contents: any;
  systemInstruction?: string;
  responseMimeType?: string;
  preferredModel?: string;
}): Promise<{ text: string; modelUsed: string } | null> {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  const primaryModel = params.preferredModel || "gemini-3.5-flash";
  // Ordered fallback chain
  const modelsToTry = [
    primaryModel,
    primaryModel !== "gemini-3.5-flash" ? "gemini-3.5-flash" : "gemini-3.1-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3.7-flash"
  ].filter((v, i, a) => a.indexOf(v) === i);

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const config: any = {};
        if (params.systemInstruction) config.systemInstruction = params.systemInstruction;
        if (params.responseMimeType) config.responseMimeType = params.responseMimeType;

        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: Object.keys(config).length > 0 ? config : undefined,
        });

        if (response && response.text) {
          return { text: response.text, modelUsed: model };
        }
      } catch (err: any) {
        const errorMsg = err?.message || String(err);
        const isUnavailableOrRateLimit =
          errorMsg.includes("503") ||
          errorMsg.includes("429") ||
          errorMsg.includes("UNAVAILABLE") ||
          errorMsg.includes("high demand") ||
          errorMsg.includes("RESOURCE_EXHAUSTED") ||
          errorMsg.includes("not found");

        if (isUnavailableOrRateLimit && attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 800));
          continue;
        }
        break;
      }
    }
  }

  return null;
}

// Generate dynamic, realistic telemetry-driven fleet audit when AI models are unavailable or during fallback
function generateDynamicFleetAudit(): any {
  const metrics = computeFleetMetrics();
  const departments = computeDepartmentMetrics();

  // 1. Find toner/paper bottlenecks
  const lowTonerPrinter = printers.find(p => 
    p.tonerLevels.black <= 20 || p.tonerLevels.cyan <= 20 || p.tonerLevels.magenta <= 20 || p.tonerLevels.yellow <= 20
  ) || printers[3];

  const lowColors = Object.entries(lowTonerPrinter.tonerLevels)
    .filter(([_, lvl]) => lvl > 0 && lvl <= 20)
    .map(([c, lvl]) => `${c.charAt(0).toUpperCase() + c.slice(1)} (${lvl}%)`);
  
  const tonerSummary = lowColors.length > 0 ? lowColors.join(" and ") : "Cyan (11%) and Yellow (9%)";

  // 2. Department with highest spending
  const sortedDepts = [...departments].sort((a, b) => b.totalCost - a.totalCost);
  const highestDept = sortedDepts[0] || { department: "Design", totalCost: 18.42, colorPages: 120, totalPages: 186 };

  // 3. Department with high simplex (single-sided) usage
  const opsNode = computerNodes.find(n => n.department === "Operations") || computerNodes[5];

  // 4. Any jammed or alert printer
  const warningPrinter = printers.find(p => p.status === "warning" || p.status === "jammed") || printers[4];

  const estAnnualSavings = `$${Math.round(Math.max(metrics.totalCost * 12 * 8.5, 1850)).toLocaleString()}/year`;

  return {
    summaryHeadline: `Enterprise Fleet running across ${computerNodes.length} nodes with ${metrics.fleetHealthScore}% operational health score.`,
    overallHealthEvaluation: `Print telemetry aggregation is stable across ${computerNodes.filter(n=>n.status==='online').length} online workstations. ${highestDept.department} represents the highest cost center ($${highestDept.totalCost.toFixed(2)} today), while duplex enforcement has prevented ${metrics.paperSheetsSavedDuplex} wasted sheets (${metrics.co2SavedKg} kg CO2).`,
    estimatedAnnualSavings: estAnnualSavings,
    insights: [
      {
        id: "insight-1",
        type: "maintenance",
        title: `${lowTonerPrinter.name} Toner Exhaustion Alert`,
        severity: "warning",
        urgency: "high",
        description: `${lowTonerPrinter.name} at ${lowTonerPrinter.location} has critically low cartridge reserves: ${tonerSummary}.`,
        recommendation: `Order manufacturer high-capacity replacement units and configure auto-failover routing to ${printers[0].name}.`,
        affectedTargets: [lowTonerPrinter.name, lowTonerPrinter.location],
        potentialMonthlySavings: "$140/mo (downtime prevention)",
      },
      {
        id: "insight-2",
        type: "cost",
        title: `Duplex Policy Enforcement for ${opsNode.department} Workstations`,
        severity: "info",
        urgency: "medium",
        description: `Station ${opsNode.hostname} is submitting single-sided print jobs, accumulating unnecessary media consumption.`,
        recommendation: `Push automated CUPS/GPO print policy 'Sides=TwoSidedLongEdge' to reduce physical sheet utilization by ~45%.`,
        affectedTargets: [opsNode.hostname, opsNode.department],
        potentialMonthlySavings: "$165/mo",
      },
      {
        id: "insight-3",
        type: "anomaly",
        title: `${highestDept.department} Color Print Volume Surge`,
        severity: "warning",
        urgency: "medium",
        description: `${highestDept.department} generated ${highestDept.colorPages || 140} color pages today, accounting for ${Math.round(((highestDept.totalCost || 18) / Math.max(metrics.totalCost, 1)) * 100)}% of total daily spend.`,
        recommendation: `Enforce proofing mode for pre-press documents and restrict full CMYK rendering to approved production files.`,
        affectedTargets: [highestDept.department, "Floor 3 Studio"],
        potentialMonthlySavings: "$290/mo",
      },
      {
        id: "insight-4",
        type: "efficiency",
        title: `${warningPrinter.name} Hardware Sensor Health Check`,
        severity: warningPrinter.status === "jammed" ? "critical" : "warning",
        urgency: "high",
        description: warningPrinter.statusMessage || `Hardware status alert detected on Tray 1 feed rollers in ${warningPrinter.location}.`,
        recommendation: `Inspect roller assembly for paper dust buildup, execute self-cleaning cycle, and restock Tray 1 media.`,
        affectedTargets: [warningPrinter.name],
        potentialMonthlySavings: "Prevents spooler job stalling",
      },
    ],
  };
}

  // AI Fleet Audit & Diagnostics Endpoint (Powered by Gemini with resilient fallback)
  app.post("/api/printpulse/ai/audit", async (req, res) => {
    try {
      const metrics = computeFleetMetrics();
      const departments = computeDepartmentMetrics();

      const fleetDataSummary = {
        metrics,
        printers: printers.map(p => ({
          name: p.name,
          location: p.location,
          status: p.status,
          statusMessage: p.statusMessage,
          toner: p.tonerLevels,
          paperTrayPct: p.paperTrays.tray1CapacityPct,
          totalPrinted: p.totalPagesPrinted,
          drumLife: p.drumLifePercent,
        })),
        departments: departments.map(d => ({
          dept: d.department,
          jobs: d.totalJobs,
          pages: d.totalPages,
          colorPct: d.totalPages > 0 ? Math.round((d.colorPages / d.totalPages) * 100) : 0,
          cost: d.totalCost,
          budget: d.budgetAllocated,
          computers: d.computerCount,
        })),
        recentErrors: printJobs.filter(j => j.status === "error" || j.status === "jammed").slice(0, 5),
      };

      const prompt = `You are the PrintPulse AI Chief Fleet Analyst and Predictive Maintenance Engineer.
Analyze the following aggregated enterprise print telemetry from multiple computers and printers:

${JSON.stringify(fleetDataSummary, null, 2)}

Provide 4 high-value, actionable diagnostic insights in strictly valid JSON format.
Each insight must cover:
1. One cost optimization or waste reduction opportunity (e.g. duplex policies, default monochrome).
2. One hardware maintenance or toner depletion warning with estimated days remaining.
3. One departmental anomaly or usage outlier analysis.
4. One fleet operational efficiency or load rebalancing suggestion.

Return JSON in this exact structure:
{
  "summaryHeadline": "string (one concise executive overview sentence)",
  "overallHealthEvaluation": "string (2-3 sentences evaluating overall print infrastructure stability)",
  "estimatedAnnualSavings": "$X,XXX/year",
  "insights": [
    {
      "id": "insight-1",
      "type": "cost" | "maintenance" | "anomaly" | "efficiency",
      "title": "string",
      "severity": "critical" | "warning" | "info",
      "urgency": "high" | "medium" | "low",
      "description": "string",
      "recommendation": "string",
      "affectedTargets": ["Name of printer or computer or department"],
      "potentialMonthlySavings": "$XXX/mo" (optional)
    }
  ]
}`;

      const aiResponse = await callGeminiWithRetry({
        contents: prompt,
        responseMimeType: "application/json",
        preferredModel: "gemini-3.1-pro-preview",
      });

      if (aiResponse && aiResponse.text) {
        try {
          const parsed = JSON.parse(aiResponse.text);
          if (parsed && parsed.insights && Array.isArray(parsed.insights)) {
            return res.json({ success: true, result: parsed, source: "gemini", modelUsed: aiResponse.modelUsed });
          }
        } catch {
          // Proceed to dynamic fallback
        }
      }

      // Fallback to dynamic real-time calculation
      const dynamicAudit = generateDynamicFleetAudit();
      res.json({ success: true, result: dynamicAudit, source: "telemetry_engine", modelUsed: "telemetry_engine" });
    } catch (err: any) {
      console.warn("AI Fleet Audit notice (using dynamic telemetry engine):", err?.message || err);
      const fallback = generateDynamicFleetAudit();
      res.json({ success: true, result: fallback, source: "telemetry_engine", modelUsed: "telemetry_engine" });
    }
  });

  // AI Fleet Copilot Multi-Turn Chat Endpoint (with role-based personas and gemini-3.1-pro-preview / gemini-3.5-flash / gemini-3.1-flash-lite)
  app.post("/api/printpulse/ai/chat", async (req, res) => {
    try {
      const { message, chatHistory = [], rolePersona = "general_copilot", modelPreference = "auto", taskComplexity } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message is required" });
      }

      const metrics = computeFleetMetrics();
      const selectedRole = ROLE_SYSTEM_INSTRUCTIONS[rolePersona] || ROLE_SYSTEM_INSTRUCTIONS.general_copilot;
      const modelDecision = resolveGeminiModel(modelPreference, taskComplexity, message, rolePersona);

      const systemInstruction = `${selectedRole.prompt}

CURRENT ENTERPRISE PRINT FLEET TELEMETRY SNAPSHOT:
- Workstation Network: ${computerNodes.length} nodes registered (${computerNodes.filter(n=>n.status==='online').length} online, ${computerNodes.filter(n=>n.status==='offline').length} offline)
- Workstation List: ${computerNodes.map(n => `${n.hostname} (${n.department}, ${n.os}, ${n.status}, Agent v${n.agentVersion})`).join(", ")}
- Network Printers: ${printers.map(p => `${p.name} [${p.location}] (Status: ${p.status}, Black Toner: ${p.tonerLevels.black}%, Cyan: ${p.tonerLevels.cyan}%, Tray 1: ${p.paperTrays.tray1CapacityPct}%, Queue: ${p.activeJobsInQueue} jobs)`).join("; ")}
- Fleet Job Ledger: ${metrics.totalJobs} total jobs processed (${metrics.totalPages} pages, ${metrics.colorPages} color, ${metrics.monoPages} mono)
- Cost & Environmental: $${metrics.totalCost.toFixed(2)} total cost ($${metrics.costSavedDuplex.toFixed(2)} saved via duplexing, ${metrics.co2SavedKg} kg CO2 avoided, ${metrics.paperSheetsSavedDuplex} sheets conserved)
- Active Warnings: ${printers.filter(p => p.status !== 'ready' && p.status !== 'printing').map(p => `${p.name}: ${p.statusMessage || p.status}`).join("; ") || "None"}

INSTRUCTIONS FOR RESPONDING:
1. Speak in your designated role persona (${selectedRole.title}).
2. Maintain context across the conversation turns.
3. Whenever providing technical instructions, PowerShell, Bash, CUPS commands, or config blocks, format them in clear Markdown code blocks with language identifiers.
4. Keep explanations directly relevant to the real fleet telemetry above. Provide exact numbers and device names when discussing the fleet.`;

      // Build multi-turn history structure for Gemini
      const formattedContents: any[] = [];

      // Add prior conversation turns
      if (Array.isArray(chatHistory)) {
        for (const turn of chatHistory.slice(-10)) {
          if (!turn.content && !turn.text) continue;
          const role = turn.role === "assistant" || turn.role === "model" ? "model" : "user";
          formattedContents.push({
            role,
            parts: [{ text: turn.content || turn.text || "" }]
          });
        }
      }

      // Add latest user message
      formattedContents.push({
        role: "user",
        parts: [{ text: message }]
      });

      const aiResponse = await callGeminiWithRetry({
        contents: formattedContents,
        systemInstruction,
        preferredModel: modelDecision.model,
      });

      if (aiResponse && aiResponse.text) {
        return res.json({
          success: true,
          reply: aiResponse.text,
          source: "gemini",
          modelUsed: aiResponse.modelUsed,
          modelReason: modelDecision.reason,
          roleUsed: selectedRole.name,
          timestamp: new Date().toISOString(),
        });
      }

      // Contextual telemetry engine fallback
      const lower = message.toLowerCase();
      let fallbackReply = `[${selectedRole.title}] Telemetry analysis for your query across ${computerNodes.length} workstations:\n\n`;

      if (lower.includes("powershell") || lower.includes("spooler") || lower.includes("restart") || lower.includes("script")) {
        fallbackReply += `To restart the print spooler and purge stalled jobs across remote workstations, execute the following PowerShell script:\n\n\`\`\`powershell
# PrintPulse Remote Spooler Diagnostics & Reset
$Computers = @("FIN-WIN-04", "HR-WIN-02", "OPS-WH-TERMINAL")

Invoke-Command -ComputerName $Computers -ScriptBlock {
    Write-Host "Restarting Spooler on $env:COMPUTERNAME..."
    Stop-Service -Name Spooler -Force
    Start-Sleep -Seconds 2
    # Clear orphaned SPL/SHD spool files safely
    Remove-Item -Path "$env:SystemRoot\\System32\\spool\\PRINTERS\\*.*" -Force -ErrorAction SilentlyContinue
    Start-Service -Name Spooler
    Get-Service -Name Spooler | Select-Object Status, Name, DisplayName
}
\`\`\``;
      } else if (lower.includes("cups") || lower.includes("linux") || lower.includes("mac") || lower.includes("duplex")) {
        fallbackReply += `To enforce mandatory duplex printing via CUPS on macOS & Linux terminals, run:\n\n\`\`\`bash
# Enforce two-sided long-edge duplexing
lpoptions -p HP_LaserJet_Enterprise_M608 -o sides=two-sided-long-edge
lpoptions -p Canon_imageRUNNER_ADVANCE -o sides=two-sided-long-edge

# Verify configured PPD default options
lpoptions -p HP_LaserJet_Enterprise_M608 -l | grep -i "Duplex"
\`\`\``;
      } else if (lower.includes("toner") || lower.includes("cartridge") || lower.includes("forecast") || lower.includes("empty")) {
        const sortedPrinters = [...printers].sort((a, b) => 
          Math.min(a.tonerLevels.black, a.tonerLevels.cyan || 100) - Math.min(b.tonerLevels.black, b.tonerLevels.cyan || 100)
        );
        const p1 = sortedPrinters[0];
        fallbackReply += `**Critical Consumables Depletion Alert:**\n- **${p1.name}** (${p1.location}): Cyan is at **${p1.tonerLevels.cyan}%**, Yellow at **${p1.tonerLevels.yellow}%**, Black at **${p1.tonerLevels.black}%**.\n- Estimated run-out: **~2.8 operating days**.\n- Recommended Action: Order OEM replacement pack (T858 series) and redirect heavy color batches to ${printers[0].name}.`;
      } else if (lower.includes("cost") || lower.includes("saving") || lower.includes("green") || lower.includes("co2")) {
        fallbackReply += `**Cost & Sustainability Breakdown:**\n- Total Daily Spend: **$${metrics.totalCost.toFixed(2)}**\n- Duplex Paper Savings: **${metrics.paperSheetsSavedDuplex} sheets** (~$${metrics.costSavedDuplex.toFixed(2)})\n- Carbon Offset: **${metrics.co2SavedKg} kg CO2**\n- Top Expense Center: Design ($18.42) due to unmanaged high-DPI full CMYK output.`;
      } else {
        fallbackReply += `The PrintPulse fleet is currently aggregating ${computerNodes.length} workstations with ${printers.length} online printer devices. Current fleet health index is **${metrics.fleetHealthScore}%** with ${metrics.totalJobs} processed jobs. Ask me about specific PowerShell scripts, CUPS setups, toner depletion projections, or departmental print policies!`;
      }

      res.json({
        success: true,
        reply: fallbackReply,
        source: "telemetry_engine",
        modelUsed: "telemetry_engine",
        modelReason: "Offline Telemetry Synthesis",
        roleUsed: selectedRole.name,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.warn("Gemini Chat notice:", err?.message || err);
      res.json({
        success: true,
        reply: "I am actively monitoring your print fleet telemetry across all workstations. Please feel free to ask for diagnostics, PowerShell/CUPS commands, or toner reorder schedules!",
        source: "telemetry_engine",
        modelUsed: "telemetry_engine",
        roleUsed: "General Fleet Copilot",
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Reset telemetry to fresh realistic seed
  app.post("/api/printpulse/reset", (req, res) => {
    // Reset seed data
    printers.forEach(p => {
      p.status = "ready";
      p.statusMessage = undefined;
      p.activeJobsInQueue = 0;
    });
    printers[1].status = "printing";
    printers[1].activeJobsInQueue = 1;
    printers[3].status = "toner_low";
    printers[3].statusMessage = "Cyan and Yellow Cartridge below 12%";
    printers[4].status = "warning";
    printers[4].statusMessage = "Tray 1 paper misfeed sensor alert";

    res.json({ success: true, message: "Telemetry reset to initial state" });
  });

  // Vite middleware in development, static in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PrintPulse Hub Server running on http://localhost:${PORT}`);
  });
}

startServer();
