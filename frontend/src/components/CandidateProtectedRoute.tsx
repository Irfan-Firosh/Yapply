import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCandidateAuth } from "@/contexts/CandidateAuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface CandidateProtectedRouteProps {
  children: React.ReactNode;
}

const CandidateProtectedRoute = ({ children }: CandidateProtectedRouteProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { token, loading } = useCandidateAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (loading) return; // Wait for auth context to load
      
      // Just check if we have any session - don't redirect to auth/callback
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // We have a session, allow access
          setIsChecking(false);
          return;
        }
      } catch (error) {
        console.error('Error checking Supabase session:', error);
      }

      // No session at all, redirect to landing page
      toast({
        title: "Authentication Required",
        description: "Please use the magic link sent to your email to access your dashboard.",
        variant: "destructive"
      });
      navigate("/");
      setIsChecking(false);
    };

    checkAuth();
  }, [loading, navigate, toast]);

  // Show loading while checking authentication
  if (loading || isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Render children (session check is done above)
  return <>{children}</>;
};

export default CandidateProtectedRoute;
