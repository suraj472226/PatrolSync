import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant: "active" | "info" | "critical" | "warning";
  trend?: string;
}

const variantStyles = {
  active: "bg-status-active/10 text-status-active",
  info: "bg-status-info/10 text-status-info",
  critical: "bg-status-critical/10 text-status-critical",
  warning: "bg-status-warning/10 text-status-warning",
};

const dotStyles = {
  active: "bg-status-active",
  info: "bg-status-info",
  critical: "bg-status-critical",
  warning: "bg-status-warning",
};

export function StatCard({ title, value, icon: Icon, variant, trend }: StatCardProps) {
  return (
    <Card className="border-border">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full animate-pulse-dot ${dotStyles[variant]}`} />
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
            </div>
            <p className="text-3xl font-bold font-mono tracking-tight">{value}</p>
            {trend && <p className="text-xs text-muted-foreground">{trend}</p>}
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${variantStyles[variant]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
