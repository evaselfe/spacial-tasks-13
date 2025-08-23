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
  const {
    toast
  } = useToast();
  const handleLogin = (officer: any) => {
    setCurrentOfficer(officer);
    setActiveTab("manage");
    toast({
      title: "Welcome!",
      description: `Logged in as ${officer.name}`
    });
  };
  if (!currentOfficer) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <AutoLogin onLogin={handleLogin} />
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-background to-background/95 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Panchayath Management System
            </h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">Officer: {currentOfficer.name}</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <UserProfile currentOfficer={currentOfficer} onOfficerUpdate={setCurrentOfficer} />
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/admin'}
              className="w-full sm:w-auto border-primary/20 hover:border-primary"
            >
              Admin Panel
            </Button>
            <Button variant="outline" onClick={() => {
            setCurrentOfficer(null);
            setActiveTab("login");
          }} className="w-full sm:w-auto border-primary/20 hover:border-primary bg-red-600 hover:bg-red-500 text-slate-50">
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] ${activeTab === "manage" ? "scale-[1.02]" : ""}`} onClick={() => setActiveTab("manage")}>
            <div className={`relative overflow-hidden rounded-lg border-2 transition-all duration-300 ${activeTab === "manage" ? "border-coordinator shadow-xl bg-coordinator/10" : "border-border hover:border-coordinator/50 hover:shadow-lg bg-card"}`}>
              <div className="absolute inset-0 bg-gradient-to-br from-coordinator/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-4 sm:p-6 bg-teal-200">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-coordinator shadow-sm"></div>
                  <h3 className="text-lg sm:text-xl font-semibold">Manage Panchayath</h3>
                </div>
                <p className="text-xs sm:text-sm text-gray-950 leading-relaxed">പഞ്ചായത്തുകളെയോ ഏജന്റുമാരെയോ ചേർക്കാൻ ഇവിടെ ക്ലിക്കുചെയ്യുക</p>
              </div>
            </div>
          </div>

          <div className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] ${activeTab === "view" ? "scale-[1.02]" : ""}`} onClick={() => setActiveTab("view")}>
            <div className={`relative overflow-hidden rounded-lg border-2 transition-all duration-300 ${activeTab === "view" ? "border-supervisor shadow-xl bg-supervisor/10" : "border-border hover:border-supervisor/50 hover:shadow-lg bg-card"}`}>
              <div className="absolute inset-0 bg-gradient-to-br from-supervisor/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-4 sm:p-6 bg-fuchsia-200">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-supervisor shadow-sm"></div>
                  <h3 className="text-lg sm:text-xl font-semibold">View & Analyze</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-950 leading-relaxed">പഞ്ചായത്തുകളുടെയും ആകെ ഏജന്റുമാരുടെയും പട്ടിക കാണാൻ ഇവിടെ ക്ലിക്ക് ചെയ്യുക.</p>
              </div>
            </div>
          </div>
        </div>

        {activeTab === "manage" && <TaskManagement officerId={currentOfficer.id} />}

        {activeTab === "view" && <Tabs defaultValue="analytics" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 h-auto">
              <TabsTrigger value="analytics" className="text-xs sm:text-sm py-2 sm:py-2.5">Analytics</TabsTrigger>
              <TabsTrigger value="hierarchy" className="text-xs sm:text-sm py-2 sm:py-2.5">Hierarchy</TabsTrigger>
              <TabsTrigger value="history" className="text-xs sm:text-sm py-2 sm:py-2.5">History</TabsTrigger>
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
          </Tabs>}
      </div>
    </div>;
};
export default Index;