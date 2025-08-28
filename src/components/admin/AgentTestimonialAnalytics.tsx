import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Star, History, Edit, Trash, Phone, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface HierarchyAgent {
  id: string;
  name: string;
  mobile: string;
  type: 'coordinator' | 'supervisor' | 'group_leader' | 'pro';
  ward?: number | number[];
  rating?: number;
  panchayath_id: string;
  testimonialCount: number;
  averageScore: number;
}

interface HierarchyStructure {
  coordinator?: HierarchyAgent;
  supervisors: HierarchyAgent[];
  groupLeaders: HierarchyAgent[];
  pros: HierarchyAgent[];
}

export const AgentTestimonialAnalytics = () => {
  const [hierarchyData, setHierarchyData] = useState<HierarchyStructure>({
    supervisors: [],
    groupLeaders: [],
    pros: []
  });
  const [panchayaths, setPanchayaths] = useState<any[]>([]);
  const [selectedPanchayath, setSelectedPanchayath] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPanchayaths();
  }, []);

  useEffect(() => {
    if (selectedPanchayath) {
      fetchHierarchyData();
    } else {
      setHierarchyData({ supervisors: [], groupLeaders: [], pros: [] });
    }
  }, [selectedPanchayath]);

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

  const fetchHierarchyData = async () => {
    if (!selectedPanchayath) return;
    
    setLoading(true);
    try {
      // Fetch coordinator
      const { data: coordinatorData } = await supabase
        .from("coordinators")
        .select("*")
        .eq("panchayath_id", selectedPanchayath)
        .limit(1);

      // Fetch supervisors
      const { data: supervisorData } = await supabase
        .from("supervisors")
        .select(`
          *,
          supervisor_wards(ward)
        `)
        .eq("panchayath_id", selectedPanchayath);

      // Fetch group leaders
      const { data: groupLeaderData } = await supabase
        .from("group_leaders")
        .select("*")
        .eq("panchayath_id", selectedPanchayath);

      // Fetch pros
      const { data: proData } = await supabase
        .from("pros")
        .select("*")
        .eq("panchayath_id", selectedPanchayath);

      // Get testimonial stats for each agent
      const getAllTestimonialStats = async (agentIds: string[], agentType: string) => {
        const { data: testimonialData } = await supabase
          .from("testimonial_responses")
          .select("agent_id, score")
          .eq("agent_type", agentType)
          .in("agent_id", agentIds);

        const stats = agentIds.map(agentId => {
          const agentTestimonials = testimonialData?.filter(t => t.agent_id === agentId) || [];
          const averageScore = agentTestimonials.length > 0 
            ? agentTestimonials.reduce((sum, t) => sum + t.score, 0) / agentTestimonials.length 
            : 0;
          
          return {
            agentId,
            testimonialCount: agentTestimonials.length,
            averageScore: Math.round(averageScore)
          };
        });

        return stats;
      };

      const coordinatorStats = coordinatorData?.length > 0 
        ? await getAllTestimonialStats([coordinatorData[0].id], 'coordinator')
        : [];

      const supervisorStats = supervisorData?.length > 0 
        ? await getAllTestimonialStats(supervisorData.map(s => s.id), 'supervisor')
        : [];

      const groupLeaderStats = groupLeaderData?.length > 0 
        ? await getAllTestimonialStats(groupLeaderData.map(gl => gl.id), 'group_leader')
        : [];

      const proStats = proData?.length > 0 
        ? await getAllTestimonialStats(proData.map(p => p.id), 'pro')
        : [];

      // Build hierarchy structure
      const hierarchy: HierarchyStructure = {
        supervisors: [],
        groupLeaders: [],
        pros: []
      };

      if (coordinatorData?.length > 0) {
        const coord = coordinatorData[0];
        const stats = coordinatorStats.find(s => s.agentId === coord.id);
        hierarchy.coordinator = {
          id: coord.id,
          name: coord.name,
          mobile: coord.mobile_number,
          type: 'coordinator',
          ward: coord.ward,
          rating: coord.rating,
          panchayath_id: coord.panchayath_id,
          testimonialCount: stats?.testimonialCount || 0,
          averageScore: stats?.averageScore || 0
        };
      }

      if (supervisorData?.length > 0) {
        hierarchy.supervisors = supervisorData.map(supervisor => {
          const stats = supervisorStats.find(s => s.agentId === supervisor.id);
          return {
            id: supervisor.id,
            name: supervisor.name,
            mobile: supervisor.mobile_number,
            type: 'supervisor' as const,
            ward: supervisor.supervisor_wards?.map((sw: any) => sw.ward) || [],
            panchayath_id: supervisor.panchayath_id,
            testimonialCount: stats?.testimonialCount || 0,
            averageScore: stats?.averageScore || 0
          };
        });
      }

      if (groupLeaderData?.length > 0) {
        hierarchy.groupLeaders = groupLeaderData.map(groupLeader => {
          const stats = groupLeaderStats.find(s => s.agentId === groupLeader.id);
          return {
            id: groupLeader.id,
            name: groupLeader.name,
            mobile: groupLeader.mobile_number,
            type: 'group_leader' as const,
            ward: groupLeader.ward,
            panchayath_id: groupLeader.panchayath_id,
            testimonialCount: stats?.testimonialCount || 0,
            averageScore: stats?.averageScore || 0
          };
        });
      }

      if (proData?.length > 0) {
        hierarchy.pros = proData.map(pro => {
          const stats = proStats.find(s => s.agentId === pro.id);
          return {
            id: pro.id,
            name: pro.name,
            mobile: pro.mobile_number,
            type: 'pro' as const,
            ward: pro.ward,
            panchayath_id: pro.panchayath_id,
            testimonialCount: stats?.testimonialCount || 0,
            averageScore: stats?.averageScore || 0
          };
        });
      }

      setHierarchyData(hierarchy);
    } catch (error) {
      console.error("Error fetching hierarchy data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch agent data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (type: string) => {
    switch (type) {
      case 'coordinator': return 'bg-green-100 text-green-800 border-green-200';
      case 'supervisor': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'group_leader': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'pro': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 8) return "default";
    if (score >= 6) return "secondary";
    return "destructive";
  };

  const handleViewTestimonialHistory = (agent: HierarchyAgent) => {
    toast({
      title: "Testimonial History",
      description: `Viewing testimonials for ${agent.name} - ${agent.testimonialCount} reviews`,
    });
  };

  const AgentCard = ({ agent, indentLevel = 0 }: { agent: HierarchyAgent; indentLevel?: number }) => (
    <div 
      className={`border-l-4 ${
        agent.type === 'coordinator' ? 'border-green-500' :
        agent.type === 'supervisor' ? 'border-blue-500' :
        agent.type === 'group_leader' ? 'border-orange-500' :
        'border-purple-500'
      }`}
      style={{ marginLeft: indentLevel * 20 }}
    >
      <Card className="ml-4 mb-3">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={getRoleBadgeColor(agent.type)}>
                  {getRoleLabel(agent.type)}
                </Badge>
                <span className="font-semibold text-lg">{agent.name}</span>
                {agent.ward && (
                  <Badge variant="secondary" className="text-xs">
                    {Array.isArray(agent.ward) 
                      ? `Wards: ${agent.ward.join(', ')}`
                      : `Ward ${agent.ward}`
                    }
                  </Badge>
                )}
                {agent.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">{agent.rating}/10</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {agent.mobile}
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  {agent.testimonialCount} testimonials
                </div>
                {agent.averageScore > 0 && (
                  <Badge variant={getScoreBadgeVariant(agent.averageScore)} className="text-xs">
                    Avg: {agent.averageScore}/10
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewTestimonialHistory(agent)}
                className="flex items-center gap-1"
              >
                <History className="h-4 w-4" />
                History
              </Button>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Agent Testimonial Management
          </CardTitle>
          <CardDescription>
            Select a panchayath to view agent hierarchy and testimonial history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Select value={selectedPanchayath} onValueChange={setSelectedPanchayath}>
              <SelectTrigger className="w-full md:w-80">
                <SelectValue placeholder="Select Panchayath" />
              </SelectTrigger>
              <SelectContent>
                {panchayaths.filter(p => p.id && p.id.trim()).map((panchayath) => (
                  <SelectItem key={panchayath.id} value={panchayath.id}>
                    {panchayath.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading agent hierarchy...</p>
            </div>
          ) : selectedPanchayath ? (
            <div className="space-y-1">
              {/* Coordinator */}
              {hierarchyData.coordinator && (
                <AgentCard agent={hierarchyData.coordinator} indentLevel={0} />
              )}

              {/* Supervisors */}
              {hierarchyData.supervisors.map((supervisor, index) => (
                <div key={supervisor.id}>
                  <AgentCard agent={supervisor} indentLevel={1} />
                  
                  {/* Group Leaders under this supervisor */}
                  {hierarchyData.groupLeaders
                    .filter(gl => supervisor.ward && Array.isArray(supervisor.ward) && supervisor.ward.includes(gl.ward as number))
                    .map((groupLeader) => (
                      <div key={groupLeader.id}>
                        <AgentCard agent={groupLeader} indentLevel={2} />
                        
                        {/* PROs under this group leader */}
                        {hierarchyData.pros
                          .filter(pro => pro.ward === groupLeader.ward)
                          .map((pro) => (
                            <AgentCard key={pro.id} agent={pro} indentLevel={3} />
                          ))}
                      </div>
                    ))}
                </div>
              ))}

              {/* Unassigned Group Leaders and PROs */}
              {hierarchyData.groupLeaders
                .filter(gl => !hierarchyData.supervisors.some(s => 
                  Array.isArray(s.ward) && s.ward.includes(gl.ward as number)
                ))
                .map((groupLeader) => (
                  <div key={groupLeader.id}>
                    <AgentCard agent={groupLeader} indentLevel={1} />
                    {hierarchyData.pros
                      .filter(pro => pro.ward === groupLeader.ward)
                      .map((pro) => (
                        <AgentCard key={pro.id} agent={pro} indentLevel={2} />
                      ))}
                  </div>
                ))}

              {/* Unassigned PROs */}
              {hierarchyData.pros
                .filter(pro => !hierarchyData.groupLeaders.some(gl => gl.ward === pro.ward))
                .map((pro) => (
                  <AgentCard key={pro.id} agent={pro} indentLevel={1} />
                ))}

              {!hierarchyData.coordinator && 
               hierarchyData.supervisors.length === 0 && 
               hierarchyData.groupLeaders.length === 0 && 
               hierarchyData.pros.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No agents found for this panchayath</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Select a panchayath to view agent hierarchy</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};