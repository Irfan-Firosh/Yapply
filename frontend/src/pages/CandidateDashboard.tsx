import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import { useCandidateAuth } from "@/contexts/CandidateAuthContext";
import { useAuthenticatedApi } from "@/hooks/useAuthenticatedApi";
import { Calendar, Clock, Briefcase, FileText, Play, CheckCircle, LogOut } from "lucide-react";

const CandidateDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout } = useCandidateAuth();
  const { apiCall } = useAuthenticatedApi();
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [candidateData, setCandidateData] = useState<any>(null);
  const [companyName, setCompanyName] = useState<string>("Loading...");
  const [loading, setLoading] = useState(true);

  const CANDIDATE_CACHE_KEY = 'candidate_dashboard_data';
  const COMPANY_CACHE_KEY = 'candidate_company_data';
  const CACHE_DURATION = 24 * 60 * 60 * 1000;
  const getCachedCandidateData = () => {
    try {
      const cached = localStorage.getItem(CANDIDATE_CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
        localStorage.removeItem(CANDIDATE_CACHE_KEY);
      }
    } catch (error) {
      console.error('Error reading cached candidate data:', error);
    }
    return null;
  };

  const setCachedCandidateData = (data: any) => {
    try {
      localStorage.setItem(CANDIDATE_CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error caching candidate data:', error);
    }
  };

  const getCachedCompanyData = () => {
    try {
      const cached = localStorage.getItem(COMPANY_CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
        localStorage.removeItem(COMPANY_CACHE_KEY);
      }
    } catch (error) {
      console.error('Error reading cached company data:', error);
    }
    return null;
  };

  const setCachedCompanyData = (data: string) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(COMPANY_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching company data:', error);
    }
  };

  useEffect(() => {
    const fetchCandidateData = async () => {
      const cachedData = getCachedCandidateData();
      if (cachedData) {
        console.log('Using cached candidate data');
        setCandidateData(cachedData);
        
        const cachedCompany = getCachedCompanyData();
        if (cachedCompany) {
          setCompanyName(cachedCompany);
          setLoading(false);
          return;
        } else {
          try {
            console.log('Fetching company name from API (cached candidate data)');
            const companyData = await apiCall('/candidate/company');
            setCompanyName(companyData);
            setCachedCompanyData(companyData);
          } catch (error) {
            console.error('Error fetching company data:', error);
          }
          setLoading(false);
          return;
        }
      }

      try {
        console.log('Fetching fresh candidate data from API');
        const data = await apiCall('/candidate/dashboard');
        setCandidateData(data);
        setCachedCandidateData(data);

        const cachedCompany = getCachedCompanyData();
        if (cachedCompany) {
          setCompanyName(cachedCompany);
        } else {
          console.log('Fetching company name from API');
          const companyData = await apiCall('/candidate/company');
          setCompanyName(companyData);
          setCachedCompanyData(companyData);
        }
      } catch (error) {
        console.error('Error fetching candidate data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidateData();
  }, [apiCall]);

  const handleLogout = () => {
    localStorage.removeItem(CANDIDATE_CACHE_KEY);
    localStorage.removeItem(COMPANY_CACHE_KEY);
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out."
    });
    navigate("/");
  };

  const interviewInfo = {
    candidateName: candidateData?.candidate_name || user?.email?.split('@')[0] || "Candidate",
    position: candidateData?.position || "Position not specified", 
    company: companyName,
    scheduledDate: "2024-01-16",
    scheduledTime: "14:00",
    status: "scheduled",
    duration: "45 minutes",
    instructions: [
      "Ensure you have a stable internet connection",
      "Find a quiet, well-lit environment",
      "Have your resume and portfolio ready for reference",
      "The interview will be recorded for evaluation purposes",
      "You can take notes during the interview if needed"
    ]
  };

  const handleStartInterview = () => {
    setInterviewStarted(true);
    toast({
      title: "Interview Started",
      description: "Your AI interview session has begun. Good luck!"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation variant="candidate" />
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-lg text-muted-foreground">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="candidate" />
      
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold tracking-tight mb-4">
              Welcome, {interviewInfo.candidateName}
            </h1>
            <p className="text-muted-foreground">
              Your interview portal for {interviewInfo.company}
            </p>
          </div>
          
          <Button
            variant="outline"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="card-elevated animate-slide-up">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Interview Details
                </h2>
                
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Position</p>
                        <p className="font-medium">{interviewInfo.position}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Date</p>
                        <p className="font-medium">
                          {new Date(interviewInfo.scheduledDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Time</p>
                        <p className="font-medium">{interviewInfo.scheduledTime}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p className="font-medium">{interviewInfo.duration}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-border">
                    <span className="status-scheduled">
                      {interviewInfo.status.charAt(0).toUpperCase() + interviewInfo.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>


            <Card className="card-elevated animate-slide-up" style={{animationDelay: "0.1s"}}>
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Interview Instructions
                </h2>
                
                <div className="space-y-3">
                  {interviewInfo.instructions.map((instruction, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <p className="text-muted-foreground leading-relaxed">{instruction}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="card-elevated animate-slide-up" style={{animationDelay: "0.2s"}}>
              <div className="p-6 text-center">
                <h3 className="text-lg font-semibold mb-4">Ready to Begin?</h3>
                
                {!interviewStarted ? (
                  <>
                    <p className="text-muted-foreground mb-6 text-sm">
                      Make sure you've reviewed the instructions above before starting.
                    </p>
                    
                    <Button 
                      onClick={handleStartInterview}
                      className="w-full btn-hero flex items-center gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Start Interview
                    </Button>
                  </>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-success/10 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-success" />
                    </div>
                    <p className="font-medium text-success mb-2">Interview In Progress</p>
                    <p className="text-sm text-muted-foreground">
                      Your AI interview session is now active.
                    </p>
                  </div>
                )}
              </div>
            </Card>


            <Card className="p-6 animate-slide-up" style={{animationDelay: "0.3s"}}>
              <h3 className="font-semibold mb-4">Technical Check</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Internet Connection</span>
                  <span className="text-success font-medium">Good</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Microphone</span>
                  <span className="text-success font-medium">Detected</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Browser Support</span>
                  <span className="text-success font-medium">Compatible</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDashboard;