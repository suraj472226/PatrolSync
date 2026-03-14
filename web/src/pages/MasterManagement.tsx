import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Building2, Users as UsersIcon, QrCode, Plus, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import api from "../services/api";

export default function MasterManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        // Run both API calls simultaneously for speed
        const [usersRes, companiesRes] = await Promise.all([
          api.get("/users/"),
          api.get("/locations/companies")
        ]);
        
        setUsers(usersRes.data);
        setCompanies(companiesRes.data);
      } catch (error) {
        console.error("Error fetching master data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMasterData();
  }, []);

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Master Management</h1>
        <p className="text-sm text-muted-foreground">Manage companies, sites, and personnel</p>
      </div>

      <Tabs defaultValue="sites" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="sites"><Building2 className="mr-2 h-4 w-4" /> Sites & Locations</TabsTrigger>
          <TabsTrigger value="users"><UsersIcon className="mr-2 h-4 w-4" /> Personnel</TabsTrigger>
        </TabsList>

        {/* --- SITES TAB --- */}
        <TabsContent value="sites" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Registered Sites</CardTitle>
              <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add Site</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Site Name</TableHead>
                    <TableHead>Coordinates</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => 
                    company.sites.map((site: any) => (
                      <TableRow key={site.id}>
                        <TableCell className="font-medium">{company.name}</TableCell>
                        <TableCell>{site.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {site.latitude}, {site.longitude}
                        </TableCell>
                        <TableCell className="text-right">
                          {/* QR Code Generator Dialog */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <QrCode className="mr-2 h-4 w-4" /> QR
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md flex flex-col items-center justify-center p-8">
                              <DialogHeader>
                                <DialogTitle className="text-center mb-4">{site.name} Checkpoint</DialogTitle>
                              </DialogHeader>
                              {/* Actual QR Code that Mobile App can scan */}
                              <div className="bg-white p-4 rounded-lg shadow-sm border">
                                <QRCodeSVG value={`SITE_ID:${site.id}`} size={200} />
                              </div>
                              <p className="text-sm text-muted-foreground mt-4 text-center">
                                Print this code and place it at the physical checkpoint.
                              </p>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- USERS TAB --- */}
        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>System Personnel</CardTitle>
              <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Onboard User</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Emp ID</TableHead>
                    <TableHead>Mobile Number</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Device Bound</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.employee_id}</TableCell>
                      <TableCell>{user.mobile_number}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          user.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 
                          user.role === 'Supervisor' ? 'bg-blue-100 text-blue-800' : 
                          'bg-green-100 text-green-800'
                        }`}>
                          {user.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        {user.device_id ? (
                          <span className="text-green-600 text-sm">Yes ({user.device_id.substring(0,8)}...)</span>
                        ) : (
                          <span className="text-yellow-600 text-sm">Pending</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}