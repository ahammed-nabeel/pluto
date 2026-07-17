"use client";

import { useState } from "react";
import { BoardView } from "./BoardView";
import {
  LayoutDashboard, TrendingUp, AlertCircle, Users, Activity, Target,
  FileDown, Search, Download, Loader2, Calendar, ClipboardList, BarChart4,
  Settings, Columns, FileSpreadsheet
} from "lucide-react";
import { formatINR, cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import Papa from "papaparse";
import jsPDF from "jspdf";
import type { CardPreview } from "@/types";

type CardData = CardPreview & {
  product: string | null;
  created_at: string;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    due_date: string | null;
    priority: string;
  }>;
};

type ListData = {
  id: string;
  title: string;
  position: number;
  cards: CardData[];
};

type BoardViewWrapperProps = {
  board: {
    id: string;
    name: string;
    description: string | null;
    lists: ListData[];
    activityLogs: Array<{
      id: string;
      action: string;
      timestamp: string;
      performer: { name: string | null } | null;
    }>;
  };
  canManageLists: boolean;
  canCreateCard: boolean;
  currentUserId: string;
};

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

export function BoardViewWrapper({
  board,
  canManageLists,
  canCreateCard,
  currentUserId,
}: BoardViewWrapperProps) {
  const [activeTab, setActiveTab] = useState<"board" | "dashboard" | "reports">("board");

  // Flatten all cards for analytics
  const allCards: CardData[] = board.lists.flatMap((l) => l.cards);

  // Flatten all tasks
  const allTasks = allCards.flatMap((c) => c.tasks);
  const openTasks = allTasks.filter((t) => t.status !== "completed");
  const overdueTasksCount = openTasks.filter((t) => {
    if (!t.due_date) return false;
    return new Date(t.due_date) < new Date();
  }).length;

  // Pipeline by List calculation
  const cardsByList = board.lists.map((l) => {
    const listCards = l.cards;
    const value = listCards.reduce((acc, c) => acc + (c.card_value ? Number(c.card_value) : 0), 0);
    return {
      listId: l.id,
      listTitle: l.title,
      count: listCards.length,
      value,
    };
  });

  // Leads by Source calculation
  const sourceMap: Record<string, number> = {};
  allCards.forEach((c) => {
    const src = c.source || "Unknown";
    sourceMap[src] = (sourceMap[src] || 0) + 1;
  });
  const cardsBySource = Object.entries(sourceMap).map(([source, count]) => ({
    source,
    count,
  }));

  // Lead status priorities
  const labelMap: Record<string, number> = {};
  allCards.forEach((c) => {
    const lbl = c.label || "No Label";
    labelMap[lbl] = (labelMap[lbl] || 0) + 1;
  });
  const cardsByLabel = Object.entries(labelMap).map(([label, count]) => ({
    label,
    count,
  }));

  // Report Section Filters
  const [search, setSearch] = useState("");
  const [labelFilter, setLabelFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filteredReportCards = allCards.filter((c) => {
    const matchesSearch =
      c.project_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.client_name && c.client_name.toLowerCase().includes(search.toLowerCase()));
    const matchesLabel = labelFilter === "" || c.label === labelFilter;
    const matchesSource = sourceFilter === "" || c.source === sourceFilter;

    let matchesDate = true;
    if (startDate) {
      const sDate = new Date(startDate);
      sDate.setHours(0, 0, 0, 0);
      matchesDate = matchesDate && new Date(c.created_at) >= sDate;
    }
    if (endDate) {
      const eDate = new Date(endDate);
      eDate.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(c.created_at) <= eDate;
    }

    return matchesSearch && matchesLabel && matchesSource && matchesDate;
  });

  const handleExportCSV = () => {
    try {
      const csvData = filteredReportCards.map((c) => {
        const listName = board.lists.find((l) => l.id === c.list_id)?.title || "Unknown";
        return {
          Board: board.name,
          List: listName,
          "Project Name": c.project_name,
          "Client Name": c.client_name ?? "—",
          Value: c.card_value ? Number(c.card_value) : 0,
          Priority: c.label ?? "—",
          Source: c.source ?? "—",
          Product: c.product ?? "—",
          Created: new Date(c.created_at).toLocaleDateString(),
        };
      });

      const csvString = Papa.unparse(csvData);
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", `report-${board.name.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "CSV downloaded successfully", variant: "success" });
    } catch {
      toast({ title: "Export to CSV failed", variant: "destructive" });
    }
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(18);
      doc.text(`${board.name} - Reports`, 14, 20);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
      doc.text(`Total Records: ${filteredReportCards.length}`, 14, 34);

      let yOffset = 45;
      doc.setFont("Helvetica", "bold");
      doc.text("Project Name", 14, yOffset);
      doc.text("Client", 80, yOffset);
      doc.text("Priority", 130, yOffset);
      doc.text("Pipeline Value", 160, yOffset);

      doc.line(14, yOffset + 2, 195, yOffset + 2);
      yOffset += 8;

      doc.setFont("Helvetica", "normal");
      filteredReportCards.forEach((c) => {
        if (yOffset > 275) {
          doc.addPage();
          yOffset = 20;
        }
        doc.text(c.project_name.substring(0, 30), 14, yOffset);
        doc.text(c.client_name?.substring(0, 20) ?? "—", 80, yOffset);
        doc.text(c.label ?? "—", 130, yOffset);
        doc.text(c.card_value ? `Rs. ${Number(c.card_value).toLocaleString("en-IN")}` : "—", 160, yOffset);
        yOffset += 8;
      });

      doc.save(`report-${board.name.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.pdf`);
      toast({ title: "PDF downloaded successfully", variant: "success" });
    } catch {
      toast({ title: "Export to PDF failed", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sub Header Tabs Row */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex-shrink-0">
        <div className="flex gap-2">
          <Button
            variant={activeTab === "board" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("board")}
            className={cn("rounded-lg text-xs font-semibold", activeTab === "board" && "bg-white shadow-sm border border-slate-200")}
          >
            <Columns className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
            Board View
          </Button>
          <Button
            variant={activeTab === "dashboard" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("dashboard")}
            className={cn("rounded-lg text-xs font-semibold", activeTab === "dashboard" && "bg-white shadow-sm border border-slate-200")}
          >
            <LayoutDashboard className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            Dashboard
          </Button>
          <Button
            variant={activeTab === "reports" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("reports")}
            className={cn("rounded-lg text-xs font-semibold", activeTab === "reports" && "bg-white shadow-sm border border-slate-200")}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
            Reports
          </Button>
        </div>
      </div>

      {/* Main tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "board" && (
          <div className="h-full overflow-hidden">
            <BoardView
              boardId={board.id}
              initialLists={board.lists}
              canManageLists={canManageLists}
              canCreateCard={canCreateCard}
              currentUserId={currentUserId}
            />
          </div>
        )}

        {activeTab === "dashboard" && (
          <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* KPI metrics cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {/* Total Leads */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Leads / Projects</p>
                  <p className="text-3xl font-extrabold text-slate-900 mt-1.5">{allCards.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6" />
                </div>
              </div>

              {/* Total Pipeline Value */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pipeline Value</p>
                  <p className="text-3xl font-extrabold text-emerald-600 mt-1.5">
                    {formatINR(allCards.reduce((acc, c) => acc + (c.card_value ? Number(c.card_value) : 0), 0))}
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>

              {/* Open Tasks */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Open Tasks</p>
                  <p className="text-3xl font-extrabold text-amber-600 mt-1.5">{openTasks.length}</p>
                </div>
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                  <ClipboardList className="w-6 h-6" />
                </div>
              </div>

              {/* Overdue Tasks */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Overdue Tasks</p>
                  <p className="text-3xl font-extrabold text-rose-600 mt-1.5">{overdueTasksCount}</p>
                </div>
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pipeline by list */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm lg:col-span-2">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Pipeline Value by Stage List</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cardsByList}>
                      <XAxis dataKey="listTitle" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: "#f8fafc" }} />
                      <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Leads by source */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Leads by Source</h3>
                <div className="h-56 flex-1 relative">
                  {cardsBySource.length === 0 ? (
                    <p className="text-slate-400 text-xs italic text-center pt-20">No source data set</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={cardsBySource}
                          dataKey="count"
                          nameKey="source"
                          cx="50%"
                          cy="50%"
                          outerRadius={65}
                          label={({ name }) => name}
                        >
                          {cardsBySource.map((_, i) => (
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

            {/* Logs activity and labels distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent activity stream */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm lg:col-span-2">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  Recent Board Activities
                </h3>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {board.activityLogs.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No activity logs recorded yet</p>
                  ) : (
                    board.activityLogs.map((log) => (
                      <div key={log.id} className="flex gap-3 text-xs items-start py-1 border-b border-slate-50 last:border-0 pb-2">
                        <span className="font-bold text-slate-800">{log.performer?.name || "System"}</span>
                        <span className="text-slate-600 flex-1">{log.action}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Status breakdown */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Lead Status breakdown</h3>
                <div className="space-y-4">
                  {cardsByLabel.map((l) => (
                    <div key={l.label} className="flex items-center justify-between">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        l.label === "Hot" ? "bg-red-50 text-red-600" :
                        l.label === "Warm" ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"
                      }`}>
                        {l.label}
                      </span>
                      <span className="text-xs text-slate-500 font-bold">{l.count} leads</span>
                    </div>
                  ))}
                  {cardsByLabel.length === 0 && (
                    <p className="text-slate-400 text-xs italic">No leads with priority labels</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "reports" && (
          <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
            {/* Export buttons header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">Export Board Reports</h3>
                <p className="text-xs text-slate-400 mt-0.5">Filter leads and export sheets instantly.</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  disabled={filteredReportCards.length === 0}
                >
                  <FileDown className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                  CSV Export
                </Button>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleExportPDF}
                  disabled={filteredReportCards.length === 0}
                >
                  <Download className="w-3.5 h-3.5 mr-1.5 text-white" />
                  PDF Export
                </Button>
              </div>
            </div>
            {/* Filters panel */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 mb-1 block uppercase">Search Project/Client</label>
                <div className="relative">
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name..."
                    className="pl-9 text-xs h-9"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-450 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 mb-1 block uppercase">Priority Label</label>
                <select
                  value={labelFilter}
                  onChange={(e) => setLabelFilter(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">All Priorities</option>
                  {["Hot", "Warm", "Cold"].map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 mb-1 block uppercase">Source</label>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">All Sources</option>
                  {["Meta", "IVR", "Google", "Website", "Referral", "Other", "Outbound"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Start Date filter */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 mb-1 block uppercase">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              {/* End Date filter */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 mb-1 block uppercase">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            </div>

            {/* Results table grouped by list stage sections */}
            <div className="space-y-8">
              {filteredReportCards.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                  <p className="text-slate-450 text-xs italic">No cards match the report filters</p>
                </div>
              ) : (
                board.lists.map((list) => {
                  const listCards = filteredReportCards.filter((c) => c.list_id === list.id);
                  if (listCards.length === 0) return null;

                  return (
                    <div key={list.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                      {/* Section Header */}
                      <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Stage: {list.title}
                        </h4>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">
                          {listCards.length} records
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-55/30 border-b border-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                              <th className="px-6 py-3">Creation Date</th>
                              <th className="px-6 py-3">Client Name</th>
                              <th className="px-6 py-3">Project Name</th>
                              <th className="px-6 py-3">Priority</th>
                              <th className="px-6 py-3">Product</th>
                              <th className="px-6 py-3">Source</th>
                              <th className="px-6 py-3 text-right">Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                            {listCards.map((card) => (
                              <tr key={card.id} className="hover:bg-slate-50/30 transition-colors">
                                <td className="px-6 py-3.5 text-slate-400">
                                  {new Date(card.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-3.5 font-semibold text-slate-900">
                                  {card.client_name ?? "—"}
                                </td>
                                <td className="px-6 py-3.5 font-medium text-slate-800">
                                  {card.project_name}
                                </td>
                                <td className="px-6 py-3.5">
                                  {card.label ? (
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                                      card.label === "Hot" ? "bg-red-50 text-red-700" :
                                      card.label === "Warm" ? "bg-orange-50 text-orange-700" : "bg-blue-50 text-blue-700"
                                    }`}>
                                      {card.label}
                                    </span>
                                  ) : "—"}
                                </td>
                                <td className="px-6 py-3.5 text-slate-600">{card.product ?? "—"}</td>
                                <td className="px-6 py-3.5 text-slate-600">{card.source ?? "—"}</td>
                                <td className="px-6 py-3.5 text-right font-extrabold text-slate-900">
                                  {card.card_value ? formatINR(Number(card.card_value)) : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
