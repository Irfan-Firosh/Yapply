import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Copy, RefreshCw, Key, User, Mail, ArrowLeft, Users, CheckCircle } from "lucide-react";

interface InterviewLogin {
  id: number;
  candidate_id: string;
  candidate_access_code: string;
  candidate_email: string;
  status: string;
}

interface InterviewBasic {
  id: number;
  candidate_name: string;
  candidate_email: string | null;
  position: string | null;
  status: string;
}

const CredentialGenerator = () => {
  const { interview_id } = useParams<{ interview_id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { toast } = useToast();
  
  const [availableInterviews, setAvailableInterviews] = useState<InterviewBasic[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<InterviewBasic | null>(null);
  const [candidateInfo, setCandidateInfo] = useState({
    name: "",
    email: "",
    position: ""
  });
  
  const [existingCredentials, setExistingCredentials] = useState<{
    candidateId: string;
    accessCode: string;
  } | null>(null);
  
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    candidateId: string;
    accessCode: string;
  } | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingCredentials, setIsCheckingCredentials] = useState(false);

  // Cache keys for invalidation
  const INTERVIEWS_CACHE_KEY = 'interviews_data';

  // Get cached interviews data
  const getCachedInterviews = () => {
    try {
      const cached = localStorage.getItem(INTERVIEWS_CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
      }
    } catch (error) {
      console.error('Error reading cached interviews:', error);
    }
    return [];
  };

  // Check for existing credentials
  const checkExistingCredentials = async (interviewId: string) => {
    if (!token) return;
    
    setIsCheckingCredentials(true);
    try {
      const response = await fetch(`/api/company/interviews/login/${interviewId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result: InterviewLogin = await response.json();
        
        // Check if credentials exist (not null/empty)
        if (result.candidate_id && result.candidate_access_code) {
          setExistingCredentials({
            candidateId: result.candidate_id,
            accessCode: result.candidate_access_code
          });
        } else {
          setExistingCredentials(null);
        }
      } else {
        // If interview not found or no credentials, that's okay
        setExistingCredentials(null);
      }
    } catch (error) {
      console.error('Error checking existing credentials:', error);
      setExistingCredentials(null);
    } finally {
      setIsCheckingCredentials(false);
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

    // Load cached interviews
    const cachedInterviews = getCachedInterviews();
    setAvailableInterviews(cachedInterviews);

    // Find and pre-select the current interview
    const currentInterview = cachedInterviews.find(
      (interview: InterviewBasic) => interview.id.toString() === interview_id
    );

    if (currentInterview) {
      setSelectedInterview(currentInterview);
      setCandidateInfo({
        name: currentInterview.candidate_name || "",
        email: currentInterview.candidate_email || "",
        position: currentInterview.position || ""
      });
      
      // Check for existing credentials
      checkExistingCredentials(interview_id);
    }
    
    setIsLoading(false);
  }, [interview_id, token, navigate, toast]);

  const handleInterviewSelect = async (interviewId: string) => {
    const interview = availableInterviews.find(
      (interview) => interview.id.toString() === interviewId
    );
    
    if (interview) {
      setSelectedInterview(interview);
      setCandidateInfo({
        name: interview.candidate_name || "",
        email: interview.candidate_email || "",
        position: interview.position || ""
      });
      
      // Reset states and check for existing credentials
      setGeneratedCredentials(null);
      setExistingCredentials(null);
      await checkExistingCredentials(interviewId);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setCandidateInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!selectedInterview) {
      toast({
        title: "Selection Required",
        description: "Please select an interview",
        variant: "destructive"
      });
      return false;
    }

    if (!candidateInfo.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter candidate name",
        variant: "destructive"
      });
      return false;
    }
    
    if (!candidateInfo.email.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter candidate email",
        variant: "destructive"
      });
      return false;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidateInfo.email)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  const invalidateCache = () => {
    try {
      localStorage.removeItem('company_data');
      localStorage.removeItem(INTERVIEWS_CACHE_KEY);
      console.log('Cache invalidated after credential generation');
    } catch (error) {
      console.error('Error invalidating cache:', error);
    }
  };

  const handleGenerateCredentials = async () => {
    if (!validateForm() || !selectedInterview) return;
    
    setIsGenerating(true);
    
    try {
      const formData = new FormData();
      formData.append('candidate_name', candidateInfo.name);
      formData.append('candidate_email', candidateInfo.email);
      formData.append('position', candidateInfo.position);

      const response = await fetch(`/api/company/interviews/generate/${selectedInterview.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to generate credentials: ${errorData}`);
      }

      const result: InterviewLogin = await response.json();
      
      const newCredentials = {
        candidateId: result.candidate_id,
        accessCode: result.candidate_access_code
      };
      
      setGeneratedCredentials(newCredentials);
      // Clear existing credentials since we generated new ones
      setExistingCredentials(null);

      invalidateCache();
      
      toast({
        title: existingCredentials ? "New Credentials Generated" : "Credentials Generated",
        description: `${existingCredentials ? 'New login' : 'Login'} credentials created for ${candidateInfo.name}`
      });
      
    } catch (error) {
      console.error('Error generating credentials:', error);
      toast({
        title: "Error Generating Credentials",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`
    });
  };

  const handleReset = () => {
    setGeneratedCredentials(null);
    if (selectedInterview) {
      setCandidateInfo({
        name: selectedInterview.candidate_name || "",
        email: selectedInterview.candidate_email || "",
        position: selectedInterview.position || ""
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation variant="company" />
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-lg text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show credentials (existing or newly generated)
  const credentialsToShow = generatedCredentials || existingCredentials;

  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="company" />
      
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="animate-fade-in">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate("/company/dashboard")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-4">
              {existingCredentials ? "Interview Credentials" : "Generate Candidate Credentials"}
            </h1>
            <p className="text-muted-foreground">
              {existingCredentials 
                ? "Existing credentials for this interview" 
                : "Select an interview and generate secure login credentials"
              }
            </p>
          </div>

          <Card className="card-elevated">
            <div className="p-8 space-y-6">
              {/* Interview Selection */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold border-b border-border pb-2">
                  Select Interview
                </h2>
                
                <div className="space-y-2">
                  <Label htmlFor="interview-select" className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Interview
                  </Label>
                  <Select value={selectedInterview?.id.toString() || ""} onValueChange={handleInterviewSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an interview to generate credentials for" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableInterviews.map((interview) => (
                        <SelectItem key={interview.id} value={interview.id.toString()}>
                          <div className="flex items-center justify-between w-full gap-4">
                            <span className="font-medium">{interview.candidate_name}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              interview.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' :
                              interview.status === 'Completed' ? 'bg-green-100 text-green-700' :
                              interview.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {interview.status}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {isCheckingCredentials && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    Checking for existing credentials...
                  </div>
                )}
              </div>

              {/* Existing Credentials Display */}
              {existingCredentials && !generatedCredentials && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">Credentials Already Exist</p>
                      <p className="text-sm text-green-600">This interview already has login credentials.</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-muted rounded-lg border border-border">
                    <h3 className="font-semibold mb-3">Current Credentials</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Candidate ID</p>
                          <p className="font-mono text-lg font-semibold">
                            {existingCredentials.candidateId}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(existingCredentials.candidateId, "Candidate ID")}
                          className="flex items-center gap-1"
                        >
                          <Copy className="h-4 w-4" />
                          Copy
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Access Code</p>
                          <p className="font-mono text-lg font-semibold">
                            {existingCredentials.accessCode}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(existingCredentials.accessCode, "Access Code")}
                          className="flex items-center gap-1"
                        >
                          <Copy className="h-4 w-4" />
                          Copy
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Candidate Information Form - only show if no existing credentials OR if we want to generate new ones */}
              {selectedInterview && (!existingCredentials || generatedCredentials) && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold border-b border-border pb-2">
                    Candidate Information
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        className="form-input"
                        placeholder="Enter candidate's full name"
                        value={candidateInfo.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        className="form-input"
                        placeholder="candidate@email.com"
                        value={candidateInfo.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="position" className="text-sm font-medium flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        Position
                      </Label>
                      <Input
                        id="position"
                        className="form-input"
                        placeholder="e.g., Senior Frontend Developer"
                        value={candidateInfo.position}
                        onChange={(e) => handleInputChange("position", e.target.value)}
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleGenerateCredentials}
                    disabled={isGenerating}
                    className="w-full btn-hero"
                  >
                    {isGenerating ? "Generating..." : existingCredentials ? "Generate New Credentials" : "Generate Credentials"}
                  </Button>
                </div>
              )}

              {/* Generate New Button for existing credentials */}
              {selectedInterview && existingCredentials && !generatedCredentials && (
                <div className="space-y-4">
                  <Button 
                    onClick={handleGenerateCredentials}
                    disabled={isGenerating}
                    variant="outline"
                    className="w-full"
                  >
                    {isGenerating ? "Generating New..." : "Generate New Credentials"}
                  </Button>
                  <p className="text-sm text-muted-foreground text-center">
                    This will create new credentials and replace the existing ones.
                  </p>
                </div>
              )}

              {/* Generated Credentials */}
              {generatedCredentials && (
                <div className="border-t border-border pt-6 animate-slide-up">
                  <h2 className="text-xl font-semibold mb-4">New Generated Credentials</h2>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg border border-border">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Candidate ID</p>
                            <p className="font-mono text-lg font-semibold">
                              {generatedCredentials.candidateId}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(generatedCredentials.candidateId, "Candidate ID")}
                            className="flex items-center gap-1"
                          >
                            <Copy className="h-4 w-4" />
                            Copy
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Access Code</p>
                            <p className="font-mono text-lg font-semibold">
                              {generatedCredentials.accessCode}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(generatedCredentials.accessCode, "Access Code")}
                            className="flex items-center gap-1"
                          >
                            <Copy className="h-4 w-4" />
                            Copy
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-accent rounded-lg border border-border">
                      <h3 className="font-medium mb-2">Instructions for Candidate</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Share these credentials with the candidate:
                      </p>
                      <div className="text-sm space-y-1">
                        <p>1. Visit the candidate login portal</p>
                        <p>2. Enter Candidate ID: <code className="bg-background px-1 rounded">{generatedCredentials.candidateId}</code></p>
                        <p>3. Enter Access Code: <code className="bg-background px-1 rounded">{generatedCredentials.accessCode}</code></p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={handleReset}
                        className="flex items-center gap-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Reset Form
                      </Button>
                      
                      <Button
                        onClick={() => navigate("/company/dashboard")}
                        className="flex items-center gap-2"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Instructions for existing credentials */}
              {existingCredentials && !generatedCredentials && (
                <div className="p-4 bg-accent rounded-lg border border-border">
                  <h3 className="font-medium mb-2">Instructions for Candidate</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Share these credentials with the candidate:
                  </p>
                  <div className="text-sm space-y-1">
                    <p>1. Visit the candidate login portal</p>
                    <p>2. Enter Candidate ID: <code className="bg-background px-1 rounded">{existingCredentials.candidateId}</code></p>
                    <p>3. Enter Access Code: <code className="bg-background px-1 rounded">{existingCredentials.accessCode}</code></p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CredentialGenerator;