import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Users, MapPin, Building, BarChart3, Edit, Trash2, MessageSquare, ChevronDown, ChevronRight, Eye, EyeOff, User, UserCheck } from "lucide-react";
import { PanchayathChart } from "@/components/PanchayathChart";
import { PanchayathForm } from "@/components/PanchayathForm";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PanchayathData {
  id: string;
  name: string;
  number_of_wards: number;
  coordinator_count: number;
  supervisor_count: number;
  group_leader_count: number;
  pro_count: number;
  coordinators?: any[];
  supervisors?: any[];
  group_leaders?: any[];
  pros?: any[];
}

export const PanchayathHierarchy = () => {
  const [panchayaths, setPanchayaths] = useState<PanchayathData[]>([]);
  const [filteredPanchayaths, setFilteredPanchayaths] = useState<PanchayathData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingPanchayath, setEditingPanchayath] = useState<any>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [expandedRoleCards, setExpandedRoleCards] = useState<Record<string, boolean>>({});
  const [showAgentNames, setShowAgentNames] = useState<Record<string, boolean>>({
    coordinator: true,
    supervisor: true,
    group_leader: false,
    pro: false
  });
  const { toast } = useToast();

  const fetchPanchayaths = async () => {
    try {
      const { data, error } = await supabase
        .from("panchayaths")
        .select(`
          id,
          name,
          number_of_wards,
          coordinators:coordinators(id, name, mobile),
          supervisors:supervisors(id, name, mobile, coordinator_id, coordinators!inner(name)),
          group_leaders:group_leaders(id, name, mobile, supervisor_id, supervisors!inner(name)),
          pros:pros(id, name, mobile, group_leader_id, group_leaders!inner(name))
        `);

      if (error) throw error;

      const panchayathsWithCounts = data?.map(p => ({
        id: p.id,
        name: p.name,
        number_of_wards: p.number_of_wards,
        coordinator_count: p.coordinators?.length || 0,
        supervisor_count: p.supervisors?.length || 0,
        group_leader_count: p.group_leaders?.length || 0,
        pro_count: p.pros?.length || 0,
        coordinators: p.coordinators || [],
        supervisors: p.supervisors || [],
        group_leaders: p.group_leaders || [],
        pros: p.pros || [],
      })) || [];

      setPanchayaths(panchayathsWithCounts);
      setFilteredPanchayaths(panchayathsWithCounts);
    } catch (error: any) {
      console.error("Error fetching panchayaths:", error);
      toast({
        title: "Error",
        description: "Failed to fetch panchayaths",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPanchayaths();
  }, []);

  useEffect(() => {
    const filtered = panchayaths.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Sort by total agents (high to low)
    const sorted = filtered.sort((a, b) => {
      const totalA = a.coordinator_count + a.supervisor_count + a.group_leader_count + a.pro_count;
      const totalB = b.coordinator_count + b.supervisor_count + b.group_leader_count + b.pro_count;
      return totalB - totalA;
    });
    
    setFilteredPanchayaths(sorted);
  }, [searchTerm, panchayaths]);

  const handleEdit = (panchayath: PanchayathData) => {
    setEditingPanchayath({
      id: panchayath.id,
      name: panchayath.name,
      number_of_wards: panchayath.number_of_wards
    });
    setShowEditForm(true);
  };

  const handleDelete = async (panchayathId: string, panchayathName: string) => {
    try {
      const { error } = await supabase
        .from("panchayaths")
        .delete()
        .eq("id", panchayathId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${panchayathName} has been deleted successfully`,
      });

      // Refresh the list
      fetchPanchayaths();
    } catch (error: any) {
      console.error("Error deleting panchayath:", error);
      toast({
        title: "Error",
        description: "Failed to delete panchayath",
        variant: "destructive",
      });
    }
  };

  const handleEditComplete = () => {
    setShowEditForm(false);
    setEditingPanchayath(null);
    fetchPanchayaths();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "coordinator": return "bg-coordinator";
      case "supervisor": return "bg-supervisor";
      case "group-leader": return "bg-group-leader";
      case "pro": return "bg-pro";
      default: return "bg-muted";
    }
  };

  const toggleCardExpansion = (cardId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const toggleRoleCardExpansion = (cardId: string) => {
    setExpandedRoleCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const toggleAgentNameVisibility = (role: string) => {
    setShowAgentNames(prev => ({
      ...prev,
      [role]: !prev[role]
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading panchayath hierarchy...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showEditForm) {
    return (
      <div className="space-y-6">
        <PanchayathForm
          officerId="admin"
          editingPanchayath={editingPanchayath}
          onEditComplete={handleEditComplete}
          onPanchayathCreated={() => {}}
          onPanchayathDeleted={() => {}}
        />
        <Button
          variant="outline"
          onClick={() => setShowEditForm(false)}
          className="mb-4"
        >
          Back to Hierarchy
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Panchayath Hierarchy & Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="list" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                List View
              </TabsTrigger>
              <TabsTrigger value="chart" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Chart View
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="list">
                <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 mb-4 p-2 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground">Show Names:</span>
                  {Object.entries(showAgentNames).map(([role, isVisible]) => (
                    <Button
                      key={role}
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAgentNameVisibility(role)}
                      className="h-8 text-xs"
                    >
                      {isVisible ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                      {role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
                    </Button>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search panchayaths..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="grid gap-4">
                    {filteredPanchayaths.map((panchayath) => (
                      <Collapsible key={panchayath.id} open={expandedCards[panchayath.id] ?? true}>
                        <Card className="border border-border hover:border-primary/40 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <CollapsibleTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleCardExpansion(panchayath.id)}
                                      className="h-6 w-6 p-0"
                                    >
                                      {expandedCards[panchayath.id] ?? true ? (
                                        <ChevronDown className="h-4 w-4" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </CollapsibleTrigger>
                                  <h3 className="text-lg font-semibold text-primary">{panchayath.name}</h3>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 ml-8">
                                  <MapPin className="h-4 w-4" />
                                  <span>{panchayath.number_of_wards} wards</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-primary/10">
                                  <Users className="h-3 w-3 mr-1" />
                                  Total: {panchayath.coordinator_count + panchayath.supervisor_count + panchayath.group_leader_count + panchayath.pro_count}
                                </Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(panchayath)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Panchayath</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete "{panchayath.name}"? This action cannot be undone and will also delete all associated coordinators, supervisors, group leaders, and PROs.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(panchayath.id, panchayath.name)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>

                            <CollapsibleContent>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Coordinators Card */}
                                <Collapsible open={expandedRoleCards[`${panchayath.id}-coordinator`] ?? false}>
                                  <Card className="border border-coordinator/20 bg-coordinator/5">
                                    <CardContent className="p-3">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <div className="h-3 w-3 rounded-full bg-coordinator"></div>
                                          <span className="text-sm font-medium">Coordinators</span>
                                          <Badge variant="secondary" className="h-5 text-xs">
                                            {panchayath.coordinator_count}
                                          </Badge>
                                        </div>
                                        <CollapsibleTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleRoleCardExpansion(`${panchayath.id}-coordinator`)}
                                            className="h-6 w-6 p-0"
                                          >
                                            {expandedRoleCards[`${panchayath.id}-coordinator`] ? (
                                              <ChevronDown className="h-3 w-3" />
                                            ) : (
                                              <ChevronRight className="h-3 w-3" />
                                            )}
                                          </Button>
                                        </CollapsibleTrigger>
                                      </div>
                                      <CollapsibleContent>
                                        <div className="space-y-1 pl-5">
                                          {panchayath.coordinators?.map((coordinator: any) => (
                                            <div key={coordinator.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                                              <User className="h-3 w-3" />
                                              <span>{showAgentNames.coordinator ? coordinator.name : '***'}</span>
                                            </div>
                                          ))}
                                          {panchayath.coordinators?.length === 0 && (
                                            <p className="text-xs text-muted-foreground pl-5">No coordinators assigned</p>
                                          )}
                                        </div>
                                      </CollapsibleContent>
                                    </CardContent>
                                  </Card>
                                </Collapsible>

                                {/* Supervisors Card */}
                                <Collapsible open={expandedRoleCards[`${panchayath.id}-supervisor`] ?? false}>
                                  <Card className="border border-supervisor/20 bg-supervisor/5">
                                    <CardContent className="p-3">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <div className="h-3 w-3 rounded-full bg-supervisor"></div>
                                          <span className="text-sm font-medium">Supervisors</span>
                                          <Badge variant="secondary" className="h-5 text-xs">
                                            {panchayath.supervisor_count}
                                          </Badge>
                                        </div>
                                        <CollapsibleTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleRoleCardExpansion(`${panchayath.id}-supervisor`)}
                                            className="h-6 w-6 p-0"
                                          >
                                            {expandedRoleCards[`${panchayath.id}-supervisor`] ? (
                                              <ChevronDown className="h-3 w-3" />
                                            ) : (
                                              <ChevronRight className="h-3 w-3" />
                                            )}
                                          </Button>
                                        </CollapsibleTrigger>
                                      </div>
                                      <CollapsibleContent>
                                        <div className="space-y-2 pl-5">
                                          {panchayath.coordinators?.map((coordinator: any) => {
                                            const supervisorsUnderCoordinator = panchayath.supervisors?.filter(
                                              (supervisor: any) => supervisor.coordinator_id === coordinator.id
                                            ) || [];
                                            
                                            if (supervisorsUnderCoordinator.length === 0) return null;
                                            
                                            return (
                                              <div key={coordinator.id} className="space-y-1">
                                                <div className="flex items-center gap-2 text-xs font-medium text-coordinator">
                                                  <UserCheck className="h-3 w-3" />
                                                  <span>Under {showAgentNames.coordinator ? coordinator.name : 'Coordinator ***'}</span>
                                                  <Badge variant="outline" className="h-4 text-xs">
                                                    {supervisorsUnderCoordinator.length}
                                                  </Badge>
                                                </div>
                                                <div className="pl-5 space-y-1">
                                                  {supervisorsUnderCoordinator.map((supervisor: any) => (
                                                    <div key={supervisor.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                                                      <User className="h-3 w-3" />
                                                      <span>{showAgentNames.supervisor ? supervisor.name : '***'}</span>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            );
                                          })}
                                          {panchayath.supervisors?.length === 0 && (
                                            <p className="text-xs text-muted-foreground pl-5">No supervisors assigned</p>
                                          )}
                                        </div>
                                      </CollapsibleContent>
                                    </CardContent>
                                  </Card>
                                </Collapsible>

                                {/* Group Leaders Card */}
                                <Collapsible open={expandedRoleCards[`${panchayath.id}-group-leader`] ?? false}>
                                  <Card className="border border-group-leader/20 bg-group-leader/5">
                                    <CardContent className="p-3">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <div className="h-3 w-3 rounded-full bg-group-leader"></div>
                                          <span className="text-sm font-medium">Group Leaders</span>
                                          <Badge variant="secondary" className="h-5 text-xs">
                                            {panchayath.group_leader_count}
                                          </Badge>
                                        </div>
                                        <CollapsibleTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleRoleCardExpansion(`${panchayath.id}-group-leader`)}
                                            className="h-6 w-6 p-0"
                                          >
                                            {expandedRoleCards[`${panchayath.id}-group-leader`] ? (
                                              <ChevronDown className="h-3 w-3" />
                                            ) : (
                                              <ChevronRight className="h-3 w-3" />
                                            )}
                                          </Button>
                                        </CollapsibleTrigger>
                                      </div>
                                      <CollapsibleContent>
                                        <div className="space-y-2 pl-5">
                                          {panchayath.supervisors?.map((supervisor: any) => {
                                            const groupLeadersUnderSupervisor = panchayath.group_leaders?.filter(
                                              (groupLeader: any) => groupLeader.supervisor_id === supervisor.id
                                            ) || [];
                                            
                                            if (groupLeadersUnderSupervisor.length === 0) return null;
                                            
                                            return (
                                              <div key={supervisor.id} className="space-y-1">
                                                <div className="flex items-center gap-2 text-xs font-medium text-supervisor">
                                                  <UserCheck className="h-3 w-3" />
                                                  <span>Under {showAgentNames.supervisor ? supervisor.name : 'Supervisor ***'}</span>
                                                  <Badge variant="outline" className="h-4 text-xs">
                                                    {groupLeadersUnderSupervisor.length}
                                                  </Badge>
                                                </div>
                                                <div className="pl-5 space-y-1">
                                                  {groupLeadersUnderSupervisor.map((groupLeader: any) => (
                                                    <div key={groupLeader.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                                                      <User className="h-3 w-3" />
                                                      <span>{showAgentNames.group_leader ? groupLeader.name : '***'}</span>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            );
                                          })}
                                          {panchayath.group_leaders?.length === 0 && (
                                            <p className="text-xs text-muted-foreground pl-5">No group leaders assigned</p>
                                          )}
                                        </div>
                                      </CollapsibleContent>
                                    </CardContent>
                                  </Card>
                                </Collapsible>

                                {/* PROs Card */}
                                <Collapsible open={expandedRoleCards[`${panchayath.id}-pro`] ?? false}>
                                  <Card className="border border-pro/20 bg-pro/5">
                                    <CardContent className="p-3">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <div className="h-3 w-3 rounded-full bg-pro"></div>
                                          <span className="text-sm font-medium">PROs</span>
                                          <Badge variant="secondary" className="h-5 text-xs">
                                            {panchayath.pro_count}
                                          </Badge>
                                        </div>
                                        <CollapsibleTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleRoleCardExpansion(`${panchayath.id}-pro`)}
                                            className="h-6 w-6 p-0"
                                          >
                                            {expandedRoleCards[`${panchayath.id}-pro`] ? (
                                              <ChevronDown className="h-3 w-3" />
                                            ) : (
                                              <ChevronRight className="h-3 w-3" />
                                            )}
                                          </Button>
                                        </CollapsibleTrigger>
                                      </div>
                                      <CollapsibleContent>
                                        <div className="space-y-2 pl-5">
                                          {panchayath.group_leaders?.map((groupLeader: any) => {
                                            const prosUnderGroupLeader = panchayath.pros?.filter(
                                              (pro: any) => pro.group_leader_id === groupLeader.id
                                            ) || [];
                                            
                                            if (prosUnderGroupLeader.length === 0) return null;
                                            
                                            return (
                                              <div key={groupLeader.id} className="space-y-1">
                                                <div className="flex items-center gap-2 text-xs font-medium text-group-leader">
                                                  <UserCheck className="h-3 w-3" />
                                                  <span>Under {showAgentNames.group_leader ? groupLeader.name : 'Group Leader ***'}</span>
                                                  <Badge variant="outline" className="h-4 text-xs">
                                                    {prosUnderGroupLeader.length}
                                                  </Badge>
                                                </div>
                                                <div className="pl-5 space-y-1">
                                                  {prosUnderGroupLeader.map((pro: any) => (
                                                    <div key={pro.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                                                      <User className="h-3 w-3" />
                                                      <span>{showAgentNames.pro ? pro.name : '***'}</span>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            );
                                          })}
                                          {panchayath.pros?.length === 0 && (
                                            <p className="text-xs text-muted-foreground pl-5">No PROs assigned</p>
                                          )}
                                        </div>
                                      </CollapsibleContent>
                                    </CardContent>
                                  </Card>
                                </Collapsible>
                              </div>
                            </CollapsibleContent>
                          </CardContent>
                        </Card>
                      </Collapsible>
                    ))}
                  </div>

                  {filteredPanchayaths.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        {searchTerm ? `No panchayaths found matching "${searchTerm}"` : "No panchayaths found"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="chart">
              <PanchayathChart />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};