import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  Briefcase,
  Users,
  PlusCircle,
  X,
} from "lucide-react";

interface Role {
  id: number;
  title: string;
  description: string;
  department: string;
  requirements: string;
  created_at: string;
  questions: Question[];
}

interface Question {
  id: number;
  question_text: string;
  question_type: "text" | "multiple_choice" | "coding" | "behavioral";
  options?: string[];
  correct_answer?: string;
  difficulty: "easy" | "medium" | "hard";
  role_id: number;
}

const RoleManagement = () => {
  const { token } = useAuth();
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [deletingRoleId, setDeletingRoleId] = useState<number | null>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<number | null>(
    null
  );

  const [roleForm, setRoleForm] = useState({
    title: "",
    description: "",
    department: "",
    requirements: "",
  });

  const [questionForm, setQuestionForm] = useState({
    question_text: "",
    question_type: "text" as const,
    options: [""],
    correct_answer: "",
    difficulty: "medium" as const,
  });

  const departments = [
    "Engineering",
    "Design",
    "Product",
    "Marketing",
    "Sales",
    "Operations",
    "Finance",
    "HR",
    "Legal",
    "Other",
  ];

  const questionTypes = [
    { value: "text", label: "Text Response" },
    { value: "multiple_choice", label: "Multiple Choice" },
    { value: "coding", label: "Coding Problem" },
    { value: "behavioral", label: "Behavioral" },
  ];

  const difficulties = [
    { value: "easy", label: "Easy" },
    { value: "medium", label: "Medium" },
    { value: "hard", label: "Hard" },
  ];

  useEffect(() => {
    fetchRoles();
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
      setRoles(rolesData);
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast({
        title: "Error",
        description: "Failed to load roles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = async () => {
    if (!token) return;

    try {
      const response = await fetch("/api/company/roles", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(roleForm),
      });

      if (!response.ok) {
        throw new Error("Failed to create role");
      }

      const newRole = await response.json();
      setRoles((prev) => [...prev, newRole]);
      setIsAddRoleOpen(false);
      resetRoleForm();
      toast({
        title: "Success",
        description: "Role created successfully",
      });
    } catch (error) {
      console.error("Error creating role:", error);
      toast({
        title: "Error",
        description: "Failed to create role",
        variant: "destructive",
      });
    }
  };

  const handleUpdateRole = async () => {
    if (!token || !editingRole) return;

    try {
      const response = await fetch(`/api/company/roles/${editingRole.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(roleForm),
      });

      if (!response.ok) {
        throw new Error("Failed to update role");
      }

      const updatedRole = await response.json();
      setRoles((prev) =>
        prev.map((role) =>
          role.id === editingRole.id ? { ...role, ...updatedRole } : role
        )
      );
      setEditingRole(null);
      resetRoleForm();
      toast({
        title: "Success",
        description: "Role updated successfully",
      });
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (!token) return;

    setDeletingRoleId(roleId);

    try {
      const response = await fetch(`/api/company/roles/${roleId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete role");
      }

      setRoles((prev) => prev.filter((role) => role.id !== roleId));
      toast({
        title: "Success",
        description: "Role deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting role:", error);
      toast({
        title: "Error",
        description: "Failed to delete role",
        variant: "destructive",
      });
    } finally {
      setDeletingRoleId(null);
    }
  };

  const handleAddQuestion = async () => {
    if (!token || !selectedRole) return;

    try {
      const questionData = {
        ...questionForm,
        role_id: selectedRole.id,
        options:
          questionForm.question_type === "multiple_choice"
            ? questionForm.options
            : undefined,
      };

      const response = await fetch("/api/company/questions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(questionData),
      });

      if (!response.ok) {
        throw new Error("Failed to create question");
      }

      const newQuestion = await response.json();
      setRoles((prev) =>
        prev.map((role) =>
          role.id === selectedRole.id
            ? { ...role, questions: [...role.questions, newQuestion] }
            : role
        )
      );
      setIsAddQuestionOpen(false);
      resetQuestionForm();
      toast({
        title: "Success",
        description: "Question added successfully",
      });
    } catch (error) {
      console.error("Error creating question:", error);
      toast({
        title: "Error",
        description: "Failed to add question",
        variant: "destructive",
      });
    }
  };

  const handleUpdateQuestion = async () => {
    if (!token || !editingQuestion) return;

    try {
      const questionData = {
        ...questionForm,
        options:
          questionForm.question_type === "multiple_choice"
            ? questionForm.options
            : undefined,
      };

      const response = await fetch(
        `/api/company/questions/${editingQuestion.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(questionData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update question");
      }

      const updatedQuestion = await response.json();
      setRoles((prev) =>
        prev.map((role) => ({
          ...role,
          questions: role.questions.map((q) =>
            q.id === editingQuestion.id ? updatedQuestion : q
          ),
        }))
      );
      setEditingQuestion(null);
      resetQuestionForm();
      toast({
        title: "Success",
        description: "Question updated successfully",
      });
    } catch (error) {
      console.error("Error updating question:", error);
      toast({
        title: "Error",
        description: "Failed to update question",
        variant: "destructive",
      });
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!token) return;

    setDeletingQuestionId(questionId);

    try {
      const response = await fetch(`/api/company/questions/${questionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete question");
      }

      setRoles((prev) =>
        prev.map((role) => ({
          ...role,
          questions: role.questions.filter((q) => q.id !== questionId),
        }))
      );
      toast({
        title: "Success",
        description: "Question deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting question:", error);
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive",
      });
    } finally {
      setDeletingQuestionId(null);
    }
  };

  const resetRoleForm = () => {
    setRoleForm({
      title: "",
      description: "",
      department: "",
      requirements: "",
    });
  };

  const resetQuestionForm = () => {
    setQuestionForm({
      question_text: "",
      question_type: "text",
      options: [""],
      correct_answer: "",
      difficulty: "medium",
    });
  };

  const openEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleForm({
      title: role.title,
      description: role.description,
      department: role.department,
      requirements: role.requirements,
    });
  };

  const openEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setQuestionForm({
      question_text: question.question_text,
      question_type: question.question_type,
      options: question.options || [""],
      correct_answer: question.correct_answer || "",
      difficulty: question.difficulty,
    });
  };

  const addOption = () => {
    setQuestionForm((prev) => ({
      ...prev,
      options: [...prev.options, ""],
    }));
  };

  const removeOption = (index: number) => {
    setQuestionForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const updateOption = (index: number, value: string) => {
    setQuestionForm((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) => (i === index ? value : opt)),
    }));
  };

  const getQuestionTypeLabel = (type: string) => {
    return questionTypes.find((t) => t.value === type)?.label || type;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-background'>
        <Navigation variant='company' />
        <div className='max-w-7xl mx-auto px-6 py-8'>
          <div className='flex items-center justify-center min-h-[60vh]'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4'></div>
              <p className='text-lg text-muted-foreground'>Loading roles...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background'>
      <Navigation variant='company' />

      <div className='max-w-7xl mx-auto px-6 py-8'>
        {/* Header */}
        <div className='flex items-center justify-between mb-8'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>
              Role Management
            </h1>
            <p className='text-muted-foreground mt-2'>
              Create and manage job roles and interview questions
            </p>
          </div>

          <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}>
            <DialogTrigger asChild>
              <Button className='btn-hero flex items-center gap-2'>
                <Plus className='h-4 w-4' />
                Add New Role
              </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-[600px]'>
              <DialogHeader>
                <DialogTitle>Add New Role</DialogTitle>
                <DialogDescription>
                  Create a new job role with description and requirements.
                </DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='title'>Role Title</Label>
                    <Input
                      id='title'
                      value={roleForm.title}
                      onChange={(e) =>
                        setRoleForm((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder='e.g., Senior Frontend Developer'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='department'>Department</Label>
                    <Select
                      value={roleForm.department}
                      onValueChange={(value) =>
                        setRoleForm((prev) => ({ ...prev, department: value }))
                      }>
                      <SelectTrigger>
                        <SelectValue placeholder='Select department' />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='description'>Description</Label>
                  <Textarea
                    id='description'
                    value={roleForm.description}
                    onChange={(e) =>
                      setRoleForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder='Describe the role and responsibilities...'
                    rows={3}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='requirements'>Requirements</Label>
                  <Textarea
                    id='requirements'
                    value={roleForm.requirements}
                    onChange={(e) =>
                      setRoleForm((prev) => ({
                        ...prev,
                        requirements: e.target.value,
                      }))
                    }
                    placeholder='List the key requirements and qualifications...'
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant='outline'
                  onClick={() => setIsAddRoleOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddRole}>Create Role</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Roles Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
          {roles.map((role) => (
            <Card key={role.id} className='p-6'>
              <div className='flex items-start justify-between mb-4'>
                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-2'>
                    <Briefcase className='h-5 w-5 text-primary' />
                    <h3 className='text-lg font-semibold'>{role.title}</h3>
                    <Badge variant='secondary'>{role.department}</Badge>
                  </div>
                  <p className='text-muted-foreground text-sm mb-3'>
                    {role.description}
                  </p>
                  <div className='space-y-2'>
                    <div className='flex items-center gap-2'>
                      <FileText className='h-4 w-4 text-muted-foreground' />
                      <span className='text-sm text-muted-foreground'>
                        {role.questions.length} question
                        {role.questions.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className='text-sm'>
                      <strong>Requirements:</strong> {role.requirements}
                    </div>
                  </div>
                </div>
                <div className='flex gap-2'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => openEditRole(role)}>
                    <Edit className='h-4 w-4' />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='text-destructive hover:text-destructive'
                        disabled={deletingRoleId === role.id}>
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Role</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the role "{role.title}
                          "? This will also delete all associated questions.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteRole(role.id)}
                          className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
                          Delete Role
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <Separator className='my-4' />

              <div className='flex items-center justify-between'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setSelectedRole(role)}
                  className='flex items-center gap-2'>
                  <Users className='h-4 w-4' />
                  View Questions
                </Button>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size='sm'
                      onClick={() => setSelectedRole(role)}
                      className='flex items-center gap-2'>
                      <PlusCircle className='h-4 w-4' />
                      Add Question
                    </Button>
                  </DialogTrigger>
                  <DialogContent className='sm:max-w-[600px]'>
                    <DialogHeader>
                      <DialogTitle>Add Question to {role.title}</DialogTitle>
                      <DialogDescription>
                        Create a new interview question for this role.
                      </DialogDescription>
                    </DialogHeader>
                    <div className='grid gap-4 py-4'>
                      <div className='space-y-2'>
                        <Label htmlFor='question-text'>Question</Label>
                        <Textarea
                          id='question-text'
                          value={questionForm.question_text}
                          onChange={(e) =>
                            setQuestionForm((prev) => ({
                              ...prev,
                              question_text: e.target.value,
                            }))
                          }
                          placeholder='Enter your question...'
                          rows={3}
                        />
                      </div>
                      <div className='grid grid-cols-2 gap-4'>
                        <div className='space-y-2'>
                          <Label htmlFor='question-type'>Question Type</Label>
                          <Select
                            value={questionForm.question_type}
                            onValueChange={(value: any) =>
                              setQuestionForm((prev) => ({
                                ...prev,
                                question_type: value,
                              }))
                            }>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {questionTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className='space-y-2'>
                          <Label htmlFor='difficulty'>Difficulty</Label>
                          <Select
                            value={questionForm.difficulty}
                            onValueChange={(value: any) =>
                              setQuestionForm((prev) => ({
                                ...prev,
                                difficulty: value,
                              }))
                            }>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {difficulties.map((diff) => (
                                <SelectItem key={diff.value} value={diff.value}>
                                  {diff.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {questionForm.question_type === "multiple_choice" && (
                        <div className='space-y-2'>
                          <Label>Options</Label>
                          <div className='space-y-2'>
                            {questionForm.options.map((option, index) => (
                              <div key={index} className='flex gap-2'>
                                <Input
                                  value={option}
                                  onChange={(e) =>
                                    updateOption(index, e.target.value)
                                  }
                                  placeholder={`Option ${index + 1}`}
                                />
                                <Button
                                  type='button'
                                  variant='outline'
                                  size='sm'
                                  onClick={() => removeOption(index)}
                                  disabled={questionForm.options.length === 1}>
                                  <X className='h-4 w-4' />
                                </Button>
                              </div>
                            ))}
                            <Button
                              type='button'
                              variant='outline'
                              size='sm'
                              onClick={addOption}
                              className='w-full'>
                              <Plus className='h-4 w-4 mr-2' />
                              Add Option
                            </Button>
                          </div>
                        </div>
                      )}

                      {questionForm.question_type === "multiple_choice" && (
                        <div className='space-y-2'>
                          <Label htmlFor='correct-answer'>Correct Answer</Label>
                          <Input
                            id='correct-answer'
                            value={questionForm.correct_answer}
                            onChange={(e) =>
                              setQuestionForm((prev) => ({
                                ...prev,
                                correct_answer: e.target.value,
                              }))
                            }
                            placeholder='Enter the correct answer'
                          />
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        variant='outline'
                        onClick={() => setIsAddQuestionOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddQuestion}>Add Question</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>
          ))}
        </div>

        {/* Questions Modal */}
        {selectedRole && (
          <Dialog
            open={!!selectedRole}
            onOpenChange={() => setSelectedRole(null)}>
            <DialogContent className='sm:max-w-[800px] max-h-[80vh] overflow-y-auto'>
              <DialogHeader>
                <DialogTitle>Questions for {selectedRole.title}</DialogTitle>
                <DialogDescription>
                  Manage interview questions for this role.
                </DialogDescription>
              </DialogHeader>

              <div className='space-y-4'>
                {selectedRole.questions.length === 0 ? (
                  <div className='text-center py-8'>
                    <FileText className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                    <p className='text-muted-foreground'>
                      No questions added yet.
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      Add your first question to get started.
                    </p>
                  </div>
                ) : (
                  selectedRole.questions.map((question) => (
                    <Card key={question.id} className='p-4'>
                      <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                          <div className='flex items-center gap-2 mb-2'>
                            <Badge
                              className={getDifficultyColor(
                                question.difficulty
                              )}>
                              {question.difficulty}
                            </Badge>
                            <Badge variant='outline'>
                              {getQuestionTypeLabel(question.question_type)}
                            </Badge>
                          </div>
                          <p className='font-medium mb-2'>
                            {question.question_text}
                          </p>

                          {question.question_type === "multiple_choice" &&
                            question.options && (
                              <div className='space-y-1'>
                                <p className='text-sm text-muted-foreground'>
                                  Options:
                                </p>
                                <div className='grid grid-cols-2 gap-2'>
                                  {question.options.map((option, index) => (
                                    <div
                                      key={index}
                                      className='text-sm p-2 bg-muted rounded'>
                                      {option}
                                    </div>
                                  ))}
                                </div>
                                {question.correct_answer && (
                                  <p className='text-sm text-green-600 mt-2'>
                                    <strong>Correct Answer:</strong>{" "}
                                    {question.correct_answer}
                                  </p>
                                )}
                              </div>
                            )}
                        </div>

                        <div className='flex gap-2 ml-4'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => openEditQuestion(question)}>
                            <Edit className='h-4 w-4' />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant='ghost'
                                size='sm'
                                className='text-destructive hover:text-destructive'
                                disabled={deletingQuestionId === question.id}>
                                <Trash2 className='h-4 w-4' />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Question
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this question?
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDeleteQuestion(question.id)
                                  }
                                  className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
                                  Delete Question
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Role Dialog */}
        {editingRole && (
          <Dialog
            open={!!editingRole}
            onOpenChange={() => setEditingRole(null)}>
            <DialogContent className='sm:max-w-[600px]'>
              <DialogHeader>
                <DialogTitle>Edit Role</DialogTitle>
                <DialogDescription>
                  Update the role information.
                </DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='edit-title'>Role Title</Label>
                    <Input
                      id='edit-title'
                      value={roleForm.title}
                      onChange={(e) =>
                        setRoleForm((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder='e.g., Senior Frontend Developer'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='edit-department'>Department</Label>
                    <Select
                      value={roleForm.department}
                      onValueChange={(value) =>
                        setRoleForm((prev) => ({ ...prev, department: value }))
                      }>
                      <SelectTrigger>
                        <SelectValue placeholder='Select department' />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='edit-description'>Description</Label>
                  <Textarea
                    id='edit-description'
                    value={roleForm.description}
                    onChange={(e) =>
                      setRoleForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder='Describe the role and responsibilities...'
                    rows={3}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='edit-requirements'>Requirements</Label>
                  <Textarea
                    id='edit-requirements'
                    value={roleForm.requirements}
                    onChange={(e) =>
                      setRoleForm((prev) => ({
                        ...prev,
                        requirements: e.target.value,
                      }))
                    }
                    placeholder='List the key requirements and qualifications...'
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant='outline' onClick={() => setEditingRole(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateRole}>Update Role</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Question Dialog */}
        {editingQuestion && (
          <Dialog
            open={!!editingQuestion}
            onOpenChange={() => setEditingQuestion(null)}>
            <DialogContent className='sm:max-w-[600px]'>
              <DialogHeader>
                <DialogTitle>Edit Question</DialogTitle>
                <DialogDescription>
                  Update the question information.
                </DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                <div className='space-y-2'>
                  <Label htmlFor='edit-question-text'>Question</Label>
                  <Textarea
                    id='edit-question-text'
                    value={questionForm.question_text}
                    onChange={(e) =>
                      setQuestionForm((prev) => ({
                        ...prev,
                        question_text: e.target.value,
                      }))
                    }
                    placeholder='Enter your question...'
                    rows={3}
                  />
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='edit-question-type'>Question Type</Label>
                    <Select
                      value={questionForm.question_type}
                      onValueChange={(value: any) =>
                        setQuestionForm((prev) => ({
                          ...prev,
                          question_type: value,
                        }))
                      }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {questionTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='edit-difficulty'>Difficulty</Label>
                    <Select
                      value={questionForm.difficulty}
                      onValueChange={(value: any) =>
                        setQuestionForm((prev) => ({
                          ...prev,
                          difficulty: value,
                        }))
                      }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {difficulties.map((diff) => (
                          <SelectItem key={diff.value} value={diff.value}>
                            {diff.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {questionForm.question_type === "multiple_choice" && (
                  <div className='space-y-2'>
                    <Label>Options</Label>
                    <div className='space-y-2'>
                      {questionForm.options.map((option, index) => (
                        <div key={index} className='flex gap-2'>
                          <Input
                            value={option}
                            onChange={(e) =>
                              updateOption(index, e.target.value)
                            }
                            placeholder={`Option ${index + 1}`}
                          />
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={() => removeOption(index)}
                            disabled={questionForm.options.length === 1}>
                            <X className='h-4 w-4' />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={addOption}
                        className='w-full'>
                        <Plus className='h-4 w-4 mr-2' />
                        Add Option
                      </Button>
                    </div>
                  </div>
                )}

                {questionForm.question_type === "multiple_choice" && (
                  <div className='space-y-2'>
                    <Label htmlFor='edit-correct-answer'>Correct Answer</Label>
                    <Input
                      id='edit-correct-answer'
                      value={questionForm.correct_answer}
                      onChange={(e) =>
                        setQuestionForm((prev) => ({
                          ...prev,
                          correct_answer: e.target.value,
                        }))
                      }
                      placeholder='Enter the correct answer'
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant='outline'
                  onClick={() => setEditingQuestion(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateQuestion}>Update Question</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default RoleManagement;
