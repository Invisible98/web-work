import { cn } from "@/lib/utils";

interface StatusDotProps {
  status: "online" | "offline" | "connecting";
  className?: string;
}

export function StatusDot({ status, className }: StatusDotProps) {
  const statusClasses = {
    online: "bg-primary shadow-[0_0_12px_hsl(var(--primary))]",
    offline: "bg-destructive shadow-[0_0_12px_hsl(var(--destructive))]",
    connecting: "bg-accent shadow-[0_0_12px_hsl(var(--accent))]",
  };

  return (
    <span
      className={cn(
        "inline-block w-3 h-3 rounded-full animate-pulse",
        statusClasses[status],
        className
      )}
      data-testid={`status-dot-${status}`}
    />
  );
}
