import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TestimonialFormSimple } from "@/components/TestimonialFormSimple";
import { MessageSquare, Star, TrendingUp } from "lucide-react";
import { User } from "@/lib/authService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AgentTestimonialProfileProps {
  currentUser: User;
}

interface TestimonialStats {
  totalResponses: number;
  averageScore: number;
  percentage: number;
  recentScore?: number;
}

export const AgentTestimonialProfile = ({ currentUser }: AgentTestimonialProfileProps) => {
  const [showForm, setShowForm] = useState(false);
  const [stats, setStats] = useState<TestimonialStats>({
    totalResponses: 0,
    averageScore: 0,
    percentage: 0
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTestimonialStats();
  }, [currentUser]);

  const loadTestimonialStats = async () => {
    try {
      // For now, using mock data since testimonial tables might not be set up yet
      // In production, this would query the testimonial_responses table
      const mockStats = {
        totalResponses: Math.floor(Math.random() * 15) + 5,
        averageScore: Math.floor(Math.random() * 40) + 60,
        percentage: Math.floor(Math.random() * 40) + 60,
        recentScore: Math.floor(Math.random() * 40) + 60
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading testimonial stats:', error);
    }
  };

  const getScoreBadgeVariant = (percentage: number) => {
    if (percentage >= 80) return "default" as const;
    if (percentage >= 60) return "secondary" as const;
    return "destructive" as const;
  };

  // Convert user to agent format for the testimonial form
  const agentData = {
    id: currentUser.id,
    name: currentUser.name,
    mobile_number: currentUser.mobile_number,
    type: currentUser.role as 'coordinator' | 'supervisor' | 'group_leader' | 'pro',
    ward: currentUser.ward,
    panchayath_id: currentUser.panchayath_id || ''
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          My Testimonials
        </CardTitle>
        <CardDescription>
          View and manage your testimonials and feedback
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary mb-1">{stats.totalResponses}</div>
            <div className="text-sm text-muted-foreground">Total Reviews</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-2xl font-bold">{stats.percentage}%</span>
            </div>
            <div className="text-sm text-muted-foreground">Average Score</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <Badge variant={getScoreBadgeVariant(stats.recentScore || 0)}>
                {stats.recentScore || 0}%
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">Latest Score</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <MessageSquare className="h-4 w-4 mr-2" />
                Get New Review
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Agent Testimonial</DialogTitle>
                <DialogDescription>
                  Share this form with someone to collect feedback about your service
                </DialogDescription>
              </DialogHeader>
              <TestimonialFormSimple 
                agent={agentData} 
                currentUser={currentUser}
                onClose={() => {
                  setShowForm(false);
                  loadTestimonialStats(); // Refresh stats after new testimonial
                }} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};