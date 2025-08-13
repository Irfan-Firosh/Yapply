import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Briefcase, FileText, Play, CheckCircle } from "lucide-react";

const CandidateDashboard = () => {
  const { toast } = useToast();
  const [interviewStarted, setInterviewStarted] = useState(false);

  // Mock interview data
  const interviewInfo = {
    candidateName: "Sarah Johnson",
    position: "Senior Frontend Developer", 
    company: "TechCorp Inc.",
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="candidate" />
      
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold tracking-tight mb-4">
            Welcome, {interviewInfo.candidateName}
          </h1>
          <p className="text-muted-foreground">
            Your interview portal for {interviewInfo.company}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Interview Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Interview Info Card */}
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

            {/* Instructions Card */}
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

          {/* Action Panel */}
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

            {/* Technical Check */}
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