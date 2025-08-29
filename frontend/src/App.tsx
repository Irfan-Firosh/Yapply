import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CandidateAuthProvider } from "@/contexts/CandidateAuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import CandidateProtectedRoute from "@/components/CandidateProtectedRoute";
import LandingPage from "./pages/LandingPage";
import CompanyLogin from "./pages/CompanyLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ScheduleInterview from "./pages/ScheduleInterview";
import RoleManagement from "./pages/RoleManagement";
import CandidateEvaluation from "./pages/CandidateEvaluation";
import CandidateDashboard from "./pages/CandidateDashboard";
import MagicLinkSender from "./pages/MagicLinkSender";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CandidateAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
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
                    <MagicLinkSender />
                  </ProtectedRoute>
                }
              />
              <Route path='/auth/callback' element={<AuthCallback />} />
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

export default App;
