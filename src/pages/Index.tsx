import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserProfile } from "@/components/UserProfile";
import { AutoLogin } from "@/components/AutoLogin";
import { TaskManagement } from "@/components/TaskManagement";
import { PanchayathView } from "@/components/PanchayathView";
import { PanchayathHierarchy } from "@/components/PanchayathHierarchy";
import { HistoryTab } from "@/components/HistoryTab";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [currentOfficer, setCurrentOfficer] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("manage");
  const { toast } = useToast();

  const handleLogin = (officer: any) => {
    setCurrentOfficer(officer);
    setActiveTab("manage");
    toast({
      title: "Welcome!",
      description: `Logged in as ${officer.name}`,
    });
  };

  if (!currentOfficer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <AutoLogin onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/95 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Panchayath Management System
            </h1>
            <p className="text-muted-foreground mt-2">Officer: {currentOfficer.name}</p>
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
              className="border-primary/20 hover:border-primary"
            >
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div 
            className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
              activeTab === "manage" ? "scale-105" : ""
            }`}
            onClick={() => setActiveTab("manage")}
          >
            <div className={`relative overflow-hidden rounded-lg border-2 transition-all duration-300 ${
              activeTab === "manage" 
                ? "border-coordinator shadow-xl bg-coordinator/10" 
                : "border-border hover:border-coordinator/50 hover:shadow-lg bg-card"
            }`}>
              <div className="absolute inset-0 bg-gradient-to-br from-coordinator/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-4 w-4 rounded-full bg-coordinator shadow-sm"></div>
                  <h3 className="text-xl font-semibold">Manage Panchayath</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Create new panchayaths and manage the complete hierarchy including coordinators, supervisors, group leaders, and PROs.
                </p>
              </div>
            </div>
          </div>

          <div 
            className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
              activeTab === "view" ? "scale-105" : ""
            }`}
            onClick={() => setActiveTab("view")}
          >
            <div className={`relative overflow-hidden rounded-lg border-2 transition-all duration-300 ${
              activeTab === "view" 
                ? "border-supervisor shadow-xl bg-supervisor/10" 
                : "border-border hover:border-supervisor/50 hover:shadow-lg bg-card"
            }`}>
              <div className="absolute inset-0 bg-gradient-to-br from-supervisor/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-4 w-4 rounded-full bg-supervisor shadow-sm"></div>
                  <h3 className="text-xl font-semibold">View & Analyze</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  View complete panchayath hierarchy with color-coded roles and detailed analytics.
                </p>
              </div>
            </div>
          </div>
        </div>

        {activeTab === "manage" && (
          <TaskManagement officerId={currentOfficer.id} />
        )}

        {activeTab === "view" && (
          <Tabs defaultValue="analytics" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="analytics">
              <PanchayathView />
            </TabsContent>
            
            <TabsContent value="hierarchy">
              <PanchayathHierarchy />
            </TabsContent>
            
            <TabsContent value="history">
              <HistoryTab />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Index;