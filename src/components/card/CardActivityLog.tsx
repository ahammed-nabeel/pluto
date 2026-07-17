"use client";

import { formatDateTime } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Activity } from "lucide-react";
import type { CardDetail } from "@/types";

export function CardActivityLog({ card }: { card: CardDetail }) {
  const logs = card.activityLogs ?? [];

  return (
    <div className="px-6 py-5">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
        Activity{" "}
        {logs.length > 0 && <span className="text-slate-400 font-normal">({logs.length})</span>}
      </h3>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-slate-400">
          <Activity className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm">No activity yet</p>
        </div>
      ) : (
        <div className="space-y-0.5 relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-200" />

          {logs.map((log, i) => (
            <div key={log.id} className="flex gap-4 relative pl-10">
              {/* Avatar dot */}
              <div className="absolute left-2 top-2">
                <Avatar
                  src={log.performer?.profile_picture_url}
                  name={log.performer?.name}
                  size="xs"
                  className="ring-2 ring-white"
                />
              </div>

              <div className="flex-1 py-2 pr-2">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-sm font-medium text-slate-700">
                    {log.performer?.name ?? "Someone"}
                  </span>
                  <span className="text-sm text-slate-500 flex-1">{log.action}</span>
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {formatDateTime(log.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
