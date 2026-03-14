import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Moon, Sun, Search, User, LogOut, Settings } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/hooks/useTheme";
import api from "@/services/api";

export function TopBar() {
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    // Get logged-in user
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }

    // Fetch incidents for notification bell
    const fetchNotifications = async () => {
      try {
        const response = await api.get("/incident/");

        // ✅ ONLY show unresolved incidents
        const activeIncidents = response.data.filter(
          (inc: any) => inc.is_resolved === false
        );

        // show latest 5 alerts
        setNotifications(activeIncidents.slice(0, 5));
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };

    fetchNotifications();

    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Generate avatar initials
  const getInitials = () => {
    if (!currentUser?.employee_id) return "AD";
    return currentUser.employee_id.substring(0, 2).toUpperCase();
  };

  // Count active SOS alerts
  const criticalCount = notifications.filter(
    (n) => n.category === "EMERGENCY_SOS"
  ).length;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card px-4">
      <SidebarTrigger className="shrink-0" />

      {/* Search */}
      <div className="relative hidden flex-1 max-w-md md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search officers, sites, incidents..."
          className="pl-9 bg-secondary border-none h-9"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={toggle} className="h-9 w-9">
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-4 w-4" />

              {criticalCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-status-critical text-[10px] font-bold text-primary-foreground">
                  {criticalCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-72">
            <div className="px-3 py-2 text-sm font-semibold">
              Recent Alerts
            </div>

            <DropdownMenuSeparator />

            {notifications.length === 0 ? (
              <div className="px-3 py-4 text-sm text-center text-muted-foreground">
                No active alerts.
              </div>
            ) : (
              notifications.map((notif) => (
                <DropdownMenuItem
                  key={notif.id}
                  className="flex flex-col items-start gap-1 py-2 cursor-default"
                >
                  <span className="text-sm font-medium">
                    {notif.category} Reported
                  </span>

                  <span className="text-xs text-muted-foreground truncate w-full">
                    {notif.remarks || "No remarks provided"}
                  </span>

                  {notif.category === "EMERGENCY_SOS" ? (
                    <Badge variant="destructive" className="text-[10px]">
                      Critical SOS
                    </Badge>
                  ) : (
                    <Badge variant="default" className="text-[10px]">
                      {notif.category}
                    </Badge>
                  )}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {getInitials()}
              </div>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            <div className="px-3 py-2">
              <p className="text-sm font-medium">
                {currentUser?.employee_id || "Unknown User"}
              </p>
              <p className="text-xs text-muted-foreground">
                {currentUser?.role || "Staff"}
              </p>
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" /> Profile
            </DropdownMenuItem>

            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" /> Settings
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="text-destructive cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}