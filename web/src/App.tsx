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

const queryClient = new QueryClient();

// --- THE BOUNCER ---
// This component wraps our secure routes. If there's no token, it redirects to /login.
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    return <Navigate to="/login" replace />;
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
          {/* Public Route */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
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