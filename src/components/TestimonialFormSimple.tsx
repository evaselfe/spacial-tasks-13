import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Star, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Agent {
  id: string;
  name: string;
  mobile_number: string;
  type: 'coordinator' | 'supervisor' | 'group_leader' | 'pro';
  ward?: number;
  panchayath_id: string;
}

interface TestimonialFormSimpleProps {
  agent: Agent;
  currentUser?: {
    name: string;
    mobile_number: string;
  };
  onClose?: () => void;
}

// Sample questions for demo - in production these would come from the database
const sampleQuestions = [
  { id: "1", question: "Does the agent respond promptly to your requests?", display_order: 1 },
  { id: "2", question: "Is the agent knowledgeable about procedures?", display_order: 2 },
  { id: "3", question: "Does the agent treat you with respect?", display_order: 3 },
  { id: "4", question: "Would you recommend this agent to others?", display_order: 4 }
];

interface ResponseData {
  [key: string]: string; // question_id -> response
}

const responseOptions = [
  { value: 'yes', label: 'Yes', score: 10, color: 'text-green-600' },
  { value: 'little', label: 'Little', score: 5, color: 'text-yellow-600' },
  { value: 'no', label: 'No', score: 0, color: 'text-red-600' }
];

export const TestimonialFormSimple = ({ agent, currentUser, onClose }: TestimonialFormSimpleProps) => {
  const [questions] = useState(sampleQuestions);
  const [responses, setResponses] = useState<ResponseData>({});
  const [respondentInfo, setRespondentInfo] = useState({
    name: currentUser?.name || "",
    contact: currentUser?.mobile_number || ""
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleResponseChange = (questionId: string, response: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: response
    }));
  };

  const getResponseScore = (response: string) => {
    const option = responseOptions.find(opt => opt.value === response);
    return option ? option.score : 0;
  };

  const getTotalScore = () => {
    return Object.values(responses).reduce((total, response) => {
      return total + getResponseScore(response);
    }, 0);
  };

  const getMaxPossibleScore = () => {
    return questions.length * 10; // Max 10 points per question
  };

  const getScorePercentage = () => {
    const maxScore = getMaxPossibleScore();
    return maxScore > 0 ? Math.round((getTotalScore() / maxScore) * 100) : 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all questions are answered
    const unansweredQuestions = questions.filter(q => !responses[q.id]);
    if (unansweredQuestions.length > 0) {
      toast({
        title: "Incomplete Form",
        description: "Please answer all questions before submitting",
        variant: "destructive",
      });
      return;
    }

    if (!respondentInfo.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide your name",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // For now, we'll just simulate the submission since we can't access the database
      // In production, this would save to the testimonial_responses table
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      toast({
        title: "Thank you!",
        description: "Your testimonial has been submitted successfully",
      });

      // Reset form
      setResponses({});
      setRespondentInfo({ name: "", contact: "" });
      
      if (onClose) {
        onClose();
      }
    } catch (error: any) {
      console.error("Error submitting testimonial:", error);
      toast({
        title: "Error",
        description: "Failed to submit testimonial. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="text-center p-8">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No testimonial questions available at the moment.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Agent Testimonial
        </CardTitle>
        <CardDescription>
          Please provide feedback for <strong>{agent.name}</strong> ({agent.mobile_number})
          {agent.ward && ` - Ward ${agent.ward}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Respondent Information */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium">Your Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="respondent_name">Your Name *</Label>
                <Input
                  id="respondent_name"
                  value={respondentInfo.name}
                  onChange={(e) => setRespondentInfo(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="respondent_contact">Your Contact (Optional)</Label>
                <Input
                  id="respondent_contact"
                  value={respondentInfo.contact}
                  onChange={(e) => setRespondentInfo(prev => ({ ...prev, contact: e.target.value }))}
                  placeholder="Phone or email (optional)"
                />
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-6">
            {questions.map((question, index) => (
              <div key={question.id} className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">
                    Q{index + 1}
                  </Badge>
                  <Label className="text-sm font-medium leading-relaxed">
                    {question.question}
                  </Label>
                </div>
                
                <RadioGroup
                  value={responses[question.id] || ""}
                  onValueChange={(value) => handleResponseChange(question.id, value)}
                  className="ml-8"
                >
                  {responseOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`${question.id}-${option.value}`} />
                      <Label 
                        htmlFor={`${question.id}-${option.value}`}
                        className={`cursor-pointer flex items-center gap-2 ${option.color}`}
                      >
                        {option.label}
                        <Badge variant="outline" className="text-xs">
                          {option.score} pts
                        </Badge>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
          </div>

          {/* Score Preview */}
          {Object.keys(responses).length > 0 && (
            <div className="p-4 bg-primary/10 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-primary" />
                <span className="font-medium">Current Score Preview</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-primary">
                  {getTotalScore()}/{getMaxPossibleScore()}
                </span>
                <Badge variant="outline" className="text-sm">
                  {getScorePercentage()}%
                </Badge>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-2">
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={submitting || Object.keys(responses).length !== questions.length}
              className="flex items-center gap-2"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              {submitting ? "Submitting..." : "Submit Testimonial"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};