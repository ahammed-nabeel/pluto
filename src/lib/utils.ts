import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

// ── Tailwind class merger ─────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Currency formatting (INR) ─────────────────────────
export function formatINR(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

// ── Date formatting ───────────────────────────────────
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "dd MMM yyyy");
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "dd MMM yyyy, h:mm a");
}

export function formatRelative(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

// ── Label colors ──────────────────────────────────────
export const LABEL_COLORS = {
  Hot: {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
    hex: "#ef4444",
  },
  Warm: {
    bg: "bg-orange-100",
    text: "text-orange-700",
    border: "border-orange-200",
    dot: "bg-orange-500",
    hex: "#f97316",
  },
  Cold: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
    hex: "#3b82f6",
  },
} as const;

// ── Status colors ─────────────────────────────────────
export const STATUS_COLORS = {
  pending: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  in_progress: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  completed: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  overdue: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
} as const;

// ── Priority colors ───────────────────────────────────
export const PRIORITY_COLORS = {
  low: { bg: "bg-slate-100", text: "text-slate-600" },
  medium: { bg: "bg-yellow-100", text: "text-yellow-700" },
  high: { bg: "bg-red-100", text: "text-red-700" },
} as const;

// ── Source colors for charts ──────────────────────────
export const SOURCE_CHART_COLORS = {
  Meta: "#1877f2",
  Google: "#34a853",
  IVR: "#8b5cf6",
  Website: "#06b6d4",
  Referral: "#f59e0b",
  Other: "#6b7280",
  Outbound: "#ec4899",
} as const;

// ── File type detection ───────────────────────────────
export function detectFileType(mimeType: string): "image" | "video" | "document" | "camera_capture" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "document";
}

// ── WhatsApp link ─────────────────────────────────────
export function getWhatsAppLink(phone: string, message?: string): string {
  const clean = phone.replace(/\D/g, "");
  const msg = message ? encodeURIComponent(message) : "";
  return `https://wa.me/${clean}${msg ? `?text=${msg}` : ""}`;
}

// ── Google Maps link ──────────────────────────────────
export function getGoogleMapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

// ── Initials from name ────────────────────────────────
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ── Midpoint position for DnD ─────────────────────────
export function getMidpoint(before: number | null, after: number | null): number {
  if (before === null && after === null) return 1000;
  if (before === null) return after! / 2;
  if (after === null) return before + 1000;
  return (before + after) / 2;
}

// ── Truncate text ─────────────────────────────────────
export function truncate(str: string, length = 80): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "…";
}

// ── File size formatting ──────────────────────────────
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

// ── Slug generator ────────────────────────────────────
export function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
