import { useState, useEffect } from "react";
import { AlertTriangle, AlertCircle, Info, Loader2, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast"; // Shadcn toast for notifications
import api from "../../services/api";

const getAlertConfig = (category: string) => {
  if (category === "EMERGENCY_SOS") return { icon: AlertCircle, color: "text-status-critical bg-status-critical/10" };
  if (category === "Security") return { icon: AlertTriangle, color: "text-status-warning bg-status-warning/10" };
  return { icon: Info, color: "text-status-info bg-status-info/10" };
};

export function AlertsFeed() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchAlerts = async () => {
    try {
      const response = await api.get('/incident/');
      // ONLY show incidents that are NOT resolved
      const activeAlerts = response.data.filter((alert: any) => alert.is_resolved === false);
      setAlerts(activeAlerts);
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  // NEW: Handle marking an incident as resolved
  const handleResolve = async (id: number) => {
    try {
      await api.patch(`/incident/${id}/resolve`);
      // Instantly remove it from the UI feed
      setAlerts(alerts.filter(alert => alert.id !== id));
      toast({
        title: "Alert Resolved",
        description: "The incident has been cleared from the live dashboard.",
      });
    } catch (error) {
      console.error("Failed to resolve alert:", error);
    }
  };

  return (
    <Card className="border-border h-[500px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-status-warning" />
          Live Activity Feed
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="h-[430px]">
            <div className="space-y-1 p-4 pt-0">
              {alerts.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground pt-4">All clear. No active alerts.</p>
              ) : (
                alerts.map((alert) => {
                  const config = getAlertConfig(alert.category);
                  const Icon = config.icon;
                  
                  return (
                    <div key={alert.id} className="flex items-center gap-3 rounded-lg p-3 hover:bg-secondary/50 transition-colors border border-transparent hover:border-border">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${config.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug font-medium">
                          {alert.category === "EMERGENCY_SOS" ? "🚨 SOS TRIGGERED" : alert.category}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5 truncate">{alert.remarks || "No remarks provided"}</p>
                        <p className="text-xs text-muted-foreground mt-1 font-mono">
                          {new Date(alert.reported_at + "Z").toLocaleTimeString()} {alert.site_id ? `· Site ${alert.site_id}` : '· Mobile Patrol'}
                        </p>
                      </div>
                      
                      {/* NEW: Resolve Button */}
                      <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0 ml-2 text-muted-foreground hover:text-green-600 hover:bg-green-50"
                          onClick={() => handleResolve(alert.id)}
                          title="Mark as Resolved"
                        >
                        <CheckCircle className="h-5 w-5" />
                        
                      </Button>
                      
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}