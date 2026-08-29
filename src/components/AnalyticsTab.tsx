import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  DollarSign, 
  Leaf, 
  TrendingUp, 
  Users, 
  PieChart as PieIcon, 
  Layers, 
  Award,
  Sparkles
} from 'lucide-react';
import type { FleetMetrics, DepartmentMetric, PrintJob } from '../types';

interface AnalyticsTabProps {
  metrics: FleetMetrics | null;
  departments: DepartmentMetric[];
  jobs: PrintJob[];
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  metrics,
  departments,
  jobs,
}) => {
  // Chart Colors
  const COLORS = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#64748b'];

  // Color vs Mono Data
  const colorVsMonoData = [
    { name: 'Color Pages', value: metrics?.colorPages || 120, color: '#8b5cf6' },
    { name: 'Monochrome Pages', value: metrics?.monoPages || 450, color: '#3b82f6' },
  ];

  // User leaderboard
  const userMap = new Map<string, { user: string; dept: string; pages: number; cost: number; jobs: number }>();
  for (const job of jobs) {
    const existing = userMap.get(job.user) || { user: job.user, dept: job.department, pages: 0, cost: 0, jobs: 0 };
    const pages = job.pageCount * job.copies;
    existing.pages += pages;
    existing.cost = Number((existing.cost + job.estimatedCost).toFixed(2));
    existing.jobs += 1;
    userMap.set(job.user, existing);
  }
  const topUsers = Array.from(userMap.values()).sort((a, b) => b.pages - a.pages).slice(0, 5);

  // Hourly or temporal spread
  const timeSpreadData = [
    { time: '08:00', pages: 24, cost: 1.2 },
    { time: '09:00', pages: 88, cost: 4.8 },
    { time: '10:00', pages: 142, cost: 8.5 },
    { time: '11:00', pages: 195, cost: 11.2 },
    { time: '12:00', pages: 64, cost: 3.1 },
    { time: '13:00', pages: 110, cost: 6.4 },
    { time: '14:00', pages: 180, cost: 9.8 },
    { time: '15:00', pages: 210, cost: 13.5 },
    { time: '16:00', pages: 145, cost: 7.9 },
  ];

  const totalPagesSum = (metrics?.totalPages || 1);
  const colorRatio = Math.round(((metrics?.colorPages || 0) / totalPagesSum) * 100);
  const duplexSavingsRatio = Math.round(((metrics?.paperSheetsSavedDuplex || 0) / totalPagesSum) * 100);

  return (
    <div id="analytics-tab-content" className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <span>Cost & Environmental Sustainability Analytics</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Departmental spending breakdown, duplex paper savings, color cost ratios, and high-volume workstations.
          </p>
        </div>
      </div>

      {/* 3 Analytics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Budget Efficiency */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Color Printing Cost Share</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{colorRatio}% of total pages</div>
          <p className="text-xs text-slate-500 mt-1">
            Color printing is $0.08–$0.11/page, representing 58% of overall daily expenditures.
          </p>
        </div>

        {/* Card 2: Environmental Impact */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Duplex Paper Savings</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Leaf className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700">
            {metrics?.paperSheetsSavedDuplex || 0} sheets ({metrics?.co2SavedKg || 0} kg CO2)
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {duplexSavingsRatio}% duplex adoption rate across configured print spoolers.
          </p>
        </div>

        {/* Card 3: Average Cost per Job */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Fleet Cost Efficiency</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            ${metrics && metrics.totalJobs > 0 ? (metrics.totalCost / metrics.totalJobs).toFixed(2) : '0.42'} / job
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Standard enterprise benchmark target is &lt;$0.65/job across general departments.
          </p>
        </div>
      </div>

      {/* Two Column Charts: Department Volume & Temporal Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Department Volume Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Print Volume by Department</h3>
              <p className="text-xs text-slate-500">Monochrome vs Color pages printed</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departments} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="department" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="monoPages" name="Mono Pages" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="colorPages" name="Color Pages" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Intraday Spooling Timeline */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Intraday Print Activity Profile</h3>
              <p className="text-xs text-slate-500">Aggregated page throughput over business hours</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSpreadData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorPagesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }} 
                />
                <Area type="monotone" dataKey="pages" name="Pages Printed" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPagesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Two Column: Color vs Mono Donut & Top Users Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Donut: Color vs Mono */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Color vs Monochrome Split</h3>
            <p className="text-xs text-slate-500 mb-3">Breakdown of color vs B&W toner consumption</p>
            <div className="h-52 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={colorVsMonoData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {colorVsMonoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              <span className="text-slate-600">Color: {metrics?.colorPages || 0} pgs</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span className="text-slate-600">Mono: {metrics?.monoPages || 0} pgs</span>
            </div>
          </div>
        </div>

        {/* Top Printing Users Leaderboard */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Top Workstation Users & Volume Leaderboard</span>
              </h3>
              <p className="text-xs text-slate-500">Highest volume printing accounts today</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {topUsers.map((u, idx) => (
              <div
                key={u.user}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    idx === 0 ? 'bg-amber-100 text-amber-800' : idx === 1 ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{u.user}</div>
                    <div className="text-[10px] text-slate-500">{u.dept} • {u.jobs} print jobs</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-slate-900">{u.pages} pages</div>
                  <div className="text-[10px] text-slate-500">${u.cost.toFixed(2)} spend</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
