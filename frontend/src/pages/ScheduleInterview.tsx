import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, User, Phone, Briefcase, Mail } from "lucide-react";

const ScheduleInterview = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { token } = useAuth();
  
  const [formData, setFormData] = useState({
    candidateName: "",
    candidateEmail: "",
    phoneNumber: "",
    position: "",
    interviewDate: "",
    interviewTime: ""
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const positions = [
    "Senior Frontend Developer",
    "Backend Engineer",
    "Product Manager",
    "UX Designer",
    "Data Scientist",
    "DevOps Engineer",
    "Full Stack Developer",
    "Mobile Developer",
    "QA Engineer"
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const { candidateName, candidateEmail, phoneNumber, position, interviewDate, interviewTime } = formData;
    
    if (!candidateName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter candidate name",
        variant: "destructive"
      });
      return false;
    }
    
    if (!candidateEmail.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter candidate email",
        variant: "destructive"
      });
      return false;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidateEmail)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return false;
    }
    
    if (!phoneNumber.trim()) {
      toast({
        title: "Validation Error", 
        description: "Please enter phone number",
        variant: "destructive"
      });
      return false;
    }
    
    if (!/^\+?[\d\s\-\(\)]+$/.test(phoneNumber)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid phone number",
        variant: "destructive"
      });
      return false;
    }
    
    if (!position) {
      toast({
        title: "Validation Error",
        description: "Please select a position",
        variant: "destructive"
      });
      return false;
    }
    
    if (!interviewDate) {
      toast({
        title: "Validation Error",
        description: "Please select interview date",
        variant: "destructive"
      });
      return false;
    }
    
    if (!interviewTime) {
      toast({
        title: "Validation Error",
        description: "Please select interview time",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  const createInterview = async (formData: {
    candidateName: string;
    candidateEmail: string;
    phoneNumber: string;
    position: string;
    interviewDate: string;
    interviewTime: string;
  }) => {
    if (!token) {
      throw new Error("Authentication token not found");
    }

    const apiFormData = new FormData();
    apiFormData.append('candidate_name', formData.candidateName);
    apiFormData.append('candidate_email', formData.candidateEmail);
    apiFormData.append('candidate_phone', formData.phoneNumber);
    apiFormData.append('position', formData.position);
    
    if (formData.interviewDate) {
      apiFormData.append('date', formData.interviewDate);
    }
    
    if (formData.interviewTime) {
      apiFormData.append('time', formData.interviewTime);
    }

    const response = await fetch('/api/company/interviews', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: apiFormData,
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to create interview: ${errorData}`);
    }

    return await response.json();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await createInterview(formData);
      localStorage.setItem('interview_scheduled', 'true');
      
      toast({
        title: "Interview Scheduled",
        description: `Interview for ${formData.candidateName} has been scheduled successfully.`
      });
      setIsLoading(false);
      navigate("/company/dashboard");
    } catch (error) {
      toast({
        title: "Error Scheduling Interview",
        description: `Failed to schedule interview: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="company" />
      
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="animate-fade-in">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-4">Schedule Interview</h1>
            <p className="text-muted-foreground">
              Create a new AI-powered interview session for your candidate
            </p>
          </div>

          <Card className="card-elevated">
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Candidate Name */}
              <div className="space-y-2">
                <Label htmlFor="candidateName" className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Candidate Name
                </Label>
                <Input
                  id="candidateName"
                  className="form-input"
                  placeholder="Enter candidate's full name"
                  value={formData.candidateName}
                  onChange={(e) => handleInputChange("candidateName", e.target.value)}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="candidateEmail" className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="candidateEmail"
                  type="email"
                  className="form-input"
                  placeholder="candidate@example.com"
                  value={formData.candidateEmail}
                  onChange={(e) => handleInputChange("candidateEmail", e.target.value)}
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-sm font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="phoneNumber"
                  className="form-input"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                />
              </div>

              {/* Position */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Position
                </Label>
                <Select value={formData.position} onValueChange={(value) => handleInputChange("position", value)}>
                  <SelectTrigger className="form-input">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((position) => (
                      <SelectItem key={position} value={position}>
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Interview Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="interviewDate" className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Interview Date
                  </Label>
                  <Input
                    id="interviewDate"
                    type="date"
                    className="form-input"
                    value={formData.interviewDate}
                    onChange={(e) => handleInputChange("interviewDate", e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interviewTime" className="text-sm font-medium">
                    Interview Time
                  </Label>
                  <Input
                    id="interviewTime"
                    type="time"
                    className="form-input"
                    value={formData.interviewTime}
                    onChange={(e) => handleInputChange("interviewTime", e.target.value)}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full btn-hero"
                >
                  {isLoading ? "Scheduling..." : "Schedule Interview"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ScheduleInterview;