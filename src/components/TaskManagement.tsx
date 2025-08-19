import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PanchayathForm } from "@/components/PanchayathForm";
import { PanchayathSelector } from "@/components/PanchayathSelector";
import { CoordinatorForm } from "@/components/CoordinatorForm";
import { SupervisorForm } from "@/components/SupervisorForm";
import { GroupLeaderForm } from "@/components/GroupLeaderForm";
import { ProForm } from "@/components/ProForm";

interface TaskManagementProps {
  officerId: string;
}

export const TaskManagement = ({ officerId }: TaskManagementProps) => {
  const [selectedPanchayath, setSelectedPanchayath] = useState<any>(null);
  const [editingPanchayath, setEditingPanchayath] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState("coordinator");
  const [activeTab, setActiveTab] = useState("create");
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePanchayathSelect = (panchayath: any) => {
    setSelectedPanchayath(panchayath);
  };

  const handlePanchayathCreatedOrUpdated = () => {
    setEditingPanchayath(null);
    setRefreshKey(prev => prev + 1); // Force refresh of PanchayathSelector
  };

  const handlePanchayathDeleted = (deletedId: string) => {
    if (selectedPanchayath?.id === deletedId) {
      setSelectedPanchayath(null);
    }
    setEditingPanchayath(null);
    setRefreshKey(prev => prev + 1); // Force refresh of PanchayathSelector
  };

  const roleCards = [
    { key: "coordinator", label: "Coordinator", color: "bg-coordinator", description: "Manage ward coordinators with ratings" },
    { key: "supervisor", label: "Supervisor", color: "bg-supervisor", description: "Assign supervisors to multiple wards" },
    { key: "group-leader", label: "Group Leader", color: "bg-group-leader", description: "One group leader per ward" },
    { key: "pro", label: "PRO", color: "bg-pro", description: "Public Relations Officers under group leaders" }
  ];

  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
          <CardTitle className="text-2xl text-primary">Special Task Management</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="create" className="text-sm font-medium">
                Create New Panchayath
              </TabsTrigger>
              <TabsTrigger value="select" className="text-sm font-medium">
                Select Panchayath
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="create" className="space-y-6">
              <Card className="border border-coordinator/20 bg-coordinator/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-coordinator"></div>
                    Create New Panchayath
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PanchayathForm 
                    officerId={officerId} 
                    onPanchayathCreated={handlePanchayathCreatedOrUpdated}
                    editingPanchayath={editingPanchayath}
                    onEditComplete={() => setEditingPanchayath(null)}
                    onPanchayathDeleted={handlePanchayathDeleted}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="select" className="space-y-6">
              <Card className="border border-supervisor/20 bg-supervisor/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-supervisor"></div>
                    Select from Created Panchayaths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PanchayathSelector 
                    key={refreshKey}
                    onPanchayathSelect={handlePanchayathSelect}
                    onPanchayathEdit={(panchayath) => {
                      setEditingPanchayath(panchayath);
                      setActiveTab("create");
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {selectedPanchayath && (
            <div className="mt-8 space-y-6">
              <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
                <CardHeader>
                  <CardTitle className="text-xl">
                    Manage Hierarchy - {selectedPanchayath.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                    {roleCards.map(({ key, label, color, description }) => (
                      <Card 
                        key={key}
                        className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 border-2 ${
                          selectedRole === key 
                            ? `border-primary shadow-lg ${color}/20` 
                            : "border-border hover:border-primary/40"
                        }`}
                        onClick={() => setSelectedRole(key)}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <div className={`h-4 w-4 rounded-full ${color} shadow-sm`}></div>
                            {label}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs text-muted-foreground">
                            {description}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Card className="border border-primary/20">
                    <CardContent className="p-6">
                      {selectedRole === "coordinator" && <CoordinatorForm />}
                      {selectedRole === "supervisor" && <SupervisorForm />}
                      {selectedRole === "group-leader" && <GroupLeaderForm />}
                      {selectedRole === "pro" && <ProForm />}
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};