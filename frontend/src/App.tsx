import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { CandidateAuthProvider } from "@/contexts/CandidateAuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import CandidateProtectedRoute from "@/components/CandidateProtectedRoute";
import LandingPage from "./pages/LandingPage";
import CompanyLogin from "./pages/CompanyLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ScheduleInterview from "./pages/ScheduleInterview";
import CandidateEvaluation from "./pages/CandidateEvaluation";
import CandidateDashboard from "./pages/CandidateDashboard";
import CandidateLogin from "./pages/CandidateLogin";
import CandidateAccess from "./pages/CandidateAccess";
import NotFound from "./pages/NotFound";
import RoleManagement from "./pages/RoleManagement";
import { initGA, trackPageView } from "@/lib/analytics";

const queryClient = new QueryClient();

// Component to handle page view tracking
const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);

  return null;
};

const App = () => {
  useEffect(() => {
    initGA();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CandidateAuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AnalyticsTracker />
              <Routes>
              <Route path='/' element={<LandingPage />} />
              <Route path='/company/login' element={<CompanyLogin />} />
              <Route
                path='/company/dashboard'
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/company/schedule'
                element={
                  <ProtectedRoute>
                    <ScheduleInterview />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/company/roles'
                element={
                  <ProtectedRoute>
                    <RoleManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/company/evaluation/:candidateId'
                element={
                  <ProtectedRoute>
                    <CandidateEvaluation />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/company/magic-link/:interview_id'
                element={
                  <ProtectedRoute>
                    <CandidateAccess />
                  </ProtectedRoute>
                }
              />
              <Route path='/candidate/login' element={<CandidateLogin />} />
              <Route
                path='/candidate/dashboard'
                element={
                  <CandidateProtectedRoute>
                    <CandidateDashboard />
                  </CandidateProtectedRoute>
                }
              />
              <Route path='*' element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CandidateAuthProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
