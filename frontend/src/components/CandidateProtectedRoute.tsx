import { Navigate } from "react-router-dom";
import { useCandidateAuth } from "@/contexts/CandidateAuthContext";

interface CandidateProtectedRouteProps {
  children: React.ReactNode;
}

const CandidateProtectedRoute = ({ children }: CandidateProtectedRouteProps) => {
  const { token, loading } = useCandidateAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/candidate/login" replace />;
  }

  return <>{children}</>;
};

export default CandidateProtectedRoute;
