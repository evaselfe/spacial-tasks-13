import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TestimonialFormSimple } from "@/components/TestimonialFormSimple";
import { MessageSquare, Star, TrendingUp, History } from "lucide-react";
import { User } from "@/lib/authService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface AgentTestimonialProfileProps {
  currentUser: User;
}

interface TestimonialStats {
  totalResponses: number;
  averageScore: number;
  percentage: number;
  recentScore?: number;
}

interface TestimonialHistory {
  id: string;
  respondent_name: string;
  respondent_contact: string;
  score: number;
  response: string;
  created_at: string;
  question_id: string;
}

export const AgentTestimonialProfile = ({ currentUser }: AgentTestimonialProfileProps) => {
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [stats, setStats] = useState<TestimonialStats>({
    totalResponses: 0,
    averageScore: 0,
    percentage: 0
  });
  const [testimonialHistory, setTestimonialHistory] = useState<TestimonialHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTestimonialStats();
  }, [currentUser]);

  const loadTestimonialStats = async () => {
    try {
      setLoading(true);
      
      console.log('Loading testimonial stats for:', { 
        agent_id: currentUser.id, 
        agent_type: currentUser.role 
      });
      
      // Fetch real testimonial data from database
      const { data: testimonialData, error } = await supabase
        .from('testimonial_responses')
        .select('score, created_at')
        .eq('agent_id', currentUser.id)
        .eq('agent_type', currentUser.role);

      console.log('Testimonial stats query result:', { testimonialData, error });

      if (error) {
        console.error('Error fetching testimonial stats:', error);
        toast({
          title: "Error loading stats",
          description: error.message,
          variant: "destructive",
        });
        // Fall back to empty data if there's an error
        const mockStats = {
          totalResponses: 0,
          averageScore: 0,
          percentage: 0,
          recentScore: 0
        };
        setStats(mockStats);
        return;
      }

      if (testimonialData && testimonialData.length > 0) {
        const totalResponses = testimonialData.length;
        const totalScore = testimonialData.reduce((sum, item) => sum + item.score, 0);
        const averageScore = totalScore / totalResponses;
        const percentage = (averageScore / 10) * 100; // Convert to percentage (assuming max score is 10)
        
        // Get most recent score
        const sortedByDate = testimonialData.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const recentScore = sortedByDate.length > 0 ? (sortedByDate[0].score / 10) * 100 : 0;

        setStats({
          totalResponses,
          averageScore,
          percentage: Math.round(percentage),
          recentScore: Math.round(recentScore)
        });
      } else {
        // No testimonials yet
        setStats({
          totalResponses: 0,
          averageScore: 0,
          percentage: 0,
          recentScore: 0
        });
      }
    } catch (error) {
      console.error('Error loading testimonial stats:', error);
      setStats({
        totalResponses: 0,
        averageScore: 0,
        percentage: 0,
        recentScore: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTestimonialHistory = async () => {
    try {
      setHistoryLoading(true);
      
      console.log('Loading testimonial history for:', { 
        agent_id: currentUser.id, 
        agent_type: currentUser.role 
      });
      
      const { data: historyData, error } = await supabase
        .from('testimonial_responses')
        .select('*')
        .eq('agent_id', currentUser.id)
        .eq('agent_type', currentUser.role)
        .order('created_at', { ascending: false });

      console.log('Testimonial history query result:', { historyData, error });

      if (error) {
        console.error('Error fetching testimonial history:', error);
        toast({
          title: "Error",
          description: `Failed to load testimonial history: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      setTestimonialHistory(historyData || []);
    } catch (error) {
      console.error('Error loading testimonial history:', error);
      toast({
        title: "Error",
        description: "Failed to load testimonial history",
        variant: "destructive",
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  const getScoreBadgeVariant = (percentage: number) => {
    if (percentage >= 80) return "default" as const;
    if (percentage >= 60) return "secondary" as const;
    return "destructive" as const;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy 'at' HH:mm");
  };

  const getResponseLabel = (response: string) => {
    switch (response) {
      case 'yes': return 'Yes';
      case 'little': return 'Somewhat';
      case 'no': return 'No';
      default: return response;
    }
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
                  loadTestimonialStats();
                }} 
              />
            </DialogContent>
          </Dialog>

          <Dialog open={showHistory} onOpenChange={setShowHistory}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={loadTestimonialHistory}
              >
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
                {historyLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading history...</p>
                    </div>
                  </div>
                ) : testimonialHistory.length > 0 ? (
                  testimonialHistory.map((testimonial) => (
                    <Card key={testimonial.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{testimonial.respondent_name}</span>
                          <Badge variant={getScoreBadgeVariant((testimonial.score / 10) * 100)}>
                            <Star className="h-3 w-3 mr-1" />
                            {testimonial.score}/10
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          Response: {getResponseLabel(testimonial.response)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(testimonial.created_at)}
                          {testimonial.respondent_contact && (
                            <span> • {testimonial.respondent_contact}</span>
                          )}
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