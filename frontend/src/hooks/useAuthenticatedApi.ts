import { useCandidateAuth } from "@/contexts/CandidateAuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { readErrorDetail } from "@/lib/api";

export const useAuthenticatedApi = () => {
  const { token, logout } = useCandidateAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (response.status === 401) {
      logout();
      toast({
        title: "Session Expired",
        description: "Please log in again to access your dashboard.",
        variant: "destructive",
      });
      navigate("/candidate/login");
      throw new Error("Authentication failed");
    }

    if (!response.ok) {
      throw new Error(await readErrorDetail(response, `Request failed (${response.status})`));
    }

    return response.json();
  };

  return { apiCall };
};
