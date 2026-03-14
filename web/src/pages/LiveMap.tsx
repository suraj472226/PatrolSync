import { LiveMapPlaceholder } from "@/components/dashboard/LiveMapPlaceholder";

export default function LiveMap() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Live Map</h1>
        <p className="text-sm text-muted-foreground">Track officer positions and patrol routes in real-time</p>
      </div>
      <LiveMapPlaceholder />
    </div>
  );
}
