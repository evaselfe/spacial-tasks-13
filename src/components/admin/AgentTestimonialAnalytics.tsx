import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MessageSquare, Star, TrendingUp, TrendingDown, Users, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Agent {
  id: string;
  name: string;
  mobile_number: string;
  type: 'coordinator' | 'supervisor' | 'group_leader' | 'pro';
  ward?: number;
  panchayath_id: string;
  panchayath_name?: string;
  totalReviews: number;
  averageScore: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export const AgentTestimonialAnalytics = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [panchayaths, setPanchayaths] = useState<any[]>([]);
  const [selectedPanchayath, setSelectedPanchayath] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPanchayaths();
    generateMockData();
  }, []);

  useEffect(() => {
    generateMockData();
  }, [selectedPanchayath, selectedRole]);

  const fetchPanchayaths = async () => {
    try {
      const { data, error } = await supabase
        .from("panchayaths")
        .select("*")
        .order("name");

      if (error) throw error;
      setPanchayaths(data || []);
    } catch (error) {
      console.error("Error fetching panchayaths:", error);
      toast({
        title: "Error",
        description: "Failed to fetch panchayaths",
        variant: "destructive",
      });
    }
  };

  const generateMockData = async () => {
    setLoading(true);
    try {
      // This is mock data. In production, this would query actual testimonial data
      // from testimonial_responses joined with agent tables
      
      const agentTypes = ['coordinator', 'supervisor', 'group_leader', 'pro'];
      const mockAgents: Agent[] = [];
      
      // Generate 15-20 mock agents with testimonial data
      for (let i = 0; i < Math.floor(Math.random() * 6) + 15; i++) {
        const agentType = agentTypes[Math.floor(Math.random() * agentTypes.length)] as Agent['type'];
        const panchayathId = selectedPanchayath || (panchayaths.length > 0 ? panchayaths[Math.floor(Math.random() * panchayaths.length)].id : 'mock');
        const panchayathName = panchayaths.find(p => p.id === panchayathId)?.name || 'Sample Panchayath';
        
        if (selectedRole && selectedRole !== agentType) continue;
        
        const totalReviews = Math.floor(Math.random() * 20) + 1;
        const averageScore = Math.floor(Math.random() * 40) + 60;
        const trends = ['up', 'down', 'stable'] as const;
        
        mockAgents.push({
          id: `agent_${i}`,
          name: `${agentType.charAt(0).toUpperCase() + agentType.slice(1)} ${i + 1}`,
          mobile_number: `987654${String(3210 + i).padStart(4, '0')}`,
          type: agentType,
          ward: agentType === 'group_leader' ? Math.floor(Math.random() * 10) + 1 : undefined,
          panchayath_id: panchayathId,
          panchayath_name: panchayathName,
          totalReviews,
          averageScore,
          percentage: averageScore,
          trend: trends[Math.floor(Math.random() * trends.length)]
        });
      }
      
      // Filter by search term
      const filteredAgents = searchTerm
        ? mockAgents.filter(agent => 
            agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            agent.mobile_number.includes(searchTerm) ||
            agent.panchayath_name?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : mockAgents;
      
      setAgents(filteredAgents.sort((a, b) => b.percentage - a.percentage));
    } catch (error) {
      console.error('Error generating mock data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const getTrendIcon = (trend: string, percentage: number) => {
    if (trend === 'up') return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="h-3 w-3 text-red-500" />;
    return <BarChart3 className="h-3 w-3 text-muted-foreground" />;
  };

  const overallStats = {
    totalAgents: agents.length,
    averageScore: agents.length > 0 ? Math.round(agents.reduce((sum, agent) => sum + agent.percentage, 0) / agents.length) : 0,
    totalReviews: agents.reduce((sum, agent) => sum + agent.totalReviews, 0),
    topPerformers: agents.filter(agent => agent.percentage >= 80).length
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">{overallStats.totalAgents}</div>
            <div className="text-sm text-muted-foreground">Total Agents</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-2xl font-bold">{overallStats.averageScore}%</span>
            </div>
            <div className="text-sm text-muted-foreground">Average Score</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">{overallStats.totalReviews}</div>
            <div className="text-sm text-muted-foreground">Total Reviews</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">{overallStats.topPerformers}</div>
            <div className="text-sm text-muted-foreground">Top Performers</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Agent Testimonial Analytics
          </CardTitle>
          <CardDescription>
            View and analyze testimonial data for all agents across panchayaths
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="panchayath-filter">Panchayath</Label>
              <Select value={selectedPanchayath} onValueChange={setSelectedPanchayath}>
                <SelectTrigger>
                  <SelectValue placeholder="All Panchayaths" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Panchayaths</SelectItem>
                  {panchayaths.map((panchayath) => (
                    <SelectItem key={panchayath.id} value={panchayath.id}>
                      {panchayath.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role-filter">Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Roles</SelectItem>
                  <SelectItem value="coordinator">Coordinator</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="group_leader">Group Leader</SelectItem>
                  <SelectItem value="pro">PRO</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by name, mobile, or panchayath..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={generateMockData} className="w-full">
                Refresh Data
              </Button>
            </div>
          </div>

          {/* Agent List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading agent testimonial data...</p>
            </div>
          ) : agents.length > 0 ? (
            <div className="space-y-3">
              {agents.map((agent) => (
                <Card key={agent.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{agent.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {getRoleLabel(agent.type)}
                          </Badge>
                          {agent.ward && (
                            <Badge variant="secondary" className="text-xs">
                              Ward {agent.ward}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {agent.mobile_number} • {agent.panchayath_name}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-sm font-medium">{agent.totalReviews}</div>
                          <div className="text-xs text-muted-foreground">Reviews</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="flex items-center gap-1">
                            <Badge variant={getScoreBadgeVariant(agent.percentage)} className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              {agent.percentage}%
                            </Badge>
                            {getTrendIcon(agent.trend, agent.percentage)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">Score</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No testimonial data found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Adjust your filters or check back later for testimonial data
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};