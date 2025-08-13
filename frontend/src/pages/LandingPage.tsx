import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import { GridBackground, DotBackground } from "@/components/ui/grid-background";
import { Bot, Calendar, Shield, Users, Zap, CheckCircle, ArrowRight, Sparkles } from "lucide-react";

const LandingPage = () => {
  const features = [
    {
      icon: Bot,
      title: "AI-Powered Interviews",
      description: "Automated interview process with intelligent conversation flow and real-time analysis powered by advanced AI."
    },
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Effortless interview scheduling with automated notifications and calendar integration."
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-grade security with company-controlled credential generation and data protection."
    },
    {
      icon: Users,
      title: "Candidate Hub",
      description: "Comprehensive dashboard for tracking interview progress and candidate management."
    },
    {
      icon: Zap,
      title: "Real-time Insights",
      description: "Instant interview transcriptions with AI-powered insights and performance analytics."
    },
    {
      icon: CheckCircle,
      title: "Smart Reports",
      description: "AI-generated interview reports with actionable hiring recommendations and insights."
    }
  ];

  const benefits = [
    "75% faster hiring process",
    "Zero scheduling conflicts", 
    "Standardized evaluations",
    "AI-powered insights",
    "Enterprise-grade security"
  ];

  const stats = [
    { value: "10k+", label: "Interviews Conducted" },
    { value: "500+", label: "Companies Trust Us" },
    { value: "75%", label: "Time Saved" },
    { value: "99.9%", label: "Uptime" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="landing" />
      
      {/* Hero Section with Grid Background */}
      <GridBackground className="min-h-screen flex items-center justify-center border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-20 w-full">
          <div className="text-center max-w-5xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered Interview Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 animate-fade-in">
              Transform Your
              <br />
              <span className="gradient-text">Hiring Process</span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 leading-relaxed max-w-3xl mx-auto animate-fade-in" style={{animationDelay: "0.2s"}}>
              Automate interviews, eliminate bias, and hire top talent 75% faster with our AI-driven platform trusted by forward-thinking companies.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in" style={{animationDelay: "0.4s"}}>
              <Link to="/admin">
                <Button size="lg" className="btn-hero group">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/candidate/login">
                <Button size="lg" variant="outline" className="btn-ghost">
                  Candidate Portal
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-sm text-muted-foreground animate-fade-in" style={{animationDelay: "0.6s"}}>
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="font-medium">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 animate-fade-in" style={{animationDelay: "0.8s"}}>
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</div>
                  <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </GridBackground>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <span className="text-sm font-medium text-primary">Platform Features</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Everything You Need for
              <br />
              <span className="gradient-text">Modern Hiring</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Comprehensive interview automation tools designed for enterprise-scale hiring processes with AI at the core.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="p-8 card-elevated animate-fade-in group cursor-pointer" 
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section with Dot Background */}
      <DotBackground className="py-24 border-t border-border">
        <div className="max-w-5xl mx-auto text-center px-6">
          <div className="animate-slide-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to <span className="gradient-text">Transform</span> Your Hiring?
            </h2>
            <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              Join 500+ forward-thinking companies that have automated their interview process 
              and reduced hiring time by 75%. Start your free trial today.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/admin">
                <Button size="lg" className="btn-hero group">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/admin/credentials">
                <Button size="lg" variant="outline" className="btn-ghost">
                  Schedule Demo
                </Button>
              </Link>
            </div>

            <p className="text-sm text-muted-foreground">
              No credit card required • 14-day free trial • Setup in 5 minutes
            </p>
          </div>
        </div>
      </DotBackground>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">InterviewAI</span>
            </div>
            <p className="text-muted-foreground text-center">
              © 2024 InterviewAI. Built for modern hiring teams. Powered by AI.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Privacy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms</a>
              <a href="#" className="hover:text-primary transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;