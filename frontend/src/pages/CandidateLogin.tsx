import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import { useCandidateAuth } from "@/contexts/CandidateAuthContext";
import { Mail, User } from "lucide-react";
import { trackCandidateAuth } from "@/lib/analytics";
import { DEMO_CANDIDATE_EMAIL } from "@/lib/demo";

const CandidateLogin = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, token } = useCandidateAuth();

  useEffect(() => {
    if (token) {
      navigate("/candidate/dashboard", { replace: true });
    }
  }, [token, navigate]);

  const signIn = async (candidateEmail: string, method: string) => {
    setIsLoading(true);
    try {
      await login(candidateEmail);
      trackCandidateAuth(method);
      navigate("/candidate/dashboard", { replace: true });
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signIn(email, "candidate_email");
  };

  const handleDemoLogin = () => {
    setEmail(DEMO_CANDIDATE_EMAIL);
    signIn(DEMO_CANDIDATE_EMAIL, "candidate_demo");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="landing" />

      <main className="flex items-center justify-center px-6 py-24">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto w-12 h-12 bg-foreground rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-background" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Candidate Login</CardTitle>
              <CardDescription>
                Sign in with the email your interview was scheduled under
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={handleDemoLogin} disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Try Demo Candidate"}
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  Demo candidate: <span className="font-mono">{DEMO_CANDIDATE_EMAIL}</span>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CandidateLogin;
