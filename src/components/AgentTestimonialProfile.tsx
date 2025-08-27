import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TestimonialFormSimple } from "@/components/TestimonialFormSimple";
import { MessageSquare, Star, History, TrendingUp } from "lucide-react";
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
  const [showHistory, setShowHistory] = useState(false);
  const [stats, setStats] = useState<TestimonialStats>({
    totalResponses: 0,
    averageScore: 0,
    percentage: 0
  });
  const [testimonialHistory, setTestimonialHistory] = useState<any[]>([]);
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
      
      // Mock testimonial history
      const mockHistory = Array.from({ length: mockStats.totalResponses }, (_, i) => ({
        id: `testimonial_${i}`,
        respondent_name: `Respondent ${i + 1}`,
        score: Math.floor(Math.random() * 40) + 60,
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        responses: Math.floor(Math.random() * 4) + 1
      }));
      
      setTestimonialHistory(mockHistory.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (error) {
      console.error('Error loading testimonial stats:', error);
    }
  };

  const getScoreBadgeVariant = (percentage: number) => {
    if (percentage >= 80) return "default" as const;
    if (percentage >= 60) return "secondary" as const;
    return "destructive" as const;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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
              <Button className="flex-1">
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

          <Dialog open={showHistory} onOpenChange={setShowHistory}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1">
                <History className="h-4 w-4 mr-2" />
                View History
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Testimonial History</DialogTitle>
                <DialogDescription>
                  All feedback and reviews received over time
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 mt-4">
                {testimonialHistory.length > 0 ? (
                  testimonialHistory.map((testimonial) => (
                    <Card key={testimonial.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{testimonial.respondent_name}</span>
                          <Badge variant={getScoreBadgeVariant(testimonial.score)}>
                            <Star className="h-3 w-3 mr-1" />
                            {testimonial.score}%
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(testimonial.created_at)} • {testimonial.responses} questions answered
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No testimonials yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Share the testimonial form to start collecting feedback
                    </p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};