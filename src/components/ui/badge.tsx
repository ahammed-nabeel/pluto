import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors border",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary border-primary/20",
        secondary: "bg-secondary text-secondary-foreground border-border",
        destructive: "bg-destructive/10 text-destructive border-destructive/20",
        outline: "border-border text-foreground",
        success: "bg-emerald-50 text-emerald-700 border-emerald-200",
        warning: "bg-amber-50 text-amber-700 border-amber-200",
        // Label variants
        hot: "bg-red-50 text-red-700 border-red-200",
        warm: "bg-orange-50 text-orange-700 border-orange-200",
        cold: "bg-blue-50 text-blue-700 border-blue-200",
        // Status variants
        pending: "bg-amber-50 text-amber-700 border-amber-200",
        in_progress: "bg-blue-50 text-blue-700 border-blue-200",
        completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
        overdue: "bg-red-50 text-red-700 border-red-200",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn("inline-block w-1.5 h-1.5 rounded-full", {
            "bg-red-500": variant === "hot" || variant === "overdue" || variant === "destructive",
            "bg-orange-500": variant === "warm",
            "bg-blue-500": variant === "cold" || variant === "in_progress",
            "bg-amber-500": variant === "pending" || variant === "warning",
            "bg-emerald-500": variant === "success" || variant === "completed",
            "bg-current": !variant,
          })}
        />
      )}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
