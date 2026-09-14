import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { readErrorDetail } from "@/lib/api";
import { ArrowLeft, Briefcase, Calendar, KeyRound, Mail, Phone, User } from "lucide-react";

interface InterviewBasic {
  id: number;
  candidate_name: string;
  candidate_email: string | null;
  candidate_phone: string;
  position: string | null;
  status: string;
  interview_date: string | null;
  interview_time: string | null;
}

const DetailRow = ({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) => (
  <div className='flex items-center gap-3'>
    <Icon className='h-4 w-4 text-muted-foreground' />
    <div>
      <p className='text-sm text-muted-foreground'>{label}</p>
      <p className='font-medium'>{value}</p>
    </div>
  </div>
);

const CandidateAccess = () => {
  const { interview_id } = useParams<{ interview_id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { toast } = useToast();
  const [interview, setInterview] = useState<InterviewBasic | null>(null);

  useEffect(() => {
    if (!token || !interview_id) return;

    const loadInterview = async () => {
      try {
        const response = await fetch(`/api/company/interviews/${interview_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error(await readErrorDetail(response, "Failed to load interview details"));
        }
        setInterview(await response.json());
      } catch (error) {
        toast({
          title: "Error Loading Interview",
          description: error instanceof Error ? error.message : "Failed to load interview details",
          variant: "destructive",
        });
        navigate("/company/dashboard");
      }
    };

    loadInterview();
  }, [interview_id, token, navigate, toast]);

  if (!interview) {
    return (
      <div className='min-h-screen bg-background'>
        <Navigation variant='company' />
        <div className='max-w-2xl mx-auto px-6 py-12 flex items-center justify-center min-h-[60vh]'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary' />
        </div>
      </div>
    );
  }

  const scheduled = interview.interview_date
    ? `${new Date(interview.interview_date).toLocaleDateString()}${interview.interview_time ? ` at ${interview.interview_time}` : ""}`
    : "Not scheduled";

  return (
    <div className='min-h-screen bg-background'>
      <Navigation variant='company' />

      <div className='max-w-2xl mx-auto px-6 py-12'>
        <Button variant='ghost' onClick={() => navigate("/company/dashboard")} className='flex items-center gap-2 mb-8'>
          <ArrowLeft className='h-4 w-4' />
          Back to Dashboard
        </Button>

        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold tracking-tight mb-4'>Candidate Access</h1>
          <p className='text-muted-foreground'>How this candidate signs in and starts their AI interview</p>
        </div>

        <Card className='card-elevated'>
          <div className='p-8 space-y-6'>
            <div className='space-y-4'>
              <h2 className='text-xl font-semibold border-b border-border pb-2'>Interview Details</h2>
              <div className='grid gap-4'>
                <DetailRow icon={User} label='Candidate Name' value={interview.candidate_name} />
                <DetailRow icon={Mail} label='Email Address' value={interview.candidate_email || "Not provided"} />
                <DetailRow icon={Phone} label='Phone' value={interview.candidate_phone} />
                <DetailRow icon={Briefcase} label='Position' value={interview.position || "Not specified"} />
                <DetailRow icon={Calendar} label='Interview Date' value={scheduled} />
              </div>
            </div>

            <div className='space-y-3'>
              <h2 className='text-xl font-semibold border-b border-border pb-2'>Sign-in</h2>
              {interview.candidate_email ? (
                <p className='text-sm text-muted-foreground'>
                  The candidate signs in on the candidate login page with{" "}
                  <span className='font-mono text-foreground'>{interview.candidate_email}</span>, then starts the AI
                  phone interview from their dashboard.
                </p>
              ) : (
                <p className='text-sm text-muted-foreground'>
                  This interview has no email, so the candidate cannot sign in. Schedule a new interview with an email address.
                </p>
              )}
            </div>

            <div className='space-y-3'>
              {interview.candidate_email && (
                <Button asChild className='w-full btn-hero flex items-center gap-2'>
                  <Link to='/candidate/login'>
                    <KeyRound className='h-4 w-4' />
                    Open Candidate Login
                  </Link>
                </Button>
              )}
              <Button variant='outline' onClick={() => navigate("/company/dashboard")} className='w-full flex items-center gap-2'>
                <ArrowLeft className='h-4 w-4' />
                Return to Dashboard
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CandidateAccess;
