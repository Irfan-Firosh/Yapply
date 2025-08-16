import { useCandidateAuth } from "@/contexts/CandidateAuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export const useAuthenticatedApi = () => {
  const { token, logout } = useCandidateAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    // Get fresh token from Supabase session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      console.log('No valid Supabase session:', error);
      logout();
      toast({
        title: "Session Expired",
        description: "Please use the magic link again to access your dashboard.",
        variant: "destructive"
      });
      navigate("/");
      throw new Error("No valid session");
    }

    const freshToken = session.access_token;
    const userEmail = session.user.email;
    const userUuid = session.user.id;
    
    console.log('Fresh Supabase token obtained');
    console.log('User email:', userEmail);
    console.log('User UUID:', userUuid);
    console.log('Token expires at:', session.expires_at);

    const fullUrl = `/api${endpoint}`;
    console.log('API Call:', fullUrl);

    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Authorization': `Bearer ${freshToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    console.log('API Response Status:', response.status);
    console.log('API Response Headers:', Object.fromEntries(response.headers.entries()));

    // If unauthorized, logout and redirect
    if (response.status === 401) {
      logout();
      toast({
        title: "Session Expired",
        description: "Please use the magic link again to access your dashboard.",
        variant: "destructive"
      });
      navigate("/");
      throw new Error("Authentication failed");
    }

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return response.json();
  };

  return { apiCall };
};
