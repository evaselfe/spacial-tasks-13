import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const PanchayathView = () => {
  const [panchayaths, setPanchayaths] = useState<any[]>([]);
  const [selectedPanchayath, setSelectedPanchayath] = useState("");
  const [hierarchyData, setHierarchyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPanchayaths();
  }, []);

  useEffect(() => {
    if (selectedPanchayath) {
      fetchHierarchyData();
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
    }
  };

  const fetchHierarchyData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("hierarchy_view")
        .select("*")
        .eq("panchayath_name", panchayaths.find(p => p.id === selectedPanchayath)?.name)
        .order("coordinator_ward", { nullsFirst: false })
        .order("group_leader_ward", { nullsFirst: false });

      if (error) throw error;
      setHierarchyData(data || []);
    } catch (error) {
      console.error("Error fetching hierarchy data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch hierarchy data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (type: string, data: any) => {
    toast({
      title: "Edit Feature",
      description: `Edit ${type} functionality will be implemented soon`,
    });
    // TODO: Implement edit functionality for each role type
    console.log(`Edit ${type}:`, data);
  };

  const handleDelete = async (type: string, id: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      let tableName: string;
      switch (type) {
        case "coordinator":
          tableName = "coordinators";
          break;
        case "supervisor":
          tableName = "supervisors";
          break;
        case "group_leader":
          tableName = "group_leaders";
          break;
        case "pro":
          tableName = "pros";
          break;
        default:
          throw new Error("Invalid type");
      }

      const { error } = await supabase
        .from(tableName as any)
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${type} deleted successfully`,
      });
      
      fetchHierarchyData();
    } catch (error: any) {
      console.error(`Error deleting ${type}:`, error);
      toast({
        title: "Error",
        description: error.message || `Failed to delete ${type}`,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>View Panchayath Hierarchy</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Panchayath</label>
          <Select value={selectedPanchayath} onValueChange={setSelectedPanchayath}>
            <SelectTrigger>
              <SelectValue placeholder="Select a panchayath to view" />
            </SelectTrigger>
            <SelectContent>
              {panchayaths.map((panchayath) => (
                <SelectItem key={panchayath.id} value={panchayath.id}>
                  {panchayath.name} ({panchayath.number_of_wards} wards)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedPanchayath && (
          <div className="space-y-4">
            {loading ? (
              <p>Loading hierarchy data...</p>
            ) : hierarchyData.length === 0 ? (
              <p className="text-muted-foreground">No hierarchy data found for this panchayath.</p>
            ) : (
              <div className="space-y-6">
                {/* Group by coordinator */}
                {Array.from(new Set(hierarchyData.map(item => item.coordinator_name)
                  .filter(Boolean))).map(coordinatorName => {
                  const coordinatorData = hierarchyData.find(item => item.coordinator_name === coordinatorName);
                  const supervisors = hierarchyData.filter(item => 
                    item.coordinator_name === coordinatorName && item.supervisor_name
                  );
                  
                  return (
                    <Card key={coordinatorName} className="border-l-4 border-l-coordinator">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Badge className="bg-coordinator text-coordinator-foreground">Coordinator</Badge>
                              {coordinatorData?.coordinator_name}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              Ward {coordinatorData?.coordinator_ward} | 
                              Mobile: {coordinatorData?.coordinator_mobile} | 
                              Rating: {coordinatorData?.coordinator_rating}/10
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEdit("coordinator", coordinatorData)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDelete("coordinator", coordinatorData?.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {/* Supervisors under this coordinator */}
                        {Array.from(new Set(supervisors.map(s => s.supervisor_name).filter(Boolean))).map(supervisorName => {
                          const supervisorData = supervisors.find(s => s.supervisor_name === supervisorName);
                          const groupLeaders = hierarchyData.filter(item => 
                            item.supervisor_name === supervisorName && item.group_leader_name
                          );
                          
                          return (
                            <div key={supervisorName} className="ml-4 mb-4 p-4 border-l-4 border-l-supervisor border border-border rounded-lg bg-muted/30">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge className="bg-supervisor text-supervisor-foreground">Supervisor</Badge>
                                    <span className="font-medium">{supervisorData?.supervisor_name}</span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Mobile: {supervisorData?.supervisor_mobile} | 
                                    Wards: {supervisorData?.supervisor_wards?.join(", ")}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleEdit("supervisor", supervisorData)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleDelete("supervisor", supervisorData?.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Group Leaders under this supervisor */}
                              {Array.from(new Set(groupLeaders.map(gl => gl.group_leader_name).filter(Boolean))).map(groupLeaderName => {
                                const groupLeaderData = groupLeaders.find(gl => gl.group_leader_name === groupLeaderName);
                                const pros = hierarchyData.filter(item => 
                                  item.group_leader_name === groupLeaderName && item.pro_name
                                );
                                
                                return (
                                  <div key={groupLeaderName} className="ml-4 mb-3 p-3 border-l-4 border-l-group-leader border border-border rounded bg-background">
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <div className="flex items-center gap-2 mb-1">
                                          <Badge className="bg-group-leader text-group-leader-foreground">Group Leader</Badge>
                                          <span className="font-medium">{groupLeaderData?.group_leader_name}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                          Ward {groupLeaderData?.group_leader_ward} | 
                                          Mobile: {groupLeaderData?.group_leader_mobile}
                                        </p>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          onClick={() => handleEdit("group_leader", groupLeaderData)}
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          onClick={() => handleDelete("group_leader", groupLeaderData?.id)}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                    
                                    {/* PROs under this group leader */}
                                    {pros.filter(p => p.pro_name).map((pro, index) => (
                                      <div key={index} className="ml-4 p-2 border-l-4 border-l-pro">
                                        <div className="flex justify-between items-center">
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <Badge className="bg-pro text-pro-foreground text-xs">PRO</Badge>
                                              <span className="text-sm font-medium">{pro.pro_name}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                              Ward {pro.pro_ward} | Mobile: {pro.pro_mobile}
                                            </p>
                                          </div>
                                          <div className="flex gap-2">
                                            <Button 
                                              size="sm" 
                                              variant="outline" 
                                              className="h-6 w-6 p-0"
                                              onClick={() => handleEdit("pro", pro)}
                                            >
                                              <Edit className="h-3 w-3" />
                                            </Button>
                                            <Button 
                                              size="sm" 
                                              variant="outline" 
                                              className="h-6 w-6 p-0"
                                              onClick={() => handleDelete("pro", pro.id)}
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};