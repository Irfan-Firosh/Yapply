import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import { readErrorDetail } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import jsPDF from "jspdf";
import {
  ArrowLeft,
  User,
  Star,
  TrendingUp,
  Brain,
  MessageSquare,
  Users,
  Lightbulb,
  Award,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

interface EvaluationData {
  transcript: string;
  evaluation: {
    technical_score: number;
    technical_comment: string;
    communication_score: number;
    communication_comment: string;
    problem_solving_score: number;
    problem_solving_comment: string;
    experience_score: number;
    experience_comment: string;
    leadership_score: number;
    leadership_comment: string;
    adaptability_score: number;
    adaptability_comment: string;
    overall_score: number;
    overall_comment: string;
    recommendation: string;
    key_strengths: string;
  };
}

const CandidateEvaluation = () => {
  const { candidateId } = useParams();
  const { toast } = useToast();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [evaluationData, setEvaluationData] = useState<EvaluationData | null>(
    null
  );
  const [interviewStatus, setInterviewStatus] = useState<string>("");
  const [candidateInfo, setCandidateInfo] = useState<any>(null);

  useEffect(() => {
    if (candidateId && token) {
      fetchInterviewData();
    }
  }, [candidateId, token]);

  const fetchInterviewData = async () => {
    try {
      setLoading(true);

      // First, get interview status
      const statusResponse = await fetch(
        `/api/company/interviews/${candidateId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!statusResponse.ok) {
        throw new Error("Failed to fetch interview data");
      }

      const interviewData = await statusResponse.json();
      setInterviewStatus(interviewData.status);
      setCandidateInfo(interviewData);

      // If status is "Completed", fetch evaluation
      if (interviewData.status === "Completed") {
        const evaluationResponse = await fetch(
          `/api/company/interviews/${candidateId}/evaluate-transcript`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!evaluationResponse.ok) {
          throw new Error(await readErrorDetail(evaluationResponse, "Failed to fetch evaluation data"));
        }

        const evaluation = await evaluationResponse.json();
        setEvaluationData(evaluation);
      }
    } catch (error) {
      console.error("Error fetching interview data:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load interview data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation.toLowerCase()) {
      case "strong hire":
      case "hire":
        return <CheckCircle className='w-5 h-5 text-green-600' />;
      case "no hire":
      case "strong no hire":
        return <XCircle className='w-5 h-5 text-red-600' />;
      default:
        return <AlertCircle className='w-5 h-5 text-yellow-600' />;
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation.toLowerCase()) {
      case "strong hire":
      case "hire":
        return "bg-green-100 text-green-800 border-green-200";
      case "no hire":
      case "strong no hire":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  const getHireStatus = (overallScore: number) => {
    if (overallScore >= 70) return "Good Hire";
    if (overallScore >= 50) return "Consider";
    return "Not Recommended";
  };

  const getHireStatusColor = (overallScore: number) => {
    if (overallScore >= 70) return "text-green-600";
    if (overallScore >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const downloadReport = () => {
    if (!evaluationData || !candidateInfo) return;

    const reportData = {
      candidate: {
        name: candidateInfo.candidate_name || "Unknown",
        email: candidateInfo.candidate_email || "Unknown",
        phone: candidateInfo.candidate_phone || "Unknown",
        position: candidateInfo.position || "Unknown",
        interviewDate: candidateInfo.interview_date || "Unknown",
      },
      evaluation: evaluationData.evaluation,
      transcript: evaluationData.transcript,
      generatedAt: new Date().toISOString(),
    };

    // Create new PDF document
    const doc = new jsPDF();
    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;

    // Helper function to add text with word wrapping
    const addText = (
      text: string,
      fontSize: number = 12,
      isBold: boolean = false
    ) => {
      doc.setFontSize(fontSize);
      if (isBold) {
        doc.setFont("helvetica", "bold");
      } else {
        doc.setFont("helvetica", "normal");
      }

      const lines = doc.splitTextToSize(text, contentWidth);
      doc.text(lines, margin, yPosition);
      yPosition += lines.length * (fontSize * 0.4) + 5;

      // Check if we need a new page
      if (yPosition > doc.internal.pageSize.height - 20) {
        doc.addPage();
        yPosition = 20;
      }
    };

    // Title
    addText("Interview Evaluation Report", 18, true);
    yPosition += 10;

    // Candidate Information
    addText("Candidate Information", 14, true);
    addText(`Name: ${reportData.candidate.name}`);
    addText(`Email: ${reportData.candidate.email}`);
    addText(`Phone: ${reportData.candidate.phone}`);
    addText(`Position: ${reportData.candidate.position}`);
    addText(`Interview Date: ${reportData.candidate.interviewDate}`);
    yPosition += 10;

    // Overall Assessment
    addText("Overall Assessment", 14, true);
    addText(`Overall Score: ${reportData.evaluation.overall_score}/100`);
    addText(`Recommendation: ${reportData.evaluation.recommendation}`);
    addText(
      `Hire Status: ${getHireStatus(reportData.evaluation.overall_score)}`
    );
    yPosition += 10;

    // Overall Comment
    addText("Overall Comment", 14, true);
    addText(reportData.evaluation.overall_comment);
    yPosition += 10;

    // Detailed Scores
    addText("Detailed Scores", 14, true);

    const categories = [
      {
        name: "Technical Skills",
        score: reportData.evaluation.technical_score,
        comment: reportData.evaluation.technical_comment,
      },
      {
        name: "Communication",
        score: reportData.evaluation.communication_score,
        comment: reportData.evaluation.communication_comment,
      },
      {
        name: "Problem Solving",
        score: reportData.evaluation.problem_solving_score,
        comment: reportData.evaluation.problem_solving_comment,
      },
      {
        name: "Experience",
        score: reportData.evaluation.experience_score,
        comment: reportData.evaluation.experience_comment,
      },
      {
        name: "Leadership",
        score: reportData.evaluation.leadership_score,
        comment: reportData.evaluation.leadership_comment,
      },
      {
        name: "Adaptability",
        score: reportData.evaluation.adaptability_score,
        comment: reportData.evaluation.adaptability_comment,
      },
    ];

    categories.forEach((category) => {
      addText(`${category.name}: ${category.score}/100`, 12, true);
      addText(category.comment);
      yPosition += 5;
    });

    yPosition += 10;

    // Key Strengths
    addText("Key Strengths", 14, true);
    addText(reportData.evaluation.key_strengths);
    yPosition += 10;

    // Interview Transcript
    addText("Interview Transcript", 14, true);
    addText(reportData.transcript);

    // Footer
    doc.addPage();
    yPosition = 20;
    addText(
      `Report generated on ${new Date(
        reportData.generatedAt
      ).toLocaleString()}`,
      10
    );

    // Save the PDF
    const fileName = `interview-evaluation-${reportData.candidate.name
      .replace(/\s+/g, "-")
      .toLowerCase()}-${new Date().toISOString().split("T")[0]}.pdf`;

    doc.save(fileName);

    toast({
      title: "Report Downloaded",
      description:
        "Interview evaluation report has been downloaded as PDF successfully.",
    });
  };

  // Prepare data for radar chart
  const radarData = evaluationData
    ? [
        {
          subject: "Technical",
          A: evaluationData.evaluation.technical_score,
          fullMark: 100,
        },
        {
          subject: "Communication",
          A: evaluationData.evaluation.communication_score,
          fullMark: 100,
        },
        {
          subject: "Problem Solving",
          A: evaluationData.evaluation.problem_solving_score,
          fullMark: 100,
        },
        {
          subject: "Experience",
          A: evaluationData.evaluation.experience_score,
          fullMark: 100,
        },
        {
          subject: "Leadership",
          A: evaluationData.evaluation.leadership_score,
          fullMark: 100,
        },
        {
          subject: "Adaptability",
          A: evaluationData.evaluation.adaptability_score,
          fullMark: 100,
        },
      ]
    : [];

  if (loading) {
    return (
      <div className='min-h-screen bg-background'>
        <Navigation variant='company' />
        <div className='max-w-7xl mx-auto px-6 py-8'>
          <div className='flex items-center justify-center min-h-[60vh]'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4'></div>
              <p className='text-lg text-muted-foreground'>
                Loading evaluation...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (interviewStatus !== "Completed") {
    return (
      <div className='min-h-screen bg-background'>
        <Navigation variant='company' />
        <div className='max-w-7xl mx-auto px-6 py-8'>
          <div className='flex items-center gap-4 mb-8'>
            <Link to='/company/dashboard'>
              <Button variant='outline' size='icon'>
                <ArrowLeft className='w-4 h-4' />
              </Button>
            </Link>
            <div>
              <h1 className='text-3xl font-bold tracking-tight'>
                Candidate Evaluation
              </h1>
              <p className='text-muted-foreground'>
                AI-powered assessment and rating
              </p>
            </div>
          </div>

          <div className='flex items-center justify-center min-h-[60vh]'>
            <Card className='max-w-md w-full'>
              <CardContent className='p-8 text-center'>
                <AlertCircle className='w-16 h-16 text-muted-foreground mx-auto mb-4' />
                <h2 className='text-xl font-semibold mb-2'>
                  No Evaluation Available
                </h2>
                <p className='text-muted-foreground'>
                  The interview has not been completed yet. Evaluation will be
                  available once the interview is finished.
                </p>
                <div className='mt-4'>
                  <Badge variant='outline' className='text-sm'>
                    Status: {interviewStatus}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background'>
      <Navigation variant='company' />

      <main className='max-w-7xl mx-auto px-6 py-8'>
        {/* Header */}
        <div className='flex items-center justify-between mb-8'>
          <div className='flex items-center gap-4'>
            <Link to='/company/dashboard'>
              <Button variant='outline' size='icon'>
                <ArrowLeft className='w-4 h-4' />
              </Button>
            </Link>
            <div>
              <h1 className='text-3xl font-bold tracking-tight'>
                Candidate Evaluation
              </h1>
              <p className='text-muted-foreground'>
                AI-powered assessment and rating
              </p>
            </div>
          </div>
          <Button size='lg' onClick={downloadReport} className='btn-hero'>
            Download Report
          </Button>
        </div>

        {/* Top Row - Overall Assessment & Key Metrics */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'>
          {/* Overall Score Card */}
          <Card className='lg:col-span-1'>
            <CardHeader className='text-center'>
              <CardTitle className='text-lg'>Overall Score</CardTitle>
            </CardHeader>
            <CardContent className='text-center space-y-4'>
              <div className='text-4xl font-bold text-primary'>
                {evaluationData?.evaluation.overall_score}/100
              </div>
              <div className='flex items-center justify-center gap-2'>
                {getRecommendationIcon(
                  evaluationData?.evaluation.recommendation || ""
                )}
                <span
                  className={`font-semibold ${getHireStatusColor(
                    evaluationData?.evaluation.overall_score || 0
                  )}`}>
                  {getHireStatus(evaluationData?.evaluation.overall_score || 0)}
                </span>
              </div>
              <Badge
                className={getRecommendationColor(
                  evaluationData?.evaluation.recommendation || ""
                )}>
                {evaluationData?.evaluation.recommendation}
              </Badge>
            </CardContent>
          </Card>

          {/* Key Strengths */}
          <Card className='lg:col-span-2'>
            <CardHeader>
              <CardTitle className='text-lg'>Key Strengths</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground leading-relaxed'>
                {evaluationData?.evaluation.key_strengths}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Second Row - Charts */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
          {/* Performance Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Performance Radar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='h-80'>
                <ResponsiveContainer width='100%' height='100%'>
                  <RadarChart
                    data={radarData}
                    margin={{ top: 40, right: 40, bottom: 40, left: 40 }}>
                    <PolarGrid stroke='#e5e7eb' strokeWidth={1} />
                    <PolarAngleAxis
                      dataKey='subject'
                      tick={{
                        fill: "#374151",
                        fontSize: 12,
                        fontWeight: 500,
                        textAnchor: "middle",
                        dominantBaseline: "middle",
                      }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tick={{ fill: "#6b7280", fontSize: 10 }}
                      tickCount={5}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Radar
                      name='Score'
                      dataKey='A'
                      stroke='#000000'
                      fill='#000000'
                      fillOpacity={0.1}
                      strokeWidth={2}
                      dot={{ fill: "#000000", strokeWidth: 2, r: 3 }}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${value}/100`, "Score"]}
                      labelStyle={{
                        color: "#374151",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                      contentStyle={{
                        backgroundColor: "#f9fafb",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Bar Chart for Detailed Scores */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Detailed Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='h-80'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart
                    data={radarData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                    <CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
                    <XAxis
                      dataKey='subject'
                      tick={{ fill: "#374151", fontSize: 11, fontWeight: 500 }}
                      angle={-45}
                      textAnchor='end'
                      height={100}
                      interval={0}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: "#6b7280", fontSize: 10 }}
                      tickCount={6}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${value}/100`, "Score"]}
                      labelStyle={{
                        color: "#374151",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                      contentStyle={{
                        backgroundColor: "#f9fafb",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey='A'
                      fill='#000000'
                      radius={[4, 4, 0, 0]}
                      stroke='#000000'
                      strokeWidth={1}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className='mt-4 grid grid-cols-2 gap-4 text-sm'>
                <div className='text-center p-2 bg-gray-50 rounded-lg'>
                  <div className='font-semibold text-gray-800'>
                    Highest Score
                  </div>
                  <div className='text-lg font-bold text-gray-900'>
                    {Math.max(...radarData.map((item) => item.A))}/100
                  </div>
                </div>
                <div className='text-center p-2 bg-gray-50 rounded-lg'>
                  <div className='font-semibold text-gray-800'>
                    Average Score
                  </div>
                  <div className='text-lg font-bold text-gray-900'>
                    {Math.round(
                      radarData.reduce((sum, item) => sum + item.A, 0) /
                        radarData.length
                    )}
                    /100
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Third Row - Overall Comment & Transcript */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
          {/* Overall Comment */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Overall Comment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground leading-relaxed'>
                {evaluationData?.evaluation.overall_comment}
              </p>
            </CardContent>
          </Card>

          {/* Interview Transcript */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Interview Transcript</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='h-80 overflow-y-auto border rounded-lg p-4 bg-muted/30'>
                <div className='space-y-3 text-sm'>
                  {evaluationData?.transcript.split("\n").map((line, index) => {
                    if (!line.trim()) return null;

                    const isAI = line.startsWith("AI:");
                    const isUser = line.startsWith("User:");

                    return (
                      <div
                        key={index}
                        className={`p-2 rounded ${
                          isAI
                            ? "bg-gray-100 border-l-4 border-gray-400"
                            : isUser
                            ? "bg-gray-200 border-l-4 border-gray-600"
                            : "bg-gray-50"
                        }`}>
                        <span
                          className={`font-medium ${
                            isAI
                              ? "text-gray-800"
                              : isUser
                              ? "text-gray-900"
                              : "text-gray-800"
                          }`}>
                          {isAI ? "AI" : isUser ? "User" : ""}
                        </span>
                        <span className='ml-2 text-gray-700'>
                          {line.replace(/^(AI:|User:)\s*/, "")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Evaluation */}
        <div className='mt-8'>
          <h2 className='text-2xl font-bold mb-6'>Detailed Evaluation</h2>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Technical Skills */}
            <Card>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center'>
                      <Brain className='w-5 h-5 text-gray-600' />
                    </div>
                    <div>
                      <CardTitle className='text-lg'>
                        Technical Skills
                      </CardTitle>
                      <div className='flex items-center gap-2'>
                        <span
                          className={`text-xl font-bold ${getScoreColor(
                            evaluationData?.evaluation.technical_score || 0
                          )}`}>
                          {evaluationData?.evaluation.technical_score}/100
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Progress
                  value={evaluationData?.evaluation.technical_score || 0}
                  className='h-2 mb-4'
                />
                <p className='text-sm text-muted-foreground leading-relaxed'>
                  {evaluationData?.evaluation.technical_comment}
                </p>
              </CardContent>
            </Card>

            {/* Communication Skills */}
            <Card>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center'>
                      <MessageSquare className='w-5 h-5 text-gray-600' />
                    </div>
                    <div>
                      <CardTitle className='text-lg'>Communication</CardTitle>
                      <div className='flex items-center gap-2'>
                        <span
                          className={`text-xl font-bold ${getScoreColor(
                            evaluationData?.evaluation.communication_score || 0
                          )}`}>
                          {evaluationData?.evaluation.communication_score}/100
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Progress
                  value={evaluationData?.evaluation.communication_score || 0}
                  className='h-2 mb-4'
                />
                <p className='text-sm text-muted-foreground leading-relaxed'>
                  {evaluationData?.evaluation.communication_comment}
                </p>
              </CardContent>
            </Card>

            {/* Problem Solving */}
            <Card>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center'>
                      <Lightbulb className='w-5 h-5 text-gray-600' />
                    </div>
                    <div>
                      <CardTitle className='text-lg'>Problem Solving</CardTitle>
                      <div className='flex items-center gap-2'>
                        <span
                          className={`text-xl font-bold ${getScoreColor(
                            evaluationData?.evaluation.problem_solving_score ||
                              0
                          )}`}>
                          {evaluationData?.evaluation.problem_solving_score}/100
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Progress
                  value={evaluationData?.evaluation.problem_solving_score || 0}
                  className='h-2 mb-4'
                />
                <p className='text-sm text-muted-foreground leading-relaxed'>
                  {evaluationData?.evaluation.problem_solving_comment}
                </p>
              </CardContent>
            </Card>

            {/* Experience */}
            <Card>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center'>
                      <TrendingUp className='w-5 h-5 text-gray-600' />
                    </div>
                    <div>
                      <CardTitle className='text-lg'>Experience</CardTitle>
                      <div className='flex items-center gap-2'>
                        <span
                          className={`text-xl font-bold ${getScoreColor(
                            evaluationData?.evaluation.experience_score || 0
                          )}`}>
                          {evaluationData?.evaluation.experience_score}/100
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Progress
                  value={evaluationData?.evaluation.experience_score || 0}
                  className='h-2 mb-4'
                />
                <p className='text-sm text-muted-foreground leading-relaxed'>
                  {evaluationData?.evaluation.experience_comment}
                </p>
              </CardContent>
            </Card>

            {/* Leadership */}
            <Card>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center'>
                      <Award className='w-5 h-5 text-gray-600' />
                    </div>
                    <div>
                      <CardTitle className='text-lg'>Leadership</CardTitle>
                      <div className='flex items-center gap-2'>
                        <span
                          className={`text-xl font-bold ${getScoreColor(
                            evaluationData?.evaluation.leadership_score || 0
                          )}`}>
                          {evaluationData?.evaluation.leadership_score}/100
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Progress
                  value={evaluationData?.evaluation.leadership_score || 0}
                  className='h-2 mb-4'
                />
                <p className='text-sm text-muted-foreground leading-relaxed'>
                  {evaluationData?.evaluation.leadership_comment}
                </p>
              </CardContent>
            </Card>

            {/* Adaptability */}
            <Card>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center'>
                      <Star className='w-5 h-5 text-gray-600' />
                    </div>
                    <div>
                      <CardTitle className='text-lg'>Adaptability</CardTitle>
                      <div className='flex items-center gap-2'>
                        <span
                          className={`text-xl font-bold ${getScoreColor(
                            evaluationData?.evaluation.adaptability_score || 0
                          )}`}>
                          {evaluationData?.evaluation.adaptability_score}/100
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Progress
                  value={evaluationData?.evaluation.adaptability_score || 0}
                  className='h-2 mb-4'
                />
                <p className='text-sm text-muted-foreground leading-relaxed'>
                  {evaluationData?.evaluation.adaptability_comment}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CandidateEvaluation;
