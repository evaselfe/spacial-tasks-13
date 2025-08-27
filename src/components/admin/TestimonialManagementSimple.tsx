import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, MessageSquare, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TestimonialQuestion {
  id: string;
  question: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

// Sample questions for demo - in production these would come from the database
const defaultQuestions: TestimonialQuestion[] = [
  {
    id: "1",
    question: "Does the agent respond promptly to your requests?",
    is_active: true,
    display_order: 1,
    created_at: new Date().toISOString()
  },
  {
    id: "2", 
    question: "Is the agent knowledgeable about procedures?",
    is_active: true,
    display_order: 2,
    created_at: new Date().toISOString()
  },
  {
    id: "3",
    question: "Does the agent treat you with respect?",
    is_active: true,
    display_order: 3,
    created_at: new Date().toISOString()
  },
  {
    id: "4",
    question: "Would you recommend this agent to others?",
    is_active: true,
    display_order: 4,
    created_at: new Date().toISOString()
  }
];

export const TestimonialManagementSimple = () => {
  const [questions, setQuestions] = useState<TestimonialQuestion[]>(defaultQuestions);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<TestimonialQuestion | null>(null);
  const [formData, setFormData] = useState({
    question: "",
    is_active: true,
    display_order: 0
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingQuestion) {
        // Update existing question
        setQuestions(prev => prev.map(q => 
          q.id === editingQuestion.id 
            ? {
                ...q,
                question: formData.question,
                is_active: formData.is_active,
                display_order: formData.display_order
              }
            : q
        ));

        toast({
          title: "Success",
          description: "Question updated successfully",
        });
      } else {
        // Create new question
        const newQuestion: TestimonialQuestion = {
          id: Date.now().toString(), // Simple ID generation for demo
          question: formData.question,
          is_active: formData.is_active,
          display_order: formData.display_order || questions.length + 1,
          created_at: new Date().toISOString()
        };

        setQuestions(prev => [...prev, newQuestion].sort((a, b) => a.display_order - b.display_order));

        toast({
          title: "Success",
          description: "Question created successfully",
        });
      }

      setShowAddDialog(false);
      setEditingQuestion(null);
      setFormData({ question: "", is_active: true, display_order: 0 });
    } catch (error: any) {
      console.error("Error saving question:", error);
      toast({
        title: "Error",
        description: "Failed to save question",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (question: TestimonialQuestion) => {
    setEditingQuestion(question);
    setFormData({
      question: question.question,
      is_active: question.is_active,
      display_order: question.display_order
    });
    setShowAddDialog(true);
  };

  const handleDelete = async (questionId: string) => {
    try {
      setQuestions(prev => prev.filter(q => q.id !== questionId));

      toast({
        title: "Success",
        description: "Question deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting question:", error);
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (questionId: string, currentStatus: boolean) => {
    try {
      setQuestions(prev => prev.map(q => 
        q.id === questionId ? { ...q, is_active: !currentStatus } : q
      ));

      toast({
        title: "Success",
        description: `Question ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error: any) {
      console.error("Error updating question status:", error);
      toast({
        title: "Error",
        description: "Failed to update question status",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({ question: "", is_active: true, display_order: 0 });
    setEditingQuestion(null);
    setShowAddDialog(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Testimonial Questions Management
        </CardTitle>
        <CardDescription>
          Manage questions for agent testimonials and feedback (Demo Version)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {questions.length} question{questions.length !== 1 ? 's' : ''} configured
            </p>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Question
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingQuestion ? "Edit Question" : "Add New Question"}
                  </DialogTitle>
                  <DialogDescription>
                    Create or modify testimonial questions for agent evaluations
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="question">Question Text</Label>
                    <Input
                      id="question"
                      value={formData.question}
                      onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                      placeholder="Enter testimonial question..."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="display_order">Display Order</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                      placeholder="Order (0 for auto)"
                      min="0"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Active (visible to users)</Label>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Saving..." : editingQuestion ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {questions.map((question, index) => (
              <Card key={question.id} className="border border-border hover:border-primary/40 transition-colors">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">
                          #{question.display_order || index + 1}
                        </span>
                        <Badge variant={question.is_active ? "default" : "secondary"}>
                          {question.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-foreground mb-2">
                        {question.question}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        Created: {new Date(question.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(question.id, question.is_active)}
                        className="h-8"
                      >
                        {question.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(question)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Question</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this question? This action cannot be undone and will also delete all related testimonial responses.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(question.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {questions.length === 0 && (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No testimonial questions configured</p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Question
              </Button>
            </div>
          )}

          {/* Note about database */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Implementation Note</h4>
            <p className="text-xs text-blue-700">
              This is a demo version using local state. To enable full functionality, create the testimonial database tables using the SQL schema provided (testimonial_tables.sql).
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};