import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);

  const processAuthentication = async (session: any) => {
    try {
      const accessToken = session.access_token;
      console.log('AuthCallback: Processing authentication with token length:', accessToken.length);
      
      // Simply store the token and basic user info - let backend handle all verification
      localStorage.setItem('candidate_token', accessToken);
      localStorage.setItem('candidate_user', JSON.stringify({
        id: session.user.id,
        email: session.user.email,
        // Backend will provide actual candidate data when needed
      }));
      
      console.log('AuthCallback: Stored token and basic user data for:', session.user.email);

      // Immediate redirect without toast to avoid delay
      navigate("/candidate/dashboard", { replace: true });
      
    } catch (error) {
      console.error('Error in processAuthentication:', error);
      toast({
        title: "Authentication Failed",
        description: `Failed to complete authentication: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive"
      });
      navigate("/");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('AuthCallback: Starting authentication process...');
      console.log('AuthCallback: Current URL:', window.location.href);
      
      // Check for error parameters in URL hash (magic link errors)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const error = hashParams.get('error');
      const errorCode = hashParams.get('error_code');
      const errorDescription = hashParams.get('error_description');
      
      if (error) {
        console.log('AuthCallback: Error in URL:', { error, errorCode, errorDescription });
        
        if (errorCode === 'otp_expired' || error === 'access_denied') {
          toast({
            title: "Magic Link Expired",
            description: "The magic link has expired or is invalid. Please contact your employer to request a new link.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Authentication Error",
            description: errorDescription || "Authentication failed. Please contact your employer for assistance.",
            variant: "destructive"
          });
        }
        
        navigate("/");
        setIsProcessing(false);
        return;
      }
      
      // Set up auth state change listener to catch magic link authentication
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('AuthCallback: Auth state change:', event, session ? 'Session exists' : 'No session');
        
        if (event === 'SIGNED_IN' && session) {
          console.log('AuthCallback: User signed in via auth state change');
          await processAuthentication(session);
        }
      });

      // Also check for immediate session (in case user is already authenticated)
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('AuthCallback: Initial session check:', sessionData.session ? 'Found' : 'Not found');
      
      if (sessionError) {
        console.error('Session error:', sessionError);
      }

      if (sessionData.session) {
        console.log('AuthCallback: Found immediate session, processing...');
        await processAuthentication(sessionData.session);
      } else {
        console.log('AuthCallback: No immediate session, waiting for auth state change...');
        
        // Set a timeout to handle cases where no auth event occurs
        setTimeout(() => {
          if (isProcessing) {
            console.log('AuthCallback: Timeout - no session established');
            toast({
              title: "Authentication Timeout",
              description: "No valid session found. Please contact your employer for a new magic link.",
              variant: "destructive"
            });
            navigate("/");
            setIsProcessing(false);
          }
        }, 10000); // 10 second timeout
      }

      // Cleanup function
      return () => {
        subscription.unsubscribe();
      };
    };

    handleAuthCallback();
  }, [navigate, toast, isProcessing]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="candidate" />
      
      <div className="max-w-md mx-auto px-6 py-12">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">
              {isProcessing ? "Authenticating..." : "Processing Complete"}
            </h2>
            <p className="text-muted-foreground">
              {isProcessing 
                ? "Please wait while we verify your authentication..."
                : "Redirecting you to your dashboard..."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;