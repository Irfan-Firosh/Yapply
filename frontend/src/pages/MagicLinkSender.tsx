import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Mail, CheckCircle, User, Calendar, Briefcase, Clock, RefreshCw } from "lucide-react";

interface InterviewBasic {
  id: number;
  candidate_name: string;
  candidate_email: string | null;
  candidate_phone: string;
  position: string | null;
  status: string;
  interview_date: string | null;
  interview_time: string | null;
}

const MagicLinkSender = () => {
  const { interview_id } = useParams<{ interview_id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { toast } = useToast();
  
  const [interview, setInterview] = useState<InterviewBasic | null>(null);
  const [magicLinkStatus, setMagicLinkStatus] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Cache keys and duration
  const INTERVIEWS_CACHE_KEY = 'interviews_data';
  const MAGIC_LINK_CACHE_KEY = 'magic_link_status';
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Cache helper functions
  const getCachedData = (key: string) => {
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
        localStorage.removeItem(key); // Remove expired cache
      }
    } catch (error) {
      console.error('Error reading cache:', error);
    }
    return null;
  };

  const setCachedData = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  };

  // Fetch interview details
  const fetchInterviewDetails = async (forceRefresh = false) => {
    if (!token || !interview_id) return;

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedInterviews = getCachedData(INTERVIEWS_CACHE_KEY);
      if (cachedInterviews) {
        const currentInterview = cachedInterviews.find((int: InterviewBasic) => int.id.toString() === interview_id);
        if (currentInterview) {
          setInterview(currentInterview);
          // Check cached magic link status
          const cachedStatus = getCachedData(`${MAGIC_LINK_CACHE_KEY}_${interview_id}`);
          if (cachedStatus !== null) {
            setMagicLinkStatus(cachedStatus);
          } else {
            await checkMagicLinkStatus(currentInterview.id);
          }
          setIsLoading(false);
          return;
        }
      }
    }

    try {
      const response = await fetch('/api/company/interviews', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch interviews: ${response.statusText}`);
      }

      const interviews = await response.json();
      
      // Cache the interviews data
      setCachedData(INTERVIEWS_CACHE_KEY, interviews);
      
      const currentInterview = interviews.find((int: InterviewBasic) => int.id.toString() === interview_id);
      
      if (currentInterview) {
        setInterview(currentInterview);
        await checkMagicLinkStatus(currentInterview.id);
      } else {
        toast({
          title: "Interview Not Found",
          description: "The requested interview could not be found.",
          variant: "destructive"
        });
        navigate("/company/dashboard");
      }
    } catch (error) {
      console.error('Error fetching interview details:', error);
      toast({
        title: "Error Loading Interview",
        description: "Failed to load interview details",
        variant: "destructive"
      });
      navigate("/company/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  // Check magic link status
  const checkMagicLinkStatus = async (interviewId: number, forceRefresh = false) => {
    if (!token) return;

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedStatus = getCachedData(`${MAGIC_LINK_CACHE_KEY}_${interviewId}`);
      if (cachedStatus !== null) {
        setMagicLinkStatus(cachedStatus);
        return;
      }
    }

    setIsCheckingStatus(true);
    try {
      const response = await fetch(`/api/company/interviews/${interviewId}/link-status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        const status = result.magiclink_status || false;
        setMagicLinkStatus(status);
        
        // Cache the magic link status
        setCachedData(`${MAGIC_LINK_CACHE_KEY}_${interviewId}`, status);
      }
    } catch (error) {
      console.error('Error checking magic link status:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Send magic link
  const sendMagicLink = async () => {
    if (!token || !interview) return;

    setIsSending(true);
    try {
      const response = await fetch(`/api/company/interviews/${interview.id}/send-link`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to send magic link: ${response.statusText}`);
      }

      const result = await response.json();
      setMagicLinkStatus(true);
      
      // Update cache with new status
      setCachedData(`${MAGIC_LINK_CACHE_KEY}_${interview.id}`, true);

      toast({
        title: "Magic Link Sent",
        description: result.message || "Interview magic link has been sent to the candidate's email."
      });
    } catch (error) {
      console.error('Error sending magic link:', error);
      toast({
        title: "Error Sending Magic Link",
        description: `Failed to send magic link: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  // Refresh data function
  const refreshData = async () => {
    if (!interview) return;
    
    setIsRefreshing(true);
    try {
      // Clear relevant cache
      localStorage.removeItem(INTERVIEWS_CACHE_KEY);
      localStorage.removeItem(`${MAGIC_LINK_CACHE_KEY}_${interview.id}`);
      
      // Force refresh data
      await fetchInterviewDetails(true);
      
      toast({
        title: "Data Refreshed",
        description: "Interview details have been updated successfully."
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!interview_id) {
      toast({
        title: "Error",
        description: "Interview ID is required",
        variant: "destructive"
      });
      navigate("/company/dashboard");
      return;
    }
    
    if (!token) {
      toast({
        title: "Authentication Error",
        description: "Please log in to continue",
        variant: "destructive"
      });
      navigate("/company/login");
      return;
    }

    fetchInterviewDetails();
  }, [interview_id, token, navigate, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation variant="company" />
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-lg text-muted-foreground">Loading interview details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation variant="company" />
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <p className="text-lg text-muted-foreground">Interview not found.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="company" />
      
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate("/company/dashboard")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            
            <Button
              variant="outline"
              onClick={refreshData}
              disabled={isRefreshing || isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-4">
              Send Magic Link
            </h1>
            <p className="text-muted-foreground">
              Send a secure magic link to the candidate for interview access
            </p>
          </div>

          <Card className="card-elevated">
            <div className="p-8 space-y-6">
              {/* Interview Details */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold border-b border-border pb-2">
                  Interview Details
                </h2>
                
                <div className="grid gap-4">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Candidate Name</p>
                      <p className="font-medium">{interview.candidate_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email Address</p>
                      <p className="font-medium">{interview.candidate_email || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Position</p>
                      <p className="font-medium">{interview.position || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  {interview.interview_date && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Interview Date</p>
                        <p className="font-medium">
                          {new Date(interview.interview_date).toLocaleDateString()}
                          {interview.interview_time && ` at ${interview.interview_time}`}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 flex items-center justify-center">
                      <div className={`w-2 h-2 rounded-full ${
                        interview.status.toLowerCase() === 'completed' ? 'bg-green-500' :
                        interview.status.toLowerCase() === 'scheduled' ? 'bg-blue-500' :
                        'bg-yellow-500'
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="font-medium capitalize">{interview.status}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Magic Link Status */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold border-b border-border pb-2">
                  Magic Link Status
                </h2>
                
                {isCheckingStatus ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    Checking status...
                  </div>
                ) : (
                  <div className={`flex items-center gap-3 p-4 rounded-lg border ${
                    magicLinkStatus 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    {magicLinkStatus ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Mail className="h-5 w-5 text-gray-500" />
                    )}
                    <div>
                      <p className={`font-medium ${
                        magicLinkStatus ? 'text-green-800' : 'text-gray-800'
                      }`}>
                        {magicLinkStatus ? 'Magic Link Sent' : 'Magic Link Not Sent'}
                      </p>
                      <p className={`text-sm ${
                        magicLinkStatus ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {magicLinkStatus 
                          ? 'The candidate has been sent a magic link to access their interview.'
                          : 'No magic link has been sent to this candidate yet.'
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                {!interview.candidate_email ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 font-medium">Email Required</p>
                    <p className="text-sm text-yellow-600">
                      Cannot send magic link: No email address provided for this candidate.
                    </p>
                  </div>
                ) : (
                  <>
                    <Button 
                      onClick={sendMagicLink}
                      disabled={isSending}
                      className="w-full btn-hero flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      {isSending ? 'Sending Magic Link...' : 
                       magicLinkStatus ? 'Send New Magic Link' : 'Send Magic Link'}
                    </Button>
                    
                    {magicLinkStatus && (
                      <p className="text-sm text-muted-foreground text-center">
                        Sending a new magic link will replace the previous one.
                      </p>
                    )}
                  </>
                )}
                
                <Button
                  variant="outline"
                  onClick={() => navigate("/company/dashboard")}
                  className="w-full flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Return to Dashboard
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MagicLinkSender;
