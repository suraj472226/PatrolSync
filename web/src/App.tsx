import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import LiveMap from "./pages/LiveMap";
import MasterManagement from "./pages/MasterManagement";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import QuestionBank from "./pages/QuestionBank";
import ChecklistComposer from "./pages/ChecklistComposer";
import ChecklistRepository from "./pages/ChecklistRepository";
import ChecklistReports from "./pages/ChecklistReports";
import api from "./services/api";

const queryClient = new QueryClient();

const clearStoredAuth = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
};

const validateSession = async (): Promise<boolean> => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    return false;
  }

  try {
    await api.get("/auth/me");
    return true;
  } catch {
    clearStoredAuth();
    return false;
  }
};

const AuthCheckLoader = () => (
  <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
    Checking session...
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const runCheck = async () => {
      const valid = await validateSession();
      if (isMounted) {
        setIsAuthenticated(valid);
        setIsChecking(false);
      }
    };

    runCheck();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isChecking) {
    return <AuthCheckLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const LoginRoute = ({ children }: { children: React.ReactNode }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const runCheck = async () => {
      const valid = await validateSession();
      if (isMounted) {
        setIsAuthenticated(valid);
        setIsChecking(false);
      }
    };

    runCheck();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isChecking) {
    return <AuthCheckLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <LoginRoute>
                <Login />
              </LoginRoute>
            }
          />
          
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/live-map" element={<LiveMap />} />
                    <Route path="/master" element={<MasterManagement />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/questions" element={<QuestionBank />} />
                    <Route path="/composer" element={<ChecklistComposer />} />
                    <Route path="/checklists" element={<ChecklistRepository />} />
                    <Route path="/checklist-reports" element={<ChecklistReports />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;