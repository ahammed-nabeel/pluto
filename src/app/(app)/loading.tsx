import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] w-full gap-3 bg-slate-50/50">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      <p className="text-sm font-semibold text-slate-500 animate-pulse">Loading workspace...</p>
    </div>
  );
}
