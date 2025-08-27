import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TestimonialFormSimple } from "@/components/TestimonialFormSimple";
import { MessageSquare, Star } from "lucide-react";
import { useState } from "react";

interface Agent {
  id: string;
  name: string;
  mobile_number: string;
  type: 'coordinator' | 'supervisor' | 'group_leader' | 'pro';
  ward?: number;
  panchayath_id: string;
  rating?: number; // For coordinators
}

interface AgentTestimonialCardProps {
  agent: Agent;
}

export const AgentTestimonialCard = ({ agent }: AgentTestimonialCardProps) => {
  const [showForm, setShowForm] = useState(false);
  
  // Mock testimonial score - in production this would come from the database
  const mockScore = Math.floor(Math.random() * 41) + 60; // Random score between 60-100%
  const mockReviews = Math.floor(Math.random() * 10) + 1; // Random reviews between 1-10
  
  const getScoreBadgeVariant = (percentage: number) => {
    if (percentage >= 80) return "default" as const;
    if (percentage >= 60) return "secondary" as const;
    return "destructive" as const;
  };

  const getRoleLabel = (type: string) => {
    switch (type) {
      case 'coordinator': return 'Coordinator';
      case 'supervisor': return 'Supervisor';
      case 'group_leader': return 'Group Leader';
      case 'pro': return 'PRO';
      default: return type;
    }
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{agent.name}</span>
          <Badge variant="outline" className="text-xs">
            {getRoleLabel(agent.type)}
          </Badge>
          {agent.ward && (
            <Badge variant="secondary" className="text-xs">
              Ward {agent.ward}
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {agent.mobile_number}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="text-right">
          <Badge variant={getScoreBadgeVariant(mockScore)} className="text-xs">
            <Star className="h-3 w-3 mr-1" />
            {mockScore}%
          </Badge>
          <div className="text-xs text-muted-foreground mt-1">
            {mockReviews} review{mockReviews !== 1 ? 's' : ''}
          </div>
        </div>
        
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs h-8">
              <MessageSquare className="h-3 w-3 mr-1" />
              Review
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agent Testimonial</DialogTitle>
              <DialogDescription>
                Provide feedback for {agent.name} - {getRoleLabel(agent.type)}
              </DialogDescription>
            </DialogHeader>
            <TestimonialFormSimple 
              agent={agent} 
              onClose={() => setShowForm(false)} 
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};