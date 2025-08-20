import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Users, MapPin, Building, BarChart3, Edit, Trash2 } from "lucide-react";
import { PanchayathChart } from "@/components/PanchayathChart";
import { PanchayathForm } from "@/components/PanchayathForm";
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
}

export const PanchayathHierarchy = () => {
  const [panchayaths, setPanchayaths] = useState<PanchayathData[]>([]);
  const [filteredPanchayaths, setFilteredPanchayaths] = useState<PanchayathData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingPanchayath, setEditingPanchayath] = useState<any>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const { toast } = useToast();

  const fetchPanchayaths = async () => {
    try {
      const { data, error } = await supabase
        .from("panchayaths")
        .select(`
          id,
          name,
          number_of_wards,
          coordinators:coordinators(count),
          supervisors:supervisors(count),
          group_leaders:group_leaders(count),
          pros:pros(count)
        `);

      if (error) throw error;

      const panchayathsWithCounts = data?.map(p => ({
        id: p.id,
        name: p.name,
        number_of_wards: p.number_of_wards,
        coordinator_count: p.coordinators?.[0]?.count || 0,
        supervisor_count: p.supervisors?.[0]?.count || 0,
        group_leader_count: p.group_leaders?.[0]?.count || 0,
        pro_count: p.pros?.[0]?.count || 0,
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
    setFilteredPanchayaths(filtered);
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
              <Card key={panchayath.id} className="border border-border hover:border-primary/40 transition-colors">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-primary">{panchayath.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
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

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-coordinator/10 border border-coordinator/20">
                      <div className="h-3 w-3 rounded-full bg-coordinator"></div>
                      <div>
                        <p className="text-xs text-muted-foreground">Coordinators</p>
                        <p className="font-semibold">{panchayath.coordinator_count}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-lg bg-supervisor/10 border border-supervisor/20">
                      <div className="h-3 w-3 rounded-full bg-supervisor"></div>
                      <div>
                        <p className="text-xs text-muted-foreground">Supervisors</p>
                        <p className="font-semibold">{panchayath.supervisor_count}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-lg bg-group-leader/10 border border-group-leader/20">
                      <div className="h-3 w-3 rounded-full bg-group-leader"></div>
                      <div>
                        <p className="text-xs text-muted-foreground">Group Leaders</p>
                        <p className="font-semibold">{panchayath.group_leader_count}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-lg bg-pro/10 border border-pro/20">
                      <div className="h-3 w-3 rounded-full bg-pro"></div>
                      <div>
                        <p className="text-xs text-muted-foreground">PROs</p>
                        <p className="font-semibold">{panchayath.pro_count}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
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