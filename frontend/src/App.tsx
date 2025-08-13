import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import CompanyLogin from "./pages/CompanyLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ScheduleInterview from "./pages/ScheduleInterview";
import CandidateEvaluation from "./pages/CandidateEvaluation";
import CandidateLogin from "./pages/CandidateLogin";
import CandidateDashboard from "./pages/CandidateDashboard";
import CredentialGenerator from "./pages/CredentialGenerator";
import InvalidLogin from "./pages/InvalidLogin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/company/login" element={<CompanyLogin />} />
            <Route 
              path="/company/dashboard" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/company/schedule" 
              element={
                <ProtectedRoute>
                  <ScheduleInterview />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/company/evaluation/:candidateId" 
              element={
                <ProtectedRoute>
                  <CandidateEvaluation />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/company/credentials/:interview_id" 
              element={
                <ProtectedRoute>
                  <CredentialGenerator />
                </ProtectedRoute>
              } 
            />
            <Route path="/candidate/login" element={<CandidateLogin />} />
            <Route path="/candidate/invalidlogin" element={<InvalidLogin />} />
            <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;