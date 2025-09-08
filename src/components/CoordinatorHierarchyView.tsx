import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CoordinatorHierarchyViewProps {
  panchayathId: string | null;
}

export const CoordinatorHierarchyView = ({ panchayathId }: CoordinatorHierarchyViewProps) => {
  const [hierarchyData, setHierarchyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [panchayathName, setPanchayathName] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (panchayathId) {
      fetchHierarchyData();
    }
  }, [panchayathId]);

  const fetchHierarchyData = async () => {
    if (!panchayathId) return;

    setLoading(true);
    try {
      // First get panchayath name
      const { data: panchayath } = await supabase
        .from('panchayaths')
        .select('name')
        .eq('id', panchayathId)
        .single();

      if (panchayath) {
        setPanchayathName(panchayath.name);
        
        // Fetch hierarchy data using the view
        const { data, error } = await supabase
          .from("hierarchy_view")
          .select("*")
          .eq("panchayath_name", panchayath.name)
          .order("coordinator_ward", { nullsFirst: false })
          .order("group_leader_ward", { nullsFirst: false });

        if (error) throw error;
        setHierarchyData(data || []);
      }
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

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading hierarchy data...</p>
      </div>
    );
  }

  if (!hierarchyData.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hierarchy data found for {panchayathName}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">{panchayathName} - Organizational Hierarchy</h3>
      </div>
      
      <div className="space-y-6">
        {/* Group by coordinator */}
        {Array.from(new Set(hierarchyData.map(item => item.coordinator_name)
          .filter(Boolean))).map(coordinatorName => {
          const coordinatorData = hierarchyData.find(item => item.coordinator_name === coordinatorName);
          const supervisors = hierarchyData.filter(item => 
            item.coordinator_name === coordinatorName && item.supervisor_name
          );
          
          return (
            <Card key={coordinatorName} className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                  <div className="flex-1">
                    <CardTitle className="text-base md:text-lg flex items-center gap-2 flex-wrap">
                      <Badge className="bg-primary text-primary-foreground text-xs">Coordinator</Badge>
                      <span className="break-words">{coordinatorData?.coordinator_name}</span>
                    </CardTitle>
                    <div className="text-xs md:text-sm text-muted-foreground space-y-1 md:space-y-0">
                      <div>Ward {coordinatorData?.coordinator_ward}</div>
                      <div>Mobile: {coordinatorData?.coordinator_mobile}</div>
                      {coordinatorData?.coordinator_rating && (
                        <div>Rating: {coordinatorData?.coordinator_rating}/10</div>
                      )}
                    </div>
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
                    <div key={supervisorName} className="ml-0 md:ml-4 mb-4 p-3 md:p-4 border-l-4 border-l-blue-500 border border-border rounded-lg bg-muted/30">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge className="bg-blue-500 text-white text-xs">Supervisor</Badge>
                            <span className="font-medium text-sm md:text-base break-words">{supervisorData?.supervisor_name}</span>
                          </div>
                          <div className="text-xs md:text-sm text-muted-foreground space-y-1 md:space-y-0">
                            <div>Mobile: {supervisorData?.supervisor_mobile}</div>
                            <div>Wards: {supervisorData?.supervisor_wards?.join(", ")}</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Group Leaders under this supervisor */}
                      <div className="space-y-3">
                        {Array.from(new Set(groupLeaders.map(gl => gl.group_leader_name).filter(Boolean))).map(groupLeaderName => {
                          const groupLeaderData = groupLeaders.find(gl => gl.group_leader_name === groupLeaderName);
                          const pros = hierarchyData.filter(item => 
                            item.group_leader_name === groupLeaderName && item.pro_name
                          );
                          
                          return (
                            <div key={groupLeaderName} className="ml-0 md:ml-4 p-3 border-l-4 border-l-green-500 border border-border rounded-lg bg-muted/20">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <Badge className="bg-green-500 text-white text-xs">Group Leader</Badge>
                                <span className="font-medium text-sm break-words">{groupLeaderData?.group_leader_name}</span>
                              </div>
                              <div className="text-xs text-muted-foreground mb-3">
                                <div>Ward {groupLeaderData?.group_leader_ward}</div>
                                <div>Mobile: {groupLeaderData?.group_leader_mobile}</div>
                              </div>
                              
                              {/* PROs under this group leader */}
                              {pros.length > 0 && (
                                <div className="space-y-2">
                                  <div className="text-xs font-medium text-muted-foreground">PROs:</div>
                                  {Array.from(new Set(pros.map(p => p.pro_name).filter(Boolean))).map(proName => {
                                    const proData = pros.find(p => p.pro_name === proName);
                                    return (
                                      <div key={proName} className="ml-0 md:ml-4 p-2 border-l-4 border-l-orange-500 border border-border rounded bg-muted/10">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <Badge className="bg-orange-500 text-white text-xs">PRO</Badge>
                                          <span className="text-xs font-medium break-words">{proData?.pro_name}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                          <div>Ward {proData?.pro_ward}</div>
                                          <div>Mobile: {proData?.pro_mobile}</div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};