import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import { GridBackground, DotBackground } from "@/components/ui/grid-background";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Bot, Calendar, Shield, Users, Zap, CheckCircle, ArrowRight, Sparkles, Monitor } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";
import { useRef, useState, useEffect } from "react";

const LandingPage = () => {
  const plugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );
  
  const [api, setApi] = useState<any>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const screenshots = [
    {
      src: "/analytics-dashboard.png",
      alt: "Yapply Dashboard - Interview Management",
      title: "Comprehensive Dashboard",
      description: "Manage all your interviews from one central location"
    },
    {
      src: "/candidate-management.png",
      alt: "Yapply Analytics View",
      title: "Smart Analytics",
      description: "Deep insights and performance metrics for better hiring decisions"
    },
    {
      src: "/dashboard-overview.png", 
      alt: "Yapply Voice Agent Creation",
      title: "AI-Powered Agent Creation",
      description: "Create and customize AI agents for automated interviews"
    },
    {
      src: "/ai-interview-interface.png",
      alt: "Yapply Interview Scheduling",
      title: "Interview Scheduling",
      description: "Smart scheduling system with automated notifications"
    }
  ];

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
              <Button
                size="lg"
                className="btn-hero group"
                onClick={() => {
                  const element = document.getElementById('carousel-section');
                  if (element) {
                    const yOffset = -80; // Offset to show some space above the carousel
                    const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                  }
                }}
              >
                See It In Action
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Link to="/company/dashboard">
                <Button size="lg" variant="outline" className="btn-ghost">
                  Company Dashboard
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
          </div>
        </div>
      </GridBackground>

      {/* Screenshots Carousel Section */}
      <section id="carousel-section" className="py-16 bg-muted/20 border-b border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-6 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Monitor className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">See It In Action</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Our Platform in Action
            </h2>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <Carousel
              plugins={[plugin.current]}
              className="w-full"
              setApi={setApi}
              onMouseEnter={plugin.current.stop}
              onMouseLeave={plugin.current.reset}
            >
              <CarouselContent>
                {screenshots.map((screenshot, index) => (
                  <CarouselItem key={index}>
                    <div className="relative">
                      <div className="overflow-hidden rounded-lg border border-border/20 bg-background shadow-sm">
                        <div className="aspect-video relative overflow-hidden">
                          <img
                            src={screenshot.src}
                            alt={screenshot.alt}
                            className="w-full h-full object-contain bg-muted/10"
                            loading="lazy"
                          />
                        </div>
                        <div className="p-4 text-center border-t border-border/10">
                          <h3 className="text-lg font-medium mb-1 text-foreground">
                            {screenshot.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {screenshot.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex -left-12 h-8 w-8 border-0 bg-background/60 hover:bg-background/90 shadow-none" />
              <CarouselNext className="hidden md:flex -right-12 h-8 w-8 border-0 bg-background/60 hover:bg-background/90 shadow-none" />
            </Carousel>

            {/* Dot Indicators */}
            <div className="flex justify-center gap-2 mt-6">
              {screenshots.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-200 focus:outline-none ${
                    index === current
                      ? "bg-primary"
                      : "bg-muted-foreground/40 hover:bg-muted-foreground/60"
                  }`}
                  onClick={() => api?.scrollTo(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 animate-fade-in">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

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
              <Link to="/company/login">
                <Button size="lg" className="btn-hero group">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/company/dashboard">
                <Button size="lg" variant="outline" className="btn-ghost">
                  Company Dashboard
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
              <span className="font-semibold text-lg">Yapply</span>
            </div>
            <p className="text-muted-foreground text-center">
              © Yapply [prev. MockMade]. Built for modern hiring teams by <a href="https://github.com/Irfan-Firosh" className="text-primary hover:text-primary/80 transition-colors">Irfan Firosh</a>.
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