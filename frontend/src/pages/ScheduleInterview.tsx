import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, User, Phone, Briefcase, Mail, Loader2 } from "lucide-react";

const ScheduleInterview = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { token } = useAuth();

  const [formData, setFormData] = useState({
    candidateName: "",
    candidateEmail: "",
    countryCode: "+1",
    phoneNumber: "",
    position: "",
    interviewDate: "",
    interviewTime: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [roles, setRoles] = useState<
    Array<{
      id: number;
      title: string;
      department: string;
      vapi_workflow_id?: string | null;
    }>
  >([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  useEffect(() => {
    if (token) {
      fetchRoles();
    } else {
      setLoadingRoles(false);
    }
  }, [token]);

  const fetchRoles = async () => {
    if (!token) return;

    try {
      const response = await fetch("/api/company/roles", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch roles");
      }

      const rolesData = await response.json();
      const normalized = Array.isArray(rolesData)
        ? rolesData.map((r: any) => ({
            id: r.id,
            title: r.title,
            department: r.department,
            vapi_workflow_id: r.vapi_workflow_id,
          }))
        : [];
      setRoles(normalized);
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast({
        title: "Error",
        description: "Failed to load available roles",
        variant: "destructive",
      });
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    const {
      candidateName,
      candidateEmail,
      countryCode,
      phoneNumber,
      position,
      interviewDate,
      interviewTime,
    } = formData;

    if (!candidateName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter candidate name",
        variant: "destructive",
      });
      return false;
    }

    if (!candidateEmail.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter candidate email",
        variant: "destructive",
      });
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidateEmail)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return false;
    }

    if (!phoneNumber.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter phone number",
        variant: "destructive",
      });
      return false;
    }

    // Validate US phone number format (10 digits)
    if (
      countryCode === "+1" &&
      !/^\d{10}$/.test(phoneNumber.replace(/\D/g, ""))
    ) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid 10-digit US phone number",
        variant: "destructive",
      });
      return false;
    }

    if (!position) {
      toast({
        title: "Validation Error",
        description: "Please select a position",
        variant: "destructive",
      });
      return false;
    }

    if (!interviewDate) {
      toast({
        title: "Validation Error",
        description: "Please select interview date",
        variant: "destructive",
      });
      return false;
    }

    if (!interviewTime) {
      toast({
        title: "Validation Error",
        description: "Please select interview time",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const createInterview = async (formData: {
    candidateName: string;
    candidateEmail: string;
    countryCode: string;
    phoneNumber: string;
    position: string;
    interviewDate: string;
    interviewTime: string;
  }) => {
    if (!token) {
      throw new Error("Authentication token not found");
    }

    // Find the selected role to get the ID
    const selectedRole = roles.find((role) => role.title === formData.position);
    if (!selectedRole) {
      throw new Error("Selected role not found");
    }

    // Format phone number to E.164 format
    const cleanPhoneNumber = formData.phoneNumber.replace(/\D/g, "");
    const e164PhoneNumber = `${formData.countryCode}${cleanPhoneNumber}`;

    const apiFormData = new FormData();
    apiFormData.append("candidate_name", formData.candidateName);
    apiFormData.append("candidate_email", formData.candidateEmail);
    apiFormData.append("candidate_phone", e164PhoneNumber);
    apiFormData.append("position", formData.position);
    apiFormData.append("role_id", selectedRole.id.toString());

    if (formData.interviewDate) {
      apiFormData.append("date", formData.interviewDate);
    }

    if (formData.interviewTime) {
      apiFormData.append("time", formData.interviewTime);
    }

    const response = await fetch("/api/company/interviews", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
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
      localStorage.setItem("interview_scheduled", "true");

      toast({
        title: "Interview Scheduled",
        description: `Interview for ${formData.candidateName} has been scheduled successfully.`,
      });
      setIsLoading(false);
      navigate("/company/dashboard");
    } catch (error) {
      toast({
        title: "Error Scheduling Interview",
        description: `Failed to schedule interview: ${
          error instanceof Error ? error.message : String(error)
        }`,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-background'>
      <Navigation variant='company' />

      <div className='max-w-2xl mx-auto px-6 py-12'>
        <div className='animate-fade-in'>
          <div className='text-center mb-8'>
            <h1 className='text-3xl font-bold tracking-tight mb-4'>
              Schedule Interview
            </h1>
            <p className='text-muted-foreground'>
              Create a new AI-powered interview session for your candidate
            </p>
          </div>

          <Card className='card-elevated'>
            <form onSubmit={handleSubmit} className='p-8 space-y-6'>
              {/* Candidate Name */}
              <div className='space-y-2'>
                <Label
                  htmlFor='candidateName'
                  className='text-sm font-medium flex items-center gap-2'>
                  <User className='h-4 w-4' />
                  Candidate Name
                </Label>
                <Input
                  id='candidateName'
                  className='form-input'
                  placeholder="Enter candidate's full name"
                  value={formData.candidateName}
                  onChange={(e) =>
                    handleInputChange("candidateName", e.target.value)
                  }
                />
              </div>

              {/* Email */}
              <div className='space-y-2'>
                <Label
                  htmlFor='candidateEmail'
                  className='text-sm font-medium flex items-center gap-2'>
                  <Mail className='h-4 w-4' />
                  Email Address
                </Label>
                <Input
                  id='candidateEmail'
                  type='email'
                  className='form-input'
                  placeholder='candidate@example.com'
                  value={formData.candidateEmail}
                  onChange={(e) =>
                    handleInputChange("candidateEmail", e.target.value)
                  }
                />
              </div>

              {/* Phone Number */}
              <div className='space-y-2'>
                <Label
                  htmlFor='phoneNumber'
                  className='text-sm font-medium flex items-center gap-2'>
                  <Phone className='h-4 w-4' />
                  Phone Number
                </Label>
                <div className='flex gap-2'>
                  <Select
                    value={formData.countryCode}
                    onValueChange={(value) =>
                      handleInputChange("countryCode", value)
                    }>
                    <SelectTrigger className='w-20'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='+1'>+1</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    id='phoneNumber'
                    className='form-input flex-1'
                    placeholder='(555) 123-4567'
                    value={formData.phoneNumber}
                    onChange={(e) => {
                      // Format phone number as user types
                      const value = e.target.value.replace(/\D/g, "");
                      let formatted = value;

                      if (value.length >= 6) {
                        formatted = `(${value.slice(0, 3)}) ${value.slice(
                          3,
                          6
                        )}-${value.slice(6, 10)}`;
                      } else if (value.length >= 3) {
                        formatted = `(${value.slice(0, 3)}) ${value.slice(3)}`;
                      }

                      handleInputChange("phoneNumber", formatted);
                    }}
                    maxLength={14}
                  />
                </div>
                <p className='text-xs text-muted-foreground'>
                  Format: (555) 123-4567
                </p>
              </div>

              {/* Position */}
              <div className='space-y-2'>
                <Label className='text-sm font-medium flex items-center gap-2'>
                  <Briefcase className='h-4 w-4' />
                  Position
                </Label>
                <Select
                  value={formData.position}
                  onValueChange={(value) =>
                    handleInputChange("position", value)
                  }>
                  <SelectTrigger className='form-input'>
                    <SelectValue placeholder='Select position'>
                      {formData.position && <span>{formData.position}</span>}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {loadingRoles ? (
                      <div className='flex items-center justify-center p-4'>
                        <Loader2 className='h-4 w-4 animate-spin mr-2' />
                        Loading roles...
                      </div>
                    ) : roles.length === 0 ? (
                      <div className='p-4 text-center text-muted-foreground'>
                        No roles available. Please create roles first.
                      </div>
                    ) : (
                      roles.map((role) => (
                        <SelectItem key={role.id} value={role.title}>
                          <div className='flex flex-col'>
                            <span>{role.title}</span>
                            <span className='text-xs text-muted-foreground'>
                              {role.department}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {roles.length === 0 && !loadingRoles && (
                  <p className='text-sm text-muted-foreground'>
                    No roles available.{" "}
                    <a
                      href='/company/roles'
                      className='text-primary hover:underline'>
                      Create roles first
                    </a>
                  </p>
                )}
              </div>

              {/* Interview Date and Time */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label
                    htmlFor='interviewDate'
                    className='text-sm font-medium flex items-center gap-2'>
                    <Calendar className='h-4 w-4' />
                    Interview Date
                  </Label>
                  <Input
                    id='interviewDate'
                    type='date'
                    className='form-input'
                    value={formData.interviewDate}
                    onChange={(e) =>
                      handleInputChange("interviewDate", e.target.value)
                    }
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div className='space-y-2'>
                  <Label
                    htmlFor='interviewTime'
                    className='text-sm font-medium'>
                    Interview Time
                  </Label>
                  <Input
                    id='interviewTime'
                    type='time'
                    className='form-input'
                    value={formData.interviewTime}
                    onChange={(e) =>
                      handleInputChange("interviewTime", e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className='pt-4'>
                <Button
                  type='submit'
                  disabled={isLoading || loadingRoles || roles.length === 0}
                  className='w-full btn-hero'>
                  {isLoading
                    ? "Scheduling..."
                    : loadingRoles
                    ? "Loading..."
                    : roles.length === 0
                    ? "No Roles Available"
                    : "Schedule Interview"}
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
