import { Loader2 } from "lucide-react";

export default function BoardLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] w-full bg-slate-50">
      {/* Skeleton Sub Header */}
      <div className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 flex-shrink-0 animate-pulse">
        <div className="flex gap-2">
          <div className="h-8 w-28 bg-slate-200 rounded-lg" />
          <div className="h-8 w-24 bg-slate-200 rounded-lg" />
          <div className="h-8 w-24 bg-slate-200 rounded-lg" />
        </div>
        <div className="h-8 w-32 bg-slate-200 rounded-lg" />
      </div>

      {/* Skeleton Columns */}
      <div className="flex-1 p-6 overflow-x-auto flex gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="w-72 flex-shrink-0 flex flex-col gap-4 animate-pulse">
            {/* Column Header */}
            <div className="flex justify-between items-center bg-slate-100 p-3 rounded-xl">
              <div className="h-4 w-32 bg-slate-200 rounded" />
              <div className="h-4 w-6 bg-slate-200 rounded" />
            </div>
            {/* Column Cards */}
            {[1, 2, 3].map((j) => (
              <div key={j} className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 shadow-sm">
                <div className="h-4 w-3/4 bg-slate-100 rounded" />
                <div className="h-3 w-1/2 bg-slate-200 rounded" />
                <div className="flex justify-between items-center pt-2">
                  <div className="h-5 w-16 bg-slate-100 rounded-full" />
                  <div className="h-6 w-6 bg-slate-200 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
