import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "../services/api"; // Importing our custom API client

export default function Login() {
  const [employeeId, setEmployeeId] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(""); // Clear any previous errors
    setIsLoading(true);

    try {
      // 1. Call your FastAPI backend
      const response = await api.post('/auth/login', {
        identifier: employeeId,
        password: otp, // In our backend setup, password acts as the OTP
        device_id: "web-dashboard" // Web doesn't use strict binding, but the API requires this field
      });

      // 2. Save the secure token and user data to localStorage
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // 3. Redirect to the main dashboard
      navigate("/"); // Change this to "/dashboard" if your routes are set up differently

    } catch (error: any) {
      console.error("Login Error:", error);
      // Display the specific error from FastAPI (e.g., "Invalid OTP"), or a generic fallback
      setErrorMessage(error.response?.data?.detail || "Failed to login. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />

      <Card className="relative w-full max-w-md border-border shadow-lg">
        <CardHeader className="space-y-4 text-center pb-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary shadow-md">
            <Shield className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">PatrolSync</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in to Command Center</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Error Message Display */}
            {errorMessage && (
              <div className="p-3 text-sm text-red-500 bg-red-100 rounded-md border border-red-200">
                {errorMessage}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="empId">Employee ID / Mobile Number</Label>
              <Input
                id="empId"
                placeholder="e.g., EMP001 or 9876543210"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="h-11"
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="otp">OTP</Label>
              <Input
                id="otp"
                type="password"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="h-11 font-mono tracking-[0.3em]"
                disabled={isLoading}
                required
              />
              <button type="button" className="text-xs text-primary hover:underline" disabled={isLoading}>
                Request OTP
              </button>
            </div>
            <Button type="submit" className="w-full h-11 mt-2" disabled={isLoading || !employeeId || !otp}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Login <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}