import * as React from "react";
import { cn, getInitials } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-11 h-11 text-base",
  xl: "w-14 h-14 text-lg",
};

const colors = [
  "bg-blue-500", "bg-emerald-500", "bg-violet-500",
  "bg-rose-500", "bg-amber-500", "bg-cyan-500",
  "bg-pink-500", "bg-indigo-500",
];

function getColor(name: string): string {
  let hash = 0;
  for (const ch of name) hash = (hash << 5) - hash + ch.charCodeAt(0);
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ src, name, size = "md", className, ...props }: AvatarProps) {
  const initials = name ? getInitials(name) : "?";
  const colorClass = name ? getColor(name) : "bg-slate-400";

  if (src) {
    return (
      <div className={cn("rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white", sizeClasses[size], className)} {...props}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={name ?? "Avatar"} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={cn("rounded-full flex-shrink-0 flex items-center justify-center font-semibold text-white ring-2 ring-white select-none", colorClass, sizeClasses[size], className)}
      title={name ?? undefined}
      {...props}
    >
      {initials}
    </div>
  );
}

interface AvatarGroupProps {
  users: Array<{ id: string; name?: string | null; profile_picture_url?: string | null }>;
  max?: number;
  size?: AvatarProps["size"];
}

export function AvatarGroup({ users, max = 4, size = "sm" }: AvatarGroupProps) {
  const visible = users.slice(0, max);
  const rest = users.length - max;

  return (
    <div className="flex -space-x-2">
      {visible.map((u) => (
        <Avatar key={u.id} src={u.profile_picture_url} name={u.name} size={size} />
      ))}
      {rest > 0 && (
        <div className={cn("rounded-full flex-shrink-0 flex items-center justify-center font-semibold text-white bg-slate-500 ring-2 ring-white text-xs", sizeClasses[size])}>
          +{rest}
        </div>
      )}
    </div>
  );
}
