import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Edit, Search, Phone, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CoordinatorForm } from "./CoordinatorForm";
import { SupervisorForm } from "./SupervisorForm";
import { GroupLeaderForm } from "./GroupLeaderForm";
import { ProForm } from "./ProForm";

interface AgentsListProps {
  selectedPanchayath: any;
  selectedRole: string;
}

export const AgentsList = ({ selectedPanchayath, selectedRole }: AgentsListProps) => {
  const [agents, setAgents] = useState<any[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedPanchayath && selectedRole) {
      fetchAgents();
    }
  }, [selectedPanchayath, selectedRole]);

  useEffect(() => {
    const filtered = agents.filter(agent =>
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.mobile_number.includes(searchTerm)
    );
    setFilteredAgents(filtered);
  }, [searchTerm, agents]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      let query;
      
      switch (selectedRole) {
        case "coordinator":
          query = supabase
            .from("coordinators")
            .select("*")
            .eq("panchayath_id", selectedPanchayath.id)
            .order("name");
          break;
        case "supervisor":
          query = supabase
            .from("supervisors")
            .select("*, supervisor_wards(ward)")
            .eq("panchayath_id", selectedPanchayath.id)
            .order("name");
          break;
        case "group-leader":
          query = supabase
            .from("group_leaders")
            .select("*")
            .eq("panchayath_id", selectedPanchayath.id)
            .order("name");
          break;
        case "pro":
          query = supabase
            .from("pros")
            .select("*")
            .eq("panchayath_id", selectedPanchayath.id)
            .order("name");
          break;
        default:
          setLoading(false);
          return;
      }

      const { data, error } = await query;

      if (error) throw error;
      setAgents(data || []);
    } catch (error: any) {
      console.error("Error fetching agents:", error);
      toast({
        title: "Error",
        description: "Failed to fetch agents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (agent: any) => {
    setEditingAgent(agent);
  };

  const handleEditComplete = () => {
    setEditingAgent(null);
    fetchAgents(); // Refresh the list
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "coordinator": return "bg-coordinator text-white";
      case "supervisor": return "bg-supervisor text-white";
      case "group-leader": return "bg-group-leader text-white";
      case "pro": return "bg-pro text-white";
      default: return "bg-muted";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "coordinator": return "Coordinators";
      case "supervisor": return "Supervisors";
      case "group-leader": return "Group Leaders";
      case "pro": return "PROs";
      default: return "Agents";
    }
  };

  const formatWards = (agent: any) => {
    if (selectedRole === "supervisor" && agent.supervisor_wards) {
      return agent.supervisor_wards.map((w: any) => w.ward).sort((a: number, b: number) => a - b).join(", ");
    }
    return agent.ward?.toString() || "N/A";
  };

  if (editingAgent) {
    const commonProps = {
      selectedPanchayath,
      onEditComplete: handleEditComplete,
    };

    switch (selectedRole) {
      case "coordinator":
        return <CoordinatorForm {...commonProps} editingCoordinator={editingAgent} />;
      case "supervisor":
        return <SupervisorForm {...commonProps} editingSupervisor={editingAgent} />;
      case "group-leader":
        return <GroupLeaderForm {...commonProps} editingGroupLeader={editingAgent} />;
      case "pro":
        return <ProForm {...commonProps} editingPro={editingAgent} />;
      default:
        return null;
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className={`h-4 w-4 rounded-full ${getRoleColor(selectedRole).split(' ')[0]}`}></div>
          Existing {getRoleLabel(selectedRole)} - {selectedPanchayath.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={`Search ${getRoleLabel(selectedRole).toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading {getRoleLabel(selectedRole).toLowerCase()}...</p>
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm 
                  ? `No ${getRoleLabel(selectedRole).toLowerCase()} found matching "${searchTerm}"` 
                  : `No ${getRoleLabel(selectedRole).toLowerCase()} found for this panchayath`
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredAgents.map((agent) => (
                <Card key={agent.id} className="border border-border hover:border-primary/40 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-foreground">{agent.name}</h3>
                          <Badge className={getRoleColor(selectedRole)}>
                            {getRoleLabel(selectedRole).slice(0, -1)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{agent.mobile_number}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>
                              {selectedRole === "supervisor" 
                                ? `Wards: ${formatWards(agent)}`
                                : `Ward ${formatWards(agent)}`
                              }
                            </span>
                          </div>
                          {selectedRole === "coordinator" && agent.rating && (
                            <div className="flex items-center gap-2">
                              <span>⭐ Rating: {agent.rating}/10</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(agent)}
                        className="ml-4"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};