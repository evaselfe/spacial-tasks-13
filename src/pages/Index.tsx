import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserProfile } from "@/components/UserProfile";
import { AutoLogin } from "@/components/AutoLogin";
import { PanchayathForm } from "@/components/PanchayathForm";
import { PanchayathView } from "@/components/PanchayathView";
import { CoordinatorForm } from "@/components/CoordinatorForm";
import { SupervisorForm } from "@/components/SupervisorForm";
import { GroupLeaderForm } from "@/components/GroupLeaderForm";
import { ProForm } from "@/components/ProForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [currentOfficer, setCurrentOfficer] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("manage");
  const [selectedPanchayath, setSelectedPanchayath] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState("coordinator");
  const { toast } = useToast();

  const handleLogin = (officer: any) => {
    setCurrentOfficer(officer);
    setActiveTab("manage");
    toast({
      title: "Welcome!",
      description: `Logged in as ${officer.name}`,
    });
  };

  const handlePanchayathSelect = (panchayath: any) => {
    setSelectedPanchayath(panchayath);
  };

  if (!currentOfficer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <AutoLogin onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Special Task Management</h1>
              <p className="text-muted-foreground">Officer: {currentOfficer.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <UserProfile 
                currentOfficer={currentOfficer} 
                onOfficerUpdate={setCurrentOfficer}
              />
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentOfficer(null);
                  setActiveTab("login");
                }}
              >
                Logout
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                activeTab === "manage" ? "ring-2 ring-primary shadow-md" : ""
              }`}
              onClick={() => setActiveTab("manage")}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-coordinator"></div>
                  Manage Panchayath
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Add panchayath data and manage hierarchy including coordinators, supervisors, group leaders, and PROs.
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                activeTab === "view" ? "ring-2 ring-primary shadow-md" : ""
              }`}
              onClick={() => setActiveTab("view")}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-supervisor"></div>
                  View Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  View and manage panchayath hierarchy with color-coded roles and detailed information.
                </p>
              </CardContent>
            </Card>
          </div>

          {activeTab === "manage" && (
            <Card>
              <CardHeader>
                <CardTitle>Add Panchayath Data</CardTitle>
              </CardHeader>
              <CardContent>
                <PanchayathForm 
                  officerId={currentOfficer.id}
                  onPanchayathCreated={handlePanchayathSelect}
                />
                
                {selectedPanchayath && (
                  <div className="mt-8">
                    <h3 className="text-xl font-semibold mb-6">
                      Manage Hierarchy - {selectedPanchayath.name}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                      {[
                        { key: "coordinator", label: "Coordinator", color: "coordinator" },
                        { key: "supervisor", label: "Supervisor", color: "supervisor" },
                        { key: "group-leader", label: "Group Leader", color: "group-leader" },
                        { key: "pro", label: "PRO", color: "pro" }
                      ].map(({ key, label, color }) => (
                        <Card 
                          key={key}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedRole === key ? "ring-2 ring-primary shadow-md" : ""
                          }`}
                          onClick={() => setSelectedRole(key)}
                        >
                          <CardHeader className="pb-2">
                            <CardTitle className={`text-sm flex items-center gap-2`}>
                              <div className={`h-3 w-3 rounded-full bg-${color}`}></div>
                              {label}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-xs text-muted-foreground">
                              Manage {label.toLowerCase()} details
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <div className="mt-4">
                      {selectedRole === "coordinator" && <CoordinatorForm />}
                      {selectedRole === "supervisor" && <SupervisorForm />}
                      {selectedRole === "group-leader" && <GroupLeaderForm />}
                      {selectedRole === "pro" && <ProForm />}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "view" && (
            <PanchayathView />
          )}
        </div>
    </div>
  );
};

export default Index;