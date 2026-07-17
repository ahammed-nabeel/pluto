"use client";

import * as React from "react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";

// ── Toast types ───────────────────────────────────────

export type ToastVariant = "default" | "success" | "destructive" | "warning";

interface ToastMessage {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

// ── Toaster component ─────────────────────────────────

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur animate-fade-in",
            {
              "bg-white border-slate-200": !t.variant || t.variant === "default",
              "bg-emerald-50 border-emerald-200": t.variant === "success",
              "bg-red-50 border-red-200": t.variant === "destructive",
              "bg-amber-50 border-amber-200": t.variant === "warning",
            }
          )}
        >
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            {t.variant === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            {t.variant === "destructive" && <AlertCircle className="w-5 h-5 text-red-600" />}
            {t.variant === "warning" && <AlertTriangle className="w-5 h-5 text-amber-600" />}
            {(!t.variant || t.variant === "default") && <Info className="w-5 h-5 text-blue-600" />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {t.title && <p className="text-sm font-semibold text-slate-900">{t.title}</p>}
            {t.description && <p className="text-sm text-slate-600 mt-0.5">{t.description}</p>}
          </div>

          {/* Dismiss */}
          <button
            onClick={() => dismiss(t.id)}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
