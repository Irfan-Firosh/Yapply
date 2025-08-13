import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Navigation from "@/components/Navigation";
import { ArrowLeft, User, Star, TrendingUp, Brain, MessageSquare, Users, Lightbulb, Award } from "lucide-react";

const CandidateEvaluation = () => {
  const { candidateId } = useParams();
  
  // Mock candidate data - in real app this would come from API
  const candidate = {
    id: candidateId || "1",
    name: "Sarah Johnson",
    position: "Senior Frontend Developer",
    interviewDate: "2024-01-15",
    overallScore: 8.2,
    status: "Completed",
    avatar: "/placeholder.svg"
  };

  const evaluationFields = [
    {
      id: 1,
      name: "Technical Skills",
      icon: Brain,
      score: 8.5,
      maxScore: 10,
      feedback: "Demonstrated strong proficiency in React, TypeScript, and modern JavaScript. Showed excellent understanding of state management and component architecture.",
      color: "hsl(var(--primary))"
    },
    {
      id: 2,
      name: "Communication Skills",
      icon: MessageSquare,
      score: 7.8,
      maxScore: 10,
      feedback: "Clear and articulate responses. Good at explaining complex technical concepts in simple terms. Could improve on asking clarifying questions.",
      color: "hsl(221 83% 53%)"
    },
    {
      id: 3,
      name: "Problem Solving",
      icon: Lightbulb,
      score: 9.1,
      maxScore: 10,
      feedback: "Excellent analytical thinking and systematic approach to problem-solving. Showed creativity in finding alternative solutions.",
      color: "hsl(47 96% 53%)"
    },
    {
      id: 4,
      name: "Cultural Fit",
      icon: Users,
      score: 8.0,
      maxScore: 10,
      feedback: "Values align well with company culture. Demonstrates collaborative mindset and growth-oriented thinking.",
      color: "hsl(142 71% 45%)"
    },
    {
      id: 5,
      name: "Experience Level",
      icon: TrendingUp,
      score: 7.5,
      maxScore: 10,
      feedback: "Solid 4+ years of experience with relevant technologies. Has worked on projects of similar complexity and scale.",
      color: "hsl(262 83% 58%)"
    },
    {
      id: 6,
      name: "Leadership Potential",
      icon: Award,
      score: 6.8,
      maxScore: 10,
      feedback: "Shows some leadership qualities but limited experience leading teams. Good potential for growth in leadership roles.",
      color: "hsl(346 77% 49%)"
    },
    {
      id: 7,
      name: "Adaptability",
      icon: Star,
      score: 8.3,
      maxScore: 10,
      feedback: "Demonstrated ability to learn new technologies quickly. Shows flexibility in adapting to changing requirements.",
      color: "hsl(24 95% 53%)"
    }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    return "text-red-600";
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
      case "in progress":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case "scheduled":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Scheduled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="company" />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/company/dashboard">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Candidate Evaluation</h1>
            <p className="text-muted-foreground">AI-powered assessment and rating</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Candidate Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                  <User className="w-10 h-10 text-muted-foreground" />
                </div>
                <CardTitle className="text-xl">{candidate.name}</CardTitle>
                <p className="text-muted-foreground">{candidate.position}</p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Status</span>
                  {getStatusBadge(candidate.status)}
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Interview Date</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(candidate.interviewDate).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">
                      {candidate.overallScore}/10
                    </div>
                    <p className="text-sm text-muted-foreground">Overall AI Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Evaluation Fields */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {evaluationFields.map((field) => {
                const IconComponent = field.icon;
                const percentage = (field.score / field.maxScore) * 100;
                
                return (
                  <Card key={field.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${field.color}20` }}
                          >
                            <IconComponent 
                              className="w-5 h-5" 
                              style={{ color: field.color }}
                            />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{field.name}</CardTitle>
                            <div className="flex items-center gap-2">
                              <span className={`text-xl font-bold ${getScoreColor(field.score)}`}>
                                {field.score}
                              </span>
                              <span className="text-muted-foreground">/ {field.maxScore}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <Progress 
                        value={percentage} 
                        className="h-2"
                        style={{ 
                          ['--progress-background' as any]: field.color 
                        }}
                      />
                      
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          <strong className="text-foreground">AI Analysis:</strong> {field.feedback}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <Button size="lg">
            Download Report
          </Button>
          <Button variant="outline" size="lg">
            Schedule Follow-up
          </Button>
          <Button variant="outline" size="lg">
            View Interview Recording
          </Button>
        </div>
      </main>
    </div>
  );
};

export default CandidateEvaluation;