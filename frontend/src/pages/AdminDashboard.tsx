import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, ExternalLink, Calendar, Users, FileText, TrendingUp, RefreshCw, Key, Trash2 } from "lucide-react";

interface Company {
  id: number;
  created_at: string;
  username: string;
  email: string;
  disabled: boolean;
}

interface InterviewBasic {
  id: number;
  created_at: string;
  company_id: string;
  candidate_name: string;
  candidate_email: string | null;
  candidate_phone: string;
  position: string | null;
  status: string;
  interview_date: string | null;
  interview_time: string | null;
}

const capitalizeFirst = str => str ? str.charAt(0).toUpperCase() + str.slice(1) : "";


const AdminDashboard = () => {
  const { token } = useAuth();
  const { toast } = useToast();
  const [company, setCompany] = useState<Company | null>(null);
  const [interviews, setInterviews] = useState<InterviewBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [interviewsLoading, setInterviewsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingInterviewId, setDeletingInterviewId] = useState<number | null>(null);

  // Cache keys
  const COMPANY_CACHE_KEY = 'company_data';
  const INTERVIEWS_CACHE_KEY = 'interviews_data';
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

  // Cache invalidation function
  const invalidateCache = useCallback(() => {
    localStorage.removeItem(COMPANY_CACHE_KEY);
    localStorage.removeItem(INTERVIEWS_CACHE_KEY);
  }, []);

  // Force refresh function
  const refreshData = useCallback(async () => {
    setRefreshing(true);
    invalidateCache();
    
    try {
      await Promise.all([
        fetchCompanyData(true), // force refresh
        fetchInterviewsData(true) // force refresh
      ]);
      toast({
        title: "Data Refreshed",
        description: "Dashboard data has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh dashboard data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  }, [invalidateCache]);

  // Calculate stats from real interview data
  const totalInterviews = interviews.length;
  const completedInterviews = interviews.filter(interview => interview.status.toLowerCase() === 'completed').length;
  const scheduledInterviews = interviews.filter(interview => interview.status.toLowerCase() === 'scheduled').length;
  const successRate = totalInterviews > 0 ? Math.round((completedInterviews / totalInterviews) * 100) : 0;

  const stats = [
    { label: "Total Interviews", value: totalInterviews.toString(), icon: Users, color: "text-primary" },
    { label: "Completed", value: completedInterviews.toString(), icon: FileText, color: "text-success" },
    { label: "Scheduled", value: scheduledInterviews.toString(), icon: Calendar, color: "text-warning" },
    { label: "Success Rate", value: `${successRate}%`, icon: TrendingUp, color: "text-primary" }
  ];

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case "completed":
        return <span className="status-completed">Completed</span>;
      case "scheduled":
        return <span className="status-scheduled">Scheduled</span>;
      case "pending":
        return <span className="status-pending">Pending</span>;
      default:
        return <span className="status-pending">{capitalizeFirst(status)}</span>;
    }
  };

  const fetchInterviewsData = async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cachedInterviews = getCachedData(INTERVIEWS_CACHE_KEY);
      if (cachedInterviews) {
        setInterviews(cachedInterviews);
        setInterviewsLoading(false);
        return;
      }
    }

    if (!token) {
      console.error("No authentication token found");
      setInterviewsLoading(false);
      return;
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

      const interviewsData = await response.json();
      setInterviews(interviewsData);
      setCachedData(INTERVIEWS_CACHE_KEY, interviewsData);
    } catch (error) {
      console.error('Error fetching interviews:', error);
      toast({
        title: "Error Loading Interviews",
        description: "Failed to load interview data",
        variant: "destructive"
      });
    } finally {
      setInterviewsLoading(false);
    }
  };

  const deleteInterview = async (interviewId: number) => {
    if (!token) {
      toast({
        title: "Authentication Error",
        description: "No authentication token found",
        variant: "destructive"
      });
      return;
    }

    setDeletingInterviewId(interviewId);

    try {
      const response = await fetch(`/api/company/interviews/${interviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete interview: ${response.statusText}`);
      }

      // Remove the interview from local state
      setInterviews(prevInterviews => 
        prevInterviews.filter(interview => interview.id !== interviewId)
      );
      
      // Invalidate cache to ensure fresh data on next load
      localStorage.removeItem(INTERVIEWS_CACHE_KEY);

      toast({
        title: "Interview Deleted",
        description: "The interview has been successfully deleted."
      });
    } catch (error) {
      console.error('Error deleting interview:', error);
      toast({
        title: "Error Deleting Interview",
        description: `Failed to delete interview: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive"
      });
    } finally {
      setDeletingInterviewId(null);
    }
  };

  const fetchCompanyData = async (forceRefresh = false) => {
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedCompany = getCachedData(COMPANY_CACHE_KEY);
      if (cachedCompany) {
        setCompany(cachedCompany);
        setLoading(false);
        return;
      }
    }

    if (!token) {
      console.error("No authentication token found");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/company/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch company data: ${response.statusText}`);
      }

      const companyData = await response.json();
      setCompany(companyData);
      setCachedData(COMPANY_CACHE_KEY, companyData);
    } catch (error) {
      console.error('Error fetching company data:', error);
      toast({
        title: "Error Loading Dashboard",
        description: "Failed to load company information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Refresh data when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      // Only refresh if cache is older than 2 minutes
      const companyCache = getCachedData(COMPANY_CACHE_KEY);
      const interviewsCache = getCachedData(INTERVIEWS_CACHE_KEY);
      
      const shouldRefresh = !companyCache || !interviewsCache;
      
      if (shouldRefresh && !refreshing) {
        console.log('Window focused, refreshing data...');
        refreshData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshData, refreshing]);

  // Detect if user just came back from scheduling and refresh data
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'interview_scheduled' && e.newValue === 'true') {
        // Clear the flag and refresh data
        localStorage.removeItem('interview_scheduled');
        refreshData();
      }
    };

    // Listen for storage events (from other tabs/windows)
    window.addEventListener('storage', handleStorageChange);

    // Check for the flag on component mount
    if (localStorage.getItem('interview_scheduled') === 'true') {
      localStorage.removeItem('interview_scheduled');
      setTimeout(() => refreshData(), 500); // Small delay to ensure smooth transition
    }

    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshData]);

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchCompanyData(), fetchInterviewsData()]);
    };
    fetchData();
  }, [token]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation variant="company" />
        <div className="max-w-7xl mx-auto px-6 py-8">
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

  if (!company) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation variant="company" />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <p className="text-lg text-muted-foreground">Company not found.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="company" />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{capitalizeFirst(company.username)} Portal</h1>
            <p className="text-muted-foreground mt-2">
              Manage interviews and track candidate progress
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={refreshData} 
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            
            <Link to="/company/schedule">
              <Button className="btn-hero flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Schedule Interview
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6 animate-slide-up" style={{animationDelay: `${index * 0.1}s`}}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </Card>
          ))}
        </div>

        {/* Interviews Table */}
        <Card className="card-elevated animate-fade-in">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold">Recent Interviews</h2>
          </div>
          
          <div className="overflow-x-auto">
            {interviewsLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading interviews...</p>
              </div>
            ) : interviews.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">No interviews found. Schedule your first interview to get started!</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-6 font-medium text-muted-foreground">Candidate</th>
                    <th className="text-left p-6 font-medium text-muted-foreground">Position</th>
                    <th className="text-left p-6 font-medium text-muted-foreground">Date</th>
                    <th className="text-left p-6 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-6 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {interviews.map((interview) => (
                    <tr key={interview.id} className="table-row">
                      <td className="p-6">
                        <div className="font-medium">{interview.candidate_name}</div>
                      </td>
                      <td className="p-6">
                        <div className="text-muted-foreground">{interview.position || 'N/A'}</div>
                      </td>
                      <td className="p-6">
                        <div className="text-muted-foreground">
                          {interview.interview_date ? new Date(interview.interview_date).toLocaleDateString() : 'Not scheduled'}
                        </div>
                      </td>
                      <td className="p-6">
                        {getStatusBadge(interview.status)}
                      </td>
                      <td className="p-6">
                        <div className="flex gap-2">
                          <Link to={`/company/evaluation/${interview.id}`}>
                            <Button variant="ghost" size="sm" className="flex items-center gap-2">
                              <ExternalLink className="h-4 w-4" />
                              Evaluation
                            </Button>
                          </Link>
                          <Link to={`/company/credentials/${interview.id}`}>
                            <Button variant="ghost" size="sm" className="flex items-center gap-2">
                              <Key className="h-4 w-4" />
                              Credentials
                            </Button>
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="flex items-center justify-center text-destructive hover:text-destructive hover:bg-destructive/10"
                                disabled={deletingInterviewId === interview.id}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Interview</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the interview for <strong>{interview.candidate_name}</strong>? 
                                  This action cannot be undone and will permanently remove all interview data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteInterview(interview.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete Interview
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;