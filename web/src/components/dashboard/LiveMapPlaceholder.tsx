import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css"; 
import L from "leaflet";
import api from "../../services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MapPin, AlertTriangle } from "lucide-react";

// Standard Blue Icon for Officers
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Red Glowing Icon for SOS Alerts
const SosIcon = L.divIcon({
  className: "bg-transparent",
  html: `<div style="
    background-color: #dc2626; 
    width: 24px; 
    height: 24px; 
    border-radius: 50%; 
    border: 3px solid white; 
    box-shadow: 0 0 15px rgba(220, 38, 38, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 10px;
    font-weight: bold;
  ">!</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

interface OfficerLocation {
  officer_name: string;
  role: string;
  latitude: number;
  longitude: number;
  shift_start: string;
}

export function LiveMapPlaceholder() {
  const [locations, setLocations] = useState<OfficerLocation[]>([]);
  const [sosAlerts, setSosAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Center on Pune
  const defaultCenter: [number, number] = [18.5204, 73.8567]; 

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both live officers AND incidents at the same time
        const [locationsRes, incidentsRes] = await Promise.all([
          api.get('/patrol/live-locations'),
          api.get('/incident/')
        ]);
        
        setLocations(locationsRes.data);

        // Filter out only the EMERGENCY_SOS incidents to show on the map
        const emergencies = incidentsRes.data.filter(
          (inc: any) => inc.category === "EMERGENCY_SOS" && inc.is_resolved === false
        );
        setSosAlerts(emergencies);

      } catch (error) {
        console.error("Failed to fetch map data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="h-[500px] flex flex-col border-border relative">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Live Tactical Map
          </div>
          {sosAlerts.length > 0 && (
            <span className="text-xs flex items-center gap-1 font-bold text-status-critical bg-status-critical/10 px-2 py-1 rounded-full">
              <AlertTriangle className="h-3 w-3" />
              {sosAlerts.length} Active SOS
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden rounded-b-xl relative z-0">
        {isLoading && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        
        <MapContainer 
          center={defaultCenter} 
          zoom={12} 
          style={{ height: "100%", width: "100%", zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* 1. Draw the Active Officers (Blue Pins) */}
          {locations.map((loc, index) => (
            <Marker key={`officer-${index}`} position={[loc.latitude, loc.longitude]}>
              <Popup>
                <div className="text-sm">
                  <p className="font-bold border-b pb-1 mb-1 text-primary">{loc.officer_name}</p>
                  <p className="text-muted-foreground">{loc.role}</p>
                  <p className="text-xs mt-1">
                    Shift Started: {new Date(loc.shift_start + "Z").toLocaleTimeString()}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* 2. Draw the SOS Alerts (Red Glowing Pins) */}
          {sosAlerts.map((sos, index) => (
            <Marker 
              key={`sos-${index}`} 
              position={[sos.latitude, sos.longitude]} 
              icon={SosIcon}
            >
              <Popup>
                <div className="text-sm border-l-4 border-status-critical pl-2">
                  <p className="font-bold text-status-critical flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    SOS TRIGGERED
                  </p>
                  <p className="font-mono text-xs mt-1">{new Date(sos.reported_at + "Z").toLocaleTimeString()}</p>
                  <p className="text-muted-foreground mt-1">{sos.remarks}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </CardContent>
    </Card>
  );
}