import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, User } from "lucide-react";

const CandidateLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [credentials, setCredentials] = useState({
    candidateId: "",
    accessCode: ""
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateCredentials = () => {
    if (!credentials.candidateId.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your Candidate ID",
        variant: "destructive"
      });
      return false;
    }
    
    if (!credentials.accessCode.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your Access Code",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCredentials()) {
      return;
    }
    
    setIsLoading(true);
    
    // Simulate authentication
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock validation - in real app this would call an API
    if (credentials.candidateId === "CAND001" && credentials.accessCode === "ABC123") {
      toast({
        title: "Login Successful",
        description: "Welcome to your interview portal"
      });
      navigate("/candidate/dashboard");
    } else {
      toast({
        title: "Authentication Failed",
        description: "Invalid credentials. Please check your Candidate ID and Access Code.",
        variant: "destructive"
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="landing" />
      
      <div className="flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-4">Candidate Login</h1>
            <p className="text-muted-foreground">
              Enter your credentials provided by your hiring company
            </p>
          </div>

          <Card className="card-elevated">
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Candidate ID */}
              <div className="space-y-2">
                <Label htmlFor="candidateId" className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Candidate ID
                </Label>
                <Input
                  id="candidateId"
                  className="form-input"
                  placeholder="Enter your candidate ID"
                  value={credentials.candidateId}
                  onChange={(e) => handleInputChange("candidateId", e.target.value)}
                />
              </div>

              {/* Access Code */}
              <div className="space-y-2">
                <Label htmlFor="accessCode" className="text-sm font-medium flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  Access Code
                </Label>
                <Input
                  id="accessCode"
                  type="password"
                  className="form-input"
                  placeholder="Enter your access code"
                  value={credentials.accessCode}
                  onChange={(e) => handleInputChange("accessCode", e.target.value)}
                />
              </div>

              {/* Demo Credentials Info */}
              <div className="p-4 bg-muted rounded-lg border border-border">
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Demo Credentials:</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  Candidate ID: <code className="bg-background px-2 py-1 rounded">CAND001</code>
                </p>
                <p className="text-sm text-muted-foreground">
                  Access Code: <code className="bg-background px-2 py-1 rounded">ABC123</code>
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full btn-hero"
                >
                  {isLoading ? "Authenticating..." : "Login to Portal"}
                </Button>
              </div>
            </form>
          </Card>

          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              Don't have credentials?{" "}
              <span className="text-primary font-medium">
                Contact your hiring company
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateLogin;