"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { FileDown, Search, Download, Loader2, ArrowRight } from "lucide-react";
import Papa from "papaparse";
import jsPDF from "jspdf";
import { formatINR } from "@/lib/utils";

type ReportCard = {
  id: string;
  project_name: string;
  client_name: string | null;
  card_value: number | null;
  label: string | null;
  source: string | null;
  product: string | null;
  created_at: string;
  board: { name: string };
  list: { title: string };
};

export default function ReportsPage() {
  const [cards, setCards] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<"csv" | "pdf" | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [label, setLabel] = useState("");
  const [source, setSource] = useState("");

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (label) params.append("label", label);
      if (source) params.append("source", source);

      const res = await fetch(`/api/reports?${params.toString()}`);
      const data = await res.json();
      setCards(data.data ?? []);
    } catch {
      toast({ title: "Failed to generate report", variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleExportCSV = () => {
    setDownloading("csv");
    try {
      const csvData = cards.map((c) => ({
        Board: c.board.name,
        List: c.list.title,
        "Project Name": c.project_name,
        "Client Name": c.client_name ?? "—",
        Value: c.card_value ? Number(c.card_value) : 0,
        Priority: c.label ?? "—",
        Source: c.source ?? "—",
        Product: c.product ?? "—",
        Created: new Date(c.created_at).toLocaleDateString(),
      }));

      const csvString = Papa.unparse(csvData);
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", `proteus-report-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "CSV downloaded successfully", variant: "success" });
    } catch {
      toast({ title: "Export to CSV failed", variant: "destructive" });
    }
    setDownloading(null);
  };

  const handleExportPDF = () => {
    setDownloading("pdf");
    try {
      const doc = new jsPDF();
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(18);
      doc.text("pluto. - Leads and Projects Report", 14, 20);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
      doc.text(`Total Records: ${cards.length}`, 14, 34);

      let yOffset = 45;
      doc.setFont("Helvetica", "bold");
      doc.text("Project Name", 14, yOffset);
      doc.text("Client", 80, yOffset);
      doc.text("Priority", 130, yOffset);
      doc.text("Pipeline Value", 160, yOffset);

      doc.line(14, yOffset + 2, 195, yOffset + 2);
      yOffset += 8;

      doc.setFont("Helvetica", "normal");
      cards.forEach((c) => {
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

      doc.save(`proteus-report-${Date.now()}.pdf`);
      toast({ title: "PDF downloaded successfully", variant: "success" });
    } catch {
      toast({ title: "Export to PDF failed", variant: "destructive" });
    }
    setDownloading(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-500 mt-1">Export filtered lists of CRM lead deals as CSV sheets or PDF files</p>
        </div>

        {/* Action downloads */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={loading || downloading !== null || cards.length === 0}
            loading={downloading === "csv"}
          >
            <FileDown className="w-4 h-4 mr-2" />
            CSV Export
          </Button>
          <Button
            onClick={handleExportPDF}
            disabled={loading || downloading !== null || cards.length === 0}
            loading={downloading === "pdf"}
          >
            <Download className="w-4 h-4 mr-2" />
            PDF Export
          </Button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <Label className="text-xs text-slate-500 mb-1">Search Project/Client</Label>
          <div className="relative">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type to search..."
              className="pl-9"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        <div>
          <Label className="text-xs text-slate-500 mb-1">Priority (Label)</Label>
          <select
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All Priorities</option>
            {["Hot", "Warm", "Cold"].map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        <div>
          <Label className="text-xs text-slate-500 mb-1">Source</Label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All Sources</option>
            {["Meta", "IVR", "Google", "Website", "Referral", "Other", "Outbound"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <Button onClick={fetchReport} className="w-full">
          Generate Report
        </Button>
      </div>

      {/* Report results list */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : cards.length === 0 ? (
          <p className="text-center py-20 text-slate-400 italic">No records match the filter selections</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-3.5">Board / List</th>
                  <th className="px-6 py-3.5">Project Name</th>
                  <th className="px-6 py-3.5">Client</th>
                  <th className="px-6 py-3.5">Priority</th>
                  <th className="px-6 py-3.5">Source</th>
                  <th className="px-6 py-3.5 text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {cards.map((card) => (
                  <tr key={card.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-slate-900">{card.board.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{card.list.title}</p>
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-900">{card.project_name}</td>
                    <td className="px-6 py-3.5">{card.client_name ?? "—"}</td>
                    <td className="px-6 py-3.5">
                      {card.label ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          card.label === "Hot" ? "bg-red-50 text-red-700" :
                          card.label === "Warm" ? "bg-orange-50 text-orange-700" : "bg-blue-50 text-blue-700"
                        }`}>
                          {card.label}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-6 py-3.5">{card.source ?? "—"}</td>
                    <td className="px-6 py-3.5 text-right font-bold text-slate-900">
                      {card.card_value ? formatINR(Number(card.card_value)) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
