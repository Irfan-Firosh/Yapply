import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import { AlertTriangle, Clock, Mail } from "lucide-react";

const InvalidLogin = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="candidate" />
      
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="animate-fade-in">
          <Card className="card-elevated">
            <div className="p-8 text-center space-y-6">
              {/* Error Icon */}
              <div className="flex justify-center">
                <div className="rounded-full bg-orange-100 p-4">
                  <AlertTriangle className="h-12 w-12 text-orange-600" />
                </div>
              </div>

              {/* Error Title */}
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">
                  Link Has Expired
                </h1>
                <p className="text-muted-foreground">
                  The magic link you used to access your interview has expired or is invalid.
                </p>
              </div>

              {/* Error Details */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3 text-sm text-orange-800">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span>Magic links expire for security reasons</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-orange-800">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span>You may have used an outdated link</span>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">What to do next:</h2>
                <div className="text-left space-y-3 bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm font-medium flex items-center justify-center">
                      1
                    </div>
                    <p className="text-sm">
                      <strong>Contact the company</strong> that sent you the interview invitation
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm font-medium flex items-center justify-center">
                      2
                    </div>
                    <p className="text-sm">
                      <strong>Request a new link</strong> to access your interview session
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm font-medium flex items-center justify-center">
                      3
                    </div>
                    <p className="text-sm">
                      <strong>Check your email</strong> for the most recent interview invitation
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => window.history.back()}
                  className="w-full sm:w-auto"
                >
                  Go Back
                </Button>
              </div>

              {/* Additional Help */}
              <div className="text-xs text-muted-foreground pt-4 border-t">
                <p>
                  If you continue to experience issues, please contact the company's HR department
                  or the person who sent you the interview invitation.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InvalidLogin;
