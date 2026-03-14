import { useState, useEffect } from "react";
import { Users, Building2, AlertCircle, MapPinOff, Loader2 } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { LiveMapPlaceholder } from "@/components/dashboard/LiveMapPlaceholder";
import { AlertsFeed } from "@/components/dashboard/AlertsFeed";
import api from "../services/api";

export default function Dashboard() {
  // 1. Set up state to hold your backend data
  const [stats, setStats] = useState({
    activeOfficers: 0,
    sitesPatrolled: 0,
    criticalIncidents: 0,
    missedCheckpoints: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // 2. Fetch the data when the component loads
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/patrol/dashboard/stats');
        setStats(response.data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Command Center</h1>
        <p className="text-sm text-muted-foreground">Real-time patrol monitoring and incident overview</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Officers" value={stats.activeOfficers} icon={Users} variant="active" trend="Live status" />
        <StatCard title="Sites Patrolled" value={stats.sitesPatrolled} icon={Building2} variant="info" trend="Today" />
        <StatCard title="Critical Incidents" value={stats.criticalIncidents} icon={AlertCircle} variant="critical" trend="Last 24 hours" />
        <StatCard title="Missed Checkpoints" value={stats.missedCheckpoints} icon={MapPinOff} variant="warning" trend="Action required" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <LiveMapPlaceholder />
        </div>
        <div className="lg:col-span-2">
          <AlertsFeed />
        </div>
      </div>
    </div>
  );
}