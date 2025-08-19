import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [activeTab, setActiveTab] = useState("login");
  const [selectedPanchayath, setSelectedPanchayath] = useState<any>(null);
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="manage">Manage Panchayath</TabsTrigger>
            <TabsTrigger value="view">View Data</TabsTrigger>
          </TabsList>

          <TabsContent value="manage" className="mt-6">
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
                    <h3 className="text-xl font-semibold mb-4">
                      Manage Hierarchy - {selectedPanchayath.name}
                    </h3>
                    
                    <Tabs defaultValue="coordinator" className="w-full">
                      <TabsList className="grid grid-cols-4 w-full">
                        <TabsTrigger value="coordinator">Coordinator</TabsTrigger>
                        <TabsTrigger value="supervisor">Supervisor</TabsTrigger>
                        <TabsTrigger value="group-leader">Group Leader</TabsTrigger>
                        <TabsTrigger value="pro">PRO</TabsTrigger>
                      </TabsList>

                      <TabsContent value="coordinator" className="mt-4">
                        <CoordinatorForm panchayath={selectedPanchayath} />
                      </TabsContent>

                      <TabsContent value="supervisor" className="mt-4">
                        <SupervisorForm panchayath={selectedPanchayath} />
                      </TabsContent>

                      <TabsContent value="group-leader" className="mt-4">
                        <GroupLeaderForm panchayath={selectedPanchayath} />
                      </TabsContent>

                      <TabsContent value="pro" className="mt-4">
                        <ProForm panchayath={selectedPanchayath} />
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="view" className="mt-6">
            <PanchayathView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;