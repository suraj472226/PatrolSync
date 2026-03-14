import { useState, useEffect } from "react";
import { Download, FileText, Image as ImageIcon, Loader2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import api from "../services/api";

export default function Reports() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const response = await api.get("/incident/");
        setIncidents(response.data);
      } catch (error) {
        console.error("Failed to fetch incidents:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIncidents();
  }, []);

  // Basic CSV Export (Acts as the Excel export requirement)
  const handleExportCSV = () => {
    const headers = ["ID", "Date", "Category", "Remarks", "Lat", "Lng"];
    const csvData = incidents.map(inc => 
      `${inc.id},${new Date(inc.reported_at).toLocaleString()},${inc.category},"${inc.remarks || ''}",${inc.latitude},${inc.longitude}`
    );
    const blob = new Blob([[headers.join(","), ...csvData].join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Incident_Report.csv";
    a.click();
  };

  // Placeholder for PDF Export
  const handleExportPDF = () => {
    alert("PDF Export triggered! (You can integrate libraries like jspdf later for formatted PDF reports)");
  };

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Incident Reports</h1>
          <p className="text-sm text-muted-foreground">Review field observations and SOS alerts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" /> Export Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <FileText className="mr-2 h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead>Location (Lat, Lng)</TableHead>
                <TableHead className="text-right">Evidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No incidents reported yet.
                  </TableCell>
                </TableRow>
              ) : (
                incidents.map((incident) => (
                  <TableRow key={incident.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(incident.reported_at + "Z").toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {incident.category === "EMERGENCY_SOS" ? (
                        <Badge variant="destructive" className="flex w-fit items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> SOS
                        </Badge>
                      ) : (
                        <Badge variant="secondary">{incident.category}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={incident.remarks}>
                      {incident.remarks || "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}
                    </TableCell>
                    <TableCell className="text-right">
                      {incident.photo_url ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <ImageIcon className="h-4 w-4 text-primary" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Incident Evidence</DialogTitle>
                            </DialogHeader>
                            <div className="mt-4 overflow-hidden rounded-md border">
                              {/* Using a placeholder image if the URL isn't a valid remote link yet */}
                              <img 
                                src={incident.photo_url.startsWith('http') ? incident.photo_url : "https://via.placeholder.com/400x300?text=Evidence+Photo"} 
                                alt="Incident Evidence" 
                                className="w-full h-auto object-cover" 
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <span className="text-xs text-muted-foreground">No Photo</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}