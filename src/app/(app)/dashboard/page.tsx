"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard, Loader2, ArrowUpRight, TrendingUp,
  AlertCircle, Users, Activity, Target,
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";

type DashboardData = {
  totalCards: number;
  totalCardValue: number;
  cardsByList: { listId: string; listTitle: string; count: number; value: number }[];
  cardsByLabel: { label: string; count: number; value: number }[];
  cardsBySource: { source: string; count: number }[];
  tasksByStatus: { status: string; count: number }[];
  tasksByUser: { userId: string; userName: string; count: number }[];
  overdueTasksCount: number;
  recentActivity: any[];
};

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => setData(d.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-500">
        Could not load dashboard metrics
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1 text-sm md:text-base">Live analytics, deal progression, and sales operations performance metrics</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cards */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total Leads/Projects</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">{data.totalCards}</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
        </div>

        {/* Total pipeline value */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Pipeline Value</p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-2">{formatINR(data.totalCardValue)}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Tasks pending */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Open Tasks</p>
            <p className="text-3xl font-extrabold text-amber-600 mt-2">
              {data.tasksByStatus.find((t) => t.status !== "completed")?.count ?? 0}
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Overdue tasks count */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Overdue Tasks</p>
            <p className="text-3xl font-extrabold text-red-600 mt-2">{data.overdueTasksCount}</p>
          </div>
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deal progression by list */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-sm lg:col-span-2 min-w-0">
          <h2 className="text-base font-bold text-slate-900 mb-4">Pipeline by List</h2>
          <div className="h-72 md:h-80 w-full overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.cardsByList}>
                <XAxis dataKey="listTitle" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "#f1f5f9" }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leads by source */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <h2 className="text-base font-bold text-slate-900 mb-4">Leads by Source</h2>
          <div className="h-60 flex-1 relative">
            {data.cardsBySource.length === 0 ? (
              <p className="text-slate-400 text-sm italic text-center pt-20">No source data available</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.cardsBySource}
                    dataKey="count"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={({ name }) => name}
                  >
                    {data.cardsBySource.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Activity stream & list preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity timeline */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm lg:col-span-2">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Recent Activity
          </h2>
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
            {data.recentActivity.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No activity logs recorded yet</p>
            ) : (
              data.recentActivity.map((log) => (
                <div key={log.id} className="flex gap-3 text-sm items-start py-1">
                  <span className="font-semibold text-slate-800">{log.performer?.name}</span>
                  <span className="text-slate-600 flex-1">{log.action}</span>
                  <span className="text-xs text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Lead Labels Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4">Lead Status Priority</h2>
          <div className="space-y-4">
            {data.cardsByLabel.map((l) => (
              <div key={l.label} className="flex items-center justify-between">
                <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                  l.label === "Hot" ? "bg-red-50 text-red-600" :
                  l.label === "Warm" ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"
                }`}>
                  {l.label}
                </span>
                <span className="text-sm text-slate-500 font-semibold">{l.count} leads</span>
              </div>
            ))}
            {data.cardsByLabel.length === 0 && (
              <p className="text-slate-400 text-sm italic">No lead priorities set yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
